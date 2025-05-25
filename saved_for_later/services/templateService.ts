import * as Handlebars from 'handlebars';
import { TemplateSettings, TemplateConfig, BUILT_IN_VARIABLES } from '../types/templates';
import { RaindropItem, RaindropType } from '../types';

interface ValidationError {
    line: number;
    column: number;
    message: string;
    code: string;
}

export class TemplateService {
    private settings: TemplateSettings;
    private compiledTemplates: Map<string, Handlebars.TemplateDelegate>;

    constructor(settings: TemplateSettings) {
        this.settings = settings;
        this.compiledTemplates = new Map();
        this.registerHelpers();
    }

    private registerHelpers(): void {
        // Date formatting helpers
        Handlebars.registerHelper('formatDate', (date: string) => {
            return new Date(date).toLocaleDateString();
        });

        Handlebars.registerHelper('formatDateTime', (date: string) => {
            return new Date(date).toLocaleString();
        });

        Handlebars.registerHelper('formatDateISO', (date: string) => {
            return new Date(date).toISOString().split('T')[0];
        });

        Handlebars.registerHelper('formatTime', (date: string) => {
            return new Date(date).toLocaleTimeString();
        });

        // Text manipulation helpers
        Handlebars.registerHelper('sanitize', (text: string) => {
            return text.replace(/[\/\\:*?"<>|#%&{}\$\!\'@`+=]/g, '').trim();
        });

        Handlebars.registerHelper('truncate', (text: string, length: number) => {
            if (!text || text.length <= length) return text;
            return text.substring(0, length) + '...';
        });

        // Array helpers
        Handlebars.registerHelper('join', (array: string[], separator: string = ', ') => {
            return array.join(separator);
        });

        // Default value helper
        Handlebars.registerHelper('default', (value: any, defaultValue: any) => {
            return value || defaultValue;
        });

        // Comparison helpers
        Handlebars.registerHelper('eq', (a: any, b: any) => a === b);
        Handlebars.registerHelper('neq', (a: any, b: any) => a !== b);
        Handlebars.registerHelper('gt', (a: number, b: number) => a > b);
        Handlebars.registerHelper('gte', (a: number, b: number) => a >= b);
        Handlebars.registerHelper('lt', (a: number, b: number) => a < b);
        Handlebars.registerHelper('lte', (a: number, b: number) => a <= b);

        // Raindrop.io specific helpers
        Handlebars.registerHelper('raindropType', (type: RaindropType) => {
            return type.charAt(0).toUpperCase() + type.slice(1);
        });

        Handlebars.registerHelper('hasHighlights', (raindrop: RaindropItem) => {
            return raindrop.highlights && raindrop.highlights.length > 0;
        });

        Handlebars.registerHelper('hasTags', (raindrop: RaindropItem) => {
            return raindrop.tags && raindrop.tags.length > 0;
        });

        Handlebars.registerHelper('hasNote', (raindrop: RaindropItem) => {
            return !!raindrop.note;
        });

        Handlebars.registerHelper('hasExcerpt', (raindrop: RaindropItem) => {
            return !!raindrop.excerpt;
        });

        Handlebars.registerHelper('hasCover', (raindrop: RaindropItem) => {
            return !!raindrop.cover;
        });

        Handlebars.registerHelper('highlightCount', (raindrop: RaindropItem) => {
            return raindrop.highlights?.length || 0;
        });

        Handlebars.registerHelper('tagCount', (raindrop: RaindropItem) => {
            return raindrop.tags?.length || 0;
        });

        Handlebars.registerHelper('formatTags', (tags: string[]) => {
            return tags.map(tag => `#${tag}`).join(' ');
        });

        Handlebars.registerHelper('formatHighlights', (highlights: RaindropItem['highlights']) => {
            if (!highlights) return '';
            return highlights.map(h => `> ${h.text}${h.note ? `\n> ${h.note}` : ''}`).join('\n\n');
        });

        Handlebars.registerHelper('relativeTime', (date: string) => {
            const now = new Date();
            const then = new Date(date);
            const diff = now.getTime() - then.getTime();
            const seconds = Math.floor(diff / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);

            if (days > 0) return `${days} day${days === 1 ? '' : 's'} ago`;
            if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
            if (minutes > 0) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
            return 'just now';
        });

        // JSON formatting helper
        Handlebars.registerHelper('json', (context: any) => {
            return JSON.stringify(context, null, 2);
        });
    }

    private getTemplateForType(type: RaindropType): string {
        return this.settings.typeTemplates[type] || this.settings.defaultTemplate;
    }

    private compileTemplate(template: string): Handlebars.TemplateDelegate {
        const cached = this.compiledTemplates.get(template);
        if (cached) {
            return cached;
        }

        const compiled = Handlebars.compile(template);
        this.compiledTemplates.set(template, compiled);
        return compiled;
    }

    public renderTemplate(raindrop: RaindropItem, templateName?: string): string {
        let template: string;

        if (templateName && this.settings.customTemplates[templateName]) {
            template = this.settings.customTemplates[templateName].template;
        } else {
            template = this.getTemplateForType(raindrop.type);
        }

        const compiledTemplate = this.compileTemplate(template);
        return compiledTemplate(raindrop);
    }

    public validateTemplate(template: string): { valid: boolean; errors?: ValidationError[] } {
        const errors: ValidationError[] = [];

        try {
            // Check for basic syntax errors
            Handlebars.compile(template);
        } catch (error) {
            if (error instanceof Error) {
                // Parse error message for line and column information
                const match = error.message.match(/Parse error on line (\d+):\n(.*)\n(.*)\n(.*)/);
                if (match) {
                    const [, line, context, errorLine, pointer] = match;
                    const column = pointer.indexOf('^') + 1;
                    errors.push({
                        line: parseInt(line),
                        column,
                        message: error.message,
                        code: errorLine.trim()
                    });
                } else {
                    errors.push({
                        line: 0,
                        column: 0,
                        message: error.message,
                        code: template
                    });
                }
            }
            return { valid: false, errors };
        }

        // Check for common template issues
        const lines = template.split('\n');
        lines.forEach((line, index) => {
            // Check for unclosed blocks
            if (line.includes('{{#') && !line.includes('{{/')) {
                errors.push({
                    line: index + 1,
                    column: line.indexOf('{{#') + 1,
                    message: 'Unclosed block detected',
                    code: line
                });
            }

            // Check for invalid variable names
            const varMatch = line.match(/{{([^#/][^}]+)}}/g);
            if (varMatch) {
                varMatch.forEach(match => {
                    const varName = match.slice(2, -2).trim();
                    if (!this.isValidVariableName(varName)) {
                        errors.push({
                            line: index + 1,
                            column: line.indexOf(match) + 1,
                            message: `Invalid variable name: ${varName}`,
                            code: line
                        });
                    }
                });
            }
        });

        return {
            valid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined
        };
    }

    private isValidVariableName(name: string): boolean {
        // Check if the variable name is in the list of valid variables
        return BUILT_IN_VARIABLES.some(v => v.name === name) ||
            // Or if it's a helper with parameters
            name.includes(' ') ||
            // Or if it's a path expression
            name.includes('.');
    }

    public getAvailableVariables(): typeof BUILT_IN_VARIABLES {
        return BUILT_IN_VARIABLES;
    }

    public addCustomTemplate(config: TemplateConfig): void {
        this.settings.customTemplates[config.name] = config;
        // Clear compiled template cache for this template
        this.compiledTemplates.delete(config.template);
    }

    public removeCustomTemplate(name: string): void {
        const template = this.settings.customTemplates[name]?.template;
        if (template) {
            this.compiledTemplates.delete(template);
        }
        delete this.settings.customTemplates[name];
    }

    public updateSettings(newSettings: Partial<TemplateSettings>): void {
        this.settings = { ...this.settings, ...newSettings };
        // Clear all compiled templates when settings change
        this.compiledTemplates.clear();
    }

    public previewTemplate(template: string, sampleData: Partial<RaindropItem>): string {
        try {
            const compiled = this.compileTemplate(template);
            return compiled(sampleData);
        } catch (error) {
            throw new Error(`Template preview failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
} 