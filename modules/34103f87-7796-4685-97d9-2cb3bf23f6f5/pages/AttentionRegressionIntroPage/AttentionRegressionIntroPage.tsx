import { useLayoutEffect, useRef, useState } from 'react';
import { Button, ContentBlock, Feedback, MathFormulaStatic, Question, RangeControl, Typography, type QuestionCheckResult } from "@shuku/course-style/react";
import { useActivityState, type ActivityProps } from '../../components/AttentionActivity';
import { useRegressionPage } from '../../components/useRegressionPage';
import { RegressionPlot } from '../../components/RegressionPlot';
import {
  ATTENTION_DATASET,
  DEFAULT_ATTENTION_QUERY,
  REGRESSION_EXPLORATION_W,
  attentionPrediction,
  attentionQueryRowIndex,
  attentionWeights,
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
  const [state, setState] = useActivityState('C13-campus-position-intro', createRegressionIntroState(), isRegressionIntroState);
  const { root, mathReady, canAct } = useRegressionPage(state.completedTrial !== null, props);
  const [forecastAttempt,setForecastAttempt]=useState('original');
  const restartForecast=()=>{if(canAct()){setForecastAttempt(crypto.randomUUID());setState(createRegressionIntroState());}};
  const previous = useRef({ phase: state.phase, forecast: state.forecast, revealed: state.revealed });
  const guide = samples[state.guideIndex];
  // Numerical answers are derived only for the revealed view.
  const weighted = state.revealed ? attentionWeights(state.q, samples, REGRESSION_EXPLORATION_W) : [];
  const top3 = [...weighted].sort((left, right) => right.weight - left.weight).slice(0, 3);
  const hitCount = top3.filter((item) => state.selected.includes(item.index)).length;
  const prediction = state.revealed ? attentionPrediction(state.q, samples, REGRESSION_EXPLORATION_W) : null;

  const change = (action: RegressionIntroAction) => {
    if (!canAct()) return;
    setState((current) => regressionIntroReducer(current, action));
  };
  const forecast = (result: QuestionCheckResult) => {
    if (!canAct() || result.empty || result.answer.length !== 1) return;
    const value = result.answer[0];
    if (value === 'near' || value === 'highest-y') change({ type: 'forecast', value });
  };

  useLayoutEffect(() => {
    const last = previous.current;
    previous.current = { phase: state.phase, forecast: state.forecast, revealed: state.revealed };
    const page = root.current;
    if (!page || page.closest('[aria-hidden="true"]')) return;
    let target: string | null = null;
    if (last.forecast === null && state.forecast !== null) target = '[data-regression-read]';
    if (last.phase !== state.phase) target = state.phase === 'read' ? '[data-regression-next-observation]' : '[data-regression-index="0"]';
    if (!last.revealed && state.revealed) target = '[data-regression-result]';
    if (target) page.querySelector<HTMLElement | SVGElement>(target)?.focus({ preventScroll: true });
  }, [state.phase, state.forecast, state.revealed]);

  const queryControl = (
    <RangeControl label="待重建时刻 Q（s）" aria-label="待重建时刻 Q，单位秒" min={0} max={4.9} step={0.1}
      value={state.q} digits={1} scale={['0', '4.9']}
      onChange={(event) => change({ type: 'set-q', value: event.currentTarget.valueAsNumber })} />
  );
  const originalFooter = state.phase === 'forecast'
    ? state.forecast === null
      ? <Question className="attn-reg-intro-question" type="choice" typeLabel="" showFeedback={false}
        title="优先参考哪些记录？" answer="near" key={forecastAttempt} persistenceKey={`attention-campus-C13-forecast-${forecastAttempt}`}
        options={[
          { value: 'near', label: '时刻接近的记录' },
          { value: 'highest-y', label: '位置数值最大的记录' },
        ]} onCheck={forecast} />
      : <div shuku-edit-id="e-9b407e85-91f2-4bbb-9332-d432dcd23ee2" className="attn-reg-intro-forecast-feedback">
        <Feedback status={state.forecast === 'near' ? 'correct' : 'wrong'}
          message={state.forecast === 'near' ? '时刻越接近，匹配分数越高。' : '这里按时间距离评分，不按位置数值大小。'} />
        <Button variant="primary" data-regression-read onClick={() => change({ type: 'read' })}>
          <Typography shuku-edit-id="e-4ddb2307-85e7-4db6-be1f-71caec29e8ac" as="span" variant="bodySmall" tone="inherit">开始认图</Typography>
        </Button>
      </div>
    : <div shuku-edit-id="e-6cfca13f-2a92-41ea-b21f-e96eac2f6f29" className="attn-reg-intro-controls">
      {queryControl}
      <div shuku-edit-id="e-5532b4d4-cede-458d-b62b-f5e40177169f" className="attn-reg-intro-action-row">
        {state.phase === 'read'
          ? <>
            <Typography shuku-edit-id="e-9d1bac03-cef4-4b92-9770-63158e11bbb0" variant="bodySmall" tone="muted">{state.readMoved ? 'Q 变了，已有的 K / V 没变。' : '先移动 Q，看看它与观测的关系。'}</Typography>
            <Button variant="primary" disabled={!state.readMoved} onClick={() => change({ type: 'select-stage' })}>
              <Typography shuku-edit-id="e-90fcb40b-27dd-4340-bba6-f2561a356172" as="span" variant="bodySmall" tone="inherit">选 3 个点</Typography>
            </Button>
          </>
          : state.revealed
            ? <>
              <div shuku-edit-id="e-0000e97b-eb5a-4e97-abe5-2f1de0745064" className="attn-reg-intro-result-line" data-regression-result tabIndex={-1}>
                <Typography shuku-edit-id="e-dca309af-1378-474a-9c1d-93ef66245813" variant="h3" tone={hitCount === 3 ? 'success' : 'accent'}>命中 {hitCount} / 3</Typography>
                <Typography shuku-edit-id="e-52de4c6e-e26b-4673-a57a-e5f99e21a7a4" variant="bodySmall" tone="muted">重建仍使用全部 50 条记录。</Typography>
              </div>
              <Button onClick={() => change({ type: 'retry' })}>
                <Typography shuku-edit-id="e-d65a815c-7dce-4416-9c32-6be0272016fb" as="span" variant="bodySmall" tone="inherit">再选一次（仅重做选点）</Typography>
              </Button>
            </>
            : <>
              <div shuku-edit-id="e-96e7632b-db9c-4bf6-8e98-1856d615da30" className="attn-reg-intro-result-line">
                <Typography shuku-edit-id="e-e77b1226-5398-43c5-b1bf-0898dee2628d" variant="h3" tone="accent" aria-live="polite">已选 {state.selected.length} / 3</Typography>
                <Typography shuku-edit-id="e-87eafeeb-92f5-4317-bfd6-868336458d1f" variant="bodySmall" tone="muted">{state.selected.length === 3 ? '可以核对，也可点已选项撤销。' : '选出你认为 ATT 最高的 3 个点。'}</Typography>
              </div>
              <Button variant="primary" disabled={state.selected.length !== 3} onClick={() => change({ type: 'check' })}>
                <Typography shuku-edit-id="e-cb8df18c-3a9f-4b30-986c-c6686d71b998" as="span" variant="bodySmall" tone="inherit">核对我的选点</Typography>
              </Button>
            </>}
      </div>
    </div>;

  return (
    <ContentBlock shuku-edit-id="e-e6065e19-00e3-45ac-a36e-d6632492b001" ref={root} title="补全队员位置：参考哪些时刻" headingLevel={1}
      subtitle="补全白衣队员的轨迹 · 合成记录"
      className="attn-reg-intro-page" bodyClassName="attn-reg-intro-body"
      data-activity="C13" data-activity-complete={state.completedTrial !== null}
      data-capture-ready={mathReady} aria-busy={!mathReady}
      onKeyDown={event => { if ([' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) event.stopPropagation(); }}>
      <div shuku-edit-id="e-91ca4497-2a55-4ae8-89d0-0bbf0073dcfa" className="attn-reg-intro-main" data-regression-phase={state.phase}
        data-regression-revealed={state.revealed} data-regression-query={state.q}>
        <div shuku-edit-id="e-0fb433b9-d021-4612-a2a7-f964760747ea" className="attn-reg-intro-visual">
          <RegressionPlot q={state.q} w={REGRESSION_EXPLORATION_W}
            guideIndex={state.phase === 'read' ? state.guideIndex : undefined}
            selectedIndices={state.selected}
            selectable={state.phase === 'select' && !state.revealed}
            onSelect={(index) => change({ type: 'select', index })}
            showWeights={state.revealed} showPrediction={state.revealed}
            revealedIndices={state.revealed ? top3.map((item) => item.index) : []} />
        </div>
        <aside shuku-edit-id="e-49a6d53f-34d3-44f9-9f5c-3d8b7deefdfe" className="attn-reg-intro-readout" aria-label="当前观察与核对结果">
          {state.phase === 'forecast'
            ? <div shuku-edit-id="e-714b9a29-bc14-4c3b-9826-9267be2af978" className="attn-reg-intro-prompt">
              <Typography shuku-edit-id="e-db72b390-7dcd-4fee-97bf-59fafe415aab" variant="bodySmall" tone="muted">50 条位置记录</Typography>
              <Typography shuku-edit-id="e-2b643f15-1042-4418-8367-49473cf1c464" variant="h3">2.5 秒时，队员在哪里？</Typography>
              <Typography shuku-edit-id="e-0f9d87ff-dae4-4760-948d-6114598adad9" variant="bodySmall" tone="success">Q · 查询时刻</Typography>
              <Typography shuku-edit-id="e-722171c8-bab0-48cf-b9b3-6e4410410ddb" variant="bodySmall">K · 时刻（s）</Typography>
              <Typography shuku-edit-id="e-5f1ec654-bbb6-42a5-a86b-da6131f48a50" variant="bodySmall">V · 位置（m）</Typography>
            </div>
            : state.phase === 'read'
              ? <div shuku-edit-id="e-acf5e2ff-3a69-4494-92eb-75de0ea6aeeb" className="attn-reg-intro-guide">
                <Typography shuku-edit-id="e-2a4a0a73-b8ed-49d8-99c9-df5fdfdfc9ac" variant="bodySmall" tone="muted">记录 {state.guideIndex + 1}</Typography>
                <div shuku-edit-id="e-d25927c9-86e4-4d51-8d7b-e4777df96491" className="attn-reg-intro-coordinate"><Typography shuku-edit-id="e-0462e71e-d94f-4c25-bcae-a81e9c52e440" variant="bodySmall">K · 时刻（s）</Typography><Typography shuku-edit-id="e-bd4c3e6c-1f0a-4084-b935-d68e7a097dc8" variant="h3" className="attn-reg-intro-observation"><MathFormulaStatic className="attn-inline-math" role="math" aria-label={`观测时刻 t ${state.guideIndex+1} 等于${guide.x.toFixed(2)}秒`} latex={`t_{${state.guideIndex+1}}=${guide.x.toFixed(2)}`}/></Typography></div>
                <div shuku-edit-id="e-de07d02b-af8d-482d-b668-d652ea365030" className="attn-reg-intro-coordinate"><Typography shuku-edit-id="e-d2e8cfbd-d24e-4334-b4b5-b460c46f3837" variant="bodySmall">V · 位置（m）</Typography><Typography shuku-edit-id="e-cb011b0a-5ce1-441e-a441-c562d87b84c8" variant="h3" className="attn-reg-intro-observation"><MathFormulaStatic className="attn-inline-math" role="math" aria-label={`记录 ${state.guideIndex+1} 的水平位置 ${guide.y.toFixed(2)} 米`} latex={`p_{${state.guideIndex+1}}=${guide.y.toFixed(2)}`}/></Typography></div>
                <Button data-regression-next-observation onClick={() => change({ type: 'next-observation' })}>
                  <Typography shuku-edit-id="e-f2222f2d-7840-4260-b27d-0cb162c039b2" as="span" variant="bodySmall" tone="inherit">换一个观测点</Typography>
                </Button>
              </div>
              : <div shuku-edit-id="e-66cf3d1f-f332-4deb-ae67-23b311046039" className="attn-reg-intro-selection">
                <Typography shuku-edit-id="e-cc18377c-31d3-44fd-b867-f7b0b50a23ab" variant="h3" tone="accent">{state.revealed ? '权重最高的 3 条' : '我的选择'}</Typography>
                <div shuku-edit-id="e-3cb09803-89e2-454f-872c-63dfe82df316" className="attn-reg-intro-table" role="table" aria-label={state.revealed ? '权重最高的三个观测' : '已选择的观测'}>
                  <div shuku-edit-id="e-c4687d9d-18a3-40af-9699-995208557cc6" className="attn-reg-intro-table-row" role="row">
                    <Typography shuku-edit-id="e-764bed44-698d-4c49-bd8f-ed79a11652c9" variant="bodySmall" tone="muted" role="columnheader">记录</Typography>
                    <Typography shuku-edit-id="e-9dc3d4e1-989b-40e2-9f57-097e762c85c1" variant="bodySmall" tone="muted" role="columnheader">t（s）</Typography>
                    <Typography shuku-edit-id="e-1fe87f4d-612c-4d9d-b08b-76cef0da0b5e" variant="bodySmall" tone="muted" role="columnheader">{state.revealed ? 'ATT' : 'p（m）'}</Typography>
                  </div>
                  {Array.from({ length: 3 }, (_, row) => {
                    const index = state.revealed ? top3[row].index : state.selected[row];
                    const sample = index === undefined ? undefined : samples[index];
                    return <div shuku-edit-id="e-1da613d1-58ab-4aea-b4e6-276e7f81df02" className="attn-reg-intro-table-row" role="row" key={row}>
                      <Typography shuku-edit-id="e-865dd986-c9aa-4609-8295-5b9c52d908fc" variant="bodySmall" role="cell">{index === undefined ? '—' : index + 1}</Typography>
                      <Typography shuku-edit-id="e-ca0d83f7-1df2-4b45-b5eb-3bdaecc8dfc2" variant="bodySmall" role="cell">{sample ? sample.x.toFixed(2) : '—'}</Typography>
                      <Typography shuku-edit-id="e-480271d4-209a-42f0-915e-2060e2dae86b" variant="bodySmall" tone={state.revealed ? 'accent' : 'main'} role="cell">
                        {state.revealed ? top3[row].weight.toFixed(3) : sample ? sample.y.toFixed(2) : '—'}
                      </Typography>
                    </div>;
                  })}
                </div>
                {prediction !== null && <div shuku-edit-id="e-e07986f5-bc09-4ed3-8551-e4d10a29e80d" className="attn-reg-intro-prediction">
                  <Typography shuku-edit-id="e-c02a4f3b-8da9-45c1-95c3-57ff3708fee3" variant="bodySmall" tone="accent">重建位置（m）</Typography>
                  <Typography shuku-edit-id="e-03f4c6a2-a253-47b7-b2dc-fa717dbba4f1" as="output" variant="h2" tone="accent"><MathFormulaStatic className="attn-inline-math" role="math" aria-label={`观测时刻${state.q.toFixed(1)}秒的重建位置${prediction.toFixed(2)}米`} latex={String.raw`\hat{p}(${state.q.toFixed(1)})=${prediction.toFixed(2)}`}/></Typography>
                </div>}
              </div>}
        </aside>
      </div>
      <footer shuku-edit-id="e-5242fcc9-b8bb-4b50-90ff-5cd41d8be791" className="attn-reg-intro-footer">
        <div shuku-edit-id="e-04723316-6e10-48b6-a905-aa4505f8fc25" className="attn-reg-intro-footer-with-review">{originalFooter}{state.phase !== 'forecast' &&
          <Button onClick={restartForecast}><Typography shuku-edit-id="e-29221287-e1c1-4b5c-b200-2ed7d52da89f" as="span" variant="bodySmall" tone="inherit">重新开始</Typography></Button>}
        </div>
      </footer>
    </ContentBlock>
  );
}

