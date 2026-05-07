/**
 * Secret Scanner
 * Scans the codebase for potential hardcoded secrets, API keys, and tokens.
 */
import fs from 'fs';
import path from 'path';

const IGNORED_DIRS = ['node_modules', '.git', 'build', 'dist', 'coverage'];
const IGNORED_FILES = ['package-lock.json', 'scripts/secret-scanner.mjs'];
const SECRET_PATTERNS = [
    {
        name: 'Generic Secret/Key/Token',
        pattern: /(api[_-]?key|secret|token|password|auth[_-]?key)\s*[:=]\s*["'][a-zA-Z0-9\-_]{16,}["']/i
    }
];

function scanDirectory(dir) {
    let findings = 0;
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (IGNORED_DIRS.includes(file) || IGNORED_FILES.some(ignored => fullPath.endsWith(ignored))) {
            continue;
        }

        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            findings += scanDirectory(fullPath);
        } else {
            try {
                const content = fs.readFileSync(fullPath, 'utf8');
                for (const { name, pattern } of SECRET_PATTERNS) {
                    if (pattern.test(content)) {
                        console.warn(`[!] Potential ${name} found in: ${fullPath}`);
                        findings++;
                    }
                }
            } catch (err) {
                // Skip files that cannot be read as text
            }
        }
    }
    return findings;
}

console.log('Starting secret scan...');
const totalFindings = scanDirectory('.');

if (totalFindings > 0) {
    console.error(`\n[FAIL] Scan complete: ${totalFindings} potential secrets found.`);
    console.error('Please remove hardcoded secrets before committing.');
    process.exit(1);
} else {
    console.log('\n[PASS] Scan complete: No secrets found.');
    process.exit(0);
}
