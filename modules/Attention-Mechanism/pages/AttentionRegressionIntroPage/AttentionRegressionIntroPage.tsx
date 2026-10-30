import { useLayoutEffect, useRef, useState } from 'react';
import { Button, Feedback, MathFormulaStatic, Question, RangeControl, Typography, type QuestionCheckResult } from '../../../shared/react';
import { AttentionActivity, useActivityState, type ActivityProps } from '../../components/AttentionActivity';
import { RegressionPlot } from '../../components/RegressionPlot';
import {
  ATTENTION_DATASET,
  DEFAULT_ATTENTION_QUERY,
  REGRESSION_EXPLORATION_W,
  attentionPrediction,
  attentionQueryRowIndex,
  attentionWeights,
  regressionPriceYuan,
} from '../../model/attentionRegression';
import './AttentionRegressionIntroPage.css';

type Forecast = 'near' | 'highest-y';
type Phase = 'forecast' | 'read' | 'select';
interface CheckedTrial {
  q: number;
  selected: number[];
}
export interface RegressionIntroState {
  version: 1;
  phase: Phase;
  forecast: Forecast | null;
  q: number;
  guideIndex: number;
  readMoved: boolean;
  selected: number[];
  revealed: boolean;
  /** Retains a completed trial when q changes or the learner selects again. */
  completedTrial: CheckedTrial | null;
}
export type RegressionIntroAction =
  | { type: 'forecast'; value: Forecast }
  | { type: 'read' }
  | { type: 'set-q'; value: number }
  | { type: 'next-observation' }
  | { type: 'select-stage' }
  | { type: 'select'; index: number }
  | { type: 'check' }
  | { type: 'retry' };

const samples = ATTENTION_DATASET.train;
const initialGuideIndex = samples.reduce((nearest, sample, index) =>
  Math.abs(sample.x - DEFAULT_ATTENTION_QUERY) < Math.abs(samples[nearest].x - DEFAULT_ATTENTION_QUERY) ? index : nearest, 0);

export function createRegressionIntroState(): RegressionIntroState {
  return {
    version: 1, phase: 'forecast', forecast: null, q: DEFAULT_ATTENTION_QUERY,
    guideIndex: initialGuideIndex, readMoved: false, selected: [], revealed: false, completedTrial: null,
  };
}

function validIndices(value: unknown): value is number[] {
  return Array.isArray(value) && value.length <= 3 && new Set(value).size === value.length
    && value.every((index) => Number.isInteger(index) && index >= 0 && index < samples.length);
}
function validQuery(value: unknown): value is number {
  return typeof value === 'number' && attentionQueryRowIndex(value) >= 0;
}
function validTrial(value: unknown): value is CheckedTrial {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const trial = value as Partial<CheckedTrial>;
  return validQuery(trial.q) && validIndices(trial.selected) && trial.selected.length === 3;
}

export function isRegressionIntroState(value: unknown): value is RegressionIntroState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const state = value as Partial<RegressionIntroState>;
  if (state.version !== 1 || !['forecast', 'read', 'select'].includes(state.phase ?? '')
    || !(state.forecast === null || state.forecast === 'near' || state.forecast === 'highest-y')
    || !validQuery(state.q) || !Number.isInteger(state.guideIndex)
    || state.guideIndex === undefined || state.guideIndex < 0 || state.guideIndex >= samples.length
    || typeof state.readMoved !== 'boolean' || !validIndices(state.selected)
    || typeof state.revealed !== 'boolean'
    || (state.completedTrial !== null && !validTrial(state.completedTrial))) return false;
  if (state.phase === 'forecast') {
    return state.q === DEFAULT_ATTENTION_QUERY && state.guideIndex === initialGuideIndex && !state.readMoved
      && state.selected.length === 0 && !state.revealed && state.completedTrial === null;
  }
  if (state.forecast === null) return false;
  if (state.phase === 'read') {
    return state.selected.length === 0 && !state.revealed && state.completedTrial === null
      && (state.readMoved || state.q === DEFAULT_ATTENTION_QUERY);
  }
  if (!state.readMoved) return false;
  return !state.revealed || (state.selected.length === 3 && validTrial(state.completedTrial)
    && state.completedTrial.q === state.q
    && state.completedTrial.selected.every((index, position) => index === state.selected![position]));
}

