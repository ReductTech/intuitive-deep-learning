import { useMemo, useState } from 'react';
import { Button, ContentBlock, FormulaBlock, RangeControl, Typography } from '../../shared/react';
import { RegressionPlot } from '../components/RegressionPlot';
import { heightTeachingSample } from '../data/galtonStory';
import { mse, startingLine } from '../model/regressionMath';

const TARGET_LOSS = 4.5;

export function LossLabBlock({ interactive = true, onComplete }: { interactive?: boolean; onComplete?: () => void }) {
  const initial = interactive ? startingLine : { slope: 0.82, intercept: 31 };
  const [slope, setSlope] = useState(initial.slope);
  const [intercept, setIntercept] = useState(initial.intercept);
  const line = useMemo(() => ({ slope, intercept }), [slope, intercept]);
  const loss = mse(heightTeachingSample, line);
  const reached = loss <= TARGET_LOSS;
  const meter = Math.max(0, Math.min(100, 100 - loss * 1.8));

  const update = (kind: 'slope' | 'intercept', value: number) => {
    const next = kind === 'slope' ? { slope: value, intercept } : { slope, intercept: value };
    if (kind === 'slope') setSlope(value);
    else setIntercept(value);
    if (mse(heightTeachingSample, next) <= TARGET_LOSS) onComplete?.();
  };

  const reset = () => {
    setSlope(startingLine.slope);
    setIntercept(startingLine.intercept);
  };

  return (
    <ContentBlock
      className="grl-block grl-lab"
      title="哪一条线更好？让损失替我们做同一把尺子的比较"
      subtitle={interactive ? '先猜该怎样移动线，再调 w 与 b；观察残差和 MSE 是否同时变小。' : '当参数接近最佳组合时，残差整体缩短，MSE 随之下降。'}
    >
      <div className="grl-lab__layout">
        <div className="grl-lab__plot">
          <RegressionPlot line={line} showResiduals ariaLabel="可调整直线并显示残差的身高散点图" />
          {interactive && (
            <div className="grl-controls">
              <RangeControl label="斜率 w" min="0.45" max="1.05" step="0.01" value={slope} digits={2} hint onChange={(event) => update('slope', Number(event.currentTarget.value))} />
              <RangeControl label="截距 b" min="10" max="90" step="1" value={intercept} suffix=" cm" onChange={(event) => update('intercept', Number(event.currentTarget.value))} />
            </div>
          )}
        </div>
        <aside className={reached ? 'grl-loss-meter is-reached' : 'grl-loss-meter'}>
          <Typography as="span" variant="bodySmall" tone="muted">当前均方误差</Typography>
          <Typography as="strong" variant="display">{loss.toFixed(1)}</Typography>
          <Typography variant="bodySmall" tone="muted">cm² · 目标 ≤ {TARGET_LOSS}</Typography>
          <div className="grl-loss-meter__track" role="meter" aria-label="拟合接近程度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(meter)}>
            <span style={{ width: `${meter}%` }} />
          </div>
          <FormulaBlock ariaLabel="loss of w and b equals the mean squared residual"><span>L(w,b) = 1/n Σ(yᵢ − ŷᵢ)²</span></FormulaBlock>
          <Typography variant="body" tone={reached ? 'success' : 'main'}>
            {reached ? '找到了：红色残差整体已经很短。损失把“看起来更贴近”变成了可比较的数字。' : '还有明显的长残差。想一想：线需要更陡，还是整体上移？'}
          </Typography>
          {interactive && <Button type="button" onClick={reset}>重置实验</Button>}
        </aside>
      </div>
    </ContentBlock>
  );
}

