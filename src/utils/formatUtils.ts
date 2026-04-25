
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
        link: 'Web Link',
        article: 'Article',
        image: 'Image',
        video: 'Video',
        document: 'Document',
        audio: 'Audio',
        book: 'Book'
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
