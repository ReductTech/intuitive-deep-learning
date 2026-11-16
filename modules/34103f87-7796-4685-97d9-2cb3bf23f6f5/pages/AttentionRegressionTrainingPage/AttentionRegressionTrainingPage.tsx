import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, ContentBlock, EChartsChart, MathFormulaBlock, MathFormulaStatic, Question, Typography } from "@shuku/course-style/react";
import { ChoiceButtons, numberText, useActivityState, type ActivityProps } from '../../components/AttentionActivity';
import { RegressionPlot } from '../../components/RegressionPlot';
import { useRegressionPage } from '../../components/useRegressionPage';
import { ATTENTION_DATASET, ATTENTION_INITIAL_TRAINING, ATTENTION_TRAINING_SNAPSHOTS, attentionPrediction, attentionTrainingMetrics, hasCompletedAttentionTraining, normalizeAttentionTrainingState, trainAttentionStep, type AttentionTrainingState } from '../../model/attentionRegression';
import './AttentionRegressionTrainingPage.css';

interface TrainingActivity { attempt: number; model: AttentionTrainingState; forecast: 'narrow' | 'wide' | null }
const initial: TrainingActivity = { attempt: 0, model: ATTENTION_INITIAL_TRAINING, forecast: null };
function valid(value: unknown): value is TrainingActivity {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const candidate = value as TrainingActivity;
  return Boolean(normalizeAttentionTrainingState(candidate.model))
    && (candidate.forecast === null || candidate.forecast === 'narrow' || candidate.forecast === 'wide')
    && (candidate.model.epoch === 0 || candidate.forecast !== null)
    && Number.isInteger(candidate.attempt) && candidate.attempt >= 0;
}
const landscape = Array.from({ length: 60 }, (_, index) => {
  const w = (index + 1) / 20;
  return [w, attentionTrainingMetrics(ATTENTION_DATASET, w).trainMse];
});
const formula = (latex: string, label: string) => <MathFormulaBlock appearance="plain" ariaLabel={label}><MathFormulaStatic latex={latex}/></MathFormulaBlock>;
export function AttentionRegressionTrainingPage(props: ActivityProps) {
  const [activity, setActivity] = useActivityState('C15-campus-position-training', initial, valid);
  const [running, setRunning] = useState(false);
  const [lossView, setLossView] = useState('example');
  const done = hasCompletedAttentionTraining(activity.model);
  const { root, mathReady, canAct } = useRegressionPage(done, props);
  const mounted = useRef(false);
  const training = useRef(false);
  const stateRef = useRef(activity);
  stateRef.current = activity;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; training.current = false; }; }, []);
  const model = activity.model;
  const previous = ATTENTION_TRAINING_SNAPSHOTS[Math.max(0, model.epoch - 1)];
  const heldOut = ATTENTION_DATASET.train[28];
  const estimate = attentionPrediction(heldOut.x, ATTENTION_DATASET.train, model.w, 28);
  const actual = heldOut.y;
  const option = useMemo(() => {
    const css = getComputedStyle(document.documentElement);
    const color = css.getPropertyValue('--ui-accent').trim();
    return { animation: false, grid: { left: 62, right: 26, top: 14, bottom: 46 },
      xAxis: { type: 'value', min: 0, max: 3, name: 'w', nameLocation: 'end', nameGap: 8,
        nameTextStyle: { fontSize: 22 }, axisLabel: { fontSize: 20 } },
      yAxis: { type: 'value', min: 0, max: 0.4, interval: 0.1, axisLabel: { fontSize: 20 },
        splitLine: { lineStyle: { color: css.getPropertyValue('--ui-border').trim() } } },
      series: [{ type: 'line', data: landscape, showSymbol: false, lineStyle: { width: 3, color } },
        { type: 'scatter', data: [[model.w, model.trainMse]], symbolSize: 15,
          itemStyle: { color: css.getPropertyValue('--ui-success').trim() },
          markLine: { silent: true, symbol: ['none', 'arrow'], symbolSize: 11,
            lineStyle: { type: 'solid', width: 3, color: css.getPropertyValue('--ui-accent-alt').trim() }, label: { show: false },
            data: model.epoch ? [[{ coord: [previous.w, previous.trainMse] }, { coord: [model.w, model.trainMse] }]] : [] } }] };
  }, [model, previous]);
  const visible = () => Boolean(root.current && !document.hidden && !root.current.closest('[aria-hidden="true"], [hidden], [inert]'));
  const train = async (target: number) => {
    if (training.current || !canAct() || activity.forecast === null || model.epoch >= 5) return;
    training.current = true; setRunning(true);
    let current = stateRef.current;
    try {
      while (current.model.epoch < Math.min(5, target)) {
        await new Promise<void>(resolve => globalThis.setTimeout(resolve, 0));
        if (!mounted.current || !visible()) return;
        current = { ...current, model: trainAttentionStep(current.model, ATTENTION_DATASET) };
        stateRef.current = current; setActivity(current);
      }
    } finally { training.current = false; if (mounted.current) setRunning(false); }
  };
  const reset = () => {
    if (!canAct() || running) return;
    const next = { ...initial, attempt: activity.attempt + 1 };
    stateRef.current = next; setActivity(next); setLossView('example');
  };
  return <ContentBlock shuku-edit-id="e-9eb101f9-6f50-4bfb-9560-f219561f27b1" ref={root} title="用已知记录，学习参考范围" headingLevel={1}
    subtitle={<>前页 <MathFormulaStatic className="attn-inline-math" latex={String.raw`w=1`}/>；本页从 <MathFormulaStatic className="attn-inline-math" latex={String.raw`w=0.5`}/> 学习。</>}
    className="attn-reg-train-page" bodyClassName="attn-reg-train-body"
    data-activity="C15" data-activity-complete={done} data-capture-ready={mathReady && !running} aria-busy={!mathReady || running}
    onKeyDown={event => { if ([' ', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) event.stopPropagation(); }}>
    <div shuku-edit-id="e-0bd6fe5c-c6c0-4928-ad25-2f00fdf13389" className="attn-reg-train-main" data-regression-epoch={model.epoch} data-regression-w={model.w} data-regression-mse={model.trainMse}>
      <section shuku-edit-id="e-38cfd8a8-9f06-40db-aecc-677308445c0d" className="attn-reg-train-plot">
        <div shuku-edit-id="e-7eaa62dc-06d1-48c1-9f7a-01fd5f7e2459" className="attn-reg-train-plot-heading">
          <Typography shuku-edit-id="e-f0c2ee11-98bb-4595-a88b-ac90863f77f2" variant="bodySmall" tone="accent">重建曲线</Typography>
          <Typography shuku-edit-id="e-5bc05dba-e4cb-4d71-bcb4-7a12fa9092b5" variant="bodySmall" tone="success"><MathFormulaStatic className="attn-inline-math" latex={`w=${model.w.toFixed(3)}\\,\\mathrm{s}^{-1}`}/></Typography>
        </div>
        <RegressionPlot wide q={2.5} w={model.w} showCurve showPrediction showWeights window/>
        <div shuku-edit-id="e-91f658f8-0bc1-4aa4-8685-38222234eade" className="attn-reg-train-kernel">
          {formula('e_i(q)=-\\frac12[w(q-t_i)]^2', '按时间距离计算高斯匹配分数')}
          <Typography shuku-edit-id="e-1f9b5423-c53f-430d-8642-e72b681c0178" variant="bodySmall" tone="muted">参考尺度 <MathFormulaStatic className="attn-inline-math" latex={`1/w=${(1/model.w).toFixed(3)}\\,\\mathrm{s}`}/></Typography>
        </div>
      </section>
      <section shuku-edit-id="e-fb935674-bc2e-40ac-92c8-2f77f072801d" className="attn-reg-train-landscape">
        <div shuku-edit-id="e-d07508c4-3a81-490c-8860-b93a9d6d3c72" className="attn-reg-train-loss-heading">
          <Typography shuku-edit-id="e-68438951-83fd-41e8-a9eb-d0e89b5de308" variant="bodySmall" tone="muted">留一均方误差（m²）</Typography>
          <Typography shuku-edit-id="e-f71f2c2b-af4f-4253-b717-d305f4e05a02" variant="bodySmall" tone="accent"><MathFormulaStatic className="attn-inline-math" latex={`\\mathrm{MSE}=${model.trainMse.toFixed(3)}`}/></Typography>
        </div>
        <EChartsChart minHeight={0} className="attn-reg-train-chart" option={option} aria-label={`留一误差随参数w变化，当前w${model.w}，误差${model.trainMse}米平方`}/>
        <div shuku-edit-id="e-18d0afec-9efc-428f-8a98-e0dade097014" className="attn-reg-train-loss-example" data-loss-view={lossView}>
          <ChoiceButtons label="核对误差与参数更新" value={lossView} onChange={value => { if (canAct() && (value === 'example' || value === 'gradient')) setLossView(value); }}
            options={[{ value: 'example', label: '核对一条记录' }, { value: 'gradient', label: '更新参数' }]}/>
          {lossView === 'example' ? <>
            {formula(`(${estimate.toFixed(4)}-${actual.toFixed(4)})^2\\approx${((estimate-actual)**2).toFixed(3)}\\,\\mathrm{m}^2`, '记录29的留一估计误差平方')}
            <Typography shuku-edit-id="e-6ff233f2-f00d-4d5e-b974-790b59f6a716" variant="bodySmall" tone="muted">留出第29条，用其余49条估计。</Typography>
          </> : <>
            {formula(model.epoch ? `w_${model.epoch}=${numberText(previous.w,3)}-2\\times(${numberText(previous.gradient,3)})\\approx${numberText(model.w,3)}` : String.raw`w_{n+1}=w_n-2\frac{\partial\mathrm{MSE}}{\partial w}`, '使用全部留一误差的平均梯度更新w')}
            <Typography shuku-edit-id="e-6702cd11-730b-449a-9d6b-016d270821a9" variant="bodySmall" tone="muted">平均 50 次误差，再更新 w。</Typography>
          </>}
        </div>
      </section>
    </div>
    <footer shuku-edit-id="e-ff05ea73-e790-4aa3-bbb0-37b1258dcfc5" className="attn-reg-train-footer">
      <Typography shuku-edit-id="e-2d0dc101-6776-4d03-b0b0-9ba1b675344e" variant="bodySmall" tone="muted">50 条合成记录，带外仍参与读取。</Typography>
      {activity.forecast === null ? <Question typeLabel="" showFeedback={false}
        title="学习后，参考范围怎样变？" persistenceKey={`attention-campus-C15-forecast-${activity.attempt}`} answer="narrow"
        options={[{ value: 'narrow', label: '收窄' }, { value: 'wide', label: '扩大' }]}
        onCheck={result => { if (canAct() && result.answer.length === 1 && (result.answer[0] === 'narrow' || result.answer[0] === 'wide')) {
          const next = { ...stateRef.current, forecast: result.answer[0] as 'narrow' | 'wide' }; stateRef.current = next; setActivity(next);
        } }}/>
        : <div shuku-edit-id="e-f10336f8-70bd-4f5c-80d7-45520680e309" className="attn-reg-train-run">
          <div shuku-edit-id="e-3c83286a-4666-4e4a-8796-e7b6affe58ce" className="attn-reg-train-status"><Typography shuku-edit-id="e-9dcb3341-2f1d-4c7d-9d24-229eae8061c2" variant="h3" tone="accent">第 {model.epoch} / 5 轮</Typography>
            <Typography shuku-edit-id="e-7a79b8e3-510f-4371-ad4b-5292cdd38a1f" variant="bodySmall" tone={done ? 'success' : 'muted'}>{done ? 'w 增大，范围收窄，误差下降。' : `你的预测：${activity.forecast === 'narrow' ? '收窄' : '扩大'}。每轮做 50 次留一检验。`}</Typography></div>
          <div shuku-edit-id="e-7f405ae1-f876-468c-b8fd-64a56dcd70ea" className="attn-reg-train-buttons">
            <Button variant="primary" disabled={running || model.epoch >= 5} onClick={() => void train(model.epoch+1)}><Typography shuku-edit-id="e-d75397b7-4f0f-4b26-877e-bf6e64c6ee86" as="span" variant="bodySmall" tone="inherit">{running ? '正在训练…' : '训练 1 轮'}</Typography></Button>
            <Button disabled={running || model.epoch >= 5} onClick={() => void train(5)}><Typography shuku-edit-id="e-f015ba0e-6579-4d3c-9c64-e1896591ad65" as="span" variant="bodySmall" tone="inherit">继续到第 5 轮</Typography></Button>
            <Button disabled={running} onClick={reset}><Typography shuku-edit-id="e-d2485b3b-b5f6-476c-a01b-f695fa3b27c6" as="span" variant="bodySmall" tone="inherit">重新开始</Typography></Button>
          </div>
        </div>}
    </footer>
  </ContentBlock>;
}
