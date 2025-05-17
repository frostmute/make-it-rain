import { App, Notice, Plugin, PluginSettingTab, Setting, Modal, TextComponent, ButtonComponent, ToggleComponent, PluginManifest, TFile, TAbstractFile } from 'obsidian';
import { request, RequestUrlParam } from 'obsidian';


// Raindrop.io API Types
interface RaindropItem {
    _id: number;
    title: string;
    excerpt?: string;
    note?: string;
    link: string;
    cover?: string;
    created: string;
    lastUpdate: string;
    tags?: string[];
    collection?: {
        $id: number;
        title: string;
    };
    highlights?: Array<{
        text: string;
        note?: string;
        color?: string;
        created: string;
    }>;
    type: 'link' | 'article' | 'image' | 'video' | 'document' | 'audio';
}

interface RaindropResponse {
    result: boolean;
    items: RaindropItem[];
    count?: number;
    collectionId?: number;
}

interface ModalFetchOptions {
    vaultPath?: string;
    collections: string;
    apiFilterTags: string;
    includeSubcollections: boolean;
    appendTagsToNotes: string;
    useRaindropTitleForFileName: boolean;
    tagMatchType: 'all' | 'any';
    filterType?: 'link' | 'article' | 'image' | 'video' | 'document' | 'audio' | 'all';
    fetchOnlyNew?: boolean;
    updateExisting: boolean;
}

interface RaindropToObsidianSettings {
    raindropApiToken: string;
    defaultVaultLocation: string;
    fileNameTemplate: string;
    showRibbonIcon: boolean;
    bannerFieldName: string;
}

// Add new interface for Collection info
interface RaindropCollection {
    _id: number;
    title: string;
    parent?: {
        $id: number;
    };
}

interface CollectionResponse {
    result: boolean;
    items: RaindropCollection[];
}

