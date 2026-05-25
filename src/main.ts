/**
 * Make It Rain: Pull your raindrop.io bookmarks with flexible filtering, customization, and location options.
 * ========================================================================================================
 * 
 * This plugin allows users to fetch bookmarks from raindrop.io and create Markdown notes from them.
 * The code follows a modular architecture with utility functions separated into dedicated modules
 * to promote code reuse and maintainability.
 */

import { App, Notice, Plugin, PluginManifest, TFile, TFolder, TAbstractFile, normalizePath, requestUrl } from 'obsidian';
import { 
    MakeItRainSettings, 
    RaindropType, 
    ModalFetchOptions, 
    RaindropItem, 
    RaindropResponse, 
    RaindropCollection, 
    RaindropGroup,
    CollectionResponse, 
    IRaindropToObsidian,
    TagMatchTypes,
    TemplateData
} from './types';

// Import utility functions from consolidated index
import { DEFAULT_SETTINGS, RaindropToObsidianSettingTab } from './settings';
import { RaindropFetchModal, QuickImportModal, HighlightsAggregateModal } from './modals';
import { 
    AggregateHighlightsOptions
} from './types';
import { 
    // File utilities
    sanitizeFileName,
    sanitizeMarkdownContent,
    createFolderStructure,
    
    // API utilities
    RateLimiter,
    createRateLimiter,
    fetchWithRetry,
    getFullPathSegments,
    
    // YAML utilities
    formatYamlValue,
    escapeYamlString,
    
    // Format utilities
    formatDate,
    formatTags,
    getDomain,
    raindropType,
    toUppercase,
    toLowercase,
    toTitleCase,
    truncateString,
    
    // Scraping utilities
    fetchArchiveContent,
    extractContentFromHtml
} from './utils';

// System collection IDs from raindrop.io API docs
const SystemCollections = {
    UNSORTED: -1,
    TRASH: -99
} as const;

/**
 * Regex constants for tag sanitization
 */
