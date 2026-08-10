import { App, PluginSettingTab, Setting, TextComponent, ButtonComponent, Notice, request, ToggleComponent, TextAreaComponent, DropdownComponent } from 'obsidian';
import type RaindropToObsidian from './main';
import { RaindropTypes, RaindropType } from './types';
import { ImportPreset, MakeItRainSettings, TemplateData } from './types';
import { VariableBrowserModal, TemplateSharingModal, TemplatePreviewModal, SavePresetModal } from './modals';
import { validateTemplate, ValidationResult } from './template-validator';
import { SampleRaindrop } from './utils/sampleData';

export const DEFAULT_SETTINGS: MakeItRainSettings = {
    apiToken: '',
    defaultFolder: '',
    fileNameTemplate: '{{title}}',
    showRibbonIcon: true,
    bannerFieldName: 'banner',
    isTemplateSystemEnabled: true,
    archiveScraping: false,
    defaultTemplate: `{{#extends "base"}}\n{{/extends}}`,
    contentTypeTemplates: {
        link: `{{#extends "base"}}
{{#block 'scrapedContent'}}
{{#if scrapedContent}}
## Article Content
{{scrapedContent}}
{{/if}}
{{/block}}

{{#block 'footerLink'}}
[Source]({{link}})
{{/block}}
{{/extends}}`,
        article: `{{#extends "base"}}
{{#block 'content'}}
{{#if excerpt}}
## Summary
{{excerpt}}
{{/if}}

{{#if note}}
## Notes
{{note}}
{{/if}}

{{#if highlights}}
## Key Points
{{#each highlights}}
> {{text}}
{{#if note}}  *Note:* {{note}}{{/if}}
{{/each}}
{{/if}}
{{/block}}

{{#block 'scrapedContent'}}
{{#if scrapedContent}}
## Full Content
{{scrapedContent}}
{{/if}}
{{/block}}

{{#block 'localEmbed'}}
{{#if localEmbed}}
## Local Copy
{{localEmbed}}
{{/if}}
{{/block}}

{{#block 'footerLink'}}
[Read Article]({{link}})
{{/block}}
{{/extends}}`,
        image: `{{#extends "base"}}
{{#block 'header'}}
{{#if localEmbed}}
{{localEmbed}}
{{else}}
![{{title}}]({{cover}})
{{/if}}
{{/block}}

{{#block 'content'}}
{{#if excerpt}}
*{{excerpt}}*
{{/if}}

{{#if note}}
## Notes
{{note}}
{{/if}}
{{/block}}

{{#block 'scrapedContent'}}{{/block}}
{{#block 'localEmbed'}}{{/block}}

{{#block 'footerLink'}}
[View Original]({{link}})
{{/block}}
{{/extends}}`,
        video: `{{#extends "base"}}
{{#block 'header'}}
{{#if localEmbed}}
{{localEmbed}}
{{else}}
{{#if cover}}
![{{title}}]({{cover}})
{{/if}}
{{/if}}

# {{title}}
{{/block}}

{{#block 'content'}}
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
{{/if}}

{{#if note}}
## Notes
{{note}}
{{/if}}
{{/block}}

{{#block 'scrapedContent'}}{{/block}}
{{#block 'localEmbed'}}{{/block}}

{{#block 'footerLink'}}
[Watch Video]({{link}})
{{/block}}
{{/extends}}`,
        doc: `{{#extends "base"}}
{{#block 'header'}}
# {{title}}
{{/block}}

{{#block 'content'}}
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
{{/if}}

{{#if note}}
## Notes
{{note}}
{{/if}}
{{/block}}

{{#block 'scrapedContent'}}{{/block}}
{{#block 'localEmbed'}}
{{#if localEmbed}}
## Local File
{{localEmbed}}
{{/if}}
{{/block}}

{{#block 'footerLink'}}
[Open Document]({{link}})
{{/block}}
{{/extends}}`,
        audio: `{{#extends "base"}}
{{#block 'header'}}
{{#if localEmbed}}
{{localEmbed}}
{{else}}
{{#if cover}}
![{{title}}]({{cover}})
{{/if}}
{{/if}}

# {{title}}
{{/block}}

{{#block 'content'}}
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
{{/if}}

{{#if note}}
## Notes
{{note}}
{{/if}}
{{/block}}

{{#block 'scrapedContent'}}{{/block}}
{{#block 'localEmbed'}}{{/block}}

{{#block 'footerLink'}}
[Listen to Audio]({{link}})
{{/block}}
{{/extends}}`,
        book: `{{#extends "base"}}
{{#block 'scrapedContent'}}{{/block}}
{{#block 'localEmbed'}}
{{#if localEmbed}}
## Local File
{{localEmbed}}
{{/if}}
{{/block}}

{{#block 'footerLink'}}
[Open Book]({{link}})
{{/block}}
{{/extends}}`
    },
    contentTypeTemplateToggles: {
        link: true,
        article: true,
        image: true,
        video: true,
        doc: true,
        audio: true,
        book: true
    },
    downloadFiles: false,
    createFolderNotes: false,
    namedTemplates: {
        base: `---
title: "{{title}}"
source: {{link}}
type: {{type}}
created: {{created}}
lastupdate: {{lastupdate}}
id: {{id}}
collectionId: {{collectionId}}
collectionTitle: "{{collectionTitle}}"
collectionPath: "{{collectionPath}}"
{{#if collectionGroup}}collectionGroup: "{{collectionGroup}}"{{/if}}
{{#if collectionParentId}}collectionParentId: {{collectionParentId}}{{/if}}
tags:
{{#each tags}}
  - {{this}}
{{/each}}
{{#if cover}}
{{bannerFieldName}}: {{cover}}
{{/if}}
---

{{#block 'header'}}
{{#if cover}}
![{{title}}]({{cover}})
{{/if}}

# {{title}}
{{/block}}

{{#block 'content'}}
{{#if excerpt}}
## Description
{{excerpt}}
{{/if}}

{{#if note}}
## Notes
{{note}}
{{/if}}

{{#if highlights}}
## Highlights
{{#each highlights}}
- {{text}}
{{#if note}}  *Note:* {{note}}{{/if}}
{{/each}}
{{/if}}
{{/block}}

{{#block 'scrapedContent'}}
{{#if scrapedContent}}
## Content
{{scrapedContent}}
{{/if}}
{{/block}}

{{#block 'localEmbed'}}
{{#if localEmbed}}
## Local Attachment
{{localEmbed}}
{{/if}}
{{/block}}

---
{{#block 'details'}}
## Details
- **Type**: {{renderedType}}
- **Domain**: {{domain}}
- **Created**: {{formattedCreatedDate}}
- **Updated**: {{formattedUpdatedDate}}
- **Tags**: {{formattedTags}}
{{/block}}
{{#block 'footerLink'}}{{/block}}`
    },
    enableSafeSync: false,
    safeSyncAction: 'Prompt',
    trashFolderLocation: '.trash',
    importPresets: []
};

