import { App, Notice, Plugin, PluginSettingTab, Setting, Modal, TextComponent, ButtonComponent, ToggleComponent, PluginManifest } from 'obsidian';

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
}

interface RaindropToObsidianSettings {
    raindropApiToken: string;
    defaultVaultLocation: string;
    fileNameTemplate: string;
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

const DEFAULT_SETTINGS: RaindropToObsidianSettings = {
    raindropApiToken: '',
    defaultVaultLocation: '',
    fileNameTemplate: '{{title}}',
};

// Rate limiting and retry utilities
class RateLimiter {
    private requestCount: number = 0;
    private resetTime: number = Date.now() + 60000; // 1 minute window
    private readonly maxRequests: number = 120; // Raindrop.io limit: 120 requests per minute

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
        
        this.requestCount++;
    }
}

// Fetch wrapper with built-in retry logic and rate limiting
// This ensures reliable API communication even with temporary failures
async function fetchWithRetry(url: string, options: RequestInit, rateLimiter: RateLimiter, maxRetries: number = 3): Promise<Response> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            // Check rate limit before each attempt
            await rateLimiter.checkLimit();
            const response = await fetch(url, options);
            
            if (response.ok) {
                return response;
            }
            
            // Handle rate limiting responses from the API
            if (response.status === 429) {
                const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
                await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                continue;
            }
            
            // Client errors (400-level) usually indicate a problem with the request
            // These should fail fast as retrying won't help
            if (response.status >= 400 && response.status < 500) {
                throw new Error(`API Error: ${response.status} - ${await response.text()}`);
            }
            
            // Server errors (500-level) might be temporary, so we retry
            if (attempt < maxRetries - 1) {
                // Exponential backoff: wait longer between each retry
                await new Promise(resolve => 
                    setTimeout(resolve, Math.pow(2, attempt) * 1000)
                );
                continue;
            }
            
            throw new Error(`Failed after ${maxRetries} attempts: ${response.status}`);
        } catch (error) {
            // Network errors or other unexpected issues
            if (attempt === maxRetries - 1) throw error;
            await new Promise(resolve => 
                setTimeout(resolve, Math.pow(2, attempt) * 1000)
            );
        }
    }
    throw new Error('Unexpected error in fetchWithRetry');
}

