export type RaindropType = 'link' | 'article' | 'image' | 'video' | 'document' | 'audio';

export type ContentTypeTemplates = {
    [K in RaindropType]: string;
};

export type ContentTypeToggles = {
    [K in RaindropType]: boolean;
};

export interface MakeItRainSettings {
    apiToken: string;
    defaultFolder: string;
    fileNameTemplate: string;
    showRibbonIcon: boolean;
    bannerFieldName: string;
    // Template system settings
    isTemplateSystemEnabled: boolean;
    defaultTemplate: string;
    contentTypeTemplates: ContentTypeTemplates;
    contentTypeTemplateToggles: ContentTypeToggles;
}

export const CONTENT_TYPES: RaindropType[] = ['link', 'article', 'image', 'video', 'document', 'audio'];

export interface ModalFetchOptions {
    readonly vaultPath?: string;
    readonly collections: string;
    readonly apiFilterTags: string;
    readonly includeSubcollections: boolean;
    readonly appendTagsToNotes: string;
    readonly useRaindropTitleForFileName: boolean;
    readonly tagMatchType: 'all' | 'any';
    readonly filterType?: string;
    readonly fetchOnlyNew?: boolean;
    readonly updateExisting: boolean;
    readonly useDefaultTemplate: boolean;
    readonly overrideTemplates: boolean;
} 