export class RaindropToObsidianSettingTab extends PluginSettingTab {
    plugin: RaindropToObsidian;

    constructor(app: App, plugin: RaindropToObsidian) {
        super(app, plugin);
        this.plugin = plugin;
    }

    /**
     * Obsidian 1.13+ declarative settings API. This tab renders imperatively
     * via display() and returns an empty definition list to opt out of
     * declarative indexing. Override the control-value methods if settings
     * search indexing is added later.
     */
    getSettingDefinitions(): never[] {
        return [];
    }

    /**
     * Build the context object used for previews. Kept here so both the
     * default-template preview and the content-type previews render
     * identically.
     */
    private buildPreviewContext(sampleData: SampleRaindrop): TemplateData {
        return {
            ...sampleData,
            bannerFieldName: this.plugin.settings.bannerFieldName,
            url: sampleData.link,
            domain: (() => { try { return new URL(sampleData.link).hostname; } catch { return ''; } })(),
            renderedType: (() => {
                const types: Record<string, string> = {
                    link: 'web link', article: 'article', image: 'image',
                    video: 'video', doc: 'document', audio: 'audio', book: 'book'
                };
                return types[sampleData.type] || sampleData.type;
            })(),
            formattedCreatedDate: new Date(sampleData.created).toLocaleDateString(),
            formattedUpdatedDate: new Date(sampleData.lastupdate).toLocaleDateString(),
            formattedTags: sampleData.tags.map(t => `#${t}`).join(' ')
        } as unknown as TemplateData;
    }

    /**
     * Open the opt-in template preview modal. Replaces the always-on
     * side-by-side preview that ate half the editor width — previews are
     * now a deliberate action, not ambient noise.
     */
    private openTemplatePreview(template: string, lockedType?: RaindropType) {
        try {
            new TemplatePreviewModal(
                this.app,
                this.plugin,
                template,
                (sample) => this.buildPreviewContext(sample),
                lockedType
            ).open();
        } catch (e) {
            new Notice(`Preview failed: ${e instanceof Error ? e.message : String(e)}`, 7000);
        }
    }

    /**
     * Obsidian's settings-tab lifecycle entry point.
     *
     * Keep the actual renderer in update() so existing refreshes from setting
     * controls continue to work, while ensuring Obsidian invokes the renderer
     * when the tab is opened (including Obsidian 1.13+).
     */
    display(): void {
        this.update();
    }