// Helper function to get the full path segments from the root collection down to the given ID
const getFullPathSegments = (collectionId: number, hierarchy: Map<number, { title: string, parentId?: number }>, idToNameMap: Map<number, string>): string[] => {
    const segments: string[] = [];
    let currentId: number | undefined = collectionId;
    const pathIds: number[] = [];

    // Traverse upwards from the current ID to collect all ancestor IDs
    while (currentId !== undefined && currentId !== 0 && currentId !== -1 && currentId !== -99) {
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

// Rate limiting and retry utilities
class RateLimiter {
    private requestCount: number = 0;
    private resetTime: number = Date.now() + 60000; // 1 minute window
    private readonly maxRequests: number = 60; // More conservative limit (Raindrop.io docs say 120/min, but we're being cautious)

    async checkLimit(): Promise<void> {
        const now = Date.now();
        // Reset counter if we're in a new time window
        if (now >= this.resetTime) {
            this.requestCount = 0;
            this.resetTime = now + 60000;
        }
        
        // If we've hit the limit, wait until the next window
        if (this.requestCount >= this.maxRequests) {
            const waitTime = this.resetTime - now;
            await new Promise(resolve => setTimeout(resolve, waitTime));
            this.requestCount = 0;
            this.resetTime = Date.now() + 60000;
        }
        
        // Add a small delay between requests to avoid hitting rate limits
        // This helps spread out requests more evenly
        if (this.requestCount > 0) {
            // Add a 300ms delay between requests
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        this.requestCount++;
    }
    
    // Method to reset the counter when we hit a rate limit
    resetCounter(): void {
        this.requestCount = 0;
        this.resetTime = Date.now() + 60000; // Reset the window
    }
}

// Fetch wrapper with built-in retry logic and rate limiting
// This ensures reliable API communication even with temporary failures
async function fetchWithRetry(
    appOrUrl: App | string, 
    urlOrOptions: string | RequestInit, 
    optionsOrRateLimiter?: RequestInit | RateLimiter,
    rateLimiterOrMaxRetries?: RateLimiter | number,
    maxRetries: number = 3
): Promise<any> {
    let url: string;
    let options: RequestInit;
    let rateLimiter: RateLimiter;

    // Handle both call patterns:
    // 1. (app: App, url: string, options: RequestInit, rateLimiter: RateLimiter, maxRetries?: number)
    // 2. (url: string, options: RequestInit, rateLimiter: RateLimiter, maxRetries?: number)
    if (typeof appOrUrl === 'string') {
        // Second pattern (url, options, rateLimiter, maxRetries?)
        url = appOrUrl;
        options = urlOrOptions as RequestInit;
        rateLimiter = optionsOrRateLimiter as RateLimiter;
        if (typeof rateLimiterOrMaxRetries === 'number') {
            maxRetries = rateLimiterOrMaxRetries;
        }
    } else {
        // First pattern (app, url, options, rateLimiter, maxRetries?)
        url = urlOrOptions as string;
        options = optionsOrRateLimiter as RequestInit;
        rateLimiter = rateLimiterOrMaxRetries as RateLimiter;
    }

    // Type checking
    if (typeof url !== 'string') {
        throw new Error('URL must be a string');
    }
    if (!options || typeof options !== 'object') {
        throw new Error('Options must be an object');
    }
    if (!rateLimiter || typeof rateLimiter.checkLimit !== 'function') {
        throw new Error('Rate limiter must be provided with checkLimit method');
    }
    
    return fetchWithRetryInternal(url, options, rateLimiter, maxRetries);
}

async function fetchWithRetryInternal(url: string, options: RequestInit, rateLimiter: RateLimiter, maxRetries: number = 3): Promise<any> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            // Check rate limit before each attempt
            await rateLimiter.checkLimit();
            
            // Use Obsidian's request function which handles CORS
            const response = await request({
                url,
                method: options.method as 'GET' | 'POST' | 'PUT' | 'DELETE',
                headers: options.headers as Record<string, string>,
                body: options.body as string | undefined
            });
            
            // Parse the response if it's a string (JSON)
            if (typeof response === 'string') {
                return JSON.parse(response);
            }
            return response;
            
        } catch (error: any) {
            console.error(`Error in fetchWithRetry (attempt ${attempt + 1}/${maxRetries}):`, error);
            
            // If we've reached max retries, rethrow the error
            if (attempt >= maxRetries - 1) {
                throw error;
            }
            
            // Special handling for rate limit errors (429)
            let delay = Math.pow(2, attempt) * 1000; // Default exponential backoff
            
            if (error.message && error.message.includes('status 429')) {
                // For rate limit errors, use a much longer delay with progressive backoff
                console.log('Rate limit exceeded (429). Adding extra delay...');
                
                // More aggressive backoff for rate limit errors
                // First retry: 10s, Second retry: 30s
                delay = Math.max(delay, (attempt + 1) * 10000);
                
                // Reset the rate limiter's counter to avoid immediate retry
                rateLimiter.resetCounter();
                
                // Add a user-visible notice about the rate limiting
                new Notice(`Raindrop API rate limit reached. Waiting ${delay/1000} seconds before retrying...`, 5000);
            }
            
            console.log(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    throw new Error(`Failed after ${maxRetries} attempts`);
}

// Collection info fetching with error handling and rate limiting
async function fetchCollectionInfo(app: App, collectionId: string, apiToken: string, rateLimiter: RateLimiter): Promise<RaindropCollection | null> {
    const fetchOptions: RequestInit = {
        headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
        }
    };

    try {
        // Fetch collection details - this helps with folder organization
        const response = await fetchWithRetry(app, `https://api.raindrop.io/rest/v1/collection/${collectionId}`, fetchOptions, rateLimiter);
        const data = response;
        
        if (data.result && data.item) {
            return data.item;
        }
        console.error('Failed to fetch collection info:', data);
        return null;
    } catch (error) {
        // Non-fatal error - we can continue without collection info
        // The items will be placed in the base folder instead
        console.error(`Error fetching collection info for ${collectionId}:`, error);
        return null;
    }
}

// Folder creation with proper error handling (creates full path)
async function createFolderStructure(app: App, fullPath: string): Promise<void> {
    if (!fullPath) return; // Don't try to create empty path

    try {
        // Check if the folder exists, create if not
        const folderExists = await app.vault.adapter.exists(fullPath);
        if (!folderExists) {
            console.log(`Creating folder: ${fullPath}`);
            await app.vault.createFolder(fullPath);
        } else {
            // Verify it's actually a folder if it exists
             const existingFile = app.vault.getAbstractFileByPath(fullPath);
            if (existingFile && !existingFile.hasOwnProperty('children')) {
                throw new Error(`Path exists but is not a folder: ${fullPath}`);
            }
        }
    } catch (error) {
         let errorMsg = 'folder creation failed';
         if (error instanceof Error) errorMsg = error.message;
         throw new Error(`Failed to create/verify folder: ${fullPath}. Error: ${errorMsg}.`);
    }
}

export default class RaindropToObsidian extends Plugin {
  settings: RaindropToObsidianSettings;
  private rateLimiter: RateLimiter;
  private ribbonIconEl: HTMLElement | undefined; // Property to store the ribbon icon element

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);
    this.settings = { ...DEFAULT_SETTINGS };
    this.rateLimiter = new RateLimiter();
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

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  sanitizeFileName(name: string): string {
    const invalidChars = /[\/\\:*?"<>|#%&{}$!@'`+=]/g;
    const replacement = '';
    let sanitizedName = name.replace(invalidChars, replacement).trim();
    if (!sanitizedName) sanitizedName = "Unnamed_Raindrop";
    return sanitizedName.substring(0, 200);
  }

  generateFileName(raindrop: any, useRaindropTitleForFileName: boolean): string {
    const { fileNameTemplate } = this.settings;

    if (!useRaindropTitleForFileName) {
      return this.sanitizeFileName((raindrop.id || 'unknown_id').toString());
    }

    let fileName = fileNameTemplate;
    const replacePlaceholder = (placeholder: string, value: string) => {
        const safeValue = this.sanitizeFileName(value);
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

    let finalFileName = this.sanitizeFileName(fileName);
    if (!finalFileName.trim()) {
        return "Unnamed_Raindrop_" + (raindrop._id || Date.now()); // Use _id consistently
    }
    return finalFileName;
  }

  async fetchRaindrops(options: ModalFetchOptions) {
    const baseApiUrl = 'https://api.raindrop.io/rest/v1';
    const fetchOptions: RequestInit = {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${this.settings.raindropApiToken}`
        }
    };

    const loadingNotice = new Notice('Starting Raindrop fetch...', 0); // 0 duration makes it persistent

    try {
        let allData: RaindropItem[] = [];
        const perPage = 50; // Max items per page allowed by Raindrop.io API

        // Add error handling for API token
        if (!this.settings.raindropApiToken) {
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
            const collectionInputs = options.collections.split(',').map(input => input.trim()).filter(input => input !== '');

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

        const searchParameterString = options.apiFilterTags.split(',').map(tag => tag.trim()).filter(tag => tag !== '').join(' '); // Space-separated for AND logic

        let fetchMode: 'collections' | 'tags' | 'all' = 'all';

        // If user specified collections OR tags, we treat it as filtered fetch
        // Even if collections field is empty, if tags are present, we fetch via tags endpoint (collectionId 0)
        if (resolvedCollectionIds.length > 0) {
            fetchMode = 'collections';
        } else if (searchParameterString || (options.tagMatchType === 'any' && options.apiFilterTags.length > 0)) {
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
            if (options.tagMatchType === 'any' && options.apiFilterTags.length > 0) {
                // Implementation of OR logic for tags (fetch each tag separately)
                const uniqueItems = new Map<number, RaindropItem>();

                const tagsArray = options.apiFilterTags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

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

                        const response = await fetchWithRetry(currentApiUrl, fetchOptions, this.rateLimiter);
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
            if (resolvedCollectionIds.length > 0 || searchParameterString || (options.tagMatchType === 'any' && options.apiFilterTags.length > 0)) {
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

  async processRaindrops(raindrops: RaindropItem[], vaultPath: string | undefined, appendTagsToNotes: string, useRaindropTitleForFileName: boolean, loadingNotice: Notice, options: ModalFetchOptions, collectionsData?: CollectionResponse, resolvedCollectionIds: number[] = [], collectionIdToNameMap: Map<number, string> = new Map<number, string>()) {
    const { app } = this;
    const settingsFMTags = appendTagsToNotes.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

    if (vaultPath === undefined) vaultPath = this.settings.defaultVaultLocation;
    const targetFolderPath = vaultPath?.trim() ?? "";

    // Declare and populate maps and helper function within this scope
    const collectionHierarchy = new Map<number, { title: string, parentId?: number }>();

    // If collectionsData was fetched (meaning user filtered by collection), build the hierarchy map
    if (collectionsData?.result) {
        collectionsData.items.forEach(col => {
            collectionHierarchy.set(col._id, { title: col.title, parentId: col.parent?.$id });
        });
    }

    // Helper function to get ancestor IDs from a given collection ID up to the root
    const getAncestorIds = (collectionId: number): number[] => {
        const ancestors: number[] = [];
        
        // First add the starting collection ID itself
        ancestors.push(collectionId);
        
        let currentId: number | undefined = collectionId;

        // Traverse upwards until a system collection or unknown parent is reached
        while (currentId !== undefined && currentId !== 0 && currentId !== -1 && currentId !== -99) {
            const collection = collectionHierarchy.get(currentId);
            if (!collection || collection.parentId === undefined) {
                // Stop if collection not found in hierarchy map or no parent defined
                break;
            }
            // Add the parent ID to the list
            ancestors.push(collection.parentId);
            // Move up to the parent
            currentId = collection.parentId;
        }
        return ancestors; // Returns the current collection ID and all ancestors up to the root
    };

    // Convert resolvedCollectionIds to a set of SANITIZED names for easier lookup (only needed if filtering by name)
    const resolvedCollectionNames = new Set<string>();
    // Only build this set if we have collection names resolved
    if (collectionIdToNameMap.size > 0) {
        resolvedCollectionIds.forEach(id => {
            const name = collectionIdToNameMap.get(id);
            if (name) {
                // Sanitize the name before adding to the set, and convert to lower case
                resolvedCollectionNames.add(this.sanitizeFileName(name).toLowerCase());
            }
        });
    }

    // Create base folder if needed
    if (targetFolderPath) {
        try {
            const folder = app.vault.getAbstractFileByPath(targetFolderPath);
            if (!folder) {
                console.log(`Creating base folder: ${targetFolderPath}`);
                await app.vault.createFolder(targetFolderPath);
            } else if (!folder.hasOwnProperty('children')) {
                throw new Error(`Path exists but is not a folder: ${targetFolderPath}`);
            }
        } catch (error) {
            let errorMsg = 'folder creation failed';
            if (error instanceof Error) errorMsg = error.message;
            new Notice(`Failed to create/verify base folder: ${targetFolderPath}. Error: ${errorMsg}.`, 10000);
            console.error("Error with folder operation:", error);
            loadingNotice.hide(); // Dismiss notice on critical error
            return; // Stop processing if base folder cannot be created
        }
    }

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    let updatedCount = 0; // Counter for updated notes
    const total = raindrops.length;
    let processed = 0;

    // Group raindrops by their direct collection ID (needed for path building)
    const raindropsByCollection: { [key: string]: RaindropItem[] } = {};
    for (const raindrop of raindrops) {
        const collectionId = raindrop.collection?.$id?.toString() || 'uncategorized';
        if (!raindropsByCollection[collectionId]) {
            raindropsByCollection[collectionId] = [];
        }
        raindropsByCollection[collectionId].push(raindrop);
    }

    // Process raindrops collection by collection
    for (const [collectionId, collectionRaindrops] of Object.entries(raindropsByCollection)) {

        // Determine the folder path within the target folder
        let relativeFolderPathSegments: string[] = [];
        let collectionTitleForNotice = 'Unknown Collection'; // Declare once here

        const currentCollectionId = parseInt(collectionId, 10); // collectionId from Object.entries is a string

        // Only attempt complex path building if we have hierarchy data and it's not a system/uncategorized collection
        // Note: We should still build hierarchy even when no specific collections are selected
        if (!isNaN(currentCollectionId) && currentCollectionId > 0 && collectionHierarchy.size > 0) {

             // Find the deepest user-specified ancestor in the current collection's ancestry
             // Note: getAncestorIds now includes the current collection ID as the first element
             const ancestorIds = getAncestorIds(currentCollectionId);
             let deepestSpecifiedAncestorId: number | undefined = undefined;
             
             // If no specific collections are selected (resolvedCollectionIds is empty),
             // we need to build the full path from the root
             if (resolvedCollectionIds.length === 0) {
                 // For no filters, we don't set a deepestSpecifiedAncestorId
                 // This will make the traversal go all the way to the root
                 deepestSpecifiedAncestorId = undefined;
             }
             // If the current collection itself is a user-specified collection, prioritize it
             else if (resolvedCollectionIds.includes(currentCollectionId)) {
                 deepestSpecifiedAncestorId = currentCollectionId;
             } else {
                 // Check ancestors from closest to furthest
                 for (const ancestorId of ancestorIds) {
                     if (resolvedCollectionIds.includes(ancestorId)) {
                         deepestSpecifiedAncestorId = ancestorId; // Found the deepest ancestor that is specified
                         break; // Stop at the deepest specified ancestor
                     }
                 }
             }

            // Build a path for this collection
            // For collections with a specified ancestor or when no filters are selected
            if (deepestSpecifiedAncestorId !== undefined || resolvedCollectionIds.length === 0) {
                  // Reconstruct the path segments from the current collection up to the root
                  const pathSegments: string[] = [];
                  let currentTraverseId: number | undefined = currentCollectionId;
                  const tempSegments: string[] = [];

                  // Build the full path from the current collection up to the root
                  // When no filters are selected, we'll build the complete hierarchy
                  while (currentTraverseId !== undefined && currentTraverseId !== 0 && currentTraverseId !== -1 && currentTraverseId !== -99) {
                       const collection = collectionHierarchy.get(currentTraverseId);
                       if (!collection) break; // Should not happen
                       
                       // Add the current collection's title to the path segments
                       const sanitizedTitle = this.sanitizeFileName(collection.title);
                       if (sanitizedTitle) {
                           tempSegments.unshift(sanitizedTitle);
                       }
                       
                       // When filters are selected, stop at the specified ancestor
                       // When no filters are selected, this condition is never true (deepestSpecifiedAncestorId is undefined)
                       if (resolvedCollectionIds.length > 0 && currentTraverseId === deepestSpecifiedAncestorId) {
                           break;
                       }
                       
                       // Move to parent to continue building the path upwards
                       currentTraverseId = collection.parentId;
                  }

                  relativeFolderPathSegments = tempSegments;

                  // Update notice title to show path
                  collectionTitleForNotice = relativeFolderPathSegments.join('/');

              } else {
                  // If no user-specified ancestor is found (and current is not specified),
                  // place it under an 'Uncategorized' folder within the target folder.
                  console.warn(`Collection path did not contain a user-specified ancestor or was not the specified collection itself. Placing in Uncategorized: Collection ID ${currentCollectionId}`);
                  relativeFolderPathSegments = ['Uncategorized'];
                  collectionTitleForNotice = 'Uncategorized';
              }

        } else if (currentCollectionId === -1 || currentCollectionId === 0) {
             // Handle Unsorted and All Collections (should typically go to targetFolderPath directly)
             relativeFolderPathSegments = []; // No subfolder needed relative to target
             collectionTitleForNotice = currentCollectionId === -1 ? 'Unsorted' : 'All Items';
        } else if (collectionId === 'uncategorized') {
             // Handle items without a collection ID explicitly grouped as 'uncategorized'
             relativeFolderPathSegments = ['Uncategorized'];
             collectionTitleForNotice = 'Uncategorized';
        } else {
             // Fallback for cases where collectionHierarchy is not available (user didn't filter by collection)
             // or other unexpected IDs. Place in target folder.
             relativeFolderPathSegments = [];
             collectionTitleForNotice = 'Unknown Collection';
             console.warn(`Could not determine collection path for ID: ${collectionId}. Placing in target folder.`);
        }

        // Construct the full desired folder path within the vault by joining target and relative segments
        const fullDesiredFolderPath = relativeFolderPathSegments.length > 0
                                      ? `${targetFolderPath}${targetFolderPath ? '/' : ''}${relativeFolderPathSegments.join('/')}`
                                      : targetFolderPath; // Use targetFolderPath directly if no relative segments

        // Manually create the folder structure step by step
        // Start from the targetFolderPath and create each segment of the relative path
        let currentPath = targetFolderPath;
        const pathSegmentsToCreate = relativeFolderPathSegments;

        for (const segment of pathSegmentsToCreate) {
             if (!segment) continue; // Skip empty segments
             currentPath = currentPath ? `${currentPath}/${segment}` : segment; // Build the path segment by segment
             try {
                  // createFolderStructure now handles full paths and checks existence
                  await createFolderStructure(app, currentPath);
             } catch (error) {
                  let errorMsg = 'folder creation failed';
                  if (error instanceof Error) errorMsg = error.message;
                  new Notice(`Failed to create/verify folder: ${currentPath}. Error: ${errorMsg}.`, 10000);
                  console.error("Error with folder operation:", error);
                  // Stop creating deeper levels for this path on error
                  break; // Exit the folder creation loop
             }
        }
        // The final currentPath is the path to the deepest successfully created folder for this collection group
        const collectionFolderPath = currentPath; // Use this path for saving notes

        // Process raindrops in this collection group
        for (const raindrop of collectionRaindrops) {
            try {
                const generatedFilename = this.generateFileName(raindrop, useRaindropTitleForFileName);
                // Use the determined collectionFolderPath for the file path
                const filePath = `${collectionFolderPath}/${generatedFilename}.md`;

                // Update loading notice with current processing item
                const raindropTitle = raindrop.title || 'Untitled';
                loadingNotice.setMessage(`Processing '${raindropTitle}' in '${collectionTitleForNotice}'... (${processed}/${total})`);

                const fileExists = await app.vault.adapter.exists(filePath);
                let processOutcome = 'created'; // 'created', 'updated', 'skipped', 'error'

                if (fileExists) {
                    // If file exists, check update conditions based on options
                    if (options.fetchOnlyNew) {
                        console.log(`Skipping existing file (Fetch Only New enabled): ${filePath}`);
                        processOutcome = 'skipped';
                    } else if (options.updateExisting) {
                        // --- Update Existing Logic ---
                        console.log(`Checking existing file for update: ${filePath}`);
                        let shouldUpdate = false;
                        try {
                            const existingFile = app.vault.getAbstractFileByPath(filePath);
                            if (existingFile instanceof TFile) {
                                const existingContent = await app.vault.cachedRead(existingFile);
                                const match = existingContent.match(/^---\n([^\s\S]*?)\n---/);
                                if (match && match[1]) {
                                    const frontmatterRaw = match[1];
                                    // Using regex to find the ID and last_update fields
                                    const idMatch = frontmatterRaw.match(/^id:\s*(\d+)/m); // 'm' flag for multiline
                                    const lastUpdateMatch = frontmatterRaw.match(/^last_update:\s*(.*)/m);

                                    const existingRaindropId = idMatch && idMatch[1] ? parseInt(idMatch[1], 10) : null;
                                    const existingLastUpdate = lastUpdateMatch && lastUpdateMatch[1] ? new Date(lastUpdateMatch[1]) : null;
                                    const fetchedLastUpdate = new Date(raindrop.lastUpdate);

                                    // Check if it's the same raindrop and if fetched data is newer
                                    if (existingRaindropId === raindrop._id) {
                                        // Compare timestamps. Also update if existing timestamp is invalid or missing.
                                        if (!existingLastUpdate || isNaN(existingLastUpdate.getTime()) || fetchedLastUpdate > existingLastUpdate) {
                                            console.log(`Update needed for ${filePath}: Raindrop.io data is newer or existing timestamp invalid.`);
                                            shouldUpdate = true;
                                        } else {
                                            console.log(`No update needed for ${filePath}: Raindrop.io data is not newer.`);
                                            // This will be handled as skipped below
                                        }
                                    } else {
                                         // File exists but doesn't match this raindrop ID - treat as skipped
                                         console.warn(`File exists with matching name but different Raindrop ID: ${filePath} (Existing ID: ${existingRaindropId}, Fetched ID: ${raindrop._id}). Skipping.`);
                                         // This will be handled as skipped below
                                    }
                                } else {
                                    // File exists but no valid frontmatter found or missing ID/last_update - treat as skipped
                                    console.warn(`File exists but has no valid frontmatter or required fields: ${filePath}. Skipping.`);
                                    // This will be handled as skipped below
                                }
                            } else {
                                 // Path exists but is not a file (e.g., a folder) - treat as skipped
                                 console.warn(`Path exists but is not a file: ${filePath}. Skipping.`);
                                 // This will be handled as skipped below
                            }
                        } catch (readError) {
                            console.error(`Error reading existing file ${filePath}:`, readError);
                            processOutcome = 'error'; // Count as error if reading fails
                        }

                        if (shouldUpdate) {
                            processOutcome = 'updated';
                        } else if (processOutcome !== 'error') {
                            // If update was not needed and no error occurred during read/check
                            processOutcome = 'skipped';
                        }
                        // If shouldUpdate is true, flow continues below to generate content and overwrite

                    } else {
                        // File exists, neither fetchOnlyNew nor updateExisting is true - skip
                    console.log(`Skipping existing file: ${filePath}`);
                        processOutcome = 'skipped';
                    }
                }
                // --- End Existing File Handling ---

                // If outcome is not skipped or error (meaning it's a new file or needs update)
                if (processOutcome === 'created' || processOutcome === 'updated') {
                const rdTitle = raindrop.title || 'Untitled Raindrop';
                const rdNoteContent = raindrop.note || '';
                const rdExcerpt = raindrop.excerpt || '';
                const rdSourceUrl = raindrop.link;
                const rdCoverUrl = raindrop.cover || '';

                let fileContent = '---\n';
                    // Add Raindrop ID to frontmatter for future updates
                    fileContent += `id: ${raindrop._id}\n`;
                fileContent += `title: "${rdTitle.replace(/"/g, '\\"')}"\n`;
                
                if (rdExcerpt) {
                    if (rdExcerpt.includes('\n')) {
                        fileContent += 'description: |\n';
                        rdExcerpt.split('\n').forEach((line: string) => 
                            fileContent += `  ${line.replace(/\s+$/, '')}\n`
                        );
                    } else {
                        fileContent += `description: "${rdExcerpt.replace(/"/g, '\\"')}"\n`;
                    }
                }
                
                fileContent += `source: ${rdSourceUrl}\n`;
                fileContent += `type: ${raindrop.type}\n`;
                fileContent += `created: ${raindrop.created}\n`;
                fileContent += `last_update: ${raindrop.lastUpdate}\n`;

                // Add collection information to frontmatter
                if (raindrop.collection?.$id && collectionIdToNameMap.has(raindrop.collection.$id)) {
                    const collectionId = raindrop.collection.$id;
                    const collectionTitle = collectionIdToNameMap.get(collectionId) || 'Unknown';
                     // Build the collection path relative to the Raindrop root for full frontmatter path
                    const fullCollectionPathForFrontmatter = getFullPathSegments(collectionId, collectionHierarchy, collectionIdToNameMap).join('/');

                    fileContent += `collection:\n`;
                    fileContent += `  id: ${collectionId}\n`;
                    fileContent += `  title: "${collectionTitle.replace(/"/g, '\\"')}"\n`;
                    fileContent += `  path: "${fullCollectionPathForFrontmatter.replace(/"/g, '\\"')}"\n`;

                    if (collectionHierarchy.has(collectionId)) {
                         const collectionInfo = collectionHierarchy.get(collectionId);
                         if(collectionInfo?.parentId !== undefined) {
                             fileContent += `  parent_id: ${collectionInfo.parentId}\n`;
                         }
                    }
                }

                let combinedFMTags: string[] = [...settingsFMTags];
                if (raindrop.tags && Array.isArray(raindrop.tags)) {
                    raindrop.tags.forEach((tag: string) => {
                        const trimmedTag = tag.trim();
                        if (trimmedTag && !combinedFMTags.includes(trimmedTag)) {
                            combinedFMTags.push(trimmedTag);
                        }
                    });
                }
                
                if (combinedFMTags.length > 0) {
                    fileContent += 'tags:\n';
                    combinedFMTags.forEach((tag: string) => {
                        const sanitizedTag = tag.replace(/ /g, "_")
                            .replace(/[^\w\u00C0-\u00FF\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\/-]+/g, '');
                        if (sanitizedTag) fileContent += `  - ${sanitizedTag}\n`;
                    });
                    fileContent += '\n'; // Add newline after tags
                } else {
                    fileContent += 'tags: []\n';
                }
                
                if (rdCoverUrl) {
                        fileContent += `${this.settings.bannerFieldName}: ${rdCoverUrl}\n`;
                }
                fileContent += '---\n\n';

                if (rdCoverUrl) {
                    const altText = this.sanitizeFileName(rdTitle === 'Untitled Raindrop' ? 'Cover Image' : rdTitle)
                        .replace(/\.md$/i, '');
                    fileContent += `![${altText}](${rdCoverUrl})\n\n`;
                }
                
                fileContent += `# ${rdTitle}\n\n`;
                
                // Add description if present (outside frontmatter)
                if (rdExcerpt && !rdExcerpt.includes('\n')) { // Only add as body if not multiline (already in frontmatter)
                     fileContent += `## Description\n${rdExcerpt}\n\n`;
                }

                if (rdNoteContent) fileContent += `## Notes\n${rdNoteContent}\n\n`;

                if (raindrop.highlights && Array.isArray(raindrop.highlights) && raindrop.highlights.length > 0) {
                    fileContent += '## Highlights\n';
                    raindrop.highlights.forEach((highlight) => {
                        if (highlight.text) {
                            fileContent += `- ${highlight.text.replace(/r\n|r|n/g, ' ')}\n`;
                            if (highlight.note) {
                                fileContent += `  *Note:* ${highlight.note.replace(/r\n|r|n/g, ' ')}\n`;
                            }
                        }
                    });
                    fileContent += '\n';
                }

                await app.vault.create(filePath, fileContent);

                    // Increment appropriate counter based on outcome
                    if (processOutcome === 'created') {
                createdCount++;
                    } else if (processOutcome === 'updated') {
                        updatedCount++;
                    }
                } else if (processOutcome === 'skipped') {
                    skippedCount++;
                } else if (processOutcome === 'error') {
                    errorCount++; // Count as error if processing failed
                }
                processed++;

                // Update loading notice after processing (create, update, or skip)
                const raindropTitleAfterProcessing = raindrop.title || 'Untitled'; // Re-get title
                let statusText = '';
                if (processOutcome === 'created') statusText = 'Created';
                else if (processOutcome === 'updated') statusText = 'Updated';
                else if (processOutcome === 'skipped') statusText = 'Skipped';
                else if (processOutcome === 'error') statusText = 'Error';

                loadingNotice.setMessage(`${statusText} '${raindropTitleAfterProcessing}' in '${collectionTitleForNotice}'... (${processed}/${total})`);

            } catch (error) {
                errorCount++;
                processed++;
                let processErrorMsg = 'An unknown error occurred';
                if (error instanceof Error) processErrorMsg = error.message;
                else if (typeof error === 'string') processErrorMsg = error;

                const raindropTitleForError = raindrop?.title || 'an unknown raindrop';
                console.error('Error processing file:', processErrorMsg, error, raindrop);
                // Update loading notice on error
                loadingNotice.setMessage(`Error processing '${raindropTitleForError}' in '${collectionTitleForNotice}'... (${processed}/${total})`);
            }
        }
    }

    loadingNotice.hide(); // Dismiss loading notice after processing

    let summary = `${createdCount} notes created.`;
    if (updatedCount > 0) summary += ` ${updatedCount} updated.`;
    if (skippedCount > 0) summary += ` ${skippedCount} skipped (already exist).`;
    if (errorCount > 0) summary += ` ${errorCount} errors.`;
    new Notice(summary, 7000);
    console.log(`Raindrop processing complete. Created: ${createdCount}, Updated: ${updatedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`);
  }

  // Method to add or remove the ribbon icon
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
  filterType: 'link' | 'article' | 'image' | 'video' | 'document' | 'audio' | 'all' = 'all';
  fetchOnlyNew: boolean = false;
  updateExisting: boolean = false;

  constructor(app: App, plugin: RaindropToObsidian) {
    super(app);
    this.plugin = plugin;
    this.vaultPath = this.plugin.settings.defaultVaultLocation; // Initialize with default setting
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
        text.setPlaceholder(this.plugin.settings.defaultVaultLocation || 'Vault Root')
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
  onClose() { const { contentEl } = this; contentEl.empty(); }
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
          .setValue(this.plugin.settings.raindropApiToken)
          .onChange(async (value: string) => {
            this.plugin.settings.raindropApiToken = value;
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
        text.setPlaceholder(this.plugin.settings.defaultVaultLocation || 'Vault Root')
          .setValue(this.plugin.settings.defaultVaultLocation)
          .onChange(async (value: string) => {
            this.plugin.settings.defaultVaultLocation = value.trim();
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

     const footer = containerEl.createDiv({ cls: 'setting-footer' });
     footer.createEl('p', { text: 'Need help configuring or using the plugin? Check the README.' });
     footer.createEl('a', { text: 'Plugin GitHub Repository', href: 'https://github.com/frostmute/make-it-rain', attr: { target: '_blank', rel: 'noopener noreferrer' } });
  }

  async verifyApiToken(): Promise<void> {
    const { raindropApiToken } = this.plugin.settings;

    if (!raindropApiToken) {
      new Notice('Please enter an API token first.', 5000);
      return;
    }

    new Notice('Verifying API token...', 3000);

    const baseApiUrl = 'https://api.raindrop.io/rest/v1';
    const fetchOptions: RequestInit = {
      headers: {
        'Authorization': `Bearer ${raindropApiToken}`,
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

