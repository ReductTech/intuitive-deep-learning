import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, RangeControl, Typography } from "@shuku/course-style/react";
import { ChoiceButtons, useActivityState, type ActivityProps } from '../../components/AttentionActivity';
import { RegressionPlot } from '../../components/RegressionPlot';
import { useRegressionPage } from '../../components/useRegressionPage';
import { ATTENTION_DATASET, DEFAULT_ATTENTION_QUERY, REGRESSION_EXPLORATION_W, attentionAverage, attentionPrediction, attentionQueryRowIndex } from '../../model/attentionRegression';
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
  const [state, setState] = useActivityState('C14-campus-position-curve', createRegressionCurveState(), isRegressionCurveState);
  const done = state.manuallyMoved && state.visited.includes('mean') && state.visited.includes('attention');
  const { root, mathReady } = useRegressionPage(done, props);
  const [running, setRunning] = useState(false);
  const runningRef = useRef(false);
  const visibleRef = useRef(false);
  const mean = attentionAverage(ATTENTION_DATASET.train);
  const prediction = state.mode === 'mean' ? mean : attentionPrediction(state.q, ATTENTION_DATASET.train, REGRESSION_EXPLORATION_W);

  const stopScanning = useCallback(() => { runningRef.current = false; setRunning(false); }, []);
  const canInteract = useCallback(() => Boolean(root.current && !document.hidden
    && !root.current.closest('[aria-hidden="true"], [hidden], [inert]')), [root]);
  const canScan = useCallback(() => canInteract() && visibleRef.current, [canInteract]);
  useEffect(() => {
    const page = root.current;
    if (!page) return;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries.find((candidate) => candidate.target === page);
      if (!entry) return;
      visibleRef.current = entry.isIntersecting && entry.intersectionRatio > 0;
      if (!visibleRef.current) stopScanning();
    }, { threshold: 0 });
    observer.observe(page);
    const visibilityChanged = () => { if (document.hidden) stopScanning(); };
    document.addEventListener('visibilitychange', visibilityChanged);
    return () => {
      observer.disconnect(); document.removeEventListener('visibilitychange', visibilityChanged);
      visibleRef.current = false; runningRef.current = false;
    };
  }, [root, stopScanning]);
  useEffect(() => {
    if (!running) return;
    if (!canScan() || state.q >= 4.9) { stopScanning(); return; }
    const timer = globalThis.setTimeout(() => {
      if (!runningRef.current || !canScan()) { stopScanning(); return; }
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
    setState((current) => current.mode === value ? current : { ...current, mode: value,
      visited: current.visited.includes(value) ? current.visited : [...current.visited, value] });
  };
  const changeQuery = (q: number) => {
    if (!canInteract()) return;
    stopScanning();
    if (attentionQueryRowIndex(q) < 0) return;
    setState((current) => q === current.q ? current : { ...current, q, manuallyMoved: true });
  };
  const toggleScanning = () => {
    if (!canInteract()) return;
    if (runningRef.current) { stopScanning(); return; }
    if (!canScan()) return;
    setState((current) => current.q === 0 ? current : { ...current, q: 0 });
    runningRef.current = true; setRunning(true);
  };
  const reset = () => { if (canInteract()) { stopScanning(); setState(createRegressionCurveState()); } };
  const isMean = state.mode === 'mean';
  return <ContentBlock ref={root} title="同一批记录，怎样补全整段轨迹" headingLevel={1}
    subtitle="同一批记录，比较两种读取方法。"
    className="attn-reg-curve-page" bodyClassName="attn-reg-curve-body"
    data-activity="C14" data-activity-complete={done} data-capture-ready={mathReady} aria-busy={!mathReady}
    onKeyDown={event => { if ([' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) event.stopPropagation(); }}>
    <div className="attn-reg-curve-main" data-regression-curve-mode={state.mode} data-regression-curve-query={state.q}
      data-regression-scanning={running} data-regression-prediction={prediction}>
      <div className="attn-reg-curve-visual">
        <RegressionPlot q={state.q} w={REGRESSION_EXPLORATION_W} mode={state.mode} showCurve showPrediction showWeights />
      </div>
      <aside className={'attn-reg-curve-readout' + (isMean ? ' is-mean' : '')} aria-label="当前重建结果">
        <Typography variant="h3" tone={isMean ? 'muted' : 'accent'}>{isMean ? '普通平均' : '注意力加权'}</Typography>
        <MathFormulaBlock appearance="plain" className="attn-reg-curve-formula"
          ariaLabel={isMean ? '五十条位置记录的普通平均' : '根据当前查询时刻加权全部五十条位置记录'}>
          <MathFormulaStatic latex={isMean ? '\\bar{p}=\\frac{1}{50}\\sum_{i=1}^{50}p_i' : '\\hat{p}(q)=\\sum_{i=1}^{50}\\alpha_i(q)p_i'} />
        </MathFormulaBlock>
        <MathFormulaBlock appearance="plain" ariaLabel={`重建位置${prediction.toFixed(2)}米`}>
          <MathFormulaStatic latex={(isMean ? '\\bar{p}' : '\\hat{p}('+state.q.toFixed(1)+')')+'='+prediction.toFixed(2)+'\\,\\mathrm{m}'} />
        </MathFormulaBlock>
        <Typography variant="bodySmall" tone="muted">{isMean ? '每条份额相同。' : '时刻越近，份额越大。'}</Typography>
        <Typography variant="bodySmall" tone="muted">同一批 50 条合成记录</Typography>
      </aside>
    </div>
    <footer className="attn-reg-curve-footer">
      <div className="attn-reg-curve-controls">
        <div className="attn-reg-curve-mode">
          <ChoiceButtons label="切换重建方法" value={state.mode} onChange={changeMode}
            options={[{ value: 'mean', label: '普通平均' }, { value: 'attention', label: '注意力' }]} />
          <div className="attn-reg-curve-actions">
            <Button data-scan-recording active={running} aria-pressed={running} onClick={toggleScanning}>
              <Typography as="span" variant="bodySmall" tone="inherit">{running ? '停止扫描' : '扫描已录制片段'}</Typography>
            </Button>
            <Button onClick={reset}><Typography as="span" variant="bodySmall" tone="inherit">重新比较</Typography></Button>
          </div>
        </div>
        <div className="attn-reg-curve-query">
          <RangeControl label="待重建时刻 Q（s）" aria-label="待重建时刻 Q，单位秒" value={state.q}
            min={0} max={4.9} step={0.1} digits={1} scale={['0', '4.9']}
            onChange={(event) => changeQuery(event.currentTarget.valueAsNumber)} />
          <Typography variant="bodySmall" tone="muted">{done ? 'Q 改变比例，记录不变。'
            : !state.manuallyMoved ? '切换方法，移动 Q。' : '再切换方法比较。'}</Typography>
        </div>
      </div>
    </footer>
  </ContentBlock>;
}
