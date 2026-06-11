import { RaindropType, RaindropTypes } from '../types';

export interface SampleRaindrop {
    _id: number;
    title: string;
    excerpt: string;
    note: string;
    link: string;
    cover: string;
    created: string;
    lastupdate: string;
    tags: string[];
    collectionId: number;
    collectionTitle: string;
    collectionPath: string;
    collectionGroup?: string;
    collectionParentId?: number;
    highlights: { text: string; note?: string }[];
    type: RaindropType;
}

export const SAMPLE_RAINDROPS: Record<string, SampleRaindrop> = {
    [RaindropTypes.LINK]: {
        _id: 12347,
        title: 'GitHub Repository',
        excerpt: 'A repository for the Make It Rain Obsidian plugin.',
        note: 'Check this out for development.',
        link: 'https://github.com/frostmute/make-it-rain',
        cover: 'https://github.com/fluidicon.png',
        created: '2024-01-10T16:45:00Z',
        lastupdate: '2024-01-10T16:45:00Z',
        tags: ['github', 'tools', 'open-source'],
        collectionId: 1002,
        collectionTitle: 'Developer Tools',
        collectionPath: 'Tech / Development / Developer Tools',
        collectionGroup: 'Work',
        highlights: [],
        type: RaindropTypes.LINK
    },
    [RaindropTypes.ARTICLE]: {
        _id: 12345,
        title: 'How to Test Your Code',
        excerpt: 'A comprehensive guide to writing effective unit tests in TypeScript and JavaScript.',
        note: 'Important article about testing best practices.',
        link: 'https://example.com/testing-guide',
        cover: 'https://example.com/images/testing-cover.jpg',
        created: '2024-01-01T10:00:00Z',
        lastupdate: '2024-01-15T14:30:00Z',
        tags: ['testing', 'javascript', 'best-practices'],
        collectionId: 1000,
        collectionTitle: 'Programming',
        collectionPath: 'Tech / Development / Programming',
        collectionGroup: 'Learning',
        highlights: [
            {
                text: 'Unit tests should be independent and isolated.',
                note: 'Key principle'
            },
            {
                text: 'Mock external dependencies to ensure predictable tests.'
            }
        ],
        type: RaindropTypes.ARTICLE
    },
    [RaindropTypes.VIDEO]: {
        _id: 12346,
        title: 'TypeScript Tutorial',
        excerpt: 'Learn TypeScript in 30 minutes. Covers basics to advanced types.',
        note: 'Great for a quick refresh.',
        link: 'https://youtube.com/watch?v=abc123',
        cover: 'https://img.youtube.com/vi/abc123/maxresdefault.jpg',
        created: '2024-01-05T09:00:00Z',
        lastupdate: '2024-01-05T09:00:00Z',
        tags: ['typescript', 'tutorial', 'video'],
        collectionId: 1001,
        collectionTitle: 'Video Tutorials',
        collectionPath: 'Media / Video / Video Tutorials',
        highlights: [
            {
                text: '0:00 Intro'
            },
            {
                text: '5:30 Interface vs Type',
                note: 'Important distinction'
            }
        ],
        type: RaindropTypes.VIDEO
    },
    [RaindropTypes.IMAGE]: {
        _id: 12348,
        title: 'Architecture Diagram',
        excerpt: 'System architecture overview for the new project.',
        note: 'Save this for reference in the README.',
        link: 'https://example.com/diagrams/architecture.png',
        cover: 'https://example.com/diagrams/architecture.png',
        created: '2024-01-12T11:20:00Z',
        lastupdate: '2024-01-12T11:20:00Z',
        tags: ['architecture', 'design', 'diagrams'],
        collectionId: 1000,
        collectionTitle: 'Programming',
        collectionPath: 'Tech / Development / Programming',
        highlights: [],
        type: RaindropTypes.IMAGE
    },
    [RaindropTypes.DOCUMENT]: {
        _id: 12349,
        title: 'API Documentation',
        excerpt: 'Complete API reference guide for the Raindrop.io REST API v1.',
        note: 'Essential for plugin development.',
        link: 'https://example.com/docs/api.pdf',
        cover: 'https://example.com/covers/pdf.png',
        created: '2024-01-20T08:00:00Z',
        lastupdate: '2024-01-20T08:00:00Z',
        tags: ['documentation', 'api', 'reference'],
        collectionId: 1003,
        collectionTitle: 'Documentation',
        collectionPath: 'Tech / Development / Documentation',
        highlights: [
            {
                text: 'All requests must include an Authorization header.'
            }
        ],
        type: RaindropTypes.DOCUMENT
    },
    [RaindropTypes.AUDIO]: {
        _id: 12350,
        title: 'Podcast: Developer Stories',
        excerpt: 'Interview with senior developers about their career paths.',
        note: 'Listen while commuting.',
        link: 'https://example.com/podcasts/episode-42.mp3',
        cover: 'https://example.com/covers/podcast.jpg',
        created: '2024-01-25T07:30:00Z',
        lastupdate: '2024-01-25T07:30:00Z',
        tags: ['podcast', 'interview', 'developers'],
        collectionId: 1004,
        collectionTitle: 'Podcasts',
        collectionPath: 'Media / Audio / Podcasts',
        highlights: [
            {
                text: '15:40 Transitioning to management',
                note: 'Good advice here'
            }
        ],
        type: RaindropTypes.AUDIO
    },
    [RaindropTypes.BOOK]: {
        _id: 12351,
        title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
        excerpt: 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees.',
        note: 'A must-read for every developer.',
        link: 'https://example.com/books/clean-code',
        cover: 'https://example.com/covers/clean-code.jpg',
        created: '2024-02-01T10:00:00Z',
        lastupdate: '2024-02-01T10:00:00Z',
        tags: ['programming', 'clean-code', 'books'],
        collectionId: 1000,
        collectionTitle: 'Programming',
        collectionPath: 'Tech / Development / Programming',
        highlights: [
            {
                text: 'The only truly effective way to write clean code is to write it from the start.'
            }
        ],
        type: RaindropTypes.BOOK
    }
};
