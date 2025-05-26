export type RaindropType = 'link' | 'article' | 'image' | 'video' | 'document' | 'audio';

export const CONTENT_TYPES: RaindropType[] = ['link', 'article', 'image', 'video', 'document', 'audio'];

export interface ContentTypeTemplates {
    link: string;
    article: string;
    image: string;
    video: string;
    document: string;
    audio: string;
}

export interface ContentTypeToggles {
    link: boolean;
    article: boolean;
    image: boolean;
    video: boolean;
    document: boolean;
    audio: boolean;
}

export interface MakeItRainSettings {
    apiToken: string;
    defaultFolder: string;
    fileNameTemplate: string;
    showRibbonIcon: boolean;
    bannerFieldName: string;
    isTemplateSystemEnabled: boolean;
    defaultTemplate: string;
    contentTypeTemplates: ContentTypeTemplates;
    contentTypeTemplateToggles: ContentTypeToggles;
}

export interface ModalFetchOptions {
    vaultPath?: string;
    collections: string;
    apiFilterTags: string;
    includeSubcollections: boolean;
    appendTagsToNotes: string;
    useRaindropTitleForFileName: boolean;
    tagMatchType: 'all' | 'any';
    filterType: RaindropType | 'all';
    fetchOnlyNew: boolean;
    updateExisting: boolean;
    useDefaultTemplate: boolean;
    overrideTemplates: boolean;
}

export interface RaindropItem {
    readonly _id: number;
    readonly title: string;
    readonly excerpt?: string;
    readonly note?: string;
    readonly link: string;
    readonly cover?: string;
    readonly created: string;
    readonly lastUpdate: string;
    readonly tags?: readonly string[];
    readonly collection?: {
        readonly $id: number;
        readonly title: string;
    };
    readonly highlights?: ReadonlyArray<{
        readonly text: string;
        readonly note?: string;
        readonly color?: string;
        readonly created: string;
    }>;
    readonly type: RaindropType;
    readonly [key: string]: any;
}

export interface RaindropResponse {
    readonly result: boolean;
    readonly items: readonly RaindropItem[];
    readonly count?: number;
    readonly collectionId?: number;
}

export interface RaindropCollection {
    readonly _id: number;
    readonly title: string;
    readonly parent?: {
        readonly $id: number;
    };
    readonly access?: {
        readonly level: number;
        readonly draggable: boolean;
    };
    readonly color?: string;
    readonly count?: number;
    readonly cover?: readonly string[];
    readonly created?: string;
    readonly expanded?: boolean;
    readonly lastUpdate?: string;
    readonly public?: boolean;
    readonly sort?: number;
    readonly view?: 'list' | 'simple' | 'grid' | 'masonry';
    readonly [key: string]: any;
}

export interface CollectionResponse {
    readonly result: boolean;
    readonly items: readonly RaindropCollection[];
}

export interface IRaindropToObsidian {
    settings: MakeItRainSettings;
    fetchRaindrops(options: ModalFetchOptions): Promise<void>;
    saveSettings(): Promise<void>;
    updateRibbonIcon(): void;
} 