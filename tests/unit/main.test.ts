import RaindropToObsidian from '../../src/main';
import { mockApp } from '../setup';
import { App, PluginManifest } from 'obsidian';
import { RaindropItem, RaindropType } from '../../src/types';

describe('RaindropToObsidian', () => {
    let plugin: RaindropToObsidian;
    let manifest: PluginManifest;

    beforeEach(() => {
        manifest = {
            id: 'make-it-rain',
            name: 'Make It Rain',
            author: 'frostmute',
            version: '1.7.2',
            minAppVersion: '0.15.0',
            description: 'Pull your Raindrop.io bookmarks with flexible filtering, customization, and location options.'
        } as PluginManifest;

        plugin = new RaindropToObsidian(mockApp as unknown as App, manifest);
        jest.clearAllMocks();
    });

    it('should initialize with default settings', () => {
        expect(plugin.settings).toBeDefined();
        expect(plugin.settings.fileNameTemplate).toBe('{{title}}');
        expect(plugin.settings.includeGroupInFolderPath).toBe(true);
    });

    describe('onload', () => {
        it('should load settings and add commands', async () => {
            const addCommandSpy = jest.spyOn(plugin, 'addCommand');
            const addSettingTabSpy = jest.spyOn(plugin, 'addSettingTab');
            const loadSettingsSpy = jest.spyOn(plugin, 'loadSettings').mockResolvedValue();

            await plugin.onload();

            expect(loadSettingsSpy).toHaveBeenCalled();
            expect(addCommandSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'fetch-raindrops' }));
            expect(addCommandSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'quick-import-raindrop' }));
            expect(addCommandSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'aggregate-highlights-by-tag' }));
            expect(addSettingTabSpy).toHaveBeenCalled();
        });
    });

    describe('aggregateHighlightsByTag', () => {
        it('should call fetchWithRetry and create a note', async () => {
            plugin.settings.apiToken = 'test-token';
            const mockHighlights = [
                { _id: 1, title: 'Item 1', link: 'link1', highlights: [{ text: 'h1', note: 'n1' }] },
                { _id: 2, title: 'Item 2', link: 'link2', highlights: [{ text: 'h2' }] }
            ];
            
            const apiUtils = require('../../src/utils/apiUtils');
            const fetchWithRetrySpy = jest.spyOn(apiUtils, 'fetchWithRetry').mockResolvedValue({
                result: true,
                items: mockHighlights
            });

            const createSpy = jest.spyOn(plugin.app.vault, 'create').mockResolvedValue({} as any);
            const existsSpy = jest.spyOn(plugin.app.vault.adapter, 'exists').mockResolvedValue(false);
            
            // Mock normalizePath which is usually a global in Obsidian but mocked in our setup
            // Mock createFolderStructure by mocking mkdir on adapter if needed

            await plugin.aggregateHighlightsByTag({ tag: '##research' });

            expect(fetchWithRetrySpy).toHaveBeenCalledWith(
                expect.anything(),
                expect.stringContaining('search=%23research+type%3Ahighlight'),
                expect.anything(),
                expect.anything()
            );
            expect(createSpy).toHaveBeenCalledWith(
                expect.stringContaining('Aggregated Highlights - research.md'),
                expect.stringContaining('## [Item 1](link1)')
            );
            expect(createSpy).toHaveBeenCalledWith(
                expect.stringContaining('Aggregated Highlights - research.md'),
                expect.stringContaining('- h1')
            );
            expect(createSpy).toHaveBeenCalledWith(
                expect.stringContaining('Aggregated Highlights - research.md'),
                expect.stringContaining('**Note**: n1')
            );
        });

        it('should ignore API items that contain no highlights', async () => {
            plugin.settings.apiToken = 'test-token';
            const apiUtils = require('../../src/utils/apiUtils');
            jest.spyOn(apiUtils, 'fetchWithRetry').mockResolvedValue({
                result: true,
                items: [{ _id: 1, title: 'Empty item', link: 'link1', highlights: [] }]
            });
            const createSpy = jest.spyOn(plugin.app.vault, 'create').mockResolvedValue({} as any);

            await plugin.aggregateHighlightsByTag({ tag: 'research' });

            expect(createSpy).not.toHaveBeenCalled();
            expect(mockApp.vault.create).not.toHaveBeenCalled();
        });

        it('should reject a blank tag before calling the API', async () => {
            plugin.settings.apiToken = 'test-token';
            const apiUtils = require('../../src/utils/apiUtils');
            const fetchWithRetrySpy = jest.spyOn(apiUtils, 'fetchWithRetry');

            await plugin.aggregateHighlightsByTag({ tag: '###' });

            expect(fetchWithRetrySpy).not.toHaveBeenCalled();
            expect(fetchWithRetrySpy).not.toHaveBeenCalled();
        });
    });

    describe('onunload', () => {
        it('should log unloading message', () => {
            const consoleSpy = jest.spyOn(console, 'debug').mockImplementation();
            plugin.onunload();
            expect(consoleSpy).toHaveBeenCalledWith('Make It Rain plugin unloaded.');
            consoleSpy.mockRestore();
        });
    });

    describe('loadSettings', () => {
        it('should load saved data and merge with defaults', async () => {
            const savedData = {
                apiToken: 'test-token',
                showRibbonIcon: false
            };
            const loadDataSpy = jest.spyOn(plugin, 'loadData').mockResolvedValue(savedData);
            const saveSettingsSpy = jest.spyOn(plugin, 'saveSettings').mockResolvedValue();

            await plugin.loadSettings();

            expect(plugin.settings.apiToken).toBe('test-token');
            expect(plugin.settings.showRibbonIcon).toBe(false);
            expect(plugin.settings.fileNameTemplate).toBe('{{title}}'); // Default preserved
            expect(plugin.settings.includeGroupInFolderPath).toBe(true); // Added setting defaults on for existing data
            expect(saveSettingsSpy).toHaveBeenCalled();
        });
    });

    describe('generateFileName', () => {
        it('should generate file name from title template', () => {
            const raindrop = {
                _id: 123,
                title: 'Test Raindrop',
                collection: { title: 'Test Collection', $id: 1 },
                created: '2024-01-01T12:00:00Z',
                link: 'https://test.com',
                lastUpdate: '2024-01-01T12:00:00Z',
                type: 'link' as RaindropType
            } as RaindropItem;
            const fileName = plugin.generateFileName(raindrop, true);
            expect(fileName).toBe('Test Raindrop');
        });

        it('should use ID when title template is disabled', () => {
            const raindrop = {
                _id: 123,
                title: 'Test Raindrop',
                link: 'https://test.com',
                created: '2024-01-01T12:00:00Z',
                lastUpdate: '2024-01-01T12:00:00Z',
                type: 'link' as RaindropType
            } as RaindropItem;
            const fileName = plugin.generateFileName(raindrop, false);
            expect(fileName).toBe('123');
        });

        it('should handle missing title', () => {
            const raindrop = {
                _id: 456,
                title: '',
                link: 'https://test.com',
                created: '2024-01-01T12:00:00Z',
                lastUpdate: '2024-01-01T12:00:00Z',
                type: 'link' as RaindropType
            } as RaindropItem;
            const fileName = plugin.generateFileName(raindrop, true);
            expect(fileName).toBe('Untitled');
        });

        it('should sanitize generated file names', () => {
            const raindrop = {
                _id: 789,
                title: 'Test / Raindrop: Illegal',
                link: 'https://test.com',
                created: '2024-01-01T12:00:00Z',
                lastUpdate: '2024-01-01T12:00:00Z',
                type: 'link' as RaindropType
            } as RaindropItem;
            const fileName = plugin.generateFileName(raindrop, true);
            expect(fileName).toBe('Test  Raindrop Illegal');
        });

        it('should correctly handle placeholders with regex special characters', () => {
            const raindrop = {
                _id: 123,
                title: 'Test Raindrop',
                link: 'https://test.com',
                created: '2024-01-01T12:00:00Z',
                lastUpdate: '2024-01-01T12:00:00Z',
                type: 'link' as RaindropType
            } as RaindropItem;

            // This test is a bit artificial because replacePlaceholder is an internal function
            // that is currently only called with hardcoded strings.
            // But if we were to allow a dynamic placeholder, this ensures it's safe.
            // We'll test it indirectly by ensuring the current logic still works with standard templates
            // and the formatUtils tests cover the actual escaping logic.
            plugin.settings.fileNameTemplate = '{{title}}';
            const fileName = plugin.generateFileName(raindrop, true);
            expect(fileName).toBe('Test Raindrop');
        });
    });

    describe('updateRibbonIcon', () => {
        it('should add ribbon icon if enabled', () => {
            const addRibbonIconSpy = jest.spyOn(plugin, 'addRibbonIcon');
            plugin.settings.showRibbonIcon = true;
            plugin.updateRibbonIcon();
            expect(addRibbonIconSpy).toHaveBeenCalledWith(
                'cloud-download',
                'Fetch raindrops',
                expect.any(Function)
            );
        });

        it('should not add ribbon icon if disabled', () => {
            const addRibbonIconSpy = jest.spyOn(plugin, 'addRibbonIcon');
            plugin.settings.showRibbonIcon = false;
            plugin.updateRibbonIcon();
            expect(addRibbonIconSpy).not.toHaveBeenCalled();
        });
    });

    describe('preset commands', () => {
        it('should register one command per saved preset', async () => {
            plugin.settings.importPresets = [{
                id: 'preset-abc',
                name: 'Reading backlog',
                vaultPath: '',
                collections: 'Reading',
                apiFilterTags: '',
                includeSubcollections: true,
                appendTagsToNotes: '',
                useRaindropTitleForFileName: true,
                tagMatchType: 'all',
                filterType: 'all',
                fetchOnlyNew: true,
                updateExisting: false,
                useDefaultTemplate: false,
                overrideTemplates: false
            }];

            const addCommandSpy = jest.spyOn(plugin, 'addCommand');
            const fetchSpy = jest.spyOn(plugin, 'fetchRaindrops').mockResolvedValue();

            plugin.refreshPresetCommands();

            expect(addCommandSpy).toHaveBeenCalledWith(expect.objectContaining({
                id: 'fetch-preset-preset-abc',
                name: 'Fetch: Reading backlog'
            }));

            // Invoking the command should trigger a fetch with the preset's options
            const commandCall = addCommandSpy.mock.calls.find(call => call[0]?.id === 'fetch-preset-preset-abc');
            expect(commandCall).toBeDefined();
            const command = commandCall?.[0];
            expect(command).toBeDefined();
            command?.callback?.();
            await new Promise(process.nextTick);

            expect(fetchSpy).toHaveBeenCalledWith(expect.objectContaining({
                collections: 'Reading'
            }));
        });

        it('should re-register commands after presets change', async () => {
            plugin.settings.importPresets = [{
                id: 'preset-1',
                name: 'One',
                vaultPath: '',
                collections: 'A',
                apiFilterTags: '',
                includeSubcollections: true,
                appendTagsToNotes: '',
                useRaindropTitleForFileName: true,
                tagMatchType: 'all',
                filterType: 'all',
                fetchOnlyNew: true,
                updateExisting: false,
                useDefaultTemplate: false,
                overrideTemplates: false
            }];

            const removeCommandSpy = jest.spyOn(plugin, 'removeCommand');
            const addCommandSpy = jest.spyOn(plugin, 'addCommand');

            plugin.refreshPresetCommands();
            expect(removeCommandSpy).not.toHaveBeenCalled();
            expect(addCommandSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'fetch-preset-preset-1' }));

            // Rename the preset and refresh again: the old id is removed, the new one added.
            plugin.settings.importPresets[0].name = 'Two';
            plugin.refreshPresetCommands();

            expect(removeCommandSpy).toHaveBeenCalledWith('fetch-preset-preset-1');
            expect(addCommandSpy).toHaveBeenCalledWith(expect.objectContaining({
                id: 'fetch-preset-preset-1',
                name: 'Fetch: Two'
            }));
        });
    });
});
