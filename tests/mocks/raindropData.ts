/**
 * Mock Data for Testing
 * ======================
 *
 * This file contains mock data for Raindrop.io API responses.
 * Use these in tests to avoid making real API calls.
 */

import { RaindropType } from '../../src/types';

/**
 * Mock Raindrop Items
 */
export const mockRaindropArticle = {
    _id: 12345,
    title: 'How to Test Your Code',
    excerpt: 'A comprehensive guide to writing effective unit tests.',
    note: 'Important article about testing best practices.',
    link: 'https://example.com/testing-guide',
    cover: 'https://example.com/images/testing-cover.jpg',
    created: '2024-01-01T10:00:00Z',
    lastUpdate: '2024-01-15T14:30:00Z',
    tags: ['testing', 'javascript', 'best-practices'],
    collection: {
        $id: 1000,
        title: 'Programming'
    },
    highlights: [
        {
            text: 'Unit tests should be independent and isolated.',
            note: 'Key principle',
            color: 'yellow',
            created: '2024-01-02T12:00:00Z'
        },
        {
            text: 'Mock external dependencies to ensure predictable tests.',
            color: 'green',
            created: '2024-01-03T15:30:00Z'
        }
    ],
    type: 'article' as RaindropType
};

export const mockRaindropVideo = {
    _id: 12346,
    title: 'TypeScript Tutorial',
    excerpt: 'Learn TypeScript in 30 minutes',
    link: 'https://youtube.com/watch?v=abc123',
    cover: 'https://img.youtube.com/vi/abc123/maxresdefault.jpg',
    created: '2024-01-05T09:00:00Z',
    lastUpdate: '2024-01-05T09:00:00Z',
    tags: ['typescript', 'tutorial', 'video'],
    collection: {
        $id: 1001,
        title: 'Video Tutorials'
    },
    type: 'video' as RaindropType
};

export const mockRaindropLink = {
    _id: 12347,
    title: 'GitHub Repository',
    link: 'https://github.com/user/repo',
    created: '2024-01-10T16:45:00Z',
    lastUpdate: '2024-01-10T16:45:00Z',
    tags: ['github', 'tools'],
    collection: {
        $id: 1002,
        title: 'Developer Tools'
    },
    type: 'link' as RaindropType
};

export const mockRaindropImage = {
    _id: 12348,
    title: 'Architecture Diagram',
    excerpt: 'System architecture overview',
    link: 'https://example.com/diagrams/architecture.png',
    cover: 'https://example.com/diagrams/architecture.png',
    created: '2024-01-12T11:20:00Z',
    lastUpdate: '2024-01-12T11:20:00Z',
    tags: ['architecture', 'design', 'diagrams'],
    collection: {
        $id: 1000,
        title: 'Programming'
    },
    type: 'image' as RaindropType
};

export const mockRaindropDocument = {
    _id: 12349,
    title: 'API Documentation',
    excerpt: 'Complete API reference guide',
    link: 'https://example.com/docs/api.pdf',
    created: '2024-01-20T08:00:00Z',
    lastUpdate: '2024-01-20T08:00:00Z',
    tags: ['documentation', 'api', 'reference'],
    collection: {
        $id: 1003,
        title: 'Documentation'
    },
    type: 'document' as RaindropType
};

export const mockRaindropAudio = {
    _id: 12350,
    title: 'Podcast: Developer Stories',
    excerpt: 'Interview with senior developers',
    link: 'https://example.com/podcasts/episode-42.mp3',
    created: '2024-01-25T07:30:00Z',
    lastUpdate: '2024-01-25T07:30:00Z',
    tags: ['podcast', 'interview', 'developers'],
    collection: {
        $id: 1004,
        title: 'Podcasts'
    },
    type: 'audio' as RaindropType
};

export const mockRaindropWithSpecialChars = {
    _id: 12351,
    title: 'Article: "Breaking Changes" in TypeScript 5.0 & More',
    excerpt: 'Discussion about breaking changes:\n- Type system updates\n- New features',
    note: 'Important note with special chars: #hashtag @mention {brackets}',
    link: 'https://example.com/article?id=123&ref=twitter',
    created: '2024-02-01T10:00:00Z',
    lastUpdate: '2024-02-01T10:00:00Z',
    tags: ['typescript', 'breaking-changes', 'v5.0'],
    collection: {
        $id: 1000,
        title: 'Programming'
    },
    type: 'article' as RaindropType
};

