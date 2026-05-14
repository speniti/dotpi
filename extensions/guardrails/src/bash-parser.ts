import { Parser, Language } from 'web-tree-sitter';
import type { Node as SyntaxNode } from 'web-tree-sitter';

let initialized = false;
let parserInstance: Parser | null = null;

export interface ParsedRedirect {
    op: string;
    target: string;
}

export interface ParsedCommand {
    name: string;
    args: string[];
    redirects: ParsedRedirect[];
}

export async function initBashParser(): Promise<void> {
    if (initialized) return;

    await Parser.init();
    parserInstance = new Parser();

    const wasmPath = require.resolve('tree-sitter-bash').replace(/bindings\/node\/index\.js$/, 'tree-sitter-bash.wasm');
    const lang = await Language.load(wasmPath);
    parserInstance.setLanguage(lang);

    initialized = true;
}

function walkCommands(node: SyntaxNode): ParsedCommand[] {
    const results: ParsedCommand[] = [];

    switch (node.type) {
        case 'program':
        case 'list':
        case 'pipeline':
        case 'negated_command':
        case 'compound_statement':
        case 'subshell':
        case 'case_statement':
            for (const child of node.namedChildren) {
                results.push(...walkCommands(child));
            }

            break;

        case 'redirected_statement': {
            const body = node.childForFieldName('body');
            if (body) results.push(...walkCommands(body));

            const redirs = extractRedirects(node);
            if (results.length > 0 && redirs.length > 0) {
                results[results.length - 1].redirects.push(...redirs);
            }

            break;
        }

        case 'command': {
            const namenode = node.childForFieldName('name');
            if (namenode) {
                results.push({ name: namenode.text, args: extractArgs(node), redirects: extractRedirects(node) });
            }

            break;
        }

        case 'if_statement':
            for (const field of ['condition', 'consequence', 'alternative'] as const) {
                const child = node.childForFieldName(field);
                if (child) results.push(...walkCommands(child));
            }

            break;

        case 'for_statement':
        case 'while_statement':
        case 'c_style_for_statement': {
            const cond = node.childForFieldName('condition');
            if (cond) results.push(...walkCommands(cond));

            const body = node.childForFieldName('body');
            if (body) results.push(...walkCommands(body));

            break;
        }

        case 'function_definition': {
            const body = node.childForFieldName('body');
            if (body) results.push(...walkCommands(body));

            break;
        }

        case 'declaration_command': {
            const children = node.namedChildren;
            if (children.length > 0) {
                results.push({ name: children[0].text, args: children.slice(1).map((c) => c.text), redirects: [] });
            }

            break;
        }

        default:
            for (const child of node.namedChildren) {
                results.push(...walkCommands(child));
            }
    }

    return results;
}

function extractArgs(node: SyntaxNode): string[] {
    const args: string[] = [];

    for (const child of node.children) {
        if (child.type === 'command_name') continue;
        if (child.type === 'file_redirect') continue;
        if (child.type === 'herestring_redirect') continue;

        args.push(child.text);
    }

    return args;
}

function extractRedirects(node: SyntaxNode): ParsedRedirect[] {
    const redirects: ParsedRedirect[] = [];

    for (const child of node.children) {
        if (child.type === 'file_redirect') {
            const dest = child.childForFieldName('destination');

            if (dest) {
                const op = child.firstChild?.text ?? '>';
                redirects.push({ op, target: dest.text });
            }
        }
    }

    return redirects;
}

export function parseBash(command: string): ParsedCommand[] | null {
    if (!initialized || !parserInstance) return null;

    try {
        const tree = parserInstance.parse(command);
        if (!tree || tree.rootNode.hasError) {
            return null;
        }

        const result = walkCommands(tree.rootNode);
        tree.delete();

        return result.length > 0 ? result : null;
    } catch {
        return null;
    }
}