export function regressionIntroReducer(state: RegressionIntroState, action: RegressionIntroAction): RegressionIntroState {
  if (action.type === 'forecast') {
    if (state.phase !== 'forecast' || state.forecast !== null || !['near', 'highest-y'].includes(action.value)) return state;
    return { ...state, forecast: action.value };
  }
  if (action.type === 'read') {
    return state.phase === 'forecast' && state.forecast !== null ? { ...state, phase: 'read' } : state;
  }
  if (action.type === 'set-q') {
    if (state.phase === 'forecast' || !validQuery(action.value) || action.value === state.q) return state;
    return {
      ...state, q: action.value, readMoved: state.readMoved || state.phase === 'read',
      selected: [], revealed: false,
    };
  }
  if (action.type === 'next-observation') {
    return state.phase === 'read' ? { ...state, guideIndex: (state.guideIndex + 17) % samples.length } : state;
  }
  if (action.type === 'select-stage') {
    return state.phase === 'read' && state.readMoved ? { ...state, phase: 'select' } : state;
  }
  if (action.type === 'select') {
    if (state.phase !== 'select' || state.revealed || !Number.isInteger(action.index) || action.index < 0 || action.index >= samples.length) return state;
    const selected = state.selected.includes(action.index)
      ? state.selected.filter((index) => index !== action.index)
      : state.selected.length < 3 ? [...state.selected, action.index] : state.selected;
    return selected === state.selected ? state : { ...state, selected };
  }
  if (action.type === 'check') {
    if (state.phase !== 'select' || state.revealed || state.selected.length !== 3) return state;
    return { ...state, revealed: true, completedTrial: { q: state.q, selected: [...state.selected] } };
  }
  if (action.type === 'retry') {
    return state.phase === 'select' && state.revealed ? { ...state, selected: [], revealed: false } : state;
  }
  return state;
}

