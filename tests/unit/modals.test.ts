import RaindropToObsidian from '../../src/main';
import { RaindropFetchModal, QuickImportModal, VariableBrowserModal } from '../../src/modals';
import { mockApp } from '../setup';
import { App, PluginManifest } from 'obsidian';

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
});
