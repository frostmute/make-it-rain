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
import { MakeItRainSettings, RaindropType, CONTENT_TYPES, ModalFetchOptions } from './types';

// Import utility functions from consolidated index
// These utilities follow functional programming patterns and handle file operations and API interactions
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

// Use imported RaindropType instead of redefining
type TagMatchType = 'all' | 'any';
const TagMatchTypes = {
    ALL: 'all' as const,
    ANY: 'any' as const
};

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

const DEFAULT_SETTINGS: MakeItRainSettings = {
    apiToken: '',
    defaultFolder: '',
    fileNameTemplate: '{{title}}',
    showRibbonIcon: true,
    bannerFieldName: 'banner',
    isTemplateSystemEnabled: true,
    defaultTemplate: `---
title: "{{title}}"
source: {{link}}
type: {{type}}
created: {{created}}
last_update: {{lastUpdate}}
tags:
{{#each tags}}
  - {{this}}
{{/each}}
{{#if cover}}
banner: {{cover}}
{{/if}}
---

{{#if cover}}
![{{title}}]({{cover}})
{{/if}}

# {{title}}

{{#if excerpt}}
## Description
{{excerpt}}
{{/if}}

{{#if note}}
## Notes
{{note}}
{{/if}}`,
    contentTypeTemplates: {
        link: `---
title: "{{title}}"
source: {{link}}
type: link
created: {{created}}
tags:
{{#each tags}}
  - {{this}}
{{/each}}
---

# {{title}}

{{#if excerpt}}
## Summary
{{excerpt}}
{{/if}}

[Visit Link]({{link}})`,
        article: `---
title: "{{title}}"
source: {{link}}
type: article
created: {{created}}
tags:
{{#each tags}}
  - {{this}}
{{/each}}
{{#if cover}}
banner: {{cover}}
{{/if}}
---

{{#if cover}}
![{{title}}]({{cover}})
{{/if}}

# {{title}}

{{#if excerpt}}
## Summary
{{excerpt}}
{{/if}}

{{#if highlights}}
## Key Points
{{#each highlights}}
> {{text}}
{{#if note}}  *Note:* {{note}}{{/if}}
{{/each}}
{{/if}}`,
        image: `---
title: "{{title}}"
source: {{link}}
type: image
created: {{created}}
tags:
{{#each tags}}
  - {{this}}
{{/each}}
{{#if cover}}
banner: {{cover}}
{{/if}}
---

# {{title}}

{{#if cover}}
![[{{cover}}]]
{{/if}}

{{#if excerpt}}
## Description
{{excerpt}}
{{/if}}`,
        video: `---
title: "{{title}}"
source: {{link}}
type: video
created: {{created}}
tags:
{{#each tags}}
  - {{this}}
{{/each}}
{{#if cover}}
banner: {{cover}}
{{/if}}
---

# {{title}}

{{#if cover}}
![{{title}}]({{cover}})
{{/if}}

{{#if excerpt}}
## Description
{{excerpt}}
{{/if}}

{{#if highlights}}
## Timestamps
{{#each highlights}}
- {{text}}
{{#if note}}  *Comment:* {{note}}{{/if}}
{{/each}}
{{/if}}`,
        document: `---
title: "{{title}}"
source: {{link}}
type: document
created: {{created}}
tags:
{{#each tags}}
  - {{this}}
{{/each}}
{{#if cover}}
banner: {{cover}}
{{/if}}
---

# {{title}}

{{#if excerpt}}
## Summary
{{excerpt}}
{{/if}}

{{#if highlights}}
## Key Points
{{#each highlights}}
- {{text}}
{{#if note}}  *Note:* {{note}}{{/if}}
{{/each}}
{{/if}}`,
        audio: `---
title: "{{title}}"
source: {{link}}
type: audio
created: {{created}}
tags:
{{#each tags}}
  - {{this}}
{{/each}}
{{#if cover}}
banner: {{cover}}
{{/if}}
---

# {{title}}

{{#if excerpt}}
## Description
{{excerpt}}
{{/if}}

{{#if highlights}}
## Timestamps
{{#each highlights}}
- {{text}}
{{#if note}}  *Comment:* {{note}}{{/if}}
{{/each}}
{{/if}}`
    },
    contentTypeTemplateToggles: {
        link: true,
        article: true,
        image: true,
        video: true,
        document: true,
        audio: true
    }
};

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

export class RaindropToObsidian extends Plugin {
    settings: MakeItRainSettings;
    private rateLimiter: RateLimiter;
    private ribbonIconEl: HTMLElement | undefined;
    private isRibbonShown: boolean = false;

    constructor(app: App, manifest: PluginManifest) {
        super(app, manifest);
        this.settings = { ...DEFAULT_SETTINGS };
        this.rateLimiter = createRateLimiter();
    }

