/**
 * Jest Setup File
 * ================
 *
 * This file runs before all tests and sets up the testing environment.
 * It mocks the Obsidian API since tests run in Node.js, not in Obsidian.
 */

// Mock Obsidian API
global.window = global.window || {};

// Mock Notice class
class MockNotice {
    message: string;
    duration?: number;

    constructor(message: string, duration?: number) {
        this.message = message;
        this.duration = duration;
    }
}

// Mock Modal class
class MockModal {
    app: any;
    contentEl: HTMLElement;
    titleEl: HTMLElement;

    constructor(app: any) {
        this.app = app;
        this.contentEl = document.createElement('div');
        this.titleEl = document.createElement('div');
    }

    open() {
        // Mock implementation
    }

    close() {
        // Mock implementation
    }

    onOpen() {
        // Override in subclasses
    }

    onClose() {
        // Override in subclasses
    }
}

// Mock Plugin class
class MockPlugin {
    app: any;
    manifest: any;

    constructor(app: any, manifest: any) {
        this.app = app;
        this.manifest = manifest;
    }

    loadData() {
        return Promise.resolve({});
    }

    saveData(data: any) {
        return Promise.resolve();
    }

    addRibbonIcon(icon: string, title: string, callback: () => void) {
        return {
            remove: () => {}
        };
    }

    addCommand(command: any) {
        // Mock implementation
    }

    addSettingTab(tab: any) {
        // Mock implementation
    }

    registerEvent(event: any) {
        // Mock implementation
    }
}

// Mock PluginSettingTab class
class MockPluginSettingTab {
    app: any;
    plugin: any;
    containerEl: HTMLElement;

    constructor(app: any, plugin: any) {
        this.app = app;
        this.plugin = plugin;
        this.containerEl = document.createElement('div');
    }

    display() {
        // Override in subclasses
    }

    hide() {
        // Override in subclasses
    }
}

// Mock Setting class
class MockSetting {
    settingEl: HTMLElement;

    constructor(containerEl: HTMLElement) {
        this.settingEl = document.createElement('div');
        containerEl.appendChild(this.settingEl);
    }

    setName(name: string) {
        return this;
    }

    setDesc(desc: string) {
        return this;
    }

    setClass(cls: string) {
        return this;
    }

    addText(callback: (component: any) => void) {
        const component = {
            setValue: jest.fn().mockReturnThis(),
            setPlaceholder: jest.fn().mockReturnThis(),
            onChange: jest.fn().mockReturnThis(),
            inputEl: document.createElement('input')
        };
        callback(component);
        return this;
    }

    addTextArea(callback: (component: any) => void) {
        const component = {
            setValue: jest.fn().mockReturnThis(),
            setPlaceholder: jest.fn().mockReturnThis(),
            onChange: jest.fn().mockReturnThis(),
            inputEl: document.createElement('textarea')
        };
        callback(component);
        return this;
    }

    addToggle(callback: (component: any) => void) {
        const component = {
            setValue: jest.fn().mockReturnThis(),
            onChange: jest.fn().mockReturnThis()
        };
        callback(component);
        return this;
    }

    addButton(callback: (component: any) => void) {
        const component = {
            setButtonText: jest.fn().mockReturnThis(),
            setIcon: jest.fn().mockReturnThis(),
            setTooltip: jest.fn().mockReturnThis(),
            onClick: jest.fn().mockReturnThis(),
            setCta: jest.fn().mockReturnThis()
        };
        callback(component);
        return this;
    }

    addDropdown(callback: (component: any) => void) {
        const component = {
            addOption: jest.fn().mockReturnThis(),
            setValue: jest.fn().mockReturnThis(),
            onChange: jest.fn().mockReturnThis()
        };
        callback(component);
        return this;
    }
}

// Mock Vault
class MockVault {
    adapter: any;

    constructor() {
        this.adapter = {
            exists: jest.fn().mockResolvedValue(false),
            stat: jest.fn().mockResolvedValue({ type: 'folder' }),
            read: jest.fn().mockResolvedValue(''),
            write: jest.fn().mockResolvedValue(undefined),
            mkdir: jest.fn().mockResolvedValue(undefined)
        };
    }

    create(path: string, data: string) {
        return Promise.resolve({
            path,
            basename: path.split('/').pop(),
            extension: 'md',
            stat: { ctime: Date.now(), mtime: Date.now(), size: data.length }
        });
    }

    createFolder(path: string) {
        return Promise.resolve();
    }

    modify(file: any, data: string) {
        return Promise.resolve();
    }

    delete(file: any) {
        return Promise.resolve();
    }

    getAbstractFileByPath(path: string) {
        return null;
    }

    getMarkdownFiles() {
        return [];
    }
}

// Mock App
const mockApp = {
    vault: new MockVault(),
    workspace: {
        getActiveFile: jest.fn(),
        getLeaf: jest.fn(),
        getLeavesOfType: jest.fn().mockReturnValue([])
    },
    metadataCache: {
        getFileCache: jest.fn(),
        getCache: jest.fn()
    },
    fileManager: {
        processFrontMatter: jest.fn()
    }
};

// Mock request function
const mockRequest = jest.fn().mockResolvedValue('{"result": true}');

// Mock normalizePath function
const mockNormalizePath = jest.fn((path: string) => {
    return path.replace(/\\/g, '/').replace(/\/+/g, '/');
});

// Export mocks to global scope
(global as any).obsidian = {
    Notice: MockNotice,
    Modal: MockModal,
    Plugin: MockPlugin,
    PluginSettingTab: MockPluginSettingTab,
    Setting: MockSetting,
    request: mockRequest,
    normalizePath: mockNormalizePath,
    App: mockApp
};

// Make mocks available for imports
jest.mock('obsidian', () => ({
    Notice: MockNotice,
    Modal: MockModal,
    Plugin: MockPlugin,
    PluginSettingTab: MockPluginSettingTab,
    Setting: MockSetting,
    request: mockRequest,
    normalizePath: mockNormalizePath,
    App: jest.fn(() => mockApp)
}), { virtual: true });

// Export for use in tests
export {
    MockNotice,
    MockModal,
    MockPlugin,
    MockPluginSettingTab,
    MockSetting,
    MockVault,
    mockApp,
    mockRequest,
    mockNormalizePath
};
