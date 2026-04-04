const fs = require('fs');
let code = fs.readFileSync('src/utils/yamlUtils.ts', 'utf8');

// Update isPlainObject
code = code.replace(
    'return value !== null && typeof value === \'object\' && !Array.isArray(value);',
    'return value !== null && typeof value === \'object\' && !Array.isArray(value) && Object.prototype.toString.call(value) !== \'[object Date]\';'
);

// Update formatYamlValue signature and body
code = code.replace(
    'export function formatYamlValue(value: any, indentLevel: number = 0): string {',
    'export function formatYamlValue(value: any, indentLevel: number = 0, seen: Set<any> = new Set()): string {'
);

// We need to pass seen to recursive calls and check for circular references
code = code.replace(
    '    // Handle arrays\n    if (Array.isArray(value)) {\n        if (value.length === 0) {\n            return \'[]\';\n        }\n        \n        let result = \'\\n\';\n        for (const item of value) {\n            result += `${indent}- ${formatYamlValue(item, indentLevel + 1)}\\n`;\n        }\n        return result.trimEnd();\n    }',
    `    // Handle arrays
    if (Array.isArray(value)) {
        if (value.length === 0) {
            return '[]';
        }
        if (seen.has(value)) {
            return '"[Circular Reference]"';
        }
        seen.add(value);

        let result = '\\n';
        for (const item of value) {
            result += \`\${indent}- \${formatYamlValue(item, indentLevel + 1, seen)}\\n\`;
        }
        seen.delete(value);
        return result.trimEnd();
    }`
);

code = code.replace(
    '    // Handle objects\n    if (isPlainObject(value)) {\n        const keys = Object.keys(value);\n        if (keys.length === 0) {\n            return \'{}\';\n        }\n        \n        let result = \'\\n\';\n        for (const key of keys) {\n            const formattedValue = formatYamlValue(value[key], indentLevel + 1);\n            // If the formatted value starts with a newline, it\'s a complex value\n            if (formattedValue.startsWith(\'\\n\')) {\n                result += `${indent}${key}:${formattedValue}\\n`;\n            } else {\n                result += `${indent}${key}: ${formattedValue}\\n`;\n            }\n        }\n        return result.trimEnd();\n    }',
    `    // Handle objects
    if (isPlainObject(value)) {
        const keys = Object.keys(value);
        if (keys.length === 0) {
            return '{}';
        }
        if (seen.has(value)) {
            return '"[Circular Reference]"';
        }
        seen.add(value);

        let result = '\\n';
        for (const key of keys) {
            const formattedValue = formatYamlValue(value[key], indentLevel + 1, seen);
            // If the formatted value starts with a newline, it's a complex value
            if (formattedValue.startsWith('\\n')) {
                result += \`\${indent}\${key}:\${formattedValue}\\n\`;
            } else {
                result += \`\${indent}\${key}: \${formattedValue}\\n\`;
            }
        }
        seen.delete(value);
        return result.trimEnd();
    }`
);

fs.writeFileSync('src/utils/yamlUtils.ts', code);
console.log('Successfully patched src/utils/yamlUtils.ts');