    /**
     * Imperative settings renderer shared by display() and in-tab refreshes.
     * getSettingDefinitions() returns [] because this tab intentionally uses
     * the richer imperative UI rather than declarative setting indexing.
     */
    update(): void {
        const { containerEl } = this;
        containerEl.empty();
        
        containerEl.addClass('make-it-rain-settings-container');

        // Plugin Header
        const headerEl = containerEl.createDiv({ cls: 'make-it-rain-settings-header' });
        new Setting(headerEl).setName('Configuration').setHeading();
        headerEl.createEl('p', { 
            text: 'Configure how your Raindrop.io bookmarks are imported into Obsidian. Need help?',
            cls: 'setting-item-description'
        }).createEl('a', { 
            href: 'https://frostmute.github.io/make-it-rain/', 
            text: ' Read the documentation',
            attr: { target: '_blank' }
        });

        containerEl.createEl('br');

        // --- 1. Connection & Core Setup ---
        const connSection = containerEl.createEl('details', { cls: 'make-it-rain-settings-section', attr: { open: '' } });
        connSection.createEl('summary', { text: 'Connection & Core Setup', cls: 'make-it-rain-section-summary' });
        const connContent = connSection.createDiv({ cls: 'make-it-rain-section-content' });

        const apiTokenSetting = new Setting(connContent)
            .setName('Raindrop.io API token')
            .setDesc('Your personal access token required to fetch bookmarks.')
            .addText((text: TextComponent) => {
                text.setPlaceholder('Enter your API token')
                    .setValue(this.plugin.settings.apiToken)
                    .onChange(async (value: string) => {
                        this.plugin.settings.apiToken = value;
                        await this.plugin.saveSettings();
                    });
                text.inputEl.type = 'password';
                text.inputEl.addClass('make-it-rain-full-width');
            })
            .addButton((button: ButtonComponent) => {
                button.setButtonText("Verify token")
                    .setIcon("checkmark")
                    .setCta()
                    .onClick(async () => {
                        await this.verifyApiToken();
                    });
            });

        apiTokenSetting.nameEl.createEl('a', {
            href: 'https://frostmute.github.io/make-it-rain/configuration#api-token',
            text: ' Get a token',
            cls: 'make-it-rain-help-link',
            title: 'How to get your API token',
            attr: { target: '_blank' }
        });

        new Setting(connContent)
            .setName('Show ribbon icon')
            .setDesc('Toggle the raindrop icon in the left Obsidian sidebar for quick access.')
            .addToggle((toggle: ToggleComponent) => {
                toggle.setValue(this.plugin.settings.showRibbonIcon)
                    .onChange(async (value: boolean) => {
                        this.plugin.settings.showRibbonIcon = value;
                        await this.plugin.saveSettings();
                        this.plugin.updateRibbonIcon();
                    });
            });

        // --- 2. Import & Organization ---
        const orgSection = containerEl.createEl('details', { cls: 'make-it-rain-settings-section' });
        orgSection.createEl('summary', { text: 'Import & Organization', cls: 'make-it-rain-section-summary' });
        const orgContent = orgSection.createDiv({ cls: 'make-it-rain-section-content' });

        new Setting(orgContent)
            .setName('Default vault save location')
            .setDesc('Specify the default folder for imported notes (e.g., "Imports/Raindrops"). Leave blank for vault root.')
            .addText((text: TextComponent) => {
                text.setPlaceholder('e.g., Raindrops/')
                    .setValue(this.plugin.settings.defaultFolder)
                    .onChange(async (value: string) => {
                        this.plugin.settings.defaultFolder = value;
                        await this.plugin.saveSettings();
                    });
                text.inputEl.addClass('make-it-rain-full-width');
            });

        new Setting(orgContent)
            .setName('Filename template')
            .setDesc('Define the filename for notes when "use Raindrop title" is enabled. Placeholders: {{title}}, {{id}}, {{collectionTitle}}, {{date}}.')
            .addText((text: TextComponent) => {
                const validationContainer = orgContent.createDiv('make-it-rain-validation-container');
                const updateValidation = (val: string) => {
                    const result = validateTemplate(val, this.plugin.settings);
                    this.renderValidationResult(validationContainer, result);
                };

                text.setPlaceholder('{{title}}')
                    .setValue(this.plugin.settings.fileNameTemplate)
                    .onChange(async (value: string) => {
                        this.plugin.settings.fileNameTemplate = value;
                        await this.plugin.saveSettings();
                        updateValidation(value);
                    });
                text.inputEl.addClass('make-it-rain-full-width');
                updateValidation(this.plugin.settings.fileNameTemplate);
            });

        new Setting(orgContent)
            .setName('Create folder notes')
            .setDesc('Automatically generate an index note matching the name of each collection folder, listing its children.')
            .addToggle((toggle: ToggleComponent) => {
                toggle.setValue(this.plugin.settings.createFolderNotes)
                    .onChange(async (value: boolean) => {
                        this.plugin.settings.createFolderNotes = value;
                        await this.plugin.saveSettings();
                    });
            });

        // --- 3. Content Enhancements ---
        const contentSection = containerEl.createEl('details', { cls: 'make-it-rain-settings-section' });
        contentSection.createEl('summary', { text: 'Content Enhancements', cls: 'make-it-rain-section-summary' });
        const contentContent = contentSection.createDiv({ cls: 'make-it-rain-section-content' });

        new Setting(contentContent)
            .setName('Archive scraping (Pro)')
            .setDesc('Automatically extract the full text content from Raindrop.io permanent archives and include it in your notes.')
            .addToggle((toggle: ToggleComponent) => {
                toggle.setValue(this.plugin.settings.archiveScraping)
                    .onChange(async (value: boolean) => {
                        this.plugin.settings.archiveScraping = value;
                        await this.plugin.saveSettings();
                    });
            });

        new Setting(contentContent)
            .setName('Download files locally')
            .setDesc('Automatically download raw attachments (documents, images, video, audio) directly into your vault.')
            .addToggle((toggle: ToggleComponent) => {
                toggle.setValue(this.plugin.settings.downloadFiles)
                    .onChange(async (value: boolean) => {
                        this.plugin.settings.downloadFiles = value;
                        await this.plugin.saveSettings();
                    });
            });

        new Setting(contentContent)
            .setName('Banner frontmatter field name')
            .setDesc('Customize the frontmatter field name used for the banner/cover image (default: "banner").')
            .addText((text: TextComponent) => {
                text.setPlaceholder('banner')
                    .setValue(this.plugin.settings.bannerFieldName)
                    .onChange(async (value: string) => {
                        this.plugin.settings.bannerFieldName = value;
                        await this.plugin.saveSettings();
                    });
            });

        // --- 4. Safe Sync (Issue #9) ---
        const safeSyncSection = containerEl.createEl('details', { cls: 'make-it-rain-settings-section' });
        safeSyncSection.createEl('summary', { text: 'Safe Sync & Cleanup', cls: 'make-it-rain-section-summary' });
        const safeSyncContent = safeSyncSection.createDiv({ cls: 'make-it-rain-section-content' });

        new Setting(safeSyncContent)
            .setName('Enable safe sync')
            .setDesc('After importing, scan for local notes whose remote Raindrop item was deleted or renamed, and prompt for action.')
            .addToggle((toggle: ToggleComponent) => {
                toggle.setValue(this.plugin.settings.enableSafeSync)
                    .onChange(async (value: boolean) => {
                        this.plugin.settings.enableSafeSync = value;
                        await this.plugin.saveSettings();
                    });
            });

        new Setting(safeSyncContent)
            .setName('Safe sync default action')
            .setDesc('Choose what happens when a remote item is missing. "Prompt" shows a review dialog; "Archive" moves notes to the trash folder; "Delete" removes them permanently.')
            .addDropdown((dropdown: DropdownComponent) => {
                dropdown.addOption('Prompt', 'Prompt (review each item)');
                dropdown.addOption('Archive', 'Archive (move to trash folder)');
                dropdown.addOption('Delete', 'Delete (remove permanently)');
                dropdown.setValue(this.plugin.settings.safeSyncAction);
                dropdown.onChange(async (value: string) => {
                    this.plugin.settings.safeSyncAction = value as 'Prompt' | 'Archive' | 'Delete';
                    await this.plugin.saveSettings();
                });
            });

        new Setting(safeSyncContent)
            .setName('Trash folder location')
            .setDesc('Folder where archived (soft-deleted) notes are moved when using the "Archive" action. Relative to vault root.')
            .addText((text: TextComponent) => {
                text.setPlaceholder('.trash')
                    .setValue(this.plugin.settings.trashFolderLocation)
                    .onChange(async (value: string) => {
                        this.plugin.settings.trashFolderLocation = value || '.trash';
                        await this.plugin.saveSettings();
                    });
                text.inputEl.addClass('make-it-rain-full-width');
            });

        // --- 5. Import Presets ---
        const presetSection = containerEl.createEl('details', { cls: 'make-it-rain-settings-section' });
        presetSection.createEl('summary', { text: 'Import Presets', cls: 'make-it-rain-section-summary' });
        const presetContent = presetSection.createDiv({ cls: 'make-it-rain-section-content' });
        this.renderImportPresets(presetContent);

        // --- 6. Template Engine ---
        // Section is OPEN by default — this is where 90% of users actually
        // configure things. Wrapped in <details> so the rare non-template
        // user can collapse it.
        const templateSection = containerEl.createEl('details', { cls: 'make-it-rain-settings-section make-it-rain-template-section', attr: { open: '' } });
        templateSection.createEl('summary', { text: 'Template Engine', cls: 'make-it-rain-section-summary' });
        const templateContent = templateSection.createDiv({ cls: 'make-it-rain-section-content' });

        // Master enable toggle — hides the whole editor surface when off,
        // so power users can disable templates without losing the toggle.
        new Setting(templateContent)
            .setName('Enable template system')
            .setDesc('Use custom Handlebars templates for formatting imported notes instead of the basic fallback structure.')
            .addToggle((toggle: ToggleComponent) => {
                toggle.setValue(this.plugin.settings.isTemplateSystemEnabled)
                    .onChange(async (value: boolean) => {
                        this.plugin.settings.isTemplateSystemEnabled = value;
                        await this.plugin.saveSettings();
                        templateBody.style.display = value ? 'block' : 'none';
                    });
            });

        const templateBody = templateContent.createDiv();
        templateBody.style.display = this.plugin.settings.isTemplateSystemEnabled ? 'block' : 'none';

        // Helper links row — kept compact, single setting row.
        new Setting(templateBody)
            .setName('Reference & sharing')
            .setDesc('Browse variables, or import a template shared by the community.')
            .addButton((button: ButtonComponent) => {
                button.setButtonText('Browse variables').setIcon('search')
                    .onClick(() => { new VariableBrowserModal(this.app).open(); });
            })
            .addButton((button: ButtonComponent) => {
                button.setButtonText('Import template').setIcon('import')
                    .onClick(() => {
                        new TemplateSharingModal(this.app, this.plugin, 'import', '', async (jsonStr) => {
                            const imported = this.plugin.importTemplate(jsonStr);
                            if (!imported) return false;
                            let targetName = imported.name;
                            if (Object.prototype.hasOwnProperty.call(this.plugin.settings.namedTemplates, targetName)) {
                                targetName = `${targetName}-imported-${Date.now()}`;
                            }
                            this.plugin.settings.namedTemplates[targetName] = imported.template;
                            await this.plugin.saveSettings();
                            this.update();
                            new Notice(`Template "${targetName}" imported successfully!`);
                            return true;
                        }).open();
                    });
            });

        // ── Default Global Template ─────────────────────────────────────
        new Setting(templateBody).setName('Default template').setHeading();
        templateBody.createEl('p', {
            text: 'Used when no content-type override below is enabled.',
            cls: 'setting-item-description'
        });

        // Captured by the textarea builder so the Reset button can refresh the
        // editor in place instead of calling this.update() (which rebuilds every
        // section and collapses the user's expanded <details> panels).
        let defaultTextComponent: TextAreaComponent;
        let updateDefaultValidation: (val: string) => void = () => {};

        new Setting(templateBody)
            .setClass('setting-item-stacked')
            .addTextArea((text: TextAreaComponent) => {
                defaultTextComponent = text;
                const validationContainer = templateBody.createDiv('make-it-rain-validation-container');
                updateDefaultValidation = (val: string) => {
                    const result = validateTemplate(val, this.plugin.settings);
                    this.renderValidationResult(validationContainer, result);
                };
                text.setPlaceholder('Enter your default handlebars template here.')
                    .setValue(this.plugin.settings.defaultTemplate)
                    .onChange(async (value: string) => {
                        this.plugin.settings.defaultTemplate = value;
                        await this.plugin.saveSettings();
                        updateDefaultValidation(value);
                    });
                text.inputEl.rows = 10;
                text.inputEl.addClass('make-it-rain-full-width');
                text.inputEl.addClass('make-it-rain-monospace');
                updateDefaultValidation(this.plugin.settings.defaultTemplate);
            })
            .addButton((button: ButtonComponent) => {
                button.setButtonText('Preview').setIcon('eye')
                    .setTooltip('Render this template against a sample raindrop')
                    .onClick(() => {
                        this.openTemplatePreview(this.plugin.settings.defaultTemplate);
                    });
            })
            .addButton((button: ButtonComponent) => {
                button.setButtonText('Reset').setIcon('undo')
                    .setTooltip('Reset this template to its original default value')
                    .onClick(async () => {
                        this.plugin.settings.defaultTemplate = DEFAULT_SETTINGS.defaultTemplate;
                        await this.plugin.saveSettings();
                        // Refresh just this editor in place.
                        defaultTextComponent.setValue(DEFAULT_SETTINGS.defaultTemplate);
                        updateDefaultValidation(DEFAULT_SETTINGS.defaultTemplate);
                        new Notice('Default template has been reset.');
                    });
            })
            .addButton((button: ButtonComponent) => {
                button.setButtonText('Export').setIcon('export')
                    .setTooltip('Export this template')
                    .onClick(() => {
                        const jsonStr = this.plugin.exportTemplate(
                            'default',
                            this.plugin.settings.defaultTemplate,
                            'Default Global Template'
                        );
                        new TemplateSharingModal(this.app, this.plugin, 'export', jsonStr).open();
                    });
            });

        // ── Content-Type Overrides ──────────────────────────────────────
        // The big change: every type gets its own visible, labeled block.
        // No dropdown picker. Toggle hides/shows that type's textarea inline.
        new Setting(templateBody).setName('Content-type overrides').setHeading();
        templateBody.createEl('p', {
            text: 'Define a custom template for each raindrop type. Toggle an override on to replace the default for that type only.',
            cls: 'setting-item-description'
        });

        // Render in stable, predictable order (not Object.keys order).
        // RaindropTypes values use 'document' but the settings key is 'doc'
        // (the 'doc' avoids a global Document clash in templates). Map here.
        type ContentTypeKey = keyof MakeItRainSettings['contentTypeTemplates'];
        const orderedTypes: Array<{ typeStr: RaindropType; typeKey: ContentTypeKey }> = [
            { typeStr: RaindropTypes.LINK, typeKey: 'link' },
            { typeStr: RaindropTypes.ARTICLE, typeKey: 'article' },
            { typeStr: RaindropTypes.IMAGE, typeKey: 'image' },
            { typeStr: RaindropTypes.VIDEO, typeKey: 'video' },
            { typeStr: RaindropTypes.DOCUMENT, typeKey: 'doc' },
            { typeStr: RaindropTypes.AUDIO, typeKey: 'audio' },
            { typeStr: RaindropTypes.BOOK, typeKey: 'book' }
        ];

        for (const entry of orderedTypes) {
            this.renderContentTypeCard(templateBody, entry.typeStr, entry.typeKey);
        }

        // ── Reusable Partials ────────────────────────────────────────
        new Setting(templateBody).setName('Reusable partials').setHeading();
        templateBody.createEl('p', {
            text: 'Reusable snippets. Include via {{#include "name"}} or extend via {{#extends "name"}}.',
            cls: 'setting-item-description'
        });

        const namedTemplatesContainer = templateBody.createDiv('make-it-rain-named-templates-container');
        this.renderNamedTemplates(namedTemplatesContainer);

        new Setting(templateBody)
            .addButton((button: ButtonComponent) => {
                button.setButtonText('+ Add new partial').setCta()
                    .onClick(async () => {
                        const name = 'new-partial-' + Date.now();
                        this.plugin.settings.namedTemplates[name] = '';
                        await this.plugin.saveSettings();
                        this.renderNamedTemplates(namedTemplatesContainer);
                    });
            });

        // --- Footer Section ---
        containerEl.createEl('hr');
        const footer = containerEl.createDiv({ cls: 'setting-footer make-it-rain-footer' });
        
        const footerFlex = footer.createDiv({ cls: 'make-it-rain-footer-flex' });
        const leftFooter = footerFlex.createDiv();
        leftFooter.createEl('strong', { text: 'Make It Rain v' + this.plugin.manifest.version });
        leftFooter.createEl('br');
        leftFooter.appendText('Developed by ');
        leftFooter.createEl('a', { href: 'https://github.com/frostmute', text: 'Frostmute', attr: { target: '_blank' } });
        
        const rightFooter = footerFlex.createDiv({ cls: 'make-it-rain-footer-right' });
        rightFooter.createEl('a', { href: 'https://ko-fi.com/frostmute', text: '☕️ Support Development', attr: { target: '_blank' } });
        rightFooter.createEl('br');
        rightFooter.createEl('a', { href: 'https://github.com/frostmute/make-it-rain/issues', text: '🐛 Report an Issue', attr: { target: '_blank' } });
    }