    async onload() {
        await this.loadSettings();

        this.addCommand({
            id: 'fetch-raindrops',
            name: 'Fetch Raindrops',
            callback: async () => {
                new RaindropFetchModal(this.app, this).open();
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
    generateFileName(raindrop: any, useRaindropTitleForFileName: boolean): string {
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

            let collectionsData: CollectionResponse | undefined = undefined;

            // Always fetch all collections if options.collections is provided to build complete hierarchy
            if (options.collections) {
                const collectionInputs = options.collections.split(',').map((input: string) => input.trim()).filter((input: string) => input !== '');

                loadingNotice.setMessage('Fetching user collections...');

                // Fetch root collections
                const rootCollectionsResponse = await fetchWithRetry(
                    `${baseApiUrl}/collections`,
                    fetchOptions,
                    this.rateLimiter
                );
                const rootCollectionsData = rootCollectionsResponse as CollectionResponse;

                // Fetch nested collections
                const nestedCollectionsResponse = await fetchWithRetry(
                    `${baseApiUrl}/collections/childrens`,
                    fetchOptions,
                    this.rateLimiter
                );
                const nestedCollectionsData = nestedCollectionsResponse as CollectionResponse;

                // Combine root and nested collections
                let allCollections: RaindropCollection[] = [];
                if (rootCollectionsData?.result && rootCollectionsData?.items) {
                    allCollections = allCollections.concat(rootCollectionsData.items);
                }
                if (nestedCollectionsData?.result && nestedCollectionsData?.items) {
                    allCollections = allCollections.concat(nestedCollectionsData.items);
                }

                // If neither call was successful or no collections returned
                if (allCollections.length === 0) {
                    console.error('API Error fetching collections: No collections returned from both endpoints.');
                    loadingNotice.hide();
                    new Notice('Error fetching user collections. Please check your API token and connection.', 10000);
                    return; // Stop the fetch process
                }

                // Build the hierarchy and name/ID maps from all collections
                allCollections.forEach(col => {
                    collectionNameToIdMap.set(col.title.toLowerCase(), col._id);
                    collectionIdToNameMap.set(col._id, col.title);
                    collectionHierarchy.set(col._id, { title: col.title, parentId: col.parent?.$id });
                });
                collectionsData = { result: true, items: allCollections }; // Store combined data

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

            } else {
                // If options.collections is empty, fetch from all collections (collectionId 0)
                // We still need to fetch collection hierarchy to organize notes properly
                loadingNotice.setMessage('Fetching all collections...');

                // Fetch root collections
                const rootCollectionsResponse = await fetchWithRetry(
                    `${baseApiUrl}/collections`,
                    fetchOptions,
                    this.rateLimiter
                );
                const rootCollectionsData = rootCollectionsResponse as CollectionResponse;

                // Fetch nested collections
                const nestedCollectionsResponse = await fetchWithRetry(
                    `${baseApiUrl}/collections/childrens`,
                    fetchOptions,
                    this.rateLimiter
                );
                const nestedCollectionsData = nestedCollectionsResponse as CollectionResponse;

                // Combine root and nested collections
                let allCollections: RaindropCollection[] = [];
                if (rootCollectionsData?.result && rootCollectionsData?.items) {
                    allCollections = allCollections.concat(rootCollectionsData.items);
                }
                if (nestedCollectionsData?.result && nestedCollectionsData?.items) {
                    allCollections = allCollections.concat(nestedCollectionsData.items);
                }

                if (allCollections.length === 0) {
                    console.error('API Error fetching collections: No collections returned from both endpoints.');
                    loadingNotice.hide();
                    new Notice('Error fetching user collections. Please check your API token and connection.', 10000);
                    return; // Stop the fetch process
                }

                // Build the hierarchy and name/ID maps from all collections
                allCollections.forEach(col => {
                    collectionNameToIdMap.set(col.title.toLowerCase(), col._id);
                    collectionIdToNameMap.set(col._id, col.title);
                    collectionHierarchy.set(col._id, { title: col.title, parentId: col.parent?.$id });
                });

                collectionsData = { result: true, items: allCollections };
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
                // Fetch from specified collection IDs
                for (const collectionId of resolvedCollectionIds) {
                    let hasMore = true;
                    let page = 0;

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

                        const response = await fetchWithRetry(currentApiUrl, fetchOptions, this.rateLimiter);
                        const data = response as RaindropResponse;

                        if (!data.result) {
                            console.error(`API Error for collection ${collectionId}:`, data);
                            new Notice(`Error fetching collection: ${collectionNameForNotice}. Skipping.`, 7000);
                            hasMore = false; // Stop fetching for this collection
                            continue; // Move to the next specified collection
                        }

                        if (data?.items) {
                            allData = allData.concat(data.items);
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
                }
            } else if (fetchMode === 'tags') {
                // Fetch based on tags (uses collectionId 0 endpoint)
                if (options.tagMatchType === TagMatchTypes.ANY && options.apiFilterTags.length > 0) {
                    // Implementation of OR logic for tags (fetch each tag separately)
                    const uniqueItems = new Map<number, RaindropItem>();

                    const tagsArray = options.apiFilterTags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag !== '');

                    for (const tag of tagsArray) {
                        let hasMore = true;
                        let page = 0;

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

                            const response = await fetchWithRetry(this.app, currentApiUrl, fetchOptions, this.rateLimiter);
                            const data = response as RaindropResponse;

                            if (!data.result) {
                                console.error(`API Error for tag ${tag}:`, data);
                                continue; // Skip this tag if there's an error, but continue with others
                            }

                            console.log(`API Response for tag ${tag}:`, {
                                result: data.result,
                                itemCount: data?.items?.length || 0,
                                totalCount: data?.count || 0
                            });

                            if (data?.items) {
                                // Store items in Map using _id as key to automatically handle duplicates
                                data.items.forEach(item => {
                                    if (!uniqueItems.has(item._id)) {
                                        uniqueItems.set(item._id, item);
                                    }
                                });

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
                    }

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

                        const response = await fetchWithRetry(currentApiUrl, fetchOptions, this.rateLimiter);
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

                    const response = await fetchWithRetry(currentApiUrl, fetchOptions, this.rateLimiter);
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
                loadingNotice.setMessage(`Found ${allData.length} raindrops. Processing...`); // Update notice message
                // The loadingNotice will be hidden in processRaindrops
                // Pass all necessary data including collectionsData, resolvedCollectionIds, and collectionIdToNameMap
                await this.processRaindrops(allData, options.vaultPath, options.appendTagsToNotes, options.useRaindropTitleForFileName, loadingNotice, options, collectionsData, resolvedCollectionIds, collectionIdToNameMap);
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
        collectionIdToNameMap: Map<number, string> = new Map<number, string>()
    ): Promise<void> {
        const { app } = this;
        const settingsFMTags = appendTagsToNotes.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag !== '');

        if (vaultPath === undefined) vaultPath = this.settings.defaultFolder;
        const targetFolderPath = vaultPath?.trim() ?? "";

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

        try {
            // Group raindrops by collection
            const raindropsByCollection: { [key: string]: RaindropItem[] } = {};
            for (const raindrop of raindrops) {
                const collectionId = raindrop.collection?.$id?.toString() || 'uncategorized';
                if (!raindropsByCollection[collectionId]) {
                    raindropsByCollection[collectionId] = [];
                }
                raindropsByCollection[collectionId].push(raindrop);
            }

            // Process each collection
            for (const [collectionId, collectionRaindrops] of Object.entries(raindropsByCollection)) {
                try {
                    // Process collection raindrops
                    for (const raindrop of collectionRaindrops) {
                        try {
                            // Process individual raindrop
                            const result = await this.processRaindrop(
                                raindrop,
                                targetFolderPath,
                                settingsFMTags,
                                options,
                                loadingNotice,
                                processed,
                                total,
                                collectionHierarchy,
                                collectionIdToNameMap
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
                } catch (error) {
                    console.error(`Error processing collection ${collectionId}:`, error);
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
        targetFolderPath: string,
        settingsFMTags: string[],
        options: ModalFetchOptions,
        loadingNotice: Notice,
        processed: number,
        total: number,
        collectionHierarchy: Map<number, { title: string, parentId?: number }>,
        collectionIdToNameMap: Map<number, string>
    ): Promise<{ success: boolean; type: 'created' | 'updated' | 'skipped' }> {
        try {
            const { app } = this;
            const generatedFilename = this.generateFileName(raindrop, options.useRaindropTitleForFileName);
            
            // Ensure target directory exists before attempting to write
            if (targetFolderPath && !(await app.vault.adapter.exists(targetFolderPath))) {
                await app.vault.createFolder(targetFolderPath);
            }
            
            const filePath = `${targetFolderPath}/${generatedFilename}.md`;

            // Update loading notice with current processing item
            const raindropTitle = raindrop.title || 'Untitled';
            loadingNotice.setMessage(`Processing '${raindropTitle}'... (${processed}/${total})`);

            let processOutcome: 'created' | 'updated' | 'skipped' = 'created';
            let fileContent = '';

            // Add collection information if available
            const frontmatterData: Record<string, any> = {
                // Basic metadata
                id: raindrop._id,
                title: raindrop.title,
                source: raindrop.link,
                type: raindrop.type,
                created: raindrop.created,
                last_update: raindrop.lastUpdate
            };

            // Add collection information if available
            if (raindrop.collection?.$id && collectionIdToNameMap.has(raindrop.collection.$id)) {
                const collectionId = raindrop.collection.$id;
                const collectionTitle = collectionIdToNameMap.get(collectionId) || 'Unknown';
                // Build the collection path relative to the Raindrop root
                const fullCollectionPathForFrontmatter = this.getFullPathSegments(collectionId, collectionHierarchy, collectionIdToNameMap).join('/');
                
                frontmatterData.collection = {
                    id: collectionId,
                    title: collectionTitle,
                    path: fullCollectionPathForFrontmatter
                };
                
                // Add parent ID if available
                if (collectionHierarchy.has(collectionId)) {
                    const collectionInfo = collectionHierarchy.get(collectionId);
                    if (collectionInfo?.parentId !== undefined) {
                        frontmatterData.collection.parent_id = collectionInfo.parentId;
                    }
                }
            }

            // Process and add tags
            let combinedFMTags: string[] = [...settingsFMTags];
            if (raindrop.tags && Array.isArray(raindrop.tags)) {
                raindrop.tags.forEach((tag: string) => {
                    const trimmedTag = tag.trim();
                    if (trimmedTag && !combinedFMTags.includes(trimmedTag)) {
                        combinedFMTags.push(trimmedTag);
                    }
                });
            }

            // Generate template data
            const templateData = {
                ...frontmatterData,
                tags: combinedFMTags,
                highlights: raindrop.highlights || [],
                bannerFieldName: this.settings.bannerFieldName
            };

            try {
                if (this.settings.isTemplateSystemEnabled) {
                    const template = this.getTemplateForType(raindrop.type as RaindropType, options);
                    fileContent = this.renderTemplate(template, templateData);
                    console.log(`Using ${options.useDefaultTemplate ? 'default' : raindrop.type} template for ${generatedFilename}`);
                    processOutcome = 'created';
                }

                // Create or update the file
                await app.vault.create(filePath, fileContent);
                return { success: true, type: processOutcome };

            } catch (error) {
                console.error(`Error processing file ${generatedFilename}:`, error);
                return { success: false, type: 'skipped' };
            }

        } catch (error) {
            console.error('Error processing raindrop:', error);
            return { success: false, type: 'skipped' };
        }
    }

    private getFullPathSegments(
        collectionId: number,
        collectionHierarchy: Map<number, { title: string, parentId?: number }>,
        collectionIdToNameMap: Map<number, string>
    ): string[] {
        const segments: string[] = [];
        let currentId: number | undefined = collectionId;

        while (currentId !== undefined && currentId !== 0 && currentId !== SystemCollections.UNSORTED && currentId !== SystemCollections.TRASH) {
            const collection = collectionHierarchy.get(currentId);
            if (!collection) break;

            const name = collectionIdToNameMap.get(currentId);
            if (name) {
                segments.unshift(this.sanitizeFileName(name));
            }

            currentId = collection.parentId;
        }

        return segments;
    }

    // The updateRibbonIcon method is already defined at line ~360

    async createNoteFromRaindrop(raindrop: RaindropItem, folderPath: string, fileName: string, appendTags: string[] = [], options: ModalFetchOptions): Promise<void> {
        try {
            // Ensure target directory exists before attempting to write
            if (folderPath && !(await this.app.vault.adapter.exists(folderPath))) {
                await this.app.vault.createFolder(folderPath);
            }

            const { _id: id, title: rdTitle, excerpt: rdExcerpt, note: rdNoteContent, link: rdLink, cover: rdCoverUrl, created: rdCreated, lastUpdate: rdLastUpdate, type: rdType, collection: rdCollection, tags: rdTags, highlights: rdHighlights } = raindrop;
            const safeTitle = sanitizeFileName(rdTitle);
            const altText = safeTitle || 'Cover Image';
            // Prepare tags with appended ones if provided
            const combinedTags = [...(rdTags || [])];
            if (appendTags.length > 0) {
                appendTags.forEach(tag => {
                    const trimmedTag = tag.trim();
                    if (trimmedTag && !combinedTags.includes(trimmedTag)) {
                        combinedTags.push(trimmedTag);
                    }
                });
            }
            // Prepare data for template
            const templateData = {
                id,
                title: rdTitle,
                excerpt: rdExcerpt || '',
                note: rdNoteContent || '',
                link: rdLink,
                cover: rdCoverUrl || '',
                created: rdCreated,
                lastUpdate: rdLastUpdate,
                type: rdType,
                collection: {
                    id: rdCollection?.$id || 0,
                    title: rdCollection?.title || 'Unknown',
                    path: rdCollection?.title || 'Unknown'
                },
                tags: combinedTags,
                highlights: rdHighlights || [],
                bannerFieldName: this.settings.bannerFieldName
            };
            let fileContent = '';
            if (this.settings.isTemplateSystemEnabled) {
                // Use template system if enabled
                let template = this.settings.defaultTemplate;
                // Check for content type specific template if not forced to use default
                if (!options.useDefaultTemplate) {
                    const contentTypeTemplates = this.settings.contentTypeTemplates;
                    const shouldUseTypeTemplate = options.overrideTemplates || this.settings.contentTypeTemplateToggles[rdType as keyof typeof contentTypeTemplates];
                    if (shouldUseTypeTemplate && rdType in contentTypeTemplates && contentTypeTemplates[rdType as keyof typeof contentTypeTemplates].trim() !== '') {
                        template = contentTypeTemplates[rdType as keyof typeof contentTypeTemplates];
                    }
                }
                // Render the template with data
                fileContent = this.renderTemplate(template, templateData);
            } else {
                // Fallback to original hardcoded structure
                // Construct YAML frontmatter
                let descriptionYaml = '';
                if (rdExcerpt) {
                    if (rdExcerpt.includes('\n')) {
                        descriptionYaml = `description: |\n${rdExcerpt.split('\n').map((line: string) => `  ${line}`).join('\n')}`;
                    } else {
                        descriptionYaml = `description: "${rdExcerpt.replace(/"/g, '\\"')}"`;
                    }
                } else {
                    descriptionYaml = `description: ""`;
                }
                let frontmatter = `---\n`;
                frontmatter += `id: ${id}\n`;
                frontmatter += `title: "${rdTitle.replace(/"/g, '\\"')}"\n`;
                frontmatter += `${descriptionYaml}\n`;
                frontmatter += `source: ${rdLink}\n`;
                frontmatter += `type: ${rdType}\n`;
                frontmatter += `created: ${rdCreated}\n`;
                frontmatter += `last_update: ${rdLastUpdate}\n`;
                frontmatter += `collection:\n`;
                frontmatter += `  id: ${rdCollection?.$id || 0}\n`;
                frontmatter += `  title: "${(rdCollection?.title || 'Unknown').replace(/"/g, '\\"')}"\n`;
                frontmatter += `  path: "${(rdCollection?.title || 'Unknown').replace(/"/g, '\\"')}"\n`;
                frontmatter += `tags:\n`;
                if (combinedTags.length > 0) {
                    combinedTags.forEach(tag => {
                        frontmatter += `  - ${tag}\n`;
                    });
                } else {
                    frontmatter += `  - \n`;
                }
                if (rdCoverUrl) {
                    frontmatter += `${this.settings.bannerFieldName}: ${rdCoverUrl}\n`;
                }
                frontmatter += `---\n\n`;
                // Construct note content
                let noteContent = '';
                if (rdCoverUrl) {
                    noteContent += `![${altText}](${rdCoverUrl})\n\n`;
                }
                noteContent += `# ${rdTitle}\n\n`;
                if (rdExcerpt) {
                    noteContent += `## Description\n${rdExcerpt}\n\n`;
                }
                if (rdNoteContent) noteContent += `## Notes\n${rdNoteContent}\n\n`;
                if (rdHighlights && rdHighlights.length > 0) {
                    noteContent += '## Highlights\n';
                    rdHighlights.forEach((highlight: any) => {
                        noteContent += `- ${highlight.text.replace(/\r\n|\r|\n/g, ' ')}\n`;
                        if (highlight.note) {
                            noteContent += `  *Note:* ${highlight.note.replace(/\r\n|\r|\n/g, ' ')}\n`;
                        }
                    });
                    noteContent += '\n';
                }
                fileContent = frontmatter + noteContent;
            }
            // Check if file already exists
            const fullFilePath = `${folderPath}/${fileName}.md`;
            // Manually normalize path by removing leading/trailing slashes and normalizing separators
            const normalizedPath = fullFilePath.replace(/^[\/]+|[\/]+$/g, '').replace(/[\/]+/g, '/');
            if (await this.app.vault.adapter.exists(normalizedPath)) {
                console.log(`File already exists: ${normalizedPath}`);
                new Notice(`Skipped existing note: ${fileName}.md`, 3000);
                return;
            }
            // Create the file
            await this.app.vault.create(normalizedPath, fileContent);
            new Notice(`Created note: ${fileName}.md`, 3000);
            console.log(`Created note: ${normalizedPath}`);
        } catch (error) {
            console.error(`Error creating note for Raindrop ${raindrop._id}:`, error);
            new Notice(`Failed to create note for Raindrop ${raindrop._id}. Check console.`, 5000);
        }
    }

    // Add a method to render templates
    renderTemplate(template: string, data: any): string {
        // Simple Handlebars-like rendering
        return template.replace(/{{#if ([^}]+)}}([\s\S]*?){{\/if}}/g, (match: string, conditionVar: string, content: string) => {
            const varName = conditionVar.trim();
            const value = this.getNestedProperty(data, varName);
            if (value && Array.isArray(value) ? value.length > 0 : !!value) {
                return content;
            } else {
                const elseMatch = content.match(/{{else}}([\s\S]*)$/);
                if (elseMatch) {
                    return elseMatch[1];
                }
                return '';
            }
        }).replace(/{{#each ([^}]+)}}([\s\S]*?){{\/each}}/g, (match: string, arrayVar: string, content: string) => {
            const arrayName = arrayVar.trim();
            const array = this.getNestedProperty(data, arrayName) || [];
            if (!Array.isArray(array)) return '';
            let result = '';
            array.forEach((item: any) => {
                let itemContent = content.replace(/{{this}}/g, String(item));
                itemContent = itemContent.replace(/{{([^}]+)}}/g, (m: string, key: string) => {
                    if (key.includes('.')) {
                        return String(this.getNestedProperty(item, key) || '');
                    }
                    return String(item[key] || '');
                });
                result += itemContent;
            });
            return result;
        }).replace(/{{([^}]+)}}/g, (match: string, key: string) => {
            return String(this.getNestedProperty(data, key) || '');
        });
    }

    getNestedProperty(obj: any, path: string): any {
        return path.split('.').reduce((current: any, prop: string) => {
            return current && current[prop] !== undefined ? current[prop] : undefined;
        }, obj);
    }
}

class RaindropFetchModal extends Modal {
    plugin: RaindropToObsidian;
    vaultPath: string;
    collections: string = '';
    apiFilterTags: string = '';
    includeSubcollections: boolean = false;
    appendTagsToNotes: string = '';
    useRaindropTitleForFileName: boolean = true;
    tagMatchType: 'all' | 'any' = 'all';
    filterType: string = 'all';
    fetchOnlyNew: boolean = false;
    updateExisting: boolean = false;
    useDefaultTemplate: boolean = false;
    overrideTemplates: boolean = false;

    constructor(app: App, plugin: RaindropToObsidian) {
        super(app);
        this.plugin = plugin;
        this.vaultPath = this.plugin.settings.defaultFolder;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: 'Make It Rain Options' });

        contentEl.createEl('h3', { text: 'Fetch Criteria' });

        new Setting(contentEl)
            .setName('Collections (comma-separated names or IDs)')
            .setDesc('Enter collection names or IDs, separated by commas. Leave blank to fetch from all collections (unless tags below are specified).')
            .addText((text: TextComponent) => {
                text.setPlaceholder('Enter Collection ID or Name or leave blank for all')
                    .setValue(this.collections)
                    .onChange((value: string) => { this.collections = value; });
            });

        new Setting(contentEl)
            .setName('Filter by Tags (comma-separated)')
            .setDesc('Filter raindrops by tags.')
            .addText((text: TextComponent) => {
                text.setPlaceholder('e.g., article, project-x')
                    .setValue(this.apiFilterTags)
                    .onChange((value: string) => { this.apiFilterTags = value; });
            });

        new Setting(contentEl)
            .setName('Tag Match Type')
            .setDesc('Should raindrops match ALL specified tags or ANY of them?')
            .addDropdown((dropdown) => {
                dropdown
                    .addOption('all', 'Match ALL tags (AND)')
                    .addOption('any', 'Match ANY tag (OR)')
                    .setValue(this.tagMatchType)
                    .onChange(value => {
                        this.tagMatchType = value as 'all' | 'any';
                    });
            });

        new Setting(contentEl)
            .setName('Include Subcollections')
            .setDesc('If filtering by Collection IDs or Names, also include items from their subcollections.')
            .addToggle((toggle: ToggleComponent) => {
                toggle.setValue(this.includeSubcollections)
                    .onChange((value: boolean) => { this.includeSubcollections = value; });
            });

        // Add type filter dropdown
        new Setting(contentEl)
            .setName('Filter by Type')
            .setDesc('Select the type of raindrops to fetch.')
            .addDropdown((dropdown) => {
                dropdown
                    .addOption('all', 'All Types')
                    .addOption('link', 'Links')
                    .addOption('article', 'Articles')
                    .addOption('image', 'Images')
                    .addOption('video', 'Videos')
                    .addOption('document', 'Documents')
                    .addOption('audio', 'Audio')
                    .setValue(this.filterType)
                    .onChange(value => {
                        this.filterType = value as 'link' | 'article' | 'image' | 'video' | 'document' | 'audio' | 'all';
                    });
            });

        contentEl.createEl('h3', { text: 'Note Options' });

        new Setting(contentEl)
            .setName('Vault Folder (Optional)')
            .setDesc('Target folder for notes. Leave blank for vault root or default setting.')
            .addText((text: TextComponent) => {
                text.setPlaceholder(this.plugin.settings.defaultFolder || 'Vault Root')
                    .setValue(this.vaultPath)
                    .onChange((value: string) => { this.vaultPath = value.trim(); });
            });

        new Setting(contentEl)
            .setName('Append Tags to Note Frontmatter (comma-separated)')
            .setDesc('Additional tags to add to the YAML frontmatter of each created note.')
            .addText((text: TextComponent) => {
                text.setPlaceholder('e.g., #imported/raindrop')
                    .setValue(this.appendTagsToNotes)
                    .onChange((value: string) => { this.appendTagsToNotes = value; });
            });

        new Setting(contentEl)
            .setName('Use Raindrop Title for File Name')
            .setDesc('Use title (via template) for filenames? If off, uses Raindrop ID.')
            .addToggle((toggle: ToggleComponent) => {
                toggle.setValue(this.useRaindropTitleForFileName)
                    .onChange((value: boolean) => { this.useRaindropTitleForFileName = value; });
            });

        // Add fetch only new toggle to modal
        const fetchOnlyNewSetting = new Setting(contentEl)
            .setName('Fetch only new items')
            .setDesc('If the target folder is not empty, only fetch raindrops that have not been imported before.')
            .addToggle((toggle: ToggleComponent) => {
                toggle.setValue(this.fetchOnlyNew)
                    .onChange((value: boolean) => { this.fetchOnlyNew = value; });
            });

        // Add update existing toggle to modal
        const updateExistingSetting = new Setting(contentEl)
            .setName('Update existing notes')
            .setDesc('If a note with the same name exists, update its content if the source raindrop has changed.')
            .addToggle((toggle: ToggleComponent) => {
                toggle.setValue(this.updateExisting)
                    .onChange((value: boolean) => {
                        this.updateExisting = value;
                        // Disable Fetch only new toggle if Update existing is enabled
                        fetchOnlyNewSetting.setDisabled(value);
                        if (value) {
                            // If Update existing is enabled, ensure Fetch only new is false and update its toggle
                            this.fetchOnlyNew = false;
                            (fetchOnlyNewSetting.controlEl.querySelector('input[type="checkbox"]') as HTMLInputElement)!.checked = false; // Update the visual state
                        }
                    });
            });

        contentEl.createEl('h3', { text: 'Template Options' });

        if (this.plugin.settings.isTemplateSystemEnabled) {
            new Setting(contentEl)
                .setName('Use Default Template Only')
                .setDesc('Ignore content type specific templates and use the default template for all items.')
                .addToggle((toggle: ToggleComponent) => {
                    toggle.setValue(this.useDefaultTemplate)
                        .onChange((value: boolean) => {
                            this.useDefaultTemplate = value;
                            // If using default template, disable override option
                            if (value) {
                                this.overrideTemplates = false;
                                (contentEl.querySelector('.override-templates input[type="checkbox"]') as HTMLInputElement)!.checked = false;
                            }
                        });
                });

            new Setting(contentEl)
                .setClass('override-templates')
                .setName('Override Disabled Templates')
                .setDesc('Use content type templates even if they are disabled in settings.')
                .setDisabled(this.useDefaultTemplate)
                .addToggle((toggle: ToggleComponent) => {
                    toggle.setValue(this.overrideTemplates)
                        .onChange((value: boolean) => {
                            this.overrideTemplates = value;
                        });
                });
        } else {
            contentEl.createEl('p', {
                text: 'Template system is disabled. Enable it in plugin settings to use custom templates.',
                cls: 'setting-item-description'
            });
        }

        new Setting(contentEl)
            .addButton((btn: ButtonComponent) => {
                btn.setButtonText('Fetch Raindrops')
                    .setCta()
                    .onClick(async () => {
                        const options: ModalFetchOptions = {
                            vaultPath: this.vaultPath || undefined,
                            collections: this.collections,
                            apiFilterTags: this.apiFilterTags,
                            includeSubcollections: this.includeSubcollections,
                            appendTagsToNotes: this.appendTagsToNotes,
                            useRaindropTitleForFileName: this.useRaindropTitleForFileName,
                            tagMatchType: this.tagMatchType,
                            filterType: this.filterType,
                            fetchOnlyNew: this.fetchOnlyNew,
                            updateExisting: this.updateExisting,
                            useDefaultTemplate: this.useDefaultTemplate,
                            overrideTemplates: this.overrideTemplates
                        };
                        this.close();
                        await this.plugin.fetchRaindrops(options);
                    });
            })
            .addButton((btn: ButtonComponent) => {
                btn.setButtonText('Cancel')
                    .onClick(() => { this.close(); });
            });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

class RaindropToObsidianSettingTab extends PluginSettingTab {
    plugin: RaindropToObsidian;

    constructor(app: App, plugin: RaindropToObsidian) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('img', { attr: { src: "https://i.ibb.co/HTx7TnbN/makeitrain.png", width: "750" } });
        containerEl.createEl('h2', { text: 'Import your Raindrop.io bookmarks into your Obsidian vault with ease.' });
        containerEl.createEl('p').createEl('a', { text: 'Visit Raindrop.io website', href: 'https://raindrop.io', attr: { target: '_blank', rel: 'noopener noreferrer' } });
        containerEl.createEl('hr');

        containerEl.createEl('h3', { text: 'API Configuration' });
        const apiDesc = containerEl.createDiv({ cls: 'setting-item-description' });
        apiDesc.createSpan({ text: 'You need to create a Test Token from your '});
        apiDesc.createEl('a', { text: 'Raindrop.io Apps settings page', href: 'https://app.raindrop.io/settings/integrations', attr: { target: '_blank', rel: 'noopener noreferrer' } });
        apiDesc.createSpan({ text: '.'});

        new Setting(containerEl)
            .setName('Raindrop.io API Token')
            .setDesc('You need to create a Test Token from your Raindrop.io Apps settings page (https://app.raindrop.io/settings/integrations).')
            .addText((text: TextComponent) => {
                text.setPlaceholder('Enter your token')
                    .setValue(this.plugin.settings.apiToken)
                    .onChange(async (value: string) => {
                        this.plugin.settings.apiToken = value;
                        await this.plugin.saveSettings();
                    });
            })
            .addButton((button: ButtonComponent) => {
                button.setButtonText('Verify Token')
                    .setCta()
                    .onClick(() => this.verifyApiToken());
            });

        containerEl.createEl('hr');

        containerEl.createEl('h3', { text: 'General Settings' });

        // Add setting for ribbon icon visibility
        new Setting(containerEl)
            .setName('Show Ribbon Icon')
            .setDesc('Toggle to show or hide the Make It Rain ribbon icon.')
            .addToggle((toggle: ToggleComponent) => {
                toggle.setValue(this.plugin.settings.showRibbonIcon)
                    .onChange(async (value: boolean) => {
                        this.plugin.settings.showRibbonIcon = value;
                        await this.plugin.saveSettings();
                        // Update ribbon icon display immediately
                        this.plugin.updateRibbonIcon();
                    });
            });

        containerEl.createEl('hr');

        containerEl.createEl('h3', { text: 'Note Storage & Naming' });

        new Setting(containerEl)
            .setName('Default Vault Location for Notes')
            .setDesc('Default folder to save notes if not specified in the fetch options modal. Leave blank for vault root.')
            .addText((text: TextComponent) => {
                text.setPlaceholder(this.plugin.settings.defaultFolder || 'Vault Root')
                    .setValue(this.plugin.settings.defaultFolder)
                    .onChange(async (value: string) => {
                        this.plugin.settings.defaultFolder = value.trim();
                        await this.plugin.saveSettings();
                    });
            });

        containerEl.createEl('p', { cls: 'setting-item-description', text: 'Configure how filenames are generated when "Use Raindrop Title" is enabled in the fetch options modal. Uses Handlebars-like syntax.' });
        new Setting(containerEl)
            .setName('File Name Template')
            .setDesc('Placeholders: {{title}}, {{id}}, {{collectionTitle}}, {{date}} (YYYY-MM-DD).')
            .addText((text: TextComponent) => {
                text.setPlaceholder('{{title}}')
                    .setValue(this.plugin.settings.fileNameTemplate)
                    .onChange(async (value) => {
                        this.plugin.settings.fileNameTemplate = value;
                        await this.plugin.saveSettings();
                    });
            });

        // Add setting for custom banner frontmatter field name
        new Setting(containerEl)
            .setName('Banner Frontmatter Field Name')
            .setDesc('Customize the frontmatter field name used for the banner image. Default: banner')
            .addText((text: TextComponent) => {
                text.setPlaceholder('banner')
                    .setValue(this.plugin.settings.bannerFieldName)
                    .onChange(async (value: string) => {
                        this.plugin.settings.bannerFieldName = value.trim();
                        await this.plugin.saveSettings();
                    });
            });

        containerEl.createEl('hr');

        containerEl.createEl('h3', { text: 'Template System' });
        
        new Setting(containerEl)
            .setName('Enable Template System')
            .setDesc('Enable custom templates for formatting your notes.')
            .addToggle((toggle: ToggleComponent) => {
                toggle
                    .setValue(this.plugin.settings.isTemplateSystemEnabled)
                    .onChange(async (value: boolean) => {
                        this.plugin.settings.isTemplateSystemEnabled = value;
                        await this.plugin.saveSettings();
                        this.display();
                    });
            });

        if (this.plugin.settings.isTemplateSystemEnabled) {
            new Setting(containerEl)
                .setName('Default Template')
                .setDesc('The default template used for all content types unless overridden.')
                .addTextArea((text) => {
                    text
                        .setPlaceholder('Enter your default template')
                        .setValue(this.plugin.settings.defaultTemplate)
                        .onChange(async (value) => {
                            this.plugin.settings.defaultTemplate = value;
                            await this.plugin.saveSettings();
                        });
                    text.inputEl.rows = 10;
                    text.inputEl.cols = 50;
                });

            containerEl.createEl('h4', { text: 'Content Type Templates' });
            containerEl.createEl('p', { 
                text: 'Specify templates for different content types. If disabled or left empty, the default template will be used.',
                cls: 'setting-item-description'
            });

            for (const type of CONTENT_TYPES) {
                const templateContainer = containerEl.createDiv({ cls: 'template-container' });
                
                // Add toggle for this content type template
                new Setting(templateContainer)
                    .setName(`Use Custom ${type.charAt(0).toUpperCase() + type.slice(1)} Template`)
                    .setDesc(`Enable/disable custom template for ${type} content.`)
                    .addToggle((toggle) => {
                        toggle
                            .setValue(this.plugin.settings.contentTypeTemplateToggles[type])
                            .onChange(async (value) => {
                                this.plugin.settings.contentTypeTemplateToggles[type] = value;
                                await this.plugin.saveSettings();
                                this.display();
                            });
                    });

                // Only show template textarea if toggle is enabled
                if (this.plugin.settings.contentTypeTemplateToggles[type]) {
                    new Setting(templateContainer)
                        .setName(`${type.charAt(0).toUpperCase() + type.slice(1)} Template`)
                        .setDesc(`Template for ${type} content.`)
                        .addTextArea((text) => {
                            text
                                .setPlaceholder(`Enter template for ${type} content`)
                                .setValue(this.plugin.settings.contentTypeTemplates[type])
                                .onChange(async (value) => {
                                    this.plugin.settings.contentTypeTemplates[type] = value;
                                    await this.plugin.saveSettings();
                                });
                            text.inputEl.rows = 6;
                            text.inputEl.cols = 50;
                        });
                }
            }
        }

        containerEl.createEl('hr');

        const footer = containerEl.createDiv({ cls: 'setting-footer' });
        footer.createEl('p', { text: 'Need help configuring or using the plugin? Check the README.' });
        footer.createEl('a', { text: 'Plugin GitHub Repository', href: 'https://github.com/frostmute/make-it-rain', attr: { target: '_blank', rel: 'noopener noreferrer' } });
    }

    async verifyApiToken(): Promise<void> {
        const { apiToken } = this.plugin.settings;

        if (!apiToken) {
            new Notice('Please enter an API token first.', 5000);
            return;
        }

        new Notice('Verifying API token...', 3000);

        const baseApiUrl = 'https://api.raindrop.io/rest/v1';
        const fetchOptions: RequestInit = {
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json'
            }
        };

        try {
            // Use a simple endpoint to test the token, e.g., fetching user info
            const response = await request({
                url: `${baseApiUrl}/user`,
                method: 'GET',
                headers: fetchOptions.headers as Record<string, string>
            });

            let data;
            if (typeof response === 'string') {
                data = JSON.parse(response);
            } else {
                data = response;
            }

            if (data.result) {
                new Notice('API Token is valid!', 5000);
            } else {
                // Handle specific API error messages if available
                const errorMessage = data.message || data.error || 'Invalid API token or connection issue.';
                new Notice(`API Token verification failed: ${errorMessage}`, 10000);
                console.error('API Token verification failed:', data);
            }
        } catch (error) {
            let errorMsg = 'An error occurred during token verification.';
            if (error instanceof Error) errorMsg = error.message;
            else if (typeof error === 'string') errorMsg = error;
            new Notice(`API Token verification failed: ${errorMsg}`, 10000);
            console.error('Error verifying API token:', error);
        }
    }
}

