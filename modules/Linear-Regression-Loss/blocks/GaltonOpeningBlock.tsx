import { Button, LessonStage, RangeControl, Typography } from '../../shared/react';
import { RegressionPlot } from '../components/RegressionPlot';
import { predict } from '../model/linearRegressionMath';
import { useLinearRegression } from '../model/LinearRegressionContext';

export function GaltonOpeningBlock({ onComplete }: { onComplete?: () => void }) {
  const { state, points, setSelectedParent, setPrediction } = useLinearRegression();
  const expected = predict(state.selectedParent, 0.5, 35);
  const closeEnough = Math.abs(state.prediction - expected) < 1.1;
  return <LessonStage className="lr-opening-stage" variant="featured" title="高尔顿的问题：父母身高，能预测孩子吗？" description="19 世纪，弗朗西斯·高尔顿把父母与孩子的身高放在一起比较。先用一条直线做出你的预测。">
    <div className="lr-grid lr-grid--opening">
      <div><RegressionPlot points={points} slope={0.5} intercept={35} highlightParent={state.selectedParent} /><Typography variant="bodySmall" tone="muted">横轴：父母平均身高　纵轴：孩子身高（英寸）</Typography></div>
      <div className="lr-controls">
        <Typography variant="h3">先猜一个孩子身高</Typography>
        <RangeControl label="选择父母平均身高" min={64} max={75} step={1} value={state.selectedParent} suffix=" 英寸" onChange={(event) => setSelectedParent(Number(event.currentTarget.value))} />
        <RangeControl label="你的预测" min={55} max={85} step={0.5} value={state.prediction} suffix=" 英寸" onChange={(event) => setPrediction(Number(event.currentTarget.value))} />
        <Typography variant="body" tone={closeEnough ? 'success' : 'muted'}>{closeEnough ? '预测落在这组数据的趋势附近。下一步看看“附近”如何被计算。' : '先观察散点的整体趋势，再调整预测。'}</Typography>
        <Button variant="primary" disabled={!closeEnough} onClick={() => onComplete?.()}>接受这条趋势线</Button>
      </div>
    </div>
  </LessonStage>;
}
