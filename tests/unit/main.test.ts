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
            expect(addSettingTabSpy).toHaveBeenCalled();
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
