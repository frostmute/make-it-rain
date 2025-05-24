import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VAULT_PATH = '/Volumes/Storage/Obsidian Vaults/venturamute/.obsidian/plugins/make-it-rain';
const PLUGIN_FILES = [
    'main.js',
    'manifest.json',
    'styles.css'
];

async function copyPluginFiles() {
    try {
        // Ensure the vault plugin directory exists
        await fs.mkdir(VAULT_PATH, { recursive: true });

        // Copy each plugin file
        for (const file of PLUGIN_FILES) {
            const srcPath = path.join(__dirname, file);
            const destPath = path.join(VAULT_PATH, file);
            
            // Copy the file
            await fs.copyFile(srcPath, destPath);
            console.log(`Copied ${file} to vault`);
        }

        console.log('Plugin files copied successfully!');
    } catch (error) {
        console.error('Error copying plugin files:', error);
        process.exit(1);
    }
}

// Run the copy operation
await copyPluginFiles();
