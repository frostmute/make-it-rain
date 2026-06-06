/**
 * Security utilities for Make It Rain
 */

/**
 * Sanitizes markdown content to prevent XSS and arbitrary code execution
 * when rendered in Obsidian. It preserves intended Markdown formatting
 * but neutralizes dangerous HTML, scripts, and plugin-specific executable blocks.
 *
 * @param content The raw string content to sanitize
 * @returns Sanitized string safe to render in Obsidian
 */
const EXECUTABLE_BLOCKS = [
    'dataviewjs', 'dataview', 'templater', 'js', 'javascript',
    'ts', 'typescript', 'button', 'meta-bind', 'tracker', 'charts',
    'obsidian-js', 'dv'
];
const BLOCKS_PATTERN = EXECUTABLE_BLOCKS.join('|');
const BLOCK_REGEX = new RegExp(`\`\`\`(${BLOCKS_PATTERN})`, 'gi');

const DANGEROUS_TAGS = [
    'meta', 'base', 'link', 'form', 'button', 'input', 'select', 'textarea', 'svg', 'math'
];
const DANGEROUS_TAGS_PATTERN = DANGEROUS_TAGS.join('|');
const DANGEROUS_TAGS_REGEX = new RegExp(`<(?:\\/\\s*)?(?:${DANGEROUS_TAGS_PATTERN})(?:\\s+[^>]*)?>`, 'gi');

export function sanitizeMarkdownContent(content: unknown): string {
    if (typeof content !== 'string') {
        if (content === null || content === undefined) return '';
        return typeof content === 'object' ? JSON.stringify(content) : String(content);
    }

    let sanitized = content;

    // 1. Prevent execution of active code blocks (e.g. dataview, templater, inline scripts)
    // We prefix the language name with a zero-width space (\u200B) to break the trigger
    sanitized = sanitized.replace(BLOCK_REGEX, '```\u200B$1');

    // 2. Neutralize inline execution engines (Templater, Dataview inline, etc.)
    // Templater: <% ... %>
    sanitized = sanitized.replace(/<%/g, '&lt;%').replace(/%>/g, '%&gt;');
    // Dataview inline: `= ...` or `$= ...`
    sanitized = sanitized.replace(/`\$=/g, '`$\u200B=');
    sanitized = sanitized.replace(/`=/g, '`\u200B=');

    // 3. Strip out entirely dangerous HTML tags (including their content where possible)
    sanitized = sanitized.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
    sanitized = sanitized.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
    sanitized = sanitized.replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, '');
    sanitized = sanitized.replace(/<object\b[^>]*>[\s\S]*?<\/object>/gi, '');
    sanitized = sanitized.replace(/<embed\b[^>]*>[\s\S]*?<\/embed>/gi, '');
    sanitized = sanitized.replace(/<applet\b[^>]*>[\s\S]*?<\/applet>/gi, '');

    // Strip out remaining dangerous HTML tags (self-closing or empty)
    sanitized = sanitized.replace(DANGEROUS_TAGS_REGEX, '');

    // 4. Remove inline event handlers (onerror, onclick, etc.) from ANY remaining HTML tags
    sanitized = sanitized.replace(/\bon[a-z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');

    // 5. Neutralize dangerous URL protocols in markdown links/images and HTML attributes
    // We add a backslash to break the protocol while keeping it readable in markdown
    sanitized = sanitized.replace(/(javascript|vbscript|data)\s*:/gi, '$1\\:');

    // Handle HTML entities that might try to bypass the above (e.g. javascript&#58;)
    // We do a simple pass to decode basic entities and then check for dangerous protocols
    // If we decode it and it matches a dangerous protocol, we replace the whole entity string with ''
    sanitized = sanitized.replace(/(javascript|vbscript|data)(?:&#[0-9]+;|&#x[0-9a-fA-F]+;|&[a-zA-Z]+;)/gi, (match) => {
        const decoded = decodeHTMLEntity(match);
        if (/(javascript|vbscript|data)\s*:/i.test(decoded)) {
            return match.replace(/(&#[0-9]+;|&#x[0-9a-fA-F]+;|&[a-zA-Z]+;)/, ''); // Drop the entity
        }
        return match;
    });

    return sanitized;
}

const NAMED_ENTITIES = [
    { key: '&colon;', val: ':', regex: /&colon;/ig },
    { key: '&tab;', val: '\t', regex: /&tab;/ig },
    { key: '&newline;', val: '\n', regex: /&newline;/ig }
];

/**
 * Helper to do basic HTML entity decoding for security checks.
 */
function decodeHTMLEntity(entity: string): string {
    const hexMatch = entity.match(/&#x([0-9a-fA-F]+);/i);
    if (hexMatch) return entity.replace(/&#x[0-9a-fA-F]+;/i, String.fromCharCode(parseInt(hexMatch[1], 16)));

    const decMatch = entity.match(/&#([0-9]+);/);
    if (decMatch) return entity.replace(/&#[0-9]+;/, String.fromCharCode(parseInt(decMatch[1], 10)));

    const lowerEntity = entity.toLowerCase();
    for (const { key, val, regex } of NAMED_ENTITIES) {
        if (lowerEntity.includes(key)) {
            return entity.replace(regex, val);
        }
    }

    return entity;
}
