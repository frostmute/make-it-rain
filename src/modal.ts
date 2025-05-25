import { App, Modal, Setting, ToggleComponent } from 'obsidian';
import { RaindropToObsidian } from './main';

export interface ModalFetchOptions {
    readonly vaultPath?: string;
    readonly collections: string;
    readonly apiFilterTags: string;
    readonly includeSubcollections: boolean;
    readonly appendTagsToNotes: string;
    readonly useRaindropTitleForFileName: boolean;
    readonly tagMatchType: 'all' | 'any';
    readonly filterType?: string;
    readonly fetchOnlyNew?: boolean;
    readonly updateExisting: boolean;
    readonly useDefaultTemplate: boolean;
    readonly overrideTemplates: boolean;
}

export class RaindropFetchModal extends Modal {
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

        // Template Options
        if (this.plugin.settings.isTemplateSystemEnabled) {
            contentEl.createEl('h3', { text: 'Template Options' });

            new Setting(contentEl)
                .setName('Use Default Template Only')
                .setDesc('Ignore content type specific templates and use the default template for all items.')
                .addToggle((toggle: ToggleComponent) => {
                    toggle
                        .setValue(this.useDefaultTemplate)
                        .onChange((value: boolean) => {
                            this.useDefaultTemplate = value;
                            if (value) {
                                this.overrideTemplates = false;
                                const overrideToggle = contentEl.querySelector('.override-templates input[type="checkbox"]') as HTMLInputElement;
                                if (overrideToggle) {
                                    overrideToggle.checked = false;
                                }
                            }
                        });
                });

            new Setting(contentEl)
                .setClass('override-templates')
                .setName('Override Disabled Templates')
                .setDesc('Use content type templates even if they are disabled in settings.')
                .setDisabled(this.useDefaultTemplate)
                .addToggle((toggle: ToggleComponent) => {
                    toggle
                        .setValue(this.overrideTemplates)
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

        // Add other modal settings here...
    }
} 