const TAG_SPACE_REGEX = / /g;
const TAG_INVALID_CHARS_REGEX = /[#?"*<>:|]/g;
/**
 * Regex for file name template placeholders
 */
const FILENAME_PLACEHOLDER_REGEX = /{{(title|id|collectionTitle|date)}}/gi;

export default class RaindropToObsidian extends Plugin implements IRaindropToObsidian {
    settings: MakeItRainSettings;
    private rateLimiter: RateLimiter;
    private ribbonIconEl: HTMLElement | undefined;
    private collectionCache: RaindropCollection[] | null = null;
    private groupCache: RaindropGroup[] | null = null;
    private lastCollectionFetch: number = 0;
    private lastGroupFetch: number = 0;
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

    constructor(app: App, manifest: PluginManifest) {
        super(app, manifest);
        this.settings = { ...DEFAULT_SETTINGS };
        this.rateLimiter = createRateLimiter();
    }

    async onload() {
        await this.loadSettings();

        this.addCommand({
            id: 'fetch-raindrops',
            name: 'Fetch raindrops (filtered)',
            callback: () => {
                new RaindropFetchModal(this.app, this).open();
            }
        });

        this.addCommand({
            id: 'quick-import-raindrop',
            name: 'Quick import raindrop by URL or ID',
            callback: () => {
                new QuickImportModal(this.app, this).open();
            }
        });

        this.addCommand({
            id: 'aggregate-highlights-by-tag',
            name: 'Aggregate highlights by tag',
            callback: () => {
                new HighlightsAggregateModal(this.app, this).open();
            }
        });

        this.updateRibbonIcon();

        this.addSettingTab(new RaindropToObsidianSettingTab(this.app, this));
        console.debug('Make It Rain plugin loaded!');
    }

    onunload() {
        this.ribbonIconEl?.remove();
        console.debug('Make It Rain plugin unloaded.');
    }

    async loadSettings(): Promise<void> {
        const savedData = await this.loadData();
        this.settings = { ...DEFAULT_SETTINGS };
        
        if (savedData) {
            this.settings = {
                ...this.settings,
                ...savedData,
                contentTypeTemplates: {
                    ...this.settings.contentTypeTemplates,
                    ...Object.keys(savedData.contentTypeTemplates || {}).reduce((acc, key) => {
                        const value = (savedData.contentTypeTemplates as Record<string, string>)[key];
                        acc[key] = value.trim() === '' ? this.settings.contentTypeTemplates[key as RaindropType] : value;
                        return acc;
                    }, {} as Record<string, string>)
                },
                contentTypeTemplateToggles: {
                    ...this.settings.contentTypeTemplateToggles,
                    ...(savedData.contentTypeTemplateToggles || {})
                }
            };
        }
        await this.saveSettings();
    }

    private getTemplateForType(type: RaindropType, options: ModalFetchOptions): string {
        if (options.useDefaultTemplate) {
            return this.settings.defaultTemplate;
        }

        const shouldUseTypeTemplate = options.overrideTemplates || 
            (this.settings.contentTypeTemplateToggles[type] && 
             this.settings.contentTypeTemplates[type]?.trim() !== '');

        return shouldUseTypeTemplate ? this.settings.contentTypeTemplates[type] : this.settings.defaultTemplate;
    }

    generateFileName(raindrop: RaindropItem, useRaindropTitleForFileName: boolean): string {
        const fileNameTemplate = useRaindropTitleForFileName ? this.settings.fileNameTemplate : '{{id}}';

        try {
            const createdDate = raindrop.created ? new Date(raindrop.created) : null;
            let formattedDate = 'no_date';
            if (createdDate && !isNaN(createdDate.getTime())) {
                formattedDate = createdDate.toISOString().split('T')[0];
            }

            const replacements: Record<string, string> = {
                title: sanitizeFileName(raindrop.title || 'Untitled'),
                id: sanitizeFileName((raindrop._id || 'unknown_id').toString()),
                collectiontitle: sanitizeFileName(raindrop.collection?.title || 'no collection'),
                date: sanitizeFileName(formattedDate)
            };

            const fileName = fileNameTemplate.replace(FILENAME_PLACEHOLDER_REGEX, (match, placeholder) => {
                const key = placeholder.toLowerCase();
                return replacements[key] !== undefined ? replacements[key] : match;
            });

            const finalFileName = sanitizeFileName(fileName);
            if (!finalFileName.trim()) {
                return "Unnamed_Raindrop_" + (raindrop._id || Date.now());
            }
            return finalFileName;
        } catch (error) {
            let errorMsg = 'template processing error';
            if (error instanceof Error) errorMsg = error.message;
            console.error("Error processing file name template:", errorMsg, error);
            new Notice("Error generating file name. Check console or template.");
            return "Error_Filename_" + Date.now();
        }
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
    
    sanitizeFileName(name: string): string {
        return sanitizeFileName(name);
    }
    
    updateRibbonIcon(): void {
        this.ribbonIconEl?.remove();
        this.ribbonIconEl = undefined;

        if (this.settings.showRibbonIcon) {
            this.ribbonIconEl = this.addRibbonIcon(
                'cloud-download',
                'Fetch raindrops',
                () => {
                    new RaindropFetchModal(this.app, this).open();
                }
            );
        }
    }

    async fetchRaindrops(options: ModalFetchOptions) {
        const baseApiUrl = 'https://api.raindrop.io/rest/v1';
        const fetchOptions: RequestInit = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.settings.apiToken}`
            }
        };

        const loadingNotice = new Notice('Starting raindrop fetch...', 0);

        try {
            let allData: RaindropItem[] = [];
            const perPage = 50;

            if (!this.settings.apiToken) {
                loadingNotice.hide();
                new Notice('Please configure your raindrop.io API token in the plugin settings.', 10000);
                return;
            }

            let resolvedCollectionIds: number[] = [];
            const collectionNameToIdMap = new Map<string, number>();
            const collectionIdToNameMap = new Map<number, string>();
            const collectionHierarchy = new Map<number, { title: string, parentId?: number }>();
            const collectionToGroupMap = new Map<number, string>();

            loadingNotice.setMessage('Fetching collections hierarchy and groups...');
            const [allCollections, allGroups] = await Promise.all([
                this.fetchAllUserCollections(),
                this.fetchUserGroups()
            ]);

            if (allCollections.length === 0) {
                loadingNotice.hide();
                return;
            }

            allCollections.forEach(col => {
                collectionNameToIdMap.set(col.title.toLowerCase(), col._id);
                collectionIdToNameMap.set(col._id, col.title);
                collectionHierarchy.set(col._id, { title: col.title, parentId: col.parent?.$id });
            });

            // Map root collections to their groups
            allGroups.forEach(group => {
                group.collections.forEach(colId => {
                    collectionToGroupMap.set(colId, group.title);
                });
            });

            // Add full paths to collection name map for resolution
            allCollections.forEach(col => {
                const pathSegments = getFullPathSegments(col._id, collectionHierarchy, collectionIdToNameMap);
                if (pathSegments.length > 1) {
                    const fullPath = pathSegments.join(' > ');
                    collectionNameToIdMap.set(fullPath.toLowerCase(), col._id);
                }
            });

            if (options.collections) {
                const collectionInputs = options.collections.split(',').map((input: string) => input.trim()).filter((input: string) => input !== '');
                const unresolvedInputs: string[] = [];

                for (const input of collectionInputs) {
                    const inputAsNumber = parseInt(input, 10);
                    if (!isNaN(inputAsNumber)) {
                        if (collectionIdToNameMap.has(inputAsNumber)) {
                            resolvedCollectionIds.push(inputAsNumber);
                        } else {
                            unresolvedInputs.push(input);
                            console.warn(`Could not find collection with id: ${input}`);
                        }
                    } else {
                        const resolvedId = collectionNameToIdMap.get(input.toLowerCase());
                        if (resolvedId !== undefined) {
                            resolvedCollectionIds.push(resolvedId);
                        } else {
                            unresolvedInputs.push(input);
                            console.warn(`Could not resolve collection name: ${input}`);
                        }
                    }
                }

                if (unresolvedInputs.length > 0) {
                    new Notice(`Could not find collections: ${unresolvedInputs.join(', ')}. Please check names or use ids.`, 15000);
                }

                if (resolvedCollectionIds.length === 0 && collectionInputs.length > 0) {
                    loadingNotice.hide();
                    new Notice('No valid collection ids or names provided.', 5000);
                    return;
                }
                resolvedCollectionIds = Array.from(new Set(resolvedCollectionIds));
            }

            const searchParameterString = options.apiFilterTags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag !== '').join(' ');

            let fetchMode: 'collections' | 'tags' | 'all' = 'all';
            if (resolvedCollectionIds.length > 0) {
                fetchMode = 'collections';
            } else if (searchParameterString || (options.tagMatchType === TagMatchTypes.ANY && options.apiFilterTags.length > 0)) {
                fetchMode = 'tags';
            }

            if (fetchMode === 'collections') {
                const collectionPromises = resolvedCollectionIds.map(async (collectionId) => {
                    let hasMore = true;
                    let page = 0;
                    let collectionData: RaindropItem[] = [];
                    const collectionApiBaseUrl = `${baseApiUrl}/raindrops/${collectionId}`;

                    while (hasMore) {
                        const params = new URLSearchParams({ perpage: perPage.toString(), page: page.toString() });
                        if (options.filterType && options.filterType !== 'all') params.append('type', options.filterType);
                        if (searchParameterString) params.append('search', searchParameterString);
                        if (options.includeSubcollections) params.append('nested', 'true');

                        const currentApiUrl = `${collectionApiBaseUrl}?${params.toString()}`;
                        const collectionNameForNotice = collectionIdToNameMap.get(collectionId) || collectionId.toString();
                        loadingNotice.setMessage(`Fetching from collection: ${collectionNameForNotice}, page ${page + 1}...`);

                        const response = await fetchWithRetry<RaindropResponse>(this.app, currentApiUrl, fetchOptions, this.rateLimiter);
                        const data = response;

                        if (!data.result) {
                            new Notice(`Error fetching collection: ${collectionNameForNotice}. Skipping.`, 7000);
                            break;
                        }

                        if (data?.items) {
                            collectionData = collectionData.concat(data.items);
                            page++;
                            hasMore = data.items.length === perPage;
                        } else {
                            hasMore = false;
                        }
                    }
                    return collectionData;
                });
                const results = await Promise.all(collectionPromises);
                allData = results.flat();
            } else if (fetchMode === 'tags') {
                if (options.tagMatchType === TagMatchTypes.ANY && options.apiFilterTags.length > 0) {
                    const uniqueItems = new Map<number, RaindropItem>();
                    const tagsArray = options.apiFilterTags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag !== '');

                    const tagPromises = tagsArray.map(async (tag) => {
                        let hasMore = true;
                        let page = 0;
                        let tagData: RaindropItem[] = [];

                        while (hasMore) {
                            const params = new URLSearchParams({ perpage: perPage.toString(), page: page.toString(), search: `#${tag}` });
                            if (options.filterType && options.filterType !== 'all') params.append('type', options.filterType);

                            const currentApiUrl = `${baseApiUrl}/raindrops/0?${params.toString()}`;
                            loadingNotice.setMessage(`Fetching items with tag: ${tag}, page ${page + 1}...`);

                            const response = await fetchWithRetry<RaindropResponse>(this.app, currentApiUrl, fetchOptions, this.rateLimiter);
                            const data = response;

                            if (!data.result) break;
                            if (data?.items) {
                                tagData = tagData.concat(data.items);
                                page++;
                                hasMore = data.items.length === perPage;
                            } else {
                                hasMore = false;
                            }
                        }
                        return tagData;
                    });
                    const results = await Promise.all(tagPromises);
                    results.flat().forEach((item: RaindropItem) => { if (!uniqueItems.has(item._id)) uniqueItems.set(item._id, item); });
                    allData = Array.from(uniqueItems.values());
                } else if (searchParameterString) {
                    let hasMore = true;
                    let page = 0;
                    while (hasMore) {
                        const params = new URLSearchParams({ perpage: perPage.toString(), page: page.toString(), search: searchParameterString });
                        if (options.filterType && options.filterType !== 'all') params.append('type', options.filterType);

                        const currentApiUrl = `${baseApiUrl}/raindrops/0?${params.toString()}`;
                        loadingNotice.setMessage(`Fetching items with tags: ${searchParameterString}, page ${page + 1}...`);

                        const response = await fetchWithRetry<RaindropResponse>(this.app, currentApiUrl, fetchOptions, this.rateLimiter);
                        const data = response;

                        if (!data.result) throw new Error(`API Error: ${JSON.stringify(data)}`);
                        if (data?.items) {
                            allData = allData.concat(data.items);
                            page++;
                            hasMore = data.items.length === perPage;
                        } else {
                            hasMore = false;
                        }
                    }
                }
            } else {
                let hasMore = true;
                let page = 0;
                while (hasMore) {
                    const params = new URLSearchParams({ perpage: perPage.toString(), page: page.toString() });
                    if (options.filterType && options.filterType !== 'all') params.append('type', options.filterType);

                    const currentApiUrl = `${baseApiUrl}/raindrops/0?${params.toString()}`;
                    loadingNotice.setMessage(`Fetching all items, page ${page + 1}...`);

                    const response = await fetchWithRetry<RaindropResponse>(this.app, currentApiUrl, fetchOptions, this.rateLimiter);
                    const data = response;

                    if (!data.result) throw new Error(`API Error: ${JSON.stringify(data)}`);
                    if (data?.items) {
                        allData = allData.concat(data.items);
                        page++;
                        hasMore = data.items.length === perPage;
                    } else {
                        hasMore = false;
                    }
                }
            }

            if (allData.length === 0) {
                loadingNotice.hide();
                new Notice('No raindrops found matching your criteria.', 5000);
            } else {
                let filteredData = allData;
                if (options.filterType && options.filterType !== 'all') {
                    filteredData = allData.filter(item => item.type === options.filterType);
                    if (filteredData.length === 0) {
                        new Notice(`No raindrops found matching type '${options.filterType}'.`, 5000);
                        loadingNotice.hide();
                        return;
                    }
                }
                const collectionsData: CollectionResponse = { result: true, items: allCollections };
                await this.processRaindrops(filteredData, options.vaultPath, options.appendTagsToNotes, options.useRaindropTitleForFileName, loadingNotice, options, collectionsData, collectionIdToNameMap, new Set<string>(), collectionToGroupMap);
            }
        } catch (error) {
            loadingNotice.hide();
            const errorMessage = error instanceof Error ? error.message : (typeof error === 'object' && error !== null ? JSON.stringify(error) : String(error));
            new Notice(`Error fetching raindrops: ${errorMessage}`, 10000);
            console.error('Error fetching raindrop API:', error);
        }
    }

    async processRaindrops(
        raindrops: RaindropItem[],
        vaultPath: string | undefined,
        appendTagsToNotes: string,
        useRaindropTitleForFileName: boolean,
        loadingNotice: Notice,
        options: ModalFetchOptions,
        collectionsData?: CollectionResponse,
        collectionIdToNameMap: Map<number, string> = new Map<number, string>(),
        verifiedFolderPaths: Set<string> = new Set<string>(),
        collectionToGroupMap: Map<number, string> = new Map<number, string>()
    ): Promise<void> {
        const { app } = this;
        const settingsFMTags = appendTagsToNotes.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag !== '');
        const baseTargetFolderPath = (vaultPath || this.settings.defaultFolder || "").trim() ? normalizePath((vaultPath || this.settings.defaultFolder || "").trim()) : normalizePath("");

        const collectionHierarchy = new Map<number, { title: string, parentId?: number }>();
        if (collectionsData?.result) {
            collectionsData.items.forEach(col => {
                collectionHierarchy.set(col._id, { title: col.title, parentId: col.parent?.$id });
            });
        }

        let createdCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        let processed = 0;
        const total = raindrops.length;
        const pendingFolderCreations = new Map<string, Promise<boolean>>();

        const worker = async () => {
            while (processed < total) {
                const raindrop = raindrops[processed++];
                if (!raindrop) break;
                try {
                    const result = await this.processRaindrop(raindrop, baseTargetFolderPath, settingsFMTags, options, loadingNotice, processed, total, collectionHierarchy, collectionIdToNameMap, verifiedFolderPaths, pendingFolderCreations, collectionToGroupMap);
                    if (result.success) {
                        if (result.type === 'created') createdCount++;
                        else if (result.type === 'updated') updatedCount++;
                        else if (result.type === 'skipped') skippedCount++;
                    } else {
                        errorCount++;
                    }
                } catch (error) {
                    errorCount++;
                    console.error('Error processing raindrop:', error);
                }
            }
        };

        const workers = Array.from({ length: Math.min(10, total) }, () => worker());
        await Promise.all(workers);

        if (this.settings.createFolderNotes) {
            loadingNotice.setMessage('Generating collection folder notes...');
            await Promise.all(Array.from(verifiedFolderPaths).map(async (folderPath) => {
                try {
                    const folderName = folderPath.split('/').pop();
                    if (!folderName) return;
                    const folderNotePath = normalizePath(`${folderPath}/${folderName}.md`);
                    const abstractFile = app.vault.getAbstractFileByPath(folderPath);
                    if (abstractFile instanceof TFolder) {
                        let content = `---\ntitle: "${folderName.replace(/"/g, '\\"')}"\ntype: collection\n---\n\n# ${folderName}\n\n## Collection Contents\n\n`;
                        const listItems = abstractFile.children
                            .filter((child: TAbstractFile) => child.name !== `${folderName}.md`)
                            .sort((a: TAbstractFile, b: TAbstractFile) => a.name.localeCompare(b.name))
                            .map((child: TAbstractFile) => `- [[${child.name.replace('.md', '')}]]\n`);
                        content += listItems.join('');
                        if (await app.vault.adapter.exists(folderNotePath)) await app.vault.adapter.write(folderNotePath, content);
                        else await app.vault.create(folderNotePath, content);
                    }
                } catch (e) { console.error(`Error generating folder note for ${folderPath}:`, e); }
            }));
        }

        loadingNotice.hide();
        let summary = `${createdCount} notes created.`;
        if (updatedCount > 0) summary += ` ${updatedCount} updated.`;
        if (skippedCount > 0) summary += ` ${skippedCount} skipped (already exist).`;
        if (errorCount > 0) summary += ` ${errorCount} errors.`;
        new Notice(summary, 7000);
    }

    private async processRaindrop(
        raindrop: RaindropItem,
        baseTargetFolderPath: string,
        settingsFMTags: string[],
        options: ModalFetchOptions,
        loadingNotice: Notice,
        processed: number,
        total: number,
        collectionHierarchy: Map<number, { title: string, parentId?: number }>,
        collectionIdToNameMap: Map<number, string>,
        verifiedFolderPaths: Set<string>,
        pendingFolderCreations: Map<string, Promise<boolean>>,
        collectionToGroupMap: Map<number, string> = new Map<number, string>()
    ): Promise<{ success: boolean; type: 'created' | 'updated' | 'skipped' }> {
        try {
            const { app } = this;
            const generatedFilename = this.generateFileName(raindrop, options.useRaindropTitleForFileName);
            
            let pathSegments: string[] = [];
            let groupTitle: string | undefined;

            if (raindrop.collection?.$id) {
                pathSegments = getFullPathSegments(raindrop.collection.$id, collectionHierarchy, collectionIdToNameMap);
                
                // Find root collection to get group
                let rootCollectionId: number | undefined = raindrop.collection.$id;
                if (rootCollectionId !== 0 && rootCollectionId !== -1) {
                    let parent = collectionHierarchy.get(rootCollectionId);
                    while (parent && parent.parentId !== undefined && parent.parentId !== 0 && parent.parentId !== -1) {
                        rootCollectionId = parent.parentId;
                        parent = collectionHierarchy.get(rootCollectionId);
                    }
                    groupTitle = collectionToGroupMap.get(rootCollectionId);
                }
            }

            if (groupTitle) {
                pathSegments.unshift(sanitizeFileName(groupTitle));
            }

            const targetPath = pathSegments.length > 0 
                ? normalizePath(`${baseTargetFolderPath}/${pathSegments.join('/')}`) 
                : baseTargetFolderPath;

            if (targetPath && !verifiedFolderPaths.has(targetPath)) {
                if (pendingFolderCreations.has(targetPath)) {
                    await pendingFolderCreations.get(targetPath);
                } else {
                    const createPromise = (async () => {
                        try {
                            if (!(await app.vault.adapter.exists(targetPath))) await createFolderStructure(app, targetPath);
                            return true;
                        } catch { return true; }
                    })();
                    pendingFolderCreations.set(targetPath, createPromise);
                    await createPromise;
                }
                verifiedFolderPaths.add(targetPath);
            }
            
            const filePath = normalizePath(`${targetPath}/${generatedFilename}.md`);
            const fileExists = await app.vault.adapter.exists(filePath);
            if (fileExists && (!options.updateExisting || (options.fetchOnlyNew && !options.updateExisting))) return { success: true, type: 'skipped' };

            loadingNotice.setMessage(`Processing '${raindrop.title || 'Untitled'}'... (${processed}/${total})`);
            const processOutcome = fileExists ? 'updated' : 'created';

            const templateData: TemplateData = {
                _id: raindrop._id,
                title: escapeYamlString(raindrop.title),
                excerpt: escapeYamlString(raindrop.excerpt || ''),
                note: escapeYamlString(raindrop.note || ''),
                link: raindrop.link,
                cover: raindrop.cover || '',
                created: raindrop.created,
                lastupdate: raindrop.lastUpdate,
                type: raindrop.type,
                collectionId: raindrop.collection?.$id || 0,
                collectionTitle: escapeYamlString(collectionIdToNameMap.get(raindrop.collection?.$id || 0) || 'Unknown'),
                collectionPath: escapeYamlString(pathSegments.join('/')),
                collectionGroup: groupTitle || '',
                tags: [...(raindrop.tags || []), ...settingsFMTags].map(tag => escapeYamlString(tag)),
                highlights: (raindrop.highlights || []).map(h => ({
                    text: escapeYamlString(h.text),
                    note: escapeYamlString(h.note || ''),
                    created: h.created || ''
                })),
                bannerFieldName: this.settings.bannerFieldName,
                url: raindrop.link || '',
            };
            if (collectionHierarchy.get(raindrop.collection?.$id || 0)?.parentId !== undefined) {
                templateData.collectionParentId = collectionHierarchy.get(raindrop.collection?.$id || 0)?.parentId;
            }

            if (this.settings.archiveScraping && raindrop.cache?.status === 'ready') {
                loadingNotice.setMessage(`Scraping archive for '${raindrop.title || 'Untitled'}'... (${processed}/${total})`);
                const archiveHtml = await fetchArchiveContent(raindrop._id, this.settings.apiToken);
                if (archiveHtml) {
                    templateData.scrapedContent = extractContentFromHtml(archiveHtml);
                }
            }

            const enhancedDataForRender: Record<string, unknown> = {
                ...templateData,
                domain: getDomain(templateData.link || ''),
                renderedType: raindropType(templateData.type),
                formattedCreatedDate: formatDate(templateData.created),
                formattedUpdatedDate: formatDate(templateData.lastupdate),
                formattedTags: formatTags(templateData.tags || []),
            };

            if (this.settings.downloadFiles && raindrop.link && (raindrop.link.includes('raindrop.io') && (raindrop.link.includes('/file') || raindrop.link.includes('/v2/')))) {
                try {
                    loadingNotice.setMessage(`Downloading file for '${raindrop.title || 'Untitled'}'... (${processed}/${total})`);
                    const fileExtension = raindrop.file?.name?.split('.').pop() || (raindrop.file?.type?.split('/').pop()) || 'file';
                    const binaryFileName = `${generatedFilename}.${fileExtension}`;
                    const binaryFilePath = normalizePath(`${targetPath}/${binaryFileName}`);
                    
                    const fileResponse = await requestUrl({
                        url: raindrop.link,
                        method: 'GET',
                        headers: { 'Authorization': `Bearer ${this.settings.apiToken}` }
                    });
                    
                    if (fileResponse.status === 200) {
                        await app.vault.adapter.writeBinary(binaryFilePath, fileResponse.arrayBuffer);
                        enhancedDataForRender.localFile = `[[${binaryFileName}]]`;
                        enhancedDataForRender.localEmbed = `![[${binaryFileName}]]`;
                    }
                } catch (error) {
                    console.error(`Error downloading file for raindrop ${raindrop._id}:`, error);
                }
            }

            let finalContent = '';
            if (this.settings.isTemplateSystemEnabled) {
                finalContent = this.renderTemplate(this.getTemplateForType(raindrop.type, options), enhancedDataForRender);
            } else {
                let frontmatter = `---\nid: ${raindrop._id}\ntitle: "${raindrop.title.replace(/"/g, '\\"')}"\ndescription: "${(raindrop.excerpt || '').replace(/"/g, '\\"')}"\nsource: ${raindrop.link}\ntype: ${raindrop.type}\ncreated: ${raindrop.created}\nlastupdate: ${raindrop.lastUpdate}\n`;
                if (templateData.collectionId) {
                    frontmatter += `collectionId: ${templateData.collectionId}\ncollectionTitle: "${templateData.collectionTitle}"\ncollectionPath: "${templateData.collectionPath}"\n`;
                    if (templateData.collectionGroup) frontmatter += `collectionGroup: "${templateData.collectionGroup}"\n`;
                    if (templateData.collectionParentId) frontmatter += `collectionParentId: ${templateData.collectionParentId}\n`;
                }
                frontmatter += `tags:\n${[...(raindrop.tags || []), ...settingsFMTags].map(t => `  - ${t.trim().replace(TAG_SPACE_REGEX, '_').replace(TAG_INVALID_CHARS_REGEX, '')}`).join('\n')}\n`;
                if (raindrop.cover) frontmatter += `${this.settings.bannerFieldName}: ${raindrop.cover}\n`;
                frontmatter += `---\n\n`;

                let noteBody = (raindrop.cover ? `![${sanitizeFileName(raindrop.title) || 'Cover'}](${raindrop.cover})\n\n` : "") + `# ${sanitizeMarkdownContent(raindrop.title)}\n\n`;
                if (raindrop.excerpt) noteBody += `## Description\n${sanitizeMarkdownContent(raindrop.excerpt)}\n\n`;
                if (templateData.scrapedContent) noteBody += `## Article Content\n${templateData.scrapedContent}\n\n`;
                if (templateData.note) noteBody += `## Notes\n${sanitizeMarkdownContent(templateData.note)}\n\n`;
                if (templateData.highlights?.length) {
                    noteBody += `## Highlights\n${templateData.highlights.map(h => `- ${sanitizeMarkdownContent(h.text).replace(/\n/g, ' ')}${h.note ? `\n  *Note:* ${sanitizeMarkdownContent(h.note).replace(/\n/g, ' ')}` : ""}`).join('\n')}\n\n`;
                }
                finalContent = frontmatter + noteBody;
            }

            const existingFile = app.vault.getAbstractFileByPath(filePath);
            if (existingFile instanceof TFile) await app.vault.modify(existingFile, finalContent);
            else await app.vault.create(filePath, finalContent);

            return { success: true, type: processOutcome };
        } catch (error) {
            console.error(`Error processing raindrop ${raindrop._id}:`, error);
            return { success: false, type: 'skipped' };
        }
    }

    private renderTemplate(template: string, data: Record<string, unknown>): string {
        interface ASTNode {
            type: 'text' | 'var' | 'if' | 'each' | 'extends' | 'block' | 'include';
            raw?: string;
            name?: string;
            cond?: string;
            arrayVar?: string;
            thenBranch?: ASTNode[];
            elseBranch?: ASTNode[];
            templateName?: string;
            blockName?: string;
        }

        const parseTemplate = (tmpl: string): ASTNode[] => {
            const tokens: Array<{ type: 'text' | 'tag'; value: string }> = [];
            let lastIdx = 0;

            while (lastIdx < tmpl.length) {
                const openIdx = tmpl.indexOf('{{', lastIdx);
                if (openIdx === -1) {
                    tokens.push({ type: 'text', value: tmpl.substring(lastIdx) });
                    break;
                }

                if (openIdx > lastIdx) {
                    tokens.push({ type: 'text', value: tmpl.substring(lastIdx, openIdx) });
                }

                const closeIdx = tmpl.indexOf('}}', openIdx + 2);
                if (closeIdx === -1) {
                    tokens.push({ type: 'text', value: tmpl.substring(openIdx) });
                    break;
                }

                const tagValue = tmpl.substring(openIdx + 2, closeIdx).trim();
                tokens.push({ type: 'tag', value: tagValue });
                lastIdx = closeIdx + 2;
            }

            let tokenIdx = 0;

            const parseNodes = (endTag?: string): ASTNode[] => {
                const nodes: ASTNode[] = [];

                while (tokenIdx < tokens.length) {
                    const token = tokens[tokenIdx];
                    if (token.type === 'text') {
                        nodes.push({ type: 'text', raw: token.value });
                        tokenIdx++;
                    } else {
                        const val = token.value;
                        if (endTag && (val === endTag || (endTag === '/if' && val === 'else'))) {
                            break;
                        }

                        if (val.startsWith('#if ')) {
                            const cond = val.substring(4).trim();
                            tokenIdx++;
                            const thenBranch = parseNodes('/if');
                            let elseBranch: ASTNode[] = [];
                            if (tokenIdx < tokens.length && tokens[tokenIdx].value === 'else') {
                                tokenIdx++;
                                elseBranch = parseNodes('/if');
                            }
                            if (tokenIdx < tokens.length && tokens[tokenIdx].value === '/if') {
                                tokenIdx++;
                            }
                            nodes.push({ type: 'if', cond, thenBranch, elseBranch });
                        } else if (val.startsWith('#each ')) {
                            const arrayVar = val.substring(6).trim();
                            tokenIdx++;
                            const thenBranch = parseNodes('/each');
                            if (tokenIdx < tokens.length && tokens[tokenIdx].value === '/each') {
                                tokenIdx++;
                            }
                            nodes.push({ type: 'each', arrayVar, thenBranch });
                        } else if (val.startsWith('#extends ')) {
                            const templateName = val.substring(9).trim().replace(/['"]/g, '');
                            tokenIdx++;
                            const thenBranch = parseNodes('/extends');
                            if (tokenIdx < tokens.length && tokens[tokenIdx].value === '/extends') {
                                tokenIdx++;
                            }
                            nodes.push({ type: 'extends', templateName, thenBranch });
                        } else if (val.startsWith('#block ')) {
                            const blockName = val.substring(7).trim().replace(/['"]/g, '');
                            tokenIdx++;
                            const thenBranch = parseNodes('/block');
                            if (tokenIdx < tokens.length && tokens[tokenIdx].value === '/block') {
                                tokenIdx++;
                            }
                            nodes.push({ type: 'block', blockName, thenBranch });
                        } else if (val.startsWith('#include ')) {
                            const templateName = val.substring(9).trim().replace(/['"]/g, '');
                            tokenIdx++;
                            nodes.push({ type: 'include', templateName });
                        } else if (val === '/if' || val === '/each' || val === 'else' || val === '/extends' || val === '/block') {
                            nodes.push({ type: 'text', raw: `{{${val}}}` });
                            tokenIdx++;
                        } else {
                            nodes.push({ type: 'var', name: val });
                            tokenIdx++;
                        }
                    }
                }
                return nodes;
            };

            return parseNodes();
        };

        const resolveTemplate = (name: string): string => {
            if (this.settings.namedTemplates[name]) return this.settings.namedTemplates[name];
            if (name === 'default') return this.settings.defaultTemplate;
            if (name in this.settings.contentTypeTemplates) return this.settings.contentTypeTemplates[name as keyof typeof this.settings.contentTypeTemplates];
            return '';
        };

        const renderAST = (nodes: ASTNode[], context: Record<string, unknown>, blocks: Map<string, ASTNode[]>): string => {
            let result = '';
            for (const node of nodes) {
                if (node.type === 'text') {
                    result += node.raw;
                } else if (node.type === 'var') {
                    const key = node.name!;
                    const parts = key.split(/\s+/);
                    if (parts.length >= 2) {
                        const helper = parts[0].toLowerCase();
                        const varName = parts[1];
                        const value = this.getNestedProperty(context, varName);
                        if (value !== undefined && value !== null) {
                            const strValue = String(value);
                            let resolved = false;
                            switch (helper) {
                                case 'uppercase':
                                    result += toUppercase(strValue);
                                    resolved = true;
                                    break;
                                case 'lowercase':
                                    result += toLowercase(strValue);
                                    resolved = true;
                                    break;
                                case 'titlecase':
                                    result += toTitleCase(strValue);
                                    resolved = true;
                                    break;
                                case 'truncate': {
                                    const length = parseInt(parts[2], 10);
                                    result += !isNaN(length) ? truncateString(strValue, length) : strValue;
                                    resolved = true;
                                    break;
                                }
                            }
                            if (resolved) continue;
                        }
                    }

                    const value = this.getNestedProperty(context, key);
                    if (value === null || value === undefined) {
                        // Keep result unchanged
                    } else if (typeof value === 'object') {
                        result += formatYamlValue(value);
                    } else {
                        result += String(value);
                    }
                } else if (node.type === 'if') {
                    const value = this.getNestedProperty(context, node.cond!);
                    const isTrue = !!(value && (Array.isArray(value) ? value.length > 0 : !!value));
                    if (isTrue) {
                        result += renderAST(node.thenBranch!, context, blocks);
                    } else if (node.elseBranch) {
                        result += renderAST(node.elseBranch, context, blocks);
                    }
                } else if (node.type === 'each') {
                    const array = this.getNestedProperty(context, node.arrayVar!);
                    if (Array.isArray(array)) {
                        for (const item of array) {
                            const nextContext = typeof item === 'object' && item !== null
                                ? { ...context, ...item } as Record<string, unknown>
                                : { ...context, 'this': item } as Record<string, unknown>;
                            result += renderAST(node.thenBranch!, nextContext, blocks);
                        }
                    }
                } else if (node.type === 'include') {
                    const partialTemplate = resolveTemplate(node.templateName!);
                    if (partialTemplate) {
                        result += renderAST(parseTemplate(partialTemplate), context, blocks);
                    }
                } else if (node.type === 'block') {
                    const blockContent = blocks.has(node.blockName!) ? blocks.get(node.blockName!)! : node.thenBranch!;
                    result += renderAST(blockContent, context, blocks);
                } else if (node.type === 'extends') {
                    // This only happens if inheritance failed to resolve a parent
                    // In that case, we render the child content as a fallback
                    result += renderAST(node.thenBranch!, context, blocks);
                }
            }
            return result;
        };

        const initialAst = parseTemplate(template);
        const rootContext = { ...data, id: data._id, domain: getDomain(data.link as string || ''), updated: data.lastupdate || '' };
        
        // Handle Inheritance
        let currentAst = initialAst;
        const blockOverrides = new Map<string, ASTNode[]>();
        const seenTemplates = new Set<string>();
        
        // Extract blocks from child (child blocks take precedence)
        const extractBlocks = (nodes: ASTNode[]) => {
            for (const node of nodes) {
                if (node.type === 'block' && !blockOverrides.has(node.blockName!)) {
                    blockOverrides.set(node.blockName!, node.thenBranch!);
                }
                if (node.thenBranch) extractBlocks(node.thenBranch);
                if (node.elseBranch) extractBlocks(node.elseBranch);
            }
        };

        let extendsNode = currentAst.find(n => n.type === 'extends');
        while (extendsNode) {
            const templateName = extendsNode.templateName!;
            if (seenTemplates.has(templateName) || seenTemplates.size >= 10) break; 
            seenTemplates.add(templateName);
            
            extractBlocks(currentAst);
            const parentTemplate = resolveTemplate(templateName);
            if (parentTemplate) {
                currentAst = parseTemplate(parentTemplate);
                extendsNode = currentAst.find(n => n.type === 'extends');
            } else {
                break;
            }
        }

        return renderAST(currentAst, rootContext, blockOverrides);
    }

    private getNestedProperty(obj: Record<string, unknown>, path: string): unknown {
        return path.split('.').reduce((current: unknown, prop: string) => (current && typeof current === 'object' && prop in current) ? (current as Record<string, unknown>)[prop] : undefined, obj);
    }

    async fetchUserGroups(): Promise<RaindropGroup[]> {
        const now = Date.now();
        if (this.groupCache && (now - this.lastGroupFetch < this.CACHE_TTL)) return this.groupCache;
        if (!this.settings.apiToken) return [];

        const baseApiUrl = 'https://api.raindrop.io/rest/v1';
        const fetchOptions: RequestInit = { method: 'GET', headers: { 'Authorization': `Bearer ${this.settings.apiToken}` } };

        try {
            const userRes = await fetchWithRetry<{ user: { groups: RaindropGroup[] } }>(this.app, `${baseApiUrl}/user`, fetchOptions, this.rateLimiter);
            const groups = userRes.user?.groups || [];
            this.groupCache = groups;
            this.lastGroupFetch = now;
            return groups;
        } catch {
            return this.groupCache || [];
        }
    }

    async fetchAllUserCollections(): Promise<RaindropCollection[]> {
        const now = Date.now();
        if (this.collectionCache && (now - this.lastCollectionFetch < this.CACHE_TTL)) return this.collectionCache;
        if (!this.settings.apiToken) return [];

        const baseApiUrl = 'https://api.raindrop.io/rest/v1';
        const fetchOptions: RequestInit = { method: 'GET', headers: { 'Authorization': `Bearer ${this.settings.apiToken}` } };

        try {
            const [rootRes, nestedRes] = await Promise.all([
                fetchWithRetry<CollectionResponse>(this.app, `${baseApiUrl}/collections`, fetchOptions, this.rateLimiter),
                fetchWithRetry<CollectionResponse>(this.app, `${baseApiUrl}/collections/childrens`, fetchOptions, this.rateLimiter)
            ]);
            const allCollections = [...(rootRes.items || []), ...(nestedRes.items || [])];
            const uniqueCollections = Array.from(new Map(allCollections.map(col => [col._id, col])).values())
                                          .filter(col => col._id !== SystemCollections.TRASH && col._id !== SystemCollections.UNSORTED);
            this.collectionCache = uniqueCollections;
            this.lastCollectionFetch = now;
            return uniqueCollections;
        } catch {
            new Notice('Failed to load your raindrop.io collections for selection.', 7000);
            return this.collectionCache || [];
        }
    }

    async fetchSingleRaindrop(itemId: number, vaultPath?: string, appendTags?: string): Promise<void> {
        if (!this.settings.apiToken) {
            new Notice('Please configure your raindrop.io API token in the plugin settings.', 10000);
            return;
        }
        if (!itemId) {
            new Notice('Invalid item ID provided for quick import.', 5000);
            return;
        }

        const loadingNotice = new Notice(`Fetching raindrop item id: ${itemId}...`, 0);
        const baseApiUrl = 'https://api.raindrop.io/rest/v1';
        const fetchOptions: RequestInit = { method: 'GET', headers: { 'Authorization': `Bearer ${this.settings.apiToken}` } };

        try {
            const response = await fetchWithRetry<{ result: boolean, item?: RaindropItem, items?: RaindropItem[], errorMessage?: string }>(this.app, `${baseApiUrl}/raindrop/${itemId}`, fetchOptions, this.rateLimiter);
            const data = response;
            const raindropItem = data.item || (data.items && data.items[0]);
            
            if (!raindropItem) {
                loadingNotice.hide();
                new Notice(`Failed to fetch raindrop item ${itemId}: ${data.errorMessage || 'item not found.'}`, 7000);
                return;
            }

            const collectionIdToNameMap = new Map<number, string>();
            const collectionToGroupMap = new Map<number, string>();
            let collectionsData: CollectionResponse | undefined;
            
            const [allUserCollections, allGroups] = await Promise.all([
                this.fetchAllUserCollections(),
                this.fetchUserGroups()
            ]);

            if (allUserCollections.length > 0) {
                collectionsData = { result: true, items: allUserCollections };
                allUserCollections.forEach(col => collectionIdToNameMap.set(col._id, col.title));
            }

            // Map root collections to their groups
            allGroups.forEach(group => {
                group.collections.forEach(colId => {
                    collectionToGroupMap.set(colId, group.title);
                });
            });
            
            const singleItemOptions: ModalFetchOptions = {
                vaultPath: vaultPath,
                collections: '',
                apiFilterTags: '',
                includeSubcollections: false,
                appendTagsToNotes: appendTags || '',
                useRaindropTitleForFileName: this.settings.fileNameTemplate !== '{{id}}',
                tagMatchType: 'all',
                filterType: 'all',
                fetchOnlyNew: false,
                updateExisting: true,
                useDefaultTemplate: false,
                overrideTemplates: false
            };

            await this.processRaindrops([raindropItem], vaultPath, appendTags || '', singleItemOptions.useRaindropTitleForFileName, loadingNotice, singleItemOptions, collectionsData, collectionIdToNameMap, new Set<string>(), collectionToGroupMap);
        } catch (error) {
            loadingNotice.hide();
            new Notice(`Error during quick import of item ${itemId}: ${error instanceof Error ? error.message : (typeof error === 'object' && error !== null ? JSON.stringify(error) : String(error))}`, 10000);
        }
    }

    /**
     * Aggregates all highlights for a specific tag into a single Markdown note.
     * Searches across all collections using the Raindrop.io search API.
     * @param options - Aggregation options including tag and optional vault path
     */
    async aggregateHighlightsByTag(options: AggregateHighlightsOptions): Promise<void> {
        if (!this.settings.apiToken) {
            new Notice('Please configure your Raindrop.io API token in the plugin settings.', 10000);
            return;
        }

        const loadingNotice = new Notice(`Aggregating highlights for tag: #${options.tag}...`, 0);
        const baseApiUrl = 'https://api.raindrop.io/rest/v1';
        const perPage = 50;

        try {
            let allItems: RaindropItem[] = [];
            let page = 0;
            let hasMore = true;

            const fetchOptions: RequestInit = {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${this.settings.apiToken}` }
            };

            while (hasMore) {
                loadingNotice.setMessage(`Fetching highlights for #${options.tag} (Page ${page + 1})...`);
                const searchParams = new URLSearchParams({
                    perpage: perPage.toString(),
                    page: page.toString(),
                    search: `#${options.tag} type:highlight`
                });

                const apiUrl = `${baseApiUrl}/raindrops/0?${searchParams.toString()}`;
                const response = await fetchWithRetry<RaindropResponse>(this.app, apiUrl, fetchOptions, this.rateLimiter);
                const data = response;

                if (!data.result) {
                    throw new Error('Raindrop API returned an error.');
                }

                if (data.items && data.items.length > 0) {
                    allItems = allItems.concat(data.items);
                    hasMore = data.items.length === perPage;
                    page++;
                } else {
                    hasMore = false;
                }
            }

            if (allItems.length === 0) {
                loadingNotice.hide();
                new Notice(`No highlights found for tag: #${options.tag}`, 5000);
                return;
            }

            // Generate content
            const lines: string[] = [];
            lines.push(`# Aggregated Highlights: #${options.tag}\n`);
            lines.push(`Generated on: ${new Date().toLocaleString()}\n`);

            allItems.forEach(item => {
                if (item.highlights && item.highlights.length > 0) {
                    lines.push(`## [${item.title}](${item.link})`);
                    item.highlights.forEach(highlight => {
                        lines.push(`- ${highlight.text.replace(/\r\n|\r|\n/g, ' ')}`);
                        if (highlight.note) {
                            lines.push(`  - **Note**: ${highlight.note.replace(/\r\n|\r|\n/g, ' ')}`);
                        }
                    });
                    lines.push('\n---\n');
                }
            });

            const content = lines.join('\n');

            // Save the note
            const fileName = sanitizeFileName(`Aggregated Highlights - #${options.tag}`);
            const folderPath = options.vaultPath || this.settings.defaultFolder || '';
            
            if (folderPath) {
                await createFolderStructure(this.app, folderPath);
            }

            const filePath = normalizePath(`${folderPath}/${fileName}.md`);
            
            if (await this.app.vault.adapter.exists(filePath)) {
                // If exists, create a new one with a timestamp to avoid overwriting user research
                const timestampedFileName = `${fileName} - ${Date.now()}`;
                const timestampedPath = normalizePath(`${folderPath}/${timestampedFileName}.md`);
                await this.app.vault.create(timestampedPath, content);
                new Notice(`Note already existed. Created: ${timestampedFileName}.md`, 5000);
            } else {
                await this.app.vault.create(filePath, content);
                new Notice(`Successfully aggregated highlights into ${fileName}.md`, 5000);
            }

            loadingNotice.hide();

        } catch (error) {
            loadingNotice.hide();
            let errorMessage = 'An error occurred during highlight aggregation';
            if (error instanceof Error) errorMessage = error.message;
            new Notice(`${errorMessage}`, 10000);
            console.error(`Error aggregating highlights for tag ${options.tag}:`, error);
        }
    }
}
