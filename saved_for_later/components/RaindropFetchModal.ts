import { App, Modal, Notice } from 'obsidian';
import RaindropToObsidian from '../main';
import { TagMatchType, TagMatchTypes, FilterType, FilterTypes, ModalFetchOptions } from '../types';

export class RaindropFetchModal extends Modal {
    plugin: RaindropToObsidian;
    vaultPath: string;
    collections: string = '';
    apiFilterTags: string = '';
    includeSubcollections: boolean = false;
    appendTagsToNotes: boolean = false;
    useRaindropTitleForFileName: boolean = true;
    tagMatchType: TagMatchType = TagMatchTypes.ALL;
    filterType: FilterType = FilterTypes.ALL;
    fetchOnlyNew: boolean = false;
    updateExisting: boolean = false;

    constructor(app: App, plugin: RaindropToObsidian) {
        super(app);
        this.plugin = plugin;
        this.vaultPath = plugin.settings.defaultVaultLocation;
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();

        // Create form elements
        contentEl.createEl('h2', { text: 'Fetch Raindrops' });

        // Vault path input
        this.createInputField(contentEl, 'Vault Path', this.vaultPath, (value) => {
            this.vaultPath = value;
        });

        // Collections input
        this.createInputField(contentEl, 'Collections (comma-separated IDs)', this.collections, (value) => {
            this.collections = value;
        });

        // Tags input
        this.createInputField(contentEl, 'Filter Tags (comma-separated)', this.apiFilterTags, (value) => {
            this.apiFilterTags = value;
        });

        // Include subcollections toggle
        this.createToggle(contentEl, 'Include Subcollections', this.includeSubcollections, (value) => {
            this.includeSubcollections = value;
        });

        // Append tags toggle
        this.createToggle(contentEl, 'Append Tags to Notes', this.appendTagsToNotes, (value) => {
            this.appendTagsToNotes = value;
        });

        // Use Raindrop title toggle
        this.createToggle(contentEl, 'Use Raindrop Title for Filename', this.useRaindropTitleForFileName, (value) => {
            this.useRaindropTitleForFileName = value;
        });

        // Tag match type select
        this.createSelect(contentEl, 'Tag Match Type', [
            { value: TagMatchTypes.ALL, text: 'All Tags Must Match' },
            { value: TagMatchTypes.ANY, text: 'Any Tag Can Match' }
        ], this.tagMatchType, (value) => {
            this.tagMatchType = value as TagMatchType;
        });

        // Filter type select
        this.createSelect(contentEl, 'Filter Type', [
            { value: FilterTypes.ALL, text: 'All Types' },
            { value: FilterTypes.LINK, text: 'Links' },
            { value: FilterTypes.ARTICLE, text: 'Articles' },
            { value: FilterTypes.IMAGE, text: 'Images' },
            { value: FilterTypes.VIDEO, text: 'Videos' },
            { value: FilterTypes.DOCUMENT, text: 'Documents' },
            { value: FilterTypes.AUDIO, text: 'Audio' }
        ], this.filterType, (value) => {
            this.filterType = value as FilterType;
        });

        // Fetch only new toggle
        this.createToggle(contentEl, 'Fetch Only New Items', this.fetchOnlyNew, (value) => {
            this.fetchOnlyNew = value;
        });

        // Update existing toggle
        this.createToggle(contentEl, 'Update Existing Items', this.updateExisting, (value) => {
            this.updateExisting = value;
        });

        // Fetch button
        const fetchButton = contentEl.createEl('button', {
            text: 'Fetch Raindrops',
            cls: 'mod-cta'
        });

        fetchButton.addEventListener('click', async () => {
            const options: ModalFetchOptions = {
                vaultPath: this.vaultPath,
                collections: this.collections,
                apiFilterTags: this.apiFilterTags,
                includeSubcollections: this.includeSubcollections,
                appendTagsToNotes: this.appendTagsToNotes.toString(),
                useRaindropTitleForFileName: this.useRaindropTitleForFileName,
                tagMatchType: this.tagMatchType,
                filterType: this.filterType,
                fetchOnlyNew: this.fetchOnlyNew,
                updateExisting: this.updateExisting
            };

            try {
                await this.plugin.fetchRaindrops(options);
                new Notice('Raindrops fetched successfully!');
                this.close();
            } catch (error) {
                new Notice(`Error fetching raindrops: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }

    private createInputField(
        container: HTMLElement,
        label: string,
        value: string,
        onChange: (value: string) => void
    ): void {
        const wrapper = container.createEl('div', { cls: 'setting-item' });
        wrapper.createEl('label', { text: label });
        const input = wrapper.createEl('input', {
            type: 'text',
            value
        });
        input.addEventListener('change', (e) => {
            onChange((e.target as HTMLInputElement).value);
        });
    }

    private createToggle(
        container: HTMLElement,
        label: string,
        value: boolean,
        onChange: (value: boolean) => void
    ): void {
        const wrapper = container.createEl('div', { cls: 'setting-item' });
        wrapper.createEl('label', { text: label });
        const toggle = wrapper.createEl('input', {
            type: 'checkbox',
            attr: { checked: value.toString() }
        });
        toggle.addEventListener('change', (e) => {
            onChange((e.target as HTMLInputElement).checked);
        });
    }

    private createSelect(
        container: HTMLElement,
        label: string,
        options: Array<{ value: string; text: string }>,
        value: string,
        onChange: (value: string) => void
    ): void {
        const wrapper = container.createEl('div', { cls: 'setting-item' });
        wrapper.createEl('label', { text: label });
        const select = wrapper.createEl('select');
        
        options.forEach(option => {
            const optionEl = select.createEl('option', {
                value: option.value,
                text: option.text
            });
            if (option.value === value) {
                optionEl.selected = true;
            }
        });

        select.addEventListener('change', (e) => {
            onChange((e.target as HTMLSelectElement).value);
        });
    }

    onClose(): void {
        const { contentEl } = this;
        contentEl.empty();
    }
} 