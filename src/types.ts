// Constants for type unions - following Raindrop.io API types
export const RaindropTypes = {
    LINK: 'link',
    ARTICLE: 'article',
    IMAGE: 'image',
    VIDEO: 'video',
    DOCUMENT: 'document',
    AUDIO: 'audio',
    BOOK: 'book'
} as const;

export const TagMatchTypes = {
    ALL: 'all' as const,
    ANY: 'any' as const
};

export const FilterTypes = {
    ...RaindropTypes,
    ALL: 'all'
} as const;

export type RaindropType = 'link' | 'article' | 'image' | 'video' | 'document' | 'audio' | 'book';

export const CONTENT_TYPES: RaindropType[] = ['link', 'article', 'image', 'video', 'document', 'audio', 'book'];

export interface ContentTypeTemplates {
    link: string;
    article: string;
    image: string;
    video: string;
    document: string;
    audio: string;
    book: string;
}

export interface ContentTypeToggles {
    link: boolean;
    article: boolean;
    image: boolean;
    video: boolean;
    document: boolean;
    audio: boolean;
    book: boolean;
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
    downloadFiles: boolean;
    createFolderNotes: boolean;
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
    readonly highlights?: ReadonlyArray<RaindropHighlight>;
    readonly type: RaindropType;
    readonly file?: {
        readonly name?: string;
        readonly size?: number;
        readonly type?: string;
    };
    readonly [key: string]: unknown;
}

export interface TemplateData {
    _id: number;
    title: string;
    excerpt: string;
    note: string;
    link: string;
    cover: string;
    created: string;
    lastupdate: string;
    type: RaindropType;
    collectionId: number;
    collectionTitle: string;
    collectionPath: string;
    collectionParentId?: number;
    tags: string[];
    highlights: {
        text: string;
        note?: string;
        color?: string;
        created: string;
    }[];
    bannerFieldName: string;
    url: string;
    domain?: string;
    renderedType?: string;
    [key: string]: unknown; // Allow for custom fields if needed, but primary fields are typed
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
    readonly [key: string]: unknown;
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
    fetchAllUserCollections(): Promise<RaindropCollection[]>;
    fetchSingleRaindrop(itemId: number, vaultPath?: string, appendTags?: string): Promise<void>;
}

export type RaindropHighlight = {
    readonly text: string;
    readonly note?: string;
    readonly color?: string;
    readonly created: string;
};
