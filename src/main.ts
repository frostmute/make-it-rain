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

import { App, Notice, Plugin, PluginSettingTab, Setting, Modal, TextComponent, ButtonComponent, ToggleComponent, PluginManifest, TFile, TAbstractFile } from 'obsidian';
import { request, RequestUrlParam } from 'obsidian';
import { RaindropFetchModal } from './components/RaindropFetchModal';
import { RaindropSettingTab } from './components/RaindropSettingTab';
import { RaindropToObsidianSettings, ModalFetchOptions } from './types';
import { 
    createRateLimiter, 
    RateLimiter, 
    fetchWithRetry, 
    createAuthenticatedRequestOptions, 
    buildCollectionApiUrl,
    parseApiResponse,
    handleRequestError,
    extractCollectionData
} from './utils/apiUtils';
import { TemplateService } from './services/templateService';
import { DEFAULT_TEMPLATE_SETTINGS } from './types/templates';

// Import utility functions from consolidated index
// These utilities follow functional programming patterns and handle file operations and API interactions
import { 
    // File utilities
    sanitizeFileName,
    doesPathExist,
    isPathAFolder,
    createFolder,
    createFolderStructure,
    
    // YAML utilities
    createYamlFrontmatter,
    formatYamlValue
} from './utils';


// Constants for type unions - following Raindrop.io API types
const RaindropTypes = {
    LINK: 'link',
    ARTICLE: 'article',
    IMAGE: 'image',
    VIDEO: 'video',
    DOCUMENT: 'document',
    AUDIO: 'audio'
} as const;

type RaindropType = typeof RaindropTypes[keyof typeof RaindropTypes];

const TagMatchTypes = {
    ALL: 'all',
    ANY: 'any'
} as const;

type TagMatchType = typeof TagMatchTypes[keyof typeof TagMatchTypes];

// System collection IDs from Raindrop.io API docs
const SystemCollections = {
    UNSORTED: -1,
    TRASH: -99
} as const;

type SystemCollectionId = typeof SystemCollections[keyof typeof SystemCollections];

// Raindrop.io API Types - following official documentation structure
interface RaindropItem {
    readonly _id: number;
    readonly title: string;
    readonly excerpt?: string;
    readonly note?: string;
    readonly link: string;
    readonly cover?: string;
    // Timestamps in ISO 8601 format as per API docs
    readonly created: string; // YYYY-MM-DDTHH:MM:SSZ
    readonly lastUpdate: string; // YYYY-MM-DDTHH:MM:SSZ
    readonly tags?: readonly string[];
    readonly collection?: {
        readonly $id: number;
        readonly title: string;
    };
    readonly highlights?: ReadonlyArray<{
        readonly text: string;
        readonly note?: string;
        readonly color?: string;
        readonly created: string;
    }>;
    readonly type: RaindropType;
    // Additional fields that might be returned but not documented
    readonly [key: string]: any;
}

interface RaindropResponse {
    readonly result: boolean;
    readonly items: readonly RaindropItem[];
    readonly count?: number;
    readonly collectionId?: number;
}

// Add a constant for filter types, extending the RaindropTypes with 'all' option
const FilterTypes = {
    ...RaindropTypes,
    ALL: 'all'
} as const;

type FilterType = typeof FilterTypes[keyof typeof FilterTypes];

// Add new interface for Collection info
interface RaindropCollection {
    readonly _id: number;
    readonly title: string;
    readonly parent?: {
        readonly $id: number;
    };
    readonly access?: {
        readonly level: number;
        readonly draggable: boolean;
    };
    readonly color?: string; // HEX color
    readonly count?: number; // Count of raindrops
    readonly cover?: readonly string[];
    readonly created?: string; // YYYY-MM-DDTHH:MM:SSZ
    readonly expanded?: boolean; // Whether sub-collections are expanded
    readonly lastUpdate?: string; // YYYY-MM-DDTHH:MM:SSZ
    readonly public?: boolean; // Whether publicly accessible
    readonly sort?: number; // Order (descending)
    readonly view?: 'list' | 'simple' | 'grid' | 'masonry';
    // Additional fields that might be returned but not documented
    readonly [key: string]: any;
}

interface CollectionResponse {
    readonly result: boolean;
    readonly items: readonly RaindropCollection[];
}

