import ts from 'typescript';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const hash = (value: string) => crypto.createHash('sha256').update(value).digest('hex');
type Target = { file: string; version: string; start: number; end: number };
export function createSourceTextEditor(root: string) {
  const targets = new Map<string, Target>();
  const modules = path.resolve(root, 'modules');
  const within = (file: string) => { const relative = path.relative(modules, file); return relative && !relative.startsWith('..') && !path.isAbsolute(relative) && !relative.replaceAll('\\', '/').startsWith('shared/'); };
  let queue = Promise.resolve();
  function transform(source: string, filename: string) {
    const file = path.resolve(filename.split('?')[0]);
    if (!file.endsWith('.tsx') || !within(file)) return null;
    for (const [id, target] of targets) if (target.file === file) targets.delete(id);
    const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const version = hash(source), edits: { start: number; end: number; value: string }[] = [];
    function blocked(node: ts.Node) {
      for (let current: ts.Node | undefined = node.parent; current; current = current.parent) {
        if (ts.isJsxElement(current)) {
          const tag = current.openingElement.tagName.getText(tree);
          if (/^(svg|canvas|script|style|textarea|option|code|pre|MathFormulaBlock|FormulaBlock|MathFormula)$/.test(tag)) return true;
        }
      }
      return false;
    }
    function mark(start: number, end: number, content: string, attribute = false) {
      const id = hash(`${file}:${version}:${start}`).slice(0, 24);
      targets.set(id, { file, version, start, end });
      const wrapped = `<span data-cw-source-text="${id}">${content}</span>`;
      edits.push({ start, end, value: attribute ? `{${wrapped}}` : wrapped });
    }
    function visit(node: ts.Node) {
      if (!blocked(node)) {
        const parentTag = node.parent && ts.isJsxElement(node.parent) ? node.parent.openingElement.tagName.getText(tree) : '';
        const textContainer = (node.parent && ts.isJsxFragment(node.parent)) || /^(Typography|h[1-6]|p|span|strong|em|small|label|button|figcaption|li|a|div|section)$/.test(parentTag);
        if (ts.isJsxText(node) && textContainer && node.getText(tree).trim()) mark(node.pos, node.end, source.slice(node.pos, node.end));
        else if (ts.isJsxExpression(node) && textContainer && node.expression && (ts.isStringLiteral(node.expression) || ts.isNoSubstitutionTemplateLiteral(node.expression)) && node.expression.text.trim()) mark(node.getStart(tree), node.end, `{${JSON.stringify(node.expression.text)}}`);
        else if (ts.isJsxAttribute(node) && ['title', 'subtitle'].includes(node.name.getText(tree)) && node.initializer) {
          const opening = node.parent.parent;
          if ((ts.isJsxOpeningElement(opening) || ts.isJsxSelfClosingElement(opening)) && opening.tagName.getText(tree) === 'ContentBlock') {
            const literal = ts.isStringLiteral(node.initializer) ? node.initializer : ts.isJsxExpression(node.initializer) && node.initializer.expression && ts.isStringLiteral(node.initializer.expression) ? node.initializer.expression : null;
            if (literal?.text.trim()) mark(node.initializer.getStart(tree), node.initializer.end, `{${JSON.stringify(literal.text)}}`, true);
          }
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(tree);
    if (!edits.length) return null;
    let code = source;
    for (const edit of edits.sort((a, b) => b.start - a.start)) code = code.slice(0, edit.start) + edit.value + code.slice(edit.end);
    return { code, map: null };
  }
  async function save(id: unknown, text: unknown) {
    if (typeof id !== 'string' || typeof text !== 'string' || !text.trim() || text.length > 4000) throw new Error('文字不能为空，且不能超过 4000 字。');
    const target = targets.get(id);
    if (!target) throw new Error('文字位置已更新，请刷新页面后重新修改。');
    const operation = queue.catch(() => {}).then(async () => {
      const real = await fs.realpath(target.file), realModules = await fs.realpath(modules);
      const relative = path.relative(realModules, real);
      if (!within(target.file) || !relative || relative.startsWith('..') || relative.replaceAll('\\', '/').startsWith('shared/') || path.isAbsolute(relative)) throw new Error('只能修改当前仓库课程页面。');
      const source = await fs.readFile(real, 'utf8');
      if (hash(source) !== target.version) throw new Error('源码已被其他操作修改，请刷新后重试，避免覆盖。');
      const next = source.slice(0, target.start) + `{${JSON.stringify(text)}}` + source.slice(target.end);
      const parsed = ts.createSourceFile(real, next, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      if ((parsed as ts.SourceFile & { parseDiagnostics: readonly ts.Diagnostic[] }).parseDiagnostics.length) throw new Error('修改无法通过 TSX 语法检查，原文件未改动。');
      const temporary = `${real}.cw-${crypto.randomUUID()}.tmp`;
      try { await fs.writeFile(temporary, next, 'utf8'); await fs.rename(temporary, real); }
      finally { await fs.rm(temporary, { force: true }); }
      return { saved: true, file: path.relative(root, real).replaceAll('\\', '/') };
    });
    queue = operation.then(() => {}, () => {});
    return operation;
  }
  return { transform, save };
}

