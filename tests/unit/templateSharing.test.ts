import RaindropToObsidian from '../../src/main';
import { App, PluginManifest } from 'obsidian';

describe('Template Sharing (Export/Import)', () => {
    let plugin: RaindropToObsidian;

    beforeEach(() => {
        const app = new App();
        const manifest: PluginManifest = {
            id: 'make-it-rain',
            name: 'Make It Rain',
            version: '1.0.0',
            minAppVersion: '0.15.0',
            description: 'Test',
            author: 'Test',
            authorUrl: 'Test',
            isDesktopOnly: false
        };
        plugin = new RaindropToObsidian(app, manifest);
    });

    it('should export a template as valid JSON', () => {
        const name = 'my-test-template';
        const templateStr = '{{#if true}}Hello{{/if}}';
        const description = 'A test template';

        const jsonStr = plugin.exportTemplate(name, templateStr, description);
        const parsed = JSON.parse(jsonStr);

        expect(parsed.name).toBe(name);
        expect(parsed.template).toBe(templateStr);
        expect(parsed.description).toBe(description);
        expect(parsed.version).toBe('1.0.0');
    });

    it('should import a valid template JSON', () => {
        const validJson = JSON.stringify({
            version: '1.0.0',
            name: 'imported-template',
            template: '{{title}}',
            description: 'Imported'
        });

        const result = plugin.importTemplate(validJson);
        expect(result).not.toBeNull();
        expect(result?.name).toBe('imported-template');
        expect(result?.template).toBe('{{title}}');
    });

    it('should return null when importing invalid JSON format', () => {
        const invalidJson = '{"version": "1.0.0", "name": "bad"'; // Missing closing brace
        const result = plugin.importTemplate(invalidJson);
        expect(result).toBeNull();
    });

    it('should return null when importing missing required fields', () => {
        const missingFieldsJson = JSON.stringify({
            version: '1.0.0',
            name: 'missing-template'
            // template is missing
        });
        const result = plugin.importTemplate(missingFieldsJson);
        expect(result).toBeNull();
    });
});
