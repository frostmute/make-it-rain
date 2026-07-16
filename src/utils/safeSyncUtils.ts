/**
 * Safe Sync Utilities (Issue #9)
 * 
 * Scans the vault for local notes with raindrop_id frontmatter,
 * compares against current Raindrop API data, and detects deleted/renamed items.
 */

import { App, TFile, normalizePath } from 'obsidian';
import { RaindropItem } from '../types';
import { RateLimiter } from './apiUtils';
import { fetchWithRetry } from './apiUtils';

export interface SafeSyncCandidate {
    filePath: string;
    fileName: string;
    raindropId: number;
}

export interface SafeSyncResult {
    deleted: SafeSyncCandidate[];
    renamed: SafeSyncCandidate[];
    total: number;
}

/**
 * Scan the vault for Markdown files that contain a `raindrop_id` field in their frontmatter.
 * Returns a list of { filePath, fileName, raindropId }.
 */
export async function scanVaultForRaindropIds(app: App, vaultPath: string): Promise<SafeSyncCandidate[]> {
    const targetFolder = vaultPath ? vaultPath.trim().replace(/\/+$/, '') : '';
    const files = app.vault.getMarkdownFiles();
    const candidates: SafeSyncCandidate[] = [];

    for (const file of files) {
        if (targetFolder && !file.path.startsWith(targetFolder)) continue;
        try {
            const cache = app.metadataCache.getFileCache(file);
            const fm = cache?.frontmatter;
            if (fm && fm.raindrop_id !== undefined) {
                const id = Number(fm.raindrop_id);
                if (!isNaN(id) && id > 0) {
                    candidates.push({
                        filePath: file.path,
                        fileName: file.name,
                        raindropId: id,
                    });
                }
            }
        } catch {
            // skip files we can't read
        }
    }

    return candidates;
}

/**
 * Given a list of local raindrop_ids, batch-check which ones still exist on Raindrop.
 * Raindrop API: fetch each raindrop by ID; an explicit `result: false` means the
 * bookmark is gone. Anything else (5xx, network, missing item, unexpected shape) is
 * "unknown" — we never auto-delete on a non-definitive answer.
 *
 * Returns { deleted, unknown }. `deleted` items are safe to offer for archive/delete.
 * `unknown` items must be reviewed manually before any destructive action.
 */
export async function detectDeletedRaindrops(
    candidates: SafeSyncCandidate[],
    apiToken: string,
    rateLimiter: RateLimiter,
    app: App,
): Promise<{ deleted: SafeSyncCandidate[]; unknown: SafeSyncCandidate[] }> {
    if (candidates.length === 0) return { deleted: [], unknown: [] };

    const fetchOptions: RequestInit = {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${apiToken}` }
    };

    const baseApiUrl = 'https://api.raindrop.io/rest/v1';
    const deleted: SafeSyncCandidate[] = [];
    const unknown: SafeSyncCandidate[] = [];

    // Batch into concurrency-limited lookups (Raindrop supports individual item lookup)
    const workers = Math.min(10, candidates.length);
    let idx = 0;

    const worker = async () => {
        while (idx < candidates.length) {
            const candidate = candidates[idx++];
            if (!candidate) continue;
            try {
                const url = `${baseApiUrl}/raindrop/${candidate.raindropId}`;
                const response = await fetchWithRetry<{ result: boolean; item?: RaindropItem }>(
                    app, url, fetchOptions, rateLimiter
                );
                // Only an explicit `result: false` means the bookmark is gone.
                // Any other shape (error, missing item, unexpected flag) -> unknown.
                if (response.result === false) {
                    deleted.push(candidate);
                } else if (response.result === true && response.item) {
                    // Still exists. Skip.
                } else {
                    unknown.push(candidate);
                }
            } catch {
                // Network/5xx/etc. -> unknown, never auto-delete.
                unknown.push(candidate);
            }
        }
    };

    await Promise.all(Array.from({ length: workers }, () => worker()));
    return { deleted, unknown };
}

/**
 * Apply the user's chosen action to each SafeSyncItem.
 * - 'delete': permanently remove the note
 * - 'archive': move the note to the trash folder
 * - 'ignore': do nothing
 */
export async function applySafeSyncActions(
    app: App,
    items: { filePath: string; fileName: string; raindropId: number; action: 'delete' | 'archive' | 'ignore' }[],
    trashFolderLocation: string,
    _notice: (msg: string) => void,
): Promise<{ deleted: number; archived: number; ignored: number; errors: number }> {
    let deleted = 0;
    let archived = 0;
    let ignored = 0;
    let errors = 0;

    const trashPath = normalizePath(trashFolderLocation || '.trash');

    // Ensure trash folder exists (only needed for archive action)
    const hasArchiveAction = items.some(i => i.action === 'archive');
    if (hasArchiveAction) {
        const trashExists = await app.vault.adapter.exists(trashPath);
        if (!trashExists) {
            await app.vault.createFolder(trashPath);
        }
    }

    for (const item of items) {
        try {
            const file = app.vault.getAbstractFileByPath(item.filePath);
            if (!(file instanceof TFile)) {
                errors++;
                continue;
            }

            if (item.action === 'ignore') {
                ignored++;
                continue;
            }

            if (item.action === 'delete') {
                // FileManager.trashFile respects the user's deletion preference
                // (system trash vs Obsidian's .trash folder) where available.
                await app.fileManager.trashFile(file);
                deleted++;
                continue;
            }

            if (item.action === 'archive') {
                const destPath = normalizePath(`${trashPath}/${item.fileName}`);
                // Handle name collision
                let finalDest = destPath;
                let counter = 1;
                while (await app.vault.adapter.exists(finalDest)) {
                    const baseName = item.fileName.replace(/\.md$/, '');
                    finalDest = normalizePath(`${trashPath}/${baseName} ${counter}.md`);
                    counter++;
                }
                await app.vault.rename(file, finalDest);
                archived++;
            }
        } catch (e) {
            console.error(`Safe sync error processing ${item.filePath}:`, e);
            errors++;
        }
    }

    return { deleted, archived, ignored, errors };
}
