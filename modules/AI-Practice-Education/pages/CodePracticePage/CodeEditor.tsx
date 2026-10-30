import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, hoverTooltip, Decoration, ViewPlugin } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { python, pythonLanguage } from '@codemirror/lang-python';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { bracketMatching, indentOnInput, syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { lintGutter, setDiagnostics } from '@codemirror/lint';
const theme = EditorView.theme({
  '&': { height: '100%', backgroundColor: '#ffffff', color: '#172b49', fontSize: '28px' },
  '.cm-scroller': { overflow: 'auto', fontFamily: 'Consolas, "Cascadia Code", monospace', lineHeight: '1.4' },
  '.cm-content': { padding: '16px 0', caretColor: '#246df0' }, '.cm-line': { paddingLeft: '12px' },
  '.cm-gutters': { background: '#ffffff', color: '#92a4bc', border: 'none', padding: '0 5px' },
  '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: '#eaf3ff' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': { background: '#c9dfff' },
  '.cm-indent-guide': { backgroundImage: 'repeating-linear-gradient(to right, #e6edf7 0, #e6edf7 1px, transparent 1px, transparent 4ch)' },
  '.cm-residual-term': { background: '#cdddff', borderRadius: '3px' },
  '.cm-cursor': { borderLeftColor: '#246df0' }, '.cm-tooltip': { background: '#ffffff', color: '#243c5c', border: '1px solid #cad9ec', fontSize: 'var(--ui-type-body-size)' },
  '.cm-tooltip-autocomplete ul li[aria-selected]': { background: '#e8f1ff', color: '#174fbb' },
}, { dark: false });
const highlight = HighlightStyle.define([
  { tag: tags.keyword, color: '#9b35c5' }, { tag: tags.definition(tags.variableName), color: '#1261bf' },
  { tag: tags.number, color: '#a86420' }, { tag: tags.string, color: '#2e7c60' },
  { tag: tags.comment, color: '#7c8e9e' }, { tag: tags.function(tags.variableName), color: '#1c64b5' },
]);
function indentDecorations(view: EditorView) {
  const ranges = [];
  for (let number = 1; number <= view.state.doc.lines; number++) {
    const line = view.state.doc.line(number), indent = line.text.match(/^ +/)?.[0].length ?? 0;
    if (indent) ranges.push(Decoration.mark({ class: 'cm-indent-guide' }).range(line.from, line.from + indent));
  }
  return Decoration.set(ranges);
}
const indentGuides = ViewPlugin.fromClass(class {
  decorations;
  constructor(view: EditorView) { this.decorations = indentDecorations(view); }
  update(update: import('@codemirror/view').ViewUpdate) { if (update.docChanged) this.decorations = indentDecorations(update.view); }
}, { decorations: value => value.decorations });
const hints = [
  { label: 'conv2d', detail: '输入张量, 卷积核, padding=0, stride=1', type: 'function' },
  { label: 'relu', detail: 'NumPy：maximum(x, 0)', type: 'function' },
  { label: 'tensor', detail: '将 NumPy 数组包装为可追踪张量', type: 'function' },
  { label: 'Conv2d', detail: '输入通道, 输出通道, 核大小, padding=0', type: 'class' },
  { label: 'ReLU', detail: '逐元素取 max(x, 0)', type: 'class' }, { label: 'Module', detail: '网络模块', type: 'class' },
  { label: 'self', type: 'variable' }, { label: 'channels', type: 'variable' }, { label: 'return', type: 'keyword' }, { label: 'print', detail: '输出到控制台', type: 'function' }, { label: 'range', type: 'function' }, { label: 'len', type: 'function' }, { label: 'for', type: 'keyword' }, { label: 'if', type: 'keyword' }, { label: 'def', type: 'keyword' },
];
export function CodeEditor({ value, onChange, onCursor, selectedLine, selectedRange, errorLine, errorMessage, onRun }: {
  value: string; onChange: (text: string) => void; onCursor: (line: number, column: number) => void; selectedLine?: number; selectedRange?: { line: number; column: number; endLine: number; endColumn: number }; errorLine?: number; errorMessage?: string; onRun?: () => void;
}) {
  const host = useRef<HTMLDivElement>(null), view = useRef<EditorView | null>(null);
  const callbacks = useRef({ onChange, onCursor, onRun }); callbacks.current = { onChange, onCursor, onRun };
  const replacing = useRef(false);
  useEffect(() => {
    if (!host.current) return;
    const editor = new EditorView({ parent: host.current, state: EditorState.create({ doc: value, extensions: [
      lineNumbers(), lintGutter(), history(), drawSelection(), highlightActiveLine(), highlightActiveLineGutter(),
      python(), theme, indentGuides, syntaxHighlighting(highlight), bracketMatching(), closeBrackets(), indentOnInput(),
      keymap.of([{ key: 'Mod-Enter', run: () => { callbacks.current.onRun?.(); return true; } }, indentWithTab, ...closeBracketsKeymap, ...completionKeymap, ...defaultKeymap, ...historyKeymap]),
      EditorView.contentAttributes.of({ 'aria-label': '残差网络代码编辑器', spellcheck: 'false' }),
      autocompletion(),
      pythonLanguage.data.of({ autocomplete: (context: import('@codemirror/autocomplete').CompletionContext) => { const word = context.matchBefore(/\w*/); if (!word || (!context.explicit && word.from === word.to)) return null; return { from: word.from, options: hints }; } }),
      hoverTooltip((v, pos) => {
        const line = v.state.doc.lineAt(pos), name = /(?:Conv2d|conv2d)\s*\(/.test(line.text) ? 'conv' : /(?:ReLU|relu)\s*\(/.test(line.text) ? 'relu' : null;
        if (!name) return null;
        return { pos: line.from, above: true, create: () => { const dom = document.createElement('div'); dom.style.padding = '10px 14px'; dom.textContent = name === 'conv' ? 'conv2d(x, weight, padding=0, stride=1) · 输入：NCHW；卷积核：OIHW' : 'relu(x) · NumPy.maximum(x, 0)'; return { dom }; } };
      }),
      EditorView.updateListener.of(update => {
        if (update.docChanged && !replacing.current) callbacks.current.onChange(update.state.doc.toString());
        if (update.selectionSet && !replacing.current) callbacks.current.onCursor(update.state.doc.lineAt(update.state.selection.main.head).number, update.state.selection.main.head - update.state.doc.lineAt(update.state.selection.main.head).from);
      }),
    ] }) });
    view.current = editor;
    return () => { editor.destroy(); view.current = null; };
    // CodeMirror owns the document after mount; prop changes are dispatched below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const editor = view.current;
    if (editor && value !== editor.state.doc.toString()) { replacing.current = true; editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: value } }); replacing.current = false; }
  }, [value]);
  useEffect(() => {
    const editor = view.current, number = selectedRange?.line ?? selectedLine;
    if (!editor || !number || number > editor.state.doc.lines) return;
    const line = editor.state.doc.line(number);
    replacing.current = true;
    const anchor = line.from + Math.min(selectedRange?.column ?? 0, line.length);
    const end = selectedRange && selectedRange.endLine <= editor.state.doc.lines ? editor.state.doc.line(selectedRange.endLine) : line;
    const head = selectedRange ? end.from + Math.min(selectedRange.endColumn, end.length) : anchor;
    editor.dispatch({ selection: { anchor, head }, effects: EditorView.scrollIntoView(anchor, { y: 'nearest' }) });
    if (selectedRange) editor.focus();
    replacing.current = false;
  }, [selectedLine, selectedRange]);
  useEffect(() => {
    const editor = view.current;
    if (!editor) return;
    const line = errorLine && errorLine <= editor.state.doc.lines ? editor.state.doc.line(errorLine) : undefined;
    editor.dispatch(setDiagnostics(editor.state, line ? [{ from: line.from, to: line.to, severity: 'error', message: errorMessage || 'Python 执行错误，请查看控制台。' }] : []));
  }, [errorLine, errorMessage, value]);
  return <div className="code-lab-editor-host" ref={host}/>;
}

