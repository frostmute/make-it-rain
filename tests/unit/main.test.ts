import RaindropToObsidian from '../../src/main';
import { mockApp, MockNotice } from '../setup';
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
            description: 'Raindrop.io Integration'
        } as PluginManifest;

        plugin = new RaindropToObsidian(mockApp as unknown as App, manifest);
        jest.clearAllMocks();
    });

    it('should initialize with default settings', () => {
        expect(plugin.settings).toBeDefined();
        expect(plugin.settings.fileNameTemplate).toBe('{{title}}');
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

            await plugin.aggregateHighlightsByTag({ tag: 'research' });

            expect(fetchWithRetrySpy).toHaveBeenCalled();
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
    });

    describe('onunload', () => {
        it('should log unloading message', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
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
    });

    describe('updateRibbonIcon', () => {
        it('should add ribbon icon if enabled', () => {
            const addRibbonIconSpy = jest.spyOn(plugin, 'addRibbonIcon');
            plugin.settings.showRibbonIcon = true;
            plugin.updateRibbonIcon();
            expect(addRibbonIconSpy).toHaveBeenCalledWith(
                'cloud-download',
                'Fetch Raindrops',
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
});
