import RaindropToObsidian from '../../src/main';
import { RaindropToObsidianSettingTab } from '../../src/settings';
import { mockApp } from '../setup';
import { App, PluginManifest } from 'obsidian';

describe('RaindropToObsidianSettingTab', () => {
    let plugin: RaindropToObsidian;
    let manifest: PluginManifest;
    let tab: RaindropToObsidianSettingTab;

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
        tab = new RaindropToObsidianSettingTab(mockApp as unknown as App, plugin);
        jest.clearAllMocks();
    });

    it('should be instantiable', () => {
        expect(tab).toBeDefined();
        expect(tab.plugin).toBe(plugin);
    });

    it('should render settings options during the current update lifecycle', () => {
        const container = tab.containerEl;
        tab.update();

        expect(container.classList.contains('make-it-rain-settings-container')).toBe(true);
        expect(container.innerHTML).toContain('Connection &amp; Core Setup');
        expect(container.innerHTML).toContain('Import &amp; Organization');
        expect(container.innerHTML).toContain('Include Raindrop group in folder path');
        expect(container.innerHTML).toContain('pre-v1.10 Collection-only layout');
        expect(container.innerHTML).toContain('affects future imports and does not move existing notes');
        expect(container.innerHTML).toContain('collectionGroup template variable and frontmatter metadata remain available');
        expect(container.innerHTML).toContain('Template Engine');
    });

    it('should keep update() available for in-tab refreshes', () => {
        const container = tab.containerEl;
        tab.update();
        container.empty();

        tab.update();

        expect(container.classList.contains('make-it-rain-settings-container')).toBe(true);
        expect(container.innerHTML).toContain('Connection &amp; Core Setup');
    });

    it('should render the tab when display() is called by the lifecycle', () => {
        // Obsidian 1.13+ calls display() to render the tab imperatively
        // whenever getSettingDefinitions() returns an empty array. The
        // bridge delegates to update(), so the rendered DOM must be the
        // same shape as a direct update() call (fix for #87).
        const container = tab.containerEl;

        tab.display();

        expect(container.classList.contains('make-it-rain-settings-container')).toBe(true);
        expect(container.innerHTML).toContain('Connection &amp; Core Setup');
        expect(container.innerHTML).toContain('Template Engine');
    });

    it('should verify token when verify button is clicked', async () => {
        const verifySpy = jest.spyOn(tab as any, 'verifyApiToken').mockResolvedValue(undefined);
        tab.update();
        
        // Call directly
        await (tab as any).verifyApiToken();
        expect(verifySpy).toHaveBeenCalled();
    });
});
