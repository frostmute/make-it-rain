/**
 * Format Utilities for Make It Rain
 */

export function formatDate(date: string): string {
    try {
        return new Date(date).toLocaleDateString();
    } catch {
        return '';
    }
}

export function formatDateISO(date: string): string {
    try {
        return new Date(date).toISOString();
    } catch {
        return '';
    }
}

export function formatTags(tags: string[]): string {
    return tags.map(tag => `#${tag.trim()}`).join(' ');
}

export function getDomain(url: string): string {
    try {
        return new URL(url).hostname;
    } catch {
        return '';
    }
}

export function raindropType(type: string): string {
    const types = {
        link: 'web link',
        article: 'article',
        image: 'image',
        video: 'video',
        document: 'document',
        audio: 'audio',
        book: 'book'
    };
    return types[type as keyof typeof types] || type;
}

/**
 * Escapes special characters in a string for use in a regular expression
 * @param str - The string to escape
 * @returns The escaped string
 */
export function escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function toUppercase(str: string): string {
    return str.toUpperCase();
}

export function toLowercase(str: string): string {
    return str.toLowerCase();
}

export function toTitleCase(str: string): string {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
}

export function truncateString(str: string, length: number): string {
    if (str.length <= length) return str;
    return str.slice(0, length) + '...';
}
