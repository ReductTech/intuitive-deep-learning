import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import { useActivityState, type ActivityProps } from '../../components/AttentionActivity';
import { useAttentionLesson } from '../../model/AttentionLessonContext';
import { QKV_TASKS, type QkvTask } from '../../model/qkvRole';
import './AttentionKeyValuePurposePage.css';

const replacements: Record<QkvTask, string> = {
  who: '小红', why: '剪辑活动回顾', where: '学校操场', what: '黑衣队传球',
};
type ValueComparison = { changed: boolean; explored: boolean };
function isValueComparison(value: unknown): value is ValueComparison {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const state = value as Partial<ValueComparison>;
  return typeof state.changed === 'boolean' && typeof state.explored === 'boolean'
    && (!state.changed || state.explored);
}
type MatchWire = { id: QkvTask; path: string; head: string; selected: boolean };

export function AttentionKeyValuePurposePage({ onComplete, isComplete }: ActivityProps) {
  const { qkv } = useAttentionLesson();
  const [state, setState] = useActivityState<ValueComparison>(
    'C26-campus-value-comparison', { changed: false, explored: false }, isValueComparison,
  );
  const [active, setActive] = useState(false);
  const [mathReady, setMathReady] = useState(false);
  const [wires, setWires] = useState<MatchWire[]>([]);
  const root = useRef<HTMLElement>(null);
  const main = useRef<HTMLDivElement>(null);
  const queryRef = useRef<HTMLElement>(null);
  const keyRefs = useRef<Partial<Record<QkvTask, HTMLTableCellElement>>>({});
  const current = QKV_TASKS.find(task => task.id === qkv.task) ?? QKV_TASKS[2];
  // This hypothetical comparison derives new display values without changing the activity record.
  const rows = QKV_TASKS.map(task => ({
    ...task,
    weight: task.id === current.id ? 0.7 : 0.1,
    changed: state.changed && task.id === current.id,
    value: state.changed && task.id === current.id ? replacements[task.id] : task.content,
  }));

  useEffect(() => {
    let mounted = true;
    void customElements.whenDefined('math-field').then(() => { if (mounted) setMathReady(true); });
    return () => { mounted = false; };
  }, []);

  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const syncVisibility = () => {
      const hidden = Boolean(element.closest('[aria-hidden="true"], [hidden]'));
      element.inert = hidden;
      setActive(!hidden && !document.hidden);
    };
    const observer = new MutationObserver(syncVisibility);
    for (let ancestor: HTMLElement | null = element; ancestor; ancestor = ancestor.parentElement) {
      observer.observe(ancestor, { attributes: true, attributeFilter: ['aria-hidden', 'hidden'] });
    }
    document.addEventListener('visibilitychange', syncVisibility);
    syncVisibility();
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', syncVisibility); };
  }, []);

  useLayoutEffect(() => {
    const host = main.current;
    const queryElement = queryRef.current;
    if (!host || !queryElement || !active) return;
    const update = () => {
      const box = host.getBoundingClientRect();
      const queryBox = queryElement.getBoundingClientRect();
      if (!box.width || !box.height) return;
      const x1 = (queryBox.right - box.left) / box.width * 1000;
      const y1 = (queryBox.top + queryBox.height / 2 - box.top) / box.height * 1000;
      const arrowWidth = 8 / box.width * 1000;
      const arrowHeight = 5 / box.height * 1000;
      const connections = QKV_TASKS.flatMap(task => {
        const key = keyRefs.current[task.id];
        if (!key) return [];
        const keyBox = key.getBoundingClientRect();
        const x2 = (keyBox.left - box.left) / box.width * 1000 - 4;
        const y2 = (keyBox.top + keyBox.height / 2 - box.top) / box.height * 1000;
        const bend = (x1 + x2) / 2;
        return [{ id: task.id, selected: task.id === current.id,
          path: 'M ' + x1 + ' ' + y1 + ' C ' + bend + ' ' + y1 + ', ' + bend + ' ' + y2 + ', ' + x2 + ' ' + y2,
          head: 'M ' + (x2 - arrowWidth) + ' ' + (y2 - arrowHeight) + ' L ' + x2 + ' ' + y2 + ' L ' + (x2 - arrowWidth) + ' ' + (y2 + arrowHeight) }];
      });
      setWires(connections.sort((left, right) => Number(left.selected) - Number(right.selected)));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(host);
    observer.observe(queryElement);
    Object.values(keyRefs.current).forEach(element => { if (element) observer.observe(element); });
    return () => observer.disconnect();
  }, [active, current.id, state.changed]);

  useEffect(() => {
    if (active && state.explored && !isComplete) onComplete();
  }, [active, state.explored, isComplete, onComplete]);

  const setMode = (changed: boolean) => {
    if (!active || document.hidden || state.changed === changed
      || root.current?.closest('[aria-hidden="true"], [hidden]')) return;
    setState(previous => ({ changed, explored: previous.explored || changed }));
  };
  const ready = mathReady && wires.length === 4;

  return <ContentBlock ref={root} title="Q、K、V：问题、索引与内容" headingLevel={1}
    subtitle="固定 Q、K，只替换 V。"
    className="attn-kv-purpose-page" bodyClassName="attn-kv-purpose-body"
    data-activity="C26" data-activity-complete={state.explored}
    data-kv-query-task={current.id} data-kv-state={state.changed ? 'changed' : 'original'}
    data-capture-ready={ready} aria-busy={!ready}>
    <div ref={main} className="attn-kv-purpose-main">
      <section ref={queryRef} className="attn-kv-purpose-query" aria-label="固定的问题 Q">
        <Typography variant="body" tone="inherit" className="attn-kv-purpose-query-label">Q · 问题</Typography>
        <Typography variant="h3" tone="accent" className="attn-kv-purpose-query-text" data-kv-query>{current.question}</Typography>
      </section>
      <Typography variant="bodySmall" tone="muted" className="attn-kv-purpose-match-label">匹配 K</Typography>
      <svg className="attn-kv-purpose-wires" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
        {wires.map(wire => <g key={wire.id}>
          <path d={wire.path} data-kv-wire={wire.id} className={wire.selected ? 'is-selected' : ''} vectorEffect="non-scaling-stroke" />
          <path d={wire.head} className={wire.selected ? 'is-selected' : ''} vectorEffect="non-scaling-stroke" />
        </g>)}
      </svg>
      <div className="attn-kv-purpose-pairs">
        <table aria-label="固定匹配索引和权重，仅对当前内容作假设替换">
          <colgroup><col className="attn-kv-purpose-col-key" /><col className="attn-kv-purpose-col-weight" /><col /></colgroup>
          <thead><tr>
            <th scope="col"><Typography variant="body" tone="inherit">K · 索引</Typography></th>
            <th scope="col"><Typography variant="body" tone="inherit">w</Typography></th>
            <th scope="col"><Typography variant="body" tone="inherit">V · 内容</Typography></th>
          </tr></thead>
          <tbody>{rows.map(row => <tr key={row.id} data-kv-row={row.id}>
            <td ref={element => { if (element) keyRefs.current[row.id] = element; }}
              className={row.id === current.id ? 'is-key is-selected' : 'is-key'}
              data-kv-key={row.id} data-key-value={row.clue}>
              <Typography variant="h3" tone="accent">{row.clue}</Typography>
            </td>
            <td data-kv-weight={row.id} data-weight={row.weight.toFixed(2)}>
              <Typography variant="body" tone="accent" align="center">{row.weight.toFixed(2)}</Typography>
            </td>
            <td className={row.changed ? 'is-value is-changed' : 'is-value'} data-kv-value={row.id}
              data-value={row.value} data-original-value={row.content}>
              {row.changed && <Typography variant="bodySmall" tone="muted">原：{row.content}</Typography>}
              <Typography variant="h3" tone={row.changed ? 'success' : 'main'}>{row.value}</Typography>
            </td>
          </tr>)}</tbody>
        </table>
      </div>
    </div>
    <div className="attn-kv-purpose-formulas">
      <MathFormulaBlock appearance="plain" ariaLabel="权重 w 由问题 q 与匹配索引 K 决定">
        <MathFormulaStatic latex={'\\boldsymbol{w}=f(\\boldsymbol{q},K)'} />
      </MathFormulaBlock>
      <MathFormulaBlock appearance="plain" ariaLabel="读取结果 r 等于各内容向量乘以对应权重再求和">
        <MathFormulaStatic latex={'\\boldsymbol{r}=\\sum_i w_i\\boldsymbol{v}_i'} />
      </MathFormulaBlock>
    </div>
    <footer className="attn-kv-purpose-footer">
      <div className="attn-kv-purpose-footer-top">
        <Typography variant="h3" tone="accent">只换 V，读取内容随之变。</Typography>
        <div className="attn-kv-purpose-modes" role="group" aria-label="比较原来的内容与假设替换"
          onKeyDown={event => { if ([' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.stopPropagation(); }}>
          <Button active={!state.changed} aria-pressed={!state.changed} data-kv-mode="original" onClick={() => setMode(false)}>
            <Typography as="span" variant="bodySmall" tone="inherit">原来的 V</Typography>
          </Button>
          <Button active={state.changed} aria-pressed={state.changed} className="is-hypothesis" data-kv-mode="changed" onClick={() => setMode(true)}>
            <Typography as="span" variant="bodySmall" tone="inherit">假设替换 V</Typography>
          </Button>
        </div>
      </div>
      <div className="attn-kv-purpose-result" aria-live="polite" data-weight-sum={rows.reduce((sum, row) => sum + row.weight, 0).toFixed(2)}>
        <Typography variant="bodySmall" tone="accent">手设份额：</Typography>
        <div className="attn-kv-purpose-shares">
          {rows.map(row => <div key={row.id} className={row.changed ? 'is-changed' : ''}
            data-kv-share={row.id} data-share-weight={row.weight.toFixed(2)} data-share-value={row.value}>
            <Typography variant="bodySmall" tone={row.changed ? 'success' : 'main'}>{row.weight.toFixed(2)} · {row.value}</Typography>
          </div>)}
        </div>
      </div>
      <Typography variant="bodySmall" tone="muted">文字为向量标签。</Typography>
    </footer>
  </ContentBlock>;
}
