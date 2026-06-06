import { sanitizeMarkdownContent } from '../../src/utils/securityUtils';

describe('Performance Benchmark: sanitizeMarkdownContent', () => {
    it('should measure execution time for 100,000 iterations', () => {
        const contentToSanitize = `
# This is a test

\`\`\`dataviewjs
console.log("hello");
\`\`\`

Here is a dangerous tag:
<meta charset="utf-8">
<form action="/submit">
  <input type="text" name="name" />
  <button type="submit">Submit</button>
</form>

\`\`\`javascript
alert('xss');
\`\`\`

Some normal text here.
<script>alert('dangerous')</script>
<iframe src="http://example.com"></iframe>

[Click here](javascript:alert(1))
`;

        const ITERATIONS = 1000;
        const start = performance.now();
        let sanitized = '';
        for (let i = 0; i < ITERATIONS; i++) {
            sanitized = sanitizeMarkdownContent(contentToSanitize);
        }
        const end = performance.now();

        console.log(`Total time: ${(end - start).toFixed(2)} ms`);
        console.log(`Average time per call: ${((end - start) / ITERATIONS).toFixed(5)} ms`);

        // Assert correctness to ensure this acts as a regression test
        expect(sanitized).not.toContain('<meta');
        expect(sanitized).not.toContain('<form');
        expect(sanitized).not.toContain('```dataviewjs');
    });
});
