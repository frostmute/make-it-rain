import { RequestUrlParam } from 'obsidian';
import { RateLimiter } from '../utils/apiUtils';
import { TemplateSettings } from './templates';

// Constants for type unions - following Raindrop.io API types
export const RaindropTypes = {
    LINK: 'link',
    ARTICLE: 'article',
    IMAGE: 'image',
    VIDEO: 'video',
    DOCUMENT: 'document',
    AUDIO: 'audio'
} as const;

export type RaindropType = typeof RaindropTypes[keyof typeof RaindropTypes];

export const TagMatchTypes = {
    ALL: 'all',
    ANY: 'any'
} as const;

export type TagMatchType = typeof TagMatchTypes[keyof typeof TagMatchTypes];

// System collection IDs from Raindrop.io API docs
export const SystemCollections = {
    UNSORTED: -1,
    TRASH: -99
} as const;

export type SystemCollectionId = typeof SystemCollections[keyof typeof SystemCollections];

// Raindrop.io API Types - following official documentation structure
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

export const FilterTypes = {
    ...RaindropTypes,
    ALL: 'all'
} as const;

export type FilterType = typeof FilterTypes[keyof typeof FilterTypes];

export interface ModalFetchOptions {
    readonly vaultPath?: string;
    readonly collections: string;
    readonly apiFilterTags: string;
    readonly includeSubcollections: boolean;
    readonly appendTagsToNotes: string;
    readonly useRaindropTitleForFileName: boolean;
    readonly tagMatchType: TagMatchType;
    readonly filterType?: FilterType;
    readonly fetchOnlyNew?: boolean;
    readonly updateExisting: boolean;
}

export interface RaindropToObsidianSettings {
    raindropApiToken: string;
    defaultVaultLocation: string;
    fileNameTemplate: string;
    showRibbonIcon: boolean;
    bannerFieldName: string;
    templateSettings?: TemplateSettings;
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

export interface FetchWithRetryOptions {
    url: string;
    requestOptions: Partial<RequestUrlParam>;
    rateLimiter: RateLimiter;
    maxRetries?: number;
    delayBetweenRetries?: number;
} 