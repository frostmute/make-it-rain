import { App, Setting, Notice, Modal } from 'obsidian';
import { TemplateSettings, DEFAULT_TEMPLATE_SETTINGS, BUILT_IN_VARIABLES, TemplateConfig } from '../types/templates';
import { RaindropToObsidian } from '../main';
import { RaindropType } from '../types';

export class TemplateSettingsTab {
    private app: App;
    private plugin: RaindropToObsidian;
    private containerEl: HTMLElement;

    constructor(app: App, plugin: RaindropToObsidian, containerEl: HTMLElement) {
        this.app = app;
        this.plugin = plugin;
        this.containerEl = containerEl;
    }

    display(): void {
        this.containerEl.empty();

        // Initialize template settings if not present
        if (!this.plugin.settings.templateSettings) {
            this.plugin.settings.templateSettings = { ...DEFAULT_TEMPLATE_SETTINGS };
        }

        const settings = this.plugin.settings.templateSettings;

        // Enable/Disable Template System
        new Setting(this.containerEl)
            .setName('Enable Template System')
            .setDesc('Use custom templates for generating markdown content')
            .addToggle(toggle => toggle
                .setValue(settings.enabled)
                .onChange(async (value) => {
                    settings.enabled = value;
                    await this.plugin.saveSettings();
                }));

        if (!settings.enabled) {
            return;
        }

        // Default Template
        new Setting(this.containerEl)
            .setName('Default Template')
            .setDesc('Template used when no specific type template is defined')
            .addTextArea(text => text
                .setValue(settings.defaultTemplate)
                .onChange(async (value) => {
                    settings.defaultTemplate = value;
                    await this.plugin.saveSettings();
                }));

        // Type-specific Templates
        this.containerEl.createEl('h3', { text: 'Type-specific Templates' });
        
        Object.entries(settings.typeTemplates).forEach(([type, template]) => {
            new Setting(this.containerEl)
                .setName(`${type.charAt(0).toUpperCase() + type.slice(1)} Template`)
                .setDesc(`Template for ${type} type raindrops`)
                .addTextArea(text => text
                    .setValue(template)
                    .onChange(async (value) => {
                        settings.typeTemplates[type as RaindropType] = value;
                        await this.plugin.saveSettings();
                    }));
        });

        // Custom Templates
        this.containerEl.createEl('h3', { text: 'Custom Templates' });
        
        Object.entries(settings.customTemplates).forEach(([name, config]) => {
            const templateSetting = new Setting(this.containerEl)
                .setName(config.name)
                .setDesc(config.description)
                .addTextArea(text => text
                    .setValue(config.template)
                    .onChange(async (value) => {
                        config.template = value;
                        await this.plugin.saveSettings();
                    }))
                .addExtraButton(button => button
                    .setIcon('trash')
                    .setTooltip('Delete template')
                    .onClick(async () => {
                        delete settings.customTemplates[name];
                        await this.plugin.saveSettings();
                        this.display();
                    }));
        });

        // Add New Custom Template
        new Setting(this.containerEl)
            .setName('Add Custom Template')
            .setDesc('Create a new custom template')
            .addButton(button => button
                .setButtonText('Add Template')
                .onClick(() => {
                    const modal = new AddTemplateModal(this.app, async (config) => {
                        const templateConfig: TemplateConfig = {
                            ...config,
                            variables: BUILT_IN_VARIABLES
                        };
                        settings.customTemplates[config.name] = templateConfig;
                        await this.plugin.saveSettings();
                        this.display();
                    });
                    modal.open();
                }));

        // Available Variables
        this.containerEl.createEl('h3', { text: 'Available Variables' });
        const variablesList = this.containerEl.createEl('div', { cls: 'template-variables' });
        
        BUILT_IN_VARIABLES.forEach(variable => {
            const variableEl = variablesList.createEl('div', { cls: 'template-variable' });
            variableEl.createEl('strong', { text: `{{${variable.name}}}` });
            variableEl.createEl('p', { text: variable.description });
            variableEl.createEl('code', { text: variable.example });
        });
    }
}

class AddTemplateModal extends Modal {
    private onSubmit: (config: { name: string; description: string; template: string }) => void;
    private name: string = '';
    private description: string = '';
    private template: string = '';

    constructor(app: App, onSubmit: (config: { name: string; description: string; template: string }) => void) {
        super(app);
        this.onSubmit = onSubmit;
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: 'Add Custom Template' });

        new Setting(contentEl)
            .setName('Template Name')
            .addText(text => text
                .setPlaceholder('Enter template name')
                .onChange(value => this.name = value));

        new Setting(contentEl)
            .setName('Description')
            .addText(text => text
                .setPlaceholder('Enter template description')
                .onChange(value => this.description = value));

        new Setting(contentEl)
            .setName('Template')
            .addTextArea(text => text
                .setPlaceholder('Enter template content')
                .onChange(value => this.template = value));

        new Setting(contentEl)
            .addButton(button => button
                .setButtonText('Add')
                .onClick(() => {
                    if (!this.name || !this.template) {
                        new Notice('Name and template are required');
                        return;
                    }
                    this.onSubmit({
                        name: this.name,
                        description: this.description || '',
                        template: this.template
                    });
                    this.close();
                }));
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
} 