import { validateTemplate } from '../../src/template-validator';
describe('Template Validator', () => {
    test('should validate a simple valid template', () => {
        const template = '# {{title}}\n{{excerpt}}';
        const result = validateTemplate(template);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    test('should detect unclosed if tags', () => {
        const template = '{{#if title}} Unclosed';
        const result = validateTemplate(template);
        expect(result.isValid).toBe(false);
        expect(result.errors[0]).toContain('Unclosed #if tag');
    });

    test('should detect unclosed each tags', () => {
        const template = '{{#each tags}} {{this}}';
        const result = validateTemplate(template);
        expect(result.isValid).toBe(false);
        expect(result.errors[0]).toContain('Unclosed #each tag');
    });

    test('should detect unclosed extends tags', () => {
        const template = '{{#extends "base"}} Content';
        const result = validateTemplate(template);
        expect(result.isValid).toBe(false);
        expect(result.errors[0]).toContain('Unclosed #extends tag');
    });

    test('should detect unclosed block tags', () => {
        const template = '{{#block "main"}} Content';
        const result = validateTemplate(template);
        expect(result.isValid).toBe(false);
        expect(result.errors[0]).toContain('Unclosed #block tag');
    });

    test('should warn about possibly unknown variables', () => {
        const template = '{{unknown_var}}';
        const result = validateTemplate(template);
        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain('Possibly unknown variable: {{unknown_var}}');
    });

    test('should warn about unknown helpers', () => {
        const template = '{{unknown_helper title}}';
        const result = validateTemplate(template);
        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain('Unknown helper: {{unknown_helper}}');
    });

    test('should detect unclosed YAML frontmatter', () => {
        const template = '---\ntitle: test\n# missing closing dashes';
        const result = validateTemplate(template);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Unclosed YAML frontmatter (missing closing ---)');
    });

    test('should warn about invalid YAML lines', () => {
        const template = '---\ntitle: test\nthis is not yaml\n---';
        const result = validateTemplate(template);
        expect(result.isValid).toBe(true);
        expect(result.warnings).toContain('Possible invalid YAML line 3: "this is not yaml"');
    });
});
