/**
 * Make It Rain: Raindrop.io Integration for Obsidian
 * ================================================
 * 
 * This plugin allows users to fetch bookmarks from Raindrop.io and create Markdown notes from them.
 * The code follows a modular architecture with utility functions separated into dedicated modules
 * to promote code reuse and maintainability.
 * 
 * Core components:
 * - Main plugin class (RaindropToObsidian): Handles plugin initialization and settings
 * - Modal UI (RaindropFetchModal): Provides user interface for fetching raindrops
 * - Settings tab (RaindropSettingTab): Manages plugin configuration
 * - Utility modules: Separated into file and API utilities for better organization
 * 
 * The plugin uses functional programming patterns where appropriate, with pure functions
 * and immutable data structures to improve code reliability and testability.
 */

import { App, Notice, Plugin, PluginSettingTab, Setting, Modal, TextComponent, ButtonComponent, ToggleComponent, PluginManifest, TFile, TAbstractFile, normalizePath } from 'obsidian';
import { request, requestUrl, RequestUrlParam } from 'obsidian';
import { 
    MakeItRainSettings, 
    RaindropType, 
    CONTENT_TYPES, 
    ModalFetchOptions, 
    RaindropItem, 
    RaindropResponse, 
    RaindropCollection, 
    CollectionResponse, 
    IRaindropToObsidian,
    RaindropTypes,
    TagMatchTypes,
    FilterTypes
} from './types';

// Import utility functions from consolidated index
// These utilities follow functional programming patterns and handle file operations and API interactions
import { DEFAULT_SETTINGS, RaindropToObsidianSettingTab } from './settings';
import { RaindropFetchModal, QuickImportModal } from './modals';
import { 
    // File utilities
    sanitizeFileName,
    doesPathExist,
    isPathAFolder,
    createFolder,
    createFolderStructure,
    
    // API utilities
    RateLimiter,
    createRateLimiter,
    createAuthenticatedRequestOptions,
    buildCollectionApiUrl,
    parseApiResponse,
    handleRequestError,
    fetchWithRetry,
    extractCollectionData,
    getFullPathSegments,
    
    // YAML utilities
    createYamlFrontmatter,
    formatYamlValue,
    escapeYamlString,
    
    // Format utilities
    formatDate,
    formatDateISO,
    formatTags,
    getDomain,
    raindropType
} from './utils';



// System collection IDs from Raindrop.io API docs
const SystemCollections = {
    UNSORTED: -1,
    TRASH: -99
} as const;

type SystemCollectionId = typeof SystemCollections[keyof typeof SystemCollections];

// Add new interface for Collection info
/**
 * Regex constants for tag sanitization to avoid redundant compilation in loops
 */
