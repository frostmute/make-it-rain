import { App, Modal, Setting, TextComponent, ButtonComponent, ToggleComponent, Notice } from 'obsidian';
import { 
    IRaindropToObsidian, 
    RaindropCollection, 
    RaindropType, 
    TagMatchTypes, 
    FilterTypes, 
    RaindropTypes, 
    ModalFetchOptions 
} from './types';

export class RaindropFetchModal extends Modal {
    plugin: IRaindropToObsidian;
    vaultPath: string;
    collections: string = '';
    apiFilterTags: string = '';
    includeSubcollections: boolean = false;
    appendTagsToNotes: string = '';
    useRaindropTitleForFileName: boolean = true;
    tagMatchType: 'all' | 'any' = 'all';
    filterType: RaindropType | 'all' = 'all';
    fetchOnlyNew: boolean = false;
    updateExisting: boolean = false;
    useDefaultTemplate: boolean = false;
    overrideTemplates: boolean = false;

    constructor(app: App, plugin: IRaindropToObsidian) {
        super(app);
        this.plugin = plugin;
        this.vaultPath = this.plugin.settings.defaultFolder;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('make-it-rain-modal'); // For potential future styling

        new Setting(contentEl).setName('Make it rain: fetch options').setHeading();

        // --- Fetch Criteria Section ---
        new Setting(contentEl).setName('Fetch criteria').setHeading();

        new Setting(contentEl)
            .setName('Vault save location')
            .setDesc('Override default save folder for this fetch. Leave blank for default.')
            .setClass('setting-item-stacked') // Added class
            .addText((text: TextComponent) => {
                text.setPlaceholder(this.plugin.settings.defaultFolder || 'Vault Root')
                    .setValue(this.vaultPath)
                    .onChange((value: string) => {
                        this.vaultPath = value;
                    });
                text.inputEl.addClass('make-it-rain-full-width');
            });

        let collectionsTextComponent: TextComponent;
        new Setting(contentEl)
            .setName('Filter by collections')
            .setDesc('Comma-separated Raindrop Collection IDs or Names. Click a collection below to add its name. If typing names manually, use IDs for duplicate collection names to ensure accuracy.')
            .setClass('setting-item-stacked') // Added class
            .addText((text: TextComponent) => {
                collectionsTextComponent = text; // Store reference to update it later
                text.setPlaceholder('e.g., 12345, My Work, Work > Articles')
                    .setValue(this.collections)
                    .onChange((value: string) => {
                        this.collections = value;
                    });
                text.inputEl.addClass('make-it-rain-full-width');
            });

        // --- UI for Selectable Collections ---
        const collectionsContainer = contentEl.createDiv({ cls: 'make-it-rain-collections-list-container' });

        const loadingCollectionsEl = collectionsContainer.createEl('p', { text: 'Loading your collections...', cls: 'make-it-rain-loading-collections' });

        this.plugin.fetchAllUserCollections().then(fetchedCollections => {
            loadingCollectionsEl.remove(); // Remove loading message
            if (fetchedCollections && fetchedCollections.length > 0) {
                const listEl = collectionsContainer.createEl('ul');

                // Helper to build display paths and map collections by ID
                const collectionMap = new Map<number, RaindropCollection>();
                fetchedCollections.forEach(col => collectionMap.set(col._id, col));

                const getDisplayPath = (collection: RaindropCollection): string => {
                    const pathSegments: string[] = [];
                    let current: RaindropCollection | undefined = collection;
                    while (current) {
                        pathSegments.unshift(current.title);
                        const parentId: number | undefined = current.parent?.$id;
                        current = parentId ? collectionMap.get(parentId) : undefined;
                    }
                    return pathSegments.join(' > ');
                };

                const collectionsWithDisplayPaths = fetchedCollections.map(collection => ({
                    ...collection,
                    displayPath: getDisplayPath(collection)
                }));

                collectionsWithDisplayPaths.sort((a,b) => a.displayPath.localeCompare(b.displayPath));

                collectionsWithDisplayPaths.forEach(collection => {
                    const listItemEl = listEl.createEl('li', { 
                        text: `${collection.displayPath} (ID: ${collection._id})`,
                        cls: 'make-it-rain-collection-item'
                    });
                    
                    listItemEl.addEventListener('click', () => {
                        const currentInputValue = collectionsTextComponent.getValue().trim();
                        const collectionNameToAdd = collection.title; // Using name for user-friendliness
                        
                        if (currentInputValue === '') {
                            collectionsTextComponent.setValue(collectionNameToAdd);
                        } else {
                            // Avoid adding if already present (simple check by name)
                            const existingInputs = currentInputValue.split(',').map(s => s.trim());
                            if (!existingInputs.includes(collectionNameToAdd)) {
                                collectionsTextComponent.setValue(currentInputValue + ', ' + collectionNameToAdd);
                            }
                        }
                        this.collections = collectionsTextComponent.getValue(); // Update internal state
                    });
                });
            } else {
                collectionsContainer.createEl('p', { text: 'No collections found, or failed to load them. Please check API token or try again.', cls: 'make-it-rain-collections-error'});
            }
        }).catch(error => {
            loadingCollectionsEl.remove();
            collectionsContainer.createEl('p', { text: 'Error loading collections. See console for details.', cls: 'make-it-rain-collections-error'});
            console.error("Failed to load collections into modal:", error);
            });

        new Setting(contentEl)
            .setName('Include subcollections')
            .setDesc('If filtering by Collections, also fetch from their subcollections.')
            .addToggle((toggle: ToggleComponent) => {
                toggle.setValue(this.includeSubcollections)
                    .onChange((value: boolean) => {
                        this.includeSubcollections = value;
                    });
            });

        new Setting(contentEl)
            .setName('Filter by tags')
            .setDesc('Comma-separated Raindrop tag names.')
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
            .setDesc("Choose 'ALL' for items with all specified tags, 'ANY' for items with any.")
            .addDropdown(dropdown => {
                dropdown
                    .addOption(TagMatchTypes.ALL, 'Match ALL Tags (AND)')
                    .addOption(TagMatchTypes.ANY, 'Match ANY Tag (OR)')
                    .setValue(this.tagMatchType)
                    .onChange((value: string) => {
                        this.tagMatchType = value as 'all' | 'any';
                    });
            });
        
        const tagMatchHelpLink = tagMatchSetting.nameEl.createEl('a', {
            href: 'https://frostmute.github.io/make-it-rain/usage#tag-match-type', // Placeholder URL
            text: ' (?)',
            cls: 'make-it-rain-help-link',
            title: 'Documentation for Tag Match Type'
        });
        tagMatchHelpLink.setAttr('target', '_blank');

        new Setting(contentEl)
            .setName('Filter by content type')
            .setDesc('Select the type of Raindrops to fetch.')
            .addDropdown(dropdown => {
                dropdown.addOption(FilterTypes.ALL, 'All Types');
                Object.values(RaindropTypes).forEach(type => {
                    dropdown.addOption(type, type.charAt(0).toUpperCase() + type.slice(1));
                });
                dropdown.setValue(this.filterType)
                    .onChange((value: string) => {
                        this.filterType = value as RaindropType | 'all';
                    });
            });

        // --- Note Options Section ---
        new Setting(contentEl).setName('Note options').setHeading();
        
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
                            issues.push("some tags don't start with #");
                            hasIssues = true;
                        }
                        if (tags.some(t => t.includes(' ') && t.includes('#'))) { // Only warn about spaces if it looks like a tag already
                             issues.push("tags with # shouldn't contain spaces (use hyphens or underscores)");
                             hasIssues = true;
                        }
                        if (hasIssues) {
                            hintText = `Heads up: ${issues.join('; ')}.`;
                        }
                    }
                    appendTagsDescEl.textContent = hintText;
                    if (hasIssues) {
                        appendTagsDescEl.addClass('make-it-rain-warning-text');
                    } else {
                        appendTagsDescEl.removeClass('make-it-rain-warning-text');
                    }
                });
            text.inputEl.addClass('make-it-rain-full-width');
            });

        new Setting(contentEl)
            .setName('Use raindrop title for filename')
            .setDesc('If off, Raindrop ID will be used. Uses filename template from settings.')
            .addToggle((toggle: ToggleComponent) => {
                toggle.setValue(this.useRaindropTitleForFileName)
                    .onChange((value: boolean) => {
                        this.useRaindropTitleForFileName = value;
                    });
            });

        const fetchOnlyNewToggle = new Setting(contentEl)
            .setName('Fetch only new items')
            .setDesc('Skip Raindrops if a note with the same filename already exists.')
            .addToggle((toggle: ToggleComponent) => {
                toggle.setValue(this.fetchOnlyNew)
                    .onChange((value: boolean) => {
                        this.fetchOnlyNew = value;
                        if (value && this.updateExisting) {
                            this.updateExisting = false;
                            // Visually update the other toggle if we can access it
                            const updateExistingInput = contentEl.querySelector('.update-existing-toggle input[type="checkbox"]');
                            if (updateExistingInput) (updateExistingInput as HTMLInputElement).checked = false;
                        }
                    });
            });

        new Setting(contentEl)
            .setName('Update existing notes')
            .setDesc('Update notes if Raindrop item changed (based on ID & last_update). Overrides "Fetch only new".')
            .setClass('update-existing-toggle') // Add a class for querying
            .addToggle((toggle: ToggleComponent) => {
                toggle.setValue(this.updateExisting)
                    .onChange((value: boolean) => {
                        this.updateExisting = value;
                        if (value && this.fetchOnlyNew) {
                            this.fetchOnlyNew = false;
                             // Visually update the other toggle
                            const fetchNewInput = fetchOnlyNewToggle.controlEl.querySelector('input[type="checkbox"]') as HTMLInputElement;
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
                            const overrideTemplatesInput = contentEl.querySelector('.override-templates-toggle input[type="checkbox"]') as HTMLInputElement | null;
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
        } else {
            contentEl.createEl('p', {
                text: 'Template system is disabled. Enable it in plugin settings to customize note output and see template override options here.',
                cls: 'setting-item-description'
            });
        }

        contentEl.createEl('hr');

        // --- Action Buttons ---
        const buttonsEl = contentEl.createDiv({ cls: 'modal-button-container' });
        new ButtonComponent(buttonsEl)
            .setButtonText('Fetch Raindrops')
                    .setCta()
                    .onClick(async () => {
                        const options: ModalFetchOptions = {
                    vaultPath: this.vaultPath || undefined, // Use undefined if empty to signify default
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
                    .onClick(() => { this.close(); });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

export class QuickImportModal extends Modal {
    plugin: IRaindropToObsidian;
    itemUrlOrId: string = '';
    vaultPath: string;
    appendTagsToNotes: string = ''; // Added appendTagsToNotes

    constructor(app: App, plugin: IRaindropToObsidian) {
        super(app);
        this.plugin = plugin;
        this.vaultPath = this.plugin.settings.defaultFolder; // Default to plugin settings
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('make-it-rain-modal');

        new Setting(contentEl).setName('Quick import raindrop').setHeading();

        new Setting(contentEl)
            .setName('Raindrop URL or ID')
            .setDesc(
                'How to find: In the Raindrop.io app, click "Edit" on the specific item (or look for a similar action that opens the item in a detailed/edit view). ' +
                'The URL in your browser\'s address bar should look like ".../item/[ID]/edit" or similar. ' +
                'You can paste this full URL here, or just the numeric ID (e.g., 12345678).'
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
                text.setPlaceholder(this.plugin.settings.defaultFolder || 'Vault Root')
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
            .setButtonText('Fetch & Create Note')
            .setCta()
            .onClick(async () => {
                if (!this.itemUrlOrId) {
                    new Notice('Please enter a Raindrop URL or ID.', 5000);
                    return;
                }

                let itemId: number | null = null;
                
                // First, check if the input is purely numeric and at least 8 digits long
                if (/^\d{8,}$/.test(this.itemUrlOrId)) { 
                    itemId = parseInt(this.itemUrlOrId, 10);
                } else {
                    // If not purely numeric, try to extract an 8+ digit ID from a URL or other string
                    const urlPatternMatch = this.itemUrlOrId.match(/(\d{8,})/); // Corrected regex
                    if (urlPatternMatch && urlPatternMatch[1]) {
                        itemId = parseInt(urlPatternMatch[1], 10);
                    }
                }

                if (!itemId) {
                    new Notice('Could not parse a valid raindrop ID (at least 8 digits) from the input.', 7000);
                    return;
                }

                this.close();
                await this.plugin.fetchSingleRaindrop(itemId, this.vaultPath || undefined, this.appendTagsToNotes || undefined);
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
