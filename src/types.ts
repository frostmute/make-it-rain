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