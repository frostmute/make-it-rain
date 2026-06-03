import { requestUrl, htmlToMarkdown } from 'obsidian';

/**
 * Scraping Utilities for Make It Rain
 * ===================================
 *
 * Fetches and converts Raindrop.io permanent archive content into clean Markdown
 * for use in Obsidian notes via the {{scrapedContent}} template variable.
 *
 * Design decisions:
 * - We rely on Raindrop's own `/cache` endpoint rather than scraping live URLs.
 *   Raindrop already archived the page; our job is just to read what they stored.
 * - HTML → Markdown conversion is handled by Obsidian's native `htmlToMarkdown()`.
 *   This is the same function used by the official Obsidian Importer plugin and is
 *   actively maintained by the Obsidian team. It handles a far wider range of
 *   real-world HTML than any hand-rolled selector/strip approach.
 * - The `/cache` endpoint typically returns HTTP 303 (redirect to S3). We handle
 *   this by following the Location header manually with a second request, since
 *   Obsidian's `requestUrl` redirect behaviour is inconsistent across platforms.
 */

/**
 * Fetches the archived HTML content from Raindrop.io for a specific bookmark.
 *
 * The `/cache` endpoint returns a 303 redirect to the actual stored file (S3).
 * We follow that redirect manually to ensure consistent cross-platform behaviour,
 * since Obsidian's `requestUrl` does not always follow redirects on all platforms.
 *
 * @param raindropId - The unique ID of the raindrop bookmark
 * @param apiToken   - The Raindrop.io API token for authentication
 * @returns The raw HTML string, or null if the fetch fails
 */
export async function fetchArchiveContent(raindropId: number, apiToken: string): Promise<string | null> {
    const cacheUrl = `https://api.raindrop.io/rest/v1/raindrop/${raindropId}/cache`;

    try {
        // First request to the Raindrop cache endpoint.
        // This typically returns 303 with a Location header pointing to S3.
        const firstResponse = await requestUrl({
            url: cacheUrl,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiToken}`
            }
        });

        // Success on the first hop (redirect was followed automatically).
        if (firstResponse.status >= 200 && firstResponse.status < 300) {
            const text = firstResponse.text;
            if (text && text.trim().length > 0) {
                return text;
            }
            console.warn(`Empty response body for raindrop ${raindropId} (status ${firstResponse.status})`);
            return null;
        }

        // 303 / 3xx: manually follow the Location header.
        if (firstResponse.status >= 300 && firstResponse.status < 400) {
            const location = firstResponse.headers?.['location'] || firstResponse.headers?.['Location'];
            if (!location) {
                console.warn(`Redirect received for raindrop ${raindropId} but no Location header found`);
                return null;
            }

            const redirectResponse = await requestUrl({
                url: location,
                method: 'GET'
                // No Authorization header for the S3 redirect — it uses its own signed URL
            });

            if (redirectResponse.status >= 200 && redirectResponse.status < 300) {
                const text = redirectResponse.text;
                if (text && text.trim().length > 0) {
                    return text;
                }
                console.warn(`Empty body after redirect for raindrop ${raindropId}`);
                return null;
            }

            console.warn(`Redirect target returned status ${redirectResponse.status} for raindrop ${raindropId}`);
            return null;
        }

        console.warn(`Unexpected status ${firstResponse.status} fetching archive for raindrop ${raindropId}`);
        return null;

    } catch (error) {
        // Log but don't throw — a failed scrape should not halt the whole import
        console.error(`Error fetching archive content for raindrop ${raindropId}:`, error);
        return null;
    }
}

/**
 * Converts an HTML string to clean Markdown using Obsidian's native `htmlToMarkdown`.
 *
 * Why this approach:
 * - `htmlToMarkdown` is built into Obsidian and used by the official Obsidian Importer.
 *   It handles a wide variety of real-world HTML structures without needing a hardcoded
 *   list of CSS selectors or aggressive element stripping.
 * - The old approach (strip elements + querySelector for 'main, article, .content...' +
 *   collapse all whitespace to a single line) failed silently for most modern sites and
 *   produced unreadable walls of text for the ones it did handle.
 * - We do a light pre-pass to remove elements that produce noise (script, style, nav,
 *   footer, etc.) before handing off to htmlToMarkdown, so the output stays clean.
 *
 * @param html - Raw HTML string from the Raindrop cache
 * @returns Clean Markdown string, or empty string if input is empty or parsing fails
 */
export function extractContentFromHtml(html: string): string {
    if (!html || html.trim().length === 0) return '';

    try {
        // Light pre-pass: remove noisy non-content elements before conversion.
        // We do this in the raw HTML string rather than via DOMParser to keep
        // this function usable in both browser and test environments.
        const cleaned = removeNoisyElements(html);

        // Delegate to Obsidian's native converter — same one used by Obsidian Importer.
        const markdown = htmlToMarkdown(cleaned);

        // Trim leading/trailing whitespace; collapse 3+ consecutive blank lines to 2.
        return markdown
            .trim()
            .replace(/\n{3,}/g, '\n\n');

    } catch (error) {
        console.error('Error converting HTML to Markdown:', error);
        return '';
    }
}

/**
 * Removes common noisy elements from an HTML string via simple regex replacement.
 * This avoids a full DOMParser round-trip and works in all environments.
 *
 * Elements removed: script, style, noscript, nav, footer, aside, iframe, svg
 *
 * @param html - Raw HTML string
 * @returns HTML string with noisy elements removed
 */
function removeNoisyElements(html: string): string {
    const noiseTags = ['script', 'style', 'noscript', 'nav', 'footer', 'aside', 'iframe', 'svg'];
    let result = html;
    for (const tag of noiseTags) {
        // Remove opening tag through closing tag (including multiline content)
        const pattern = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi');
        result = result.replace(pattern, '');
    }
    return result;
}
