import { Button, LessonStage, RangeControl, Typography, ValueTile, Callout } from '../../shared/react';
import { RegressionPlot } from '../components/RegressionPlot';
import { mse } from '../model/linearRegressionMath';
import { useLinearRegression } from '../model/LinearRegressionContext';

export function LinearFitBlock({ onComplete }: { onComplete?: () => void }) {
  const { state, points, setSlope, setIntercept, markLineChecked } = useLinearRegression(); const score = mse(points, state.slope, state.intercept); const ready = score < 1.45;
  return <LessonStage title="把趋势写成模型：ŷ = wx + b" description="拖动两个参数，观察直线如何移动。斜率控制方向，截距控制整体上下平移；我们先用 MSE 作为一把共同的尺子。">
    <div className="lr-grid lr-grid--fit"><div><RegressionPlot points={points} slope={state.slope} intercept={state.intercept} showResiduals /><Typography variant="bodySmall" tone="muted">红色虚线显示每个样本到直线的垂直距离：这就是残差。</Typography></div><div className="lr-controls"><RangeControl label="斜率 w" min={0} max={1.2} step={.01} digits={2} value={state.slope} onChange={(event) => setSlope(Number(event.currentTarget.value))} /><RangeControl label="截距 b" min={-10} max={80} step={.5} digits={1} value={state.intercept} onChange={(event) => setIntercept(Number(event.currentTarget.value))} /><div className="lr-metrics"><ValueTile label="当前平均平方误差" value={score.toFixed(2)} tone={ready ? 'success' : 'orange'} /><ValueTile label="直线预测" value={`${state.slope.toFixed(2)}x + ${state.intercept.toFixed(1)}`} tone="blue" /></div><Callout tone={ready ? 'green' : 'blue'} label={ready ? '趋势' : '继续试'} text={ready ? '这条线已经捕捉到主要趋势。' : '让更多点靠近直线，观察损失怎样变化。'} /><Button variant="primary" disabled={!ready} onClick={() => { markLineChecked(); onComplete?.(); }}>锁定这条线</Button></div></div>
  </LessonStage>;
}
