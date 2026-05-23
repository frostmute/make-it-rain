import RaindropToObsidian from '../../src/main';
import { mockApp } from '../setup';
import { App, PluginManifest } from 'obsidian';

describe('RaindropToObsidian Template Helpers', () => {
    let plugin: RaindropToObsidian;
    let manifest: PluginManifest;

    beforeEach(() => {
        manifest = {
            id: 'make-it-rain',
            name: 'Make It Rain',
            version: '1.7.2',
        } as PluginManifest;

        plugin = new RaindropToObsidian(mockApp as unknown as App, manifest);
    });

    const render = (template: string, data: any) => {
        return (plugin as any).renderTemplate(template, data);
    };

    it('should support uppercase helper', () => {
        const data = { title: 'hello world' };
        expect(render('{{uppercase title}}', data)).toBe('HELLO WORLD');
    });

    it('should support lowercase helper', () => {
        const data = { title: 'HELLO WORLD' };
        expect(render('{{lowercase title}}', data)).toBe('hello world');
    });

    it('should support titlecase helper', () => {
        const data = { title: 'hello world' };
        expect(render('{{titlecase title}}', data)).toBe('Hello World');
    });

    it('should support truncate helper', () => {
        const data = { title: 'this is a long title' };
        expect(render('{{truncate title 10}}', data)).toBe('this is a ...');
    });

    it('should not truncate if title is shorter than length', () => {
        const data = { title: 'short' };
        expect(render('{{truncate title 10}}', data)).toBe('short');
    });

    it('should handle missing variables with helpers', () => {
        const data = {};
        expect(render('{{uppercase missing}}', data)).toBe('');
    });

    it('should maintain backward compatibility for standard variables', () => {
        const data = { title: 'Hello' };
        expect(render('{{title}}', data)).toBe('Hello');
    });

    it('should handle nested properties with helpers', () => {
        const data = { user: { name: 'john' } };
        expect(render('{{uppercase user.name}}', data)).toBe('JOHN');
    });
    
    it('should handle multiple helpers in one template', () => {
        const data = { title: 'hello', desc: 'WORLD' };
        expect(render('{{uppercase title}} - {{lowercase desc}}', data)).toBe('HELLO - world');
    });

    it('should handle invalid truncate length', () => {
        const data = { title: 'hello' };
        expect(render('{{truncate title invalid}}', data)).toBe('hello');
    });

    it('should support nested if inside each block', () => {
        const data = {
            highlights: [
                { text: 'Highlight 1', note: 'Note 1' },
                { text: 'Highlight 2' }
            ]
        };
        const template = `{{#if highlights}}
## Highlights
{{#each highlights}}- {{text}}{{#if note}} (Note: {{note}}){{/if}}
{{/each}}{{/if}}`;
        const expected = `
## Highlights
- Highlight 1 (Note: Note 1)
- Highlight 2`;
        expect(render(template, data).trim()).toBe(expected.trim());
    });
});
