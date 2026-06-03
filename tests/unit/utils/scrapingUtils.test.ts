import { extractContentFromHtml, fetchArchiveContent } from '../../../src/utils/scrapingUtils';
import { requestUrl, htmlToMarkdown } from 'obsidian';

jest.mock('obsidian', () => ({
    requestUrl: jest.fn(),
    // Lightweight stand-in for Obsidian's htmlToMarkdown in the Node/Jest environment.
    // The real implementation runs inside Obsidian; here we do a minimal conversion
    // that's good enough to verify our wrapper logic is correct.
    htmlToMarkdown: jest.fn((html: string) => {
        return html
            // headings
            .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
            .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
            .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
            // paragraphs and breaks
            .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n')
            .replace(/<br\s*\/?>/gi, '\n')
            // bold / italic
            .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
            .replace(/<em[^>]*>(.*?)<\/em>/gi, '_$1_')
            // list items
            .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n')
            // strip remaining tags
            .replace(/<[^>]+>/g, '')
            // normalise whitespace
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    })
}), { virtual: true });

// ---------------------------------------------------------------------------
// fetchArchiveContent
// ---------------------------------------------------------------------------
describe('fetchArchiveContent', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns HTML when the first request succeeds with 200', async () => {
        (requestUrl as jest.Mock).mockResolvedValue({
            status: 200,
            text: '<html><body><p>Content</p></body></html>',
            headers: {}
        });

        const result = await fetchArchiveContent(123, 'token');
        expect(result).toBe('<html><body><p>Content</p></body></html>');
        expect(requestUrl).toHaveBeenCalledTimes(1);
        expect(requestUrl).toHaveBeenCalledWith(expect.objectContaining({
            url: 'https://api.raindrop.io/rest/v1/raindrop/123/cache',
            headers: { 'Authorization': 'Bearer token' }
        }));
    });

    it('follows a 303 redirect to the Location URL', async () => {
        (requestUrl as jest.Mock)
            .mockResolvedValueOnce({
                status: 303,
                text: '',
                headers: { location: 'https://s3.example.com/cached-page.html' }
            })
            .mockResolvedValueOnce({
                status: 200,
                text: '<html><body><p>Redirected content</p></body></html>',
                headers: {}
            });

        const result = await fetchArchiveContent(456, 'token');
        expect(result).toBe('<html><body><p>Redirected content</p></body></html>');
        expect(requestUrl).toHaveBeenCalledTimes(2);
        // Second call must NOT include the Authorization header (S3 signed URL)
        expect(requestUrl).toHaveBeenNthCalledWith(2, expect.objectContaining({
            url: 'https://s3.example.com/cached-page.html'
        }));
        const secondCall = (requestUrl as jest.Mock).mock.calls[1][0];
        expect(secondCall.headers).toBeUndefined();
    });

    it('returns null when redirect has no Location header', async () => {
        (requestUrl as jest.Mock).mockResolvedValue({
            status: 303,
            text: '',
            headers: {}
        });

        const result = await fetchArchiveContent(789, 'token');
        expect(result).toBeNull();
    });

    it('returns null when the redirect target returns a non-2xx status', async () => {
        (requestUrl as jest.Mock)
            .mockResolvedValueOnce({
                status: 303,
                text: '',
                headers: { location: 'https://s3.example.com/missing.html' }
            })
            .mockResolvedValueOnce({
                status: 404,
                text: '',
                headers: {}
            });

        const result = await fetchArchiveContent(101, 'token');
        expect(result).toBeNull();
    });

    it('returns null on a non-2xx, non-3xx status', async () => {
        (requestUrl as jest.Mock).mockResolvedValue({
            status: 404,
            text: '',
            headers: {}
        });

        const result = await fetchArchiveContent(123, 'token');
        expect(result).toBeNull();
    });

    it('returns null when the response body is empty even on 200', async () => {
        (requestUrl as jest.Mock).mockResolvedValue({
            status: 200,
            text: '   ',
            headers: {}
        });

        const result = await fetchArchiveContent(123, 'token');
        expect(result).toBeNull();
    });

    it('returns null on network error', async () => {
        (requestUrl as jest.Mock).mockRejectedValue(new Error('Network error'));

        const result = await fetchArchiveContent(123, 'token');
        expect(result).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// extractContentFromHtml
// ---------------------------------------------------------------------------
describe('extractContentFromHtml', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns empty string for empty input', () => {
        expect(extractContentFromHtml('')).toBe('');
    });

    it('returns empty string for whitespace-only input', () => {
        expect(extractContentFromHtml('   \n  ')).toBe('');
    });

    // @ts-ignore
    it('returns empty string for null input', () => {
        // @ts-ignore
        expect(extractContentFromHtml(null)).toBe('');
    });

    it('delegates to htmlToMarkdown with the cleaned HTML', () => {
        const html = '<p>Hello World</p>';
        extractContentFromHtml(html);
        expect(htmlToMarkdown).toHaveBeenCalledWith(html);
    });

    it('strips script tags before passing to htmlToMarkdown', () => {
        const html = '<script>alert("xss")</script><p>Real content</p>';
        extractContentFromHtml(html);
        const received = (htmlToMarkdown as jest.Mock).mock.calls[0][0];
        expect(received).not.toContain('<script>');
        expect(received).toContain('<p>Real content</p>');
    });

    it('strips style tags before passing to htmlToMarkdown', () => {
        const html = '<style>.foo { color: red }</style><p>Article</p>';
        extractContentFromHtml(html);
        const received = (htmlToMarkdown as jest.Mock).mock.calls[0][0];
        expect(received).not.toContain('<style>');
    });

    it('strips nav, footer, and aside before passing to htmlToMarkdown', () => {
        const html = '<nav>Menu</nav><article><p>Content</p></article><footer>Footer</footer><aside>Sidebar</aside>';
        extractContentFromHtml(html);
        const received = (htmlToMarkdown as jest.Mock).mock.calls[0][0];
        expect(received).not.toContain('<nav>');
        expect(received).not.toContain('<footer>');
        expect(received).not.toContain('<aside>');
        expect(received).toContain('<article>');
    });

    it('returns the Markdown output from htmlToMarkdown', () => {
        const html = '<h1>Title</h1><p>Paragraph.</p>';
        const result = extractContentFromHtml(html);
        // Our mock htmlToMarkdown converts these → '# Title\nParagraph.'
        expect(result).toContain('# Title');
        expect(result).toContain('Paragraph.');
    });

    it('collapses excess blank lines in the output', () => {
        // Mock returns content with triple newlines
        (htmlToMarkdown as jest.Mock).mockReturnValueOnce('Line 1\n\n\n\nLine 2');
        const result = extractContentFromHtml('<p>anything</p>');
        expect(result).toBe('Line 1\n\nLine 2');
    });

    it('returns empty string if htmlToMarkdown throws', () => {
        (htmlToMarkdown as jest.Mock).mockImplementationOnce(() => { throw new Error('parse error'); });
        const result = extractContentFromHtml('<p>oops</p>');
        expect(result).toBe('');
    });
});
