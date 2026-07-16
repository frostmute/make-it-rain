/**
 * Jest Setup File
 * ================
 *
 * This file runs before all tests and sets up the testing environment.
 * It mocks the Obsidian API since tests run in Node.js, not in Obsidian.
 */

// Mock Obsidian API
global.window = global.window || {};

// Extend HTMLElement prototype for JSDOM
const proto = HTMLElement.prototype as any;
if (!proto.empty) {
    proto.empty = function() {
        this.innerHTML = '';
        return this;
    };
}
if (!proto.addClass) {
    proto.addClass = function(...classes: string[]) {
        this.classList.add(...classes);
        return this;
    };
}
if (!proto.removeClass) {
    proto.removeClass = function(...classes: string[]) {
        this.classList.remove(...classes);
        return this;
    };
}
if (!proto.appendText) {
    proto.appendText = function(text: string) {
        this.appendChild(document.createTextNode(text));
        return this;
    };
}
if (!proto.createEl) {
    proto.createEl = function(tag: string, o?: any) {
        const el = document.createElement(tag);
        if (o) {
            if (o.text) el.textContent = o.text;
            if (o.cls) el.className = o.cls;
            if (o.attr) {
                for (const [k, v] of Object.entries(o.attr)) {
                    el.setAttribute(k, String(v));
                }
            }
        }
        this.appendChild(el);
        return el;
    };
}
if (!proto.createDiv) {
    proto.createDiv = function(o?: any) {
        return this.createEl('div', o || {});
    };
}
if (!proto.createSpan) {
    proto.createSpan = function(o?: any) {
        return this.createEl('span', o || {});
    };
}

// Mock Notice class
class MockNotice {
    message: string;
    duration?: number;

    constructor(message: string, duration?: number) {
        this.message = message;
        this.duration = duration;
    }

    hide() {
        // Mock implementation
    }

