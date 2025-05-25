import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

// Get the target version from npm version command or use current package version
const targetVersion = process.env.npm_package_version;

if (!targetVersion) {
    console.error("No target version specified!");
    process.exit(1);
}

console.log(`Updating to version ${targetVersion}...`);

// Update manifest.json
let manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const { minAppVersion } = manifest;
manifest.version = targetVersion;
writeFileSync("manifest.json", JSON.stringify(manifest, null, "\t"));
console.log("✓ Updated manifest.json");

// Update versions.json
let versions = JSON.parse(readFileSync("versions.json", "utf8"));
versions[targetVersion] = minAppVersion;
writeFileSync("versions.json", JSON.stringify(versions, null, "\t"));
console.log("✓ Updated versions.json");

// Update CHANGELOG.md
let changelog = readFileSync("CHANGELOG.md", "utf8");
const today = new Date().toISOString().split('T')[0];

// Replace [Unreleased] with the new version
changelog = changelog.replace(
    "## [Unreleased]",
    `## [Unreleased]\n\n## [${targetVersion}] - ${today}`
);

writeFileSync("CHANGELOG.md", changelog);
console.log("✓ Updated CHANGELOG.md");

// Generate release notes for GitHub
const releaseNotes = changelog
    .split(`## [${targetVersion}]`)[1]
    .split("## ")[0]
    .trim();

const releaseNotesFile = `release-notes-${targetVersion}.md`;
writeFileSync(releaseNotesFile, `# Release Notes for Make It Rain v${targetVersion}

${releaseNotes}

## Technical Details
- Updated to version ${targetVersion}
- Minimum Obsidian version required: ${minAppVersion}

## Installation
1. Download the latest release from the Releases page
2. Extract the plugin to your vault's plugins folder
3. Enable the plugin in Obsidian's settings

## Support
If you encounter any issues, please report them on our GitHub repository.

Thank you for using Make It Rain!`);

console.log(`✓ Generated release notes in ${releaseNotesFile}`);

// Create git commit
try {
    // Stage the changed files
    execSync('git add manifest.json versions.json CHANGELOG.md');
    execSync(`git commit -m "chore: bump version to ${targetVersion}"`);
    console.log("✓ Created version commit");
    
    // Create git tag
    execSync(`git tag -a "v${targetVersion}" -m "Release version ${targetVersion}"`);
    console.log(`✓ Created git tag v${targetVersion}`);
    
    console.log("\nNext steps:");
    console.log("1. Review the changes");
    console.log("2. Push the changes: git push origin main --tags");
    console.log(`3. Create a GitHub release using ${releaseNotesFile}`);
} catch (error) {
    console.error("Failed to create git commit/tag:", error.message);
    console.log("Please commit the changes manually.");
} 