export function AttentionRegressionIntroPage(props: ActivityProps) {
  const [state, setState] = useActivityState('C13-regression-intro', createRegressionIntroState(), isRegressionIntroState);
  const root = useRef<HTMLDivElement>(null);
  const [forecastAttempt,setForecastAttempt]=useState('original');
  const restartForecast=()=>{if(root.current&&!root.current.closest('[aria-hidden="true"], [inert]')){setForecastAttempt(crypto.randomUUID());setState(createRegressionIntroState());}};
  const previous = useRef({ phase: state.phase, forecast: state.forecast, revealed: state.revealed });
  const guide = samples[state.guideIndex];
  // Numerical answers are derived only for the revealed view.
  const weighted = state.revealed ? attentionWeights(state.q, samples, REGRESSION_EXPLORATION_W) : [];
  const top3 = [...weighted].sort((left, right) => right.weight - left.weight).slice(0, 3);
  const hitCount = top3.filter((item) => state.selected.includes(item.index)).length;
  const prediction = state.revealed ? attentionPrediction(state.q, samples, REGRESSION_EXPLORATION_W) : null;

  const change = (action: RegressionIntroAction) => {
    if (!root.current || root.current.closest('[aria-hidden="true"]')) return;
    setState((current) => regressionIntroReducer(current, action));
  };
  const forecast = (result: QuestionCheckResult) => {
    if (!root.current || root.current.closest('[aria-hidden="true"]') || result.empty || result.answer.length !== 1) return;
    const value = result.answer[0];
    if (value === 'near' || value === 'highest-y') change({ type: 'forecast', value });
  };

  useLayoutEffect(() => {
    const last = previous.current;
    previous.current = { phase: state.phase, forecast: state.forecast, revealed: state.revealed };
    const page = root.current?.closest('.attn-activity');
    if (!page || page.closest('[aria-hidden="true"]')) return;
    let target: string | null = null;
    if (last.forecast === null && state.forecast !== null) target = '[data-regression-read]';
    if (last.phase !== state.phase) target = state.phase === 'read' ? '[data-regression-next-observation]' : '[data-regression-index="0"]';
    if (!last.revealed && state.revealed) target = '[data-regression-result]';
    if (target) page.querySelector<HTMLElement | SVGElement>(target)?.focus({ preventScroll: true });
  }, [state.phase, state.forecast, state.revealed]);

  const queryControl = (
    <RangeControl label="待估店铺位置 Q（km）" aria-label="待估店铺位置 Q，单位千米" min={0} max={4.9} step={0.1}
      value={state.q} digits={1} scale={['0', '4.9']}
      onChange={(event) => change({ type: 'set-q', value: event.currentTarget.valueAsNumber })} />
  );
  const originalFooter = state.phase === 'forecast'
    ? state.forecast === null
      ? <Question className="attn-reg-intro-question" type="choice" typeLabel="" showFeedback={false}
        title="优先参考哪些记录？" answer="near" key={forecastAttempt} persistenceKey={`attention-v20-C13-forecast-${forecastAttempt}`}
        options={[
          { value: 'near', label: '位置接近的店铺' },
          { value: 'highest-y', label: '标价最高的店铺' },
        ]} onCheck={forecast} />
      : <div className="attn-reg-intro-forecast-feedback">
        <Feedback status={state.forecast === 'near' ? 'correct' : 'wrong'}
          message={state.forecast === 'near' ? '位置越接近，匹配分数越高。' : '这里按位置距离评分，不按标价高低。'} />
        <Button variant="primary" data-regression-read onClick={() => change({ type: 'read' })}>
          <Typography as="span" variant="bodySmall" tone="inherit">开始认图</Typography>
        </Button>
      </div>
    : <div className="attn-reg-intro-controls">
      {queryControl}
      <div className="attn-reg-intro-action-row">
        {state.phase === 'read'
          ? <>
            <Typography variant="bodySmall" tone="muted">{state.readMoved ? 'Q 变了，已有的 K / V 没变。' : '先移动 Q，看看它与观测的关系。'}</Typography>
            <Button variant="primary" disabled={!state.readMoved} onClick={() => change({ type: 'select-stage' })}>
              <Typography as="span" variant="bodySmall" tone="inherit">选 3 个点</Typography>
            </Button>
          </>
          : state.revealed
            ? <>
              <div className="attn-reg-intro-result-line" data-regression-result tabIndex={-1}>
                <Typography variant="h3" tone={hitCount === 3 ? 'success' : 'accent'}>命中 {hitCount} / 3</Typography>
                <Typography variant="bodySmall" tone="muted">预测仍使用全部 50 条记录。</Typography>
              </div>
              <Button onClick={() => change({ type: 'retry' })}>
                <Typography as="span" variant="bodySmall" tone="inherit">再选一次（仅重做选点）</Typography>
              </Button>
            </>
            : <>
              <div className="attn-reg-intro-result-line">
                <Typography variant="h3" tone="accent" aria-live="polite">已选 {state.selected.length} / 3</Typography>
                <Typography variant="bodySmall" tone="muted">{state.selected.length === 3 ? '可以核对，也可点已选项撤销。' : '选出你认为 ATT 最高的 3 个点。'}</Typography>
              </div>
              <Button variant="primary" disabled={state.selected.length !== 3} onClick={() => change({ type: 'check' })}>
                <Typography as="span" variant="bodySmall" tone="inherit">核对我的选点</Typography>
              </Button>
            </>}
      </div>
    </div>;

  return (
    <AttentionActivity {...props} number={13} title="注意力估价：参考哪些店铺"
      learningFlow={<Typography variant="bodySmall" tone="accent">本例理解：按店铺位置加权售价，与直接平均有什么不同。</Typography>}
      eyebrow="小明找冰水 · 同日沿街 50 条合成报价" className="attn-reg-intro-page"
      done={state.completedTrial !== null} footerHeight={230} footer={<div className="attn-reg-intro-footer-with-review">{originalFooter}{state.phase!=='forecast'&&<Button onClick={restartForecast}><Typography as="span" variant="bodySmall" tone="inherit">查看原题 / 重新预测</Typography></Button>}</div>}>
      <div ref={root} className="attn-reg-intro-main" data-regression-phase={state.phase}
        data-regression-revealed={state.revealed} data-regression-query={state.q}>
        <div className="attn-reg-intro-visual">
          <RegressionPlot q={state.q} w={REGRESSION_EXPLORATION_W}
            guideIndex={state.phase === 'read' ? state.guideIndex : undefined}
            selectedIndices={state.selected}
            selectable={state.phase === 'select' && !state.revealed}
            onSelect={(index) => change({ type: 'select', index })}
            showWeights={state.revealed} showPrediction={state.revealed}
            revealedIndices={state.revealed ? top3.map((item) => item.index) : []} />
        </div>
        <aside className="attn-reg-intro-readout" aria-label="当前观察与核对结果">
          {state.phase === 'forecast'
            ? <div className="attn-reg-intro-prompt">
              <svg className="attn-reg-intro-route" viewBox="0 0 360 112" role="img" aria-label="小明沿街收集同款冰水的店铺报价；绿色圈标出待估价的店铺位置">
                <rect x="12" y="15" width="45" height="20" rx="6" fill="#286da7"/>
                <path d="M17 35H52L60 50V91Q60 100 50 100H19Q9 100 9 91V50Z" fill="#78cbe7" stroke="#286da7" strokeWidth="4"/>
                <rect x="10" y="63" width="49" height="25" fill="#d8f4fb"/>
                <path d="M80 93H347" stroke="#91abc0" strokeWidth="5" strokeLinecap="round"/>
                {[95,140,180,270,325].map((x) => <g key={x} transform={`translate(${x} 0)`}>
                  <path d="M-12 55H12L16 66H-16Z" fill="#e68c66"/>
                  <rect x="-12" y="66" width="24" height="22" rx="2" fill="#f7d6bf" stroke="#d47959" strokeWidth="2"/>
                  <rect x="-4" y="73" width="8" height="15" fill="#fff4e8"/>
                  <circle cy="94" r="4" fill="#e68c66"/>
                </g>)}
                <circle cx="225" cy="93" r="13" fill="#eef8ef" stroke="#4d9f77" strokeWidth="4"/>
                <path d="M225 77V45" stroke="#4d9f77" strokeWidth="4"/>
                <path d="M218 53L225 42 232 53" fill="none" stroke="#4d9f77" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <Typography variant="bodySmall" tone="muted">小明收集同日沿街报价，估计一家店的售价（合成数据）。</Typography>
              <Typography variant="h2">冰水卖多少钱？</Typography>
              <Typography variant="body" tone="success"><MathFormulaStatic className="attn-inline-math" role="math" aria-label={`待估店铺位置 q 等于${state.q.toFixed(1)}千米`} latex={`q=${state.q.toFixed(1)}\\,\\mathrm{km}`}/></Typography>
            </div>
            : state.phase === 'read'
              ? <div className="attn-reg-intro-guide">
                <Typography variant="bodySmall" tone="muted">记录 {state.guideIndex + 1}</Typography>
                <div className="attn-reg-intro-coordinate"><Typography variant="bodySmall">K · 店铺位置（km）</Typography><Typography variant="h3" className="attn-reg-intro-observation"><MathFormulaStatic className="attn-inline-math" role="math" aria-label={`店铺位置 x ${state.guideIndex+1} 等于${guide.x.toFixed(2)}千米`} latex={`x_{${state.guideIndex+1}}=${guide.x.toFixed(2)}`}/></Typography></div>
                <div className="attn-reg-intro-coordinate"><Typography variant="bodySmall">V · 冰水售价（元）</Typography><Typography variant="h3" className="attn-reg-intro-observation"><MathFormulaStatic className="attn-inline-math" role="math" aria-label={`店铺 ${state.guideIndex+1} 的冰水售价 ${regressionPriceYuan(guide.y).toFixed(2)} 元`} latex={`p_{${state.guideIndex+1}}=${regressionPriceYuan(guide.y).toFixed(2)}`}/></Typography></div>
                <Button data-regression-next-observation onClick={() => change({ type: 'next-observation' })}>
                  <Typography as="span" variant="bodySmall" tone="inherit">换一个观测点</Typography>
                </Button>
              </div>
              : <div className="attn-reg-intro-selection">
                <Typography variant="h3" tone="accent">{state.revealed ? '真正的 Top 3' : '我的选择'}</Typography>
                <div className="attn-reg-intro-table" role="table" aria-label={state.revealed ? '权重最高的三个观测' : '已选择的观测'}>
                  <div className="attn-reg-intro-table-row" role="row">
                    <Typography variant="bodySmall" tone="muted" role="columnheader">记录</Typography>
                    <Typography variant="bodySmall" tone="muted" role="columnheader">x</Typography>
                    <Typography variant="bodySmall" tone="muted" role="columnheader">{state.revealed ? 'ATT' : '元'}</Typography>
                  </div>
                  {Array.from({ length: 3 }, (_, row) => {
                    const index = state.revealed ? top3[row].index : state.selected[row];
                    const sample = index === undefined ? undefined : samples[index];
                    return <div className="attn-reg-intro-table-row" role="row" key={row}>
                      <Typography variant="bodySmall" role="cell">{index === undefined ? '—' : index + 1}</Typography>
                      <Typography variant="bodySmall" role="cell">{sample ? sample.x.toFixed(2) : '—'}</Typography>
                      <Typography variant="bodySmall" tone={state.revealed ? 'accent' : 'main'} role="cell">
                        {state.revealed ? top3[row].weight.toFixed(3) : sample ? regressionPriceYuan(sample.y).toFixed(2) : '—'}
                      </Typography>
                    </div>;
                  })}
                </div>
                {prediction !== null && <div className="attn-reg-intro-prediction">
                  <Typography variant="bodySmall" tone="accent">估计售价（元）· Context</Typography>
                  <Typography as="output" variant="h2" tone="accent"><MathFormulaStatic className="attn-inline-math" role="math" aria-label={`店铺位置${state.q.toFixed(1)}千米的估计售价${regressionPriceYuan(prediction).toFixed(2)}元`} latex={String.raw`\hat{p}(${state.q.toFixed(1)})=${regressionPriceYuan(prediction).toFixed(2)}`}/></Typography>
                </div>}
              </div>}
        </aside>
      </div>
    </AttentionActivity>
  );
}

