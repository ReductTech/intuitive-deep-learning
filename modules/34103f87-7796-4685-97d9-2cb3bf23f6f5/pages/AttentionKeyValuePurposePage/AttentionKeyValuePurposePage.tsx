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

  return <ContentBlock shuku-edit-id="e-43f2ed3a-e094-43e5-a50b-f99836ccd172" ref={root} title="Q、K、V：问题、索引与内容" headingLevel={1}
    subtitle="固定 Q、K，只替换 V。"
    className="attn-kv-purpose-page" bodyClassName="attn-kv-purpose-body"
    data-activity="C26" data-activity-complete={state.explored}
    data-kv-query-task={current.id} data-kv-state={state.changed ? 'changed' : 'original'}
    data-capture-ready={ready} aria-busy={!ready}>
    <div shuku-edit-id="e-f03a86fb-18dd-4014-8657-8bebb3c98d50" ref={main} className="attn-kv-purpose-main">
      <section shuku-edit-id="e-fee48d55-07dc-41cc-9610-70779e48beba" ref={queryRef} className="attn-kv-purpose-query" aria-label="固定的问题 Q">
        <Typography shuku-edit-id="e-c2898028-6785-41fa-b791-4baf2c091353" variant="body" tone="inherit" className="attn-kv-purpose-query-label">Q · 问题</Typography>
        <Typography shuku-edit-id="e-974b89be-9415-42dd-9107-24a611fe41a2" variant="h3" tone="accent" className="attn-kv-purpose-query-text" data-kv-query>{current.question}</Typography>
      </section>
      <Typography shuku-edit-id="e-10641587-06ae-4094-9773-1c4408e47b29" variant="bodySmall" tone="muted" className="attn-kv-purpose-match-label">匹配 K</Typography>
      <svg shuku-edit-id="e-739e24c2-aca4-44cf-ac48-81d6eb436904" className="attn-kv-purpose-wires" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
        {wires.map(wire => <g shuku-edit-id="e-f18bed19-17d3-4f17-8a21-f6e129d12463" key={wire.id}>
          <path shuku-edit-id="e-bbabbac5-f41b-4689-84a2-24268abf8e87" d={wire.path} data-kv-wire={wire.id} className={wire.selected ? 'is-selected' : ''} vectorEffect="non-scaling-stroke" />
          <path shuku-edit-id="e-4ba6c2db-e151-4173-8fb5-0a03f97e7662" d={wire.head} className={wire.selected ? 'is-selected' : ''} vectorEffect="non-scaling-stroke" />
        </g>)}
      </svg>
      <div shuku-edit-id="e-fcdd4a0a-8ddd-4d92-ad25-47efadc9eea2" className="attn-kv-purpose-pairs">
        <table shuku-edit-id="e-a4d0b322-c7cb-46c3-bb3d-cc952ed7680b" aria-label="固定匹配索引和权重，仅对当前内容作假设替换">
          <colgroup shuku-edit-id="e-18b23e56-4548-4496-906a-a547b1f3b5c6"><col shuku-edit-id="e-dbcea224-2274-43bb-ad39-9e4efb139a69" className="attn-kv-purpose-col-key" /><col shuku-edit-id="e-32c1d9a6-2c62-4fb5-9149-d8a62da9116b" className="attn-kv-purpose-col-weight" /><col shuku-edit-id="e-3b4c926e-8bac-498a-b6df-4a8bf2fcaab9" /></colgroup>
          <thead shuku-edit-id="e-2cf07e65-4451-4260-a28b-551151a33dfc"><tr shuku-edit-id="e-1f877f2b-4204-4c40-a23b-4eadfc7582e7">
            <th shuku-edit-id="e-9f6c673a-4dce-438e-9422-0d8ef62eaf31" scope="col"><Typography shuku-edit-id="e-f3bb5ea3-3386-4dbe-a16f-eb7b653baf49" variant="body" tone="inherit">K · 索引</Typography></th>
            <th shuku-edit-id="e-68eb2e21-77fe-4bbb-9228-d73b2ceda7f8" scope="col"><Typography shuku-edit-id="e-3c26c307-b4c8-449d-98e8-a43d7f81434c" variant="body" tone="inherit">w</Typography></th>
            <th shuku-edit-id="e-d95bd337-2cb2-43a7-84cb-71411150e641" scope="col"><Typography shuku-edit-id="e-ca80d9bf-6602-4faa-9801-7b180a9d81db" variant="body" tone="inherit">V · 内容</Typography></th>
          </tr></thead>
          <tbody shuku-edit-id="e-564429ce-ed33-4e50-8111-acf3f6139721">{rows.map(row => <tr shuku-edit-id="e-ad7dfa31-ecb7-47a6-93b2-d3c2666f5b5c" key={row.id} data-kv-row={row.id}>
            <td shuku-edit-id="e-5911df50-bc2b-41e4-9d7b-c28a8a2aa4ce" ref={element => { if (element) keyRefs.current[row.id] = element; }}
              className={row.id === current.id ? 'is-key is-selected' : 'is-key'}
              data-kv-key={row.id} data-key-value={row.clue}>
              <Typography shuku-edit-id="e-dc711a6f-64e5-4a91-b72b-f30ae0a005d8" variant="h3" tone="accent">{row.clue}</Typography>
            </td>
            <td shuku-edit-id="e-1ded58e8-cc75-44fd-9ea9-8ec7c59d9f69" data-kv-weight={row.id} data-weight={row.weight.toFixed(2)}>
              <Typography shuku-edit-id="e-dfac0c99-0e10-4c0d-828e-3a918c8aecce" variant="body" tone="accent" align="center">{row.weight.toFixed(2)}</Typography>
            </td>
            <td shuku-edit-id="e-98824980-3a28-4f89-bc6e-72af8b5fd6f6" className={row.changed ? 'is-value is-changed' : 'is-value'} data-kv-value={row.id}
              data-value={row.value} data-original-value={row.content}>
              {row.changed && <Typography shuku-edit-id="e-e2c7e19f-fb0d-4d25-ae59-c5b78dfa7f48" variant="bodySmall" tone="muted">原：{row.content}</Typography>}
              <Typography shuku-edit-id="e-161f717a-bcb9-4bc6-b3f7-db021ebd8943" variant="h3" tone={row.changed ? 'success' : 'main'}>{row.value}</Typography>
            </td>
          </tr>)}</tbody>
        </table>
      </div>
    </div>
    <div shuku-edit-id="e-f17e689c-576e-4fff-b507-70dd0b5be5f6" className="attn-kv-purpose-formulas">
      <MathFormulaBlock appearance="plain" ariaLabel="权重 w 由问题 q 与匹配索引 K 决定">
        <MathFormulaStatic latex={'\\boldsymbol{w}=f(\\boldsymbol{q},K)'} />
      </MathFormulaBlock>
      <MathFormulaBlock appearance="plain" ariaLabel="读取结果 r 等于各内容向量乘以对应权重再求和">
        <MathFormulaStatic latex={'\\boldsymbol{r}=\\sum_i w_i\\boldsymbol{v}_i'} />
      </MathFormulaBlock>
    </div>
    <footer shuku-edit-id="e-a9432d6f-0dfe-44bc-864b-8462dbb54d78" className="attn-kv-purpose-footer">
      <div shuku-edit-id="e-a0a20ea9-0bbe-44d5-b3c3-b12a4b0953b7" className="attn-kv-purpose-footer-top">
        <Typography shuku-edit-id="e-65a5db71-a725-46b5-a210-80220bab1e39" variant="h3" tone="accent">只换 V，读取内容随之变。</Typography>
        <div shuku-edit-id="e-51b56ff7-2e93-446a-baa9-5539713bb5df" className="attn-kv-purpose-modes" role="group" aria-label="比较原来的内容与假设替换"
          onKeyDown={event => { if ([' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.stopPropagation(); }}>
          <Button active={!state.changed} aria-pressed={!state.changed} data-kv-mode="original" onClick={() => setMode(false)}>
            <Typography shuku-edit-id="e-e0d43168-095e-4f0c-af68-83cdc7b00e20" as="span" variant="bodySmall" tone="inherit">原来的 V</Typography>
          </Button>
          <Button active={state.changed} aria-pressed={state.changed} className="is-hypothesis" data-kv-mode="changed" onClick={() => setMode(true)}>
            <Typography shuku-edit-id="e-06cc913a-edc5-4ff2-84a3-6e7d2f83c376" as="span" variant="bodySmall" tone="inherit">假设替换 V</Typography>
          </Button>
        </div>
      </div>
      <div shuku-edit-id="e-186593a9-2663-4085-a3a3-705d4cf4d95a" className="attn-kv-purpose-result" aria-live="polite" data-weight-sum={rows.reduce((sum, row) => sum + row.weight, 0).toFixed(2)}>
        <Typography shuku-edit-id="e-b15933be-c404-450d-91da-5b3fa82b57af" variant="bodySmall" tone="accent">手设份额：</Typography>
        <div shuku-edit-id="e-5da78729-4c8d-46f3-a880-86152ccaaa1d" className="attn-kv-purpose-shares">
          {rows.map(row => <div shuku-edit-id="e-70582713-cf49-41a7-b519-87b75659e030" key={row.id} className={row.changed ? 'is-changed' : ''}
            data-kv-share={row.id} data-share-weight={row.weight.toFixed(2)} data-share-value={row.value}>
            <Typography shuku-edit-id="e-4e4afa14-0b62-4529-b98c-18d23fe6c82f" variant="bodySmall" tone={row.changed ? 'success' : 'main'}>{row.weight.toFixed(2)} · {row.value}</Typography>
          </div>)}
        </div>
      </div>
      <Typography shuku-edit-id="e-6e96216b-5358-4e39-b36e-b19f0095585c" variant="bodySmall" tone="muted">文字为向量标签。</Typography>
    </footer>
  </ContentBlock>;
}
