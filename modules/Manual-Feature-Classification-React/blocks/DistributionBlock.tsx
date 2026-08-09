import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, ContentBlock, LessonStage, NoticeStrip } from '../../shared/react';
import { usePersistedActivity } from '../components/usePersistedActivity';
import { REGION_BOUNDS, loadDataset, type DatasetRow } from '../model/manualFeatureMath';

interface DistributionState { started: boolean; complete: boolean; step: number; order: number[]; wrongDigit: number | null; }
const targets = [1, 0, 8];
const digitColors = ['#2f5f98', '#1f8a68', '#e07a3f', '#bf4058', '#6d5aa8', '#237b84', '#6f8b2e', '#c56735', '#4d6fb3', '#9a4f86'];
const createInitial = (): DistributionState => ({ started: false, complete: false, step: 0, order: Array.from({ length: 10 }, (_, i) => i), wrongDigit: null });
function normalize(stored: unknown): DistributionState | null { if (!stored || typeof stored !== 'object') return null; const value = stored as Partial<DistributionState>; const order = Array.isArray(value.order) && value.order.length === 10 ? value.order.map(Number) : createInitial().order; return { ...createInitial(), ...value, order, step: Math.max(0, Math.min(3, Number(value.step) || 0)) }; }
function shuffleDigits() { const items = Array.from({ length: 10 }, (_, i) => i); for (let i = items.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [items[i], items[j]] = [items[j], items[i]]; } return items; }
function heatColor(intensity: number) { const t = Math.pow(Math.max(0, Math.min(1, intensity)), .72), stops = [[255,252,247],[249,208,201],[224,105,123],[156,31,64]], scaled = t * (stops.length - 1), index = Math.min(stops.length - 2, Math.floor(scaled)), local = scaled - index, from = stops[index], to = stops[index + 1]; return `rgb(${Math.round(from[0] + (to[0] - from[0]) * local)},${Math.round(from[1] + (to[1] - from[1]) * local)},${Math.round(from[2] + (to[2] - from[2]) * local)})`; }
function targetHint(digit: number) { return ({ 1: '1 的形态特征是中间列多、两侧少，像一条竖直的笔画。', 0: '0 的形态特征是中间少、四周多，中心格通常会比外圈淡。', 8: '8 的形态特征是中间多，上下两个圈也会留下明显像素。' } as Record<number, string>)[digit] ?? `${digit} 的形态特征要看九宫格里像素最集中的区域。`; }

