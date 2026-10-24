/** Analyze class reuse heuristically without changing CSS.
 * Reads: TSX files in the selected module. Writes: none.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { emitResult, isMain, parseOptions, printHelp, reportError } from '../common/_cli.mjs';
const REPOSITORY = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
export function buildParser() {
    return {
        help: { type: 'boolean', short: 'h', description: 'show help without scanning files' },
        module: { type: 'string', default: 'Neuron-Guide', description: 'module directory under modules/' },
    };
}
function pageSources(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const file = path.join(directory, entry.name);
        return entry.isDirectory() ? pageSources(file) : entry.name.endsWith('.tsx') ? [file] : [];
    });
}
function collectSources(file, moduleRoot, seen = new Set()) {
    const resolved = path.resolve(file);
    if (seen.has(resolved) || !fs.existsSync(resolved))
        return [];
    seen.add(resolved);
    const source = fs.readFileSync(resolved, 'utf8');
    const sources = [source];
    for (const match of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
        const specifier = match[1];
        if (!specifier.startsWith('.'))
            continue;
        const base = path.resolve(path.dirname(resolved), specifier);
        const candidate = [base, `${base}.tsx`, `${base}.ts`, path.join(base, 'index.tsx'), path.join(base, 'index.ts')].find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
        if (candidate && candidate.startsWith(moduleRoot))
            sources.push(...collectSources(candidate, moduleRoot, seen));
    }
    return sources;
}
function classesFromSource(source) {
    const classes = new Set();
    for (const match of source.matchAll(/className\s*=\s*(?:\{\s*)?(['"`])([\s\S]*?)\1/g)) {
        for (const token of match[2].replace(/\$\{[^}]*\}/g, ' ').split(/\s+/))
            if (/^[a-zA-Z_-][\w-]*$/.test(token))
                classes.add(token);
    }
    // Dynamic class branches: only class-like hyphenated tokens, never arbitrary x/y/text strings.
    for (const match of source.matchAll(/['"`]([a-zA-Z_][\w-]*(?:\s+[\w-]+)*)['"`]/g)) {
        for (const token of match[1].split(/\s+/))
            if (token.includes('-'))
                classes.add(token);
    }
    return classes;
}
export function analyzeStyles(moduleName) {
    const moduleRoot = path.resolve(REPOSITORY, 'modules', moduleName);
    if (path.dirname(moduleRoot) !== path.join(REPOSITORY, 'modules')) {
        throw new Error('Module must be a direct child of modules/.');
    }
    const pagesRoot = path.join(moduleRoot, 'pages');
    const pageFiles = pageSources(pagesRoot);
    const usage = new Map();
    for (const file of pageFiles) {
        const page = path.relative(pagesRoot, file).replace(/\.tsx$/, '');
        const classes = new Set(collectSources(file, moduleRoot).flatMap((source) => [...classesFromSource(source)]));
        for (const className of classes) {
            if (!usage.has(className))
                usage.set(className, new Set());
            usage.get(className).add(page);
        }
    }
    const common = [...usage.entries()]
        .filter(([, pages]) => pages.size >= 3)
        .sort((a, b) => b[1].size - a[1].size || a[0].localeCompare(b[0]));
    return { module: moduleName, pages: pageFiles.length,
        classes: common.map(([name, pages]) => ({ name, count: pages.size, pages: [...pages] })),
        limitations: 'Heuristic source statistics; does not prove that CSS is unused.' };
}
export async function main(argv = process.argv.slice(2)) {
    try {
        const options = buildParser();
        const args = parseOptions(argv, options);
        if (args.help) {
            printHelp('Analyze repeated CSS classes without changing files.', options);
            return 0;
        }
        emitResult(analyzeStyles(args.module));
        return 0;
    }
    catch (error) {
        return reportError(error);
    }
}
if (isMain(import.meta.url))
    process.exitCode = await main();
