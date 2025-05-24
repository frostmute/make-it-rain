import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import RaindropToObsidian from '../main';
import { createAuthenticatedRequestOptions, fetchWithRetry } from '../utils/apiUtils';

export class RaindropSettingTab extends PluginSettingTab {
    plugin: RaindropToObsidian;

    constructor(app: App, plugin: RaindropToObsidian) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Raindrop.io Settings' });

        new Setting(containerEl)
            .setName('API Token')
            .setDesc('Your Raindrop.io API token')
            .addText(text => text
                .setPlaceholder('Enter your API token')
                .setValue(this.plugin.settings.raindropApiToken)
                .onChange(async (value) => {
                    this.plugin.settings.raindropApiToken = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Default Vault Location')
            .setDesc('Default folder to save fetched raindrops')
            .addText(text => text
                .setPlaceholder('Enter default vault location')
                .setValue(this.plugin.settings.defaultVaultLocation)
                .onChange(async (value) => {
                    this.plugin.settings.defaultVaultLocation = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('File Name Template')
            .setDesc('Template for generated file names')
            .addText(text => text
                .setPlaceholder('Enter file name template')
                .setValue(this.plugin.settings.fileNameTemplate)
                .onChange(async (value) => {
                    this.plugin.settings.fileNameTemplate = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Show Ribbon Icon')
            .setDesc('Show the Raindrop.io icon in the ribbon')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showRibbonIcon)
                .onChange(async (value) => {
                    this.plugin.settings.showRibbonIcon = value;
                    await this.plugin.saveSettings();
                    this.plugin.updateRibbonIcon();
                }));

        new Setting(containerEl)
            .setName('Banner Field Name')
            .setDesc('Field name for the banner in the frontmatter')
            .addText(text => text
                .setPlaceholder('Enter banner field name')
                .setValue(this.plugin.settings.bannerFieldName)
                .onChange(async (value) => {
                    this.plugin.settings.bannerFieldName = value;
                    await this.plugin.saveSettings();
                }));

        // Add a button to verify the API token
        new Setting(containerEl)
            .setName('Verify API Token')
            .setDesc('Test if your API token is valid')
            .addButton(button => button
                .setButtonText('Verify')
                .onClick(async () => {
                    await this.verifyApiToken();
                }));
    }

    async verifyApiToken(): Promise<void> {
        try {
            if (!this.plugin.settings.raindropApiToken) {
                new Notice('Please enter your Raindrop.io API token first');
                return;
            }

            const requestOptions = createAuthenticatedRequestOptions(this.plugin.settings.raindropApiToken);
            const response = await fetchWithRetry(
                this.app,
                'https://api.raindrop.io/rest/v1/user',
                requestOptions,
                this.plugin.rateLimiter
            );

            if (response && response.result) {
                new Notice('API token is valid!');
            } else {
                throw new Error('Invalid API response');
            }
        } catch (error) {
            new Notice(`Error verifying API token: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
} 