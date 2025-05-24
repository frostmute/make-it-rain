import { App } from 'obsidian';

/**
 * Checks if a path exists in the Obsidian vault
 * @param app - The Obsidian App instance
 * @param path - The path to check
 * @returns True if the path exists, false otherwise
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

/**
 * Sanitizes a file name by removing invalid characters
 * @param fileName - The raw file name to sanitize
 * @returns A sanitized file name safe for file systems
 */
export function sanitizeFileName(fileName: string): string {
    const invalidChars = /[/\\:*?"<>|#%&{}$!@'`+=]/g;
    const replacement = '';
    
    // Use meaningful variable names with auxiliary verbs
    const isStringEmpty = !fileName || fileName.trim() === '';
    if (isStringEmpty) return "Unnamed_Raindrop";
    
    const sanitizedName = fileName.replace(invalidChars, replacement).trim();
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
        const doesExist = await doesPathExist(app, fullPath);
        if (doesExist) {
            const isFolder = await isPathAFolder(app, fullPath);
            if (isFolder) return true;
            throw new Error(`Path exists but is not a folder: ${fullPath}`);
        }
        
        // Create parent directory first
        const lastSlashIndex = fullPath.lastIndexOf('/');
        if (lastSlashIndex > 0) {
            const parentPath = fullPath.substring(0, lastSlashIndex);
            await createFolderStructure(app, parentPath);
        }
        
        // Now create this folder
        await createFolder(app, fullPath);
        return true;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to create/verify folder: ${fullPath}. Error: ${errorMessage}.`);
    }
}
