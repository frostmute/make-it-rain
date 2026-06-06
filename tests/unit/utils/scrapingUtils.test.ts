import { extractContentFromHtml, fetchArchiveContent } from '../../../src/utils/scrapingUtils';
import { requestUrl } from 'obsidian';

jest.mock('obsidian', () => ({
    requestUrl: jest.fn()
}), { virtual: true });

describe('scrapingUtils', () => {
    describe('fetchArchiveContent', () => {
        it('should fetch content successfully', async () => {
            (requestUrl as jest.Mock).mockResolvedValue({
                status: 200,
                text: '<html><body>Content</body></html>'
            });

            const result = await fetchArchiveContent(123, 'token');
            expect(result).toBe('<html><body>Content</body></html>');
            expect(requestUrl).toHaveBeenCalledWith(expect.objectContaining({
                url: 'https://api.raindrop.io/rest/v1/raindrop/123/cache',
                headers: {
                    'Authorization': 'Bearer token'
                }
            }));
        });

        it('should return null on non-200 status', async () => {
            (requestUrl as jest.Mock).mockResolvedValue({
                status: 404
            });

            const result = await fetchArchiveContent(123, 'token');
            expect(result).toBeNull();
        });

        it('should return null on error', async () => {
            (requestUrl as jest.Mock).mockRejectedValue(new Error('Network error'));

            const result = await fetchArchiveContent(123, 'token');
            expect(result).toBeNull();
        });
    });

    describe('extractContentFromHtml', () => {
        it('should extract text from a simple HTML string', () => {
            const html = '<html><body><p>Hello World</p></body></html>';
            const result = extractContentFromHtml(html);
            expect(result).toBe('Hello World');
        });

        it('should remove script and style tags', () => {
            const html = `
                <html>
                    <body>
                        <style>.red { color: red; }</style>
                        <script>alert("hello");</script>
                        <p>Real Content</p>
                    </body>
                </html>
            `;
            const result = extractContentFromHtml(html);
            expect(result).toBe('Real Content');
        });

        it('should prioritize main content area', () => {
            const html = `
                <html>
                    <body>
                        <header>Header</header>
                        <nav>Navigation</nav>
                        <main>
                            <article>
                                <h1>Article Title</h1>
                                <p>Article content.</p>
                            </article>
                        </main>
                        <footer>Footer</footer>
                    </body>
                </html>
            `;
            const result = extractContentFromHtml(html);
            // Since we remove header, nav, footer, it should mostly contain the article content
            expect(result).toContain('Article Title');
            expect(result).toContain('Article content.');
            expect(result).not.toContain('Header');
            expect(result).not.toContain('Navigation');
            expect(result).not.toContain('Footer');
        });

        it('should handle empty or null input', () => {
            expect(extractContentFromHtml('')).toBe('');
            // @ts-ignore
            expect(extractContentFromHtml(null)).toBe('');
        });

        it('should clean up whitespace', () => {
            const html = '<p>  Hello   \n\n  World  </p>';
            const result = extractContentFromHtml(html);
            expect(result).toBe('Hello World');
        });

        it('should handle complex nesting', () => {
            const html = `
                <div>
                    <div>
                        <p>Nested 1</p>
                    </div>
                    <p>Nested 2</p>
                </div>
            `;
            const result = extractContentFromHtml(html);
            expect(result).toContain('Nested 1');
            expect(result).toContain('Nested 2');
        });
    });
});
