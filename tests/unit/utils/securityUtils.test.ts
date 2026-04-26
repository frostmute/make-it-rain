import { sanitizeMarkdownContent } from '../../../src/utils/securityUtils';

describe('securityUtils', () => {
    describe('sanitizeMarkdownContent', () => {
        it('should neutralize executable code blocks', () => {
            const input = '```dataview\nfoo\n```\n```javascript\nbar\n```';
            const expected = '```\u200Bdataview\nfoo\n```\n```\u200Bjavascript\nbar\n```';
            expect(sanitizeMarkdownContent(input)).toBe(expected);
        });

        it('should neutralize inline execution engines', () => {
            const input = '<% templater %> and `= inline` and `$= js`';
            const expected = '&lt;% templater %&gt; and `\u200B= inline` and `$\u200B= js`';
            expect(sanitizeMarkdownContent(input)).toBe(expected);
        });

        it('should strip dangerous HTML tags', () => {
            const input = '<script>alert(1)</script> <style>body{color:red;}</style> <iframe src="http://evil.com"></iframe>';
            const expected = '  '; // Note: inner whitespace might get condensed or changed based on replace
            expect(sanitizeMarkdownContent(input)).toBe(expected);
        });

        it('should strip remaining dangerous HTML tags', () => {
            const input2 = '<svg onload="alert(1)"></svg><button type="submit">Click me</button>';
            const expected2 = 'Click me';
            expect(sanitizeMarkdownContent(input2)).toBe(expected2);
        });

        it('should remove inline event handlers', () => {
            const input = '<div onclick="alert(1)" ONERROR=\'alert(2)\' onMouseOver=alert(3)>foo</div>';
            const expected = '<div   >foo</div>';
            expect(sanitizeMarkdownContent(input)).toBe(expected);
        });

        it('should defang dangerous URL protocols', () => {
            const input = '[Click](javascript:alert(1)) and <a href="VbScRiPt:alert(2)">';
            const expected = '[Click](javascript\\:alert(1)) and <a href="VbScRiPt\\:alert(2)">';
            expect(sanitizeMarkdownContent(input)).toBe(expected);
        });

        it('should handle HTML entities for dangerous protocols', () => {
            const input = '<a href="javascript&#58;alert(1)"> <a href="javascript&#x3a;alert(2)">';
            // Entities that decode to dangerous protocols are stripped
            const expected = '<a href="javascriptalert(1)"> <a href="javascriptalert(2)">';
            expect(sanitizeMarkdownContent(input)).toBe(expected);
        });

        it('should handle non-string inputs', () => {
            expect(sanitizeMarkdownContent(null)).toBe('');
            expect(sanitizeMarkdownContent(undefined)).toBe('');
            expect(sanitizeMarkdownContent(123)).toBe('123');
            expect(sanitizeMarkdownContent({})).toBe('[object Object]');
        });
    });
});
