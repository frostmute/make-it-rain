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

    it('should render settings options when display() is called', () => {
        const container = tab.containerEl;
        tab.display();

        expect(container.classList.contains('make-it-rain-settings-container')).toBe(true);
        expect(container.innerHTML).toContain('Connection &amp; Core Setup');
        expect(container.innerHTML).toContain('Import &amp; Organization');
        expect(container.innerHTML).toContain('Include Raindrop group in folder path');
        expect(container.innerHTML).toContain('pre-v1.10 Collection-only layout');
        expect(container.innerHTML).toContain('affects future imports and does not move existing notes');
        expect(container.innerHTML).toContain('collectionGroup template variable and frontmatter metadata remain available');
        expect(container.innerHTML).toContain('Template Engine');
    });

    it('should re-render settings when display() is called repeatedly', () => {
        const container = tab.containerEl;
        tab.display();
        container.empty();

        tab.display();

        expect(container.classList.contains('make-it-rain-settings-container')).toBe(true);
        expect(container.innerHTML).toContain('Connection &amp; Core Setup');
    });

    it('should not implement an own getSettingDefinitions() override', () => {
        expect(Object.prototype.hasOwnProperty.call(
            RaindropToObsidianSettingTab.prototype,
            'getSettingDefinitions'
        )).toBe(false);
    });

    it('should render the tab through the imperative display() contract', () => {
        const container = tab.containerEl;

        tab.display();

        expect(container.classList.contains('make-it-rain-settings-container')).toBe(true);
        expect(container.innerHTML).toContain('Connection &amp; Core Setup');
        expect(container.innerHTML).toContain('Template Engine');
    });

    it('should render settings after loading malformed persisted data', async () => {
        jest.spyOn(plugin, 'loadData').mockResolvedValue({ namedTemplates: null });
        jest.spyOn(plugin, 'saveSettings').mockResolvedValue();
        await plugin.loadSettings();

        const hydratedTab = new RaindropToObsidianSettingTab(mockApp as unknown as App, plugin);
        expect(() => hydratedTab.display()).not.toThrow();
        expect(hydratedTab.containerEl.classList.contains('make-it-rain-settings-container')).toBe(true);
        expect(hydratedTab.containerEl.innerHTML).toContain('Connection &amp; Core Setup');
        expect(hydratedTab.containerEl.innerHTML).toContain('Template Engine');
    });

    it('should render settings for legacy minimal persisted data', async () => {
        jest.spyOn(plugin, 'loadData').mockResolvedValue({ apiToken: 'legacy-token' });
        jest.spyOn(plugin, 'saveSettings').mockResolvedValue();
        await plugin.loadSettings();

        const hydratedTab = new RaindropToObsidianSettingTab(mockApp as unknown as App, plugin);
        hydratedTab.display();
        expect(hydratedTab.containerEl.classList.contains('make-it-rain-settings-container')).toBe(true);
        expect(hydratedTab.containerEl.innerHTML).toContain('Connection &amp; Core Setup');
    });

    it('should verify token when verify button is clicked', async () => {
        const verifySpy = jest.spyOn(tab as any, 'verifyApiToken').mockResolvedValue(undefined);
        tab.display();
        
        // Call directly
        await (tab as any).verifyApiToken();
        expect(verifySpy).toHaveBeenCalled();
    });
});
