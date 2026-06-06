import { requestUrl } from 'obsidian';

/**
 * Scraping Utilities for Make It Rain
 * ===================================
 *
 * This module provides utilities for extracting content from Raindrop.io's
 * permanent archives. It includes functions for fetching the archived HTML
 * and parsing it into clean, usable text for Obsidian notes.
 */

/**
 * Fetches the archived content from Raindrop.io for a specific bookmark.
 * This endpoint typically redirects to the actual stored file (e.g., on S3).
 *
 * @param raindropId - The unique ID of the raindrop bookmark
 * @param apiToken - The Raindrop.io API token for authentication
 * @returns A promise that resolves to the HTML content string, or null if fetch fails
 */
export async function fetchArchiveContent(raindropId: number, apiToken: string): Promise<string | null> {
    const url = `https://api.raindrop.io/rest/v1/raindrop/${raindropId}/cache`;

    try {
        const response = await requestUrl({
            url: url,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiToken}`
            }
        });

        if (response.status === 200) {
            return response.text;
        }

        console.warn(`Unexpected response status ${response.status} when fetching archive for raindrop ${raindropId}`);
        return null;
    } catch (error) {
        console.error(`Error fetching archive content for raindrop ${raindropId}:`, error);
        return null;
    }
}

/**
 * Extracts the main text content from an HTML string using DOMParser.
 * Heuristically identifies the main content area and removes noise like scripts and styles.
 *
 * @param html - The raw HTML string to parse
 * @returns The extracted and cleaned text content
 */
export function extractContentFromHtml(html: string): string {
    if (!html) return '';

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Remove script, style, and other non-content tags to reduce noise
        const toRemove = doc.querySelectorAll('script, style, nav, footer, header, noscript, iframe, svg, link');
        toRemove.forEach(el => el.remove());

        // Try to find the main content area using common semantic tags and class names
        const main = doc.querySelector('main, article, .content, .post, .article, #content, #main');
        const contentNode = main || doc.body;

        if (!contentNode) return '';

        // Get text content and clean it up
        let text = contentNode.textContent || '';

        // Clean up excessive whitespace and newlines
        // We normalize all whitespace to single spaces to get clean text
        text = text.replace(/\s+/g, ' ').trim();

        return text;
    } catch (error) {
        console.error('Error parsing HTML for content extraction:', error);
        return '';
    }
}