// Helper function to get the full path segments from the root collection down to the given ID
const getFullPathSegments = (collectionId: number, hierarchy: Map<number, { title: string, parentId?: number }>, idToNameMap: Map<number, string>): string[] => {
    const segments: string[] = [];
    let currentId: number | undefined = collectionId;
    const pathIds: number[] = [];

    // Traverse upwards from the current ID to collect all ancestor IDs
    while (currentId !== undefined && currentId !== 0 && currentId !== SystemCollections.UNSORTED && currentId !== SystemCollections.TRASH) {
        pathIds.push(currentId);
        const collection = hierarchy.get(currentId);
        if (!collection || collection.parentId === undefined) {
            break; // Stop if collection not found or no parent defined
        }
        currentId = collection.parentId;
    }

    // Reverse the collected IDs and find their names to build the path from root down
    pathIds.reverse();

    for (const id of pathIds) {
        const name = idToNameMap.get(id);
        if (name) {
            // Sanitize the name before adding to segments
            const sanitizedName = name.replace(/[\/\\:*?"<>|#%&{}\$\!\'@`+=]/g, '').trim();
            if(sanitizedName) segments.push(sanitizedName);
        } else {
            // If name not found, add a placeholder or skip?
            // For now, let's add a placeholder to indicate the missing segment
            segments.push(`Unknown_Collection_${id}`);
        }
    }

    return segments;
};

const DEFAULT_SETTINGS: RaindropToObsidianSettings = {
    raindropApiToken: '',
    defaultVaultLocation: '',
    fileNameTemplate: '{{title}}',
    showRibbonIcon: true,
    bannerFieldName: 'banner',
};

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
    try {
        const url = buildCollectionApiUrl(collectionId);
        const requestOptions = createAuthenticatedRequestOptions(apiToken);
        
        const response = await fetchWithRetry(
            app,
            url,
            requestOptions,
            rateLimiter,
            3,  // maxRetries
            1000  // delayBetweenRetries
        );
        
        return response as RaindropCollection;
    } catch (error) {
        // Non-fatal error - we can continue without collection info
        // The items will be placed in the base folder instead
        const errorMessage = error instanceof Error ? error.message : 'unknown error';
        console.error(`Error fetching collection ${collectionId}: ${errorMessage}`);
        return null;
    }
}

export class RaindropToObsidian extends Plugin {
    settings!: RaindropToObsidianSettings;
    public rateLimiter: RateLimiter;
    private ribbonIconEl: HTMLElement | undefined;
    private isRibbonShown: boolean = false;
    private templateService: TemplateService;

    constructor(app: App, manifest: PluginManifest) {
        super(app, manifest);
        this.rateLimiter = createRateLimiter(1000); // 1 second delay between requests
        this.templateService = new TemplateService(DEFAULT_TEMPLATE_SETTINGS);
    }

    async onload(): Promise<void> {
        await this.loadSettings();
        this.addSettingTab(new RaindropSettingTab(this.app, this));
        this.updateRibbonIcon();
        
        // Initialize template service with saved settings
        if (this.settings.templateSettings) {
            this.templateService.updateSettings(this.settings.templateSettings);
        }
    }

    onunload(): void {
        if (this.ribbonIconEl) {
            this.ribbonIconEl.remove();
        }
    }

    async loadSettings(): Promise<void> {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings(): Promise<void> {
        await this.saveData(this.settings);
    }

    updateRibbonIcon(): void {
        if (this.settings.showRibbonIcon && !this.isRibbonShown) {
            this.ribbonIconEl = this.addRibbonIcon('droplet', 'Fetch Raindrops', () => {
                const modal = new RaindropFetchModal(this.app, this);
                modal.open();
            });
            this.isRibbonShown = true;
        } else if (!this.settings.showRibbonIcon && this.isRibbonShown) {
            if (this.ribbonIconEl) {
                this.ribbonIconEl.remove();
            }
            this.isRibbonShown = false;
        }
    }

    private async fetchCollectionHierarchy(): Promise<Map<number, { title: string, parentId?: number }>> {
        const hierarchy = new Map<number, { title: string, parentId?: number }>();
        const baseApiUrl = 'https://api.raindrop.io/rest/v1';
        const fetchOptions = createAuthenticatedRequestOptions(this.settings.raindropApiToken);

        try {
            // Fetch root collections
            const rootCollectionsResponse = await fetchWithRetry(
                this.app,
                `${baseApiUrl}/collections`,
                fetchOptions,
                this.rateLimiter
            );
            const rootCollectionsData = rootCollectionsResponse as CollectionResponse;

            // Fetch nested collections
            const nestedCollectionsResponse = await fetchWithRetry(
                this.app,
                `${baseApiUrl}/collections/childrens`,
                fetchOptions,
                this.rateLimiter
            );
            const nestedCollectionsData = nestedCollectionsResponse as CollectionResponse;

            // Combine root and nested collections
            const allCollections = [...rootCollectionsData.items, ...nestedCollectionsData.items];

            // Build hierarchy map
            for (const collection of allCollections) {
                const title = collection.title;
                if (typeof title === 'string' && title.trim()) {  // Only add collections with non-empty titles
                    hierarchy.set(collection._id, {
                        title: title.trim(),
                        parentId: collection.parent?.$id
                    });
                }
            }

            return hierarchy;
        } catch (error) {
            console.error('Error fetching collection hierarchy:', error);
            throw error;
        }
    }

    async fetchRaindrops(options: ModalFetchOptions): Promise<void> {
        const { 
            vaultPath, 
            collections, 
            apiFilterTags, 
            includeSubcollections, 
            appendTagsToNotes,
            useRaindropTitleForFileName,
            tagMatchType,
            filterType,
            fetchOnlyNew,
            updateExisting
        } = options;

        // Validate API token
        if (!this.settings.raindropApiToken) {
            throw new Error('Raindrop.io API token is not set. Please configure it in settings.');
        }

        // Validate vault path
        if (!vaultPath) {
            throw new Error('Vault path is required');
        }

        // Parse collection IDs
        const collectionIds = collections.split(',').map(id => id.trim()).filter(Boolean);
        if (collectionIds.length === 0) {
            throw new Error('No collection IDs provided');
        }

        // Parse filter tags
        const filterTags = apiFilterTags.split(',').map(tag => tag.trim()).filter(Boolean);

        // Fetch collection hierarchy if needed
        let collectionHierarchy: Map<number, { title: string, parentId?: number }> | undefined;
        let idToNameMap: Map<number, string> | undefined;

        if (includeSubcollections) {
            try {
                collectionHierarchy = await this.fetchCollectionHierarchy();
                idToNameMap = new Map(Array.from(collectionHierarchy.entries()).map(([id, data]) => [id, data.title]));
            } catch (error) {
                console.error('Error fetching collection hierarchy:', error);
                new Notice('Failed to fetch collection hierarchy. Proceeding without subcollections.');
            }
        }

        // Process each collection
        for (const collectionId of collectionIds) {
            try {
                // Fetch collection info
                const collectionInfo = await fetchCollectionInfo(
                    this.app,
                    collectionId,
                    this.settings.raindropApiToken,
                    this.rateLimiter
                );

                if (!collectionInfo) {
                    new Notice(`Collection ${collectionId} not found or inaccessible`);
                    continue;
                }

                // Build API URL with query parameters
                const url = buildCollectionApiUrl(collectionId);
                const queryParams = new URLSearchParams();
                
                if (filterTags.length > 0) {
                    queryParams.append('tag', filterTags.join(','));
                    queryParams.append('tagMatch', tagMatchType);
                }
                
                if (filterType && filterType !== FilterTypes.ALL) {
                    queryParams.append('type', filterType);
                }

                const requestOptions = createAuthenticatedRequestOptions(this.settings.raindropApiToken);
                const response = await fetchWithRetry(
                    this.app,
                    `${url}?${queryParams.toString()}`,
                    requestOptions,
                    this.rateLimiter
                );

                if (!response.result || !Array.isArray(response.items)) {
                    throw new Error('Invalid API response format');
                }

                // Process each raindrop
                for (const raindrop of response.items) {
                    try {
                        // Generate file name
                        const fileName = this.generateFileName(raindrop, useRaindropTitleForFileName);
                        
                        // Determine the target path based on collection hierarchy
                        let targetPath = vaultPath;
                        if (includeSubcollections && collectionHierarchy && idToNameMap) {
                            const pathSegments = getFullPathSegments(
                                parseInt(collectionId),
                                collectionHierarchy,
                                idToNameMap
                            );
                            if (pathSegments.length > 0) {
                                targetPath = `${vaultPath}/${pathSegments.join('/')}`;
                            }
                        }

                        // Ensure targetPath is a string
                        if (typeof targetPath !== 'string') {
                            console.error('Invalid target path:', targetPath);
                            continue;
                        }
                        
                        const filePath = `${targetPath}/${fileName}.md`;

                        // Ensure the target directory exists
                        const targetDir = this.app.vault.getAbstractFileByPath(targetPath);
                        if (!targetDir) {
                            await this.app.vault.createFolder(targetPath);
                        }

                        // Check if file exists and handle accordingly
                        const file = this.app.vault.getAbstractFileByPath(filePath);
                        if (file) {
                            if (!updateExisting) {
                                console.log(`Skipping existing file: ${filePath}`);
                                continue;
                            }
                            // Update existing file
                            await this.app.vault.modify(file as TFile, this.createMarkdownContent(raindrop, appendTagsToNotes === 'true'));
                        } else {
                            // Create new file
                            await this.app.vault.create(filePath, this.createMarkdownContent(raindrop, appendTagsToNotes === 'true'));
                        }
                    } catch (error) {
                        console.error(`Error processing raindrop ${raindrop._id}:`, error);
                        new Notice(`Error processing raindrop ${raindrop._id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                }

                new Notice(`Successfully processed collection ${collectionInfo.title}`);
            } catch (error) {
                console.error(`Error processing collection ${collectionId}:`, error);
                new Notice(`Error processing collection ${collectionId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    }

    private createMarkdownContent(raindrop: RaindropItem, appendTags: boolean): string {
        if (this.settings.templateSettings?.enabled) {
            return this.templateService.renderTemplate(raindrop);
        }

        // Fallback to original implementation
        const frontmatter: Record<string, any> = {
            title: raindrop.title,
            url: raindrop.link,
            created: raindrop.created,
            updated: raindrop.lastUpdate,
            type: raindrop.type,
            [this.settings.bannerFieldName]: raindrop.cover || null
        };

        if (appendTags && raindrop.tags) {
            frontmatter.tags = [...raindrop.tags];
        }

        let content = '---\n';
        for (const [key, value] of Object.entries(frontmatter)) {
            if (value !== null && value !== undefined) {
                content += `${key}: ${JSON.stringify(value)}\n`;
            }
        }
        content += '---\n\n';

        if (raindrop.excerpt) {
            content += `${raindrop.excerpt}\n\n`;
        }

        if (raindrop.note) {
            content += `${raindrop.note}\n\n`;
        }

        if (raindrop.highlights && raindrop.highlights.length > 0) {
            content += '## Highlights\n\n';
            for (const highlight of raindrop.highlights) {
                content += `> ${highlight.text}\n`;
                if (highlight.note) {
                    content += `> ${highlight.note}\n`;
                }
                content += '\n';
            }
        }

        return content;
    }

    generateFileName(raindrop: any, useRaindropTitleForFileName: boolean): string {
        // Use the template from settings if title is enabled, otherwise use ID
        const fileNameTemplate = useRaindropTitleForFileName ? this.settings.fileNameTemplate : '{{id}}';
        let fileName = fileNameTemplate;
        
        const replacePlaceholder = (placeholder: string, value: string) => {
            const safeValue = this.sanitizeFileName(value);
            const regex = new RegExp(`{{${placeholder}}}`, 'gi');
            fileName = fileName.replace(regex, safeValue);
        };

        try {
            replacePlaceholder('title', raindrop.title || 'Untitled');
            replacePlaceholder('id', (raindrop._id || 'unknown_id').toString());
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

        let finalFileName = this.sanitizeFileName(fileName);
        if (!finalFileName.trim()) {
            return "Unnamed_Raindrop_" + (raindrop._id || Date.now());
        }
        return finalFileName;
    }
  
    sanitizeFileName(name: string): string {
        return name.replace(/[\/\\:*?"<>|#%&{}\$\!\'@`+=]/g, '').trim();
    }
}

export default RaindropToObsidian;


