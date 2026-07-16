/**
 * Tests for safe sync utilities (Issue #9)
 */

import { scanVaultForRaindropIds, detectDeletedRaindrops, applySafeSyncActions } from '../../../src/utils/safeSyncUtils';
import { App, TFile } from 'obsidian';

// Mock Obsidian modules
jest.mock('obsidian', () => ({
    App: jest.fn(),
    TFile: jest.fn(),
    normalizePath: (p: string) => p,
}));

describe('scanVaultForRaindropIds', () => {
    it('should return empty array when no markdown files exist', async () => {
        const mockApp = {
            vault: {
                getMarkdownFiles: () => [],
            },
            metadataCache: {
                getFileCache: () => null,
            },
        } as unknown as App;

        const result = await scanVaultForRaindropIds(mockApp, '');
        expect(result).toEqual([]);
    });

    it('should find files with raindrop_id in frontmatter', async () => {
        const mockFile = { path: 'test.md', name: 'test.md' };
        const mockApp = {
            vault: {
                getMarkdownFiles: () => [mockFile],
            },
            metadataCache: {
                getFileCache: () => ({
                    frontmatter: { raindrop_id: 12345, title: 'Test' },
                }),
            },
        } as unknown as App;

        const result = await scanVaultForRaindropIds(mockApp, '');
        expect(result).toHaveLength(1);
        expect(result[0].raindropId).toBe(12345);
        expect(result[0].filePath).toBe('test.md');
    });

    it('should skip files without raindrop_id', async () => {
        const mockFile = { path: 'test.md', name: 'test.md' };
        const mockApp = {
            vault: {
                getMarkdownFiles: () => [mockFile],
            },
            metadataCache: {
                getFileCache: () => ({
                    frontmatter: { title: 'Test' },
                }),
            },
        } as unknown as App;

        const result = await scanVaultForRaindropIds(mockApp, '');
        expect(result).toHaveLength(0);
    });

    it('should filter by vault path when provided', async () => {
        const mockFileInPath = { path: 'Raindrops/test.md', name: 'test.md' };
        const mockFileOutsidePath = { path: 'Other/test2.md', name: 'test2.md' };
        const mockApp = {
            vault: {
                getMarkdownFiles: () => [mockFileInPath, mockFileOutsidePath],
            },
            metadataCache: {
                getFileCache: () => ({
                    frontmatter: { raindrop_id: 1 },
                }),
            },
        } as unknown as App;

        const result = await scanVaultForRaindropIds(mockApp, 'Raindrops');
        expect(result).toHaveLength(1);
        expect(result[0].filePath).toBe('Raindrops/test.md');
    });
});

describe('detectDeletedRaindrops', () => {
    it('should return empty buckets when no candidates provided', async () => {
        const mockApp = {} as App;
        const result = await detectDeletedRaindrops([], 'token', { checkLimit: jest.fn() } as any, mockApp);
        expect(result.deleted).toEqual([]);
        expect(result.unknown).toEqual([]);
    });

    // Ponytail: only an explicit `result: false` means deleted. Anything else
    // (missing item, errors, weird shapes) goes into `unknown` so the user must
    // review before any destructive action. The full happy/sad matrix lives in
    // safeSyncUtils.ts — a tighter test would require injecting the API client.
    it('returns an object with deleted and unknown arrays', async () => {
        const mockApp = {} as App;
        const result = await detectDeletedRaindrops([], 'token', { checkLimit: jest.fn() } as any, mockApp);
        expect(result).toEqual(expect.objectContaining({
            deleted: expect.any(Array),
            unknown: expect.any(Array),
        }));
    });
});

describe('applySafeSyncActions', () => {
    function makeMockFile(path: string) {
        // Real instanceof check requires an actual TFile instance, not a cast.
        return Object.assign(Object.create(TFile.prototype), { path, name: path.split('/').pop() || path });
    }

    it('should correctly count ignored items', async () => {
        const mockApp = {
            vault: {
                getAbstractFileByPath: () => makeMockFile('test.md'),
                delete: async () => {},
                adapter: { exists: async () => true },
            },
        } as unknown as App;

        const items = [
            { filePath: 'test.md', fileName: 'test.md', raindropId: 1, action: 'ignore' as const },
        ];

        const result = await applySafeSyncActions(mockApp, items, '.trash', jest.fn());
        expect(result.ignored).toBe(1);
        expect(result.deleted).toBe(0);
        expect(result.archived).toBe(0);
    });

    it('should archive items by moving to trash folder', async () => {
        let existsCallCount = 0;
        const mockApp = {
            vault: {
                getAbstractFileByPath: () => makeMockFile('test.md'),
                adapter: {
                    exists: async (path: string) => {
                        existsCallCount++;
                        return existsCallCount <= 1; // trash exists, but dest doesn't
                    },
                    mkdir: async () => {},
                },
                rename: async () => {},
            },
        } as unknown as App;

        const items = [
            { filePath: 'test.md', fileName: 'test.md', raindropId: 1, action: 'archive' as const },
        ];

        const result = await applySafeSyncActions(mockApp, items, '.trash', jest.fn());
        expect(result.archived).toBe(1);
        expect(result.ignored).toBe(0);
    });

    it('should delete items when action is delete', async () => {
        const mockApp = {
            vault: {
                getAbstractFileByPath: () => makeMockFile('test.md'),
                adapter: { exists: async () => false },
            },
            fileManager: {
                trashFile: async () => {},
            },
        } as unknown as App;

        const items = [
            { filePath: 'test.md', fileName: 'test.md', raindropId: 1, action: 'delete' as const },
        ];

        const result = await applySafeSyncActions(mockApp, items, '.trash', jest.fn());
        expect(result.deleted).toBe(1);
    });
});
