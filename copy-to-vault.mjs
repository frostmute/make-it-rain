import fs from 'fs';
import path from 'path';

const vaultPluginsDir = '/Volumes/Storage/Obsidian Vaults/venturamute/.obsidian/plugins';
const pluginName = 'make-it-rain';

const filesToCopy = [
  'main.js',
  'manifest.json',
  'styles.css'
];

console.log('Copying plugin files to Obsidian vault...');

filesToCopy.forEach(file => {
  const sourcePath = path.join(process.cwd(), file);
  const destPath = path.join(vaultPluginsDir, pluginName, file);
  
  try {
    // Ensure destination directory exists
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    
    // Copy the file
    fs.copyFileSync(sourcePath, destPath);
    console.log(`Copied ${file} to ${destPath}`);
  } catch (error) {
    console.error(`Error copying ${file}:`, error.message);
  }
});

console.log('Plugin files copied successfully!');
