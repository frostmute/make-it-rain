/**
 * Unit Tests for YAML Utilities
 * ==============================
 *
 * Tests for YAML frontmatter generation and formatting utilities.
 */

import {
    isPlainObject,
    formatYamlValue,
    escapeYamlString,
    createYamlFrontmatter
} from '../../../src/utils/yamlUtils';

describe('yamlUtils', () => {
    describe('isPlainObject', () => {
        it('should return true for plain objects', () => {
            expect(isPlainObject({})).toBe(true);
            expect(isPlainObject({ key: 'value' })).toBe(true);
            expect(isPlainObject({ nested: { object: true } })).toBe(true);
        });

        it('should return false for null', () => {
            expect(isPlainObject(null)).toBe(false);
        });

        it('should return false for arrays', () => {
            expect(isPlainObject([])).toBe(false);
            expect(isPlainObject([1, 2, 3])).toBe(false);
        });

        it('should return false for primitives', () => {
            expect(isPlainObject('string')).toBe(false);
            expect(isPlainObject(123)).toBe(false);
            expect(isPlainObject(true)).toBe(false);
            expect(isPlainObject(undefined)).toBe(false);
        });

        it('should return false for functions', () => {
            expect(isPlainObject(() => {})).toBe(false);
        });

        it('should return false for dates', () => {
            expect(isPlainObject(new Date())).toBe(false);
        });
    });

    describe('escapeYamlString', () => {
        it('should escape backslashes', () => {
            const result = escapeYamlString('path\\to\\file');
            expect(result).toBe('path\\\\to\\\\file');
        });

        it('should escape double quotes', () => {
            const result = escapeYamlString('He said "hello"');
            expect(result).toBe('He said \\"hello\\"');
        });

        it('should escape tabs', () => {
            const result = escapeYamlString('column1\tcolumn2');
            expect(result).toBe('column1\\tcolumn2');
        });

        it('should escape carriage returns', () => {
            const result = escapeYamlString('line1\rline2');
            expect(result).toBe('line1\\rline2');
        });

        it('should handle multiple escape characters', () => {
            const result = escapeYamlString('path\\file\t"quoted"\r');
            expect(result).toBe('path\\\\file\\t\\"quoted\\"\\r');
        });

        it('should handle empty string', () => {
            const result = escapeYamlString('');
            expect(result).toBe('');
        });

        it('should not modify normal strings', () => {
            const result = escapeYamlString('normal string');
            expect(result).toBe('normal string');
        });
    });

    describe('formatYamlValue', () => {
        describe('primitives', () => {
            it('should format null', () => {
                expect(formatYamlValue(null)).toBe('null');
                expect(formatYamlValue(undefined)).toBe('null');
            });

            it('should format booleans', () => {
                expect(formatYamlValue(true)).toBe('true');
                expect(formatYamlValue(false)).toBe('false');
            });

            it('should format numbers', () => {
                expect(formatYamlValue(0)).toBe('0');
                expect(formatYamlValue(42)).toBe('42');
                expect(formatYamlValue(-123.45)).toBe('-123.45');
            });

            it('should format simple strings without quotes', () => {
                expect(formatYamlValue('hello')).toBe('hello');
                expect(formatYamlValue('simple-value')).toBe('simple-value');
            });
        });

        describe('strings requiring quotes', () => {
            it('should quote strings with colons', () => {
                const result = formatYamlValue('https://example.com');
                expect(result).toBe('"https://example.com"');
            });

            it('should quote strings with special characters', () => {
                expect(formatYamlValue('value{with}braces')).toContain('"');
                expect(formatYamlValue('value[with]brackets')).toContain('"');
                expect(formatYamlValue('value#hash')).toContain('"');
                expect(formatYamlValue('value*asterisk')).toContain('"');
                expect(formatYamlValue('value&ampersand')).toContain('"');
            });

            it('should quote strings starting with numbers', () => {
                const result = formatYamlValue('123abc');
                expect(result).toBe('"123abc"');
            });

            it('should quote boolean-like strings', () => {
                expect(formatYamlValue('true')).toBe('"true"');
                expect(formatYamlValue('false')).toBe('"false"');
                expect(formatYamlValue('yes')).toBe('"yes"');
                expect(formatYamlValue('no')).toBe('"no"');
                expect(formatYamlValue('on')).toBe('"on"');
                expect(formatYamlValue('off')).toBe('"off"');
            });

            it('should quote empty strings', () => {
                const result = formatYamlValue('   ');
                expect(result).toContain('"');
            });
        });

        describe('multiline strings', () => {
            it('should use block scalar for multiline strings', () => {
                const result = formatYamlValue('line1\nline2\nline3');
                expect(result).toContain('|');
                expect(result).toContain('line1');
                expect(result).toContain('line2');
                expect(result).toContain('line3');
            });

            it('should properly indent multiline strings', () => {
                const result = formatYamlValue('line1\nline2', 1);
                expect(result).toMatch(/\|\n.*line1\n.*line2/);
            });

            it('should handle multiline with empty lines', () => {
                const result = formatYamlValue('line1\n\nline3');
                expect(result).toContain('|');
                expect(result).toContain('line1');
                expect(result).toContain('line3');
            });
        });

        describe('arrays', () => {
            it('should format empty arrays', () => {
                expect(formatYamlValue([])).toBe('[]');
            });

            it('should format arrays of strings', () => {
                const result = formatYamlValue(['tag1', 'tag2', 'tag3']);
                expect(result).toContain('- tag1');
                expect(result).toContain('- tag2');
                expect(result).toContain('- tag3');
            });

            it('should format arrays of numbers', () => {
                const result = formatYamlValue([1, 2, 3]);
                expect(result).toContain('- 1');
                expect(result).toContain('- 2');
                expect(result).toContain('- 3');
            });

            it('should format arrays of mixed types', () => {
                const result = formatYamlValue(['string', 42, true, null]);
                expect(result).toContain('- string');
                expect(result).toContain('- 42');
                expect(result).toContain('- true');
                expect(result).toContain('- null');
            });

            it('should handle nested arrays', () => {
                const result = formatYamlValue([['a', 'b'], ['c', 'd']]);
                expect(result).toContain('- a');
                expect(result).toContain('- b');
            });

            it('should properly indent array items', () => {
                const result = formatYamlValue(['item1', 'item2'], 1);
                expect(result).toMatch(/\n\s+- item1/);
                expect(result).toMatch(/\n\s+- item2/);
            });
        });

        describe('objects', () => {
            it('should format empty objects', () => {
                expect(formatYamlValue({})).toBe('{}');
            });

            it('should format simple objects', () => {
                const result = formatYamlValue({ key: 'value', number: 42 });
                expect(result).toContain('key: value');
                expect(result).toContain('number: 42');
            });

            it('should format nested objects', () => {
                const result = formatYamlValue({
                    outer: {
                        inner: 'value'
                    }
                });
                expect(result).toContain('outer:');
                expect(result).toContain('inner: value');
            });

            it('should properly indent nested objects', () => {
                const result = formatYamlValue({
                    level1: {
                        level2: {
                            level3: 'deep'
                        }
                    }
                });
                expect(result).toContain('level1:');
                expect(result).toContain('level2:');
                expect(result).toContain('level3: deep');
            });

            it('should handle objects with array values', () => {
                const result = formatYamlValue({
                    tags: ['tag1', 'tag2']
                });
                expect(result).toContain('tags:');
                expect(result).toContain('- tag1');
                expect(result).toContain('- tag2');
            });
        });

        describe('complex structures', () => {
            it('should handle deeply nested structures', () => {
                const complex = {
                    title: 'Test',
                    metadata: {
                        tags: ['javascript', 'typescript'],
                        author: {
                            name: 'John Doe',
                            email: 'john@example.com'
                        }
                    },
                    content: 'Some text'
                };

                const result = formatYamlValue(complex);
                expect(result).toContain('title: Test');
                expect(result).toContain('metadata:');
                expect(result).toContain('tags:');
                expect(result).toContain('- javascript');
                expect(result).toContain('- typescript');
                expect(result).toContain('author:');
                expect(result).toContain('name: John Doe');
                expect(result).toContain('content: Some text');
            });
        });

        describe('edge cases', () => {
            it('should handle special YAML characters in values', () => {
                const result = formatYamlValue('value: with: colons:');
                expect(result).toContain('"value: with: colons:"');
            });

            it('should handle backticks', () => {
                const result = formatYamlValue('code with `backticks`');
                expect(result).toContain('"');
            });

            it('should handle pipes and greater-than signs', () => {
                expect(formatYamlValue('value|pipe')).toContain('"');
                expect(formatYamlValue('value>greater')).toContain('"');
            });
            it("should handle errors when JSON.stringify fails", () => {
                const result = formatYamlValue(BigInt(9007199254740991));
                expect(result).toBe("\"Error formatting value\"");
            });
        });
    });

    describe('createYamlFrontmatter', () => {
        it('should create basic frontmatter', () => {
            const data = {
                title: 'Test Note',
                author: 'John Doe'
            };

            const result = createYamlFrontmatter(data);

            expect(result).toContain('---');
            expect(result).toContain('title: Test Note');
            expect(result).toContain('author: John Doe');
            expect(result).toMatch(/^---\n.*\n---\n\n$/s);
        });

        it('should handle empty object', () => {
            const result = createYamlFrontmatter({});
            expect(result).toBe('---\n---\n\n');
        });

        it('should handle various data types', () => {
            const data = {
                title: 'Test',
                count: 42,
                published: true,
                draft: false,
                metadata: null,
                tags: ['tag1', 'tag2']
            };

            const result = createYamlFrontmatter(data);

            expect(result).toContain('title: Test');
            expect(result).toContain('count: 42');
            expect(result).toContain('published: true');
            expect(result).toContain('draft: false');
            expect(result).toContain('metadata: null');
            expect(result).toContain('tags:');
            expect(result).toContain('- tag1');
            expect(result).toContain('- tag2');
        });

        it('should handle nested objects', () => {
            const data = {
                title: 'Test',
                metadata: {
                    author: 'John',
                    date: '2024-01-01'
                }
            };

            const result = createYamlFrontmatter(data);

            expect(result).toContain('metadata:');
            expect(result).toContain('author: John');
            expect(result).toContain('date: 2024-01-01');
        });

        it('should handle URLs and special characters', () => {
            const data = {
                title: 'Article: A Deep Dive',
                source: 'https://example.com/article?id=123',
                excerpt: 'Quote: "interesting"'
            };

            const result = createYamlFrontmatter(data);

            expect(result).toContain('title: "Article: A Deep Dive"');
            expect(result).toContain('source: "https://example.com/article?id=123"');
            expect(result).toContain('excerpt:');
        });

        it('should handle multiline content', () => {
            const data = {
                title: 'Test',
                description: 'Line 1\nLine 2\nLine 3'
            };

            const result = createYamlFrontmatter(data);

            expect(result).toContain('description: |');
            expect(result).toContain('Line 1');
            expect(result).toContain('Line 2');
            expect(result).toContain('Line 3');
        });

        it('should handle arrays of objects', () => {
            const data = {
                highlights: [
                    { text: 'First highlight', color: 'yellow' },
                    { text: 'Second highlight', color: 'green' }
                ]
            };

            const result = createYamlFrontmatter(data);

            expect(result).toContain('highlights:');
            expect(result).toContain('text: First highlight');
            expect(result).toContain('color: yellow');
            expect(result).toContain('text: Second highlight');
            expect(result).toContain('color: green');
        });

        it('should start and end with correct delimiters', () => {
            const data = { key: 'value' };
            const result = createYamlFrontmatter(data);

            expect(result).toMatch(/^---\n/);
            expect(result).toMatch(/\n---\n\n$/);
        });

        it('should handle complex Raindrop-like data', () => {
            const data = {
                title: 'Bookmark Title',
                source: 'https://example.com',
                type: 'article',
                created: '2024-01-01T10:00:00Z',
                lastupdate: '2024-01-02T15:30:00Z',
                id: 12345,
                collectionId: 67890,
                collectionTitle: 'Tech Articles',
                collectionPath: 'Tech/Articles',
                tags: ['javascript', 'typescript', 'testing'],
                banner: 'https://example.com/image.jpg',
                excerpt: 'A great article about testing'
            };

            const result = createYamlFrontmatter(data);

            expect(result).toContain('title: Bookmark Title');
            expect(result).toContain('source: "https://example.com"');
            expect(result).toContain('type: article');
            expect(result).toContain('id: 12345');
            expect(result).toContain('collectionId: 67890');
            expect(result).toContain('tags:');
            expect(result).toContain('- javascript');
            expect(result).toContain('- typescript');
            expect(result).toContain('- testing');
        });

        it('should handle circular references gracefully', () => {
            // Create a circular reference
            const circular: any = { name: 'test' };
            circular.self = circular;

            const result = createYamlFrontmatter(circular);

            // Should still return valid YAML structure even on error
            expect(result).toMatch(/^---\n/);
            expect(result).toMatch(/\n---\n\n$/);
        });

        it('should return error frontmatter when an exception occurs', () => {
            const throwingObject = {};
            Object.defineProperty(throwingObject, 'error', {
                get: () => { throw new Error('Simulated error'); },
                enumerable: true
            });

            const result = createYamlFrontmatter(throwingObject as any);

            expect(result).toBe('---\ntitle: "Error creating frontmatter"\n---\n\n');
        });

        it('should handle circular references in arrays', () => {
            const arr: any[] = [];
            arr.push(arr);
            const result = formatYamlValue(arr);
            expect(result).toContain('"[Circular Reference]"');
        });

        it('should handle circular references in objects', () => {
            const obj: any = {};
            obj.self = obj;
            const result = formatYamlValue(obj);
            expect(result).toContain('"[Circular Reference]"');
        });

        it('should handle JSON.stringify errors in fallback', () => {
            const bigInt = BigInt(9007199254740991);
            const result = formatYamlValue(bigInt);
            expect(result).toBe('"Error formatting value"');
        });
    });
});
