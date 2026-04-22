import RaindropToObsidian from '../../src/main';
import { mockApp, mockRequest } from '../setup';
import { App, PluginManifest } from 'obsidian';

describe('Import Workflow Integration', () => {
    let plugin: RaindropToObsidian;
    let manifest: PluginManifest;

    beforeEach(() => {
        manifest = {
            id: 'make-it-rain',
            name: 'Make It Rain',
            author: 'frostmute',
            version: '1.8.0',
            minAppVersion: '0.15.0',
            description: 'Raindrop.io Integration'
        } as PluginManifest;

        plugin = new RaindropToObsidian(mockApp as unknown as App, manifest);
        plugin.settings.apiToken = 'valid-token';
        plugin.settings.defaultFolder = 'Raindrops';
        jest.clearAllMocks();
    });

    it('should complete a full import workflow', async () => {
        // 1. Mock API Responses
        (mockRequest as jest.Mock).mockImplementation((options) => {
            const url = options.url;
            if (url.endsWith('/collections') || url.endsWith('/collections/childrens')) {
                return Promise.resolve(JSON.stringify({
                    result: true,
                    items: url.endsWith('/collections') ? [{ _id: 123, title: 'Test Collection' }] : []
                }));
            }
            if (url.includes('/raindrops/')) {
                 return Promise.resolve(JSON.stringify({
                    result: true,
                    items: [{
                        _id: 1,
                        title: 'Test Raindrop',
                        link: 'https://example.com',
                        excerpt: 'Test excerpt',
                        tags: ['tag1', 'tag2'],
                        lastUpdate: '2024-01-01T12:00:00Z',
                        type: 'link'
                    }]
                }));
            }
            return Promise.resolve(JSON.stringify({ result: true }));
        });

        // 2. Mock Vault methods
        const createSpy = jest.spyOn(mockApp.vault, 'create');
        const existsSpy = jest.spyOn(mockApp.vault.adapter, 'exists').mockResolvedValue(false);

        // 3. Trigger Fetch
        await plugin.fetchRaindrops({
            collections: '', // Fetch all
            apiFilterTags: '',
            includeSubcollections: false,
            appendTagsToNotes: '',
            useRaindropTitleForFileName: true,
            tagMatchType: 'all',
            filterType: 'all',
            fetchOnlyNew: true,
            updateExisting: false,
            useDefaultTemplate: true,
            overrideTemplates: false
        });

        // 4. Verifications
        expect(mockRequest).toHaveBeenCalled();
        expect(createSpy).toHaveBeenCalled();
        
        // Check if the file was created with expected content
        const firstCall = createSpy.mock.calls[0];
        const path = firstCall[0];
        const content = firstCall[1];
        
        expect(path).toContain('Test Raindrop.md');
        expect(content).toContain('Test Raindrop');
        expect(content).toContain('https://example.com');
    });

    it('should handle template variables correctly in integration', async () => {
        plugin.settings.defaultTemplate = '# {{title}}\nLink: {{link}}\nNote: {{note}}';
        
        (mockRequest as jest.Mock).mockImplementation((options) => {
            const url = options.url;
            if (url.endsWith('/collections') || url.endsWith('/collections/childrens')) {
                return Promise.resolve(JSON.stringify({
                    result: true,
                    items: url.endsWith('/collections') ? [{ _id: 123, title: 'Test Collection' }] : []
                }));
            }
            if (url.includes('/raindrops/')) {
                 return Promise.resolve(JSON.stringify({
                    result: true,
                    items: [{
                        _id: 2,
                        title: 'Templated Raindrop',
                        link: 'https://templated.com',
                        note: 'My special note',
                        lastUpdate: '2024-01-01T12:00:00Z',
                        type: 'link'
                    }]
                }));
            }
            return Promise.resolve(JSON.stringify({ result: true, items: [] }));
        });

        const createSpy = jest.spyOn(mockApp.vault, 'create');

        await plugin.fetchRaindrops({
            collections: '',
            apiFilterTags: '',
            includeSubcollections: false,
            appendTagsToNotes: '',
            useRaindropTitleForFileName: true,
            tagMatchType: 'all',
            filterType: 'all',
            fetchOnlyNew: true,
            updateExisting: false,
            useDefaultTemplate: true,
            overrideTemplates: false
        });

        const content = createSpy.mock.calls[0][1];
        expect(content).toContain('# Templated Raindrop');
        expect(content).toContain('Link: https://templated.com');
        expect(content).toContain('Note: My special note');
    });

    it('should complete a quick import workflow', async () => {
        (mockRequest as jest.Mock).mockImplementation((options) => {
            if (options.url.includes('/raindrop/')) {
                 return Promise.resolve(JSON.stringify({
                    result: true,
                    item: {
                        _id: 999,
                        title: 'Quick Raindrop',
                        link: 'https://quick.com',
                        lastUpdate: '2024-01-01T12:00:00Z',
                        type: 'link'
                    }
                }));
            }
            return Promise.resolve(JSON.stringify({ result: true }));
        });

        const createSpy = jest.spyOn(mockApp.vault, 'create');

        await plugin.fetchSingleRaindrop(999, 'QuickImports', '#quick');

        expect(createSpy).toHaveBeenCalledWith(
            expect.stringContaining('QuickImports/Quick Raindrop.md'),
            expect.stringContaining('https://quick.com')
        );
        expect(createSpy).toHaveBeenCalledWith(
            expect.stringContaining('QuickImports/Quick Raindrop.md'),
            expect.stringContaining('#quick')
        );
    });
});
