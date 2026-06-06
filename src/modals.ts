import { App, Modal, Setting, TextComponent, ButtonComponent, Notice, ToggleComponent, DropdownComponent } from 'obsidian';
import type RaindropToObsidian from './main';
import { 
    IRaindropToObsidian,
    RaindropCollection, 
    RaindropType, 
    TagMatchTypes, 
    RaindropTypes, 
    ModalFetchOptions,
    AggregateHighlightsOptions
} from './types';

/**
 * Modal for fetching raindrops with filters
 */
export class RaindropFetchModal extends Modal {
    plugin: RaindropToObsidian;
    vaultPath: string;
    collections: string = '';
    apiFilterTags: string = '';
    includeSubcollections: boolean = true;
    appendTagsToNotes: string = '';
    useRaindropTitleForFileName: boolean = true;
    tagMatchType: 'all' | 'any' = TagMatchTypes.ALL;
    filterType: RaindropType | 'all' = 'all';
    fetchOnlyNew: boolean = true;
    updateExisting: boolean = false;
    useDefaultTemplate: boolean = false;
    overrideTemplates: boolean = false;

    constructor(app: App, plugin: RaindropToObsidian) {
        super(app);
        this.plugin = plugin;
        this.vaultPath = plugin.settings.defaultFolder;
    }


    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('make-it-rain-modal');

        // Header
        const headerEl = contentEl.createDiv({ cls: 'make-it-rain-modal-header' });
        headerEl.createEl('h2', { text: 'Bulk Import Raindrops' });
        headerEl.createEl('p', { 
            text: 'Fetch and organize bookmarks directly from your Raindrop.io collections.',
            cls: 'setting-item-description'
        });
        
        contentEl.createEl('hr');

        // --- 1. Source & Scope ---
        const sourceGroup = contentEl.createDiv({ cls: 'make-it-rain-modal-group' });
        sourceGroup.createEl('h3', { text: 'Source', cls: 'make-it-rain-h3' });

                // A standard text input for quick typing (retained for advanced users / pasting)
        new Setting(sourceGroup)
            .setName('Collections filter (Text)')
            .setDesc('Collection names or IDs separated by commas. Leave blank for all.')
            .addText(text => text
                .setPlaceholder('All Collections')
                .setValue(this.collections)
                .onChange(value => {
                    this.collections = value;
                }));

        // An expandable multi-select list fetched dynamically from Raindrop
        const collectionListSetting = new Setting(sourceGroup)
            .setName('Select collections from account')
            .setDesc('Pick specific collections to import (loads automatically).');
            
        const collectionsContainer = collectionListSetting.controlEl.createDiv({ cls: 'make-it-rain-collections-list-container' });
        collectionsContainer.createEl('div', { text: 'Loading collections...', cls: 'make-it-rain-loading-text' });

        this.plugin.fetchAllUserCollections().then(collections => {
            collectionsContainer.empty();
            
            if (!collections || collections.length === 0) {
                collectionsContainer.createEl('div', { text: 'No collections found or API token invalid.', cls: 'setting-item-description' });
                return;
            }

            // Create a small scrollable box
            const listEl = collectionsContainer.createDiv({ cls: 'make-it-rain-collections-list' });
            
            // Sort alphabetically
            collections.sort((a, b) => a.title.localeCompare(b.title));

            collections.forEach(col => {
                const label = listEl.createEl('label', { cls: 'make-it-rain-collection-label' });
                const checkbox = label.createEl('input', { type: 'checkbox' });
                
                // If it's already in the text input, check it
                const currentInputs = this.collections.split(',').map(s => s.trim().toLowerCase());
                if (currentInputs.includes(col.title.toLowerCase()) || currentInputs.includes(col._id.toString())) {
                    checkbox.checked = true;
                }

                checkbox.addEventListener('change', () => {
                    const currentSet = new Set(this.collections.split(',').map(s => s.trim()).filter(Boolean));
                    if (checkbox.checked) {
                        currentSet.add(col.title);
                    } else {
                        currentSet.delete(col.title);
                        currentSet.delete(col._id.toString());
                    }
                    this.collections = Array.from(currentSet).join(', ');
                    
                    // We also need to update the text input visually to match
                    // This finds the text input sibling and updates its value
                    const textInputs = sourceGroup.querySelectorAll('input[type="text"]');
                    if (textInputs && textInputs.length > 0) {
                        (textInputs[0] as HTMLInputElement).value = this.collections;
                    }
                });

                label.appendChild(activeWindow.document.createTextNode(' ' + col.title));
            });
        });

