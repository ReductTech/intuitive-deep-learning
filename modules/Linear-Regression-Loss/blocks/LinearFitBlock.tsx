import { Button, LessonStage, RangeControl, Typography, ValueTile } from '../../shared/react';
import { RegressionPlot } from '../components/RegressionPlot';
import { mse } from '../model/linearRegressionMath';
import { useLinearRegression } from '../model/LinearRegressionContext';

export function LinearFitBlock({ onComplete }: { onComplete?: () => void }) {
  const { state, points, setSlope, setIntercept, markLineChecked } = useLinearRegression();
  const score = mse(points, state.slope, state.intercept);
  const ready = score < 1.45;
  return <LessonStage title="把趋势写成模型：ŷ = wx + b" description="拖动 w 和 b，让直线尽量穿过散点的中间。你正在选择模型参数，而不是背诵答案。">
    <div className="lr-grid lr-grid--fit">
      <RegressionPlot points={points} slope={state.slope} intercept={state.intercept} />
      <div className="lr-controls">
        <RangeControl label="斜率 w" min={0} max={1.2} step={0.01} digits={2} value={state.slope} onChange={(event) => setSlope(Number(event.currentTarget.value))} />
        <RangeControl label="截距 b" min={-10} max={80} step={0.5} digits={1} value={state.intercept} onChange={(event) => setIntercept(Number(event.currentTarget.value))} />
        <div className="lr-metrics"><ValueTile label="当前平均平方误差" value={score.toFixed(2)} /><ValueTile label="直线预测" value={`${state.slope.toFixed(2)}x + ${state.intercept.toFixed(1)}`} /></div>
        <Typography variant="bodySmall" tone={ready ? 'success' : 'muted'}>{ready ? '这条线已经捕捉到主要趋势。' : '误差还较大：让更多点落在直线附近。'}</Typography>
        <Button variant="primary" disabled={!ready} onClick={() => { markLineChecked(); onComplete?.(); }}>锁定这条线</Button>
      </div>
    </div>
  </LessonStage>;
}
