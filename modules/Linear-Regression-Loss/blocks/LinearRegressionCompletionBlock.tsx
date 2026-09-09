import { useEffect } from 'react';
import { Callout, LessonStage, Typography, ValueTile } from '../../shared/react';
import { mse } from '../model/linearRegressionMath';
import { useLinearRegression } from '../model/LinearRegressionContext';

export function LinearRegressionCompletionBlock({ onComplete }: { onComplete?: () => void }) { const { state, points } = useLinearRegression(); const score = mse(points, state.slope, state.intercept);
  useEffect(() => { if (!onComplete) return undefined; const timer = window.setTimeout(onComplete, 1400); return () => window.clearTimeout(timer); }, [onComplete]);
  return <LessonStage variant="featured" title="从高尔顿到机器学习" description="你已经走完了同一条链：数据 → 直线模型 → 预测 → 残差 → 损失。下一步，算法会自动寻找让损失下降的参数。"><div className="lr-summary"><Callout tone="green" label="核心句" text="线性回归不是寻找“完美规律”，而是在数据中寻找一条整体上更可靠的趋势线。" /><div className="lr-metrics"><ValueTile label="当前模型" value={`ŷ = ${state.slope.toFixed(2)}x + ${state.intercept.toFixed(1)}`} tone="blue" /><ValueTile label="整体 MSE" value={score.toFixed(2)} tone="success" /></div><Typography variant="bodySmall" tone="muted">换一个数据集时，仍然可以问三个问题：预测离真实值多远？如何汇总误差？怎样调整参数让损失下降？</Typography><Callout tone="blue" label="继续" text="下一节可以把“让损失下降”交给梯度下降；本页不再增加一个只负责结束流程的按钮。" /></div></LessonStage>;
}
