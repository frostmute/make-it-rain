import { RaindropType } from './index';

export interface TemplateVariable {
    name: string;
    description: string;
    example: string;
}

export interface TemplateConfig {
    name: string;
    description: string;
    template: string;
    variables: TemplateVariable[];
}

export interface TemplateSettings {
    enabled: boolean;
    defaultTemplate: string;
    typeTemplates: Record<RaindropType, string>;
    customTemplates: Record<string, TemplateConfig>;
}

export const DEFAULT_TEMPLATE = `---
title: {{title}}
url: {{url}}
created: {{created}}
updated: {{updated}}
type: {{type}}
{{#if cover}}banner: {{cover}}{{/if}}
{{#if tags}}tags:
{{#each tags}}  - {{this}}
{{/each}}{{/if}}
---

{{#if excerpt}}{{excerpt}}

{{/if}}{{#if note}}{{note}}

{{/if}}{{#if highlights}}## Highlights
{{#each highlights}}> {{text}}
{{#if note}}> {{note}}
{{/if}}
{{/each}}{{/if}}`;

export const DEFAULT_TEMPLATE_SETTINGS: TemplateSettings = {
    enabled: false,
    defaultTemplate: DEFAULT_TEMPLATE,
    typeTemplates: {
        link: DEFAULT_TEMPLATE,
        article: DEFAULT_TEMPLATE,
        image: DEFAULT_TEMPLATE,
        video: DEFAULT_TEMPLATE,
        document: DEFAULT_TEMPLATE,
        audio: DEFAULT_TEMPLATE
    },
    customTemplates: {}
};

export const BUILT_IN_VARIABLES: TemplateVariable[] = [
    {
        name: 'title',
        description: 'The title of the raindrop',
        example: 'My Bookmark'
    },
    {
        name: 'url',
        description: 'The URL of the raindrop',
        example: 'https://example.com'
    },
    {
        name: 'created',
        description: 'Creation date in ISO format',
        example: '2024-05-24T12:00:00Z'
    },
    {
        name: 'updated',
        description: 'Last update date in ISO format',
        example: '2024-05-24T12:00:00Z'
    },
    {
        name: 'type',
        description: 'Type of the raindrop (link, article, image, etc.)',
        example: 'article'
    },
    {
        name: 'cover',
        description: 'Cover image URL if available',
        example: 'https://example.com/image.jpg'
    },
    {
        name: 'excerpt',
        description: 'Excerpt from the webpage',
        example: 'This is a summary of the content...'
    },
    {
        name: 'note',
        description: 'Your personal note about the raindrop',
        example: 'This is my note about this bookmark'
    },
    {
        name: 'tags',
        description: 'Array of tags',
        example: '["tag1", "tag2"]'
    },
    {
        name: 'highlights',
        description: 'Array of highlights with text and optional notes',
        example: '[{"text": "Highlighted text", "note": "My note"}]'
    },
    {
        name: 'collection',
        description: 'Collection information',
        example: '{"id": 123, "title": "My Collection"}'
    }
]; 