    /**
     * Render the saved-preset manager: one row per preset with rename and
     * delete actions. Presets are created from the bulk import modal; this
     * screen is where they can be reviewed and cleaned up.
     */
    renderImportPresets(container: HTMLElement): void {
        container.empty();

        const presets = this.plugin.settings.importPresets || [];

        container.createEl('p', {
            text: 'Presets capture a full bulk-import configuration and are saved from the "Bulk Import Raindrops" modal. Each preset also gets a "Fetch: {name}" command in the command palette.',
            cls: 'setting-item-description'
        });

        if (presets.length === 0) {
            container.createEl('p', {
                text: 'No saved presets yet. Open the bulk import modal and use "Save current as preset" to create one.',
                cls: 'setting-item-description'
            });
            return;
        }

        presets.forEach((preset: ImportPreset) => {
            new Setting(container)
                .setName(preset.name)
                .setDesc(this.describePreset(preset))
                .addButton((button: ButtonComponent) => {
                    button.setButtonText('Rename')
                        .setIcon('pencil')
                        .setTooltip('Rename this preset')
                        .onClick(() => {
                            new SavePresetModal(
                                this.app,
                                this.plugin,
                                preset.name,
                                async (name: string) => {
                                    const clash = (this.plugin.settings.importPresets || [])
                                        .some(p => p.id !== preset.id && p.name === name);
                                    if (clash) {
                                        new Notice(`A preset named "${name}" already exists.`);
                                        return;
                                    }
                                    preset.name = name;
                                    await this.plugin.saveSettings();
                                    this.plugin.refreshPresetCommands();
                                    new Notice(`Preset renamed to "${name}".`);
                                    this.renderImportPresets(container);
                                },
                                'Rename import preset',
                                'Give this preset a new name. Its captured options and command-palette entry are preserved.'
                            ).open();
                        });
                })
                .addButton((button: ButtonComponent) => {
                    button.setButtonText('Delete')
                        .setIcon('trash')
                        .setWarning()
                        .setTooltip('Delete this preset')
                        .onClick(async () => {
                            this.plugin.settings.importPresets = (this.plugin.settings.importPresets || [])
                                .filter(p => p.id !== preset.id);
                            await this.plugin.saveSettings();
                            this.plugin.refreshPresetCommands();
                            new Notice(`Preset "${preset.name}" deleted.`);
                            this.renderImportPresets(container);
                        });
                });
        });
    }