const TAG_SPACE_REGEX = / /g;
const TAG_INVALID_CHARS_REGEX = /[#?"*<>:|]/g;


// Rate limiting and retry utilities are now imported from './utils/apiUtils'


/**
 * Configuration options for API requests with retry capability
 */
interface FetchWithRetryOptions {
    url: string;
    requestOptions: RequestInit;
    rateLimiter: RateLimiter;
    maxRetries?: number;
    delayBetweenRetries?: number;
}

/**
// All API utility functions moved to apiUtils.ts and imported via index.ts
}

/**
 * Validates the parameters for the fetch operation
 */
function validateFetchParameters(url: string, options: RequestInit): void {
    const isUrlValid = typeof url === 'string';
    if (!isUrlValid) {
        throw new Error('URL must be a string');
    }
    
    const areOptionsValid = options && typeof options === 'object';
    if (!areOptionsValid) {
        throw new Error('Request options must be an object');
    }
}

/**
 * Collection API interaction - functional approach
 */

// Function moved to apiUtils.ts and imported via index.ts

// Function moved to apiUtils.ts and imported via index.ts

// Function moved to apiUtils.ts and imported via index.ts

/**
 * Fetches collection information with error handling and rate limiting
 * Uses functional composition by breaking the process into smaller, focused operations
 * @param app - The Obsidian app instance
 * @param collectionId - The ID of the collection to fetch
 * @param apiToken - The API token for authentication
 * @param rateLimiter - Rate limiter to prevent API throttling
 * @returns Promise resolving to collection data or null if unavailable
 */
/**
 * Fetches collection information from Raindrop.io API
 * Utilizes utility functions from apiUtils module for better modularity
 * @param app - Obsidian app instance
 * @param collectionId - Raindrop collection ID
 * @param apiToken - Raindrop API token
 * @param rateLimiter - Rate limiter instance
 * @returns Collection information or null if not found
 */
async function fetchCollectionInfo(app: App, collectionId: string, apiToken: string, rateLimiter: RateLimiter): Promise<RaindropCollection | null> {
    const requestOptions = createAuthenticatedRequestOptions(apiToken);
    const apiUrl = buildCollectionApiUrl(collectionId);

    try {
        const apiResponse = await fetchWithRetry(app, apiUrl, requestOptions, rateLimiter);
        // Use the imported extractCollectionData function from utils
        return extractCollectionData(apiResponse) as RaindropCollection;
    } catch (error) {
        // Non-fatal error - we can continue without collection info
        // The items will be placed in the base folder instead
        const errorMessage = error instanceof Error ? error.message : 'unknown error';
        console.error(`Error fetching collection ${collectionId}: ${errorMessage}`);
        return null;
    }
}

// Function moved inside the RaindropToObsidian class

// Modals moved to src/modals.ts

export default class RaindropToObsidian extends Plugin implements IRaindropToObsidian {
    settings: MakeItRainSettings;
    private rateLimiter: RateLimiter;
    private ribbonIconEl: HTMLElement | undefined;
    private isRibbonShown: boolean = false;
    private collectionCache: RaindropCollection[] | null = null;
    private lastCollectionFetch: number = 0;
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
            name: 'Fetch Raindrops (Filtered)',
            callback: async () => {
                new RaindropFetchModal(this.app, this).open();
            }
        });

        this.addCommand({ // New command for Quick Import
            id: 'quick-import-raindrop',
            name: 'Quick Import Raindrop by URL/ID',
            callback: async () => {
                new QuickImportModal(this.app, this).open();
            }
        });

        // Update ribbon icon based on settings
        this.updateRibbonIcon();

        this.addSettingTab(new RaindropToObsidianSettingTab(this.app, this));
        console.log('Make It Rain plugin loaded!');
    }

    onunload() {
        // Remove ribbon icon when plugin is unloaded
        this.ribbonIconEl?.remove();
        console.log('Make It Rain plugin unloaded.');
    }

    async loadSettings(): Promise<void> {
        const savedData = await this.loadData();
        
        // Start with complete default settings
        this.settings = { ...DEFAULT_SETTINGS };
        
        if (savedData) {
            // Merge saved data, but preserve default templates if empty
            const mergedSettings = {
                ...this.settings,
                ...savedData,
                contentTypeTemplates: {
                    ...this.settings.contentTypeTemplates,
                    ...Object.fromEntries(
                        Object.entries(savedData.contentTypeTemplates || {}).map(([key, value]) => [
                            key,
                            (value as string).trim() === '' ? this.settings.contentTypeTemplates[key as RaindropType] : value
                        ])
                    )
                },
                contentTypeTemplateToggles: {
                    ...this.settings.contentTypeTemplateToggles,
                    ...(savedData.contentTypeTemplateToggles || {})
                }
            };
            
            this.settings = mergedSettings;
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

    /**
     * Generates a file name based on the provided raindrop data and settings
     * @param raindrop - The raindrop data to use for file name generation
     * @param useRaindropTitleForFileName - Whether to use the raindrop title for the file name
     * @returns The generated file name
     */
    generateFileName(raindrop: RaindropItem, useRaindropTitleForFileName: boolean): string {
        // Use the template from settings if title is enabled, otherwise use ID
        const fileNameTemplate = useRaindropTitleForFileName ? this.settings.fileNameTemplate : '{{id}}';
        let fileName = fileNameTemplate;
        
        const replacePlaceholder = (placeholder: string, value: string) => {
            const safeValue = sanitizeFileName(value);
            const regex = new RegExp(`{{${placeholder}}}`, 'gi');
            fileName = fileName.replace(regex, safeValue);
        };

        try {
            replacePlaceholder('title', raindrop.title || 'Untitled');
            replacePlaceholder('id', (raindrop._id || 'unknown_id').toString()); // Use _id consistently
            replacePlaceholder('collectionTitle', raindrop.collection?.title || 'No Collection');

            const createdDate = raindrop.created ? new Date(raindrop.created) : null;
            let formattedDate = 'no_date';
            if (createdDate && !isNaN(createdDate.getTime())) {
                formattedDate = createdDate.toISOString().split('T')[0];
            }
            replacePlaceholder('date', formattedDate);

        } catch (error) {
            let errorMsg = 'template processing error';
            if (error instanceof Error) errorMsg = error.message;
            console.error("Error processing file name template:", errorMsg, error);
            new Notice("Error generating file name. Check console or template.");
            return "Error_Filename_" + Date.now();
        }

        let finalFileName = sanitizeFileName(fileName);
        if (!finalFileName.trim()) {
            return "Unnamed_Raindrop_" + (raindrop._id || Date.now()); // Use _id consistently
        }
        return finalFileName;
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
    
    sanitizeFileName(name: string): string {
        // Use the functional utility instead of duplicating the logic
        return sanitizeFileName(name);
    }
    
    /**
     * Update the ribbon icon based on settings
     */
    updateRibbonIcon(): void {
        // Remove existing icon if it exists
        this.ribbonIconEl?.remove();
        this.ribbonIconEl = undefined; // Clear the reference

        // Add icon if setting is enabled
        if (this.settings.showRibbonIcon) {
            this.ribbonIconEl = this.addRibbonIcon(
                'cloud-download', // Obsidian icon ID for cloud download
                'Fetch Raindrops', // Tooltip text
                () => {
                    // Callback function when the icon is clicked
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

        const loadingNotice = new Notice('Starting Raindrop fetch...', 0); // 0 duration makes it persistent

        try {
            let allData: RaindropItem[] = [];
            const perPage = 50; // Max items per page allowed by Raindrop.io API

            // Add error handling for API token
            if (!this.settings.apiToken) {
                loadingNotice.hide();
                new Notice('Please configure your Raindrop.io API token in the plugin settings.', 10000);
                return;
            }

            // --- Resolve Collection Names/IDs and Fetch Hierarchy ---
            let resolvedCollectionIds: number[] = [];
            const collectionNameToIdMap = new Map<string, number>();
            const collectionIdToNameMap = new Map<number, string>();
            const collectionHierarchy = new Map<number, { title: string, parentId?: number }>();

            loadingNotice.setMessage('Fetching collections hierarchy...');
            
            const allCollections = await this.fetchAllUserCollections();

            if (allCollections.length === 0) {
                loadingNotice.hide();
                // fetchAllUserCollections already shows a notice on error
                return;
            }

            // Build the hierarchy and name/ID maps from all collections
            allCollections.forEach(col => {
                collectionNameToIdMap.set(col.title.toLowerCase(), col._id);
                collectionIdToNameMap.set(col._id, col.title);
                collectionHierarchy.set(col._id, { title: col.title, parentId: col.parent?.$id });
            });
            const collectionsData = { result: true, items: allCollections };

            // Resolve input names/IDs if options.collections is provided
            if (options.collections) {
                const collectionInputs = options.collections.split(',').map((input: string) => input.trim()).filter((input: string) => input !== '');
                const unresolvedInputs: string[] = [];

                // Resolve input names/IDs to get resolvedCollectionIds
                for (const input of collectionInputs) {
                    const inputAsNumber = parseInt(input, 10);
                    if (!isNaN(inputAsNumber)) {
                        // Input is a number, treat as ID
                        // Verify if this ID exists in the fetched collections
                        if (collectionIdToNameMap.has(inputAsNumber)) {
                            resolvedCollectionIds.push(inputAsNumber);
                        } else {
                            unresolvedInputs.push(input); // ID not found in fetched collections
                            console.warn(`Could not find collection with ID: ${input}`);
                        }
                    } else {
                        // Input is text, treat as name
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
                    new Notice(`Could not find collections: ${unresolvedInputs.join(', ')}. Please check names or use IDs.`, 15000);
                    // Decide whether to continue with resolved IDs or stop. For now, continue.
                }

                // If user provided input but none could be resolved
                if (resolvedCollectionIds.length === 0 && collectionInputs.length > 0) {
                    loadingNotice.hide();
                    new Notice('No valid collection IDs or names provided.', 5000);
                    return;
                }

                // Ensure unique IDs in resolvedCollectionIds
                resolvedCollectionIds = Array.from(new Set(resolvedCollectionIds));
            }
            // --- End Resolve Collection Names/IDs and Fetch Hierarchy ---

            const searchParameterString = options.apiFilterTags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag !== '').join(' '); // Space-separated for AND logic

            let fetchMode: 'collections' | 'tags' | 'all' = 'all';

            // If user specified collections OR tags, we treat it as filtered fetch
            // Even if collections field is empty, if tags are present, we fetch via tags endpoint (collectionId 0)
            if (resolvedCollectionIds.length > 0) {
                fetchMode = 'collections';
            } else if (searchParameterString || (options.tagMatchType === TagMatchTypes.ANY && options.apiFilterTags.length > 0)) {
                fetchMode = 'tags';
            }

            // Fetch raindrops based on the determined mode

            if (fetchMode === 'collections') {
                // Fetch from specified collection IDs in parallel
                const collectionPromises = resolvedCollectionIds.map(async (collectionId) => {
                    let hasMore = true;
                    let page = 0;
                    let collectionData: any[] = [];

                    // Construct the API URL with filter type and search if specified
                    const collectionApiBaseUrl = `${baseApiUrl}/raindrops/${collectionId}`;

                    while (hasMore) {
                        const params = new URLSearchParams({
                            perpage: perPage.toString(),
                            page: page.toString()
                        });
                        // Add filter type to params if not 'all'
                        if (options.filterType && options.filterType !== 'all') {
                            params.append('type', options.filterType);
                        }
                        // Add search parameter if it exists (for filtering within a collection)
                        if (searchParameterString) {
                            params.append('search', searchParameterString);
                        }
                        // Add nested parameter if includeSubcollections is true
                        if (options.includeSubcollections) {
                            params.append('nested', 'true');
                        }

                        const currentApiUrl = `${collectionApiBaseUrl}?${params.toString()}`;
                        console.log(`Requesting items from collection ID: ${collectionId}`, currentApiUrl);

                        // Get collection name for notice message (optional)
                        const collectionNameForNotice = collectionIdToNameMap.get(collectionId) || collectionId.toString();

                        loadingNotice.setMessage(`Fetching from collection: ${collectionNameForNotice}, page ${page + 1}...`);

                        const response = await fetchWithRetry(
                            currentApiUrl,
                            fetchOptions,
                            this.rateLimiter
                        );
                        const data = response as RaindropResponse;

                        if (!data.result) {
                            console.error(`API Error for collection ${collectionId}:`, data);
                            new Notice(`Error fetching collection: ${collectionNameForNotice}. Skipping.`, 7000);
                            hasMore = false; // Stop fetching for this collection
                            break; // Exit the loop for this collection
                        }

                        if (data?.items) {
                            collectionData = collectionData.concat(data.items);
                            page++;
                            hasMore = data.items.length === perPage;
                            console.log(`Fetched ${data.items.length} items from collection ${collectionId}, page ${page}`);
                            if (hasMore) { // Update message only if there's more to fetch
                                loadingNotice.setMessage(`Fetching from collection: ${collectionNameForNotice}, page ${page + 1}...`); // Use name in message
                            }
                        } else {
                            console.warn(`Unexpected response for collection ${collectionId}. Stopping.`);
                            hasMore = false;
                        }
                    }
                    return collectionData;
                });

                const results = await Promise.all(collectionPromises);
                results.forEach(items => {
                    allData = allData.concat(items);
                });
            } else if (fetchMode === 'tags') {
                // Fetch based on tags (uses collectionId 0 endpoint)
                if (options.tagMatchType === TagMatchTypes.ANY && options.apiFilterTags.length > 0) {
                    // Implementation of OR logic for tags (fetch each tag separately in parallel)
                    const uniqueItems = new Map<number, RaindropItem>();

                    const tagsArray = options.apiFilterTags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag !== '');

                    const tagPromises = tagsArray.map(async (tag) => {
                        let hasMore = true;
                        let page = 0;
                        let tagData: RaindropItem[] = [];

                        while (hasMore) {
                            const params = new URLSearchParams({
                                perpage: perPage.toString(),
                                page: page.toString(),
                                search: `#${tag}` // Simple, reliable single-tag search
                            });

                            // Add filter type to params if not 'all'
                            if (options.filterType && options.filterType !== 'all') {
                                params.append('type', options.filterType);
                            }

                            const currentApiUrl = `${baseApiUrl}/raindrops/0?${params.toString()}`;
                            console.log(`Requesting items with tag: ${tag}`, currentApiUrl);
                            loadingNotice.setMessage(`Fetching items with tag: ${tag}, page ${page + 1}...`);

                            const response = await fetchWithRetry(
                                currentApiUrl,
                                fetchOptions,
                                this.rateLimiter
                            );
                            const data = response as RaindropResponse;

                            if (!data.result) {
                                console.error(`API Error for tag ${tag}:`, data);
                                break; // Skip this tag if there's an error, but continue with others
                            }

                            console.log(`API Response for tag ${tag}:`, {
                                result: data.result,
                                itemCount: data?.items?.length || 0,
                                totalCount: data?.count || 0
                            });

                            if (data?.items) {
                                tagData = tagData.concat(data.items);

                                page++;
                                hasMore = data.items.length === perPage; // Continue if we got a full page
                                console.log(`Fetched ${data.items.length} items for tag ${tag}, page ${page}`);
                                if (hasMore) { // Update message only if there's more to fetch
                                    loadingNotice.setMessage(`Fetching items with tag: ${tag}, page ${page + 1}...`);
                                }
                            } else {
                                hasMore = false;
                            }
                        }
                        return tagData;
                    });

                    const results = await Promise.all(tagPromises);

                    // Store items in Map using _id as key to automatically handle duplicates
                    results.forEach(items => {
                        items.forEach(item => {
                            if (!uniqueItems.has(item._id)) {
                                uniqueItems.set(item._id, item);
                            }
                        });
                    });

                    // Convert the Map values back to an array for processing
                    allData = Array.from(uniqueItems.values());
                    console.log(`Total unique items found across all tags: ${allData.length}`);

                } else if (searchParameterString) {
                    // Original AND logic or single tag search using the simple space-separated format
                    let hasMore = true;
                    let page = 0;

                    while (hasMore) {
                        const params = new URLSearchParams({
                            perpage: perPage.toString(),
                            page: page.toString(),
                            search: searchParameterString // This handles space-separated tags for AND logic
                        });

                        // Add filter type to params if not 'all'
                        if (options.filterType && options.filterType !== 'all') {
                            params.append('type', options.filterType);
                        }

                        const currentApiUrl = `${baseApiUrl}/raindrops/0?${params.toString()}`;
                        console.log(`Requesting items with tags: ${searchParameterString}`, currentApiUrl);
                        loadingNotice.setMessage(`Fetching items with tags: ${searchParameterString}, page ${page + 1}...`);

                        const response = await fetchWithRetry(
                            currentApiUrl,
                            fetchOptions,
                            this.rateLimiter
                        );
                        const data = response as RaindropResponse;

                        if (!data.result) {
                            console.error('API Error for tag search:', data);
                            throw new Error(`API Error: ${JSON.stringify(data)}`);
                        }

                        if (data?.items) {
                            allData = allData.concat(data.items);
                            page++;
                            hasMore = data.items.length === perPage;
                            console.log(`Fetched ${data.items.length} items with tags, page ${page}`);
                            if (hasMore) { // Update message only if there's more to fetch
                                loadingNotice.setMessage(`Fetching items with tags: ${searchParameterString}, page ${page + 1}...`);
                            }
                        } else {
                            hasMore = false;
                        }
                    }
                }
            } else {
                // Fetch mode is 'all' - fetch all items (collectionId 0)
                let hasMore = true;
                let page = 0;

                while (hasMore) {
                    const params = new URLSearchParams({ perpage: perPage.toString(), page: page.toString() });

                    // Add filter type to params if not 'all'
                    if (options.filterType && options.filterType !== 'all') {
                        params.append('type', options.filterType);
                    }

                    const currentApiUrl = `${baseApiUrl}/raindrops/0?${params.toString()}`;
                    console.log('Requesting all items:', currentApiUrl);
                    loadingNotice.setMessage(`Fetching all items, page ${page + 1}...`);

                    const response = await fetchWithRetry(
                        currentApiUrl,
                        fetchOptions,
                        this.rateLimiter
                    );
                    const data = response as RaindropResponse;

                    if (!data.result) {
                        console.error('API Error for all items fetch:', data);
                        throw new Error(`API Error: ${JSON.stringify(data)}`);
                    }

                    if (data?.items) {
                        allData = allData.concat(data.items);
                        page++;
                        hasMore = data.items.length === perPage;
                        console.log(`Fetched ${data.items.length} items, page ${page}`);
                        if (hasMore) { // Update message only if there's more to fetch
                            loadingNotice.setMessage(`Fetching all items, page ${page + 1}...`);
                        }
                    } else {
                        console.warn('Unexpected response for all items fetch. Stopping.');
                        hasMore = false;
                    }
                }
            }

            if (allData.length === 0) {
                if (resolvedCollectionIds.length > 0 || searchParameterString || (options.tagMatchType === TagMatchTypes.ANY && options.apiFilterTags.length > 0)) {
                    loadingNotice.hide(); // Dismiss loading notice
                    new Notice('No raindrops found matching your criteria.', 5000);
                } else {
                    loadingNotice.hide(); // Dismiss loading notice
                    new Notice('No raindrops found in your account.', 5000);
                }
            } else {
                loadingNotice.setMessage(`Found ${allData.length} raindrops. Applying type filter...`);

                // Apply type filter if specified
                let filteredData = allData;
                if (options.filterType && options.filterType !== 'all') {
                    filteredData = allData.filter(item => item.type === options.filterType);
                    loadingNotice.setMessage(`Found ${filteredData.length} raindrops of type '${options.filterType}'. Processing...`);
                    if (filteredData.length === 0) {
                        new Notice(`No raindrops found matching type '${options.filterType}'.`, 5000);
                        loadingNotice.hide();
                        return;
                }
            } else {
                loadingNotice.setMessage(`Found ${allData.length} raindrops. Processing...`); // Update notice message
                }

                // The loadingNotice will be hidden in processRaindrops
                // Pass all necessary data including collectionsData, resolvedCollectionIds, and collectionIdToNameMap
                await this.processRaindrops(filteredData, options.vaultPath, options.appendTagsToNotes, options.useRaindropTitleForFileName, loadingNotice, options, collectionsData, resolvedCollectionIds, collectionIdToNameMap);
            }

        } catch (error) {
            loadingNotice.hide(); // Dismiss loading notice on error
            let errorMessage = 'An unknown error occurred during fetch';
            if (error instanceof Error) errorMessage = error.message;
            else if (typeof error === 'string') errorMessage = error;
            new Notice(`Error fetching raindrops: ${errorMessage}`, 10000);
            console.error('Error fetching Raindrop API:', error);
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
        resolvedCollectionIds: number[] = [],
        collectionIdToNameMap: Map<number, string> = new Map<number, string>(),
        verifiedFolderPaths: Set<string> = new Set<string>()
    ): Promise<void> {
        const { app } = this;
        const settingsFMTags = appendTagsToNotes.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag !== '');

        if (vaultPath === undefined) vaultPath = this.settings.defaultFolder;
        // Normalize the base target folder path once
        const baseTargetFolderPath = vaultPath?.trim() ? normalizePath(vaultPath.trim()) : normalizePath("");

        // Initialize collection hierarchy
        const collectionHierarchy = new Map<number, { title: string, parentId?: number }>();
        if (collectionsData?.result) {
            collectionsData.items.forEach(col => {
                collectionHierarchy.set(col._id, { title: col.title, parentId: col.parent?.$id });
            });
        }

        let createdCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        let updatedCount = 0;
        let processed = 0;
        const total = raindrops.length;
        const pendingFolderCreations = new Map<string, Promise<boolean>>();

        try {
            // Flatten raindrops for concurrent processing
            const allRaindropsToProcess = raindrops;

            // Worker pool for concurrency limiting
            const CONCURRENCY_LIMIT = 10;
            let currentIndex = 0;

            const worker = async () => {
                while (currentIndex < allRaindropsToProcess.length) {
                    const index = currentIndex++;
                    const raindrop = allRaindropsToProcess[index];

                    try {
                        // Process individual raindrop
                        const result = await this.processRaindrop(
                            raindrop,
                            baseTargetFolderPath,
                            settingsFMTags,
                            options,
                            loadingNotice,
                            processed,
                            total,
                            collectionHierarchy,
                            collectionIdToNameMap,
                            verifiedFolderPaths,
                            pendingFolderCreations
                        );


                        if (result.success) {
                            if (result.type === 'created') createdCount++;
                            else if (result.type === 'updated') updatedCount++;
                            else if (result.type === 'skipped') skippedCount++;
                        } else {
                            errorCount++;
                        }
                        processed++;

                    } catch (error) {
                        errorCount++;
                        processed++;
                        console.error('Error processing raindrop:', error);
                    }
                }
            };

            // Start workers
            const workers = Array.from(
                { length: Math.min(CONCURRENCY_LIMIT, allRaindropsToProcess.length) },
                () => worker()
            );

            await Promise.all(workers);

            if (this.settings.createFolderNotes) {
                loadingNotice.setMessage('Generating collection folder notes...');
                try {
                    for (const folderPath of verifiedFolderPaths) {
                        try {
                            const folderName = folderPath.split('/').pop();
                            if (!folderName) continue;
                            const folderNotePath = normalizePath(`${folderPath}/${folderName}.md`);
                            const abstractFile = app.vault.getAbstractFileByPath(folderPath);
                            
                            if (abstractFile && 'children' in abstractFile) {
                                const folderChildren = (abstractFile as any).children as any[];
                                
                                let content = `---\n`;
                                content += `title: "${folderName.replace(/"/g, '\\"')}"\n`;
                                content += `type: collection\n`;
                                content += `---\n\n`;
                                content += `# ${folderName}\n\n`;
                                content += `## Collection Contents\n\n`;
                                
                                const sortedChildren = [...folderChildren].sort((a, b) => a.name.localeCompare(b.name));
                                
                                for (const child of sortedChildren) {
                                    if (child.name !== `${folderName}.md`) {
                                        content += `- [[${child.name.replace('.md', '')}]]\n`;
                                    }
                                }
                                
                                if (await app.vault.adapter.exists(folderNotePath)) {
                                    await app.vault.adapter.write(folderNotePath, content);
                                } else {
                                    await app.vault.create(folderNotePath, content);
                                }
                            }
                        } catch (e) {
                            console.error(`Error generating folder note for ${folderPath}:`, e);
                        }
                    }
                } catch (e) {
                    console.error('Failed to generate folder notes:', e);
                }
            }

            // Show final summary
            loadingNotice.hide();
            let summary = `${createdCount} notes created.`;
            if (updatedCount > 0) summary += ` ${updatedCount} updated.`;
            if (skippedCount > 0) summary += ` ${skippedCount} skipped (already exist).`;
            if (errorCount > 0) summary += ` ${errorCount} errors.`;
            new Notice(summary, 7000);

        } catch (error) {
            loadingNotice.hide();
            let errorMsg = 'An unknown error occurred';
            if (error instanceof Error) errorMsg = error.message;
            else if (typeof error === 'string') errorMsg = error;
            new Notice(`Error processing raindrops: ${errorMsg}`, 10000);
            console.error('Error processing raindrops:', error);
        }
    }

    private async processRaindrop(
        raindrop: RaindropItem,
        baseTargetFolderPath: string, // Already normalized
        settingsFMTags: string[],
        options: ModalFetchOptions,
        loadingNotice: Notice,
        processed: number,
        total: number,
        collectionHierarchy: Map<number, { title: string, parentId?: number }>,
        collectionIdToNameMap: Map<number, string>,
        verifiedFolderPaths: Set<string>,
        pendingFolderCreations: Map<string, Promise<boolean>>
    ): Promise<{ success: boolean; type: 'created' | 'updated' | 'skipped' }> {
        try {
            const { app } = this;

            const generatedFilename = this.generateFileName(raindrop, options.useRaindropTitleForFileName);
            
            let individualNoteTargetFolderPath = baseTargetFolderPath; // Starts as normalized
            if (raindrop.collection?.$id) {
                const pathSegments = getFullPathSegments(raindrop.collection.$id, collectionHierarchy, collectionIdToNameMap);
                if (pathSegments.length > 0) {
                    const collectionSubPath = pathSegments.join('/');
                    // Use normalizePath for the full path
                    individualNoteTargetFolderPath = normalizePath(`${baseTargetFolderPath}/${collectionSubPath}`);
                }
            }
            
            // Ensure target directory exists before attempting to write
            // individualNoteTargetFolderPath is already normalized
            if (individualNoteTargetFolderPath && !verifiedFolderPaths.has(individualNoteTargetFolderPath)) {
                if (pendingFolderCreations.has(individualNoteTargetFolderPath)) {
                    await pendingFolderCreations.get(individualNoteTargetFolderPath);
                } else {
                    const createPromise = (async () => {
                        try {
                            if (!(await app.vault.adapter.exists(individualNoteTargetFolderPath))) {
                                await createFolderStructure(app, individualNoteTargetFolderPath);
                            }
                            return true;
                        } catch (folderError) {
                            const errorMsg = folderError instanceof Error ? folderError.message : String(folderError);
                            if (!errorMsg.toLowerCase().includes('already exists') && !errorMsg.toLowerCase().includes('folder already exists')) {
                                console.error(`Failed to create folder ${individualNoteTargetFolderPath}:`, folderError);
                                return false;
                            }
                            return true;
                        }
                    })();
                    pendingFolderCreations.set(individualNoteTargetFolderPath, createPromise);
                    await createPromise;
                }
                verifiedFolderPaths.add(individualNoteTargetFolderPath);
            }
            
            // Use normalizePath for the final file path
            const filePath = normalizePath(`${individualNoteTargetFolderPath}/${generatedFilename}.md`);

            // Update loading notice with current processing item
            const raindropTitle = raindrop.title || 'Untitled';
            loadingNotice.setMessage(`Processing '${raindropTitle}'... (${processed}/${total})`);

            let processOutcome: 'created' | 'updated' | 'skipped' = 'created';

            // Generate template data
            const templateData: Record<string, any> = {
                id: raindrop._id,
                title: escapeYamlString(raindrop.title),
                excerpt: escapeYamlString(raindrop.excerpt || ''),
                note: escapeYamlString(raindrop.note || ''),
                link: raindrop.link, // URLs generally don't need YAML escaping unless they have special chars
                cover: raindrop.cover || '', // URLs generally don't need YAML escaping
                created: raindrop.created,
                lastupdate: raindrop.lastUpdate, // Changed from lastUpdate
                type: raindrop.type,
                // Flattened collection data
                collectionId: raindrop.collection?.$id || 0,
                collectionTitle: escapeYamlString(collectionIdToNameMap.get(raindrop.collection?.$id || 0) || 'Unknown'),
                collectionPath: escapeYamlString(getFullPathSegments(raindrop.collection?.$id || 0, collectionHierarchy, collectionIdToNameMap).join('/')),
                // Add collectionParentId if it exists
                ...(collectionHierarchy.has(raindrop.collection?.$id || 0) && collectionHierarchy.get(raindrop.collection?.$id || 0)?.parentId !== undefined && {
                    collectionParentId: collectionHierarchy.get(raindrop.collection?.$id || 0)?.parentId
                }),
                tags: [...(raindrop.tags || []), ...settingsFMTags].map(tag => escapeYamlString(tag)),
                highlights: (raindrop.highlights || []).map(h => ({
                    ...h,
                    text: escapeYamlString(h.text),
                    note: escapeYamlString(h.note || '')
                })),
                bannerFieldName: this.settings.bannerFieldName,
                // Pre-calculated fields for helpers
                url: raindrop.link || '',
            };

            try {
                // Prepare data for the rendering engine (including pre-calculated fields for helpers)
                const enhancedDataForRender: Record<string, any> = {
                    ...templateData, // Spread the original templateData
                    url: templateData.link || '', // Ensure url is available, aliasing link
                    domain: getDomain(templateData.link || ''),
                    // Pre-calculate values that used helpers in the template:
                    renderedType: raindropType(templateData.type as RaindropType), // Cast type to RaindropType
                    formattedCreatedDate: formatDate(templateData.created),
                    formattedUpdatedDate: formatDate(templateData.lastupdate), // Changed from lastUpdate
                    formattedTags: formatTags(templateData.tags || []),
                };

                let localEmbedLink = '';
                // Detect if a raindrop points to a natively uploaded file.
                // Raindrop sets raindrop.link to an internal /v2/ API URL when the item is an upload.
                // The real CDN URL is embedded inside raindrop.cover via rdl.ink/render/<encoded_url>
                const isNativeUpload = !!(raindrop.file || (raindrop.link && raindrop.link.includes('api.raindrop.io/v2/') && raindrop.link.includes('/file')));
                // Also detect link-type items whose URL directly ends in a downloadable extension
                const DOWNLOADABLE_LINK_EXTENSIONS = /\.(pdf|epub|mobi|azw3?|djvu|mp3|mp4|m4a|m4v|wav|ogg|flac|aac|mov|avi|mkv|webm|docx?|xlsx?|pptx?)(\?.*)?$/i;
                const isDirectFileLink = !isNativeUpload && DOWNLOADABLE_LINK_EXTENSIONS.test(raindrop.link || '');
                
                if (this.settings.downloadFiles && raindrop.link && 
                   (isNativeUpload || isDirectFileLink || raindrop.type === 'document' || raindrop.type === 'book' || raindrop.type === 'image' || raindrop.type === 'video' || raindrop.type === 'audio')) {

                    // Resolve the real download URL and file extension OUTSIDE the try
                    // so we can write debug info even on failure.
                    let downloadUrl = raindrop.link;
                    let fileExtFromMime = '';
                    
                    if (isNativeUpload) {
                        // For native uploads, use the v1 API file endpoint via query string auth.
                        // We use ?access_token instead of the Authorization header because
                        // requestUrl automatically follows the 303 redirect to AWS S3.
                        // S3 will reject the request with 400 Bad Request if both query string
                        // credentials (the pre-signed URL params) AND an Authorization header are present.
                        downloadUrl = `https://api.raindrop.io/rest/v1/raindrop/${raindrop._id}/file?access_token=${this.settings.apiToken}`;
                        
                        try {
                            const mimeType = new URL(raindrop.link).searchParams.get('type') || '';
                            const MIME_TO_EXT: Record<string, string> = {
                                'application/pdf': 'pdf',
                                'application/epub+zip': 'epub',
                                'application/epub': 'epub',
                                'application/x-mobipocket-ebook': 'mobi',
                                'application/x-fictionbook+xml': 'fb2',
                                'video/mp4': 'mp4',
                                'video/webm': 'webm',
                                'video/quicktime': 'mov',
                                'audio/mpeg': 'mp3',
                                'audio/mp4': 'm4a',
                                'audio/ogg': 'ogg',
                                'image/png': 'png',
                                'image/jpeg': 'jpg',
                                'image/gif': 'gif',
                                'image/webp': 'webp',
                            };
                            fileExtFromMime = MIME_TO_EXT[mimeType] || '';
                        } catch (e) { /* no type param */ }
                    }
                    
                    // Determine file extension
                    let fileExt = 'pdf';
                    if (fileExtFromMime) {
                        fileExt = fileExtFromMime;
                    } else if (raindrop.file && raindrop.file.name) {
                        const parts = raindrop.file.name.split('.');
                        if (parts.length > 1) {
                            fileExt = parts.pop()?.toLowerCase() || 'pdf';
                        }
                    } else {
                        const urlForExt = downloadUrl.split('?')[0];
                        const extCandidate = urlForExt.split('.').pop()?.toLowerCase() || '';
                        if (extCandidate && extCandidate.length <= 5 && !extCandidate.includes('/')) {
                            fileExt = extCandidate;
                        } else {
                            fileExt = raindrop.type === 'image' ? 'png' : 
                                      raindrop.type === 'video' ? 'mp4' : 
                                      raindrop.type === 'audio' ? 'mp3' :
                                      raindrop.type === 'book' ? 'epub' : 'pdf';
                        }
                    }
                    
                    const binaryFileName = `${generatedFilename}.${fileExt}`;
                    const binaryFilePath = normalizePath(`${individualNoteTargetFolderPath}/${binaryFileName}`);

                    // Only attempt download if the binary file doesn't already exist
                    if (!(await app.vault.adapter.exists(binaryFilePath))) {
                        try {
                            const requestOptions: RequestUrlParam = { 
                                url: downloadUrl
                            };
                            const response = await requestUrl(requestOptions);
                            
                            if (response.status >= 400) {
                                throw new Error(`HTTP ${response.status} from ${downloadUrl}`);
                            }
                            
                            const arrayBuffer = response.arrayBuffer;
                            
                            if (!arrayBuffer || arrayBuffer.byteLength === 0) {
                                throw new Error(`Empty response (0 bytes) from ${downloadUrl}`);
                            }
                            
                            // Validate magic bytes
                            const view = new Uint8Array(arrayBuffer);
                            let isCorrupt = false;
                            if (fileExt === 'pdf' && (view.length < 5 || view[0] !== 37 || view[1] !== 80 || view[2] !== 68 || view[3] !== 70)) {
                                isCorrupt = true;
                            } else if ((fileExt === 'epub' || fileExt === 'zip') && (view.length < 2 || view[0] !== 80 || view[1] !== 75)) {
                                isCorrupt = true;
                            }
                            
                            if (isCorrupt) {
                                // Write debug file showing what we actually received
                                const rawString = new TextDecoder("utf-8", { fatal: false }).decode(arrayBuffer.slice(0, 500));
                                const debugContent = `--- CORRUPT DOWNLOAD DEBUG ---\nDownload URL: ${downloadUrl}\nOriginal Link: ${raindrop.link}\nCover: ${raindrop.cover || 'none'}\nFile Ext: ${fileExt}\nSize: ${arrayBuffer.byteLength}\nFirst 5 bytes: ${view.slice(0, 5).join(',')}\nisNativeUpload: ${isNativeUpload}\nraindrop.file: ${JSON.stringify(raindrop.file || null)}\n\n--- FIRST 500 BYTES ---\n${rawString}\n`;
                                try {
                                    const debugPath = normalizePath(`${individualNoteTargetFolderPath}/${generatedFilename}_debug.txt`);
                                    if (await app.vault.adapter.exists(debugPath)) {
                                        await app.vault.adapter.write(debugPath, debugContent);
                                    } else {
                                        await app.vault.create(debugPath, debugContent);
                                    }
                                } catch (e) { /* debug write failed */ }
                                throw new Error(`Corrupt download (invalid magic bytes for .${fileExt})`);
                            }
                            
                            await app.vault.createBinary(binaryFilePath, arrayBuffer);
                        } catch (downloadError) {
                            // Write a debug file even if requestUrl itself threw (e.g. network error, 404)
                            const errMsg = downloadError instanceof Error ? downloadError.message : String(downloadError);
                            console.error(`Download failed for ${generatedFilename}: ${errMsg}`);
                            try {
                                const debugContent = `--- DOWNLOAD ERROR DEBUG ---\nDownload URL: ${downloadUrl}\nOriginal Link: ${raindrop.link}\nCover: ${raindrop.cover || 'none'}\nFile Ext: ${fileExt}\nisNativeUpload: ${isNativeUpload}\nraindrop.file: ${JSON.stringify(raindrop.file || null)}\nraindrop.type: ${raindrop.type}\nError: ${errMsg}\n`;
                                const debugPath = normalizePath(`${individualNoteTargetFolderPath}/${generatedFilename}_debug.txt`);
                                if (await app.vault.adapter.exists(debugPath)) {
                                    await app.vault.adapter.write(debugPath, debugContent);
                                } else {
                                    await app.vault.create(debugPath, debugContent);
                                }
                            } catch (e) {
                                console.error("Failed to write download debug file:", e);
                            }
                        }
                    }
                    
                    // Set embed link regardless (if binary exists from this or a previous run)
                    if (await app.vault.adapter.exists(binaryFilePath)) {
                        localEmbedLink = `![[${binaryFileName}]]`;
                        enhancedDataForRender.localEmbed = localEmbedLink; 
                        enhancedDataForRender.localFilePath = binaryFilePath;
                    }
                }

                if (this.settings.isTemplateSystemEnabled) {
                    const template = this.getTemplateForType(raindrop.type as RaindropType, options);
                    const fileContent = this.renderTemplate(template, enhancedDataForRender);
                    await app.vault.create(filePath, fileContent);
                    return { success: true, type: processOutcome };
                } else {
                    // Fallback to basic format if template system is disabled
                    // Logic moved from createNoteFromRaindrop
                    const { 
                        id, title, excerpt, note, link, cover, created, lastUpdate: rdLastUpdate, type, tags // Keep raindrop.lastUpdate as rdLastUpdate for source
                    } = raindrop; // Use raindrop directly for source data here to avoid confusion with templateData.lastupdate

                    let descriptionYaml = '';
                    if (excerpt) {
                        if (excerpt.includes('\n')) {
                            descriptionYaml = `description: |\n${excerpt.split('\n').map((line: string) => `  ${line}`).join('\n')}`;
                        } else {
                            descriptionYaml = `description: "${excerpt.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
                        }
                    } else {
                        descriptionYaml = `description: ""`;
                    }

                    let frontmatter = `---\n`;
                    frontmatter += `id: ${id}\n`;
                    frontmatter += `title: "${title.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"\n`;
                    frontmatter += `${descriptionYaml}\n`;
                    frontmatter += `source: ${link}\n`;
                    frontmatter += `type: ${type}\n`;
                    frontmatter += `created: ${created}\n`;
                    frontmatter += `lastupdate: ${rdLastUpdate}\n`;
                    
                    if (templateData.collectionId) { // Use flattened collectionId from templateData
                        frontmatter += `collectionId: ${templateData.collectionId}\n`;
                        frontmatter += `collectionTitle: "${escapeYamlString(templateData.collectionTitle)}"\n`;
                        frontmatter += `collectionPath: "${escapeYamlString(templateData.collectionPath)}"\n`;
                        if (templateData.collectionParentId) {
                            frontmatter += `collectionParentId: ${templateData.collectionParentId}\n`;
                        }
                    }
                    
                    frontmatter += `tags:\n`;
                    const finalTags = [...(tags || []), ...settingsFMTags].map((tag: string) => `  - ${tag.trim().replace(TAG_SPACE_REGEX, '_').replace(TAG_INVALID_CHARS_REGEX, '')}`).join('\n');
                    if (finalTags) {
                        frontmatter += `${finalTags}\n`;
                    }
                    
                    if (cover) {
                        frontmatter += `${this.settings.bannerFieldName}: ${cover}\n`;
                    }
                    frontmatter += `---\n\n`; // Corrected: Actual newlines here

                    // Construct note content
                    let noteBody = '';
                    const altText = sanitizeFileName(title) || 'Cover Image';
                    if (cover) {
                        noteBody += `![${altText}](${cover})\n\n`; // Corrected
                    }
                    noteBody += `# ${title}\n\n`; // Corrected
                    if (excerpt) {
                        noteBody += `## Description\n${excerpt}\n\n`; // Corrected
                    }
                    if (templateData.note) { 
                         noteBody += `## Notes\n${templateData.note}\n\n`; // Corrected
                    }

                    if (templateData.highlights && templateData.highlights.length > 0) {
                        noteBody += '## Highlights\n'; // Corrected
                        templateData.highlights.forEach((highlight: any) => {
                            noteBody += `- ${highlight.text.replace(/\r\n|\r|\n/g, ' ')}\n`; // Corrected
                            if (highlight.note) {
                                noteBody += `  *Note:* ${highlight.note.replace(/\r\n|\r|\n/g, ' ')}\n`; // Corrected
                            }
                        });
                        noteBody += '\n'; // Corrected
                    }
                    
                    if (localEmbedLink) {
                        noteBody += `\n## Local File\n${localEmbedLink}\n\n`;
                    }
                    
                    const basicContent = frontmatter + noteBody;
                    await app.vault.create(filePath, basicContent);
                    return { success: true, type: processOutcome };
                }
            } catch (error) {
                // Make the check case-insensitive and check for the core part of the message
                const isFileExistsError = error instanceof Error && 
                                          error.message && 
                                          error.message.toLowerCase().includes("file already exists");

                if (isFileExistsError) {
                    console.warn(`Attempted to create file ${filePath} but it already exists. This was not handled by update/skip logic (e.g., neither 'update existing' nor 'fetch only new' was applicable or led to a skip). File will be skipped. Options: updateExisting=${options.updateExisting}, fetchOnlyNew=${options.fetchOnlyNew}`);
                    return { success: true, type: 'skipped' };
                }
                // Log other errors from app.vault.create or other unexpected issues within this try block
                console.error(`Error during file operation for ${generatedFilename} at path ${filePath}:`, error);
                return { success: false, type: 'skipped' }; // Indicate failure but allow batch processing to continue
            }
        } catch (error) {
            console.error('Unexpected error in processRaindrop for item ID ' + raindrop._id + ':', error);
            return { success: false, type: 'skipped' };
        }
    }

    private readonly IF_REGEX = /{{#if ([^}]+)}}([\s\S]*?)(?:{{else}}([\s\S]*?))?{{\/if}}/g;
    private readonly EACH_REGEX = /{{#each ([^}]+)}}([\s\S]*?){{\/each}}/g;
    private readonly VAR_REGEX = /{{([^}]+)}}/g;

    private renderTemplate(template: string, data: Record<string, any>): string {
        const renderBlock = (blockContent: string, context: any): string => {
            return blockContent
                // Handle if conditions
                .replace(this.IF_REGEX, (match, conditionVar, content, elseContent) => {
                    const value = this.getNestedProperty(context, conditionVar.trim());
                    if (value && (Array.isArray(value) ? value.length > 0 : !!value)) {
                        return renderBlock(content, context);
                    }
                    return elseContent ? renderBlock(elseContent, context) : '';
                })
                // Handle each loops
                .replace(this.EACH_REGEX, (match, arrayVar, content) => {
                    const array = this.getNestedProperty(context, arrayVar.trim());
                    if (!Array.isArray(array)) return '';
                    return array.map(item => {
                        const itemContext = typeof item === 'object' ? { ...context, ...item } : { ...context, 'this': item };
                        return renderBlock(content, itemContext);
                    }).join('');
                })
                // Handle simple variables
                .replace(this.VAR_REGEX, (match, key) => {
                    const value = this.getNestedProperty(context, key.trim());
                    if (typeof value === 'object' && value !== null) {
                        return formatYamlValue(value);
                    }
                    return String(value ?? '');
                });
        };

        const enhancedData = {
            ...data,
            domain: getDomain(data.link || ''),
            formatDate: (date: string) => formatDate(date),
            formatDateISO: (date: string) => formatDateISO(date),
            formatTags: (tags: string[]) => formatTags(tags),
            raindropType: (type: string) => raindropType(type),
            updated: data.lastupdate || '',
        };

        return renderBlock(template, enhancedData);
    }

    private getNestedProperty(obj: any, path: string): any {
        return path.split('.').reduce((current: any, prop: string) => {
            return current && current[prop] !== undefined ? current[prop] : undefined;
        }, obj);
    }

    async fetchAllUserCollections(): Promise<RaindropCollection[]> {
        // Check cache first
        const now = Date.now();
        if (this.collectionCache && (now - this.lastCollectionFetch < this.CACHE_TTL)) {
            return this.collectionCache;
        }

        if (!this.settings.apiToken) {
            console.warn('API token not set. Cannot fetch user collections.');
            new Notice('API token not set. Cannot fetch collections for modal.', 5000);
            return [];
        }
        const baseApiUrl = 'https://api.raindrop.io/rest/v1';
        const fetchOptions: RequestInit = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.settings.apiToken}`
            }
        };
        let allCollections: RaindropCollection[] = [];

        try {
            // Fetch root and nested collections in parallel
            const [rootResponse, nestedResponse] = await Promise.all([
                fetchWithRetry(this.app, `${baseApiUrl}/collections`, fetchOptions, this.rateLimiter),
                fetchWithRetry(this.app, `${baseApiUrl}/collections/childrens`, fetchOptions, this.rateLimiter)
            ]);

            const rootData = rootResponse as CollectionResponse;
            if (rootData?.result && rootData?.items) {
                allCollections = allCollections.concat(rootData.items);
            }

            const nestedData = nestedResponse as CollectionResponse;
            if (nestedData?.result && nestedData?.items) {
                allCollections = allCollections.concat(nestedData.items);
            }
            
            // Filter out potential duplicates and system collections
            const uniqueCollections = Array.from(new Map(allCollections.map(col => [col._id, col])).values())
                                          .filter(col => col._id !== SystemCollections.TRASH && col._id !== SystemCollections.UNSORTED);
            
            // Update cache
            this.collectionCache = uniqueCollections;
            this.lastCollectionFetch = now;
            
            return uniqueCollections;

        } catch (error) {
            console.error('Error fetching all user collections for modal:', error);
            new Notice('Failed to load your Raindrop.io collections for selection.', 7000);
            return this.collectionCache || []; // Return stale cache if error
        }
    }

    // Method to fetch and process a single Raindrop item
    async fetchSingleRaindrop(itemId: number, vaultPath?: string, appendTags?: string): Promise<void> {
        if (!this.settings.apiToken) {
            new Notice('Please configure your Raindrop.io API token in the plugin settings.', 10000);
            return;
        }
        if (!itemId) {
            new Notice('Invalid Item ID provided for Quick Import.', 5000);
            return;
        }

        const loadingNotice = new Notice(`Fetching Raindrop item ID: ${itemId}...`, 0);
        const baseApiUrl = 'https://api.raindrop.io/rest/v1';
        const fetchOptions: RequestInit = {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${this.settings.apiToken}` }
        };

        try {
            const response = await fetchWithRetry(
                this.app,
                `${baseApiUrl}/raindrop/${itemId}`,
                fetchOptions,
                this.rateLimiter
            );
            
            // The API for a single raindrop returns { result: boolean, item: RaindropItem }
            // So we need to adapt this structure.
            const data = response as { result: boolean, item?: RaindropItem, items?: RaindropItem[] }; // More flexible typing for safety

            let raindropItem: RaindropItem | undefined;

            if (data.result && data.item) {
                raindropItem = data.item;
            } else if (data.result && data.items && data.items.length > 0) {
                // Some endpoints might wrap single items in an array, handle defensively
                raindropItem = data.items[0];
                 console.warn(`Single raindrop fetch for ID ${itemId} returned an items array. Using the first item.`);
            }
            
            if (!raindropItem) {
                loadingNotice.hide();
                const errorMsg = data.result === false ? (data as any).errorMessage || 'API indicated failure.' : 'Item not found or invalid response.';
                new Notice(`Failed to fetch Raindrop item ${itemId}: ${errorMsg}`, 7000);
                console.error(`Failed to fetch Raindrop item ${itemId}:`, data);
                return;
            }

            // Prepare options similar to ModalFetchOptions, but simplified for single item
            // We'll use the plugin's default settings for most things
            const singleItemOptions: ModalFetchOptions = {
                vaultPath: vaultPath, // User-specified or plugin default
                collections: '', // Not applicable for single item by ID
                apiFilterTags: '', // Not applicable
                includeSubcollections: false, // Not applicable
                appendTagsToNotes: appendTags || '', // User-specified for quick import
                useRaindropTitleForFileName: this.settings.fileNameTemplate !== '{{id}}', // Infer from settings
                tagMatchType: 'all', // Default, not critical here
                filterType: 'all',   // Default, not critical here
                fetchOnlyNew: false, // For quick import, typically we want to create or update
                updateExisting: true, // Default to true for quick import to allow updates
                useDefaultTemplate: false, // Respect template settings
                overrideTemplates: false   // Respect template settings
            };

            // Need to fetch collection hierarchy for path generation if not already available
            // For simplicity in quick import, we can fetch all collections if the item has a collection ID.
            // This ensures collectionPath and title are available for the template.
            let collectionsData: CollectionResponse | undefined = undefined;
            let collectionIdToNameMap = new Map<number, string>();

            if (raindropItem.collection?.$id) {
                 loadingNotice.setMessage(`Fetching collection info for item ${itemId}...`);
                const allUserCollections = await this.fetchAllUserCollections();
                if (allUserCollections.length > 0) {
                    collectionsData = { result: true, items: allUserCollections };
                    allUserCollections.forEach(col => collectionIdToNameMap.set(col._id, col.title));
                }
            }
            
            // Use a simplified call to processRaindrops, or adapt processRaindrop
            // For now, let's call processRaindrops with an array of one
            await this.processRaindrops(
                [raindropItem],
                singleItemOptions.vaultPath,
                singleItemOptions.appendTagsToNotes,
                singleItemOptions.useRaindropTitleForFileName,
                loadingNotice, // Pass the notice
                singleItemOptions,
                collectionsData, // Pass fetched collections data for path context
                [], // resolvedCollectionIds not directly applicable
                collectionIdToNameMap // Pass map for titles
            );
            // The processRaindrops method will hide the notice upon completion.

        } catch (error) {
            loadingNotice.hide();
            let errorMessage = 'An unknown error occurred during quick import';
            if (error instanceof Error) errorMessage = error.message;
            new Notice(`Error during Quick Import of item ${itemId}: ${errorMessage}`, 10000);
            console.error(`Error quick importing Raindrop ID ${itemId}:`, error);
        }
    }
}





