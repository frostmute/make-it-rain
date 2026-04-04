const fs = require('fs');
let code = fs.readFileSync('tests/unit/utils/fileUtils.test.ts', 'utf8');

code = code.replace(
    /mockApp\.vault\.adapter\.exists\.mockResolvedValue\(true\);\s+mockApp\.vault\.adapter\.stat\.mockResolvedValue\(\{ type: 'file' \}\);/,
    `mockApp.vault.adapter.exists.mockImplementation(async (path: string) => path === 'some' || path === 'some/file.md');
            mockApp.vault.adapter.stat.mockImplementation(async (path: string) => path === 'some' ? { type: 'folder' } : { type: 'file' });`
);

fs.writeFileSync('tests/unit/utils/fileUtils.test.ts', code);
console.log('Successfully patched tests/unit/utils/fileUtils.test.ts');
