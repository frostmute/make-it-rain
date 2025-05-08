import { App, Notice, Plugin, PluginSettingTab, Setting, Modal, TextComponent, ButtonComponent, ToggleComponent, PluginManifest } from 'obsidian';

interface ModalFetchOptions {
  vaultPath?: string;
  collections: string;
  apiFilterTags: string;
  includeSubcollections: boolean;
  appendTagsToNotes: string;
  useRaindropTitleForFileName: boolean;
}

interface RaindropToObsidianSettings {
  raindropApiToken: string;
  defaultVaultLocation: string;
  fileNameTemplate: string;
}

const DEFAULT_SETTINGS: RaindropToObsidianSettings = {
  raindropApiToken: '',
  defaultVaultLocation: '',
  fileNameTemplate: '{{title}}',
};

export default class RaindropToObsidian extends Plugin {
  settings: RaindropToObsidianSettings;

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);
    this.settings = { ...DEFAULT_SETTINGS };
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
    const { vaultPath, collections, apiFilterTags, includeSubcollections, appendTagsToNotes, useRaindropTitleForFileName } = options;

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
        searchParameterString = filterTagsArray.map(tag => {
            if (tag.includes(' ')) return `#"${tag}"`;
            return `#${tag}`;
        }).join(' ');
    }

    const baseApiUrl = 'https://api.raindrop.io/rest/v1/raindrops/';
    let allData: any[] = [];
    let page = 0;
    const perPage = 50;

    try {
        let fetchMode = 'all';
        if (collectionIds.length > 0) fetchMode = 'collections';
        else if (searchParameterString) fetchMode = 'tags';

        if (fetchMode === 'collections') {
            for (const collectionId of collectionIds) {
                let hasMore = true; page = 0;
                while (hasMore) {
                    const params = new URLSearchParams({ perpage: perPage.toString(), page: page.toString() });
                    if (includeSubcollections) params.append('nested', 'true');
                    if (searchParameterString) params.append('search', searchParameterString);
                    const currentApiUrl = `${baseApiUrl}${collectionId}?${params.toString()}`;
                    console.log("Requesting collection search URL:", currentApiUrl);
                    const response = await fetch(currentApiUrl, { headers: { 'Authorization': `Bearer ${raindropApiToken}` } });
                    if (!response.ok) { /* Error handling */ throw new Error(`Collection ${collectionId}: ${response.status} - ${await response.text()}`); }
                    const data = await response.json();
                    if (data?.items) { allData = allData.concat(data.items); page++; hasMore = data.items.length === perPage; }
                    else { console.warn(`Unexpected response for coll ${collectionId}. Stopping.`); hasMore = false; }
                }
            }
        } else if (fetchMode === 'tags') {
            let hasMore = true; page = 0;
            while (hasMore) {
                const params = new URLSearchParams({ perpage: perPage.toString(), page: page.toString() });
                if (includeSubcollections) params.append('nested', 'true');
                params.append('search', searchParameterString);
                const currentApiUrl = `${baseApiUrl}0?${params.toString()}`;
                console.log("Requesting global tag search URL:", currentApiUrl);
                const response = await fetch(currentApiUrl, { headers: { 'Authorization': `Bearer ${raindropApiToken}` } });
                 if (!response.ok) { /* Error handling */ throw new Error(`Tags Search: ${response.status} - ${await response.text()}`); }
                const data = await response.json();
                if (data?.items) { allData = allData.concat(data.items); page++; hasMore = data.items.length === perPage; }
                else { console.warn(`Unexpected response for tags search. Stopping.`); hasMore = false; }
            }
        } else {
            let hasMore = true; page = 0;
            while (hasMore) {
                const params = new URLSearchParams({ perpage: perPage.toString(), page: page.toString() });
                if (includeSubcollections) params.append('nested', 'true');
                const currentApiUrl = `${baseApiUrl}0?${params.toString()}`;
                console.log("Requesting global all items URL:", currentApiUrl);
                const response = await fetch(currentApiUrl, { headers: { 'Authorization': `Bearer ${raindropApiToken}` } });
                if (!response.ok) { /* Error handling */ throw new Error(`All Items Fetch: ${response.status} - ${await response.text()}`); }
                const data = await response.json();
                 if (data?.items) { allData = allData.concat(data.items); page++; hasMore = data.items.length === perPage; }
                 else { console.warn(`Unexpected response for all items fetch. Stopping.`); hasMore = false; }
            }
        }

      console.log('Fetched Raindrops Raw Data:', allData);
      if (allData.length === 0 && (collectionIds.length > 0 || searchParameterString)) {
        new Notice('No raindrops found matching your criteria.', 5000);
      } else if (allData.length > 0) {
        new Notice(`Workspaceed ${allData.length} raindrops. Processing...`, 5000);
        await this.processRaindrops(allData, vaultPath, appendTagsToNotes, useRaindropTitleForFileName);
      } else {
         new Notice('Fetched 0 raindrops.', 3000);
      }

    } catch (error) {
      let errorMessage = 'An unknown error occurred during fetch';
      if (error instanceof Error) errorMessage = error.message;
      else if (typeof error === 'string') errorMessage = error;
      new Notice(`Error fetching raindrops: ${errorMessage}`, 10000);
      console.error('Error fetching Raindrop API:', error);
    }
  }

  async processRaindrops(raindrops: any[], vaultPath: string | undefined, appendTagsToNotes: string, useRaindropTitleForFileName: boolean) {
    const { app } = this;
    const settingsFMTags = appendTagsToNotes.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

    if (vaultPath === undefined) vaultPath = this.settings.defaultVaultLocation;
    const targetFolderPath = vaultPath?.trim() ?? "";

    if (targetFolderPath && !app.vault.getAbstractFileByPath(targetFolderPath)) {
      try {
        console.log(`Attempting to create folder: ${targetFolderPath}`);
        await app.vault.createFolder(targetFolderPath);
      } catch (error) {
         let errorMsg = 'folder creation failed';
         if (error instanceof Error) errorMsg = error.message;
        new Notice(`Failed to create folder: ${targetFolderPath}. Error: ${errorMsg}.`, 10000);
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
           errorCount++; continue;
       }

      try {
        const generatedFilename = this.generateFileName(raindrop, useRaindropTitleForFileName);
        const filePath = targetFolderPath ? `${targetFolderPath}/${generatedFilename}.md` : `${generatedFilename}.md`;

         if (await app.vault.adapter.exists(filePath)) {
           console.log(`Skipping existing file: ${filePath}`);
           skippedCount++; continue;
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
                rdExcerpt.split('\n').forEach((line: string) => fileContent += `  ${line.replace(/\s+$/, '')}\n`);
            } else {
                fileContent += `description: "${rdExcerpt.replace(/"/g, '\\"')}"\n`;
            }
        } else { fileContent += 'description: ""\n'; }
        fileContent += `source: ${rdSourceUrl}\n`;

        let combinedFMTags: string[] = [...settingsFMTags];
        if (raindrop.tags && Array.isArray(raindrop.tags)) {
          raindrop.tags.forEach((tag: string) => {
            const trimmedTag = tag.trim();
            if (trimmedTag && !combinedFMTags.includes(trimmedTag)) combinedFMTags.push(trimmedTag);
          });
        }
        if (combinedFMTags.length > 0) {
          fileContent += 'tags:\n';
          combinedFMTags.forEach((tag: string) => {
            const sanitizedTag = tag.replace(/ /g, "_").replace(/[^\w\u00C0-\u00FF\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF\/-]+/g, '');
            if (sanitizedTag) fileContent += `  - ${sanitizedTag}\n`;
          });
        } else { fileContent += 'tags: []\n'; }
        fileContent += `banner: ${rdCoverUrl}\n`;
        fileContent += '---\n\n';

        if (rdCoverUrl) {
          const altText = this.sanitizeFileName(rdTitle === 'Untitled Raindrop' ? 'Cover Image' : rdTitle).replace(/\.md$/i, '');
          fileContent += `![${altText}](${rdCoverUrl})\n\n`;
        }
        fileContent += `# ${rdTitle}\n\n`;
        if (rdNoteContent) fileContent += `## ${rdNoteContent}\n\n`;
        if (rdExcerpt) fileContent += `${rdExcerpt}\n\n`;
        if (raindrop.highlights && Array.isArray(raindrop.highlights) && raindrop.highlights.length > 0) {
          fileContent += '### Highlights\n';
          raindrop.highlights.forEach((highlight: { text: string; note?: string }) => {
            if (highlight.text) fileContent += `- ${highlight.text.replace(/\r\n|\r|\n/g, ' ')}\n`;
            if (highlight.note) fileContent += `  *Note:* ${highlight.note.replace(/\r\n|\r|\n/g, ' ')}\n`;
          });
          fileContent += '\n';
        }

        await app.vault.create(filePath, fileContent);
        createdCount++;

      } catch (error) {
         errorCount++;
         let processErrorMsg = 'An unknown error occurred';
         if (error instanceof Error) processErrorMsg = error.message;
         else if (typeof error === 'string') processErrorMsg = error;
        const raindropTitleForError = raindrop?.title || 'an unknown raindrop';
        new Notice(`Error creating file for: ${raindropTitleForError}. Error: ${processErrorMsg}`, 10000);
        console.error('Error creating file:', processErrorMsg, error, raindrop);
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
      .setDesc('Only fetch raindrops matching ALL specified tags.')
      .addText((text: TextComponent) => {
        text.setPlaceholder('e.g., article, project-x')
          .setValue(this.apiFilterTags)
          .onChange((value: string) => { this.apiFilterTags = value; });
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