    /**
     * One-line human summary of a preset's captured options, shown under its
     * name in the settings list.
     */
    private describePreset(preset: ImportPreset): string {
        const parts: string[] = [];
        parts.push(`Collections: ${preset.collections.trim() || 'all'}`);
        if (preset.apiFilterTags.trim()) {
            parts.push(`Tags (${preset.tagMatchType}): ${preset.apiFilterTags.trim()}`);
        }
        if (preset.filterType !== 'all') {
            parts.push(`Type: ${preset.filterType}`);
        }
        parts.push(`Destination: ${preset.vaultPath.trim() || 'plugin default'}`);
        return parts.join(' · ');
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

            interface ApiResponse {
                result?: unknown;
                message?: string;
                error?: string;
                [key: string]: unknown;
            }

            let data: unknown;
            if (typeof response === 'string') {
                data = JSON.parse(response) as ApiResponse;
            } else {
                // request() returns string; this branch is defensive for future API changes
                data = response;
            }

            if (typeof data === 'object' && data !== null && 'result' in data && (data as ApiResponse).result) {
                new Notice('API token is valid!', 5000);
            } else {
                // Handle specific API error messages if available
                const errorMessage = (typeof data === 'object' && data !== null && 'message' in data) ? (data as ApiResponse).message as string
                                   : (typeof data === 'object' && data !== null && 'error' in data) ? (data as ApiResponse).error as string
                                   : 'Invalid API token or connection issue.';
                new Notice(`API token verification failed: ${errorMessage}`, 10000);
                console.error('API token verification failed:', errorMessage);
            }
        } catch (error) {
            let errorMsg = 'An error occurred during token verification.';
            if (error instanceof Error) errorMsg = error.message;
            else if (typeof error === 'string') errorMsg = error;
            new Notice(`API token verification failed: ${errorMsg}`, 10000);
            console.error('Error verifying API token:', error);
        }
    }

    /**
     * Render one content-type card into the templates section. Extracted
     * from update() so closures bind to `this` naturally.
     */
    private renderContentTypeCard(
        parent: HTMLElement,
        typeStr: RaindropType,
        typeKey: keyof MakeItRainSettings['contentTypeTemplates']
    ) {
        const toggles = this.plugin.settings.contentTypeTemplateToggles;
        const templates = this.plugin.settings.contentTypeTemplates;

        const card = parent.createDiv({ cls: 'make-it-rain-type-card' });

        new Setting(card)
            .setName(`${typeStr.charAt(0).toUpperCase() + typeStr.slice(1)} items`)
            .setDesc('Use a custom template for ' + typeStr + ' items instead of the global default.')
            .addToggle((toggle: ToggleComponent) => {
                toggle.setValue(toggles[typeKey])
                    .onChange(async (value: boolean) => {
                        toggles[typeKey] = value;
                        await this.plugin.saveSettings();
                        bodyEl.style.display = value ? 'block' : 'none';
                    });
            });

        const bodyEl = card.createDiv({ cls: 'make-it-rain-type-card-body' });
        bodyEl.style.display = toggles[typeKey] ? 'block' : 'none';

        // Captured by the textarea builder so the Reset button can refresh the
        // editor in place instead of calling this.update() (which rebuilds every
        // section and collapses the user's expanded <details> panels).
        let textComponent: TextAreaComponent;
        let updateValidation: (val: string) => void = () => {};

        new Setting(bodyEl)
            .setClass('setting-item-stacked')
            .addTextArea((text: TextAreaComponent) => {
                textComponent = text;
                const validationContainer = bodyEl.createDiv('make-it-rain-validation-container');
                updateValidation = (val: string) => {
                    const result = validateTemplate(val, this.plugin.settings);
                    this.renderValidationResult(validationContainer, result);
                };
                text.setPlaceholder('Enter template for ' + typeStr + ' items...')
                    .setValue(templates[typeKey] || '')
                    .onChange(async (value: string) => {
                        templates[typeKey] = value;
                        await this.plugin.saveSettings();
                        updateValidation(value);
                    });
                text.inputEl.rows = 8;
                text.inputEl.addClass('make-it-rain-full-width');
                text.inputEl.addClass('make-it-rain-monospace');
                updateValidation(templates[typeKey] || '');
            })
            .addButton((button: ButtonComponent) => {
                button.setButtonText('Preview').setIcon('eye')
                    .setTooltip('Render this template against a sample ' + typeStr + ' raindrop')
                    .onClick(() => {
                        this.openTemplatePreview(templates[typeKey] || '', typeStr);
                    });
            })
            .addButton((button: ButtonComponent) => {
                button.setButtonText('Reset').setIcon('undo')
                    .setTooltip('Reset ' + typeStr + ' template to its original default')
                    .onClick(async () => {
                        if (DEFAULT_SETTINGS.contentTypeTemplates[typeKey]) {
                            const defaultVal = DEFAULT_SETTINGS.contentTypeTemplates[typeKey];
                            templates[typeKey] = defaultVal;
                            await this.plugin.saveSettings();
                            // Refresh just this card's editor in place.
                            textComponent.setValue(defaultVal);
                            updateValidation(defaultVal);
                            new Notice(typeStr.charAt(0).toUpperCase() + typeStr.slice(1) +
                                ' template has been reset.');
                        } else {
                            new Notice('Error: Default template for ' + typeStr + ' not found.', 7000);
                        }
                    });
            })
            .addButton((button: ButtonComponent) => {
                button.setButtonText('Export').setIcon('export')
                    .setTooltip('Export ' + typeStr + ' template')
                    .onClick(() => {
                        const jsonStr = this.plugin.exportTemplate(
                            `content-type-${typeStr}`,
                            templates[typeKey] || '',
                            `Content-Type Template for ${typeStr}`
                        );
                        new TemplateSharingModal(this.app, this.plugin, 'export', jsonStr).open();
                    });
            });
    }

    private renderValidationResult(container: HTMLElement, result: ValidationResult) {
        container.empty();
        if (result.errors.length === 0 && result.warnings.length === 0) {
            container.createDiv({ text: '✓ Template is valid', cls: 'make-it-rain-validation-valid' });
            return;
        }

        for (const error of result.errors) {
            container.createDiv({ text: `✗ ${error}`, cls: 'make-it-rain-validation-error' });
        }
        for (const warning of result.warnings) {
            container.createDiv({ text: `⚠ ${warning}`, cls: 'make-it-rain-validation-warning' });
        }
    }

    private renderNamedTemplates(container: HTMLElement) {
        const { namedTemplates } = this.plugin.settings;
        const templateNames = Object.keys(namedTemplates).sort();

        if (templateNames.length === 0) {
            container.createEl('p', { text: 'No partials created yet.', cls: 'setting-item-description' });
            return;
        }

        for (const name of templateNames) {
            const templateDiv = container.createDiv('make-it-rain-named-template-item');

            // Header row: rename + actions
            new Setting(templateDiv)
                .setName(`Partial: ${name}`)
                .addText((text) => {
                    text.setValue(name)
                        .setPlaceholder('Template name')
                        .onChange(async (newName) => {
                            if (!newName || newName === name) return;
                            if (Object.prototype.hasOwnProperty.call(namedTemplates, newName)) {
                                new Notice(`Template name "${newName}" already exists.`);
                                return;
                            }
                            const content = namedTemplates[name];
                            delete namedTemplates[name];
                            namedTemplates[newName] = content;
                            await this.plugin.saveSettings();
                            container.empty();
                            this.renderNamedTemplates(container);
                        });
                })
                .addButton((button) => {
                    button.setIcon('eye').setTooltip('Preview partial')
                        .onClick(() => {
                            this.openTemplatePreview(namedTemplates[name] || '');
                        });
                })
                .addButton((button) => {
                    button.setIcon('export').setTooltip('Export template')
                        .onClick(() => {
                            const jsonStr = this.plugin.exportTemplate(
                                `partial-${name}`,
                                namedTemplates[name],
                                `Named Partial Template: ${name}`
                            );
                            new TemplateSharingModal(this.app, this.plugin, 'export', jsonStr).open();
                        });
                })
                .addButton((button) => {
                    button.setIcon('trash').setDestructive().setTooltip('Delete template')
                        .onClick(async () => {
                            delete namedTemplates[name];
                            await this.plugin.saveSettings();
                            container.empty();
                            this.renderNamedTemplates(container);
                        });
                });

            // Body: full-width textarea + inline validation. No side-by-side.
            new Setting(templateDiv)
                .setClass('setting-item-stacked')
                .addTextArea((text) => {
                    const validationContainer = templateDiv.createDiv('make-it-rain-validation-container');
                    const updateValidation = (val: string) => {
                        const result = validateTemplate(val, this.plugin.settings);
                        this.renderValidationResult(validationContainer, result);
                    };

                    text.setValue(namedTemplates[name])
                        .setPlaceholder('Template content...')
                        .onChange(async (value) => {
                            namedTemplates[name] = value;
                            await this.plugin.saveSettings();
                            updateValidation(value);
                        });
                    text.inputEl.rows = 5;
                    text.inputEl.addClass('make-it-rain-full-width');
                    text.inputEl.addClass('make-it-rain-monospace');
                    updateValidation(namedTemplates[name]);
                });

            container.createEl('hr');
        }
    }
}
