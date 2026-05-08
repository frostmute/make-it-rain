import RaindropToObsidian from '../../src/main';
import { mockApp, mockRequest } from '../setup';
import { App, PluginManifest } from 'obsidian';
import * as raindropData from '../mocks/raindropData';

describe('Edge Case Integration', () => {
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
        plugin.settings.apiToken = 'test-token';
        plugin.settings.defaultFolder = 'Raindrops';
        jest.clearAllMocks();
    });

    const runImportForMock = async (mockItem: any) => {
        (mockRequest as jest.Mock).mockImplementation((options) => {
            const url = options.url;
            if (url.endsWith('/collections') || url.endsWith('/collections/childrens')) {
                return Promise.resolve(JSON.stringify({
                    result: true,
                    items: [{ _id: 1000, title: 'Programming' }]
                }));
            }
            if (url.includes('/raindrops/')) {
                 return Promise.resolve(JSON.stringify({
                    result: true,
                    items: [mockItem]
                }));
            }
            return Promise.resolve(JSON.stringify({ result: true }));
        });

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
    };

    it('should handle broken URLs gracefully', async () => {
        const createSpy = jest.spyOn(mockApp.vault, 'create');
        await runImportForMock(raindropData.mockRaindropBrokenUrl);
        expect(createSpy).toHaveBeenCalled();
        const content = createSpy.mock.calls[0][1];
        expect(content).toContain('not-a-url');
    });

    it('should handle empty metadata by using defaults or empty strings', async () => {
        const createSpy = jest.spyOn(mockApp.vault, 'create');
        await runImportForMock(raindropData.mockRaindropEmptyMetadata);
        expect(createSpy).toHaveBeenCalled();
        // Since title is empty, it might use ID or a default if title is empty
        const path = createSpy.mock.calls[0][0];
        expect(path).toBeTruthy();
    });

    it('should handle massive descriptions without crashing', async () => {
        const createSpy = jest.spyOn(mockApp.vault, 'create');
        await runImportForMock(raindropData.mockRaindropMassiveDescription);
        expect(createSpy).toHaveBeenCalled();
        const content = createSpy.mock.calls[0][1];
        expect(content.length).toBeGreaterThan(20000);
    });

    it('should handle nested tags correctly', async () => {
        const createSpy = jest.spyOn(mockApp.vault, 'create');
        await runImportForMock(raindropData.mockRaindropNestedTags);
        expect(createSpy).toHaveBeenCalled();
        const content = createSpy.mock.calls[0][1];
        expect(content).toContain('parent/child');
        expect(content).toContain('level1/level2/level3');
    });

    it('should sanitize invalid filename characters', async () => {
        const createSpy = jest.spyOn(mockApp.vault, 'create');
        await runImportForMock(raindropData.mockRaindropInvalidTitle);
        expect(createSpy).toHaveBeenCalled();
        const path = createSpy.mock.calls[0][0];
        // The path should NOT contain invalid chars if sanitized
        const invalidChars = /[\\/:*?"<>|]/;
        const filename = path.split('/').pop();
        expect(filename).not.toMatch(invalidChars);
    });

    it('should handle missing collection field', async () => {
        const createSpy = jest.spyOn(mockApp.vault, 'create');
        await runImportForMock(raindropData.mockRaindropMissingCollection);
        expect(createSpy).toHaveBeenCalled();
    });

    it('should handle raindrops with no tags', async () => {
        const createSpy = jest.spyOn(mockApp.vault, 'create');
        await runImportForMock(raindropData.mockRaindropNoTags);
        expect(createSpy).toHaveBeenCalled();
    });

    it('should handle highlights gracefully (even if content rendering is limited)', async () => {
        const createSpy = jest.spyOn(mockApp.vault, 'create');
        await runImportForMock(raindropData.mockRaindropHighlightNoText);
        expect(createSpy).toHaveBeenCalled();
        const content = createSpy.mock.calls[0][1];
        expect(content).toContain('Highlight No Text');
    });

    it('should handle extremely long tags', async () => {
        const createSpy = jest.spyOn(mockApp.vault, 'create');
        await runImportForMock(raindropData.mockRaindropLongTags);
        expect(createSpy).toHaveBeenCalled();
        const content = createSpy.mock.calls[0][1];
        expect(content).toContain('T'.repeat(150));
    });

    it('should handle unicode and emojis correctly', async () => {
        const createSpy = jest.spyOn(mockApp.vault, 'create');
        await runImportForMock(raindropData.mockRaindropUnicode);
        expect(createSpy).toHaveBeenCalled();
        const content = createSpy.mock.calls[0][1];
        expect(content).toContain('🚀');
        expect(content).toContain('漢字');
    });
});
