
import { TemplateData } from '../../src/types';
import RaindropToObsidian from '../../src/main';
import { App } from 'obsidian';

describe('Template Inheritance Reproduction', () => {
    let plugin: RaindropToObsidian;

        beforeEach(() => {
        plugin = new RaindropToObsidian({} as App, {} as any);
        plugin.settings.isTemplateSystemEnabled = true;
        plugin.settings.namedTemplates['base'] = "BASE: {{#block 'details'}}DEFAULT END{{/block}}";
        plugin.settings.defaultTemplate = "{{#extends 'base'}}{{/extends}}";
    });

    it('should support template inheritance with #extends and #block', () => {
        plugin.settings.namedTemplates['base'] = "BASE: {{#block 'content'}}DEFAULT{{/block}} END";
        const template = "{{#extends 'base'}}{{#block 'content'}}OVERRIDE{{/block}}{{/extends}}";
        const data: any = { title: 'Test' };
        
        const result = (plugin as any).renderTemplate(template, data);
        expect(result).toBe("BASE: OVERRIDE END");
    });

    it('should support partial includes with #include', () => {
        plugin.settings.namedTemplates['partial'] = "PARTIAL: {{title}}";
        const template = "START {{#include 'partial'}} END";
        const data: any = { title: 'Test' };
        
        const result = (plugin as any).renderTemplate(template, data);
        expect(result).toBe("START PARTIAL: Test END");
    });

    it('should support multi-level inheritance (extending default)', () => {
        const template = "{{#extends 'default'}}{{#block 'details'}}CUSTOM DETAILS{{/block}}{{/extends}}";
        const data: any = { 
            _id: 123,
            title: 'Test',
            link: 'https://example.com',
            type: 'link',
            created: '2023-01-01',
            lastupdate: '2023-01-01',
            collectionId: 1,
            collectionTitle: 'Col',
            collectionPath: 'Col',
            tags: ['tag1']
        };
        
        const result = (plugin as any).renderTemplate(template, data);
        expect(result).toContain('CUSTOM DETAILS');
        expect(result).not.toContain('## Details'); // Now it should be missing because it's inside the block
    });

    it('should support 3-level inheritance', () => {
        plugin.settings.namedTemplates['grandparent'] = "GP: {{#block 'a'}}GP-A{{/block}} {{#block 'b'}}GP-B{{/block}}";
        plugin.settings.namedTemplates['parent'] = "{{#extends 'grandparent'}}{{#block 'a'}}P-A{{/block}}{{/extends}}";
        const template = "{{#extends 'parent'}}{{#block 'b'}}C-B{{/block}}{{/extends}}";
        
        const result = (plugin as any).renderTemplate(template, {});
        expect(result).toBe("GP: P-A C-B");
    });

    it('should handle circular inheritance gracefully', () => {
        plugin.settings.namedTemplates['a'] = "{{#extends 'b'}}A{{/extends}}";
        plugin.settings.namedTemplates['b'] = "{{#extends 'a'}}B{{/extends}}";
        
        // Should not crash/infinite loop
        const result = (plugin as any).renderTemplate("{{#extends 'a'}}CHILD{{/extends}}", {});
        expect(result).toBeDefined();
    });

    it('should handle missing base template gracefully', () => {
        const result = (plugin as any).renderTemplate("{{#extends 'non-existent'}}CHILD{{/extends}}", {});
        expect(result).toBe("CHILD"); // Falls back to child template if parent not found
    });

    it('should not cause infinite recursion with #include', () => {
        plugin.settings.namedTemplates['loop'] = "{{#include 'loop'}}";
        
        // This should not crash or hang. It should hit the depth limit.
        const result = (plugin as any).renderTemplate("{{#include 'loop'}}", {});
        expect(result).toBe("");
    });

    it('should support #include containing #extends correctly', () => {
        plugin.settings.namedTemplates['base'] = "BASE: {{#block 'content'}}DEFAULT{{/block}}";
        plugin.settings.namedTemplates['partial'] = "{{#extends 'base'}}{{#block 'content'}}OVERRIDE{{/block}}{{/extends}}";
        
        const template = "START {{#include 'partial'}} END";
        const result = (plugin as any).renderTemplate(template, {});
        
        expect(result).toBe("START BASE: OVERRIDE END");
    });
});