export const mockRaindropMinimal = {
    _id: 12352,
    title: 'Minimal Bookmark',
    link: 'https://example.com',
    created: '2024-02-05T12:00:00Z',
    lastUpdate: '2024-02-05T12:00:00Z',
    type: 'link' as RaindropType
};

export const mockRaindropBrokenUrl = {
    _id: 12353,
    title: 'Broken URL Bookmark',
    link: 'not-a-url',
    created: '2024-02-10T10:00:00Z',
    lastUpdate: '2024-02-10T10:00:00Z',
    type: 'link' as RaindropType
};

export const mockRaindropEmptyMetadata = {
    _id: 12354,
    title: '',
    excerpt: '',
    note: '',
    link: 'https://example.com/empty',
    created: '2024-02-11T11:00:00Z',
    lastUpdate: '2024-02-11T11:00:00Z',
    type: 'link' as RaindropType
};

export const mockRaindropMassiveDescription = {
    _id: 12355,
    title: 'Massive Description',
    excerpt: 'A'.repeat(10000),
    note: 'B'.repeat(10000),
    link: 'https://example.com/massive',
    created: '2024-02-12T12:00:00Z',
    lastUpdate: '2024-02-12T12:00:00Z',
    type: 'article' as RaindropType
};

export const mockRaindropNestedTags = {
    _id: 12356,
    title: 'Nested Tags',
    link: 'https://example.com/nested',
    created: '2024-02-13T13:00:00Z',
    lastUpdate: '2024-02-13T13:00:00Z',
    tags: ['parent/child', 'level1/level2/level3'],
    type: 'link' as RaindropType
};

export const mockRaindropInvalidTitle = {
    _id: 12357,
    title: 'Invalid / Filename \\ Characters : * ? " < > |',
    link: 'https://example.com/invalid-title',
    created: '2024-02-14T14:00:00Z',
    lastUpdate: '2024-02-14T14:00:00Z',
    type: 'link' as RaindropType
};

export const mockRaindropMissingCollection = {
    _id: 12358,
    title: 'No Collection',
    link: 'https://example.com/no-collection',
    created: '2024-02-15T15:00:00Z',
    lastUpdate: '2024-02-15T15:00:00Z',
    type: 'link' as RaindropType
    // collection field omitted
};

export const mockRaindropNoTags = {
    _id: 12359,
    title: 'No Tags Array',
    link: 'https://example.com/no-tags',
    created: '2024-02-16T16:00:00Z',
    lastUpdate: '2024-02-16T16:00:00Z',
    type: 'link' as RaindropType
};

export const mockRaindropEmptyHighlights = {
    _id: 12360,
    title: 'Empty Highlights',
    link: 'https://example.com/empty-highlights',
    created: '2024-02-17T17:00:00Z',
    lastUpdate: '2024-02-17T17:00:00Z',
    highlights: [],
    type: 'article' as RaindropType
};

export const mockRaindropHighlightNoText = {
    _id: 12361,
    title: 'Highlight No Text',
    link: 'https://example.com/highlight-no-text',
    created: '2024-02-18T18:00:00Z',
    lastUpdate: '2024-02-18T18:00:00Z',
    highlights: [
        {
            text: '',
            note: 'Note with no text',
            created: '2024-02-18T18:05:00Z'
        }
    ],
    type: 'article' as RaindropType
};

export const mockRaindropLongTags = {
    _id: 12362,
    title: 'Long Tags',
    link: 'https://example.com/long-tags',
    created: '2024-02-19T19:00:00Z',
    lastUpdate: '2024-02-19T19:00:00Z',
    tags: ['T'.repeat(150), 'another-very-long-tag-that-goes-on-and-on-and-on-and-on-and-on'],
    type: 'link' as RaindropType
};

export const mockRaindropUnicode = {
    _id: 12363,
    title: 'Unicode & Emojis 🚀 🦀 漢字 日本語',
    excerpt: 'Mixed content: 🌟✨ sparkle, 💻 code, 🍱 food',
    link: 'https://example.com/unicode',
    created: '2024-02-20T20:00:00Z',
    lastUpdate: '2024-02-20T20:00:00Z',
    tags: ['🚀', '🦀', '漢字'],
    type: 'link' as RaindropType
};

/**
 * Mock Collections
 */
export const mockCollectionProgramming = {
    _id: 1000,
    title: 'Programming',
    count: 42,
    color: '#FF5733',
    cover: ['https://example.com/covers/programming.jpg'],
    created: '2023-01-01T00:00:00Z',
    lastUpdate: '2024-01-15T14:30:00Z',
    public: false,
    sort: 0,
    view: 'list' as const
};