        new Setting(sourceGroup)
            .setName('Include subcollections')
            .setDesc('Also fetch bookmarks from children of the specified collections.')
            .addToggle(toggle => toggle
                .setValue(this.includeSubcollections)
                .onChange(value => this.includeSubcollections = value));

        new Setting(sourceGroup)
            .setName('Save destination')
            .setDesc('Vault folder path to save imports. Overrides global settings if provided.')
            .addText(text => text
                .setPlaceholder(this.plugin.settings.defaultFolder || 'Vault root')
                .setValue(this.vaultPath)
                .onChange(value => this.vaultPath = value));

        // --- 2. Filters ---
        const filterGroup = contentEl.createDiv({ cls: 'make-it-rain-modal-group' });
        filterGroup.createEl('h3', { text: 'Filters', cls: 'make-it-rain-h3' });

        new Setting(filterGroup)
            .setName('Filter by tags')
            .setDesc('Only fetch raindrops with these tags (comma-separated).')
            .addText(text => text
                .setPlaceholder('e.g. css, typescript')
                .setValue(this.apiFilterTags)
                .onChange(value => {
                    this.apiFilterTags = value;
                    tagMatchSetting.settingEl.style.display = value.trim() ? '' : 'none';
                }));

        const tagMatchSetting = new Setting(filterGroup)
            .setName('Tag match mode')
            .setDesc('How should multiple tags be evaluated?')
            .addDropdown(dropdown => {
                dropdown.addOption(TagMatchTypes.ALL, 'Must have ALL tags (AND)')
                        .addOption(TagMatchTypes.ANY, 'Must have ANY tag (OR)')
                        .setValue(this.tagMatchType)
                        .onChange(value => this.tagMatchType = value as 'all' | 'any');
            });
        tagMatchSetting.settingEl.style.display = this.apiFilterTags.trim() ? '' : 'none';

        new Setting(filterGroup)
            .setName('Filter by type')
            .setDesc('Only import specific types of bookmarks.')
            .addDropdown(dropdown => {
                dropdown.addOption('all', 'All Types');
                Object.values(RaindropTypes).forEach(type => {
                    dropdown.addOption(type, type.charAt(0).toUpperCase() + type.slice(1));
                });
                dropdown.setValue(this.filterType)
                        .onChange(value => this.filterType = value as RaindropType | 'all');
            });

        new Setting(filterGroup)
            .setName('Fetch only new')
            .setDesc('Skip bookmarks if their corresponding file already exists in the vault.')
            .addToggle(toggle => toggle
                .setValue(this.fetchOnlyNew)
                .onChange(value => this.fetchOnlyNew = value));
                
        new Setting(filterGroup)
            .setName('Update existing notes')
            .setDesc('Update frontmatter on existing notes.')
            .addToggle(toggle => toggle
                .setValue(this.updateExisting)
                .onChange(value => this.updateExisting = value));

        // --- 3. Note Content ---
        const contentGroup = contentEl.createDiv({ cls: 'make-it-rain-modal-group' });
        contentGroup.createEl('h3', { text: 'Note Formatting', cls: 'make-it-rain-h3' });

