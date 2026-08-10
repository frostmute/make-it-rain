import RaindropToObsidian from '../../src/main';
import { RaindropFetchModal, SavePresetModal } from '../../src/modals';
import { RaindropToObsidianSettingTab } from '../../src/settings';
import { mockApp, mockRequest, MockSetting } from '../setup';
import { App, PluginManifest } from 'obsidian';

/**
 * End-to-end coverage of the saved-preset workflow: save one from the fetch
 * modal, run the generated command-palette entry, then rename and delete it
 * from the settings tab.
 */
describe('Import Preset Workflow Integration', () => {
    let plugin: RaindropToObsidian;
    let openedNameModals: SavePresetModal[];
    let openSpy: jest.SpyInstance;

    const manifest = {
        id: 'make-it-rain',
        name: 'Make It Rain',
        author: 'frostmute',
        version: '2.1.1',
        minAppVersion: '1.13.0',
        description: 'Raindrop.io Integration'
    } as PluginManifest;

    /** Click a button by its label inside a rendered container. */
    const clickButton = (container: HTMLElement, label: string): void => {
        const button = Array.from(container.querySelectorAll('button'))
            .find(candidate => candidate.textContent === label);
        expect(button).toBeDefined();
        button!.click();
    };

    /** Type a name into the most recently opened name dialog and save it. */
    const submitName = async (name: string): Promise<SavePresetModal> => {
        const nameModal = openedNameModals[openedNameModals.length - 1];
        expect(nameModal).toBeDefined();
        (nameModal.contentEl.querySelector('input') as HTMLInputElement).value = name;
        clickButton(nameModal.contentEl, 'Save');
        await new Promise(process.nextTick);
        return nameModal;
    };

    beforeEach(() => {
        plugin = new RaindropToObsidian(mockApp as unknown as App, manifest);
        plugin.settings.apiToken = 'valid-token';
        plugin.settings.defaultFolder = 'Raindrops';
        plugin.settings.importPresets = [];
        jest.clearAllMocks();
        jest.spyOn(plugin, 'fetchAllUserCollections').mockResolvedValue([]);
        jest.spyOn(plugin, 'saveData').mockResolvedValue(undefined);

        // The Obsidian Modal mock's open() is a no-op; render the name dialog
        // so tests can drive it like a user would.
        openedNameModals = [];
        openSpy = jest.spyOn(SavePresetModal.prototype, 'open')
            .mockImplementation(function (this: SavePresetModal) {
                openedNameModals.push(this);
                this.onOpen();
            });
    });

    afterEach(() => {
        openSpy.mockRestore();
    });

    it('should save a preset from the modal and import through its command-palette entry', async () => {
        const addCommandSpy = jest.spyOn(plugin, 'addCommand');

        const modal = new RaindropFetchModal(mockApp as unknown as App, plugin);
        modal.onOpen();
        modal.collections = '';
        modal.apiFilterTags = 'css';
        modal.vaultPath = 'Imports/Reading';
        modal.useDefaultTemplate = true;

        clickButton(modal.contentEl, 'Save current as preset');
        await submitName('Reading backlog');

        expect(plugin.settings.importPresets).toHaveLength(1);
        const [saved] = plugin.settings.importPresets;
        expect(saved.name).toBe('Reading backlog');
        expect(saved.apiFilterTags).toBe('css');
        expect(saved.vaultPath).toBe('Imports/Reading');
        expect(modal.selectedPresetId).toBe(saved.id);

        const commandCall = addCommandSpy.mock.calls
            .find(call => (call[0] as { id: string }).id === `fetch-preset-${saved.id}`);
        expect(commandCall).toBeDefined();

        (mockRequest as jest.Mock).mockImplementation((options: { url: string }) => {
            if (options.url.endsWith('/collections') || options.url.endsWith('/collections/childrens')) {
                return Promise.resolve(JSON.stringify({
                    result: true,
                    items: options.url.endsWith('/collections') ? [{ _id: 123, title: 'Reading' }] : []
                }));
            }
            if (options.url.includes('/raindrops/')) {
                return Promise.resolve(JSON.stringify({
                    result: true,
                    items: [{
                        _id: 42,
                        title: 'Preset Raindrop',
                        link: 'https://example.com',
                        tags: ['css'],
                        lastUpdate: '2024-01-01T12:00:00Z',
                        type: 'link'
                    }]
                }));
            }
            return Promise.resolve(JSON.stringify({ result: true, items: [] }));
        });
        const createSpy = jest.spyOn(mockApp.vault, 'create');
        jest.spyOn(mockApp.vault.adapter, 'exists').mockResolvedValue(false);
        (plugin.fetchAllUserCollections as jest.Mock).mockRestore();

        const fetchSpy = jest.spyOn(plugin, 'fetchRaindrops');
        (commandCall![0] as { callback?: () => void }).callback?.();
        await fetchSpy.mock.results[0].value;

        expect(fetchSpy).toHaveBeenCalledWith(expect.objectContaining({
            apiFilterTags: 'css',
            vaultPath: 'Imports/Reading'
        }));
        expect(createSpy).toHaveBeenCalled();
        expect(createSpy.mock.calls[0][0]).toContain('Preset Raindrop.md');
    });

    it('should restore defaults when the preset selection is cleared in the modal', () => {
        plugin.settings.importPresets = [{
            id: 'preset-1',
            name: 'Reading backlog',
            vaultPath: 'Imports/Reading',
            collections: 'Reading',
            apiFilterTags: 'css',
            includeSubcollections: false,
            appendTagsToNotes: '#imported',
            useRaindropTitleForFileName: false,
            tagMatchType: 'any',
            filterType: 'article',
            fetchOnlyNew: false,
            updateExisting: true,
            useDefaultTemplate: false,
            overrideTemplates: true
        }];

        const addDropdownSpy = jest.spyOn(MockSetting.prototype, 'addDropdown');
        const modal = new RaindropFetchModal(mockApp as unknown as App, plugin);
        modal.onOpen();

        // Replay the preset dropdown's callback with a stub component so the
        // real onChange handler can be exercised.
        const handlers: ((value: string) => void)[] = [];
        const stub: Record<string, unknown> = {};
        stub.addOption = () => stub;
        stub.setValue = () => stub;
        stub.onChange = (handler: (value: string) => void) => {
            handlers.push(handler);
            return stub;
        };
        (addDropdownSpy.mock.calls[0][0] as (component: unknown) => void)(stub);
        const onChange = handlers[0];
        addDropdownSpy.mockRestore();

        onChange('preset-1');
        expect(modal.selectedPresetId).toBe('preset-1');
        expect(modal.collections).toBe('Reading');
        expect(modal.filterType).toBe('article');

        onChange('');
        expect(modal.selectedPresetId).toBe('');
        expect(modal.collections).toBe('');
        expect(modal.apiFilterTags).toBe('');
        expect(modal.filterType).toBe('all');
        expect(modal.vaultPath).toBe('Raindrops');
        expect(modal.updateExisting).toBe(false);
    });

    it('should rename and delete a preset from the settings tab, keeping commands in sync', async () => {
        plugin.settings.importPresets = [{
            id: 'preset-1',
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
        const removeCommandSpy = jest.spyOn(plugin, 'removeCommand');
        plugin.refreshPresetCommands();

        const tab = new RaindropToObsidianSettingTab(mockApp as unknown as App, plugin);
        const container = document.createElement('div');
        tab.renderImportPresets(container);
        expect(container.textContent).toContain('Reading backlog');
        expect(container.textContent).toContain('Collections: Reading');

        addCommandSpy.mockClear();
        clickButton(container, 'Rename');
        await submitName('Weekly reading');

        expect(plugin.settings.importPresets[0].name).toBe('Weekly reading');
        expect(plugin.settings.importPresets[0].id).toBe('preset-1');
        expect(addCommandSpy).toHaveBeenCalledWith(expect.objectContaining({
            id: 'fetch-preset-preset-1',
            name: 'Fetch: Weekly reading'
        }));
        expect(container.textContent).toContain('Weekly reading');

        clickButton(container, 'Delete');
        await new Promise(process.nextTick);

        expect(plugin.settings.importPresets).toHaveLength(0);
        expect(removeCommandSpy).toHaveBeenCalledWith('fetch-preset-preset-1');
        expect(container.textContent).toContain('No saved presets yet');
    });

    it('should keep the rename dialog open and surface the error on a duplicate name', async () => {
        plugin.settings.importPresets = [
            {
                id: 'preset-1', name: 'One', vaultPath: '', collections: '', apiFilterTags: '',
                includeSubcollections: true, appendTagsToNotes: '', useRaindropTitleForFileName: true,
                tagMatchType: 'all', filterType: 'all', fetchOnlyNew: true, updateExisting: false,
                useDefaultTemplate: false, overrideTemplates: false
            },
            {
                id: 'preset-2', name: 'Two', vaultPath: '', collections: '', apiFilterTags: '',
                includeSubcollections: true, appendTagsToNotes: '', useRaindropTitleForFileName: true,
                tagMatchType: 'all', filterType: 'all', fetchOnlyNew: true, updateExisting: false,
                useDefaultTemplate: false, overrideTemplates: false
            }
        ];

        const tab = new RaindropToObsidianSettingTab(mockApp as unknown as App, plugin);
        const container = document.createElement('div');
        tab.renderImportPresets(container);

        const renameButtons = Array.from(container.querySelectorAll('button'))
            .filter(button => button.textContent === 'Rename');
        renameButtons[1].click();

        const closeSpy = jest.spyOn(openedNameModals[openedNameModals.length - 1] ?? SavePresetModal.prototype, 'close');
        jest.spyOn(console, 'error').mockImplementation(() => undefined);
        const nameModal = await submitName('One');

        expect(closeSpy).not.toHaveBeenCalled();
        expect(nameModal.contentEl.textContent).toContain('A preset named "One" already exists.');
        expect(plugin.settings.importPresets[1].name).toBe('Two');
    });
});
