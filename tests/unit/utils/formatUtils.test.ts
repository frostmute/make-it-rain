import { escapeRegExp } from '../../../src/utils/formatUtils';

describe('formatUtils', () => {
    describe('escapeRegExp', () => {
        it('should escape special regex characters', () => {
            const input = '.*+?^${}()|[]\\';
            const expected = '\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\';
            expect(escapeRegExp(input)).toBe(expected);
        });

        it('should not escape alphanumeric characters', () => {
            const input = 'abcABC123';
            expect(escapeRegExp(input)).toBe(input);
        });

        it('should handle empty string', () => {
            expect(escapeRegExp('')).toBe('');
        });

        it('should handle strings with no special characters', () => {
            const input = 'hello world';
            expect(escapeRegExp(input)).toBe(input);
        });

        it('should escape characters in the middle of a string', () => {
            const input = 'hello.world';
            const expected = 'hello\\.world';
            expect(escapeRegExp(input)).toBe(expected);
        });

        it('should work correctly in a RegExp constructor', () => {
            const placeholder = 'title(copy)';
            const escaped = escapeRegExp(placeholder);
            const regex = new RegExp(`{{${escaped}}}`, 'gi');
            const template = 'Hello {{title(copy)}}';
            expect(template.replace(regex, 'world')).toBe('Hello world');
        });
    });
});