export const mockCollectionVideoTutorials = {
    _id: 1001,
    title: 'Video Tutorials',
    parent: {
        $id: 1000
    },
    count: 15,
    color: '#33C3FF',
    created: '2023-06-01T00:00:00Z',
    lastUpdate: '2024-01-10T10:00:00Z',
    public: false,
    sort: 1,
    view: 'grid' as const
};

export const mockCollectionDeveloperTools = {
    _id: 1002,
    title: 'Developer Tools',
    count: 28,
    color: '#4CAF50',
    created: '2023-03-15T00:00:00Z',
    lastUpdate: '2024-01-18T16:00:00Z',
    public: true,
    sort: 2,
    view: 'simple' as const
};

export const mockCollectionDocumentation = {
    _id: 1003,
    title: 'Documentation',
    parent: {
        $id: 1000
    },
    count: 35,
    color: '#FFC107',
    created: '2023-08-20T00:00:00Z',
    lastUpdate: '2024-01-20T08:00:00Z',
    public: false,
    sort: 3,
    view: 'list' as const
};

export const mockCollectionPodcasts = {
    _id: 1004,
    title: 'Podcasts',
    count: 12,
    color: '#9C27B0',
    created: '2023-09-10T00:00:00Z',
    lastUpdate: '2024-01-25T07:30:00Z',
    public: false,
    sort: 4,
    view: 'masonry' as const
};

export const mockCollectionUnsorted = {
    _id: -1,
    title: 'Unsorted',
    count: 5,
    created: '2023-01-01T00:00:00Z',
    lastUpdate: '2024-02-01T00:00:00Z',
    public: false,
    sort: -1,
    view: 'list' as const
};

/**
 * Mock API Responses
 */
export const mockRaindropResponse = {
    result: true,
    items: [
        mockRaindropArticle,
        mockRaindropVideo,
        mockRaindropLink
    ],
    count: 3,
    collectionId: 1000
};

export const mockRaindropResponseEmpty = {
    result: true,
    items: [],
    count: 0,
    collectionId: 1000
};

export const mockRaindropResponseSingle = {
    result: true,
    items: [mockRaindropArticle],
    count: 1,
    collectionId: 1000
};

export const mockRaindropResponseAllTypes = {
    result: true,
    items: [
        mockRaindropArticle,
        mockRaindropVideo,
        mockRaindropLink,
        mockRaindropImage,
        mockRaindropDocument,
        mockRaindropAudio
    ],
    count: 6,
    collectionId: 1000
};

export const mockCollectionResponse = {
    result: true,
    items: [
        mockCollectionProgramming,
        mockCollectionVideoTutorials,
        mockCollectionDeveloperTools,
        mockCollectionDocumentation,
        mockCollectionPodcasts
    ]
};

export const mockCollectionResponseEmpty = {
    result: true,
    items: []
};

export const mockCollectionInfoResponse = {
    result: true,
    item: mockCollectionProgramming
};

export const mockCollectionInfoResponseNotFound = {
    result: false,
    error: 'Collection not found',
    errorMessage: 'The requested collection does not exist'
};

/**
 * Mock Error Responses
 */
export const mockErrorResponse401 = {
    result: false,
    error: 'Unauthorized',
    errorMessage: 'Invalid API token'
};

export const mockErrorResponse404 = {
    result: false,
    error: 'Not Found',
    errorMessage: 'Resource not found'
};

export const mockErrorResponse429 = {
    result: false,
    error: 'Too Many Requests',
    errorMessage: 'Rate limit exceeded. Please try again later.'
};

export const mockErrorResponse500 = {
    result: false,
    error: 'Internal Server Error',
    errorMessage: 'Something went wrong on our end'
};

/**
 * Helper function to create custom mock raindrop
 */
export function createMockRaindrop(overrides: Partial<typeof mockRaindropArticle> = {}) {
    return {
        ...mockRaindropArticle,
        ...overrides
    };
}

/**
 * Helper function to create custom mock collection
 */
export function createMockCollection(overrides: Partial<typeof mockCollectionProgramming> = {}) {
    return {
        ...mockCollectionProgramming,
        ...overrides
    };
}

/**
 * Helper function to create custom mock response
 */
export function createMockResponse(
    items: any[] = [],
    collectionId: number = 0
) {
    return {
        result: true,
        items,
        count: items.length,
        collectionId
    };
}
