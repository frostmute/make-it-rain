import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';

const targetVaultPath = '/Volumes/Storage/Obsidian Vaults/refactormute/.obsidian/plugins/make-it-rain';
const sourceFiles = [
    'main.js',
    'manifest.json',
    'styles.css'
];

// Create the target directory if it doesn't exist
if (!existsSync(targetVaultPath)) {
    mkdirSync(targetVaultPath, { recursive: true });
}

// Copy each file to the target vault
for (const file of sourceFiles) {
    const sourcePath = file;
    const targetPath = `${targetVaultPath}/${file}`;
    
    // Ensure the target directory exists
    const targetDir = dirname(targetPath);
    if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true });
    }
    
    try {
        copyFileSync(sourcePath, targetPath);
        console.log(`Copied ${file} to ${targetPath}`);
    } catch (error) {
        console.error(`Error copying ${file}:`, error);
    }
}
