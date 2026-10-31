import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, MathFormulaStatic, RangeControl, Typography } from '../../../shared/react';
import { AttentionActivity, ChoiceButtons, Formula, useActivityState, type ActivityProps } from '../../components/AttentionActivity';
import { RegressionPlot } from '../../components/RegressionPlot';
import {
  ATTENTION_DATASET,
  DEFAULT_ATTENTION_QUERY,
  REGRESSION_EXPLORATION_W,
  attentionAverage,
  attentionPrediction,
  attentionQueryRowIndex,
  regressionPriceYuan,
} from '../../model/attentionRegression';
import './AttentionRegressionCurvePage.css';

type CurveMode = 'mean' | 'attention';
export interface RegressionCurveState {
  version: 1;
  mode: CurveMode;
  q: number;
  visited: CurveMode[];
  manuallyMoved: boolean;
}
export function createRegressionCurveState(): RegressionCurveState {
  return { version: 1, mode: 'mean', q: DEFAULT_ATTENTION_QUERY, visited: ['mean'], manuallyMoved: false };
}
export function isRegressionCurveState(value: unknown): value is RegressionCurveState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const state = value as Partial<RegressionCurveState>;
  return state.version === 1 && (state.mode === 'mean' || state.mode === 'attention')
    && typeof state.q === 'number' && attentionQueryRowIndex(state.q) >= 0
    && typeof state.manuallyMoved === 'boolean'
    && Array.isArray(state.visited) && state.visited.length >= 1 && state.visited.length <= 2
    && state.visited.every((mode) => mode === 'mean' || mode === 'attention')
    && new Set(state.visited).size === state.visited.length
    && state.visited.includes('mean') && state.visited.includes(state.mode);
}

