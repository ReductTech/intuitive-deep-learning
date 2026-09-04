import { Button, LessonStage, Typography } from '../../shared/react';
import { useLinearRegression } from '../model/LinearRegressionContext';
import { mse } from '../model/linearRegressionMath';

export function LinearRegressionCompletionBlock({ onComplete }: { onComplete?: () => void }) {
  const { state, points } = useLinearRegression();
  return <LessonStage variant="featured" title="从高尔顿到机器学习" description="你已经走完了同一条链：数据 → 直线模型 → 预测 → 残差 → 损失。">
    <div className="lr-summary"><Typography variant="body">线性回归不是寻找“完美规律”，而是在数据中寻找一条整体上更可靠的趋势线。</Typography><div className="lr-metrics"><div><Typography variant="bodySmall" tone="muted">当前模型</Typography><Typography variant="h3" tone="accent">ŷ = {state.slope.toFixed(2)}x + {state.intercept.toFixed(1)}</Typography></div><div><Typography variant="bodySmall" tone="muted">整体 MSE</Typography><Typography variant="h3" tone="accent">{mse(points, state.slope, state.intercept).toFixed(2)}</Typography></div></div><Typography variant="bodySmall" tone="muted">换一个数据集时，仍然可以用同样的三个问题检查模型：预测离真实值多远？如何汇总误差？怎样调整参数让损失下降？</Typography>{onComplete && <Button variant="primary" onClick={onComplete}>完成本节</Button>}</div>
  </LessonStage>;
}
