import { moduleIdentity } from '../../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import { useEffect, useReducer, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, NoticeStrip, Typography } from "@shuku/course-style/react";
import { useCompleteOnce } from '../../hooks/useCompleteOnce';
const bottleFront = moduleAssetUrl("recycling/camera-views/bottle-front.jpg");
import { centerCell, containsCell, layerSize, traceReceptiveField, type Cell, type ConvDepth, type Region } from './receptiveField';
import { DependencyBands } from './DependencyBands';
import { FeatureCompositionLab } from './FeatureCompositionLab';
import { compositionComplete, compositionNotice, compositionReducer, createCompositionState } from './compositionModel';
import './DepthCapacityPage.css';

const prefix = 'rtg-depth-capacity';
const c = (part: string) => prefix + '__' + part;
const cellIndices = (size: number) => Array.from({ length: size * size }, (_, index) => index);
const gridStyle = (size: number) => ({ '--grid-count': size }) as CSSProperties;
const regionStyle = ({ row, column, size }: Region): CSSProperties => ({
  left: column / 7 * 100 + '%', top: row / 7 * 100 + '%',
  width: size / 7 * 100 + '%', height: size / 7 * 100 + '%',
});

function Dimensions({ size, label }: { size: number; label?: string }) {
  return <MathFormulaBlock appearance="plain" ariaLabel={label ?? size + ' 行 ' + size + ' 列'}>
    <MathFormulaStatic latex={size + '\\times' + size} />
  </MathFormulaBlock>;
}

function Arrow({ backward = false, active = true }: { backward?: boolean; active?: boolean }) {
  return <svg shuku-edit-id="e-506dea7f-4b97-4b85-921d-a35fd8f75481" className={c('arrow') + (backward ? ' is-backward' : '') + (active ? ' is-active' : '')}
    viewBox="0 0 80 32" fill="none" aria-hidden="true"><path shuku-edit-id="e-509a5d4e-ca49-4601-b2dd-89de42332312" d="M7 16H69M57 5L69 16L57 27" /></svg>;
}

export interface DepthCapacityPageProps { onComplete?: () => void; }