        new Setting(contentGroup)
            .setName('Append vault tags')
            .setDesc('Add these local tags to all imported notes (comma-separated).')
            .addText(text => text
                .setPlaceholder('e.g. #imported, #raindrop')
                .setValue(this.appendTagsToNotes)
                .onChange(value => this.appendTagsToNotes = value));

        new Setting(contentGroup)
            .setName('Use Raindrop title for filename')
            .setDesc('Disable to use the unique Raindrop ID as the filename instead.')
            .addToggle(toggle => toggle
                .setValue(this.useRaindropTitleForFileName)
                .onChange(value => this.useRaindropTitleForFileName = value));

        if (this.plugin.settings.isTemplateSystemEnabled) {
            new Setting(contentGroup)
                .setName('Disable custom templates')
                .setDesc('Temporary override: ignore your custom templates and import using the basic fallback structure for this run.')
                .addToggle(toggle => toggle
                    .setValue(this.overrideTemplates)
                    .onChange(value => this.overrideTemplates = value));
        }

        contentEl.createEl('hr');

        // Actions
        const buttonsEl = contentEl.createDiv({ cls: 'modal-button-container' });
        new ButtonComponent(buttonsEl)
            .setButtonText('Start Import')
            .setCta()
            .onClick(() => {
                this.close();
                const options: ModalFetchOptions = {
                    collections: this.collections,
                    apiFilterTags: this.apiFilterTags,
                    vaultPath: this.vaultPath,
                    appendTagsToNotes: this.appendTagsToNotes,
                    useRaindropTitleForFileName: this.useRaindropTitleForFileName,
                    tagMatchType: this.tagMatchType,
                    filterType: this.filterType,
                    includeSubcollections: this.includeSubcollections,
                    fetchOnlyNew: this.fetchOnlyNew,
                    updateExisting: this.updateExisting,
                    useDefaultTemplate: this.useDefaultTemplate,
                    overrideTemplates: this.overrideTemplates
                };
                this.plugin.fetchRaindrops(options);
            });
            
