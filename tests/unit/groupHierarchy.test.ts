
import RaindropToObsidian from '../../src/main';
import { mockApp } from '../setup';
import { App, PluginManifest, Notice } from 'obsidian';
import { RaindropItem, RaindropCollection, RaindropGroup, ModalFetchOptions } from '../../src/types';

describe('Group Hierarchy Support', () => {
    let plugin: RaindropToObsidian;
    let manifest: PluginManifest;

    beforeEach(() => {
        manifest = {
            id: 'make-it-rain',
            name: 'Make It Rain',
            author: 'frostmute',
            version: '1.9.0',
            minAppVersion: '0.15.0',
            description: 'Test'
        } as PluginManifest;

        plugin = new RaindropToObsidian(mockApp as unknown as App, manifest);
        jest.clearAllMocks();
    });

    it('should prepend Group name to collection path and target folder', async () => {
        // Mock data
        const collections: RaindropCollection[] = [
            { _id: 10, title: 'Parent Collection' },
            { _id: 20, title: 'Child Collection', parent: { $id: 10 } }
        ];

        const groups: RaindropGroup[] = [
            { title: 'MY GROUP', collections: [10] }
        ];

        const raindrop: RaindropItem = {
            _id: 123,
            title: 'Test Bookmark',
            link: 'https://example.com',
            type: 'link',
            collection: { $id: 20, title: 'Child Collection' },
            created: '2024-01-01T00:00:00Z',
            lastUpdate: '2024-01-01T00:00:00Z'
        };

        const options: ModalFetchOptions = {
            collections: '20',
            apiFilterTags: '',
            includeSubcollections: false,
            appendTagsToNotes: '',
            useRaindropTitleForFileName: true,
            tagMatchType: 'all',
            filterType: 'all',
            fetchOnlyNew: false,
            updateExisting: true,
            useDefaultTemplate: false,
            overrideTemplates: false
        };

        const collectionIdToNameMap = new Map<number, string>();
        collections.forEach(c => collectionIdToNameMap.set(c._id, c.title));

        const collectionToGroupMap = new Map<number, string>();
        groups.forEach(g => {
            g.collections.forEach(id => collectionToGroupMap.set(id, g.title));
        });

        const collectionsData = { result: true, items: collections };

        // Mock Notice
        const mockNotice = { setMessage: jest.fn(), hide: jest.fn() } as unknown as Notice;

        // Mock Vault adapter
        const createFolderSpy = jest.spyOn(plugin.app.vault, 'createFolder').mockResolvedValue({} as any);
        const existsSpy = jest.spyOn(plugin.app.vault.adapter, 'exists').mockResolvedValue(false);
        const createSpy = jest.spyOn(plugin.app.vault, 'create').mockResolvedValue({} as any);

        // Execute
        await plugin.processRaindrops(
            [raindrop],
            'Raindrops',
            '',
            true,
            mockNotice,
            options,
            collectionsData,
            collectionIdToNameMap,
            new Set<string>(),
            collectionToGroupMap
        );

        // Assertions
        // Path segments should be: MY GROUP / Parent Collection / Child Collection
        const expectedPath = 'Raindrops/MY GROUP/Parent Collection/Child Collection';
        
        expect(createFolderSpy).toHaveBeenCalledWith(expect.stringContaining('MY GROUP'));
        expect(createFolderSpy).toHaveBeenCalledWith(expect.stringContaining('Parent Collection'));
        expect(createFolderSpy).toHaveBeenCalledWith(expect.stringContaining('Child Collection'));
        
        expect(createSpy).toHaveBeenCalledWith(
            expect.stringContaining('MY GROUP/Parent Collection/Child Collection/Test Bookmark.md'),
            expect.stringContaining('collectionGroup: "MY GROUP"')
        );
        
        expect(createSpy).toHaveBeenCalledWith(
            expect.stringContaining('MY GROUP/Parent Collection/Child Collection/Test Bookmark.md'),
            expect.stringContaining('collectionPath: "MY GROUP/Parent Collection/Child Collection"')
        );
    });

    it('should include collectionGroup in manual frontmatter when templates are disabled', async () => {
        plugin.settings.isTemplateSystemEnabled = false;

        const collections: RaindropCollection[] = [
            { _id: 10, title: 'Parent Collection' }
        ];

        const groups: RaindropGroup[] = [
            { title: 'MY GROUP', collections: [10] }
        ];

        const raindrop: RaindropItem = {
            _id: 123,
            title: 'Test Bookmark',
            link: 'https://example.com',
            type: 'link',
            collection: { $id: 10, title: 'Parent Collection' },
            created: '2024-01-01T00:00:00Z',
            lastUpdate: '2024-01-01T00:00:00Z'
        };

        const options: ModalFetchOptions = {
            collections: '10',
            apiFilterTags: '',
            includeSubcollections: false,
            appendTagsToNotes: '',
            useRaindropTitleForFileName: true,
            tagMatchType: 'all',
            filterType: 'all',
            fetchOnlyNew: false,
            updateExisting: true,
            useDefaultTemplate: false,
            overrideTemplates: false
        };

        const collectionIdToNameMap = new Map<number, string>();
        collections.forEach(c => collectionIdToNameMap.set(c._id, c.title));

        const collectionToGroupMap = new Map<number, string>();
        groups.forEach(g => {
            g.collections.forEach(id => collectionToGroupMap.set(id, g.title));
        });

        const collectionsData = { result: true, items: collections };
        const mockNotice = { setMessage: jest.fn(), hide: jest.fn() } as unknown as Notice;

        const createSpy = jest.spyOn(plugin.app.vault, 'create').mockResolvedValue({} as any);

        await plugin.processRaindrops(
            [raindrop],
            'Raindrops',
            '',
            true,
            mockNotice,
            options,
            collectionsData,
            collectionIdToNameMap,
            new Set<string>(),
            collectionToGroupMap
        );

        expect(createSpy).toHaveBeenCalledWith(
            expect.stringContaining('MY GROUP/Parent Collection/Test Bookmark.md'),
            expect.stringContaining('collectionGroup: "MY GROUP"')
        );
    });
});