export function DepthCapacityPage({ onComplete }: DepthCapacityPageProps) {
  const [act, setAct] = useState<'range' | 'composition'>('range');
  const [depth, setDepth] = useState<ConvDepth>(1);
  const [selected, setSelected] = useState<Cell | null>(null);
  const [focusIndex, setFocusIndex] = useState(12);
  const [observedDepth, setObservedDepth] = useState(0);
  const [composition, dispatchComposition] = useReducer(compositionReducer, undefined, createCompositionState);
  const [resetVersion, setResetVersion] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const previousRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const moveFocus = useRef(false);
  const outputSize = layerSize(depth);
  const previousSize = layerSize((depth - 1) as 0 | 1 | 2);
  const trace = selected ? traceReceptiveField(depth, selected) : null;
  const canCompose = observedDepth === 3;
  const complete = canCompose && compositionComplete(composition);
  useCompleteOnce(complete, onComplete);

  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    headingRef.current?.focus({ preventScroll: true });
  }, [act, depth]);

  function selectCell(cell: Cell) {
    setSelected(cell);
    setFocusIndex(cell.row * outputSize + cell.column);
    setObservedDepth(current => Math.max(current, depth));
  }

  function advanceRange() {
    if (!selected) return;
    moveFocus.current = true;
    if (depth < 3) {
      const next = (depth + 1) as ConvDepth, center = centerCell(next);
      setDepth(next); setSelected(null);
      setFocusIndex(center.row * layerSize(next) + center.column);
    } else setAct('composition');
  }

  function navigateGrid(event: KeyboardEvent<HTMLDivElement>) {
    const button = (event.target as Element).closest('[data-output-index]');
    if (!button) return;
    const index = Number(button.getAttribute('data-output-index'));
    const row = Math.floor(index / outputSize), column = index % outputSize;
    let next = index;
    if (event.key === 'ArrowLeft') next = row * outputSize + Math.max(0, column - 1);
    else if (event.key === 'ArrowRight') next = row * outputSize + Math.min(outputSize - 1, column + 1);
    else if (event.key === 'ArrowUp') next = Math.max(0, row - 1) * outputSize + column;
    else if (event.key === 'ArrowDown') next = Math.min(outputSize - 1, row + 1) * outputSize + column;
    else if (event.key === 'Home') next = row * outputSize;
    else if (event.key === 'End') next = row * outputSize + outputSize - 1;
    else return;
    event.preventDefault(); event.stopPropagation();
    setFocusIndex(next);
    gridRef.current?.querySelector<HTMLButtonElement>('[data-output-index="' + next + '"]')?.focus({ preventScroll: true });
  }

  function reset() {
    setAct('range'); setDepth(1); setSelected(null); setFocusIndex(12);
    setObservedDepth(0); dispatchComposition({ type: 'reset' });
    setResetVersion(current => current + 1);
  }

  const notice = act === 'range'
    ? trace ? '后层取相邻位置的结果；这些结果又各自联系着更早的输入。' : '先点右侧亮起的格子，看看它联系着输入中的哪些位置。'
    : compositionNotice(composition);

  return <ContentBlock shuku-edit-id="e-76bd7b93-b6e4-4a12-a4ea-183ae7d9dd63" headingLevel={1} className={prefix}
    title="更多层，究竟多了什么能力？" subtitle="后层在组合前层的结果，因而能关联更大范围。"
    data-act={act} data-depth={depth} data-observed-depth={observedDepth} data-composition={composition.misplaced ? 'misplaced' : 'aligned'} data-complete={complete}
    onKeyDown={event => {
      if ((event.key === ' ' || event.key === 'Enter') && (event.target as Element).closest('button')) {
        event.stopPropagation(); if (event.repeat) event.preventDefault();
      }
    }}>
    <nav shuku-edit-id="e-57a449a5-3150-4641-962f-044d5e2a2ac3" className={c('acts')} aria-label="本页学习阶段">
      <Button active={act === 'range'} aria-current={act === 'range' ? 'step' : undefined}
        onClick={() => setAct('range')}><Typography shuku-edit-id="e-1ce19d47-4294-48b7-b723-b4119f97949a" as="span" variant="bodySmall" tone="inherit">① 看得更广</Typography></Button>
      <Button active={act === 'composition'} disabled={!canCompose} aria-current={act === 'composition' ? 'step' : undefined}
        onClick={() => { if (canCompose) setAct('composition'); }}><Typography shuku-edit-id="e-846941ed-527a-4763-bd39-1b72b55ebd68" as="span" variant="bodySmall" tone="inherit">② 组合更复杂</Typography></Button>
      <Button className={c('reset')} onClick={reset} aria-label="重新观察本页两幕">
        <Typography shuku-edit-id="e-7f3ea601-b395-49f4-844b-7f99a13676a1" as="span" variant="bodySmall" tone="inherit">↶ 重新观察</Typography>
      </Button>
    </nav>

    <section shuku-edit-id="e-e28d8c6d-965a-42de-8313-61fa2792c533" className={c('workbench')} aria-labelledby="rtg-depth-scene-title">
      <div shuku-edit-id="e-e39691e0-d3c3-4b12-88cd-9efe31fbfc2b" className={c('scene-head')}>
        <Typography shuku-edit-id="e-6c680b40-3c17-460a-805c-8c7dff4189cf" as="h2" variant="body" tone="accent" id="rtg-depth-scene-title" tabIndex={-1} ref={headingRef}>
          {act === 'range' ? '点一个后层格子，反向追踪来源' : '改变一条线索，看看后层怎样响应'}
        </Typography>
        {act === 'range' && <div shuku-edit-id="e-e4887e1f-f3fb-4d17-9b59-59df08f622ee" className={c('condition')}>
          <Dimensions size={3} label="每层使用三行三列卷积核" /><Typography shuku-edit-id="e-b48da243-4e4f-41b9-afe7-2044dda370ec" variant="bodySmall" tone="muted">卷积 · 步长 1 · 不补边</Typography>
        </div>}
      </div>

      {act === 'range' ? <>
        <div shuku-edit-id="e-7abf5070-1700-41d3-af72-c7c42294d227" className={c('range-stage')} ref={stageRef}>
          <article shuku-edit-id="e-b09f2638-1f85-4810-8482-b0242aa4320c" className={c('column')}>
            <Typography shuku-edit-id="e-65c1243d-f66e-46ad-b398-fb60d948ad90" as="h3" variant="body" tone="accent">输入图像 · 空间示意</Typography>
            <div shuku-edit-id="e-5f8b3a36-f5c1-49b7-b52e-ff281ac5c776" className={c('visual-slot')}>
              <div shuku-edit-id="e-a8293003-936a-4d75-b172-c377438478a6" ref={inputRef} className={c('input')} role="img" aria-label={trace ? '输入空间示意：已连接 ' + trace.input.size + ' 行 ' + trace.input.size + ' 列区域' : '塑料瓶照片上的七行七列空间示意网格'}>
                <img shuku-edit-id="e-5b994215-0bf6-4bf0-9770-de7b3ae308d6" src={bottleFront} alt="" />
                <div shuku-edit-id="e-611ee7c0-59cb-4122-ba2e-d2bc014458fc" className={c('input-grid')} aria-hidden="true">{cellIndices(7).map(index => <i shuku-edit-id="e-19108a11-5e61-45ed-b5d7-2d81f1c76993" key={index} />)}</div>
                {trace && <span shuku-edit-id="e-4d4d4cac-6f64-41cc-b6fb-71c50150f157" className={c('input-region')} style={regionStyle(trace.input)} aria-hidden="true" />}
              </div>
            </div>
            <div shuku-edit-id="e-2141d49d-31cb-4572-a948-6eb96a30ddbb" className={c('caption')}>
              {trace ? <><Typography shuku-edit-id="e-79917d3e-8328-4cfc-ae2d-9622b0d78f96" as="span" variant="bodySmall" tone="warning">联系到</Typography><Dimensions size={trace.input.size} /></>
                : <Typography shuku-edit-id="e-83f70c06-393a-438e-ae4c-2d6551815866" variant="bodySmall" tone="muted">网格仅示意空间位置</Typography>}
            </div>
          </article>
          <Arrow backward active={Boolean(trace)} />
          <article shuku-edit-id="e-e087e011-8d35-47a6-b061-17a675750f38" className={c('column')}>
            <Typography shuku-edit-id="e-8e9d0ffb-150f-4e0f-ba13-9da4920cf288" as="h3" variant="body" tone="accent">{depth === 1 ? '输入网格' : '第 ' + (depth - 1) + ' 层'}</Typography>
            <div shuku-edit-id="e-cf4946b8-daee-4823-83ca-5cc088e3b8c1" className={c('visual-slot')}>
              <div shuku-edit-id="e-28640701-8119-4839-b061-3ed53e387cc7" ref={previousRef} className={c('position-grid')} style={gridStyle(previousSize)} aria-hidden="true">
                {cellIndices(previousSize).map(index => <span shuku-edit-id="e-1e4467a4-2ce0-4b36-b667-a572a2f9d277" key={index}
                  className={trace && containsCell({ row: Math.floor(index / previousSize), column: index % previousSize }, trace.previous) ? 'is-included' : ''} />)}
              </div>
            </div>
            <div shuku-edit-id="e-8e897106-aa22-473b-a6a9-b49c4d9bf6a6" className={c('caption')}>
              {trace ? <><Typography shuku-edit-id="e-93c2b48d-9f74-4215-b803-ca40a0b9eca3" as="span" variant="bodySmall" tone="warning">取相邻</Typography><Dimensions size={3} /></>
                : <Typography shuku-edit-id="e-43876ad4-d294-47ef-9755-7af109de3ae6" variant="bodySmall" tone="muted">等待追踪相邻位置</Typography>}
            </div>
          </article>
          <Arrow backward active={Boolean(trace)} />
          <article shuku-edit-id="e-f265b7dd-4a83-4ceb-8cf2-c77e1a13a4a6" className={c('column')}>
            <Typography shuku-edit-id="e-e29854e0-4b5d-4d56-9fc5-e170cb050e47" as="h3" variant="body" tone="accent">第 {depth} 层 · 选一个格子</Typography>
            <div shuku-edit-id="e-f58821f6-920f-45e4-a86e-dd7eb9ce6933" className={c('visual-slot')}>
              <div shuku-edit-id="e-9d82a0e4-bc46-42c8-af17-2b3be2becf3f" key={'grid-' + depth + '-' + resetVersion} ref={gridRef} className={c('output-grid')}
                style={gridStyle(outputSize)} role="group" aria-label={'第 ' + depth + ' 层，' + outputSize + ' 行 ' + outputSize + ' 列可选位置'} onKeyDown={navigateGrid}>
                {cellIndices(outputSize).map(index => {
                  const cell = { row: Math.floor(index / outputSize), column: index % outputSize };
                  const isSelected = selected?.row === cell.row && selected?.column === cell.column;
                  const center = centerCell(depth);
                  const prompt = !selected && cell.row === center.row && cell.column === center.column;
                  return <Button key={index} data-output-index={index} aria-pressed={isSelected}
                    aria-label={'第 ' + depth + ' 层第 ' + (cell.row + 1) + ' 行第 ' + (cell.column + 1) + ' 列，点击追踪输入区域'}
                    tabIndex={focusIndex === index ? 0 : -1} hint={prompt}
                    className={c('cell') + (isSelected ? ' is-selected' : '') + (prompt ? ' is-prompt' : '')}
                    onClick={() => selectCell(cell)}>
                    {prompt ? <Typography shuku-edit-id="e-e797989b-06ea-4638-bfd4-4da6d9039e90" as="span" variant="bodySmall" tone="inherit">?</Typography>
                      : <svg shuku-edit-id="e-43d93827-3bdb-4151-82bb-ef6b36048c3c" viewBox="0 0 16 16" aria-hidden="true"><circle shuku-edit-id="e-edcb754d-079e-4d2f-9d16-0e2d188514d3" cx="8" cy="8" r={isSelected ? 4 : 1.6} /></svg>}
                  </Button>;
                })}
              </div>
            </div>
            <div shuku-edit-id="e-7f2019f7-1baa-4cbf-9b89-50855176b720" className={c('caption')}><Typography shuku-edit-id="e-fde3be57-a9b9-4c4c-98be-ac002d03a525" variant="bodySmall" tone={trace ? 'success' : 'warning'}>{trace ? '可换一个位置再看' : '点击问号，展开联系'}</Typography></div>
          </article>
          {selected && <DependencyBands hostRef={stageRef} inputRef={inputRef} previousRef={previousRef} outputRef={gridRef} depth={depth} cell={selected} />}
        </div>
        <div shuku-edit-id="e-55fa93ac-5a60-480f-8262-bf1ee98fee44" className={c('range-insight')} aria-live="polite" aria-atomic="true">
          {trace ? <>
            <Typography shuku-edit-id="e-3f7ce0e7-4e9a-48c3-9f88-814c7cafcd63" as="span" variant="bodySmall" tone="accent">这个格子在输入中联系到的范围，叫</Typography>
            <Typography shuku-edit-id="e-e94cbfee-f08e-4a93-bb1d-3b143d75ac55" as="strong" variant="body" tone="warning">感受野</Typography>
            <MathFormulaBlock appearance="plain" ariaLabel={'已观察的感受野：' + Array.from({ length: depth }, (_, index) => (index * 2 + 3) + ' 行 ' + (index * 2 + 3) + ' 列').join('，然后')}>
              <MathFormulaStatic latex={Array.from({ length: depth }, (_, index) => (index * 2 + 3) + '\\times' + (index * 2 + 3)).join('\\;\\rightarrow\\;')} />
            </MathFormulaBlock>
          </> : <Typography shuku-edit-id="e-454954cd-d9b1-4202-a93d-01138263f2e1" variant="bodySmall" tone="muted">{depth === 1 ? '先看一个格子的来源，再增加一层。' : '新增的一层，仍只取前层的相邻位置。'}</Typography>}
        </div>
        <div shuku-edit-id="e-37b33161-d350-48db-9b55-6fafdf572e70" className={c('action-row')}>
          <Button key={'advance-' + depth + '-' + Boolean(selected) + '-' + resetVersion} variant="primary" hint={Boolean(selected)} disabled={!selected} onClick={advanceRange}>
            <Typography shuku-edit-id="e-72015022-317d-43d3-921a-3a19205a0e0d" as="span" variant="bodySmall" tone="inherit">{depth < 3 ? '再叠一层，看看范围 →' : '看看它在组合什么 →'}</Typography>
          </Button>
        </div>
      </> : <FeatureCompositionLab key={resetVersion} state={composition} onAction={dispatchComposition} />}
    </section>
    <NoticeStrip tone={complete ? 'green' : 'blue'} role="status" aria-live="polite" aria-atomic="true">{act === 'composition' ? '教学示例：' + notice : notice}</NoticeStrip>
  </ContentBlock>;
}