// Collection info fetching with error handling and rate limiting
async function fetchCollectionInfo(collectionId: string, apiToken: string, rateLimiter: RateLimiter): Promise<RaindropCollection | null> {
    const fetchOptions: RequestInit = {
        headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json'
        }
    };

    try {
        // Fetch collection details - this helps with folder organization
        const response = await fetchWithRetry(
            `https://api.raindrop.io/rest/v1/collection/${collectionId}`,
            fetchOptions,
            rateLimiter
        );
        const data = await response.json();
        
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

// Folder creation with proper error handling
async function createFolderStructure(app: App, basePath: string, collectionTitle: string): Promise<string> {
    // Sanitize the collection title to create a valid folder name
    const sanitizedTitle = collectionTitle.replace(/[\\/:*?"<>|]/g, '_');
    const fullPath = basePath ? `${basePath}/${sanitizedTitle}` : sanitizedTitle;
    
    try {
        // Create folder only if it doesn't exist
        // This prevents errors when importing to the same location multiple times
        if (!(await app.vault.adapter.exists(fullPath))) {
            await app.vault.createFolder(fullPath);
        }
        return fullPath;
    } catch (error) {
        console.error(`Error creating folder structure for ${fullPath}:`, error);
        throw error; // Rethrow as this is a critical error
    }
}

export default class RaindropToObsidian extends Plugin {
  settings: RaindropToObsidianSettings;
  private rateLimiter: RateLimiter;

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

    this.addSettingTab(new RaindropToObsidianSettingTab(this.app, this));
    console.log('Make It Rain plugin loaded!');
  }

  onunload() {
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
        replacePlaceholder('id', (raindrop.id || 'unknown_id').toString());
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
        return "Unnamed_Raindrop_" + (raindrop.id || Date.now());
    }
    return finalFileName;
  }

  async fetchRaindrops(options: ModalFetchOptions) {
    new Notice('Fetching raindrops...', 3000);
    const { raindropApiToken } = this.settings;
    const { vaultPath, collections, apiFilterTags, includeSubcollections, appendTagsToNotes, useRaindropTitleForFileName, tagMatchType } = options;

    if (!raindropApiToken) {
      new Notice('Raindrop API token is not set. Please configure it in the plugin settings.', 10000);
      return;
    }

    const collectionIds = collections.split(',').map(id => id.trim()).filter(id => id !== '');
    const filterTagsArray = apiFilterTags.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag !== '');

    let searchParameterString = '';
    if (filterTagsArray.length > 0) {
        console.log('Tag match type:', tagMatchType);
        console.log('Original tags:', filterTagsArray);
        
        if (tagMatchType === 'all') {
            // For AND logic (match all tags), we use Raindrop's default behavior:
            // A space between tags means "AND" - the item must have all tags
            // Example: "#tag1 tag2 tag3" finds items with ALL these tags
            searchParameterString = filterTagsArray.map(tag => {
                const cleanTag = tag.trim().replace(/^#/, ''); // Remove # if present
                return tag.includes(' ') ? `"${cleanTag}"` : cleanTag;
            }).join(' ');
            // Single # prefix for the entire search string is sufficient for AND logic
            searchParameterString = `#${searchParameterString}`;
        } else {
            // For OR logic (match any tag), we handle it differently:
            // Instead of trying to construct a complex OR query (which has limitations in the API),
            // we fetch items for each tag separately and merge the results
            searchParameterString = ''; // Not used for OR logic
        }
        
        console.log('Constructed search query:', searchParameterString);
    }

    const baseApiUrl = 'https://api.raindrop.io/rest/v1';
    let allData: RaindropItem[] = [];
    const perPage = 50;

    try {
        let fetchMode = 'all';
        if (collectionIds.length > 0) fetchMode = 'collections';
        else if (searchParameterString || filterTagsArray.length > 0) fetchMode = 'tags';

        const fetchOptions: RequestInit = {
            headers: {
                'Authorization': `Bearer ${raindropApiToken}`,
                'Content-Type': 'application/json'
            }
        };

        if (fetchMode === 'collections') {
            for (const collectionId of collectionIds) {
                let hasMore = true;
                let page = 0;
                
                while (hasMore) {
                    const params = new URLSearchParams({
                        perpage: perPage.toString(),
                        page: page.toString()
                    });
                    
                    if (includeSubcollections) {
                        params.append('nested', 'true');
                    }
                    
                    if (searchParameterString) {
                        params.append('search', searchParameterString);
                    }
                    
                    const currentApiUrl = `${baseApiUrl}/raindrops/${collectionId}?${params.toString()}`;
                    console.log(`Requesting collection ${collectionId} with${includeSubcollections ? '' : 'out'} nested items:`, currentApiUrl);
                    
                    const response = await fetchWithRetry(currentApiUrl, fetchOptions, this.rateLimiter);
                    const data = await response.json() as RaindropResponse;
                    
                    if (!data.result) {
                        console.error(`API Error for collection ${collectionId}:`, data);
                        throw new Error(`API Error: ${JSON.stringify(data)}`);
                    }
                    
                    if (data?.items) {
                        allData = allData.concat(data.items);
                        page++;
                        hasMore = data.items.length === perPage;
                        console.log(`Fetched ${data.items.length} items from collection ${collectionId}, page ${page}`);
                    } else {
                        console.warn(`Unexpected response for collection ${collectionId}. Stopping.`);
                        hasMore = false;
                    }
                }
            }
        } else if (fetchMode === 'tags') {
            if (tagMatchType === 'any' && filterTagsArray.length > 0) {
                // Implementation of OR logic for tags:
                // 1. Make separate API calls for each tag
                // 2. Use a Map to store unique items (prevents duplicates)
                // 3. Merge all results while maintaining uniqueness
                const uniqueItems = new Map<number, RaindropItem>();
                
                for (const tag of filterTagsArray) {
                    let hasMore = true;
                    let page = 0;
                    
                    // Fetch all pages for the current tag
                    while (hasMore) {
                        const params = new URLSearchParams({
                            perpage: perPage.toString(),
                            page: page.toString(),
                            search: `#${tag.trim()}` // Simple, reliable single-tag search
                        });
                        
                        const currentApiUrl = `${baseApiUrl}/raindrops/0?${params.toString()}`;
                        console.log(`Requesting items with tag: ${tag}`, currentApiUrl);
                        
                        const response = await fetchWithRetry(currentApiUrl, fetchOptions, this.rateLimiter);
                        const data = await response.json() as RaindropResponse;
                        
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
                            // If an item has multiple matching tags, the last one overwrites the previous
                            // but that's fine since they're the same item
                            data.items.forEach(item => {
                                if (!uniqueItems.has(item._id)) {
                                    uniqueItems.set(item._id, item);
                                }
                            });
                            
                            page++;
                            hasMore = data.items.length === perPage; // Continue if we got a full page
                            console.log(`Fetched ${data.items.length} items for tag ${tag}, page ${page}`);
                        } else {
                            hasMore = false;
                        }
                    }
                }
                
                // Convert the Map values back to an array for processing
                allData = Array.from(uniqueItems.values());
                console.log(`Total unique items found across all tags: ${allData.length}`);
            } else {
                // Original AND logic or single tag search using the simple space-separated format
                let hasMore = true;
                let page = 0;
                
                while (hasMore) {
                    const params = new URLSearchParams({
                        perpage: perPage.toString(),
                        page: page.toString(),
                        search: searchParameterString
                    });
                    
                    const currentApiUrl = `${baseApiUrl}/raindrops/0?${params.toString()}`;
                    console.log(`Requesting items with tags: ${searchParameterString}`, currentApiUrl);
                    
                    const response = await fetchWithRetry(currentApiUrl, fetchOptions, this.rateLimiter);
                    const data = await response.json() as RaindropResponse;
                    
                    if (!data.result) {
                        console.error('API Error for tag search:', data);
                        throw new Error(`API Error: ${JSON.stringify(data)}`);
                    }
                    
                    if (data?.items) {
                        allData = allData.concat(data.items);
                        page++;
                        hasMore = data.items.length === perPage;
                        console.log(`Fetched ${data.items.length} items with tags, page ${page}`);
                    } else {
                        hasMore = false;
                    }
                }
            }
        } else {
            let hasMore = true;
            let page = 0;
            
            while (hasMore) {
                const params = new URLSearchParams({
                    perpage: perPage.toString(),
                    page: page.toString()
                });
                
                const currentApiUrl = `${baseApiUrl}/raindrops/0?${params.toString()}`;
                console.log('Requesting all items:', currentApiUrl);
                
                const response = await fetchWithRetry(currentApiUrl, fetchOptions, this.rateLimiter);
                const data = await response.json() as RaindropResponse;
                
                if (!data.result) {
                    console.error('API Error for all items fetch:', data);
                    throw new Error(`API Error: ${JSON.stringify(data)}`);
                }
                
                if (data?.items) {
                    allData = allData.concat(data.items);
                    page++;
                    hasMore = data.items.length === perPage;
                    console.log(`Fetched ${data.items.length} items, page ${page}`);
                } else {
                    console.warn('Unexpected response for all items fetch. Stopping.');
                    hasMore = false;
                }
            }
        }

        if (allData.length === 0) {
            if (collectionIds.length > 0 || searchParameterString || filterTagsArray.length > 0) {
                new Notice('No raindrops found matching your criteria.', 5000);
            } else {
                new Notice('No raindrops found in your account.', 5000);
            }
        } else {
            new Notice(`Found ${allData.length} raindrops. Processing...`, 5000);
            await this.processRaindrops(allData, vaultPath, appendTagsToNotes, useRaindropTitleForFileName);
        }

    } catch (error) {
        let errorMessage = 'An unknown error occurred during fetch';
        if (error instanceof Error) errorMessage = error.message;
        else if (typeof error === 'string') errorMessage = error;
        new Notice(`Error fetching raindrops: ${errorMessage}`, 10000);
        console.error('Error fetching Raindrop API:', error);
    }
  }

  async processRaindrops(raindrops: RaindropItem[], vaultPath: string | undefined, appendTagsToNotes: string, useRaindropTitleForFileName: boolean) {
    const { app } = this;
    const settingsFMTags = appendTagsToNotes.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

    if (vaultPath === undefined) vaultPath = this.settings.defaultVaultLocation;
    const targetFolderPath = vaultPath?.trim() ?? "";

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
            return;
        }
    }

    // Group raindrops by collection
    const raindropsByCollection: { [key: string]: RaindropItem[] } = {};
    const collectionInfo: { [key: string]: RaindropCollection } = {};

    // First pass: group raindrops and collect unique collection IDs
    for (const raindrop of raindrops) {
        if (raindrop.collection?.$id) {
            const collectionId = raindrop.collection.$id.toString();
            if (!raindropsByCollection[collectionId]) {
                raindropsByCollection[collectionId] = [];
                // Fetch collection info if we haven't already
                if (!collectionInfo[collectionId]) {
                    const info = await fetchCollectionInfo(collectionId, this.settings.raindropApiToken, this.rateLimiter);
                    if (info) {
                        collectionInfo[collectionId] = info;
                    }
                }
            }
            raindropsByCollection[collectionId].push(raindrop);
        } else {
            // Handle raindrops without collection
            if (!raindropsByCollection['uncategorized']) {
                raindropsByCollection['uncategorized'] = [];
            }
            raindropsByCollection['uncategorized'].push(raindrop);
        }
    }

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const total = raindrops.length;
    let processed = 0;

    // Process raindrops by collection
    for (const [collectionId, collectionRaindrops] of Object.entries(raindropsByCollection)) {
        try {
            let collectionPath = targetFolderPath;
            
            // Create collection folder if we have info
            if (collectionId !== 'uncategorized' && collectionInfo[collectionId]) {
                const collection = collectionInfo[collectionId];
                collectionPath = await createFolderStructure(app, targetFolderPath, collection.title);
            } else if (collectionId === 'uncategorized') {
                collectionPath = await createFolderStructure(app, targetFolderPath, 'Uncategorized');
            }

            // Process raindrops in this collection
            for (const raindrop of collectionRaindrops) {
                try {
                    const generatedFilename = this.generateFileName(raindrop, useRaindropTitleForFileName);
                    const filePath = `${collectionPath}/${generatedFilename}.md`;

                    if (await app.vault.adapter.exists(filePath)) {
                        console.log(`Skipping existing file: ${filePath}`);
                        skippedCount++;
                        processed++;
                        if (processed % 10 === 0) {
                            new Notice(`Progress: ${processed}/${total} raindrops processed...`, 3000);
                        }
                        continue;
                    }

                    const rdTitle = raindrop.title || 'Untitled Raindrop';
                    const rdNoteContent = raindrop.note || '';
                    const rdExcerpt = raindrop.excerpt || '';
                    const rdSourceUrl = raindrop.link;
                    const rdCoverUrl = raindrop.cover || '';

                    let fileContent = '---\n';
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
                    } else {
                        fileContent += 'description: ""\n';
                    }
                    
                    fileContent += `source: ${rdSourceUrl}\n`;
                    fileContent += `type: ${raindrop.type}\n`;
                    fileContent += `created: ${raindrop.created}\n`;
                    fileContent += `last_update: ${raindrop.lastUpdate}\n`;

                    // Add collection information to frontmatter
                    if (collectionId !== 'uncategorized' && collectionInfo[collectionId]) {
                        const collection = collectionInfo[collectionId];
                        fileContent += `collection:\n`;
                        fileContent += `  id: ${collection._id}\n`;
                        fileContent += `  title: "${collection.title.replace(/"/g, '\\"')}"\n`;
                        if (collection.parent?.$id) {
                            fileContent += `  parent_id: ${collection.parent.$id}\n`;
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
                    } else {
                        fileContent += 'tags: []\n';
                    }
                    
                    if (rdCoverUrl) {
                        fileContent += `banner: ${rdCoverUrl}\n`;
                    }
                    fileContent += '---\n\n';

                    if (rdCoverUrl) {
                        const altText = this.sanitizeFileName(rdTitle === 'Untitled Raindrop' ? 'Cover Image' : rdTitle)
                            .replace(/\.md$/i, '');
                        fileContent += `![${altText}](${rdCoverUrl})\n\n`;
                    }
                    
                    fileContent += `# ${rdTitle}\n\n`;
                    if (rdNoteContent) fileContent += `## Notes\n${rdNoteContent}\n\n`;
                    if (rdExcerpt) fileContent += `## Description\n${rdExcerpt}\n\n`;
                    
                    if (raindrop.highlights && Array.isArray(raindrop.highlights) && raindrop.highlights.length > 0) {
                        fileContent += '## Highlights\n';
                        raindrop.highlights.forEach((highlight) => {
                            if (highlight.text) {
                                fileContent += `- ${highlight.text.replace(/\r\n|\r|\n/g, ' ')}\n`;
                                if (highlight.note) {
                                    fileContent += `  *Note:* ${highlight.note.replace(/\r\n|\r|\n/g, ' ')}\n`;
                                }
                            }
                        });
                        fileContent += '\n';
                    }

                    await app.vault.create(filePath, fileContent);
                    createdCount++;
                    processed++;
                    
                    if (processed % 10 === 0) {
                        new Notice(`Progress: ${processed}/${total} raindrops processed...`, 3000);
                    }

                } catch (error) {
                    errorCount++;
                    processed++;
                    let processErrorMsg = 'An unknown error occurred';
                    if (error instanceof Error) processErrorMsg = error.message;
                    else if (typeof error === 'string') processErrorMsg = error;
                    
                    const raindropTitleForError = raindrop?.title || 'an unknown raindrop';
                    new Notice(`Error creating file for: ${raindropTitleForError}. Error: ${processErrorMsg}`, 10000);
                    console.error('Error creating file:', processErrorMsg, error, raindrop);
                }
            }
        } catch (error) {
            errorCount++;
            processed++;
            let collectionErrorMsg = 'An unknown error occurred';
            if (error instanceof Error) collectionErrorMsg = error.message;
            else if (typeof error === 'string') collectionErrorMsg = error;
            
            const collectionTitleForError = collectionInfo[collectionId]?.title || 'an unknown collection';
            new Notice(`Error processing collection ${collectionTitleForError}: ${collectionErrorMsg}`, 10000);
            console.error('Error processing collection:', collectionErrorMsg, error, collectionInfo[collectionId]);
        }
    }

    let summary = `${createdCount} notes created.`;
    if (skippedCount > 0) summary += ` ${skippedCount} skipped (already exist).`;
    if (errorCount > 0) summary += ` ${errorCount} errors.`;
    new Notice(summary, 7000);
    console.log(`Raindrop processing complete. Created: ${createdCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`);
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

  constructor(app: App, plugin: RaindropToObsidian) {
    super(app);
    this.plugin = plugin;
    this.vaultPath = this.plugin.settings.defaultVaultLocation;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h2', { text: 'Fetch Raindrops Options' });

    contentEl.createEl('h3', { text: 'Fetch Criteria' });
    new Setting(contentEl)
      .setName('Vault Folder (Optional)')
      .setDesc('Target folder for notes. Leave blank for vault root or default setting.')
      .addText((text: TextComponent) => {
        text.setPlaceholder(this.plugin.settings.defaultVaultLocation || 'Vault Root')
          .setValue(this.vaultPath)
          .onChange((value: string) => { this.vaultPath = value.trim(); });
      });
    new Setting(contentEl)
      .setName('Collections (comma-separated IDs)')
      .setDesc('Leave blank to fetch from all collections (unless tags below are specified).')
      .addText((text: TextComponent) => {
        text.setPlaceholder('e.g., 123,456')
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
          .onChange((value: 'all' | 'any') => {
            this.tagMatchType = value;
          });
      });
    new Setting(contentEl)
      .setName('Include Subcollections')
      .setDesc('If filtering by Collection IDs, also include items from their subcollections.')
      .addToggle((toggle: ToggleComponent) => {
        toggle.setValue(this.includeSubcollections)
          .onChange((value: boolean) => { this.includeSubcollections = value; });
      });

    contentEl.createEl('h3', { text: 'Note Options' });
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

    containerEl.createEl('img', {
      attr: {
        src: "https://i.ibb.co/HTx7TnbN/makeitrain.png",
        width: "750"
      }
    });

    containerEl.createEl('h2', {
      text: 'Import your Raindrop.io bookmarks into your Obsidian vault'
    });


    containerEl.createEl('p').createEl('a', {
        text: 'Visit Raindrop.io website',
        href: 'https://raindrop.io',
        attr: { target: '_blank', rel: 'noopener noreferrer' }
     });

    containerEl.createEl('hr');

    containerEl.createEl('h3', { text: 'API Configuration' });
    const apiDesc = containerEl.createDiv({ cls: 'setting-item-description' });
    apiDesc.createSpan({ text: 'You need to create a Test Token from your '});
    apiDesc.createEl('a', {
        text: 'Raindrop.io Apps settings page',
        href: 'https://app.raindrop.io/settings/integrations',
        attr: { target: '_blank', rel: 'noopener noreferrer' }
    });
    apiDesc.createSpan({ text: '.'});

    new Setting(containerEl)
      .setName('Raindrop.io API Token')
      .addText((text: TextComponent) => {
        text.setPlaceholder('Enter your token')
          .setValue(this.plugin.settings.raindropApiToken)
          .onChange(async (value: string) => {
            this.plugin.settings.raindropApiToken = value;
            await this.plugin.saveSettings();
          });
      });

    containerEl.createEl('hr');

    containerEl.createEl('h3', { text: 'Note Storage & Naming' });
    new Setting(containerEl)
      .setName('Default Vault Location for Notes')
      .setDesc('Default folder to save notes if not specified in the fetch options modal. Leave blank for vault root.')
      .addText((text: TextComponent) => {
        text.setPlaceholder('e.g., Raindrops/Inbox')
          .setValue(this.plugin.settings.defaultVaultLocation)
          .onChange(async (value: string) => {
            this.plugin.settings.defaultVaultLocation = value.trim();
            await this.plugin.saveSettings();
          });
      });

     containerEl.createEl('p', {
       cls: 'setting-item-description',
       text: 'Configure how filenames are generated when "Use Raindrop Title" is enabled in the fetch options modal. Uses Handlebars-like syntax.'
     });
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

     containerEl.createEl('hr');

     const footer = containerEl.createDiv({ cls: 'setting-footer' });
     footer.createEl('p', {
       text: 'Need help configuring or using the plugin? Check the README.'
     });
     footer.createEl('a', {
        text: 'Plugin GitHub Repository (Example)',
        href: 'https://github.com/your-username/your-repo-name',
        attr: { target: '_blank', rel: 'noopener noreferrer' }
     });

  }
}
