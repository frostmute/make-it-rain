import { App, PluginSettingTab, Setting, TextComponent, ButtonComponent, Notice, request, ToggleComponent } from 'obsidian';
import type RaindropToObsidian from './main';
import { RaindropTypes } from './main';
import { MakeItRainSettings } from './types';

export const DEFAULT_SETTINGS: MakeItRainSettings = {
    apiToken: '',
    defaultFolder: '',
    fileNameTemplate: '{{title}}',
    showRibbonIcon: true,
    bannerFieldName: 'banner',
    isTemplateSystemEnabled: true,
    defaultTemplate: `---
title: "{{title}}"
source: {{link}}
type: {{type}}
created: {{created}}
lastupdate: {{lastupdate}}
id: {{id}}
collectionId: {{collectionId}}
collectionTitle: "{{collectionTitle}}"
collectionPath: "{{collectionPath}}"
{{#if collectionParentId}}collectionParentId: {{collectionParentId}}{{/if}}
tags:
{{#each tags}}
  - {{this}}
{{/each}}
{{#if cover}}
{{bannerFieldName}}: {{cover}}
{{/if}}
---

{{#if cover}}
![{{title}}]({{cover}})
{{/if}}

# {{title}}

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

---
## Details
- **Type**: {{renderedType}}
- **Domain**: {{domain}}
- **Created**: {{formattedCreatedDate}}
- **Updated**: {{formattedUpdatedDate}}
- **Tags**: {{formattedTags}}
`,
    contentTypeTemplates: {
        link: `---
title: "{{title}}"
source: {{link}}
type: {{type}}
created: {{created}}
lastupdate: {{lastupdate}}
id: {{id}}
collectionId: {{collectionId}}
collectionTitle: "{{collectionTitle}}"
collectionPath: "{{collectionPath}}"
{{#if collectionParentId}}collectionParentId: {{collectionParentId}}{{/if}}
tags:
{{#each tags}}
  - {{this}}
{{/each}}
{{#if cover}}
{{bannerFieldName}}: {{cover}}
{{/if}}
---

{{#if cover}}
![{{title}}]({{cover}})
{{/if}}

# {{title}}

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

---
## Details
- **Type**: {{renderedType}}
- **Domain**: {{domain}}
- **Created**: {{formattedCreatedDate}}
- **Updated**: {{formattedUpdatedDate}}
- **Tags**: {{formattedTags}}

[Source]({{link}})`,
        article: `---
title: "{{title}}"
source: {{link}}
type: {{type}}
created: {{created}}
lastupdate: {{lastupdate}}
id: {{id}}
collectionId: {{collectionId}}
collectionTitle: "{{collectionTitle}}"
collectionPath: "{{collectionPath}}"
{{#if collectionParentId}}collectionParentId: {{collectionParentId}}{{/if}}
tags:
{{#each tags}}
  - {{this}}
{{/each}}
{{#if cover}}
{{bannerFieldName}}: {{cover}}
{{/if}}
---

{{#if cover}}
![{{title}}]({{cover}})
{{/if}}

# {{title}}

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

---
## Details
- **Type**: {{renderedType}}
- **Domain**: {{domain}}
- **Created**: {{formattedCreatedDate}}
- **Updated**: {{formattedUpdatedDate}}
- **Tags**: {{formattedTags}}

[Read Article]({{link}})`,
        image: `---
title: "{{title}}"
source: {{link}}
type: {{type}}
created: {{created}}
lastupdate: {{lastupdate}}
id: {{id}}
collectionId: {{collectionId}}
collectionTitle: "{{collectionTitle}}"
collectionPath: "{{collectionPath}}"
{{#if collectionParentId}}collectionParentId: {{collectionParentId}}{{/if}}
tags:
{{#each tags}}
  - {{this}}
{{/each}}
{{bannerFieldName}}: {{cover}}
---

![{{title}}]({{cover}})

{{#if excerpt}}
*{{excerpt}}*
{{/if}}

{{#if note}}
## Notes
{{note}}
{{/if}}

---
## Details
- **Type**: {{renderedType}}
- **Domain**: {{domain}}
- **Created**: {{formattedCreatedDate}}
- **Updated**: {{formattedUpdatedDate}}
- **Tags**: {{formattedTags}}

[View Original]({{link}})`,
        video: `---
title: "{{title}}"
source: {{link}}
type: {{type}}
created: {{created}}
lastupdate: {{lastupdate}}
id: {{id}}
collectionId: {{collectionId}}
collectionTitle: "{{collectionTitle}}"
collectionPath: "{{collectionPath}}"
{{#if collectionParentId}}collectionParentId: {{collectionParentId}}{{/if}}
tags:
{{#each tags}}
  - {{this}}
{{/each}}
{{#if cover}}
{{bannerFieldName}}: {{cover}}
{{/if}}
---

{{#if cover}}
![{{title}}]({{cover}})
{{/if}}

# {{title}}

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

---
## Details
- **Type**: {{renderedType}}
- **Domain**: {{domain}}
- **Created**: {{formattedCreatedDate}}
- **Updated**: {{formattedUpdatedDate}}
- **Tags**: {{formattedTags}}

[Watch Video]({{link}})`,
        document: `---
title: "{{title}}"
source: {{link}}
type: {{type}}
created: {{created}}
lastupdate: {{lastupdate}}
id: {{id}}
collectionId: {{collectionId}}
collectionTitle: "{{collectionTitle}}"
collectionPath: "{{collectionPath}}"
{{#if collectionParentId}}collectionParentId: {{collectionParentId}}{{/if}}
tags:
{{#each tags}}
  - {{this}}
{{/each}}
{{#if cover}}
{{bannerFieldName}}: {{cover}}
{{/if}}
---

# {{title}}

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

---
## Details
- **Type**: {{renderedType}}
- **Domain**: {{domain}}
- **Created**: {{formattedCreatedDate}}
- **Updated**: {{formattedUpdatedDate}}
- **Tags**: {{formattedTags}}

[Open Document]({{link}})`,
        audio: `---
title: "{{title}}"
source: {{link}}
type: {{type}}
created: {{created}}
lastupdate: {{lastupdate}}
id: {{id}}
collectionId: {{collectionId}}
collectionTitle: "{{collectionTitle}}"
collectionPath: "{{collectionPath}}"
{{#if collectionParentId}}collectionParentId: {{collectionParentId}}{{/if}}
tags:
{{#each tags}}
  - {{this}}
{{/each}}
{{#if cover}}
{{bannerFieldName}}: {{cover}}
{{/if}}
---

{{#if cover}}
![{{title}}]({{cover}})
{{/if}}

# {{title}}

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

---
## Details
- **Type**: {{renderedType}}
- **Domain**: {{domain}}
- **Created**: {{formattedCreatedDate}}
- **Updated**: {{formattedUpdatedDate}}
- **Tags**: {{formattedTags}}

[Listen to Audio]({{link}})

{{#if localEmbed}}
## Local File
{{localEmbed}}
{{/if}}`,
        book: `---
title: "{{title}}"
source: {{link}}
type: {{type}}
created: {{created}}
lastupdate: {{lastupdate}}
id: {{id}}
collectionId: {{collectionId}}
collectionTitle: "{{collectionTitle}}"
collectionPath: "{{collectionPath}}"
{{#if collectionParentId}}collectionParentId: {{collectionParentId}}{{/if}}
tags:
{{#each tags}}
  - {{this}}
{{/each}}
{{#if cover}}
{{bannerFieldName}}: {{cover}}
{{/if}}
---

{{#if cover}}
![{{title}}]({{cover}})
{{/if}}

# {{title}}

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

{{#if localEmbed}}
## Local File
{{localEmbed}}
{{/if}}

---
## Details
- **Type**: {{renderedType}}
- **Created**: {{formattedCreatedDate}}
- **Updated**: {{formattedUpdatedDate}}
- **Tags**: {{formattedTags}}

[Open Book]({{link}})`
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
    createFolderNotes: false
};

export class RaindropToObsidianSettingTab extends PluginSettingTab {
    plugin: RaindropToObsidian;

    constructor(app: App, plugin: RaindropToObsidian) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h1', { text: 'Make It Rain Settings' });

        // --- API Configuration Section ---
        containerEl.createEl('h2', { text: '💧 Raindrop.io API Configuration' });
        const apiTokenSetting = new Setting(containerEl)
            .setName('Raindrop.io API Token')
            .setDesc('Create a "Test Token" from your Raindrop.io Apps settings.')
            .addText((text: TextComponent) => {
                text.setPlaceholder('Enter your API token')
                    .setValue(this.plugin.settings.apiToken)
                    .onChange(async (value: string) => {
                        this.plugin.settings.apiToken = value;
                        await this.plugin.saveSettings();
                    });
                text.inputEl.type = 'password'; // Mask the token
                text.inputEl.style.width = '100%';
            })
            .addButton((button: ButtonComponent) => {
                button.setButtonText("Verify Token")
                    .setIcon("checkmark")
                    .setCta()
                    .onClick(async () => {
                        await this.verifyApiToken();
                    });
            });
        
        const apiTokenHelpLink = apiTokenSetting.nameEl.createEl('a', {
            href: 'https://frostmute.github.io/make-it-rain/configuration#api-token',
            text: ' (?)',
            cls: 'make-it-rain-help-link',
            title: 'How to get your API Token'
        });
        apiTokenHelpLink.setAttr('target', '_blank');

        // --- General Import Settings Section ---
        containerEl.createEl('h2', { text: '⚙️ General Import Settings' });
        new Setting(containerEl)
            .setName('Default Vault Save Location')
            .setDesc('Specify the default folder for imported notes (e.g., Imports/Raindrops). Leave blank for vault root.')
            .addText((text: TextComponent) => {
                text.setPlaceholder('e.g., Raindrops/')
                    .setValue(this.plugin.settings.defaultFolder)
                    .onChange(async (value: string) => {
                        this.plugin.settings.defaultFolder = value;
                        await this.plugin.saveSettings();
                    });
                text.inputEl.style.width = '100%';
            });

        const fileNameTemplateSetting = new Setting(containerEl)
            .setName('Filename Template')
            .setDesc('Define the filename for notes when "Use Raindrop Title" is enabled. Placeholders: {{title}}, {{id}}, {{collectionTitle}}, {{date}} (YYYY-MM-DD).')
            .addText((text: TextComponent) => {
                text.setPlaceholder('{{title}}')
                    .setValue(this.plugin.settings.fileNameTemplate)
                    .onChange(async (value: string) => {
                        this.plugin.settings.fileNameTemplate = value;
                        await this.plugin.saveSettings();
                    });
                text.inputEl.style.width = '100%';
            });
        
        const fileNameTemplateHelpLink = fileNameTemplateSetting.nameEl.createEl('a', {
            href: 'https://frostmute.github.io/make-it-rain/configuration#filename-template',
            text: ' (?)',
            cls: 'make-it-rain-help-link',
            title: 'Documentation for Filename Template'
        });
        fileNameTemplateHelpLink.setAttr('target', '_blank');

        new Setting(containerEl)
            .setName('Banner Frontmatter Field Name')
            .setDesc('Customize the frontmatter field name for the banner/cover image (default: banner).')
            .addText((text: TextComponent) => {
                text.setPlaceholder('banner')
                    .setValue(this.plugin.settings.bannerFieldName)
                    .onChange(async (value: string) => {
                        this.plugin.settings.bannerFieldName = value;
                        await this.plugin.saveSettings();
                    });
            });


        new Setting(containerEl)
            .setName('Download Files Locally')
            .setDesc('If a raindrop is a Document, Image, Video, or Audio file, automatically download the raw file directly into your vault.')
            .addToggle((toggle: ToggleComponent) => {
                toggle.setValue(this.plugin.settings.downloadFiles)
                    .onChange(async (value: boolean) => {
                        this.plugin.settings.downloadFiles = value;
                        await this.plugin.saveSettings();
                    });
            });

        new Setting(containerEl)
            .setName('Create Folder Notes')
            .setDesc('Automatically generate an index note matching the name of each collection folder, listing its children.')
            .addToggle((toggle: ToggleComponent) => {
                toggle.setValue(this.plugin.settings.createFolderNotes)
                    .onChange(async (value: boolean) => {
                        this.plugin.settings.createFolderNotes = value;
                        await this.plugin.saveSettings();
                    });
            });

        // --- UI Settings Section ---
        containerEl.createEl('h2', { text: '🎨 User Interface' });
        new Setting(containerEl)
            .setName('Show Ribbon Icon')
            .setDesc('Toggle the Make It Rain ribbon icon in the Obsidian sidebar.')
            .addToggle((toggle: ToggleComponent) => {
                toggle.setValue(this.plugin.settings.showRibbonIcon)
                    .onChange(async (value: boolean) => {
                        this.plugin.settings.showRibbonIcon = value;
                        await this.plugin.saveSettings();
                        this.plugin.updateRibbonIcon(); // Update icon visibility immediately
                    });
            });

        containerEl.createEl('hr');

        // --- Template System Section ---
        containerEl.createEl('h2', { text: '📄 Template System' });
        new Setting(containerEl)
            .setName('Enable Template System')
            .setDesc('Use custom templates for formatting imported notes. If disabled, a basic note structure will be used.')
            .addToggle((toggle: ToggleComponent) => {
                toggle.setValue(this.plugin.settings.isTemplateSystemEnabled)
                    .onChange(async (value: boolean) => {
                        this.plugin.settings.isTemplateSystemEnabled = value;
                        await this.plugin.saveSettings();
                        this.display(); // Refresh settings to show/hide template options
                    });
            });

        if (this.plugin.settings.isTemplateSystemEnabled) {
            containerEl.createEl('h3', { text: 'Default Template' });
            new Setting(containerEl)
                .setDesc('This template is used if no content-type specific template is active or defined below.')
                .setClass('setting-item-stacked') // Added class
                .addTextArea((text) => {
                    text.setPlaceholder('Enter your default Handlebars template here...')
                        .setValue(this.plugin.settings.defaultTemplate)
                        .onChange(async (value) => {
                            this.plugin.settings.defaultTemplate = value;
                            await this.plugin.saveSettings();
                        });
                    text.inputEl.rows = 15;
                    text.inputEl.style.width = '100%';
                    text.inputEl.style.fontFamily = 'monospace';
                })
                .addButton((button) => {
                    button
                        .setButtonText("Reset to Default")
                        .setIcon("undo") // Using 'undo' icon
                        .setTooltip("Reset this template to its original default value")
                        .onClick(async () => {
                            this.plugin.settings.defaultTemplate = DEFAULT_SETTINGS.defaultTemplate;
                            await this.plugin.saveSettings();
                            this.display(); // Refresh the settings tab
                            new Notice("Default template has been reset.");
                        });
                });

            containerEl.createEl('h3', { text: 'Content-Type Specific Templates' });
            const contentTypeDesc = containerEl.createEl('p', { cls: 'setting-item-description' });
            contentTypeDesc.appendText('Define specific templates for different Raindrop types. If a type-specific template is enabled and filled, it will be used instead of the default template. If disabled or empty, the default template is used for that type. Visit the ');
            contentTypeDesc.createEl('a', { href: 'https://frostmute.github.io/make-it-rain/template-system/', text: 'documentation' });
            contentTypeDesc.appendText(' for available variables.');


            const contentTypes = Object.values(RaindropTypes);
            for (const type of contentTypes) {
                const typeKey = type as keyof typeof this.plugin.settings.contentTypeTemplates;
                
                containerEl.createEl('h4', { text: `${type.charAt(0).toUpperCase() + type.slice(1)} Template`});
                
                new Setting(containerEl)
                    .setName(`Enable ${type} Template`)
                    .setDesc(`Use a custom template for "${type}" items.`)
                    .addToggle((toggle) => {
                        toggle
                            .setValue(this.plugin.settings.contentTypeTemplateToggles[typeKey])
                            .onChange(async (value) => {
                                this.plugin.settings.contentTypeTemplateToggles[typeKey] = value;
                                await this.plugin.saveSettings();
                                this.display(); // Refresh to show/hide textarea
                            });
                    });

                if (this.plugin.settings.contentTypeTemplateToggles[typeKey]) {
                    new Setting(containerEl)
                        .setDesc(`Template for "${type}" content. Leave empty to use the default template.`)
                        .setClass('setting-item-stacked') // Added class
                        .addTextArea((text) => {
                            text.setPlaceholder(`Enter template for ${type} items...`)
                                .setValue(this.plugin.settings.contentTypeTemplates[typeKey])
                                .onChange(async (value) => {
                                    this.plugin.settings.contentTypeTemplates[typeKey] = value;
                                    await this.plugin.saveSettings();
                                });
                            text.inputEl.rows = 10;
                            text.inputEl.style.width = '100%';
                            text.inputEl.style.fontFamily = 'monospace';
                        })
                        .addButton((button) => { // Add Reset Button for specific type
                            button
                                .setButtonText("Reset") 
                                .setIcon("undo")
                                .setTooltip(`Reset ${type} template to its original default`)
                                .onClick(async () => {
                                    // Ensure DEFAULT_SETTINGS.contentTypeTemplates[typeKey] exists before assigning
                                    if (DEFAULT_SETTINGS.contentTypeTemplates[typeKey]) {
                                        this.plugin.settings.contentTypeTemplates[typeKey] = DEFAULT_SETTINGS.contentTypeTemplates[typeKey];
                                        await this.plugin.saveSettings();
                                        this.display(); // Refresh the settings tab
                                        new Notice(`${type.charAt(0).toUpperCase() + type.slice(1)} template has been reset.`);
                                    } else {
                                        new Notice(`Error: Default template for ${type} not found.`, 7000);
                                    }
                                });
                        });
                }
                 containerEl.createEl('hr');
            }
        }

        // --- About/Footer Section ---
        containerEl.createEl('hr');
        const footer = containerEl.createDiv({ cls: 'setting-footer' });
        const p1 = footer.createEl('p');
        p1.createEl('strong', { text: `Make It Rain v${this.plugin.manifest.version}` });

        const p2 = footer.createEl('p');
        p2.appendText('Developed by ');
        const a1 = p2.createEl('a', { href: 'https://github.com/frostmute', text: 'frostmute (Jonathan Wagner)' });
        a1.setAttr('target', '_blank');
        p2.appendText('.');

        const p3 = footer.createEl('p');
        p3.appendText('Found this plugin helpful? Consider ');
        const a2 = p3.createEl('a', { href: 'https://ko-fi.com/frostmute', text: 'supporting its development' });
        a2.setAttr('target', '_blank');
        p3.appendText('.');

        const p4 = footer.createEl('p');
        p4.appendText('For help, feature requests, or to report issues, please visit the ');
        const a3 = p4.createEl('a', { href: 'https://github.com/frostmute/make-it-rain/issues', text: 'GitHub repository' });
        a3.setAttr('target', '_blank');
        p4.appendText('.');
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
                new Notice('API Token is valid!', 5000);
            } else {
                // Handle specific API error messages if available
                const errorMessage = data.message || data.error || 'Invalid API token or connection issue.';
                new Notice(`API Token verification failed: ${errorMessage}`, 10000);
                console.error('API Token verification failed:', errorMessage);
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
