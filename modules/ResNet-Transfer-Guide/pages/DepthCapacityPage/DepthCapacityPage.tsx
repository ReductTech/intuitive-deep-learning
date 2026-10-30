import { moduleIdentity } from '../../outlines.json';
import { moduleAssetUrl } from '../../../shared/react/assets';
import { useEffect, useReducer, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, NoticeStrip, Typography } from '../../../shared/react';
import { useCompleteOnce } from '../../hooks/useCompleteOnce';
const bottleFront = moduleAssetUrl(moduleIdentity.id, "recycling/camera-views/bottle-front.png");
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
  return <svg className={c('arrow') + (backward ? ' is-backward' : '') + (active ? ' is-active' : '')}
    viewBox="0 0 80 32" fill="none" aria-hidden="true"><path d="M7 16H69M57 5L69 16L57 27" /></svg>;
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

  return <ContentBlock headingLevel={1} className={prefix}
    title="更多层，究竟多了什么能力？" subtitle="后层在组合前层的结果，因而能关联更大范围。"
    data-act={act} data-depth={depth} data-observed-depth={observedDepth} data-composition={composition.misplaced ? 'misplaced' : 'aligned'} data-complete={complete}
    onKeyDown={event => {
      if ((event.key === ' ' || event.key === 'Enter') && (event.target as Element).closest('button')) {
        event.stopPropagation(); if (event.repeat) event.preventDefault();
      }
    }}>
    <nav className={c('acts')} aria-label="本页学习阶段">
      <Button active={act === 'range'} aria-current={act === 'range' ? 'step' : undefined}
        onClick={() => setAct('range')}><Typography as="span" variant="bodySmall" tone="inherit">① 看得更广</Typography></Button>
      <Button active={act === 'composition'} disabled={!canCompose} aria-current={act === 'composition' ? 'step' : undefined}
        onClick={() => { if (canCompose) setAct('composition'); }}><Typography as="span" variant="bodySmall" tone="inherit">② 组合更复杂</Typography></Button>
      <Button className={c('reset')} onClick={reset} aria-label="重新观察本页两幕">
        <Typography as="span" variant="bodySmall" tone="inherit">↶ 重新观察</Typography>
      </Button>
    </nav>

    <section className={c('workbench')} aria-labelledby="rtg-depth-scene-title">
      <div className={c('scene-head')}>
        <Typography as="h2" variant="body" tone="accent" id="rtg-depth-scene-title" tabIndex={-1} ref={headingRef}>
          {act === 'range' ? '点一个后层格子，反向追踪来源' : '改变一条线索，看看后层怎样响应'}
        </Typography>
        {act === 'range' && <div className={c('condition')}>
          <Dimensions size={3} label="每层使用三行三列卷积核" /><Typography variant="bodySmall" tone="muted">卷积 · 步长 1 · 不补边</Typography>
        </div>}
      </div>

      {act === 'range' ? <>
        <div className={c('range-stage')} ref={stageRef}>
          <article className={c('column')}>
            <Typography as="h3" variant="body" tone="accent">输入图像 · 空间示意</Typography>
            <div className={c('visual-slot')}>
              <div ref={inputRef} className={c('input')} role="img" aria-label={trace ? '输入空间示意：已连接 ' + trace.input.size + ' 行 ' + trace.input.size + ' 列区域' : '塑料瓶照片上的七行七列空间示意网格'}>
                <img src={bottleFront} alt="" />
                <div className={c('input-grid')} aria-hidden="true">{cellIndices(7).map(index => <i key={index} />)}</div>
                {trace && <span className={c('input-region')} style={regionStyle(trace.input)} aria-hidden="true" />}
              </div>
            </div>
            <div className={c('caption')}>
              {trace ? <><Typography as="span" variant="bodySmall" tone="warning">联系到</Typography><Dimensions size={trace.input.size} /></>
                : <Typography variant="bodySmall" tone="muted">网格仅示意空间位置</Typography>}
            </div>
          </article>
          <Arrow backward active={Boolean(trace)} />
          <article className={c('column')}>
            <Typography as="h3" variant="body" tone="accent">{depth === 1 ? '输入网格' : '第 ' + (depth - 1) + ' 层'}</Typography>
            <div className={c('visual-slot')}>
              <div ref={previousRef} className={c('position-grid')} style={gridStyle(previousSize)} aria-hidden="true">
                {cellIndices(previousSize).map(index => <span key={index}
                  className={trace && containsCell({ row: Math.floor(index / previousSize), column: index % previousSize }, trace.previous) ? 'is-included' : ''} />)}
              </div>
            </div>
            <div className={c('caption')}>
              {trace ? <><Typography as="span" variant="bodySmall" tone="warning">取相邻</Typography><Dimensions size={3} /></>
                : <Typography variant="bodySmall" tone="muted">等待追踪相邻位置</Typography>}
            </div>
          </article>
          <Arrow backward active={Boolean(trace)} />
          <article className={c('column')}>
            <Typography as="h3" variant="body" tone="accent">第 {depth} 层 · 选一个格子</Typography>
            <div className={c('visual-slot')}>
              <div key={'grid-' + depth + '-' + resetVersion} ref={gridRef} className={c('output-grid')}
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
                    {prompt ? <Typography as="span" variant="bodySmall" tone="inherit">?</Typography>
                      : <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r={isSelected ? 4 : 1.6} /></svg>}
                  </Button>;
                })}
              </div>
            </div>
            <div className={c('caption')}><Typography variant="bodySmall" tone={trace ? 'success' : 'warning'}>{trace ? '可换一个位置再看' : '点击问号，展开联系'}</Typography></div>
          </article>
          {selected && <DependencyBands hostRef={stageRef} inputRef={inputRef} previousRef={previousRef} outputRef={gridRef} depth={depth} cell={selected} />}
        </div>
        <div className={c('range-insight')} aria-live="polite" aria-atomic="true">
          {trace ? <>
            <Typography as="span" variant="bodySmall" tone="accent">这个格子在输入中联系到的范围，叫</Typography>
            <Typography as="strong" variant="body" tone="warning">感受野</Typography>
            <MathFormulaBlock appearance="plain" ariaLabel={'已观察的感受野：' + Array.from({ length: depth }, (_, index) => (index * 2 + 3) + ' 行 ' + (index * 2 + 3) + ' 列').join('，然后')}>
              <MathFormulaStatic latex={Array.from({ length: depth }, (_, index) => (index * 2 + 3) + '\\times' + (index * 2 + 3)).join('\\;\\rightarrow\\;')} />
            </MathFormulaBlock>
          </> : <Typography variant="bodySmall" tone="muted">{depth === 1 ? '先看一个格子的来源，再增加一层。' : '新增的一层，仍只取前层的相邻位置。'}</Typography>}
        </div>
        <div className={c('action-row')}>
          <Button key={'advance-' + depth + '-' + Boolean(selected) + '-' + resetVersion} variant="primary" hint={Boolean(selected)} disabled={!selected} onClick={advanceRange}>
            <Typography as="span" variant="bodySmall" tone="inherit">{depth < 3 ? '再叠一层，看看范围 →' : '看看它在组合什么 →'}</Typography>
          </Button>
        </div>
      </> : <FeatureCompositionLab key={resetVersion} state={composition} onAction={dispatchComposition} />}
    </section>
    <NoticeStrip tone={complete ? 'green' : 'blue'} role="status" aria-live="polite" aria-atomic="true">{act === 'composition' ? '教学示例：' + notice : notice}</NoticeStrip>
  </ContentBlock>;
}
