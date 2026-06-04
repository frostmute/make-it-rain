import { App, PluginSettingTab, Setting, TextComponent, ButtonComponent, Notice, request, ToggleComponent, TextAreaComponent, DropdownComponent } from 'obsidian';
import type RaindropToObsidian from './main';
import { RaindropTypes } from './types';
import { MakeItRainSettings } from './types';
import { VariableBrowserModal } from './modals';
import { validateTemplate, ValidationResult } from './template-validator';

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
        document: `{{#extends "base"}}
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
        document: true,
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
    }
};

export class RaindropToObsidianSettingTab extends PluginSettingTab {
    plugin: RaindropToObsidian;
    selectedTemplateType: string = 'link';

    constructor(app: App, plugin: RaindropToObsidian) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        
        containerEl.addClass('make-it-rain-settings-container');

        // Plugin Header
        const headerEl = containerEl.createDiv({ cls: 'make-it-rain-settings-header' });
        headerEl.createEl('h2', { text: 'Make It Rain Settings' });
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

        const apiTokenHelpLink = apiTokenSetting.nameEl.createEl('a', {
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

        const fileNameTemplateSetting = new Setting(orgContent)
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

        // --- 4. Template Engine ---
        const templateSection = containerEl.createEl('details', { cls: 'make-it-rain-settings-section make-it-rain-advanced-options' });
        templateSection.createEl('summary', { text: 'Template Engine', cls: 'make-it-rain-section-summary' });
        const templateContent = templateSection.createDiv({ cls: 'make-it-rain-section-content' });

        new Setting(templateContent)
            .setName('Enable template system')
            .setDesc('Use custom Handlebars templates for formatting imported notes instead of the basic fallback structure.')
            .addToggle((toggle: ToggleComponent) => {
                toggle.setValue(this.plugin.settings.isTemplateSystemEnabled)
                    .onChange(async (value: boolean) => {
                        this.plugin.settings.isTemplateSystemEnabled = value;
                        await this.plugin.saveSettings();
                        this.display(); // Refresh to show/hide template options
                    });
            });

        if (this.plugin.settings.isTemplateSystemEnabled) {
            new Setting(templateContent)
                .setName('Template Reference')
                .setDesc('View all available variables, properties, and formatting helpers you can inject into your templates.')
                .addButton((button: ButtonComponent) => {
                    button
                        .setButtonText("Browse variables")
                        .setIcon("search")
                        .onClick(() => {
                            new VariableBrowserModal(this.app).open();
                        });
                });

            // Reusable Parts (Named Templates)
            templateContent.createEl('h3', { text: 'Reusable Partials', cls: 'make-it-rain-h3' });
            const namedDesc = templateContent.createEl('p', { cls: 'setting-item-description' });
            namedDesc.appendText('Create reusable snippets that can be included in other templates using {{#include "name"}} or extended using {{#extends "name"}}.');

            const namedTemplatesContainer = templateContent.createDiv('make-it-rain-named-templates-container');
            this.renderNamedTemplates(namedTemplatesContainer);

            new Setting(templateContent)
                .addButton((button: ButtonComponent) => {
                    button.setButtonText("+ Add new partial")
                        .setCta()
                        .onClick(async () => {
                            const name = "new-partial-" + Date.now();
                            this.plugin.settings.namedTemplates[name] = "";
                            await this.plugin.saveSettings();
                            this.display();
                        });
                });

            // Default Template
            templateContent.createEl('h3', { text: 'Default Global Template', cls: 'make-it-rain-h3 make-it-rain-mt-large' });
            new Setting(templateContent)
                .setDesc('This template is used if no content-type specific template is active below.')
                .setClass('setting-item-stacked')
                .addTextArea((text: TextAreaComponent) => {
                    const validationContainer = templateContent.createDiv('make-it-rain-validation-container');
                    const updateValidation = (val: string) => {
                        const result = validateTemplate(val, this.plugin.settings);
                        this.renderValidationResult(validationContainer, result);
                    };

                    text.setPlaceholder('Enter your default handlebars template here.')
                        .setValue(this.plugin.settings.defaultTemplate)
                        .onChange(async (value: string) => {
                            this.plugin.settings.defaultTemplate = value;
                            await this.plugin.saveSettings();
                            updateValidation(value);
                        });
                    text.inputEl.rows = 8;
                    text.inputEl.addClass('make-it-rain-full-width');
                    text.inputEl.addClass('make-it-rain-monospace');
                    updateValidation(this.plugin.settings.defaultTemplate);
                })
                .addButton((button: ButtonComponent) => {
                    button
                        .setButtonText("Reset default")
                        .setIcon("undo")
                        .setTooltip("Reset this template to its original default value")
                        .onClick(async () => {
                            this.plugin.settings.defaultTemplate = DEFAULT_SETTINGS.defaultTemplate;
                            await this.plugin.saveSettings();
                            this.display();
                            new Notice("Default template has been reset.");
                        });
                });

            // Content-Type Editor
            templateContent.createEl('h3', { text: 'Content-Type Overrides', cls: 'make-it-rain-h3 make-it-rain-mt-large' });
            const contentTypeDesc = templateContent.createEl('p', { cls: 'setting-item-description' });
            contentTypeDesc.appendText('Define specific layout overrides for different raindrop types (e.g. extending the base template to show video timestamps vs article content).');

            const editorCard = templateContent.createDiv({ cls: 'make-it-rain-settings-card' });
            
            new Setting(editorCard)
                .setName('Select content type')
                .setDesc('Choose which template to customize.')
                .addDropdown((dropdown) => {
                    const contentTypes = Object.keys(RaindropTypes).map(key => RaindropTypes[key as keyof typeof RaindropTypes]);
                    contentTypes.forEach(type => {
                        dropdown.addOption(type, type.charAt(0).toUpperCase() + type.slice(1));
                    });
                    dropdown.setValue(this.selectedTemplateType)
                        .onChange((value) => {
                            this.selectedTemplateType = value;
                            this.display();
                        });
                });

            const typeStr = this.selectedTemplateType;
            const typeKey = typeStr as keyof typeof this.plugin.settings.contentTypeTemplates;

            new Setting(editorCard)
                .setName('Enable override')
                .setDesc('Use a custom template for ' + typeStr + ' items instead of the global default.')
                .addToggle((toggle: ToggleComponent) => {
                    toggle
                        .setValue(this.plugin.settings.contentTypeTemplateToggles[typeKey])
                        .onChange(async (value: boolean) => {
                            this.plugin.settings.contentTypeTemplateToggles[typeKey] = value;
                            await this.plugin.saveSettings();
                            this.display();
                        });
                });

            if (this.plugin.settings.contentTypeTemplateToggles[typeKey]) {
                new Setting(editorCard)
                    .setDesc('Template for ' + typeStr + ' content.')
                    .setClass('setting-item-stacked')
                    .addTextArea((text: TextAreaComponent) => {
                        const validationContainer = editorCard.createDiv('make-it-rain-validation-container');
                        const updateValidation = (val: string) => {
                            const result = validateTemplate(val, this.plugin.settings);
                            this.renderValidationResult(validationContainer, result);
                        };

                        text.setPlaceholder('Enter template for ' + typeStr + ' items...')
                            .setValue(this.plugin.settings.contentTypeTemplates[typeKey])
                            .onChange(async (value: string) => {
                                this.plugin.settings.contentTypeTemplates[typeKey] = value;
                                await this.plugin.saveSettings();
                                updateValidation(value);
                            });
                        text.inputEl.rows = 12;
                        text.inputEl.addClass('make-it-rain-full-width');
                        text.inputEl.addClass('make-it-rain-monospace');
                        updateValidation(this.plugin.settings.contentTypeTemplates[typeKey]);
                    })
                    .addButton((button: ButtonComponent) => {
                        button
                            .setButtonText("Reset")
                            .setIcon("undo")
                            .setTooltip('Reset ' + typeStr + ' template to its original default')
                            .onClick(async () => {
                                if (DEFAULT_SETTINGS.contentTypeTemplates[typeKey]) {
                                    this.plugin.settings.contentTypeTemplates[typeKey] = DEFAULT_SETTINGS.contentTypeTemplates[typeKey];
                                    await this.plugin.saveSettings();
                                    this.display();
                                    new Notice(typeStr.charAt(0).toUpperCase() + typeStr.slice(1) + ' template has been reset.');
                                } else {
                                    new Notice('Error: Default template for ' + typeStr + ' not found.', 7000);
                                }
                            });
                    });
            }
        }

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
                new Notice('API token is valid!', 5000);
            } else {
                // Handle specific API error messages if available
                const errorMessage = data.message || data.error || 'Invalid API token or connection issue.';
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

    private renderValidationResult(container: HTMLElement, result: ValidationResult) {
        container.empty();
        if (result.errors.length === 0 && result.warnings.length === 0) {
            container.createEl('div', { text: '✓ Template is valid', cls: 'make-it-rain-validation-valid' });
            return;
        }

        for (const error of result.errors) {
            container.createEl('div', { text: `✗ ${error}`, cls: 'make-it-rain-validation-error' });
        }
        for (const warning of result.warnings) {
            container.createEl('div', { text: `⚠ ${warning}`, cls: 'make-it-rain-validation-warning' });
        }
    }

    private renderNamedTemplates(container: HTMLElement) {
        const { namedTemplates } = this.plugin.settings;
        const templateNames = Object.keys(namedTemplates).sort();

        if (templateNames.length === 0) {
            container.createEl('p', { text: 'No named templates created yet.', cls: 'setting-item-description' });
            return;
        }

        for (const name of templateNames) {
            const templateDiv = container.createDiv('make-it-rain-named-template-item');
            
            const header = new Setting(templateDiv)
                .setName(`Template: ${name}`)
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
                        });
                })
                .addButton((button) => {
                    button.setIcon('trash')
                        .setWarning()
                        .setTooltip('Delete template')
                        .onClick(async () => {
                            delete namedTemplates[name];
                            await this.plugin.saveSettings();
                            this.display();
                        });
                });

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
