import { readFileSync, writeFileSync } from 'fs';

const targetVersion = process.env.npm_package_version;

// Read minAppVersion from manifest.json and bump version to target version
let manifest = JSON.parse(readFileSync('build/manifest.json', 'utf8'));
const { minAppVersion } = manifest;
manifest.version = targetVersion;
writeFileSync('build/manifest.json', JSON.stringify(manifest, null, '\t') + '\n');

// Update versions.json with targetVersion and minAppVersion
let versions = JSON.parse(readFileSync('versions.json', 'utf8'));
versions[targetVersion] = minAppVersion;
writeFileSync('versions.json', JSON.stringify(versions, null, '\t') + '\n');

console.log(`Version bumped to ${targetVersion} in build/manifest.json and versions.json`);