    setMessage(message: string) {
        this.message = message;
        return this;
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

// Mock Component class — minimal stand-in for Obsidian's Component lifecycle.
class MockComponent {
    _children: MockComponent[] = [];
    _loaded = false;

    load() {
        this._loaded = true;
        return this;
    }

    onload() {
        // Override in subclasses
    }

    unload() {
        this._loaded = false;
        this._children = [];
    }

    onunload() {
        // Override in subclasses
    }

    addChild<T extends MockComponent>(component: T): T {
        this._children.push(component);
        return component;
    }

    removeChild<T extends MockComponent>(component: T): T {
        this._children = this._children.filter(c => c !== component);
        return component;
    }
}

// Mock Setting class
class MockSetting {
    settingEl: HTMLElement;
    nameEl: HTMLElement;
    descEl: HTMLElement;
    controlEl: HTMLElement;
    infoEl: HTMLElement;

    constructor(containerEl: HTMLElement) {
        this.settingEl = document.createElement('div');
        this.nameEl = document.createElement('div');
        this.descEl = document.createElement('div');
        this.controlEl = document.createElement('div');
        this.infoEl = document.createElement('div');
        this.settingEl.appendChild(this.nameEl);
        this.settingEl.appendChild(this.descEl);
        this.settingEl.appendChild(this.controlEl);
        this.settingEl.appendChild(this.infoEl);
        containerEl.appendChild(this.settingEl);
    }

    setName(name: string) {
        this.nameEl.textContent = name;
        return this;
    }

    setDesc(desc: string) {
        this.descEl.textContent = desc;
        return this;
    }

    setHeading() {
        return this;
    }

    setDestructive() {
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
            setCta: jest.fn().mockReturnThis(),
            setWarning: jest.fn().mockReturnThis(),
            setDestructive: jest.fn().mockReturnThis(),
            setDisabled: jest.fn().mockReturnThis(),
            buttonEl: document.createElement('button')
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

// Mock TFile class
class MockTFile {
    path: any;
    name: any;
    basename: any;
    extension: any;
    vault: any;
    parent: any;
    stat: any;
}

// Mock requestUrl function
const mockRequestUrl = jest.fn().mockResolvedValue({
    status: 200,
    arrayBuffer: new ArrayBuffer(0),
    json: {}
});

class MockButtonComponent {
    buttonEl: HTMLButtonElement;
    constructor(containerEl: HTMLElement) {
        this.buttonEl = document.createElement('button');
        containerEl.appendChild(this.buttonEl);
    }
    setButtonText = jest.fn().mockReturnThis();
    setIcon = jest.fn().mockReturnThis();
    setTooltip = jest.fn().mockReturnThis();
    onClick = jest.fn().mockReturnThis();
    setCta = jest.fn().mockReturnThis();
    setWarning = jest.fn().mockReturnThis();
    setDestructive = jest.fn().mockReturnThis();
    setDisabled = jest.fn().mockReturnThis();
}

class MockTextComponent {
    inputEl: HTMLInputElement;
    constructor(containerEl: HTMLElement) {
        this.inputEl = document.createElement('input');
        containerEl.appendChild(this.inputEl);
    }
    setValue = jest.fn().mockReturnThis();
    setPlaceholder = jest.fn().mockReturnThis();
    onChange = jest.fn().mockReturnThis();
}

class MockToggleComponent {
    constructor(containerEl: HTMLElement) {}
    setValue = jest.fn().mockReturnThis();
    onChange = jest.fn().mockReturnThis();
}

class MockDropdownComponent {
    selectEl: HTMLSelectElement;
    constructor(containerEl: HTMLElement) {
        this.selectEl = document.createElement('select');
        containerEl.appendChild(this.selectEl);
    }
    addOption = jest.fn().mockReturnThis();
    setValue = jest.fn().mockReturnThis();
    onChange = jest.fn().mockReturnThis();
}

class MockTextAreaComponent {
    inputEl: HTMLTextAreaElement;
    constructor(containerEl: HTMLElement) {
        this.inputEl = document.createElement('textarea');
        containerEl.appendChild(this.inputEl);
    }
    setValue = jest.fn().mockReturnThis();
    setPlaceholder = jest.fn().mockReturnThis();
    onChange = jest.fn().mockReturnThis();
}

// Export mocks to global scope
(global as any).obsidian = {
    Notice: MockNotice,
    Modal: MockModal,
    Plugin: MockPlugin,
    PluginSettingTab: MockPluginSettingTab,
    Setting: MockSetting,
    TFile: MockTFile,
    Component: MockComponent,
    request: mockRequest,
    requestUrl: mockRequestUrl,
    normalizePath: mockNormalizePath,
    App: mockApp,
    ButtonComponent: MockButtonComponent,
    TextComponent: MockTextComponent,
    ToggleComponent: MockToggleComponent,
    DropdownComponent: MockDropdownComponent,
    TextAreaComponent: MockTextAreaComponent
};

// Make mocks available for imports
jest.mock('obsidian', () => ({
    Notice: MockNotice,
    Modal: MockModal,
    Plugin: MockPlugin,
    PluginSettingTab: MockPluginSettingTab,
    Setting: MockSetting,
    TFile: MockTFile,
    Component: MockComponent,
    request: mockRequest,
    requestUrl: mockRequestUrl,
    normalizePath: mockNormalizePath,
    App: jest.fn(() => mockApp),
    ButtonComponent: MockButtonComponent,
    TextComponent: MockTextComponent,
    ToggleComponent: MockToggleComponent,
    DropdownComponent: MockDropdownComponent,
    TextAreaComponent: MockTextAreaComponent,
    // Minimal stand-in for Obsidian's built-in HTML→Markdown converter.
    // The real implementation lives inside Obsidian; this is sufficient for
    // tests that don't override it in their own jest.mock call.
    htmlToMarkdown: jest.fn((html: string) => html.replace(/<[^>]+>/g, '').trim())
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
