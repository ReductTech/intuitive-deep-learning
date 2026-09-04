import { Button, LessonStage, RangeControl, Typography, ValueTile } from '../../shared/react';
import { mae, mse } from '../model/linearRegressionMath';
import { useLinearRegression } from '../model/LinearRegressionContext';

export function LossFunctionBlock({ onComplete }: { onComplete?: () => void }) {
  const { state, points, setPrediction, markLossChecked } = useLinearRegression();
  const target = points.find((point) => point.parent === state.selectedParent) ?? points[8];
  const error = target.child - state.prediction;
  const candidate = points.map((point) => ({ parent: point.parent, child: state.prediction }));
  const currentMse = mse([target], 0, state.prediction);
  const currentMae = mae([target], 0, state.prediction);
  const ready = Math.abs(error) < 0.6;
  return <LessonStage title="损失函数：把‘差一点’变成一个数字" description="同一条直线会对每个家庭产生误差。损失函数把这些误差汇总，告诉我们模型还需要怎样调整。">
    <div className="lr-loss-layout">
      <div className="lr-residual-visual"><div className="lr-number-line"><span className="lr-number-line__target" style={{ left: `${Math.max(0, Math.min(100, ((target.child - 55) / 30) * 100))}%` }} /><span className="lr-number-line__prediction" style={{ left: `${Math.max(0, Math.min(100, ((state.prediction - 55) / 30) * 100))}%` }} /></div><Typography variant="bodySmall" tone="muted">红点是实际身高，蓝点是模型预测；两点之间就是残差。</Typography></div>
      <div className="lr-controls"><RangeControl label={`父母 ${target.parent} 英寸家庭的预测`} min={55} max={85} step={0.5} digits={1} value={state.prediction} suffix=" 英寸" onChange={(event) => setPrediction(Number(event.currentTarget.value))} /><div className="lr-metrics"><ValueTile label="平方损失" value={currentMse.toFixed(2)} /><ValueTile label="绝对损失" value={currentMae.toFixed(2)} /></div><Typography variant="body" tone={ready ? 'success' : 'muted'}>{ready ? '预测贴近实际值。注意：损失为 0 并不代表所有家庭都能被完美预测。' : '把预测拉近实际值，观察两种损失如何同时下降。'}</Typography><Button variant="primary" disabled={!ready} onClick={() => { markLossChecked(); onComplete?.(); }}>用损失检查模型</Button></div>
    </div>
    <Typography variant="bodySmall" tone="light" className="lr-hidden-data">{candidate.length} 个样本共同决定整体损失。</Typography>
  </LessonStage>;
}