        new ButtonComponent(buttonsEl)
            .setButtonText('Cancel')
            .onClick(() => this.close());
    }

    private buildFetchCriteriaSection(contentEl: HTMLElement) {
        new Setting(contentEl).setName('Fetch criteria').setHeading();

        new Setting(contentEl)
            .setName('Vault save location (optional)')
            .setDesc('Override default save folder for this fetch. Leave blank for plugin default.')
            .setClass('setting-item-stacked') // Added class
            .addText((text: TextComponent) => {
                text.setPlaceholder(this.plugin.settings.defaultFolder || 'Vault root')
                    .setValue(this.vaultPath)
                    .onChange((value: string) => {
                        this.vaultPath = value;
                    });
                text.inputEl.addClass('make-it-rain-full-width');
            });

        let collectionsTextComponent: TextComponent;
        new Setting(contentEl)
            .setName('Filter by collections')
            .setDesc('Comma-separated collection ids or names. Click a collection below to add its name. If typing names manually, use ids for duplicate collection names to ensure accuracy.')
            .setClass('setting-item-stacked') // Added class
            .addText((text: TextComponent) => {
                collectionsTextComponent = text; // Store reference to update it later
                text.setPlaceholder('My collection')
                    .setValue(this.collections)
                    .onChange((value: string) => {
                        this.collections = value;
                    });
                text.inputEl.addClass('make-it-rain-full-width');
            });

        // Search/Selection for collections
        const selectionContainer = contentEl.createDiv({ cls: 'make-it-rain-collection-selection' });
        const searchInput = new TextComponent(selectionContainer)
            .setPlaceholder('Search collections to add...')
            .onChange(async (value: string) => {
                renderCollections(value.toLowerCase());
            });
        searchInput.inputEl.addClass('make-it-rain-full-width');
        
        const scrollContainer = selectionContainer.createDiv({ cls: 'make-it-rain-collections-container' });
        const listContainer = scrollContainer.createDiv({ cls: 'make-it-rain-collection-list' });

        const renderCollections = (searchText: string = '') => {
            listContainer.empty();
            listContainer.createEl('div', { text: 'Loading collections...', cls: 'make-it-rain-loading-text' });
            
            this.plugin.fetchAllUserCollections().then(collections => {
                listContainer.empty();
                
                if (collections.length === 0) {
                    listContainer.createEl('div', { text: 'No collections found.', cls: 'make-it-rain-empty-state' });
                    return;
                }

                const filtered = collections.filter(c => c.title.toLowerCase().includes(searchText));
                
                if (filtered.length === 0) {
                    listContainer.createEl('div', { text: 'No matching collections.', cls: 'make-it-rain-empty-state' });
                    return;
                }

                // Grouping and sorting can be added here if needed
                const collectionMap = new Map<number, RaindropCollection>();
                collections.forEach(c => collectionMap.set(c._id, c));

                const getDisplayPath = (collection: RaindropCollection): string => {
                    const parts: string[] = [collection.title];
                    let current: RaindropCollection | undefined = collection;
                    while (current?.parent?.$id) {
                        current = collectionMap.get(current.parent.$id);
                        if (current) parts.unshift(current.title);
                        else break;
                    }
                    return parts.join(' > ');
                };

                const collectionsWithPaths = filtered.map(col => ({
                    col,
                    displayPath: getDisplayPath(col)
                })).sort((a, b) => a.displayPath.localeCompare(b.displayPath));

                collectionsWithPaths.forEach(({ displayPath }) => {
                    const item = listContainer.createDiv({ cls: 'make-it-rain-collection-item' });
                    item.createEl('span', { text: displayPath });
                    item.onClickEvent(() => {
                        const current = collectionsTextComponent.getValue();
                        const toAdd = displayPath;
                        const existingEntries = current.split(',').map(s => s.trim()).filter(Boolean);
                        if (existingEntries.includes(toAdd)) return;
                        
                        const newValue = current ? `${current}, ${toAdd}` : toAdd;
                        collectionsTextComponent.setValue(newValue);
                        this.collections = newValue;
                        new Notice(`Added collection: ${toAdd}`);
                    });
                });
            }).catch(error => {
                listContainer.empty();
                listContainer.createEl('div', { text: 'Failed to load collections. Check your API token.', cls: 'make-it-rain-error-text' });
                console.error('Error fetching collections in modal:', error);
            });
        };

        renderCollections();

        new Setting(contentEl)
            .setName('Include subcollections')
            .setDesc('If enabled, raindrops from all nested collections of the ones specified above will also be fetched.')
            .addToggle((toggle: ToggleComponent) => {
                toggle.setValue(this.includeSubcollections)
                    .onChange((value: boolean) => {
                        this.includeSubcollections = value;
                    });
            });

        new Setting(contentEl)
            .setName('Filter by tags')
            .setDesc('Comma-separated raindrop tag names.')
            .setClass('setting-item-stacked') // Added class
            .addText((text: TextComponent) => {
                text.setPlaceholder('Obsidian')
                    .setValue(this.apiFilterTags)
                    .onChange((value: string) => {
                        this.apiFilterTags = value;
                    });
                text.inputEl.addClass('make-it-rain-full-width');
            });

        const tagMatchSetting = new Setting(contentEl)
            .setName('Tag match type')
            .setDesc("Choose 'all' for items with all specified tags, 'any' for items with any.")
            .addDropdown((dropdown: DropdownComponent) => {
                dropdown
                    .addOption(TagMatchTypes.ALL, 'Match all tags (and)')
                    .addOption(TagMatchTypes.ANY, 'Match any tag (or)')
                    .setValue(this.tagMatchType)
                    .onChange((value: string) => {
                        this.tagMatchType = value as 'all' | 'any';
                    });
            });
        
        const tagMatchHelpLink = tagMatchSetting.nameEl.createEl('a', {
            href: 'https://frostmute.github.io/make-it-rain/usage#tag-match-type',
            text: ' (?)',
            cls: 'make-it-rain-help-link',
            title: 'Learn more about tag matching'
        });
        tagMatchHelpLink.setAttr('target', '_blank');

        new Setting(contentEl)
            .setName('Filter by type')
            .setDesc('Select the type of raindrops to fetch.')
            .addDropdown((dropdown: DropdownComponent) => {
                dropdown
                    .addOption('all', 'All types')
                    .addOption(RaindropTypes.LINK, 'Link')
                    .addOption(RaindropTypes.ARTICLE, 'Article')
                    .addOption(RaindropTypes.IMAGE, 'Image')
                    .addOption(RaindropTypes.VIDEO, 'Video')
                    .addOption(RaindropTypes.DOCUMENT, 'Document')
                    .addOption(RaindropTypes.AUDIO, 'Audio')
                    .addOption(RaindropTypes.BOOK, 'Book')
                    .setValue(this.filterType)
                    .onChange((value: string) => {
                        this.filterType = value as RaindropType | 'all';
                    });
            });
    }

    private buildNoteOptionsSection(contentEl: HTMLElement) {
        new Setting(contentEl).setName('Note options').setHeading();
        
        const appendTagsSetting = new Setting(contentEl)
            .setName('Append tags to notes')
            .setDesc('Comma-separated tags to add to the frontmatter of each created note.')
            .setClass('setting-item-stacked'); // Added class
        
        const appendTagsDescEl = appendTagsSetting.descEl.createEl('p', {
            cls: 'make-it-rain-input-hint',
            text: 'Start tags with #. Spaces will be converted to underscores during processing.'
        });

        appendTagsSetting.addText((text: TextComponent) => {
            text.setPlaceholder('My tag')
                    .setValue(this.appendTagsToNotes)
                .onChange((value: string) => {
                    this.appendTagsToNotes = value;
                    const tags = value.split(',').map(t => t.trim()).filter(t => t !== '');
                    let hintText = 'Tip: Start tags with #. Spaces will be converted to underscores.';
                    let hasIssues = false;
                    if (tags.length > 0) {
                        const issues = [];
                        if (tags.some(t => !t.startsWith('#'))) {
                            issues.push('missing #');
                            hasIssues = true;
                        }
                        if (issues.length > 0) {
                            hintText = `⚠️ Issue: Some tags are ${issues.join(' and ')}. They will be sanitized.`;
                        }
                    }
                    appendTagsDescEl.setText(hintText);
                    appendTagsDescEl.toggleClass('make-it-rain-warning', hasIssues);
                });
            text.inputEl.addClass('make-it-rain-full-width');
        });

        new Setting(contentEl)
            .setName('Use Raindrop title for filename')
            .setDesc('Use the title from Raindrop.io as the filename. If disabled, the raindrop ID will be used.')
            .addToggle((toggle: ToggleComponent) => {
                toggle.setValue(this.useRaindropTitleForFileName)
                    .onChange((value: boolean) => {
                        this.useRaindropTitleForFileName = value;
                    });
            });

        const fetchOnlyNewToggle = new Setting(contentEl)
            .setName('Fetch only new raindrops')
            .setDesc('Skip raindrops if a note with the same filename already exists.')
            .addToggle((toggle: ToggleComponent) => {
                toggle.setValue(this.fetchOnlyNew)
                    .onChange((value: boolean) => {
                        this.fetchOnlyNew = value;
                        if (value && this.updateExisting) {
                            this.updateExisting = false;
                            // Visually update the other toggle if we can access it
                            const updateExistingInput = contentEl.querySelector<HTMLInputElement>('.update-existing-toggle input[type="checkbox"]');
                            if (updateExistingInput) updateExistingInput.checked = false;
                        }
                    });
            });

        new Setting(contentEl)
            .setName('Update existing notes')
            .setDesc('Update notes if Raindrop.io item changed (based on "ID" & "last_update"). Overrides "Fetch only new".')
            .setClass('update-existing-toggle') // Add a class for querying
            .addToggle((toggle: ToggleComponent) => {
                toggle.setValue(this.updateExisting)
                    .onChange((value: boolean) => {
                        this.updateExisting = value;
                        if (value && this.fetchOnlyNew) {
                            this.fetchOnlyNew = false;
                             // Visually update the other toggle
                            const fetchNewInput = fetchOnlyNewToggle.controlEl.querySelector<HTMLInputElement>('input[type="checkbox"]');
                            if (fetchNewInput) fetchNewInput.checked = false;
                        }
                    });
            });
    }

    private buildTemplateOptionsSection(contentEl: HTMLElement) {
        if (this.plugin.settings.isTemplateSystemEnabled) {
            new Setting(contentEl).setName('Template overrides (optional)').setHeading();
            
            new Setting(contentEl)
                .setName('Use default template only')
                .setDesc('Ignore content type specific templates and use the default template for all items this fetch.')
                .addToggle((toggle: ToggleComponent) => {
                    toggle.setValue(this.useDefaultTemplate)
                        .onChange((value: boolean) => {
                            this.useDefaultTemplate = value;
                            const overrideTemplatesInput = contentEl.querySelector<HTMLInputElement>('.override-templates-toggle input[type="checkbox"]');
                            if (value && overrideTemplatesInput) {
                                this.overrideTemplates = false; // Can't override if only using default
                                overrideTemplatesInput.checked = false;
                                overrideTemplatesInput.disabled = true;
                            } else if (overrideTemplatesInput) {
                                overrideTemplatesInput.disabled = false;
                            }
                        });
                });

            new Setting(contentEl)
                .setClass('override-templates-toggle') // Add a class for querying
                .setName('Force use of content-type templates')
                .setDesc('Use specific content-type templates even if they are disabled in global settings (for this fetch only).')
                .addToggle((toggle: ToggleComponent) => {
                    toggle.setValue(this.overrideTemplates)
                        .setDisabled(this.useDefaultTemplate) // Initially disable if "Use Default" is true
                        .onChange((value: boolean) => {
                            this.overrideTemplates = value;
                        });
                });
        }
    }

    private buildActionButtons(contentEl: HTMLElement) {
        const buttonsEl = contentEl.createDiv({ cls: 'modal-button-container' });
        new ButtonComponent(buttonsEl)
            .setButtonText('Fetch raindrops')
            .setCta()
            .onClick(async () => {
                const options: ModalFetchOptions = {
                    vaultPath: this.vaultPath,
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

        new ButtonComponent(buttonsEl)
            .setButtonText('Cancel')
            .onClick(() => {
                this.close();
            });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

/**
 * Modal for Quick Import by URL or ID
 */
export class QuickImportModal extends Modal {
    plugin: RaindropToObsidian;
    itemUrlOrId: string = '';
    vaultPath: string = '';
    appendTagsToNotes: string = '';

    constructor(app: App, plugin: RaindropToObsidian) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('make-it-rain-modal');

        const headerEl = contentEl.createDiv({ cls: 'make-it-rain-modal-header' });
        headerEl.createEl('h2', { text: 'Quick Import' });
        headerEl.createEl('p', { 
            text: 'Import a single Raindrop bookmark by pasting its URL or unique ID.',
            cls: 'setting-item-description'
        });

        contentEl.createEl('hr');

        const inputGroup = contentEl.createDiv({ cls: 'make-it-rain-modal-group' });

        new Setting(inputGroup)
            .setName('Item URL or ID')
            .setDesc('e.g., https://app.raindrop.io/my/0/453181829')
            .addText(text => text
                .setPlaceholder('Paste URL or ID here...')
                .setValue(this.itemUrlOrId)
                .onChange(value => this.itemUrlOrId = value.trim()));

        new Setting(inputGroup)
            .setName('Save destination')
            .setDesc('Vault folder path to save this item. Leaves blank for global default.')
            .addText(text => text
                .setPlaceholder(this.plugin.settings.defaultFolder || 'Vault root')
                .setValue(this.vaultPath)
                .onChange(value => this.vaultPath = value.trim()));

        new Setting(inputGroup)
            .setName('Append vault tags')
            .setDesc('Add these local tags to this imported note (comma-separated).')
            .addText(text => text
                .setPlaceholder('e.g. #quick-import')
                .setValue(this.appendTagsToNotes)
                .onChange(value => this.appendTagsToNotes = value.trim()));

        contentEl.createEl('hr');

        const buttonsEl = contentEl.createDiv({ cls: 'modal-button-container' });
        new ButtonComponent(buttonsEl)
            .setButtonText('Import')
            .setCta()
            .onClick(async () => {
                if (!this.itemUrlOrId) {
                    new Notice('Please enter a raindrop URL or ID.');
                    return;
                }

                let itemId: number | null = null;
                const idMatch = this.itemUrlOrId.match(/\/item\/(\d+)/) || this.itemUrlOrId.match(/^(\d+)$/);
                
                if (idMatch && idMatch[1]) {
                    itemId = parseInt(idMatch[1], 10);
                }

                if (!itemId) {
                    new Notice('Could not extract a valid Raindrop ID from the input.');
                    return;
                }

                this.close();
                await this.plugin.fetchSingleRaindrop(itemId, this.vaultPath, this.appendTagsToNotes);
            });

        new ButtonComponent(buttonsEl)
            .setButtonText('Cancel')
            .onClick(() => this.close());
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

export class HighlightsAggregateModal extends Modal {
    plugin: IRaindropToObsidian;
    tag: string = '';
    vaultPath: string;

    constructor(app: App, plugin: IRaindropToObsidian) {
        super(app);
        this.plugin = plugin;
        this.vaultPath = this.plugin.settings.defaultFolder;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('make-it-rain-modal');

        contentEl.createEl('h2', { text: 'Aggregate highlights by tag' });

        new Setting(contentEl)
            .setName('Raindrop tag')
            .setDesc('Enter the tag to search for across all collections. All items with this tag that have highlights will be aggregated into a single note.')
            .setClass('setting-item-stacked')
            .addText((text: TextComponent) => {
                text.setPlaceholder('E.g., research, productivity')
                    .setValue(this.tag)
                    .onChange((value: string) => {
                        this.tag = value.trim().replace(/^#/, ''); // Remove leading # if user typed it
                    });
                text.inputEl.addClass('make-it-rain-full-width');
            });

        new Setting(contentEl)
            .setName('Vault save location (optional)')
            .setDesc('Override default save folder for the aggregated note. Leave blank for default.')
            .addText((text: TextComponent) => {
                text.setPlaceholder(this.plugin.settings.defaultFolder || 'Vault root')
                    .setValue(this.vaultPath)
                    .onChange((value: string) => {
                        this.vaultPath = value.trim();
                    });
                text.inputEl.addClass('make-it-rain-full-width');
            });

        const buttonsEl = contentEl.createDiv({ cls: 'modal-button-container' });
        new ButtonComponent(buttonsEl)
            .setButtonText('Aggregate highlights')
            .setCta()
            .onClick(async () => {
                if (!this.tag) {
                    new Notice('Please enter a tag to aggregate.', 5000);
                    return;
                }

                this.close();
                const options: AggregateHighlightsOptions = {
                    tag: this.tag,
                    vaultPath: this.vaultPath || undefined
                };
                await this.plugin.aggregateHighlightsByTag(options);
            });

        new ButtonComponent(buttonsEl)
            .setButtonText('Cancel')
            .onClick(() => { this.close(); });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

/**
 * Modal for browsing available template variables
 */
export class VariableBrowserModal extends Modal {
    constructor(app: App) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('make-it-rain-modal');
        contentEl.addClass('make-it-rain-variable-browser');

        contentEl.createEl('h2', { text: 'Template Variable Browser' });
        contentEl.createEl('p', { 
            text: 'These variables can be used in your templates using the {{variable}} syntax.',
            cls: 'setting-item-description'
        });

        const container = contentEl.createDiv({ cls: 'make-it-rain-variable-list-container' });

        this.renderCategory(container, 'Core Variables', [
            { name: 'id', desc: 'Unique Raindrop ID' },
            { name: 'title', desc: 'Title of the bookmark' },
            { name: 'link', desc: 'Original URL' },
            { name: 'excerpt', desc: 'Summary or excerpt from the page' },
            { name: 'note', desc: 'Your personal notes on the bookmark' },
            { name: 'type', desc: 'Content type (link, article, image, video, document, audio, book)' },
            { name: 'created', desc: 'Creation date (ISO format)' },
            { name: 'lastupdate', desc: 'Last update date (ISO format)' },
            { name: 'cover', desc: 'URL to the cover image' },
        ]);

        this.renderCategory(container, 'Collection Variables', [
            { name: 'collectionId', desc: 'ID of the collection it belongs to' },
            { name: 'collectionTitle', desc: 'Name of the collection' },
            { name: 'collectionPath', desc: 'Full folder path (e.g. Group / Parent / Child)' },
            { name: 'collectionGroup', desc: 'Name of the sidebar Group' },
            { name: 'collectionParentId', desc: 'ID of the parent collection (if any)' },
        ]);

        this.renderCategory(container, 'Formatted Variables', [
            { name: 'formattedCreatedDate', desc: 'Created date in your local format' },
            { name: 'formattedUpdatedDate', desc: 'Updated date in your local format' },
            { name: 'renderedType', desc: 'Human-friendly type name' },
            { name: 'domain', desc: 'Website domain (e.g. google.com)' },
            { name: 'formattedTags', desc: 'Tags as space-separated hashtags (e.g. #tag1 #tag2)' },
        ]);

        this.renderCategory(container, 'Lists & Loops', [
            { name: 'tags', desc: 'Array of tags. Use with {{#each tags}}...{{/each}}' },
            { name: 'highlights', desc: 'Array of highlights. Each has {{text}} and {{note}}' },
        ]);

        this.renderCategory(container, 'Attachments & Scraping', [
            { name: 'scrapedContent', desc: 'Full article content (if content scraping is enabled)' },
            { name: 'localFile', desc: 'Wiki-link to downloaded file (e.g. [[file.pdf]])' },
            { name: 'localEmbed', desc: 'Wiki-embed for downloaded file (e.g. ![[file.pdf]])' },
        ]);

        this.renderCategory(container, 'Helper Functions', [
            { name: 'uppercase var', desc: 'Converts variable to UPPERCASE' },
            { name: 'lowercase var', desc: 'Converts variable to lowercase' },
            { name: 'titlecase var', desc: 'Converts variable to Title Case' },
            { name: 'truncate var length', desc: 'Truncates variable to specified length' },
        ]);

        const footer = contentEl.createDiv({ cls: 'make-it-rain-button-container' });
        new ButtonComponent(footer)
            .setButtonText('Close')
            .onClick(() => this.close());
    }

    private renderCategory(container: HTMLElement, title: string, variables: { name: string, desc: string }[]) {
        container.createEl('h3', { text: title });
        const list = container.createEl('ul', { cls: 'make-it-rain-variable-list' });
        
        for (const v of variables) {
            const item = list.createEl('li');
            item.createEl('code', { text: `{{${v.name}}}` });
            item.createSpan({ text: ` - ${v.desc}`, cls: 'variable-description' });
        }
    }
}

