import { parseTemplate, ASTNode } from './utils';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

export function validateTemplate(template: string): ValidationResult {
    const result: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: []
    };

    if (!template) return result;

    // 1. Basic Handlebars Syntax & Tag Closure Check
    try {
        const ast = parseTemplate(template);
        
        // Check for common issues in AST
        const checkNodes = (nodes: ASTNode[]) => {
            for (const node of nodes) {
                if (node.type === 'if' || node.type === 'each' || node.type === 'extends' || node.type === 'block') {
                    if (!node.thenBranch) {
                        result.errors.push(`Unclosed tag detected for ${node.type}`);
                        result.isValid = false;
                    } else {
                        checkNodes(node.thenBranch);
                    }
                    if (node.elseBranch) {
                        checkNodes(node.elseBranch);
                    }
                }
                
                if (node.type === 'var') {
                    const varName = node.name?.split(/\s+/)[0] || '';
                    // Basic check for variable existence (warning only as it's dynamic)
                    const knownVars = [
                        'title', 'id', 'link', 'excerpt', 'note', 'cover', 'created', 'lastupdate',
                        'type', 'collectionId', 'collectionTitle', 'collectionPath', 'collectionParentId',
                        'collectionGroup', 'tags', 'highlights', 'bannerFieldName', 'url', 'domain',
                        'renderedType', 'scrapedContent', 'formattedCreatedDate', 'formattedUpdatedDate',
                        'formattedTags', 'localEmbed', 'this'
                    ];
                    
                    const helpers = ['uppercase', 'lowercase', 'titlecase', 'truncate', 'capitalize', 'substr', 'replace', 'join', 'pluralize'];
                    
                    const actualVar = node.name?.includes(' ') ? node.name.split(/\s+/)[1] : node.name;
                    const possibleHelper = node.name?.includes(' ') ? node.name.split(/\s+/)[0].toLowerCase() : null;

                    if (possibleHelper && !helpers.includes(possibleHelper)) {
                        result.warnings.push(`Unknown helper: {{${possibleHelper}}}`);
                    }

                    if (actualVar && !knownVars.includes(actualVar) && !actualVar.includes('.') && !actualVar.startsWith('../')) {
                        result.warnings.push(`Possibly unknown variable: {{${actualVar}}}`);
                    }
                }
            }
        };
        
        checkNodes(ast);
    } catch (e: any) {
        result.isValid = false;
        result.errors.push(`Template parsing error: ${e.message}`);
    }

    // 2. YAML Frontmatter Check
    if (template.startsWith('---')) {
        const nextDash = template.indexOf('---', 3);
        if (nextDash === -1) {
            result.errors.push('Unclosed YAML frontmatter (missing closing ---)');
            result.isValid = false;
        } else {
            const yaml = template.substring(3, nextDash);
            // Basic colon check for key-value pairs
            const lines = yaml.split('\n');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line && !line.startsWith('#') && !line.includes(':') && !line.startsWith('-')) {
                    if (!line.includes('{{') && !line.includes('}}')) { // Allow template tags to span lines or be partial
                         result.warnings.push(`Possible invalid YAML line ${i + 1}: "${line}"`);
                    }
                }
            }
        }
    }

    return result;
}
