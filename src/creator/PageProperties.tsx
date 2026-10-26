import { useEffect, useRef, useState } from 'react';
import type { CreatorPage } from './model';

const fields = [
  ['title', '页面标题', 2], ['goal', '教学目标', 3], ['summary', '内容摘要', 3],
  ['snippet', '讲稿', 5],
] as const;
const standard = new Set(['id', ...fields.map(([key]) => key)]);
const obsolete = new Set(['interaction', 'next', 'section', 'implementationStatus']);
export function PageProperties({ page, index, count, onSave, onClose, onMove, onDuplicate, onDelete }: {
  page: CreatorPage; index: number; count: number; onSave: (outline: Record<string, unknown>) => void; onClose: () => void;
  onMove: (delta: number) => void; onDuplicate: () => void; onDelete: () => void;
}) {
  const [values, setValues] = useState<Record<string, unknown>>(() => ({ ...page.outline, id: page.id, title: page.title, goal: page.goal, summary: page.summary }));
  const [extra, setExtra] = useState(() => JSON.stringify(Object.fromEntries(Object.entries(page.outline ?? {}).filter(([key]) => !standard.has(key) && !obsolete.has(key))), null, 2));
  const [error, setError] = useState('');
  const dialog = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.querySelector<HTMLTextAreaElement>('textarea')?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); onClose(); return; }
      if (event.key !== 'Tab') return;
      const controls = [...(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),textarea,input,summary') ?? [])];
      if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls.at(-1)?.focus(); }
      else if (!event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0]?.focus(); }
    };
    window.addEventListener('keydown', key, true);
    return () => { window.removeEventListener('keydown', key, true); previous?.focus(); };
  }, []);
  function save() {
    try {
      const rest: unknown = JSON.parse(extra);
      if (!rest || typeof rest !== 'object' || Array.isArray(rest)) throw new Error('其他属性需要是 JSON 对象。');
      if (Object.keys(rest).some(key => obsolete.has(key))) throw new Error('大纲不保存交互方案、章节、衔接或制作状态，请移除这些遗留属性。');
      if (!String(values.title ?? '').trim()) throw new Error('请填写页面标题。');
      const outline = { ...rest, ...Object.fromEntries(fields.map(([key]) => [key, String(values[key] ?? '')])), id: page.id };
      onSave(outline); onClose();
    } catch (error) { setError(error instanceof SyntaxError ? '其他属性的 JSON 格式有误，请检查后保存。' : error instanceof Error ? error.message : '无法保存属性。'); }
  }
  return <div className="cw-backdrop" onClick={event => { if (event.target === event.currentTarget) onClose(); }}><section ref={dialog} className="cw-dialog cw-properties" role="dialog" aria-modal="true" aria-labelledby="cw-properties-title"><header><div><small>第 {index + 1} 页</small><h2 id="cw-properties-title">页面属性</h2></div><button aria-label="关闭页面属性" onClick={onClose}>×</button></header>
    <div className="cw-properties-scroll"><p className="cw-muted">编辑本页的教学设计，保存后用于后续创作。</p><label className="cw-property-id">页面 ID <code>{page.id}</code></label>
      {fields.map(([key, label, rows]) => <label className="cw-property-field" key={key}><span>{label}<small>{key}</small></span><textarea aria-label={label} rows={rows} value={String(values[key] ?? '')} onChange={event => setValues(current => ({ ...current, [key]: event.target.value }))} /></label>)}
      <details className="cw-property-extra"><summary>参考资料与其他属性</summary><p className="cw-muted">用于保留原稿来源等溯源信息。</p><textarea aria-label="其他页面属性 JSON" rows={8} spellCheck={false} value={extra} onChange={event => setExtra(event.target.value)} /></details>
      {error && <p className="cw-action-error" role="alert">{error}</p>}
    </div><footer><details className="cw-property-actions"><summary>页面操作 ···</summary><div><button disabled={index === 0} onClick={() => { onMove(-1); onClose(); }}>上移</button><button disabled={index === count - 1} onClick={() => { onMove(1); onClose(); }}>下移</button><button disabled={count >= 100} onClick={() => { onDuplicate(); onClose(); }}>复制页面</button><button disabled={count === 1} onClick={() => { onDelete(); onClose(); }}>删除页面</button></div></details><div><button onClick={onClose}>取消</button><button className="cw-primary" onClick={save}>保存属性</button></div></footer>
  </section></div>;
}
