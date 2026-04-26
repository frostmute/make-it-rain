import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';

const targetVaultPath = '/home/frost/Endeavor/.obsidian/plugins/make-it-rain/';
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
    // Try build directory first, then root
    let sourcePath = `build/${file}`;
    if (!existsSync(sourcePath)) {
        sourcePath = file;
    }
    
    if (!existsSync(sourcePath)) {
        console.error(`Error: Source file ${file} not found in build/ or root.`);
        continue;
    }

    const targetPath = `${targetVaultPath}${file}`;
    
    // Ensure the target directory exists
    const targetDir = dirname(targetPath);
    if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true });
    }
    
    try {
        copyFileSync(sourcePath, targetPath);
        console.log(`Copied ${file} (from ${sourcePath}) to ${targetPath}`);
    } catch (error) {
        console.error(`Error copying ${file}:`, error);
    }
}
