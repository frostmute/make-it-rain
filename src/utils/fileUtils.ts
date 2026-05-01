import { App } from 'obsidian';

/**
 * File Utilities for Make It Rain
 * ==============================
 * 
 * This module provides file and folder manipulation utilities designed for Obsidian's vault system.
 * These functions implement a functional programming approach and handle common operations like:
 * - Checking if files/folders exist
 * - Creating folders and folder structures
 * - Sanitizing file names for compatibility
 * 
 * All functions are designed to be pure and predictable, with clear error handling and descriptive 
 * names that follow the verb-noun pattern for better readability.
 */

/**
 * Checks if a path exists in the Obsidian vault
 * 
 * @param app - The Obsidian App instance
 * @param path - The path to check (can be a file or folder)
 * @returns Promise resolving to true if the path exists, false otherwise
 * @example
 * ```typescript
 * if (await doesPathExist(app, "Notes/Raindrops")) {
 *   // Path exists, proceed...
 * }
 * ```
 */
export async function doesPathExist(app: App, path: string): Promise<boolean> {
    return app.vault.adapter.exists(path);
}

/**
 * Checks if a path is a folder in the Obsidian vault
 * @param app - The Obsidian App instance
 * @param path - The path to check
 * @returns True if the path is a folder, false otherwise
 */
export async function isPathAFolder(app: App, path: string): Promise<boolean> {
    const stat = await app.vault.adapter.stat(path);
    return stat?.type === 'folder';
}

/**
 * Creates a folder if it doesn't exist already
 * @param app - The Obsidian App instance
 * @param path - The path where to create the folder
 * @returns True if folder was created or already exists, throws error otherwise
 */
export async function createFolder(app: App, path: string): Promise<boolean> {
    const doesFolderExist = await doesPathExist(app, path);
    
    if (doesFolderExist) {
        const isFolder = await isPathAFolder(app, path);
        if (isFolder) return true;
        throw new Error(`Path exists but is not a folder: ${path}`);
    }
    
    try {
        await app.vault.createFolder(path);
        return true;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to create folder at ${path}: ${errorMessage}`);
    }
}

// eslint-disable-next-line no-control-regex -- Necessary to sanitize filenames from all possible control characters
const INVALID_CHARS_REGEX = /[\u0000-\u001F\u007F\u200B-\u200D\uFEFF/\\:*?"<>|#%&{}$!@'`+=[\]^]/g;

/** Known file extensions to strip from note titles to prevent e.g. "My Book.pdf.md" */
const KNOWN_FILE_EXTENSIONS = /\.(pdf|epub|mobi|azw3?|djvu|docx?|xlsx?|pptx?|odt|ods|odp|txt|rtf|csv|mp3|mp4|m4a|m4v|wav|ogg|flac|aac|mov|avi|mkv|webm|png|jpe?g|gif|webp|svg|bmp|tiff?|zip|rar|7z|tar|gz)$/i;

/**
 * Sanitizes a file name by removing invalid characters and stripping known
 * file extensions (e.g. ".pdf") so a title like "My Book.pdf" becomes
 * "My Book" rather than producing a note named "My Book.pdf.md".
 * @param fileName - The raw file name to sanitize
 * @returns A sanitized file name safe for file systems
 */
export function sanitizeFileName(fileName: string): string {
    const replacement = '';
    
    const isStringEmpty = !fileName || fileName.trim() === '';
    if (isStringEmpty) return "Unnamed_Raindrop";
    
    // Strip known file extensions from the title before sanitizing
    const withoutExt = fileName.replace(KNOWN_FILE_EXTENSIONS, '').trim() || fileName.trim();
    
    const sanitizedName = withoutExt.replace(INVALID_CHARS_REGEX, replacement).trim();
    const isSanitizedEmpty = !sanitizedName;
    
    // Enforce maximum length to avoid overly long file names
    const maxLength = 200;
    return (isSanitizedEmpty ? "Unnamed_Raindrop" : sanitizedName).substring(0, maxLength);
}

/**
 * Creates a folder structure recursively, creating parent folders as needed
 * @param app - The Obsidian App instance
 * @param fullPath - The full path to create
 * @returns True if the folder structure was created successfully
 */
export async function createFolderStructure(app: App, fullPath: string): Promise<boolean> {
    if (!fullPath || fullPath === '/') return true;
    
    try {
        const normalizedPath = fullPath.replace(/^\/+|\/+$/g, '');
        const pathSegments = normalizedPath.split('/');

        let currentPath = '';
        
        for (const segment of pathSegments) {
            currentPath = currentPath ? `${currentPath}/${segment}` : segment;

            const doesExist = await doesPathExist(app, currentPath);

            if (doesExist) {
                const isFolder = await isPathAFolder(app, currentPath);
                if (!isFolder) {
                    throw new Error(`Path exists but is not a folder: ${currentPath}`);
                }
            } else {
                await createFolder(app, currentPath);
            }
        }
        
        return true;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to create/verify folder: ${fullPath}. Error: ${errorMessage}.`);
    }
}
