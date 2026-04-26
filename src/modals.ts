import { App, Modal, Setting, TextComponent, ButtonComponent, Notice, ToggleComponent } from 'obsidian';
import type RaindropToObsidian from './main';
import { 
    RaindropCollection, 
    RaindropType, 
    ModalFetchOptions, 
    TagMatchTypes,
    RaindropTypes
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

        new Setting(contentEl).setName('Fetch raindrops').setHeading();

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
                text.setPlaceholder('e.g., 12345, my work, work > articles')
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
                await renderCollections(value.toLowerCase());
            });
        searchInput.inputEl.addClass('make-it-rain-full-width');
        
        const listContainer = selectionContainer.createDiv({ cls: 'make-it-rain-collection-list' });

        const renderCollections = async (filter: string = '') => {
            listContainer.empty();
            const collections = await this.plugin.fetchAllUserCollections();
            
            if (collections.length === 0) {
                listContainer.createEl('div', { text: 'No collections found.', cls: 'make-it-rain-empty-state' });
                return;
            }

            const filtered = collections.filter(c => c.title.toLowerCase().includes(filter));
            
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

            filtered.forEach(col => {
                const item = listContainer.createDiv({ cls: 'make-it-rain-collection-item' });
                const displayPath = getDisplayPath(col);
                item.createEl('span', { text: displayPath });
                item.onClickEvent(() => {
                    const current = collectionsTextComponent.getValue();
                    const toAdd = displayPath;
                    if (current.includes(toAdd)) return;
                    
                    const newValue = current ? `${current}, ${toAdd}` : toAdd;
                    collectionsTextComponent.setValue(newValue);
                    this.collections = newValue;
                    new Notice(`Added collection: ${toAdd}`);
                });
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
                text.setPlaceholder('e.g., obsidian, productivity, to-read')
                    .setValue(this.apiFilterTags)
                    .onChange((value: string) => {
                        this.apiFilterTags = value;
                    });
                text.inputEl.addClass('make-it-rain-full-width');
            });

        const tagMatchSetting = new Setting(contentEl)
            .setName('Tag match type')
            .setDesc("Choose 'all' for items with all specified tags, 'any' for items with any.")
            .addDropdown(dropdown => {
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
            .addDropdown(dropdown => {
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

        const appendTagsSetting = new Setting(contentEl)
            .setName('Append tags to notes')
            .setDesc('Comma-separated tags to add to the frontmatter of each created note.')
            .setClass('setting-item-stacked'); // Added class
        
        const appendTagsDescEl = appendTagsSetting.descEl.createEl('p', {
            cls: 'make-it-rain-input-hint',
            text: 'Tip: Start tags with #. Spaces will be converted to underscores during processing.'
        });

        appendTagsSetting.addText((text: TextComponent) => {
            text.setPlaceholder('e.g., #imported, #raindrop, my tag')
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
            .setName('Use raindrop title for file name')
            .setDesc('Use the title from raindrop.io as the filename. If disabled, the raindrop id will be used.')
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
            .setDesc('Update notes if raindrop item changed (based on id & last_update). Overrides "Fetch only new".')
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

        // --- Template Options Section ---
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

        new Setting(contentEl).setName('Quick import raindrop').setHeading();

        new Setting(contentEl)
            .setName('Raindrop url or id')
            .setDesc(
                'How to find: In the raindrop.io app, click "Edit" on the specific item (or look for a similar action that opens the item in a detailed/edit view). ' +
                'The URL in your browser\'s address bar should look like ".../item/[ID]/edit" or similar. ' +
                'You can paste this full URL here, or just the numeric id (e.g., 12345678).'
            )
            .setClass('setting-item-stacked')
            .addText((text: TextComponent) => {
                text.setPlaceholder('e.g., https://.../item/12345678/edit or 12345678')
                    .setValue(this.itemUrlOrId)
                    .onChange((value: string) => {
                        this.itemUrlOrId = value.trim();
                    });
                text.inputEl.addClass('make-it-rain-full-width');
            });

        new Setting(contentEl)
            .setName('Vault save location (optional)')
            .setDesc('Override default save folder. Leave blank for plugin default.')
            .addText((text: TextComponent) => {
                text.setPlaceholder(this.plugin.settings.defaultFolder || 'Vault root')
                    .setValue(this.vaultPath)
                    .onChange((value: string) => {
                        this.vaultPath = value.trim();
                    });
                text.inputEl.addClass('make-it-rain-full-width');
            });
        
        // Added Append Tags to Notes for Quick Import Modal
        new Setting(contentEl)
            .setName('Append tags to notes (optional)')
            .setDesc('Comma-separated tags to add to the frontmatter of the created note.')
            .addText((text: TextComponent) => {
                text.setPlaceholder('e.g., #quickimport, #todo')
                    .setValue(this.appendTagsToNotes)
                    .onChange((value: string) => {
                        this.appendTagsToNotes = value.trim();
                    });
                text.inputEl.addClass('make-it-rain-full-width');
            });


        const buttonsEl = contentEl.createDiv({ cls: 'modal-button-container' });
        new ButtonComponent(buttonsEl)
            .setButtonText('Import')
            .setCta()
            .onClick(async () => {
                if (!this.itemUrlOrId) {
                    new Notice('Please enter a raindrop URL or id.');
                    return;
                }

                // Extract ID from URL if necessary
                let itemId: number | null = null;
                const idMatch = this.itemUrlOrId.match(/\/item\/(\d+)/) || this.itemUrlOrId.match(/^(\d+)$/);
                
                if (idMatch && idMatch[1]) {
                    itemId = parseInt(idMatch[1], 10);
                }

                if (!itemId) {
                    new Notice('Could not extract a valid raindrop id from the input.');
                    return;
                }

                this.close();
                await this.plugin.fetchSingleRaindrop(itemId, this.vaultPath, this.appendTagsToNotes);
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
