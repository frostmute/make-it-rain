import { Notice } from 'obsidian';

/**
 * YAML Utilities for Make It Rain
 * ==============================
 * 
 * This module provides utilities for safely creating YAML frontmatter in Markdown files.
 * These functions handle proper escaping and formatting of various data types to ensure
 * valid YAML is generated regardless of input content.
 */

/**
 * Type guard to check if a value is a plain object
 * 
 * @param value - Value to check
 * @returns True if the value is a plain object (not null, not an array)
 */
export function isPlainObject(value: any): value is Record<string, any> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Formats a JavaScript value as a YAML string with proper escaping
 * 
 * @param value - The value to format as YAML
 * @param indentLevel - Current indentation level (for nested structures)
 * @returns Properly formatted and escaped YAML string
 */
export function formatYamlValue(value: any, indentLevel: number = 0): string {
    const indent = '  '.repeat(indentLevel);
    
    // Handle null/undefined
    if (value === null || value === undefined) {
        return 'null';
    }
    
    // Handle booleans
    if (typeof value === 'boolean') {
        return value ? 'true' : 'false';
    }
    
    // Handle numbers
    if (typeof value === 'number') {
        return value.toString();
    }
    
    // Handle strings - the most common case
    if (typeof value === 'string') {
        // Check if the string needs special handling
        if (
            value.includes('\n') || 
            value.includes(':') || 
            value.includes('{') || 
            value.includes('}') ||
            value.includes('[') ||
            value.includes(']') ||
            value.includes('#') ||
            value.includes('*') ||
            value.includes('&') ||
            value.includes('!') ||
            value.includes('|') ||
            value.includes('>') ||
            value.includes('`') ||
            value.trim() === '' ||
            /^[0-9]/.test(value) || // Starts with number
            /^true$|^false$|^yes$|^no$|^on$|^off$/i.test(value) // Looks like a boolean
        ) {
            // If the string contains newlines, use the block scalar syntax
            if (value.includes('\n')) {
                // Use the literal block scalar (|) for preserving line breaks
                let result = '|\n';
                const lines = value.split('\n');
                for (const line of lines) {
                    // Add two more spaces for the block indentation
                    result += `${indent}  ${line}\n`;
                }
                return result.trimEnd();
            }
            
            // Otherwise use quoted string with escaping
            return `"${escapeYamlString(value)}"`;
        }
        
        // For simple strings, no quotes needed
        return value;
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
        if (value.length === 0) {
            return '[]';
        }
        
        let result = '\n';
        for (const item of value) {
            result += `${indent}- ${formatYamlValue(item, indentLevel + 1)}\n`;
        }
        return result.trimEnd();
    }
    
    // Handle objects
    if (isPlainObject(value)) {
        const keys = Object.keys(value);
        if (keys.length === 0) {
            return '{}';
        }
        
        let result = '\n';
        for (const key of keys) {
            const formattedValue = formatYamlValue(value[key], indentLevel + 1);
            // If the formatted value starts with a newline, it's a complex value
            if (formattedValue.startsWith('\n')) {
                result += `${indent}${key}:${formattedValue}\n`;
            } else {
                result += `${indent}${key}: ${formattedValue}\n`;
            }
        }
        return result.trimEnd();
    }
    
    // Fallback for any other types
    try {
        return JSON.stringify(value);
    } catch (error) {
        console.error("Error formatting YAML value:", error);
        return `"Error formatting value"`;
    }
}

/**
 * Escapes special characters in a string for YAML
 * 
 * @param str - String to escape
 * @returns Escaped string safe for YAML
 */
export function escapeYamlString(str: string): string {
    return str
        .replace(/\\/g, '\\\\') // Escape backslashes first
        .replace(/"/g, '\\"')   // Escape double quotes
        .replace(/\t/g, '\\t')  // Escape tabs
        .replace(/\r/g, '\\r'); // Escape carriage returns
    // Note: We don't escape newlines because they're handled separately
}

/**
 * Creates a YAML frontmatter section for a Markdown file
 * 
 * @param data - Object containing the frontmatter data
 * @returns Formatted YAML frontmatter as a string
 */
export function createYamlFrontmatter(data: Record<string, any>): string {
    try {
        let frontmatter = '---\n';
        
        for (const [key, value] of Object.entries(data)) {
            const formattedValue = formatYamlValue(value);
            // If the formatted value starts with a newline, it's a complex value
            if (formattedValue.startsWith('\n')) {
                frontmatter += `${key}:${formattedValue}\n`;
            } else {
                frontmatter += `${key}: ${formattedValue}\n`;
            }
        }
        
        frontmatter += '---\n\n';
        return frontmatter;
    } catch (error) {
        console.error("Error creating YAML frontmatter:", error);
        new Notice("Error creating note frontmatter. Check console for details.");
        return '---\ntitle: "Error creating frontmatter"\n---\n\n';
    }
}
