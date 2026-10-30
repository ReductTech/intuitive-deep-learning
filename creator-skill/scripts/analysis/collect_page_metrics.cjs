#!/usr/bin/env node
/** Collect offline TSX approximations for the statistics report.
 * Reads: module sources. Writes: none. Never executes course code or starts a browser.
 */
const fs = require('node:fs');
const path = require('node:path');
let root;
let ts;
const cache = new Map();
function buildParser() {
    return {
        help: { type: 'boolean', short: 'h', description: 'show help without scanning source files' },
        root: { type: 'string', default: path.resolve(__dirname, '../../..'), description: 'repository root' },
    };
}

function walk(n, fn) { fn(n); ts.forEachChild(n, c => walk(c, fn)); }
function literal(n) { return n && (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) ? n.text : undefined; }
function key(n) { return n?.getText().replace(/^['"]|['"]$/g, ''); }
function prop(n, k) { return n.properties?.find(p => key(p.name) === k)?.initializer; }
function parse(file) {
    if (cache.has(file))
        return cache.get(file);
    const sf = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const definitions = new Map(), imports = new Map();
    walk(sf, n => { if ((ts.isFunctionDeclaration(n) || ts.isVariableDeclaration(n)) && n.name && ts.isIdentifier(n.name))
        definitions.set(n.name.text, n); });
    for (const st of sf.statements) {
        if (!ts.isImportDeclaration(st) || !st.importClause)
            continue;
        const source = st.moduleSpecifier.text;
        const add = (local, exported) => imports.set(local, { source, exported });
        if (st.importClause.name)
            add(st.importClause.name.text, 'default');
        const b = st.importClause.namedBindings;
        if (b && ts.isNamedImports(b))
            for (const e of b.elements)
                add(e.name.text, e.propertyName?.text || e.name.text);
    }
    const record = { file, sf, definitions, imports };
    cache.set(file, record);
    return record;
}
function imported(record, name) {
    const imp = record.imports.get(name);
    if (!imp?.source.startsWith('.'))
        return null;
    const base = path.resolve(path.dirname(record.file), imp.source);
    for (const suffix of ['', '.tsx', '.ts', '.json', '/index.tsx', '/index.ts']) {
        if (fs.existsSync(base + suffix) && fs.statSync(base + suffix).isFile())
            return { file: base + suffix, name: imp.exported };
    }
    return null;
}
function value(n, record, outline, seen = new Set()) {
    if (!n)
        return undefined;
    const text = literal(n);
    if (text !== undefined)
        return text;
    if (ts.isNumericLiteral(n))
        return Number(n.text);
    if (ts.isAsExpression(n) || ts.isNonNullExpression(n) || ts.isParenthesizedExpression(n))
        return value(n.expression, record, outline, seen);
    if (ts.isIdentifier(n)) {
        if (seen.has(n.text))
            return undefined;
        seen = new Set(seen).add(n.text);
        const imp = imported(record, n.text);
        if (imp?.file.endsWith('.json'))
            return JSON.parse(fs.readFileSync(imp.file, 'utf8'));
        const def = record.definitions.get(n.text);
        return def?.initializer ? value(def.initializer, record, outline, seen) : undefined;
    }
    if (ts.isPropertyAccessExpression(n))
        return value(n.expression, record, outline, seen)?.[n.name.text];
    if (ts.isElementAccessExpression(n))
        return value(n.expression, record, outline, seen)?.[value(n.argumentExpression, record, outline, seen)];
    if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && n.expression.name.text === 'find') {
        const id = n.getText().match(/\.id\s*===?\s*['"]([^'"]+)['"]/);
        if (id)
            return outline.pages?.find(p => p.id === id[1]);
    }
    return undefined;
}
function componentRefs(node, record) {
    const refs = [];
    if (ts.isIdentifier(node))
        refs.push({ record, name: node.text });
    walk(node, n => {
        if (ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) {
            const name = n.tagName.getText();
            if (/^[A-Z][\w]*$/.test(name) && !/Provider$/.test(name))
                refs.push({ record, name });
        }
    });
    return refs;
}
const knownTextProps = /^(title|subtitle|label|description|caption|heading|placeholder|takeaway|text)$/;
function collect(record, name, inline, stack = new Set()) {
    const id = record.file + ':' + (name || inline?.pos);
    if (stack.has(id) || record.file.includes(path.sep + 'shared' + path.sep))
        return { texts: [], buttons: 0, links: 0, inputs: 0, images: 0, videos: 0, charts: 0, sources: [] };
    stack = new Set(stack).add(id);
    const result = { texts: [], buttons: 0, links: 0, inputs: 0, images: 0, videos: 0, charts: 0, sources: [path.relative(root, record.file).replaceAll('\\', '/')] };
    const target = inline || record.definitions.get(name);
    if (!target)
        return result;
    const node = target.initializer || target;
    const add = s => { if (typeof s === 'string' && s.trim())
        result.texts.push(s.replace(/\s+/g, ' ').trim()); };
    const merge = child => { result.texts.push(...child.texts); for (const k of ['buttons', 'links', 'inputs', 'images', 'videos', 'charts'])
        result[k] += child[k]; result.sources.push(...child.sources); };
    const usedVariables = new Set();
    walk(node, n => {
        if (ts.isJsxText(n))
            add(n.text);
        if (ts.isJsxExpression(n) && n.expression) {
            add(literal(n.expression));
            walk(n.expression, v => { if (ts.isIdentifier(v))
                usedVariables.add(v.text); });
            if (ts.isConditionalExpression(n.expression)) {
                add(literal(n.expression.whenTrue));
                add(literal(n.expression.whenFalse));
            }
        }
        if (ts.isJsxAttribute(n) && knownTextProps.test(n.name.text)) {
            const expr = n.initializer && ts.isJsxExpression(n.initializer) ? n.initializer.expression : n.initializer;
            add(literal(expr));
            if (expr && ts.isConditionalExpression(expr)) {
                add(literal(expr.whenTrue));
                add(literal(expr.whenFalse));
            }
        }
        if (!ts.isJsxOpeningElement(n) && !ts.isJsxSelfClosingElement(n))
            return;
        const tag = n.tagName.getText();
        const attributes = n.attributes.properties;
        const attr = key => attributes.find(a => ts.isJsxAttribute(a) && a.name.text === key);
        const attrValue = key => { const a = attr(key); return a?.initializer && ts.isJsxExpression(a.initializer) ? literal(a.initializer.expression) : literal(a?.initializer); };
        if (/^(button|Button|IconButton)$/.test(tag) || attrValue('as') === 'button' || attrValue('role') === 'button')
            result.buttons++;
        if (/^(a|AppLink|Link|ResourceLink)$/.test(tag) || attrValue('as') === 'a' || (attr('href') && !/^(use|image|linearGradient|radialGradient|pattern)$/.test(tag)))
            result.links++;
        if (/^(input|textarea|select|RangeControl|Switch|Question|Slider)$/.test(tag))
            result.inputs++;
        if (/^(img|Image|ModuleImage)$/.test(tag))
            result.images++;
        if (/^(video|Video|VideoPlayer)$/.test(tag))
            result.videos++;
        if (/Chart$|Plot$|Diagram$|^canvas$|^svg$/.test(tag))
            result.charts++;
        // Shared UI is treated as one declaration. Its own buttons are not expanded.
        if (/Provider$/.test(tag))
            return;
        const dep = imported(record, tag);
        if (dep && /\.tsx?$/.test(dep.file) && dep.file.startsWith(path.join(root, 'modules')) && !dep.file.includes(path.sep + 'shared' + path.sep))
            merge(collect(parse(dep.file), dep.name, null, stack));
        else if (/^[A-Z]/.test(tag) && record.definitions.has(tag) && tag !== name)
            merge(collect(record, tag, null, stack));
    });
    // Include literal labels from data arrays referenced by JSX, once per declaration.
    for (const variable of usedVariables) {
        const decl = record.definitions.get(variable);
        if (!decl?.initializer || (!ts.isArrayLiteralExpression(decl.initializer) && !ts.isObjectLiteralExpression(decl.initializer)))
            continue;
        walk(decl.initializer, n => {
            if (ts.isPropertyAssignment(n) && knownTextProps.test(key(n.name)))
                add(literal(n.initializer));
            if (ts.isStringLiteral(n) && ts.isArrayLiteralExpression(n.parent))
                add(n.text);
        });
    }
    result.sources = [...new Set(result.sources)];
    return result;
}
function scanModule(directory, outline) {
    const files = fs.readdirSync(directory).filter(f => /\.(tsx?|jsx)$/.test(f)).map(f => parse(path.join(directory, f)));
    const candidates = new Map();
    for (const record of files)
        walk(record.sf, n => {
            if (!ts.isObjectLiteralExpression(n))
                return;
            const id = value(prop(n, 'id'), record, outline);
            const render = prop(n, 'render') || prop(n, 'component');
            if (typeof id !== 'string' || !render)
                return;
            if (prop(n, 'showInPpt')?.kind === ts.SyntaxKind.FalseKeyword)
                return;
            const refs = componentRefs(render, record);
            const title = value(prop(n, 'title'), record, outline) || outline.pages?.find(p => p.id === id)?.title || id;
            // An explicit JSX scene wins over a wrapper calling component(context).
            const entry = { id, title, refs, record, inline: render, weight: refs.length };
            if (!candidates.has(id) || candidates.get(id).weight < entry.weight)
                candidates.set(id, entry);
        });
    // Outlines.map -> components[page.id] decks.
    if (!candidates.size)
        for (const record of files)
            walk(record.sf, n => {
                if (!ts.isPropertyAssignment(n) || !ts.isIdentifier(n.initializer))
                    return;
                const id = key(n.name), page = outline.pages?.find(p => p.id === id);
                if (page)
                    candidates.set(id, { id, title: page.title, refs: [{ record, name: n.initializer.text }], record });
            });
    // Numeric page glob used by research decks.
    if (!candidates.size && files.some(r => r.sf.text.includes("import.meta.glob('./pages/[0-9]"))) {
        const pageDir = path.join(directory, 'pages');
        const pages = fs.readdirSync(pageDir).filter(f => /^\d+.*\.tsx$/.test(f)).sort();
        for (const file of pages) {
            const p = outline.pages?.[Number(file.match(/^\d+/)[0]) - 1];
            if (p) {
                const record = parse(path.join(pageDir, file));
                candidates.set(p.id, { id: p.id, title: p.title, refs: [{ record, name: 'Page' }], record });
            }
        }
    }
    const order = new Map((outline.pages || []).map((p, i) => [p.id, i]));
    return [...candidates.values()].sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999)).map((scene, i) => {
        const metrics = { texts: [], buttons: 0, links: 0, inputs: 0, images: 0, videos: 0, charts: 0, sources: [] };
        const add = child => { metrics.texts.push(...child.texts); for (const k of ['buttons', 'links', 'inputs', 'images', 'videos', 'charts'])
            metrics[k] += child[k]; metrics.sources.push(...child.sources); };
        const visited = new Set();
        for (const ref of scene.refs) {
            const dep = imported(ref.record, ref.name);
            const record = dep ? parse(dep.file) : ref.record, name = dep?.name || ref.name;
            if (visited.has(record.file + ':' + name))
                continue;
            visited.add(record.file + ':' + name);
            add(collect(record, name));
        }
        if (!scene.refs.length && scene.inline)
            add(collect(scene.record, null, scene.inline));
        const text = metrics.texts.join('\n');
        // Use configured title only if no literal title in the component could be read.
        const countedText = text || scene.title;
        return { module: outline.id || path.basename(directory), directory: path.basename(directory), moduleTitle: outline.title, assetId: outline.moduleIdentity?.id, page: i + 1, sceneId: scene.id, title: scene.title, words: Array.from(countedText.replace(/\s/g, '')).length, text: countedText, buttons: metrics.buttons, links: metrics.links, inputs: metrics.inputs, images: metrics.images, videos: metrics.videos, charts: metrics.charts, sources: [...new Set(metrics.sources)], sourceMapped: metrics.sources.length > 0 };
    });
}
function collectMetrics(repository) {
    root = path.resolve(repository);
    ts = require(path.join(root, 'node_modules/typescript'));
    cache.clear();
    const pages = [], modules = [];
    for (const dir of fs.readdirSync(path.join(root, 'modules')).sort()) {
        const directory = path.join(root, 'modules', dir), file = path.join(directory, 'outlines.json');
        if (!fs.existsSync(file))
            continue;
        const outline = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (!outline.ppt?.entry)
            continue;
        const rows = scanModule(directory, outline);
        pages.push(...rows);
        modules.push({ directory: dir, id: outline.id || dir, title: outline.title, configuredPages: outline.pages?.length || 0, detectedPages: rows.length });
    }
    return { schemaVersion: 1, root, modules, pages,
        textCountMethod: 'source-approximation',
        textCountLimitations: 'Non-whitespace Unicode code points from statically extracted literals; hidden branches may be included, dynamic/media text may be missing. Not current rendered-state counts.' };
}
async function main(argv = process.argv.slice(2)) {
    const { emitResult, parseOptions, printHelp, reportError } = await import('../common/_cli.mjs');
    try {
        const options = buildParser();
        const args = parseOptions(argv, options);
        if (args.help) {
            printHelp('Read-only TSX declaration statistics; counts are approximate.', options);
            return 0;
        }
        emitResult(collectMetrics(args.root));
        return 0;
    }
    catch (error) {
        return reportError(error);
    }
}
module.exports = { buildParser, collectMetrics, main };
if (require.main === module)
    main().then(code => { process.exitCode = code; });