export function AttentionRegressionCurvePage(props: ActivityProps) {
  const [state, setState] = useActivityState('C14-regression-curve', createRegressionCurveState(), isRegressionCurveState);
  // Scanning belongs to the mounted, visible page only and is never persisted.
  const [running, setRunning] = useState(false);
  const runningRef = useRef(false);
  const visibleRef = useRef(false);
  const root = useRef<HTMLDivElement>(null);
  const done = state.manuallyMoved && state.visited.includes('mean') && state.visited.includes('attention');
  const mean = attentionAverage(ATTENTION_DATASET.train);
  const prediction = state.mode === 'mean' ? mean
    : attentionPrediction(state.q, ATTENTION_DATASET.train, REGRESSION_EXPLORATION_W);

  const stopScanning = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
  }, []);
  const canInteract = useCallback(() =>
    Boolean(root.current && !root.current.closest('[aria-hidden="true"]')), []);
  const canScan = useCallback(() =>
    canInteract() && visibleRef.current && document.visibilityState !== 'hidden', [canInteract]);

  useEffect(() => {
    const page = root.current?.closest('.attn-activity');
    if (!page || page.closest('[aria-hidden="true"]')) return;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries.find((candidate) => candidate.target === page);
      if (!entry) return;
      visibleRef.current = entry.isIntersecting && entry.intersectionRatio > 0;
      if (!visibleRef.current) stopScanning();
    }, { threshold: 0 });
    observer.observe(page);
    const visibilityChanged = () => {
      if (document.visibilityState === 'hidden') stopScanning();
    };
    document.addEventListener('visibilitychange', visibilityChanged);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', visibilityChanged);
      visibleRef.current = false;
      runningRef.current = false;
    };
  }, [stopScanning]);

  useEffect(() => {
    if (!running) return;
    if (!canScan() || state.q >= 4.9) {
      stopScanning();
      return;
    }
    const timer = globalThis.setTimeout(() => {
      if (!runningRef.current || !canScan()) {
        stopScanning();
        return;
      }
      setState((current) => {
        if (!runningRef.current) return current;
        const q = Math.min(49, Math.round(current.q * 10) + 1) / 10;
        return q === current.q ? current : { ...current, q };
      });
    }, 150);
    return () => globalThis.clearTimeout(timer);
  }, [running, state.q, canScan, stopScanning, setState]);

  const changeMode = (value: string) => {
    if (!canInteract() || (value !== 'mean' && value !== 'attention')) return;
    setState((current) => current.mode === value ? current : {
      ...current, mode: value,
      visited: current.visited.includes(value) ? current.visited : [...current.visited, value],
    });
  };
  const changeQuery = (q: number) => {
    if (!canInteract()) return;
    stopScanning();
    if (attentionQueryRowIndex(q) < 0) return;
    setState((current) => q === current.q ? current : { ...current, q, manuallyMoved: true });
  };
  const toggleScanning = () => {
    if (!canInteract()) return;
    if (runningRef.current) {
      stopScanning();
      return;
    }
    if (!canScan()) return;
    setState((current) => current.q === 0 ? current : { ...current, q: 0 });
    runningRef.current = true;
    setRunning(true);
  };

  return (
    <AttentionActivity {...props} number={14} title="注意力估价：预测沿街价格"
      eyebrow="同一天沿街的 50 条合成报价" done={done} className="attn-reg-curve-page" footerHeight={200}
      footer={<div className="attn-reg-curve-controls">
        <div className="attn-reg-curve-mode">
          <ChoiceButtons label="切换预测方法" value={state.mode} onChange={changeMode}
            options={[{ value: 'mean', label: '普通平均' }, { value: 'attention', label: '注意力' }]} />
          <Button active={running} aria-pressed={running} onClick={toggleScanning}>
            <Typography as="span" variant="bodySmall" tone="inherit">{running ? '停止扫描' : '扫描 Q'}</Typography>
          </Button>
        </div>
        <div className="attn-reg-curve-query">
          <RangeControl label="待估店铺位置 Q（km）" aria-label="待估店铺位置 Q，单位千米" value={state.q}
            min={0} max={4.9} step={0.1} digits={1} scale={['0', '4.9']}
            onChange={(event) => changeQuery(event.currentTarget.valueAsNumber)} />
          <Typography variant="bodySmall" tone="muted">
            {done ? '普通平均忽略位置；注意力按位置匹配，再加权售价。'
              : !state.manuallyMoved ? '同一批报价：估价要不要考虑店铺位置？移动 Q 比较。' : '切换方法：比较是否随位置改变估价。'}
          </Typography>
        </div>
      </div>}>
      <div ref={root} className="attn-reg-curve-main" data-regression-curve-mode={state.mode}
        data-regression-curve-query={state.q} data-regression-scanning={running}>
        <div className="attn-reg-curve-visual">
          <RegressionPlot q={state.q} w={REGRESSION_EXPLORATION_W} mode={state.mode} showCurve showPrediction showWeights />
        </div>
        <aside className={'attn-reg-curve-readout' + (state.mode === 'mean' ? ' is-mean' : '')} aria-label="当前预测">
          <Typography variant="bodySmall" align="center" tone={state.mode === 'mean' ? 'muted' : 'accent'}>
            {state.mode === 'mean' ? '平均售价（元）' : '估计售价（元）'}
          </Typography>
          <Formula className="attn-reg-curve-formula"
            label={state.mode === 'mean' ? '五十家店的冰水售价的普通平均' : '全部售价按当前店铺位置的注意力权重加权'}
            latex={state.mode === 'mean' ? '\\bar{p}=\\frac{1}{50}\\sum_{i=1}^{50}p_i' : '\\hat{p}(q)=\\sum_{i=1}^{50}\\mathrm{ATT}_i(q)p_i'} />
          <Typography as="output" variant="h2" align="center" tone={state.mode === 'mean' ? 'muted' : 'accent'} className="attn-reg-curve-value">
            <MathFormulaStatic className="attn-inline-math" role="math" aria-label={`店铺位置${state.q.toFixed(1)}千米的估计售价${regressionPriceYuan(prediction).toFixed(2)}元`} latex={state.mode === 'mean' ? String.raw`\bar{p}=${regressionPriceYuan(prediction).toFixed(2)}` : String.raw`\hat{p}(${state.q.toFixed(1)})=${regressionPriceYuan(prediction).toFixed(2)}`}/>
          </Typography>
        </aside>
      </div>
    </AttentionActivity>
  );
}