export function DistributionBlock({ onComplete, lessonStepComplete = false }: { onComplete: () => void; lessonStepComplete?: boolean }) {
  const rootRef = useRef<HTMLElement | null>(null);
  const correctTimerRef = useRef<number | null>(null);
  const { state, hydrated, commit } = usePersistedActivity<DistributionState>({ stateKey: 'manual-feature:distribution', createInitial, normalizeState: normalize, getElement: () => rootRef.current });
  const [rows, setRows] = useState<DatasetRow[]>([]), [error, setError] = useState(''), [correctDigit, setCorrectDigit] = useState<number | null>(null);
  useEffect(() => { let active = true; void loadDataset().then((value) => { if (active) setRows(value); }).catch((reason) => { if (active) setError(String(reason)); }); return () => { active = false; }; }, []);
  useEffect(() => () => { if (correctTimerRef.current !== null) window.clearTimeout(correctTimerRef.current); }, []);
  const heatmaps = useMemo(() => Array.from({ length: 10 }, (_, digit) => {
    const group = rows.filter((row) => row.sample.label === digit);
    return { digit, sampleCount: group.length, percentages: Array.from({ length: 9 }, (_, region) => { const mean = group.reduce((sum, row) => sum + (row.features[region]?.count ?? 0), 0) / Math.max(1, group.length); const gridRow = Math.floor(region / 3), gridCol = region % 3, capacity = (REGION_BOUNDS[gridRow + 1] - REGION_BOUNDS[gridRow]) * (REGION_BOUNDS[gridCol + 1] - REGION_BOUNDS[gridCol]); return mean / capacity * 100; }) };
  }), [rows]);
  const maxPercent = Math.max(1, ...heatmaps.flatMap((item) => item.percentages));
  if (!hydrated || !state) return <LessonStage title="从 0 到 9，逐个观察九宫格分布"><ContentBlock>正在恢复活动状态…</ContentBlock></LessonStage>;

  function clearCorrectFlash() { if (correctTimerRef.current !== null) window.clearTimeout(correctTimerRef.current); correctTimerRef.current = null; setCorrectDigit(null); }
  function start() { clearCorrectFlash(); commit('manual_feature_distribution_game_started', (current) => ({ ...current, started: true, complete: false, step: 0, order: shuffleDigits(), wrongDigit: null })); }
  function choose(digit: number) {
    if (!state!.started || state!.complete || state!.wrongDigit !== null || correctDigit !== null) return;
    const target = targets[state!.step];
    if (digit !== target) { clearCorrectFlash(); commit('manual_feature_distribution_digit_selected', (current) => ({ ...current, wrongDigit: digit }), { digit, target, correct: false }); return; }
    const nextStep = state!.step + 1, complete = nextStep >= targets.length;
    const next = commit('manual_feature_distribution_digit_selected', (current) => ({ ...current, step: nextStep, complete, wrongDigit: null }), { digit, target, correct: true });
    setCorrectDigit(digit);
    correctTimerRef.current = window.setTimeout(() => { setCorrectDigit(null); correctTimerRef.current = null; }, complete ? 360 : 520);
    if (complete && next && !lessonStepComplete) onComplete();
  }
  function acknowledgeWrong() { const nextStep = state!.step + 1, complete = nextStep >= targets.length; const next = commit('manual_feature_distribution_hint_acknowledged', (current) => ({ ...current, step: nextStep, complete, wrongDigit: null }), { target: targets[state!.step] }); if (complete && next && !lessonStepComplete) onComplete(); }
  const target = targets[state.step];
  const promptTone = state.wrongDigit !== null ? 'red' : correctDigit !== null || state.complete ? 'green' : 'orange';

  return <LessonStage ref={rootRef} className="hdf-stage hdf-distribution-stage" title="从 0 到 9，逐个观察九宫格分布" description="依次看每张热力图：先找颜色最深和最浅的格子，再看整体更像竖线、圆环，还是上下两个区域。">
    <ContentBlock className="hdf-chart-panel" title="找出每个数字最明显的分布特征" subtitle={error || (rows.length ? `已读取真实 MNIST 子集：${rows.length} / ${rows.length}` : '正在读取真实 MNIST 子集…')}>
      {state.started && <NoticeStrip tone={promptTone} className={`hdf-game-prompt ${state.wrongDigit !== null ? 'is-wrong' : ''}`}>
        {state.wrongDigit !== null ? <><span>不对。{targetHint(target)} 绿色框才是 {target} 的位置。</span><Button variant="primary" className="hdf-game-confirm" onClick={acknowledgeWrong}>确定</Button></> : correctDigit !== null ? <>正确。</> : state.complete ? <>完成。</> : <>请点击 <strong>{target}</strong> 对应的位置</>}
      </NoticeStrip>}
      <div className="hdf-heatmap-grid" aria-label="不同数字的平均九宫格热力图">
        {(state.started || state.complete ? state.order : Array.from({ length: 10 }, (_, i) => i)).map((digit) => { const item = heatmaps[digit]; const wrong = state.wrongDigit === digit, correctHint = state.wrongDigit !== null && digit === target, correct = correctHint || correctDigit === digit, hideLabel = state.started || state.complete; return <button aria-label={`数字 ${digit} 的平均九宫格分布`} className={`hdf-heatmap-card ${hideLabel ? 'is-unlabeled' : 'is-labeled'} ${wrong ? 'is-wrong' : ''} ${correct ? 'is-correct' : ''}`} data-digit={digit} key={digit} type="button" disabled={!rows.length || !state.started || state.complete || state.wrongDigit !== null || correctDigit !== null} onClick={() => choose(digit)}>
          {!hideLabel && <header><strong style={{ color: digitColors[digit] }}>{digit}</strong><span>{item.sampleCount} 张样本平均</span></header>}
          <div className="hdf-heatmap-cells">{item.percentages.map((value, index) => { const intensity = value / maxPercent; return <span key={index} style={{ background: heatColor(intensity), color: intensity > .46 ? 'rgba(255,255,255,.96)' : 'rgba(32,50,77,.72)' }}>{Math.round(value)}%</span>; })}</div>
        </button>; })}
      </div>
      {!state.started && !state.complete && <div className="hdf-panel-actions hdf-distribution-actions"><Button variant="primary" disabled={!rows.length} onClick={start}>观察好了，玩个小游戏</Button></div>}
    </ContentBlock>
  </LessonStage>;
}
