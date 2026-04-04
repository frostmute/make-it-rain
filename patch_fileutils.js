const fs = require('fs');
let code = fs.readFileSync('src/utils/fileUtils.ts', 'utf8');

const originalCreateFolderStructure = `export async function createFolderStructure(app: App, fullPath: string): Promise<boolean> {
    if (!fullPath || fullPath === '/') return true;

    try {
        const doesExist = await doesPathExist(app, fullPath);
        if (doesExist) {
            const isFolder = await isPathAFolder(app, fullPath);
            if (isFolder) return true;
            throw new Error(\`Path exists but is not a folder: \${fullPath}\`);
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
        throw new Error(\`Failed to create/verify folder: \${fullPath}. Error: \${errorMessage}.\`);
    }
}`;

const newCreateFolderStructure = `export async function createFolderStructure(app: App, fullPath: string): Promise<boolean> {
    if (!fullPath || fullPath === '/') return true;

    try {
        const normalizedPath = fullPath.replace(/^\\/+|\\/+$/g, '');
        const pathSegments = normalizedPath.split('/');

        let currentPath = '';

        for (const segment of pathSegments) {
            currentPath = currentPath ? \`\${currentPath}/\${segment}\` : segment;

            const doesExist = await doesPathExist(app, currentPath);

            if (doesExist) {
                const isFolder = await isPathAFolder(app, currentPath);
                if (!isFolder) {
                    throw new Error(\`Path exists but is not a folder: \${currentPath}\`);
                }
            } else {
                await createFolder(app, currentPath);
            }
        }

        return true;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(\`Failed to create/verify folder: \${fullPath}. Error: \${errorMessage}.\`);
    }
}`;

code = code.replace(originalCreateFolderStructure, newCreateFolderStructure);
fs.writeFileSync('src/utils/fileUtils.ts', code);
console.log('Successfully patched src/utils/fileUtils.ts');
