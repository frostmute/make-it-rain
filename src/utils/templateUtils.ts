export interface ASTNode {
    type: 'text' | 'var' | 'if' | 'each' | 'extends' | 'block' | 'include';
    raw?: string;
    name?: string;
    cond?: string;
    arrayVar?: string;
    thenBranch?: ASTNode[];
    elseBranch?: ASTNode[];
    templateName?: string;
    blockName?: string;
}

export const parseTemplate = (tmpl: string): ASTNode[] => {
    const tokens: Array<{ type: 'text' | 'tag'; value: string }> = [];
    let lastIdx = 0;

    while (lastIdx < tmpl.length) {
        const openIdx = tmpl.indexOf('{{', lastIdx);
        if (openIdx === -1) {
            tokens.push({ type: 'text', value: tmpl.substring(lastIdx) });
            break;
        }

        if (openIdx > lastIdx) {
            tokens.push({ type: 'text', value: tmpl.substring(lastIdx, openIdx) });
        }

        const closeIdx = tmpl.indexOf('}}', openIdx + 2);
        if (closeIdx === -1) {
            tokens.push({ type: 'text', value: tmpl.substring(openIdx) });
            break;
        }

        const tagValue = tmpl.substring(openIdx + 2, closeIdx).trim();
        tokens.push({ type: 'tag', value: tagValue });
        lastIdx = closeIdx + 2;
    }

    let tokenIdx = 0;

    const parseNodes = (endTag?: string): ASTNode[] => {
        const nodes: ASTNode[] = [];

        while (tokenIdx < tokens.length) {
            const token = tokens[tokenIdx];
            if (token.type === 'text') {
                nodes.push({ type: 'text', raw: token.value });
                tokenIdx++;
            } else {
                const val = token.value;
                if (endTag && (val === endTag || (endTag === '/if' && val === 'else'))) {
                    break;
                }

                if (val.startsWith('#if ')) {
                    const cond = val.substring(4).trim();
                    tokenIdx++;
                    const thenBranch = parseNodes('/if');
                    let elseBranch: ASTNode[] = [];
                    if (tokenIdx < tokens.length && tokens[tokenIdx].value === 'else') {
                        tokenIdx++;
                        elseBranch = parseNodes('/if');
                    }
                    if (tokenIdx < tokens.length && tokens[tokenIdx].value === '/if') {
                        tokenIdx++;
                    } else if (!elseBranch || (tokenIdx >= tokens.length)) {
                        throw new Error(`Unclosed #if tag (expected {{/if}})`);
                    }
                    nodes.push({ type: 'if', cond, thenBranch, elseBranch });
                } else if (val.startsWith('#each ')) {
                    const arrayVar = val.substring(6).trim();
                    tokenIdx++;
                    const thenBranch = parseNodes('/each');
                    if (tokenIdx < tokens.length && tokens[tokenIdx].value === '/each') {
                        tokenIdx++;
                    } else {
                        throw new Error(`Unclosed #each tag (expected {{/each}})`);
                    }
                    nodes.push({ type: 'each', arrayVar, thenBranch });
                } else if (val.startsWith('#extends ')) {
                    const templateName = val.substring(9).trim().replace(/['"]/g, '');
                    tokenIdx++;
                    const thenBranch = parseNodes('/extends');
                    if (tokenIdx < tokens.length && tokens[tokenIdx].value === '/extends') {
                        tokenIdx++;
                    } else {
                        throw new Error(`Unclosed #extends tag (expected {{/extends}})`);
                    }
                    nodes.push({ type: 'extends', templateName, thenBranch });
                } else if (val.startsWith('#block ')) {
                    const blockName = val.substring(7).trim().replace(/['"]/g, '');
                    tokenIdx++;
                    const thenBranch = parseNodes('/block');
                    if (tokenIdx < tokens.length && tokens[tokenIdx].value === '/block') {
                        tokenIdx++;
                    } else {
                        throw new Error(`Unclosed #block tag (expected {{/block}})`);
                    }
                    nodes.push({ type: 'block', blockName, thenBranch });
                } else if (val.startsWith('#include ')) {
                    const templateName = val.substring(9).trim().replace(/['"]/g, '');
                    tokenIdx++;
                    nodes.push({ type: 'include', templateName });
                } else if (val === '/if' || val === '/each' || val === 'else' || val === '/extends' || val === '/block') {
                    // This handles unexpected closing tags by treating them as literal text
                    nodes.push({ type: 'text', raw: `{{${val}}}` });
                    tokenIdx++;
                } else {
                    nodes.push({ type: 'var', name: val });
                    tokenIdx++;
                }
            }
        }
        return nodes;
    };

    return parseNodes();
};
