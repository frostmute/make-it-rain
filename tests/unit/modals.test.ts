import RaindropToObsidian from '../../src/main';
import { RaindropFetchModal, QuickImportModal, VariableBrowserModal, SavePresetModal, upsertPreset, importPresetToOptions, normalizeImportPresets } from '../../src/modals';
import { mockApp } from '../setup';
import { App, PluginManifest } from 'obsidian';
import { ImportPreset, ImportPresetFields } from '../../src/types';

describe('Modals', () => {
    let plugin: RaindropToObsidian;
    let manifest: PluginManifest;

    beforeEach(() => {
        manifest = {
            id: 'make-it-rain',
            name: 'Make It Rain',
            author: 'frostmute',
            version: '1.9.2',
            minAppVersion: '0.15.0',
            description: 'Pull your Raindrop.io bookmarks.'
        } as PluginManifest;

        plugin = new RaindropToObsidian(mockApp as unknown as App, manifest);
        jest.clearAllMocks();
    });

    describe('RaindropFetchModal', () => {
        it('should be instantiable and open/render fields', async () => {
            // Mock fetchAllUserCollections to return empty list quickly
            jest.spyOn(plugin, 'fetchAllUserCollections').mockResolvedValue([]);
            
            const modal = new RaindropFetchModal(mockApp as unknown as App, plugin);
            expect(modal).toBeDefined();

            modal.onOpen();
            expect(modal.contentEl.classList.contains('make-it-rain-modal')).toBe(true);
            expect(modal.contentEl.innerHTML).toContain('Bulk Import Raindrops');
            expect(modal.contentEl.innerHTML).toContain('Collections filter (Text)');
            
            // Wait for promise microtasks to settle
            await new Promise(process.nextTick);
            expect(modal.contentEl.innerHTML).toContain('No collections found or API token invalid.');
        });
    });

    describe('QuickImportModal', () => {
        it('should be instantiable and render options', () => {
            const modal = new QuickImportModal(mockApp as unknown as App, plugin);
            expect(modal).toBeDefined();

            modal.onOpen();
            expect(modal.contentEl.classList.contains('make-it-rain-modal')).toBe(true);
            expect(modal.contentEl.innerHTML).toContain('Quick Import');
            expect(modal.contentEl.innerHTML).toContain('Item URL or ID');
        });
    });

    describe('VariableBrowserModal', () => {
        it('should be instantiable and render the list of variables', () => {
            const modal = new VariableBrowserModal(mockApp as unknown as App);
            expect(modal).toBeDefined();

            modal.onOpen();
            expect(modal.contentEl.innerHTML).toContain('Variable Browser');
            expect(modal.contentEl.innerHTML).toContain('{{title}}');
            expect(modal.contentEl.innerHTML).toContain('{{excerpt}}');
        });
    });

    describe('RaindropFetchModal presets', () => {
        const preset: ImportPreset = {
            id: 'preset-1',
            name: 'Reading backlog',
            vaultPath: 'Inbox/Reading',
            collections: 'Reading',
            apiFilterTags: 'css, typescript',
            includeSubcollections: false,
            appendTagsToNotes: '#imported',
            useRaindropTitleForFileName: true,
            tagMatchType: 'any',
            filterType: 'article',
            fetchOnlyNew: false,
            updateExisting: true,
            useDefaultTemplate: false,
            overrideTemplates: true
        };

        it('should render the preset section listing saved presets', () => {
            plugin.settings.importPresets = [preset];
            jest.spyOn(plugin, 'fetchAllUserCollections').mockResolvedValue([]);

            const modal = new RaindropFetchModal(mockApp as unknown as App, plugin);
            modal.onOpen();

            expect(modal.contentEl.innerHTML).toContain('Import preset');
            expect(modal.contentEl.innerHTML).toContain('Save current as preset');
        });

        it('should apply a preset to all modal fields', () => {
            plugin.settings.importPresets = [preset];
            jest.spyOn(plugin, 'fetchAllUserCollections').mockResolvedValue([]);

            const modal = new RaindropFetchModal(mockApp as unknown as App, plugin);
            (modal as unknown as { applyPreset(p: ImportPreset): void }).applyPreset(preset);

            expect(modal.vaultPath).toBe('Inbox/Reading');
            expect(modal.collections).toBe('Reading');
            expect(modal.apiFilterTags).toBe('css, typescript');
            expect(modal.includeSubcollections).toBe(false);
            expect(modal.appendTagsToNotes).toBe('#imported');
            expect(modal.tagMatchType).toBe('any');
            expect(modal.filterType).toBe('article');
            expect(modal.fetchOnlyNew).toBe(false);
            expect(modal.updateExisting).toBe(true);
            expect(modal.useDefaultTemplate).toBe(false);
            expect(modal.overrideTemplates).toBe(true);
        });

        it('should restore defaults when the preset selection is cleared', () => {
            plugin.settings.importPresets = [preset];
            plugin.settings.defaultFolder = 'Raindrops';
            jest.spyOn(plugin, 'fetchAllUserCollections').mockResolvedValue([]);

            const modal = new RaindropFetchModal(mockApp as unknown as App, plugin);
            (modal as unknown as { applyPreset(p: ImportPreset): void }).applyPreset(preset);
            modal.selectedPresetId = preset.id;

            modal.resetToDefaults();
            modal.selectedPresetId = '';

            expect(modal.vaultPath).toBe('Raindrops');
            expect(modal.collections).toBe('');
            expect(modal.apiFilterTags).toBe('');
            expect(modal.includeSubcollections).toBe(true);
            expect(modal.appendTagsToNotes).toBe('');
            expect(modal.useRaindropTitleForFileName).toBe(true);
            expect(modal.tagMatchType).toBe('all');
            expect(modal.filterType).toBe('all');
            expect(modal.fetchOnlyNew).toBe(true);
            expect(modal.updateExisting).toBe(false);
            expect(modal.useDefaultTemplate).toBe(false);
            expect(modal.overrideTemplates).toBe(false);
        });

        it('should snapshot current fields into preset payload and fetch options', () => {
            jest.spyOn(plugin, 'fetchAllUserCollections').mockResolvedValue([]);

            const modal = new RaindropFetchModal(mockApp as unknown as App, plugin);
            modal.vaultPath = 'Books';
            modal.collections = 'Tech';
            modal.apiFilterTags = 'react';
            modal.includeSubcollections = false;
            modal.appendTagsToNotes = '#dev';
            modal.useRaindropTitleForFileName = false;
            modal.tagMatchType = 'any';
            modal.filterType = 'video';
            modal.fetchOnlyNew = false;
            modal.updateExisting = true;
            modal.useDefaultTemplate = true;
            modal.overrideTemplates = false;

            const fields = (modal as unknown as { toPresetFields(): ImportPresetFields }).toPresetFields();
            expect(fields.collections).toBe('Tech');
            expect(fields.tagMatchType).toBe('any');
            expect(fields.filterType).toBe('video');
            expect(fields.updateExisting).toBe(true);

            const options = (modal as unknown as { getFetchOptions(): ReturnType<typeof importPresetToOptions> }).getFetchOptions();
            expect(options).toEqual(importPresetToOptions(fields));
            expect(options.vaultPath).toBe('Books');
            expect(options.collections).toBe('Tech');
        });
    });

    describe('SavePresetModal', () => {
        it('should submit the entered name', async () => {
            const onSubmit = jest.fn().mockResolvedValue(undefined);
            const modal = new SavePresetModal(mockApp as unknown as App, plugin, '', onSubmit);
            modal.onOpen();

            expect(modal.contentEl.innerHTML).toContain('Save import preset');
            const input = modal.contentEl.querySelector('input');
            expect(input).not.toBeNull();
            (input as HTMLInputElement).value = 'Reading backlog';

            const saveButton = Array.from(modal.contentEl.querySelectorAll('button'))
                .find(button => button.textContent === 'Save');
            expect(saveButton).toBeDefined();
            saveButton!.click();

            await new Promise(process.nextTick);
            expect(onSubmit).toHaveBeenCalledWith('Reading backlog');
        });

        it('should not submit an empty name', async () => {
            const onSubmit = jest.fn();
            const modal = new SavePresetModal(mockApp as unknown as App, plugin, '', onSubmit);
            modal.onOpen();

            const saveButton = Array.from(modal.contentEl.querySelectorAll('button'))
                .find(button => button.textContent === 'Save');
            saveButton!.click();

            await new Promise(process.nextTick);
            expect(onSubmit).not.toHaveBeenCalled();
        });
    });

    describe('preset helpers', () => {
        const fields: ImportPresetFields = {
            vaultPath: '',
            collections: 'Reading',
            apiFilterTags: 'css',
            includeSubcollections: true,
            appendTagsToNotes: '',
            useRaindropTitleForFileName: true,
            tagMatchType: 'all',
            filterType: 'all',
            fetchOnlyNew: true,
            updateExisting: false,
            useDefaultTemplate: false,
            overrideTemplates: false
        };

        it('upsertPreset should create then update by name, keeping the id', () => {
            let presets: ImportPreset[] = [];
            const created = upsertPreset(presets, 'Weekly', fields);
            presets = created.presets;

            expect(created.created).toBe(true);
            expect(presets).toHaveLength(1);
            expect(presets[0].name).toBe('Weekly');
            expect(presets[0].id).toMatch(/^preset-/);

            const updated = upsertPreset(presets, 'Weekly', { ...fields, collections: 'Archive' });
            expect(updated.created).toBe(false);
            expect(updated.presets).toHaveLength(1);
            expect(updated.preset.id).toBe(presets[0].id);
            expect(updated.preset.collections).toBe('Archive');
        });

        it('importPresetToOptions should map every preset field', () => {
            const options = importPresetToOptions(fields);
            expect(options.collections).toBe('Reading');
            expect(options.apiFilterTags).toBe('css');
            expect(options.includeSubcollections).toBe(true);
            expect(options.tagMatchType).toBe('all');
            expect(options.filterType).toBe('all');
            expect(options.fetchOnlyNew).toBe(true);
            expect(options.updateExisting).toBe(false);
            expect(options.useDefaultTemplate).toBe(false);
            expect(options.overrideTemplates).toBe(false);
            expect(options.vaultPath).toBe('');
            expect(options.appendTagsToNotes).toBe('');
            expect(options.useRaindropTitleForFileName).toBe(true);
        });

        it('normalizeImportPresets should coerce malformed records and drop unusable ones', () => {
            const normalized = normalizeImportPresets([
                null,
                'not-a-preset',
                { name: 'No id' },
                { id: 'p-1' },
                {
                    id: 'p-2',
                    name: 'Partial',
                    collections: 42,
                    tagMatchType: 'weird',
                    filterType: 'nonsense',
                    updateExisting: 'yes'
                }
            ]);

            expect(normalized).toHaveLength(1);
            const [preset] = normalized;
            expect(preset.id).toBe('p-2');
            expect(preset.collections).toBe('');
            expect(preset.apiFilterTags).toBe('');
            expect(preset.vaultPath).toBe('');
            expect(preset.tagMatchType).toBe('all');
            expect(preset.filterType).toBe('all');
            expect(preset.updateExisting).toBe(false);
            expect(preset.includeSubcollections).toBe(true);
            expect(preset.fetchOnlyNew).toBe(true);
        });

        it('normalizeImportPresets should return an empty list for non-array data', () => {
            expect(normalizeImportPresets(undefined)).toEqual([]);
            expect(normalizeImportPresets({ nope: true })).toEqual([]);
        });

        it('normalizeImportPresets should preserve valid records', () => {
            const valid: ImportPreset = { id: 'p-1', name: 'Weekly', ...fields, filterType: 'article', tagMatchType: 'any' };
            expect(normalizeImportPresets([valid])).toEqual([valid]);
        });
    });
});
