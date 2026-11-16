import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, RangeControl, Typography } from "@shuku/course-style/react";
import { LessonCheck, useActivityState, type ActivityProps } from '../../components/AttentionActivity';
import { AttentionHeatmap, WeightStrip } from '../../components/AttentionHeatmap';
import { useRegressionPage } from '../../components/useRegressionPage';
import { ATTENTION_DATASET, ATTENTION_BEFORE_HEATMAP, ATTENTION_AFTER_HEATMAP, attentionHeatmapComparison, attentionQueryRowIndex } from '../../model/attentionRegression';
import './AttentionRegressionHeatmapPage.css';

const beforeMatrix = ATTENTION_BEFORE_HEATMAP.map(row => row.weights);
const afterMatrix = ATTENTION_AFTER_HEATMAP.map(row => row.weights);
const rowLabels = ATTENTION_BEFORE_HEATMAP.map(row => row.query.toFixed(1));
const columnLabels = ATTENTION_DATASET.train.map((_, index) => String(index+1));
const times = ATTENTION_DATASET.train.map(sample => sample.x);
interface HeatmapActivity { q: number; moved: boolean; checked: boolean; attempt: number }
const initial: HeatmapActivity = { q: 2.5, moved: false, checked: false, attempt: 0 };
function valid(value: unknown): value is HeatmapActivity {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const state = value as HeatmapActivity;
  return typeof state.q === 'number' && attentionQueryRowIndex(state.q) >= 0
    && typeof state.moved === 'boolean' && typeof state.checked === 'boolean'
    && (!state.checked || state.moved) && (state.moved || state.q === 2.5)
    && Number.isInteger(state.attempt) && state.attempt >= 0;
}
export function AttentionRegressionHeatmapPage(props: ActivityProps) {
  const [state, setState] = useActivityState('C16-campus-position-heatmap', initial, valid);
  const done = state.moved && state.checked;
  const { root, mathReady, canAct } = useRegressionPage(done, props);
  const data = attentionHeatmapComparison(state.q);
  const change = (q: number) => {
    if (!canAct() || attentionQueryRowIndex(q) < 0) return;
    setState(current => q === current.q ? current : { ...current, q, moved: true });
  };
  const reset = () => { if (canAct()) setState(current => ({ ...initial, attempt: current.attempt + 1 })); };
  const comparisons = [
    { label: '训练前', name: 'before', epoch: 0, model: data.before, matrix: beforeMatrix },
    { label: '第 5 轮', name: 'after', epoch: 5, model: data.after, matrix: afterMatrix },
  ];
  return <ContentBlock shuku-edit-id="e-782b0c5b-0fe2-4c23-8d1a-377833209519" ref={root} title="把每个时刻的读取比例排成热图" headingLevel={1}
    subtitle="同一批合成记录：训练前 vs 第 5 轮。"
    className="attn-reg-heat-page" bodyClassName="attn-reg-heat-body"
    data-activity="C16" data-activity-complete={done} data-heatmap-moved={state.moved} data-regression-heatmap-q={state.q}
    data-capture-ready={mathReady} aria-busy={!mathReady}
    onKeyDown={event => { if ([' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) event.stopPropagation(); }}>
    <div shuku-edit-id="e-a1add43c-1012-4825-b048-42bf307257b1" className="attn-reg-heat-main">
      {comparisons.map(item => <section shuku-edit-id="e-dfec083d-1f17-4742-a0f4-9235aab8bf3b" key={item.name} className="attn-reg-heat-comparison"
        aria-label={item.label} data-regression-snapshot={item.name} data-regression-prediction={item.model.prediction}>
        <div shuku-edit-id="e-5c8e7ee0-926c-47b1-a73c-426868c71407" className="attn-reg-heat-heading">
          <Typography shuku-edit-id="e-d76d0be4-ce26-453d-bc6b-a72ebc1e54ec" variant="h3" tone="accent">{item.label}</Typography>
          <Typography shuku-edit-id="e-a9c1d4f9-36ed-4dbd-b9a1-13c91ec2e1c2" variant="bodySmall"><MathFormulaStatic className="attn-inline-math" latex={`w=${item.model.w.toFixed(3)}`}/></Typography>
        </div>
        <AttentionHeatmap compact rowAxisLabel="Q（s）" columnAxisLabel="记录序号（时序）"
          matrix={item.matrix} selectedRow={data.rowIndex} onSelectRow={row => change(row/10)}
          rowLabels={rowLabels} columnLabels={columnLabels} maxValue={data.colorMaximum}
          label={`${item.label}的50乘50权重热图，纵轴为查询时刻0至4.9秒，横轴是按观测时刻排序的50条记录`}/>
        <WeightStrip compact weights={item.model.weights} positions={times} maxValue={0.22}
          axisLabel="观测时刻 t（s）" valueLabel="时刻（s）" label={`${item.label}，查询${state.q}秒时的全部50项权重`}/>
        <div shuku-edit-id="e-4ba16649-3df9-435c-8ad8-5f4b7921535e" className="attn-reg-heat-result">
          <Typography shuku-edit-id="e-67cd4730-0009-4dd0-b375-8f32b750db78" variant="bodySmall" tone="accent">50 项加权</Typography>
          <MathFormulaBlock appearance="plain" ariaLabel={`查询时刻${state.q.toFixed(1)}秒的重建位置${item.model.prediction.toFixed(2)}米`}>
            <MathFormulaStatic latex={`\\hat{p}(${state.q.toFixed(1)})=${item.model.prediction.toFixed(2)}\\,\\mathrm{m}`}/>
          </MathFormulaBlock>
        </div>
      </section>)}
    </div>
    <footer shuku-edit-id="e-f4236164-f920-4466-99bc-40963999c580" className="attn-reg-heat-footer">
      <div shuku-edit-id="e-f38405b7-c46f-40f8-857e-c0ad90f33aac" className="attn-reg-heat-query">
        <RangeControl label="待重建时刻 Q（s）" aria-label="热图查询 Q" value={state.q} min={0} max={4.9} step={0.1}
          digits={1} scale={['0', '4.9']} onChange={event => change(event.currentTarget.valueAsNumber)}/>
        <Button onClick={reset}><Typography shuku-edit-id="e-f300dd29-2cfb-4a50-9c19-d4f3c5af0c35" as="span" variant="bodySmall" tone="inherit">重置查询</Typography></Button>
      </div>
      {state.moved ? <LessonCheck key={state.attempt} id={`C16-campus-${state.attempt}`}
        title="热图的一行对应什么？" options={[
          { value: 'query', label: '一个时刻对全部记录的权重' },
          { value: 'epoch', label: '一次训练的全部结果', wrongFeedback: '上下变化的是查询时刻；训练轮次固定在每张图的标题中。' },
        ]} answer="query" correct="一行：一个时刻对全部记录的权重。"
        done={state.checked} onDone={() => { if (canAct()) setState(current => ({ ...current, checked: true })); }}/>
        : <Typography shuku-edit-id="e-5d34b005-c60c-41bb-86c3-dfed88b6418f" variant="body" tone="muted">拖动 Q 或点选一行。</Typography>}
    </footer>
  </ContentBlock>;
}
