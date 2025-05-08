"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const obsidian_1 = require("obsidian");
const DEFAULT_SETTINGS = {
    raindropApiToken: '',
    defaultVaultLocation: '',
    fileNameTemplate: '{{title}}',
};
class RaindropToObsidian extends obsidian_1.Plugin {
    constructor(app, manifest) {
        super(app, manifest);
        this.settings = Object.assign({}, DEFAULT_SETTINGS);
    }
    onload() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadSettings();
            this.addCommand({
                id: 'fetch-raindrops',
                name: 'Fetch Raindrops',
                callback: () => __awaiter(this, void 0, void 0, function* () {
                    new RaindropFetchModal(this.app, this).open();
                })
            });
            this.addSettingTab(new RaindropToObsidianSettingTab(this.app, this));
            console.log('Make It Rain plugin loaded!');
        });
    }
    onunload() {
        console.log('Make It Rain plugin unloaded.');
    }
    loadSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            this.settings = Object.assign({}, DEFAULT_SETTINGS, yield this.loadData());
        });
    }
    saveSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.saveData(this.settings);
        });
    }
    sanitizeFileName(name) {
        const invalidChars = /[\/\\:*?"<>|#%&{}$!@'`+=]/g;
        const replacement = '';
        let sanitizedName = name.replace(invalidChars, replacement).trim();
        if (!sanitizedName)
            sanitizedName = "Unnamed_Raindrop";
        return sanitizedName.substring(0, 200);
    }
    generateFileName(raindrop, useRaindropTitleForFileName) {
        var _a;
        const { fileNameTemplate } = this.settings;
        if (!useRaindropTitleForFileName) {
            return this.sanitizeFileName((raindrop.id || 'unknown_id').toString());
        }
        let fileName = fileNameTemplate;
        const replacePlaceholder = (placeholder, value) => {
            const safeValue = this.sanitizeFileName(value);
            const regex = new RegExp(`{{${placeholder}}}`, 'gi');
            fileName = fileName.replace(regex, safeValue);
        };
        try {
            replacePlaceholder('title', raindrop.title || 'Untitled');
            replacePlaceholder('id', (raindrop.id || 'unknown_id').toString());
            replacePlaceholder('collectionTitle', ((_a = raindrop.collection) === null || _a === void 0 ? void 0 : _a.title) || 'No Collection');
            const createdDate = raindrop.created ? new Date(raindrop.created) : null;
            let formattedDate = 'no_date';
            if (createdDate && !isNaN(createdDate.getTime())) {
                formattedDate = createdDate.toISOString().split('T')[0];
            }
            replacePlaceholder('date', formattedDate);
        }
        catch (error) {
            let errorMsg = 'template processing error';
            if (error instanceof Error)
                errorMsg = error.message;
            console.error("Error processing file name template:", errorMsg, error);
            new obsidian_1.Notice("Error generating file name. Check console or template.");
            return "Error_Filename_" + Date.now();
        }
        let finalFileName = this.sanitizeFileName(fileName);
        if (!finalFileName.trim()) {
            return "Unnamed_Raindrop_" + (raindrop.id || Date.now());
        }
        return finalFileName;
    }
    fetchRaindrops(options) {
        return __awaiter(this, void 0, void 0, function* () {
            new obsidian_1.Notice('Fetching raindrops...', 3000);
            const { raindropApiToken } = this.settings;
            const { vaultPath, collections, apiFilterTags, includeSubcollections, appendTagsToNotes, useRaindropTitleForFileName } = options;
            if (!raindropApiToken) {
                new obsidian_1.Notice('Raindrop API token is not set. Please configure it in the plugin settings.', 10000);
                return;
            }
            const collectionIds = collections.split(',').map(id => id.trim()).filter(id => id !== '');
            const filterTagsArray = apiFilterTags.split(',')
                .map(tag => tag.trim())
                .filter(tag => tag !== '');
            let searchParameterString = '';
            if (filterTagsArray.length > 0) {
                searchParameterString = filterTagsArray.map(tag => {
                    if (tag.includes(' '))
                        return `#"${tag}"`;
                    return `#${tag}`;
                }).join(' ');
            }
            const baseApiUrl = 'https://api.raindrop.io/rest/v1/raindrops/';
            let allData = [];
            let page = 0;
            const perPage = 50;
            try {
                let fetchMode = 'all';
                if (collectionIds.length > 0)
                    fetchMode = 'collections';
                else if (searchParameterString)
                    fetchMode = 'tags';
                if (fetchMode === 'collections') {
                    for (const collectionId of collectionIds) {
                        let hasMore = true;
                        page = 0;
                        while (hasMore) {
                            const params = new URLSearchParams({ perpage: perPage.toString(), page: page.toString() });
                            if (includeSubcollections)
                                params.append('nested', 'true');
                            if (searchParameterString)
                                params.append('search', searchParameterString);
                            const currentApiUrl = `${baseApiUrl}${collectionId}?${params.toString()}`;
                            console.log("Requesting collection search URL:", currentApiUrl);
                            const response = yield fetch(currentApiUrl, { headers: { 'Authorization': `Bearer ${raindropApiToken}` } });
                            if (!response.ok) { /* Error handling */
                                throw new Error(`Collection ${collectionId}: ${response.status} - ${yield response.text()}`);
                            }
                            const data = yield response.json();
                            if (data === null || data === void 0 ? void 0 : data.items) {
                                allData = allData.concat(data.items);
                                page++;
                                hasMore = data.items.length === perPage;
                            }
                            else {
                                console.warn(`Unexpected response for coll ${collectionId}. Stopping.`);
                                hasMore = false;
                            }
                        }
                    }
                }
                else if (fetchMode === 'tags') {
                    let hasMore = true;
                    page = 0;
                    while (hasMore) {
                        const params = new URLSearchParams({ perpage: perPage.toString(), page: page.toString() });
                        if (includeSubcollections)
                            params.append('nested', 'true');
                        params.append('search', searchParameterString);
                        const currentApiUrl = `${baseApiUrl}0?${params.toString()}`;
                        console.log("Requesting global tag search URL:", currentApiUrl);
                        const response = yield fetch(currentApiUrl, { headers: { 'Authorization': `Bearer ${raindropApiToken}` } });
                        if (!response.ok) { /* Error handling */
                            throw new Error(`Tags Search: ${response.status} - ${yield response.text()}`);
                        }
                        const data = yield response.json();
                        if (data === null || data === void 0 ? void 0 : data.items) {
                            allData = allData.concat(data.items);
                            page++;
                            hasMore = data.items.length === perPage;
                        }
                        else {
                            console.warn(`Unexpected response for tags search. Stopping.`);
                            hasMore = false;
                        }
                    }
                }
                else {
                    let hasMore = true;
                    page = 0;
                    while (hasMore) {
                        const params = new URLSearchParams({ perpage: perPage.toString(), page: page.toString() });
                        if (includeSubcollections)
                            params.append('nested', 'true');
                        const currentApiUrl = `${baseApiUrl}0?${params.toString()}`;
                        console.log("Requesting global all items URL:", currentApiUrl);
                        const response = yield fetch(currentApiUrl, { headers: { 'Authorization': `Bearer ${raindropApiToken}` } });
                        if (!response.ok) { /* Error handling */
                            throw new Error(`All Items Fetch: ${response.status} - ${yield response.text()}`);
                        }
                        const data = yield response.json();
                        if (data === null || data === void 0 ? void 0 : data.items) {
                            allData = allData.concat(data.items);
                            page++;
                            hasMore = data.items.length === perPage;
                        }
                        else {
                            console.warn(`Unexpected response for all items fetch. Stopping.`);
                            hasMore = false;
                        }
                    }
                }
                console.log('Fetched Raindrops Raw Data:', allData);
                if (allData.length === 0 && (collectionIds.length > 0 || searchParameterString)) {
                    new obsidian_1.Notice('No raindrops found matching your criteria.', 5000);
                }
                else if (allData.length > 0) {
                    new obsidian_1.Notice(`Workspaceed ${allData.length} raindrops. Processing...`, 5000);
                    yield this.processRaindrops(allData, vaultPath, appendTagsToNotes, useRaindropTitleForFileName);
                }
                else {
                    new obsidian_1.Notice('Fetched 0 raindrops.', 3000);
                }
            }
            catch (error) {
                let errorMessage = 'An unknown error occurred during fetch';
                if (error instanceof Error)
                    errorMessage = error.message;
                else if (typeof error === 'string')
                    errorMessage = error;
                new obsidian_1.Notice(`Error fetching raindrops: ${errorMessage}`, 10000);
                console.error('Error fetching Raindrop API:', error);
            }
        });
    }
    processRaindrops(raindrops, vaultPath, appendTagsToNotes, useRaindropTitleForFileName) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { app } = this;
            const settingsFMTags = appendTagsToNotes.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
            if (vaultPath === undefined)
                vaultPath = this.settings.defaultVaultLocation;
            const targetFolderPath = (_a = vaultPath === null || vaultPath === void 0 ? void 0 : vaultPath.trim()) !== null && _a !== void 0 ? _a : "";
            if (targetFolderPath && !app.vault.getAbstractFileByPath(targetFolderPath)) {
                try {
                    console.log(`Attempting to create folder: ${targetFolderPath}`);
                    yield app.vault.createFolder(targetFolderPath);
                }
                catch (error) {
                    let errorMsg = 'folder creation failed';
                    if (error instanceof Error)
                        errorMsg = error.message;
                    new obsidian_1.Notice(`Failed to create folder: ${targetFolderPath}. Error: ${errorMsg}.`, 10000);
                    console.error("Error creating folder", error);
                    return;
                }
            }
            let createdCount = 0;
            let skippedCount = 0;
            let errorCount = 0;
            for (const raindrop of raindrops) {
                if (!raindrop || !raindrop.link) {
                    console.warn("Skipping invalid raindrop data:", raindrop);
                    errorCount++;
                    continue;
                }
                try {
                    const generatedFilename = this.generateFileName(raindrop, useRaindropTitleForFileName);
                    const filePath = targetFolderPath ? `${targetFolderPath}/${generatedFilename}.md` : `${generatedFilename}.md`;
                    if (yield app.vault.adapter.exists(filePath)) {
                        console.log(`Skipping existing file: ${filePath}`);
                        skippedCount++;
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
                            rdExcerpt.split('\n').forEach((line) => fileContent += `  ${line.replace(/\s+$/, '')}\n`);
                        }
                        else {
                            fileContent += `description: "${rdExcerpt.replace(/"/g, '\\"')}"\n`;
                        }
                    }
                    else {
                        fileContent += 'description: ""\n';
                    }
                    fileContent += `source: ${rdSourceUrl}\n`;
                    let combinedFMTags = [...settingsFMTags];
                    if (raindrop.tags && Array.isArray(raindrop.tags)) {
                        raindrop.tags.forEach((tag) => {
                            const trimmedTag = tag.trim();
                            if (trimmedTag && !combinedFMTags.includes(trimmedTag))
                                combinedFMTags.push(trimmedTag);
                        });
                    }
                    if (combinedFMTags.length > 0) {
                        fileContent += 'tags:\n';
                        combinedFMTags.forEach((tag) => {
                            const sanitizedTag = tag.replace(/ /g, "_").replace(/[^\w\u00C0-\u00FF\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\/-]+/g, '');
                            if (sanitizedTag)
                                fileContent += `  - ${sanitizedTag}\n`;
                        });
                    }
                    else {
                        fileContent += 'tags: []\n';
                    }
                    fileContent += `banner: ${rdCoverUrl}\n`;
                    fileContent += '---\n\n';
                    if (rdCoverUrl) {
                        const altText = this.sanitizeFileName(rdTitle === 'Untitled Raindrop' ? 'Cover Image' : rdTitle).replace(/\.md$/i, '');
                        fileContent += `![${altText}](${rdCoverUrl})\n\n`;
                    }
                    fileContent += `# ${rdTitle}\n\n`;
                    if (rdNoteContent)
                        fileContent += `## ${rdNoteContent}\n\n`;
                    if (rdExcerpt)
                        fileContent += `${rdExcerpt}\n\n`;
                    if (raindrop.highlights && Array.isArray(raindrop.highlights) && raindrop.highlights.length > 0) {
                        fileContent += '### Highlights\n';
                        raindrop.highlights.forEach((highlight) => {
                            if (highlight.text)
                                fileContent += `- ${highlight.text.replace(/\r\n|\r|\n/g, ' ')}\n`;
                            if (highlight.note)
                                fileContent += `  *Note:* ${highlight.note.replace(/\r\n|\r|\n/g, ' ')}\n`;
                        });
                        fileContent += '\n';
                    }
                    yield app.vault.create(filePath, fileContent);
                    createdCount++;
                }
                catch (error) {
                    errorCount++;
                    let processErrorMsg = 'An unknown error occurred';
                    if (error instanceof Error)
                        processErrorMsg = error.message;
                    else if (typeof error === 'string')
                        processErrorMsg = error;
                    const raindropTitleForError = (raindrop === null || raindrop === void 0 ? void 0 : raindrop.title) || 'an unknown raindrop';
                    new obsidian_1.Notice(`Error creating file for: ${raindropTitleForError}. Error: ${processErrorMsg}`, 10000);
                    console.error('Error creating file:', processErrorMsg, error, raindrop);
                }
            }
            let summary = `${createdCount} notes created.`;
            if (skippedCount > 0)
                summary += ` ${skippedCount} skipped (already exist).`;
            if (errorCount > 0)
                summary += ` ${errorCount} errors.`;
            new obsidian_1.Notice(summary, 7000);
            console.log(`Raindrop processing complete. Created: ${createdCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`);
        });
    }
}
exports.default = RaindropToObsidian;
class RaindropFetchModal extends obsidian_1.Modal {
    constructor(app, plugin) {
        super(app);
        this.collections = '';
        this.apiFilterTags = '';
        this.includeSubcollections = false;
        this.appendTagsToNotes = '';
        this.useRaindropTitleForFileName = true;
        this.plugin = plugin;
        this.vaultPath = this.plugin.settings.defaultVaultLocation;
    }
    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: 'Fetch Raindrops Options' });
        contentEl.createEl('h3', { text: 'Fetch Criteria' });
        new obsidian_1.Setting(contentEl)
            .setName('Vault Folder (Optional)')
            .setDesc('Target folder for notes. Leave blank for vault root or default setting.')
            .addText((text) => {
            text.setPlaceholder(this.plugin.settings.defaultVaultLocation || 'Vault Root')
                .setValue(this.vaultPath)
                .onChange((value) => { this.vaultPath = value.trim(); });
        });
        new obsidian_1.Setting(contentEl)
            .setName('Collections (comma-separated IDs)')
            .setDesc('Leave blank to fetch from all collections (unless tags below are specified).')
            .addText((text) => {
            text.setPlaceholder('e.g., 123,456')
                .setValue(this.collections)
                .onChange((value) => { this.collections = value; });
        });
        new obsidian_1.Setting(contentEl)
            .setName('Filter by Tags (comma-separated)')
            .setDesc('Only fetch raindrops matching ALL specified tags.')
            .addText((text) => {
            text.setPlaceholder('e.g., article, project-x')
                .setValue(this.apiFilterTags)
                .onChange((value) => { this.apiFilterTags = value; });
        });
        new obsidian_1.Setting(contentEl)
            .setName('Include Subcollections')
            .setDesc('If filtering by Collection IDs, also include items from their subcollections.')
            .addToggle((toggle) => {
            toggle.setValue(this.includeSubcollections)
                .onChange((value) => { this.includeSubcollections = value; });
        });
        contentEl.createEl('h3', { text: 'Note Options' });
        new obsidian_1.Setting(contentEl)
            .setName('Append Tags to Note Frontmatter (comma-separated)')
            .setDesc('Additional tags to add to the YAML frontmatter of each created note.')
            .addText((text) => {
            text.setPlaceholder('e.g., #imported/raindrop')
                .setValue(this.appendTagsToNotes)
                .onChange((value) => { this.appendTagsToNotes = value; });
        });
        new obsidian_1.Setting(contentEl)
            .setName('Use Raindrop Title for File Name')
            .setDesc('Use title (via template) for filenames? If off, uses Raindrop ID.')
            .addToggle((toggle) => {
            toggle.setValue(this.useRaindropTitleForFileName)
                .onChange((value) => { this.useRaindropTitleForFileName = value; });
        });
        new obsidian_1.Setting(contentEl)
            .addButton((btn) => {
            btn.setButtonText('Fetch Raindrops')
                .setCta()
                .onClick(() => __awaiter(this, void 0, void 0, function* () {
                const options = {
                    vaultPath: this.vaultPath || undefined,
                    collections: this.collections,
                    apiFilterTags: this.apiFilterTags,
                    includeSubcollections: this.includeSubcollections,
                    appendTagsToNotes: this.appendTagsToNotes,
                    useRaindropTitleForFileName: this.useRaindropTitleForFileName,
                };
                this.close();
                yield this.plugin.fetchRaindrops(options);
            }));
        })
            .addButton((btn) => {
            btn.setButtonText('Cancel')
                .onClick(() => { this.close(); });
        });
    }
    onClose() { const { contentEl } = this; contentEl.empty(); }
}
class RaindropToObsidianSettingTab extends obsidian_1.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }
    display() {
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
        apiDesc.createSpan({ text: 'You need to create a Test Token from your ' });
        apiDesc.createEl('a', {
            text: 'Raindrop.io Apps settings page',
            href: 'https://app.raindrop.io/settings/integrations',
            attr: { target: '_blank', rel: 'noopener noreferrer' }
        });
        apiDesc.createSpan({ text: '.' });
        new obsidian_1.Setting(containerEl)
            .setName('Raindrop.io API Token')
            .addText((text) => {
            text.setPlaceholder('Enter your token')
                .setValue(this.plugin.settings.raindropApiToken)
                .onChange((value) => __awaiter(this, void 0, void 0, function* () {
                this.plugin.settings.raindropApiToken = value;
                yield this.plugin.saveSettings();
            }));
        });
        containerEl.createEl('hr');
        containerEl.createEl('h3', { text: 'Note Storage & Naming' });
        new obsidian_1.Setting(containerEl)
            .setName('Default Vault Location for Notes')
            .setDesc('Default folder to save notes if not specified in the fetch options modal. Leave blank for vault root.')
            .addText((text) => {
            text.setPlaceholder('e.g., Raindrops/Inbox')
                .setValue(this.plugin.settings.defaultVaultLocation)
                .onChange((value) => __awaiter(this, void 0, void 0, function* () {
                this.plugin.settings.defaultVaultLocation = value.trim();
                yield this.plugin.saveSettings();
            }));
        });
        containerEl.createEl('p', {
            cls: 'setting-item-description',
            text: 'Configure how filenames are generated when "Use Raindrop Title" is enabled in the fetch options modal. Uses Handlebars-like syntax.'
        });
        new obsidian_1.Setting(containerEl)
            .setName('File Name Template')
            .setDesc('Placeholders: {{title}}, {{id}}, {{collectionTitle}}, {{date}} (YYYY-MM-DD).')
            .addText((text) => {
            text.setPlaceholder('{{title}}')
                .setValue(this.plugin.settings.fileNameTemplate)
                .onChange((value) => __awaiter(this, void 0, void 0, function* () {
                this.plugin.settings.fileNameTemplate = value;
                yield this.plugin.saveSettings();
            }));
        });
        containerEl.createEl('hr');
        const footer = containerEl.createDiv({ cls: 'setting-footer' });
        footer.createEl('p', {
            text: 'Need help configuring or using the plugin? Check the README.'
        });
        footer.createEl('a', {
            text: 'Plugin GitHub Repository',
            href: 'https://github.com/frostmute/make-it-rain',
            attr: { target: '_blank', rel: 'noopener noreferrer' }
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFBQSx1Q0FBa0o7QUFpQmxKLE1BQU0sZ0JBQWdCLEdBQStCO0lBQ25ELGdCQUFnQixFQUFFLEVBQUU7SUFDcEIsb0JBQW9CLEVBQUUsRUFBRTtJQUN4QixnQkFBZ0IsRUFBRSxXQUFXO0NBQzlCLENBQUM7QUFFRixNQUFxQixrQkFBbUIsU0FBUSxpQkFBTTtJQUdwRCxZQUFZLEdBQVEsRUFBRSxRQUF3QjtRQUM1QyxLQUFLLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3JCLElBQUksQ0FBQyxRQUFRLHFCQUFRLGdCQUFnQixDQUFFLENBQUM7SUFDMUMsQ0FBQztJQUVLLE1BQU07O1lBQ1YsTUFBTSxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFFMUIsSUFBSSxDQUFDLFVBQVUsQ0FBQztnQkFDZCxFQUFFLEVBQUUsaUJBQWlCO2dCQUNyQixJQUFJLEVBQUUsaUJBQWlCO2dCQUN2QixRQUFRLEVBQUUsR0FBUyxFQUFFO29CQUNuQixJQUFJLGtCQUFrQixDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ2hELENBQUMsQ0FBQTthQUNGLENBQUMsQ0FBQztZQUVILElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSw0QkFBNEIsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDckUsT0FBTyxDQUFDLEdBQUcsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO1FBQzdDLENBQUM7S0FBQTtJQUVELFFBQVE7UUFDTixPQUFPLENBQUMsR0FBRyxDQUFDLCtCQUErQixDQUFDLENBQUM7SUFDL0MsQ0FBQztJQUVLLFlBQVk7O1lBQ2hCLElBQUksQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsZ0JBQWdC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QW1CLEVBQUUsRUFBRTtZQUMvQixJQUFJLENBQUMsY0FBYyxDQUFDLFdBQVcsQ0FBQztpQkFDM0IsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDO2lCQUMvQyxRQUFRLENBQUMsQ0FBTyxLQUFLLEVBQUUsRUFBRTtnQkFDdEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLEdBQUcsS0FBSyxDQUFDO2dCQUM5QyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDckMsQ0FBQyxDQUFBLENBQUMsQ0FBQztRQUNULENBQUMsQ0FBQyxDQUFDO1FBRUosV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUUzQixNQUFNLE1BQU0sR0FBRyxXQUFXLENBQUMsU0FBUyxDQUFDLEVBQUUsR0FBRyxFQUFFLGdCQUFnQixFQUFFLENBQUMsQ0FBQztRQUNoRSxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRTtZQUNuQixJQUFJLEVBQUUsOERBQThEO1NBQ3JFLENBQUMsQ0FBQztRQUNILE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFO1lBQ2xCLElBQUksRUFBRSxvQ0FBb0M7WUFDMUMsSUFBSSxFQUFFLGlEQUFpRDtZQUN2RCxJQUFJLEVBQUUsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRSxxQkFBcUIsRUFBRTtTQUN4RCxDQUFDLENBQUM7SUFFTixDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcHAsIE5vdGljZSwgUGx1Z2luLCBQbHVnaW5TZXR0aW5nVGFiLCBTZXR0aW5nLCBNb2RhbCwgVGV4dENvbXBvbmVudCwgQnV0dG9uQ29tcG9uZW50LCBUb2dnbGVDb21wb25lbnQsIFBsdWdpbk1hbmlmZXN0IH0gZnJvbSAnb2JzaWRpYW4nO1xuXG5pbnRlcmZhY2UgTW9kYWxGZXRjaE9wdGlvbnMge1xuICB2YXVsdFBhdGg/OiBzdHJpbmc7XG4gIGNvbGxlY3Rpb25zOiBzdHJpbmc7XG4gIGFwaUZpbHRlclRhZ3M6IHN0cmluZztcbiAgaW5jbHVkZVN1YmNvbGxlY3Rpb25zOiBib29sZWFuO1xuICBhcHBlbmRUYWdzVG9Ob3Rlczogc3RyaW5nO1xuICB1c2VSYWluZHJvcFRpdGxlRm9yRmlsZU5hbWU6IGJvb2xlYW47XG59XG5cbmludGVyZmFjZSBSYWluZHJvcFRvT2JzaWRpYW5TZXR0aW5ncyB7XG4gIHJhaW5kcm9wQXBpVG9rZW46IHN0cmluZztcbiAgZGVmYXVsdFZhdWx0TG9jYXRpb246IHN0cmluZztcbiAgZmlsZU5hbWVUZW1wbGF0ZTogc3RyaW5nO1xufVxuXG5jb25zdCBERUZBVUxUX1NFVFRJTkdTOiBSYWluZHJvcFRvT2JzaWRpYW5TZXR0aW5ncyA9IHtcbiAgcmFpbmRyb3BBcGlUb2tlbjogJycsXG4gIGRlZmF1bHRWYXVsdExvY2F0aW9uOiAnJyxcbiAgZmlsZU5hbWVUZW1wbGF0ZTogJ3t7dGl0bGV9fScsXG59O1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSYWluZHJvcFRvT2JzaWRpYW4gZXh0ZW5kcyBQbHVnaW4ge1xuICBzZXR0aW5nczogUmFpbmRyb3BUb09ic2lkaWFuU2V0dGluZ3M7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIG1hbmlmZXN0OiBQbHVnaW5NYW5pZmVzdCkge1xuICAgIHN1cGVyKGFwcCwgbWFuaWZlc3QpO1xuICAgIHRoaXMuc2V0dGluZ3MgPSB7IC4uLkRFRkFVTFRfU0VUVElOR1MgfTtcbiAgfVxuXG4gIGFzeW5jIG9ubG9hZCgpIHtcbiAgICBhd2FpdCB0aGlzLmxvYWRTZXR0aW5ncygpO1xuXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiAnZmV0Y2gtcmFpbmRyb3BzJyxcbiAgICAgIG5hbWU6ICdGZXRjaCBSYWluZHJvcHMnLFxuICAgICAgY2FsbGJhY2s6IGFzeW5jICgpID0+IHtcbiAgICAgICAgbmV3IFJhaW5kcm9wRmV0Y2hNb2RhbCh0aGlzLmFwcCwgdGhpcykub3BlbigpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5hZGRTZXR0aW5nVGFiKG5ldyBSYWluZHJvcFRvT2JzaWRpYW5TZXR0aW5nVGFiKHRoaXMuYXBwLCB0aGlzKSk7XG4gICAgY29uc29sZS5sb2coJ01ha2UgSXQgUmFpbiBwbHVnaW4gbG9hZGVkIScpO1xuICB9XG5cbiAgb251bmxvYWQoKSB7XG4gICAgY29uc29sZS5sb2coJ01ha2UgSXQgUmFpbiBwbHVnaW4gdW5sb2FkZWQuJyk7XG4gIH1cblxuICBhc3luYyBsb2FkU2V0dGluZ3MoKSB7XG4gICAgdGhpcy5zZXR0aW5ncyA9IE9iamVjdC5hc3NpZ24oe30sIERFRkFVTFRfU0VUVElOR1MsIGF3YWl0IHRoaXMubG9hZERhdGEoKSk7XG4gIH1cblxuICBhc3luYyBzYXZlU2V0dGluZ3MoKSB7XG4gICAgYXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcbiAgfVxuXG4gIHNhbml0aXplRmlsZU5hbWUobmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBpbnZhbGlkQ2hhcnMgPSAvW1xcL1xcXFw6Kj9cIjw+fCMlJnt9JCFAJ2ArPV0vZztcbiAgICBjb25zdCByZXBsYWNlbWVudCA9ICcnO1xuICAgIGxldCBzYW5pdGl6ZWROYW1lID0gbmFtZS5yZXBsYWNlKGludmFsaWRDaGFycywgcmVwbGFjZW1lbnQpLnRyaW0oKTtcbiAgICBpZiAoIXNhbml0aXplZE5hbWUpIHNhbml0aXplZE5hbWUgPSBcIlVubmFtZWRfUmFpbmRyb3BcIjtcbiAgICByZXR1cm4gc2FuaXRpemVkTmFtZS5zdWJzdHJpbmcoMCwgMjAwKTtcbiAgfVxuXG4gIGdlbmVyYXRlRmlsZU5hbWUocmFpbmRyb3A6IGFueSwgdXNlUmFpbmRyb3BUaXRsZUZvckZpbGVOYW1lOiBib29sZWFuKTogc3RyaW5nIHtcbiAgICBjb25zdCB7IGZpbGVOYW1lVGVtcGxhdGUgfSA9IHRoaXMuc2V0dGluZ3M7XG5cbiAgICBpZiAoIXVzZVJhaW5kcm9wVGl0bGVGb3JGaWxlTmFtZSkge1xuICAgICAgcmV0dXJuIHRoaXMuc2FuaXRpemVGaWxlTmFtZSgocmFpbmRyb3AuaWQgfHwgJ3Vua25vd25faWQnKS50b1N0cmluZygpKTtcbiAgICB9XG5cbiAgICBsZXQgZmlsZU5hbWUgPSBmaWxlTmFtZVRlbXBsYXRlO1xuICAgIGNvbnN0IHJlcGxhY2VQbGFjZWhvbGRlciA9IChwbGFjZWhvbGRlcjogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKSA9PiB7XG4gICAgICAgIGNvbnN0IHNhZmVWYWx1ZSA9IHRoaXMuc2FuaXRpemVGaWxlTmFtZSh2YWx1ZSk7XG4gICAgICAgIGNvbnN0IHJlZ2V4ID0gbmV3IFJlZ0V4cChge3ske3BsYWNlaG9sZGVyfX19YCwgJ2dpJyk7XG4gICAgICAgIGZpbGVOYW1lID0gZmlsZU5hbWUucmVwbGFjZShyZWdleCwgc2FmZVZhbHVlKTtcbiAgICB9O1xuXG4gICAgdHJ5IHtcbiAgICAgICAgcmVwbGFjZVBsYWNlaG9sZGVyKCd0aXRsZScsIHJhaW5kcm9wLnRpdGxlIHx8ICdVbnRpdGxlZCcpO1xuICAgICAgICByZXBsYWNlUGxhY2Vob2xkZXIoJ2lkJywgKHJhaW5kcm9wLmlkIHx8ICd1bmtub3duX2lkJykudG9TdHJpbmcoKSk7XG4gICAgICAgIHJlcGxhY2VQbGFjZWhvbGRlcignY29sbGVjdGlvblRpdGxlJywgcmFpbmRyb3AuY29sbGVjdGlvbj8udGl0bGUgfHwgJ05vIENvbGxlY3Rpb24nKTtcblxuICAgICAgICBjb25zdCBjcmVhdGVkRGF0ZSA9IHJhaW5kcm9wLmNyZWF0ZWQgPyBuZXcgRGF0ZShyYWluZHJvcC5jcmVhdGVkKSA6IG51bGw7XG4gICAgICAgIGxldCBmb3JtYXR0ZWREYXRlID0gJ25vX2RhdGUnO1xuICAgICAgICBpZiAoY3JlYXRlZERhdGUgJiYgIWlzTmFOKGNyZWF0ZWREYXRlLmdldFRpbWUoKSkpIHtcbiAgICAgICAgICBmb3JtYXR0ZWREYXRlID0gY3JlYXRlZERhdGUudG9JU09TdHJpbmcoKS5zcGxpdCgnVCcpWzBdO1xuICAgICAgICB9XG4gICAgICAgIHJlcGxhY2VQbGFjZWhvbGRlcignZGF0ZScsIGZvcm1hdHRlZERhdGUpO1xuXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgbGV0IGVycm9yTXNnID0gJ3RlbXBsYXRlIHByb2Nlc3NpbmcgZXJyb3InO1xuICAgICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBFcnJvcikgZXJyb3JNc2cgPSBlcnJvci5tZXNzYWdlO1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgcHJvY2Vzc2luZyBmaWxlIG5hbWUgdGVtcGxhdGU6XCIsIGVycm9yTXNnLCBlcnJvcik7XG4gICAgICAgIG5ldyBOb3RpY2UoXCJFcnJvciBnZW5lcmF0aW5nIGZpbGUgbmFtZS4gQ2hlY2sgY29uc29sZSBvciB0ZW1wbGF0ZS5cIik7XG4gICAgICAgIHJldHVybiBcIkVycm9yX0ZpbGVuYW1lX1wiICsgRGF0ZS5ub3coKTtcbiAgICB9XG5cbiAgICBsZXQgZmluYWxGaWxlTmFtZSA9IHRoaXMuc2FuaXRpemVGaWxlTmFtZShmaWxlTmFtZSk7XG4gICAgaWYgKCFmaW5hbEZpbGVOYW1lLnRyaW0oKSkge1xuICAgICAgICByZXR1cm4gXCJVbm5hbWVkX1JhaW5kcm9wX1wiICsgKHJhaW5kcm9wLmlkIHx8IERhdGUubm93KCkpO1xuICAgIH1cbiAgICByZXR1cm4gZmluYWxGaWxlTmFtZTtcbiAgfVxuXG4gIGFzeW5jIGZldGNoUmFpbmRyb3BzKG9wdGlvbnM6IE1vZGFsRmV0Y2hPcHRpb25zKSB7XG4gICAgbmV3IE5vdGljZSgnRmV0Y2hpbmcgcmFpbmRyb3BzLi4uJywgMzAwMCk7XG4gICAgY29uc3QgeyByYWluZHJvcEFwaVRva2VuIH0gPSB0aGlzLnNldHRpbmdzO1xuICAgIGNvbnN0IHsgdmF1bHRQYXRoLCBjb2xsZWN0aW9ucywgYXBpRmlsdGVyVGFncywgaW5jbHVkZVN1YmNvbGxlY3Rpb25zLCBhcHBlbmRUYWdzVG9Ob3RlcywgdXNlUmFpbmRyb3BUaXRsZUZvckZpbGVOYW1lIH0gPSBvcHRpb25zO1xuXG4gICAgaWYgKCFyYWluZHJvcEFwaVRva2VuKSB7XG4gICAgICBuZXcgTm90aWNlKCdSYWluZHJvcCBBUEkgdG9rZW4gaXMgbm90IHNldC4gUGxlYXNlIGNvbmZpZ3VyZSBpdCBpbiB0aGUgcGx1Z2luIHNldHRpbmdzLicsIDEwMDAwKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjb2xsZWN0aW9uSWRzID0gY29sbGVjdGlvbnMuc3BsaXQoJywnKS5tYXAoaWQgPT4gaWQudHJpbSgpKS5maWx0ZXIoaWQgPT4gaWQgIT09ICcnKTtcbiAgICBjb25zdCBmaWx0ZXJUYWdzQXJyYXkgPSBhcGlGaWx0ZXJUYWdzLnNwbGl0KCcsJylcbiAgICAgICAgLm1hcCh0YWcgPT4gdGFnLnRyaW0oKSlcbiAgICAgICAgLmZpbHRlcih0YWcgPT4gdGFnICE9PSAnJyk7XG5cbiAgICBsZXQgc2VhcmNoUGFyYW1ldGVyU3RyaW5nID0gJyc7XG4gICAgaWYgKGZpbHRlclRhZ3NBcnJheS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHNlYXJjaFBhcmFtZXRlclN0cmluZyA9IGZpbHRlclRhZ3NBcnJheS5tYXAodGFnID0+IHtcbiAgICAgICAgICAgIGlmICh0YWcuaW5jbHVkZXMoJyAnKSkgcmV0dXJuIGAjXCIke3RhZ31cImA7XG4gICAgICAgICAgICByZXR1cm4gYCMke3RhZ31gO1xuICAgICAgICB9KS5qb2luKCcgJyk7XG4gICAgfVxuXG4gICAgY29uc3QgYmFzZUFwaVVybCA9ICdodHRwczovL2FwaS5yYWluZHJvcC5pby9yZXN0L3YxL3JhaW5kcm9wcy8nO1xuICAgIGxldCBhbGxEYXRhOiBhbnlbXSA9IFtdO1xuICAgIGxldCBwYWdlID0gMDtcbiAgICBjb25zdCBwZXJQYWdlID0gNTA7XG5cbiAgICB0cnkge1xuICAgICAgICBsZXQgZmV0Y2hNb2RlID0gJ2FsbCc7XG4gICAgICAgIGlmIChjb2xsZWN0aW9uSWRzLmxlbmd0aCA+IDApIGZldGNoTW9kZSA9ICdjb2xsZWN0aW9ucyc7XG4gICAgICAgIGVsc2UgaWYgKHNlYXJjaFBhcmFtZXRlclN0cmluZykgZmV0Y2hNb2RlID0gJ3RhZ3MnO1xuXG4gICAgICAgIGlmIChmZXRjaE1vZGUgPT09ICdjb2xsZWN0aW9ucycpIHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgY29sbGVjdGlvbklkIG9mIGNvbGxlY3Rpb25JZHMpIHtcbiAgICAgICAgICAgICAgICBsZXQgaGFzTW9yZSA9IHRydWU7IHBhZ2UgPSAwO1xuICAgICAgICAgICAgICAgIHdoaWxlIChoYXNNb3JlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcmFtcyA9IG5ldyBVUkxTZWFyY2hQYXJhbXMoeyBwZXJwYWdlOiBwZXJQYWdlLnRvU3RyaW5nKCksIHBhZ2U6IHBhZ2UudG9TdHJpbmcoKSB9KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGluY2x1ZGVTdWJjb2xsZWN0aW9ucykgcGFyYW1zLmFwcGVuZCgnbmVzdGVkJywgJ3RydWUnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlYXJjaFBhcmFtZXRlclN0cmluZykgcGFyYW1zLmFwcGVuZCgnc2VhcmNoJywgc2VhcmNoUGFyYW1ldGVyU3RyaW5nKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY3VycmVudEFwaVVybCA9IGAke2Jhc2VBcGlVcmx9JHtjb2xsZWN0aW9uSWR9PyR7cGFyYW1zLnRvU3RyaW5nKCl9YDtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJSZXF1ZXN0aW5nIGNvbGxlY3Rpb24gc2VhcmNoIFVSTDpcIiwgY3VycmVudEFwaVVybCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goY3VycmVudEFwaVVybCwgeyBoZWFkZXJzOiB7ICdBdXRob3JpemF0aW9uJzogYEJlYXJlciAke3JhaW5kcm9wQXBpVG9rZW59YCB9IH0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7IC8qIEVycm9yIGhhbmRsaW5nICovIHRocm93IG5ldyBFcnJvcihgQ29sbGVjdGlvbiAke2NvbGxlY3Rpb25JZH06ICR7cmVzcG9uc2Uuc3RhdHVzfSAtICR7YXdhaXQgcmVzcG9uc2UudGV4dCgpfWApOyB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkYXRhPy5pdGVtcykgeyBhbGxEYXRhID0gYWxsRGF0YS5jb25jYXQoZGF0YS5pdGVtcyk7IHBhZ2UrKzsgaGFzTW9yZSA9IGRhdGEuaXRlbXMubGVuZ3RoID09PSBwZXJQYWdlOyB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgeyBjb25zb2xlLndhcm4oYFVuZXhwZWN0ZWQgcmVzcG9uc2UgZm9yIGNvbGwgJHtjb2xsZWN0aW9uSWR9LiBTdG9wcGluZy5gKTsgaGFzTW9yZSA9IGZhbHNlOyB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGZldGNoTW9kZSA9PT0gJ3RhZ3MnKSB7XG4gICAgICAgICAgICBsZXQgaGFzTW9yZSA9IHRydWU7IHBhZ2UgPSAwO1xuICAgICAgICAgICAgd2hpbGUgKGhhc01vcmUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJhbXMgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKHsgcGVycGFnZTogcGVyUGFnZS50b1N0cmluZygpLCBwYWdlOiBwYWdlLnRvU3RyaW5nKCkgfSk7XG4gICAgICAgICAgICAgICAgaWYgKGluY2x1ZGVTdWJjb2xsZWN0aW9ucykgcGFyYW1zLmFwcGVuZCgnbmVzdGVkJywgJ3RydWUnKTtcbiAgICAgICAgICAgICAgICBwYXJhbXMuYXBwZW5kKCdzZWFyY2gnLCBzZWFyY2hQYXJhbWV0ZXJTdHJpbmcpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRBcGlVcmwgPSBgJHtiYXNlQXBpVXJsfTA/JHtwYXJhbXMudG9TdHJpbmcoKX1gO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiUmVxdWVzdGluZyBnbG9iYWwgdGFnIHNlYXJjaCBVUkw6XCIsIGN1cnJlbnRBcGlVcmwpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goY3VycmVudEFwaVVybCwgeyBoZWFkZXJzOiB7ICdBdXRob3JpemF0aW9uJzogYEJlYXJlciAke3JhaW5kcm9wQXBpVG9rZW59YCB9IH0pO1xuICAgICAgICAgICAgICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7IC8qIEVycm9yIGhhbmRsaW5nICovIHRocm93IG5ldyBFcnJvcihgVGFncyBTZWFyY2g6ICR7cmVzcG9uc2Uuc3RhdHVzfSAtICR7YXdhaXQgcmVzcG9uc2UudGV4dCgpfWApOyB9XG4gICAgICAgICAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgICAgICAgICAgICAgICBpZiAoZGF0YT8uaXRlbXMpIHsgYWxsRGF0YSA9IGFsbERhdGEuY29uY2F0KGRhdGEuaXRlbXMpOyBwYWdlKys7IGhhc01vcmUgPSBkYXRhLml0ZW1zLmxlbmd0aCA9PT0gcGVyUGFnZTsgfVxuICAgICAgICAgICAgICAgIGVsc2UgeyBjb25zb2xlLndhcm4oYFVuZXhwZWN0ZWQgcmVzcG9uc2UgZm9yIHRhZ3Mgc2VhcmNoLiBTdG9wcGluZy5gKTsgaGFzTW9yZSA9IGZhbHNlOyB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsZXQgaGFzTW9yZSA9IHRydWU7IHBhZ2UgPSAwO1xuICAgICAgICAgICAgd2hpbGUgKGhhc01vcmUpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXJhbXMgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKHsgcGVycGFnZTogcGVyUGFnZS50b1N0cmluZygpLCBwYWdlOiBwYWdlLnRvU3RyaW5nKCkgfSk7XG4gICAgICAgICAgICAgICAgaWYgKGluY2x1ZGVTdWJjb2xsZWN0aW9ucykgcGFyYW1zLmFwcGVuZCgnbmVzdGVkJywgJ3RydWUnKTtcbiAgICAgICAgICAgICAgICBjb25zdCBjdXJyZW50QXBpVXJsID0gYCR7YmFzZUFwaVVybH0wPyR7cGFyYW1zLnRvU3RyaW5nKCl9YDtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlcXVlc3RpbmcgZ2xvYmFsIGFsbCBpdGVtcyBVUkw6XCIsIGN1cnJlbnRBcGlVcmwpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goY3VycmVudEFwaVVybCwgeyBoZWFkZXJzOiB7ICdBdXRob3JpemF0aW9uJzogYEJlYXJlciAke3JhaW5kcm9wQXBpVG9rZW59YCB9IH0pO1xuICAgICAgICAgICAgICAgIGlmICghcmVzcG9uc2Uub2spIHsgLyogRXJyb3IgaGFuZGxpbmcgKi8gdGhyb3cgbmV3IEVycm9yKGBBbGwgSXRlbXMgRmV0Y2g6ICR7cmVzcG9uc2Uuc3RhdHVzfSAtICR7YXdhaXQgcmVzcG9uc2UudGV4dCgpfWApOyB9XG4gICAgICAgICAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgICAgICAgICAgICAgICAgaWYgKGRhdGE/Lml0ZW1zKSB7IGFsbERhdGEgPSBhbGxEYXRhLmNvbmNhdChkYXRhLml0ZW1zKTsgcGFnZSsrOyBoYXNNb3JlID0gZGF0YS5pdGVtcy5sZW5ndGggPT09IHBlclBhZ2U7IH1cbiAgICAgICAgICAgICAgICAgZWxzZSB7IGNvbnNvbGUud2FybihgVW5leHBlY3RlZCByZXNwb25zZSBmb3IgYWxsIGl0ZW1zIGZldGNoLiBTdG9wcGluZy5gKTsgaGFzTW9yZSA9IGZhbHNlOyB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgY29uc29sZS5sb2coJ0ZldGNoZWQgUmFpbmRyb3BzIFJhdyBEYXRhOicsIGFsbERhdGEpO1xuICAgICAgaWYgKGFsbERhdGEubGVuZ3RoID09PSAwICYmIChjb2xsZWN0aW9uSWRzLmxlbmd0aCA+IDAgfHwgc2VhcmNoUGFyYW1ldGVyU3RyaW5nKSkge1xuICAgICAgICBuZXcgTm90aWNlKCdObyByYWluZHJvcHMgZm91bmQgbWF0Y2hpbmcgeW91ciBjcml0ZXJpYS4nLCA1MDAwKTtcbiAgICAgIH0gZWxzZSBpZiAoYWxsRGF0YS5sZW5ndGggPiAwKSB7XG4gICAgICAgIG5ldyBOb3RpY2UoYFdvcmtzcGFjZWVkICR7YWxsRGF0YS5sZW5ndGh9IHJhaW5kcm9wcy4gUHJvY2Vzc2luZy4uLmAsIDUwMDApO1xuICAgICAgICBhd2FpdCB0aGlzLnByb2Nlc3NSYWluZHJvcHMoYWxsRGF0YSwgdmF1bHRQYXRoLCBhcHBlbmRUYWdzVG9Ob3RlcywgdXNlUmFpbmRyb3BUaXRsZUZvckZpbGVOYW1lKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgICBuZXcgTm90aWNlKCdGZXRjaGVkIDAgcmFpbmRyb3BzLicsIDMwMDApO1xuICAgICAgfVxuXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGxldCBlcnJvck1lc3NhZ2UgPSAnQW4gdW5rbm93biBlcnJvciBvY2N1cnJlZCBkdXJpbmcgZmV0Y2gnO1xuICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IpIGVycm9yTWVzc2FnZSA9IGVycm9yLm1lc3NhZ2U7XG4gICAgICBlbHNlIGlmICh0eXBlb2YgZXJyb3IgPT09ICdzdHJpbmcnKSBlcnJvck1lc3NhZ2UgPSBlcnJvcjtcbiAgICAgIG5ldyBOb3RpY2UoYEVycm9yIGZldGNoaW5nIHJhaW5kcm9wczogJHtlcnJvck1lc3NhZ2V9YCwgMTAwMDApO1xuICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZmV0Y2hpbmcgUmFpbmRyb3AgQVBJOicsIGVycm9yKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBwcm9jZXNzUmFpbmRyb3BzKHJhaW5kcm9wczogYW55W10sIHZhdWx0UGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkLCBhcHBlbmRUYWdzVG9Ob3Rlczogc3RyaW5nLCB1c2VSYWluZHJvcFRpdGxlRm9yRmlsZU5hbWU6IGJvb2xlYW4pIHtcbiAgICBjb25zdCB7IGFwcCB9ID0gdGhpcztcbiAgICBjb25zdCBzZXR0aW5nc0ZNVGFncyA9IGFwcGVuZFRhZ3NUb05vdGVzLnNwbGl0KCcsJykubWFwKHRhZyA9PiB0YWcudHJpbSgpKS5maWx0ZXIodGFnID0+IHRhZyAhPT0gJycpO1xuXG4gICAgaWYgKHZhdWx0UGF0aCA9PT0gdW5kZWZpbmVkKSB2YXVsdFBhdGggPSB0aGlzLnNldHRpbmdzLmRlZmF1bHRWYXVsdExvY2F0aW9uO1xuICAgIGNvbnN0IHRhcmdldEZvbGRlclBhdGggPSB2YXVsdFBhdGg/LnRyaW0oKSA/PyBcIlwiO1xuXG4gICAgaWYgKHRhcmdldEZvbGRlclBhdGggJiYgIWFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgodGFyZ2V0Rm9sZGVyUGF0aCkpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnNvbGUubG9nKGBBdHRlbXB0aW5nIHRvIGNyZWF0ZSBmb2xkZXI6ICR7dGFyZ2V0Rm9sZGVyUGF0aH1gKTtcbiAgICAgICAgYXdhaXQgYXBwLnZhdWx0LmNyZWF0ZUZvbGRlcih0YXJnZXRGb2xkZXJQYXRoKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICBsZXQgZXJyb3JNc2cgPSAnZm9sZGVyIGNyZWF0aW9uIGZhaWxlZCc7XG4gICAgICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBFcnJvcikgZXJyb3JNc2cgPSBlcnJvci5tZXNzYWdlO1xuICAgICAgICBuZXcgTm90aWNlKGBGYWlsZWQgdG8gY3JlYXRlIGZvbGRlcjogJHt0YXJnZXRGb2xkZXJQYXRofS4gRXJyb3I6ICR7ZXJyb3JNc2d9LmAsIDEwMDAwKTtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGNyZWF0aW5nIGZvbGRlclwiLCBlcnJvcik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgY3JlYXRlZENvdW50ID0gMDtcbiAgICBsZXQgc2tpcHBlZENvdW50ID0gMDtcbiAgICBsZXQgZXJyb3JDb3VudCA9IDA7XG5cbiAgICBmb3IgKGNvbnN0IHJhaW5kcm9wIG9mIHJhaW5kcm9wcykge1xuICAgICAgIGlmICghcmFpbmRyb3AgfHwgIXJhaW5kcm9wLmxpbmspIHtcbiAgICAgICAgICAgY29uc29sZS53YXJuKFwiU2tpcHBpbmcgaW52YWxpZCByYWluZHJvcCBkYXRhOlwiLCByYWluZHJvcCk7XG4gICAgICAgICAgIGVycm9yQ291bnQrKzsgY29udGludWU7XG4gICAgICAgfVxuXG4gICAgICB0cnkge1xuICAgICAgICBjb25zdCBnZW5lcmF0ZWRGaWxlbmFtZSA9IHRoaXMuZ2VuZXJhdGVGaWxlTmFtZShyYWluZHJvcCwgdXNlUmFpbmRyb3BUaXRsZUZvckZpbGVOYW1lKTtcbiAgICAgICAgY29uc3QgZmlsZVBhdGggPSB0YXJnZXRGb2xkZXJQYXRoID8gYCR7dGFyZ2V0Rm9sZGVyUGF0aH0vJHtnZW5lcmF0ZWRGaWxlbmFtZX0ubWRgIDogYCR7Z2VuZXJhdGVkRmlsZW5hbWV9Lm1kYDtcblxuICAgICAgICAgaWYgKGF3YWl0IGFwcC52YXVsdC5hZGFwdGVyLmV4aXN0cyhmaWxlUGF0aCkpIHtcbiAgICAgICAgICAgY29uc29sZS5sb2coYFNraXBwaW5nIGV4aXN0aW5nIGZpbGU6ICR7ZmlsZVBhdGh9YCk7XG4gICAgICAgICAgIHNraXBwZWRDb3VudCsrOyBjb250aW51ZTtcbiAgICAgICAgIH1cblxuICAgICAgICBjb25zdCByZFRpdGxlID0gcmFpbmRyb3AudGl0bGUgfHwgJ1VudGl0bGVkIFJhaW5kcm9wJztcbiAgICAgICAgY29uc3QgcmROb3RlQ29udGVudCA9IHJhaW5kcm9wLm5vdGUgfHwgJyc7XG4gICAgICAgIGNvbnN0IHJkRXhjZXJwdCA9IHJhaW5kcm9wLmV4Y2VycHQgfHwgJyc7XG4gICAgICAgIGNvbnN0IHJkU291cmNlVXJsID0gcmFpbmRyb3AubGluaztcbiAgICAgICAgY29uc3QgcmRDb3ZlclVybCA9IHJhaW5kcm9wLmNvdmVyIHx8ICcnO1xuXG4gICAgICAgIGxldCBmaWxlQ29udGVudCA9ICctLS1cXG4nO1xuICAgICAgICBmaWxlQ29udGVudCArPSBgdGl0bGU6IFwiJHtyZFRpdGxlLnJlcGxhY2UoL1wiL2csICdcXFxcXCInKX1cIlxcbmA7XG4gICAgICAgIGlmIChyZEV4Y2VycHQpIHtcbiAgICAgICAgICAgIGlmIChyZEV4Y2VycHQuaW5jbHVkZXMoJ1xcbicpKSB7XG4gICAgICAgICAgICAgICAgZmlsZUNvbnRlbnQgKz0gJ2Rlc2NyaXB0aW9uOiB8XFxuJztcbiAgICAgICAgICAgICAgICByZEV4Y2VycHQuc3BsaXQoJ1xcbicpLmZvckVhY2goKGxpbmU6IHN0cmluZykgPT4gZmlsZUNvbnRlbnQgKz0gYCAgJHtsaW5lLnJlcGxhY2UoL1xccyskLywgJycpfVxcbmApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBmaWxlQ29udGVudCArPSBgZGVzY3JpcHRpb246IFwiJHtyZEV4Y2VycHQucmVwbGFjZSgvXCIvZywgJ1xcXFxcIicpfVwiXFxuYDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHsgZmlsZUNvbnRlbnQgKz0gJ2Rlc2NyaXB0aW9uOiBcIlwiXFxuJzsgfVxuICAgICAgICBmaWxlQ29udGVudCArPSBgc291cmNlOiAke3JkU291cmNlVXJsfVxcbmA7XG5cbiAgICAgICAgbGV0IGNvbWJpbmVkRk1UYWdzOiBzdHJpbmdbXSA9IFsuLi5zZXR0aW5nc0ZNVGFnc107XG4gICAgICAgIGlmIChyYWluZHJvcC50YWdzICYmIEFycmF5LmlzQXJyYXkocmFpbmRyb3AudGFncykpIHtcbiAgICAgICAgICByYWluZHJvcC50YWdzLmZvckVhY2goKHRhZzogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB0cmltbWVkVGFnID0gdGFnLnRyaW0oKTtcbiAgICAgICAgICAgIGlmICh0cmltbWVkVGFnICYmICFjb21iaW5lZEZNVGFncy5pbmNsdWRlcyh0cmltbWVkVGFnKSkgY29tYmluZWRGTVRhZ3MucHVzaCh0cmltbWVkVGFnKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29tYmluZWRGTVRhZ3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgIGZpbGVDb250ZW50ICs9ICd0YWdzOlxcbic7XG4gICAgICAgICAgY29tYmluZWRGTVRhZ3MuZm9yRWFjaCgodGFnOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHNhbml0aXplZFRhZyA9IHRhZy5yZXBsYWNlKC8gL2csIFwiX1wiKS5yZXBsYWNlKC9bXlxcd1xcdTAwQzAtXFx1MDBGRlxcdTAxMDAtXFx1MDE3RlxcdTAxODAtXFx1MDI0RlxcdTFFMDAtXFx1MUVGRlxcLy1dKy9nLCAnJyk7XG4gICAgICAgICAgICBpZiAoc2FuaXRpemVkVGFnKSBmaWxlQ29udGVudCArPSBgICAtICR7c2FuaXRpemVkVGFnfVxcbmA7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7IGZpbGVDb250ZW50ICs9ICd0YWdzOiBbXVxcbic7IH1cbiAgICAgICAgZmlsZUNvbnRlbnQgKz0gYGJhbm5lcjogJHtyZENvdmVyVXJsfVxcbmA7XG4gICAgICAgIGZpbGVDb250ZW50ICs9ICctLS1cXG5cXG4nO1xuXG4gICAgICAgIGlmIChyZENvdmVyVXJsKSB7XG4gICAgICAgICAgY29uc3QgYWx0VGV4dCA9IHRoaXMuc2FuaXRpemVGaWxlTmFtZShyZFRpdGxlID09PSAnVW50aXRsZWQgUmFpbmRyb3AnID8gJ0NvdmVyIEltYWdlJyA6IHJkVGl0bGUpLnJlcGxhY2UoL1xcLm1kJC9pLCAnJyk7XG4gICAgICAgICAgZmlsZUNvbnRlbnQgKz0gYCFbJHthbHRUZXh0fV0oJHtyZENvdmVyVXJsfSlcXG5cXG5gO1xuICAgICAgICB9XG4gICAgICAgIGZpbGVDb250ZW50ICs9IGAjICR7cmRUaXRsZX1cXG5cXG5gO1xuICAgICAgICBpZiAocmROb3RlQ29udGVudCkgZmlsZUNvbnRlbnQgKz0gYCMjICR7cmROb3RlQ29udGVudH1cXG5cXG5gO1xuICAgICAgICBpZiAocmRFeGNlcnB0KSBmaWxlQ29udGVudCArPSBgJHtyZEV4Y2VycHR9XFxuXFxuYDtcbiAgICAgICAgaWYgKHJhaW5kcm9wLmhpZ2hsaWdodHMgJiYgQXJyYXkuaXNBcnJheShyYWluZHJvcC5oaWdobGlnaHRzKSAmJiByYWluZHJvcC5oaWdobGlnaHRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBmaWxlQ29udGVudCArPSAnIyMjIEhpZ2hsaWdodHNcXG4nO1xuICAgICAgICAgIHJhaW5kcm9wLmhpZ2hsaWdodHMuZm9yRWFjaCgoaGlnaGxpZ2h0OiB7IHRleHQ6IHN0cmluZzsgbm90ZT86IHN0cmluZyB9KSA9PiB7XG4gICAgICAgICAgICBpZiAoaGlnaGxpZ2h0LnRleHQpIGZpbGVDb250ZW50ICs9IGAtICR7aGlnaGxpZ2h0LnRleHQucmVwbGFjZSgvXFxyXFxufFxccnxcXG4vZywgJyAnKX1cXG5gO1xuICAgICAgICAgICAgaWYgKGhpZ2hsaWdodC5ub3RlKSBmaWxlQ29udGVudCArPSBgICAqTm90ZToqICR7aGlnaGxpZ2h0Lm5vdGUucmVwbGFjZSgvXFxyXFxufFxccnxcXG4vZywgJyAnKX1cXG5gO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIGZpbGVDb250ZW50ICs9ICdcXG4nO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgYXBwLnZhdWx0LmNyZWF0ZShmaWxlUGF0aCwgZmlsZUNvbnRlbnQpO1xuICAgICAgICBjcmVhdGVkQ291bnQrKztcblxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgIGVycm9yQ291bnQrKztcbiAgICAgICAgIGxldCBwcm9jZXNzRXJyb3JNc2cgPSAnQW4gdW5rbm93biBlcnJvciBvY2N1cnJlZCc7XG4gICAgICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBFcnJvcikgcHJvY2Vzc0Vycm9yTXNnID0gZXJyb3IubWVzc2FnZTtcbiAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBlcnJvciA9PT0gJ3N0cmluZycpIHByb2Nlc3NFcnJvck1zZyA9IGVycm9yO1xuICAgICAgICBjb25zdCByYWluZHJvcFRpdGxlRm9yRXJyb3IgPSByYWluZHJvcD8udGl0bGUgfHwgJ2FuIHVua25vd24gcmFpbmRyb3AnO1xuICAgICAgICBuZXcgTm90aWNlKGBFcnJvciBjcmVhdGluZyBmaWxlIGZvcjogJHtyYWluZHJvcFRpdGxlRm9yRXJyb3J9LiBFcnJvcjogJHtwcm9jZXNzRXJyb3JNc2d9YCwgMTAwMDApO1xuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBjcmVhdGluZyBmaWxlOicsIHByb2Nlc3NFcnJvck1zZywgZXJyb3IsIHJhaW5kcm9wKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsZXQgc3VtbWFyeSA9IGAke2NyZWF0ZWRDb3VudH0gbm90ZXMgY3JlYXRlZC5gO1xuICAgIGlmIChza2lwcGVkQ291bnQgPiAwKSBzdW1tYXJ5ICs9IGAgJHtza2lwcGVkQ291bnR9IHNraXBwZWQgKGFscmVhZHkgZXhpc3QpLmA7XG4gICAgaWYgKGVycm9yQ291bnQgPiAwKSBzdW1tYXJ5ICs9IGAgJHtlcnJvckNvdW50fSBlcnJvcnMuYDtcbiAgICBuZXcgTm90aWNlKHN1bW1hcnksIDcwMDApO1xuICAgIGNvbnNvbGUubG9nKGBSYWluZHJvcCBwcm9jZXNzaW5nIGNvbXBsZXRlLiBDcmVhdGVkOiAke2NyZWF0ZWRDb3VudH0sIFNraXBwZWQ6ICR7c2tpcHBlZENvdW50fSwgRXJyb3JzOiAke2Vycm9yQ291bnR9YCk7XG4gIH1cbn1cblxuY2xhc3MgUmFpbmRyb3BGZXRjaE1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwbHVnaW46IFJhaW5kcm9wVG9PYnNpZGlhbjtcbiAgdmF1bHRQYXRoOiBzdHJpbmc7XG4gIGNvbGxlY3Rpb25zOiBzdHJpbmcgPSAnJztcbiAgYXBpRmlsdGVyVGFnczogc3RyaW5nID0gJyc7XG4gIGluY2x1ZGVTdWJjb2xsZWN0aW9uczogYm9vbGVhbiA9IGZhbHNlO1xuICBhcHBlbmRUYWdzVG9Ob3Rlczogc3RyaW5nID0gJyc7XG4gIHVzZVJhaW5kcm9wVGl0bGVGb3JGaWxlTmFtZTogYm9vbGVhbiA9IHRydWU7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHBsdWdpbjogUmFpbmRyb3BUb09ic2lkaWFuKSB7XG4gICAgc3VwZXIoYXBwKTtcbiAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcbiAgICB0aGlzLnZhdWx0UGF0aCA9IHRoaXMucGx1Z2luLnNldHRpbmdzLmRlZmF1bHRWYXVsdExvY2F0aW9uO1xuICB9XG5cbiAgb25PcGVuKCkge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIGNvbnRlbnRFbC5jcmVhdGVFbCgnaDInLCB7IHRleHQ6ICdGZXRjaCBSYWluZHJvcHMgT3B0aW9ucycgfSk7XG5cbiAgICBjb250ZW50RWwuY3JlYXRlRWwoJ2gzJywgeyB0ZXh0OiAnRmV0Y2ggQ3JpdGVyaWEnIH0pO1xuICAgIG5ldyBTZXR0aW5nKGNvbnRlbnRFbClcbiAgICAgIC5zZXROYW1lKCdWYXVsdCBGb2xkZXIgKE9wdGlvbmFsKScpXG4gICAgICAuc2V0RGVzYygnVGFyZ2V0IGZvbGRlciBmb3Igbm90ZXMuIExlYXZlIGJsYW5rIGZvciB2YXVsdCByb290IG9yIGRlZmF1bHQgc2V0dGluZy4nKVxuICAgICAgLmFkZFRleHQoKHRleHQ6IFRleHRDb21wb25lbnQpID0+IHtcbiAgICAgICAgdGV4dC5zZXRQbGFjZWhvbGRlcih0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0VmF1bHRMb2NhdGlvbiB8fCAnVmF1bHQgUm9vdCcpXG4gICAgICAgICAgLnNldFZhbHVlKHRoaXMudmF1bHRQYXRoKVxuICAgICAgICAgIC5vbkNoYW5nZSgodmFsdWU6IHN0cmluZykgPT4geyB0aGlzLnZhdWx0UGF0aCA9IHZhbHVlLnRyaW0oKTsgfSk7XG4gICAgICB9KTtcbiAgICBuZXcgU2V0dGluZyhjb250ZW50RWwpXG4gICAgICAuc2V0TmFtZSgnQ29sbGVjdGlvbnMgKGNvbW1hLXNlcGFyYXRlZCBJRHMpJylcbiAgICAgIC5zZXREZXNjKCdMZWF2ZSBibGFuayB0byBmZXRjaCBmcm9tIGFsbCBjb2xsZWN0aW9ucyAodW5sZXNzIHRhZ3MgYmVsb3cgYXJlIHNwZWNpZmllZCkuJylcbiAgICAgIC5hZGRUZXh0KCh0ZXh0OiBUZXh0Q29tcG9uZW50KSA9PiB7XG4gICAgICAgIHRleHQuc2V0UGxhY2Vob2xkZXIoJ2UuZy4sIDEyMyw0NTYnKVxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLmNvbGxlY3Rpb25zKVxuICAgICAgICAgIC5vbkNoYW5nZSgodmFsdWU6IHN0cmluZykgPT4geyB0aGlzLmNvbGxlY3Rpb25zID0gdmFsdWU7IH0pO1xuICAgICAgfSk7XG4gICAgbmV3IFNldHRpbmcoY29udGVudEVsKVxuICAgICAgLnNldE5hbWUoJ0ZpbHRlciBieSBUYWdzIChjb21tYS1zZXBhcmF0ZWQpJylcbiAgICAgIC5zZXREZXNjKCdPbmx5IGZldGNoIHJhaW5kcm9wcyBtYXRjaGluZyBBTEwgc3BlY2lmaWVkIHRhZ3MuJylcbiAgICAgIC5hZGRUZXh0KCh0ZXh0OiBUZXh0Q29tcG9uZW50KSA9PiB7XG4gICAgICAgIHRleHQuc2V0UGxhY2Vob2xkZXIoJ2UuZy4sIGFydGljbGUsIHByb2plY3QteCcpXG4gICAgICAgICAgLnNldFZhbHVlKHRoaXMuYXBpRmlsdGVyVGFncylcbiAgICAgICAgICAub25DaGFuZ2UoKHZhbHVlOiBzdHJpbmcpID0+IHsgdGhpcy5hcGlGaWx0ZXJUYWdzID0gdmFsdWU7IH0pO1xuICAgICAgfSk7XG4gICAgbmV3IFNldHRpbmcoY29udGVudEVsKVxuICAgICAgLnNldE5hbWUoJ0luY2x1ZGUgU3ViY29sbGVjdGlvbnMnKVxuICAgICAgLnNldERlc2MoJ0lmIGZpbHRlcmluZyBieSBDb2xsZWN0aW9uIElEcywgYWxzbyBpbmNsdWRlIGl0ZW1zIGZyb20gdGhlaXIgc3ViY29sbGVjdGlvbnMuJylcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZTogVG9nZ2xlQ29tcG9uZW50KSA9PiB7XG4gICAgICAgIHRvZ2dsZS5zZXRWYWx1ZSh0aGlzLmluY2x1ZGVTdWJjb2xsZWN0aW9ucylcbiAgICAgICAgICAub25DaGFuZ2UoKHZhbHVlOiBib29sZWFuKSA9PiB7IHRoaXMuaW5jbHVkZVN1YmNvbGxlY3Rpb25zID0gdmFsdWU7IH0pO1xuICAgICAgfSk7XG5cbiAgICBjb250ZW50RWwuY3JlYXRlRWwoJ2gzJywgeyB0ZXh0OiAnTm90ZSBPcHRpb25zJyB9KTtcbiAgICBuZXcgU2V0dGluZyhjb250ZW50RWwpXG4gICAgICAuc2V0TmFtZSgnQXBwZW5kIFRhZ3MgdG8gTm90ZSBGcm9udG1hdHRlciAoY29tbWEtc2VwYXJhdGVkKScpXG4gICAgICAuc2V0RGVzYygnQWRkaXRpb25hbCB0YWdzIHRvIGFkZCB0byB0aGUgWUFNTCBmcm9udG1hdHRlciBvZiBlYWNoIGNyZWF0ZWQgbm90ZS4nKVxuICAgICAgLmFkZFRleHQoKHRleHQ6IFRleHRDb21wb25lbnQpID0+IHtcbiAgICAgICAgdGV4dC5zZXRQbGFjZWhvbGRlcignZS5nLiwgI2ltcG9ydGVkL3JhaW5kcm9wJylcbiAgICAgICAgICAuc2V0VmFsdWUodGhpcy5hcHBlbmRUYWdzVG9Ob3RlcylcbiAgICAgICAgICAub25DaGFuZ2UoKHZhbHVlOiBzdHJpbmcpID0+IHsgdGhpcy5hcHBlbmRUYWdzVG9Ob3RlcyA9IHZhbHVlOyB9KTtcbiAgICAgIH0pO1xuICAgIG5ldyBTZXR0aW5nKGNvbnRlbnRFbClcbiAgICAgIC5zZXROYW1lKCdVc2UgUmFpbmRyb3AgVGl0bGUgZm9yIEZpbGUgTmFtZScpXG4gICAgICAuc2V0RGVzYygnVXNlIHRpdGxlICh2aWEgdGVtcGxhdGUpIGZvciBmaWxlbmFtZXM/IElmIG9mZiwgdXNlcyBSYWluZHJvcCBJRC4nKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlOiBUb2dnbGVDb21wb25lbnQpID0+IHtcbiAgICAgICAgdG9nZ2xlLnNldFZhbHVlKHRoaXMudXNlUmFpbmRyb3BUaXRsZUZvckZpbGVOYW1lKVxuICAgICAgICAgIC5vbkNoYW5nZSgodmFsdWU6IGJvb2xlYW4pID0+IHsgdGhpcy51c2VSYWluZHJvcFRpdGxlRm9yRmlsZU5hbWUgPSB2YWx1ZTsgfSk7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKGNvbnRlbnRFbClcbiAgICAgIC5hZGRCdXR0b24oKGJ0bjogQnV0dG9uQ29tcG9uZW50KSA9PiB7XG4gICAgICAgIGJ0bi5zZXRCdXR0b25UZXh0KCdGZXRjaCBSYWluZHJvcHMnKVxuICAgICAgICAgIC5zZXRDdGEoKVxuICAgICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG9wdGlvbnM6IE1vZGFsRmV0Y2hPcHRpb25zID0ge1xuICAgICAgICAgICAgICB2YXVsdFBhdGg6IHRoaXMudmF1bHRQYXRoIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgY29sbGVjdGlvbnM6IHRoaXMuY29sbGVjdGlvbnMsXG4gICAgICAgICAgICAgIGFwaUZpbHRlclRhZ3M6IHRoaXMuYXBpRmlsdGVyVGFncyxcbiAgICAgICAgICAgICAgaW5jbHVkZVN1YmNvbGxlY3Rpb25zOiB0aGlzLmluY2x1ZGVTdWJjb2xsZWN0aW9ucyxcbiAgICAgICAgICAgICAgYXBwZW5kVGFnc1RvTm90ZXM6IHRoaXMuYXBwZW5kVGFnc1RvTm90ZXMsXG4gICAgICAgICAgICAgIHVzZVJhaW5kcm9wVGl0bGVGb3JGaWxlTmFtZTogdGhpcy51c2VSYWluZHJvcFRpdGxlRm9yRmlsZU5hbWUsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uZmV0Y2hSYWluZHJvcHMob3B0aW9ucyk7XG4gICAgICAgICAgfSk7XG4gICAgICB9KVxuICAgICAgLmFkZEJ1dHRvbigoYnRuOiBCdXR0b25Db21wb25lbnQpID0+IHtcbiAgICAgICAgYnRuLnNldEJ1dHRvblRleHQoJ0NhbmNlbCcpXG4gICAgICAgIC5vbkNsaWNrKCgpID0+IHsgdGhpcy5jbG9zZSgpOyB9KTtcbiAgICAgIH0pO1xuICB9XG4gIG9uQ2xvc2UoKSB7IGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzOyBjb250ZW50RWwuZW1wdHkoKTsgfVxufVxuXG5jbGFzcyBSYWluZHJvcFRvT2JzaWRpYW5TZXR0aW5nVGFiIGV4dGVuZHMgUGx1Z2luU2V0dGluZ1RhYiB7XG4gIHBsdWdpbjogUmFpbmRyb3BUb09ic2lkaWFuO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwbHVnaW46IFJhaW5kcm9wVG9PYnNpZGlhbikge1xuICAgIHN1cGVyKGFwcCwgcGx1Z2luKTtcbiAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcbiAgfVxuXG4gIGRpc3BsYXkoKTogdm9pZCB7XG4gICAgY29uc3QgeyBjb250YWluZXJFbCB9ID0gdGhpcztcbiAgICBjb250YWluZXJFbC5lbXB0eSgpO1xuXG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoJ2ltZycsIHtcbiAgICAgIGF0dHI6IHtcbiAgICAgICAgc3JjOiBcImh0dHBzOi8vaS5pYmIuY28vSFR4N1RuYk4vbWFrZWl0cmFpbi5wbmdcIixcbiAgICAgICAgd2lkdGg6IFwiNzUwXCJcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKCdoMicsIHtcbiAgICAgIHRleHQ6ICdJbXBvcnQgeW91ciBSYWluZHJvcC5pbyBib29rbWFya3MgaW50byB5b3VyIE9ic2lkaWFuIHZhdWx0J1xuICAgIH0pO1xuXG5cbiAgICBjb250YWluZXJFbC5jcmVhdGVFbCgncCcpLmNyZWF0ZUVsKCdhJywge1xuICAgICAgICB0ZXh0OiAnVmlzaXQgUmFpbmRyb3AuaW8gd2Vic2l0ZScsXG4gICAgICAgIGhyZWY6ICdodHRwczovL3JhaW5kcm9wLmlvJyxcbiAgICAgICAgYXR0cjogeyB0YXJnZXQ6ICdfYmxhbmsnLCByZWw6ICdub29wZW5lciBub3JlZmVycmVyJyB9XG4gICAgIH0pO1xuXG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoJ2hyJyk7XG5cbiAgICBjb250YWluZXJFbC5jcmVhdGVFbCgnaDMnLCB7IHRleHQ6ICdBUEkgQ29uZmlndXJhdGlvbicgfSk7XG4gICAgY29uc3QgYXBpRGVzYyA9IGNvbnRhaW5lckVsLmNyZWF0ZURpdih7IGNsczogJ3NldHRpbmctaXRlbS1kZXNjcmlwdGlvbicgfSk7XG4gICAgYXBpRGVzYy5jcmVhdGVTcGFuKHsgdGV4dDogJ1lvdSBuZWVkIHRvIGNyZWF0ZSBhIFRlc3QgVG9rZW4gZnJvbSB5b3VyICd9KTtcbiAgICBhcGlEZXNjLmNyZWF0ZUVsKCdhJywge1xuICAgICAgICB0ZXh0OiAnUmFpbmRyb3AuaW8gQXBwcyBzZXR0aW5ncyBwYWdlJyxcbiAgICAgICAgaHJlZjogJ2h0dHBzOi8vYXBwLnJhaW5kcm9wLmlvL3NldHRpbmdzL2ludGVncmF0aW9ucycsXG4gICAgICAgIGF0dHI6IHsgdGFyZ2V0OiAnX2JsYW5rJywgcmVsOiAnbm9vcGVuZXIgbm9yZWZlcnJlcicgfVxuICAgIH0pO1xuICAgIGFwaURlc2MuY3JlYXRlU3Bhbih7IHRleHQ6ICcuJ30pO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZSgnUmFpbmRyb3AuaW8gQVBJIFRva2VuJylcbiAgICAgIC5hZGRUZXh0KCh0ZXh0OiBUZXh0Q29tcG9uZW50KSA9PiB7XG4gICAgICAgIHRleHQuc2V0UGxhY2Vob2xkZXIoJ0VudGVyIHlvdXIgdG9rZW4nKVxuICAgICAgICAgIC5zZXRWYWx1ZSh0aGlzLnBsdWdpbi5zZXR0aW5ncy5yYWluZHJvcEFwaVRva2VuKVxuICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWU6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MucmFpbmRyb3BBcGlUb2tlbiA9IHZhbHVlO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKCdocicpO1xuXG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoJ2gzJywgeyB0ZXh0OiAnTm90ZSBTdG9yYWdlICYgTmFtaW5nJyB9KTtcbiAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgIC5zZXROYW1lKCdEZWZhdWx0IFZhdWx0IExvY2F0aW9uIGZvciBOb3RlcycpXG4gICAgICAuc2V0RGVzYygnRGVmYXVsdCBmb2xkZXIgdG8gc2F2ZSBub3RlcyBpZiBub3Qgc3BlY2lmaWVkIGluIHRoZSBmZXRjaCBvcHRpb25zIG1vZGFsLiBMZWF2ZSBibGFuayBmb3IgdmF1bHQgcm9vdC4nKVxuICAgICAgLmFkZFRleHQoKHRleHQ6IFRleHRDb21wb25lbnQpID0+IHtcbiAgICAgICAgdGV4dC5zZXRQbGFjZWhvbGRlcignZS5nLiwgUmFpbmRyb3BzL0luYm94JylcbiAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZGVmYXVsdFZhdWx0TG9jYXRpb24pXG4gICAgICAgICAgLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5kZWZhdWx0VmF1bHRMb2NhdGlvbiA9IHZhbHVlLnRyaW0oKTtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgY29udGFpbmVyRWwuY3JlYXRlRWwoJ3AnLCB7XG4gICAgICAgY2xzOiAnc2V0dGluZy1pdGVtLWRlc2NyaXB0aW9uJyxcbiAgICAgICB0ZXh0OiAnQ29uZmlndXJlIGhvdyBmaWxlbmFtZXMgYXJlIGdlbmVyYXRlZCB3aGVuIFwiVXNlIFJhaW5kcm9wIFRpdGxlXCIgaXMgZW5hYmxlZCBpbiB0aGUgZmV0Y2ggb3B0aW9ucyBtb2RhbC4gVXNlcyBIYW5kbGViYXJzLWxpa2Ugc3ludGF4LidcbiAgICAgfSk7XG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZSgnRmlsZSBOYW1lIFRlbXBsYXRlJylcbiAgICAgIC5zZXREZXNjKCdQbGFjZWhvbGRlcnM6IHt7dGl0bGV9fSwge3tpZH19LCB7e2NvbGxlY3Rpb25UaXRsZX19LCB7e2RhdGV9fSAoWVlZWS1NTS1ERCkuJylcbiAgICAgIC5hZGRUZXh0KCh0ZXh0OiBUZXh0Q29tcG9uZW50KSA9PiB7XG4gICAgICAgIHRleHQuc2V0UGxhY2Vob2xkZXIoJ3t7dGl0bGV9fScpXG4gICAgICAgICAgICAuc2V0VmFsdWUodGhpcy5wbHVnaW4uc2V0dGluZ3MuZmlsZU5hbWVUZW1wbGF0ZSlcbiAgICAgICAgICAgIC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5maWxlTmFtZVRlbXBsYXRlID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uc2F2ZVNldHRpbmdzKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKCdocicpO1xuXG4gICAgIGNvbnN0IGZvb3RlciA9IGNvbnRhaW5lckVsLmNyZWF0ZURpdih7IGNsczogJ3NldHRpbmctZm9vdGVyJyB9KTtcbiAgICAgZm9vdGVyLmNyZWF0ZUVsKCdwJywge1xuICAgICAgIHRleHQ6ICdOZWVkIGhlbHAgY29uZmlndXJpbmcgb3IgdXNpbmcgdGhlIHBsdWdpbj8gQ2hlY2sgdGhlIFJFQURNRS4nXG4gICAgIH0pO1xuICAgICBmb290ZXIuY3JlYXRlRWwoJ2EnLCB7XG4gICAgICAgIHRleHQ6ICdQbHVnaW4gR2l0SHViIFJlcG9zaXRvcnkgKEV4YW1wbGUpJyxcbiAgICAgICAgaHJlZjogJ2h0dHBzOi8vZ2l0aHViLmNvbS95b3VyLXVzZXJuYW1lL3lvdXItcmVwby1uYW1lJyxcbiAgICAgICAgYXR0cjogeyB0YXJnZXQ6ICdfYmxhbmsnLCByZWw6ICdub29wZW5lciBub3JlZmVycmVyJyB9XG4gICAgIH0pO1xuXG4gIH1cbn0iXX0=
