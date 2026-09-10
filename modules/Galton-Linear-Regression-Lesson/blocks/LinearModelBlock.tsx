import { useMemo, useState } from 'react';
import { ContentBlock, FormulaBlock, RangeControl, Typography } from '../../shared/react';
import { RegressionPlot } from '../components/RegressionPlot';
import { predict, referenceLine } from '../model/regressionMath';

export function LinearModelBlock({ interactive = true, onComplete }: { interactive?: boolean; onComplete?: () => void }) {
  const [slope, setSlope] = useState(referenceLine.slope);
  const [intercept, setIntercept] = useState(referenceLine.intercept);
  const line = useMemo(() => ({ slope, intercept }), [slope, intercept]);
  const examplePrediction = predict(174, line);

  const update = (kind: 'slope' | 'intercept', value: number) => {
    if (kind === 'slope') setSlope(value);
    else setIntercept(value);
    onComplete?.();
  };

  return (
    <ContentBlock
      className="grl-block grl-model"
      title="怎样把点云的方向，压缩成一条可计算的线？"
      subtitle="线性回归用两个参数描述直线：w 管倾斜，b 管上下位置。"
    >
      <div className="grl-model__layout">
        <div className="grl-model__visual">
          <RegressionPlot line={line} ariaLabel="带线性预测直线的身高散点图" />
          {interactive && (
            <div className="grl-controls">
              <RangeControl label="斜率 w · 改变倾斜" min="0.45" max="1.05" step="0.01" value={slope} digits={2} hint onChange={(event) => update('slope', Number(event.currentTarget.value))} />
              <RangeControl label="截距 b · 整体上下移动" min="10" max="70" step="1" value={intercept} suffix=" cm" onChange={(event) => update('intercept', Number(event.currentTarget.value))} />
            </div>
          )}
        </div>
        <aside className="grl-model__equation">
          <Typography as="span" variant="bodySmall" tone="muted">预测规则</Typography>
          <FormulaBlock ariaLabel="y hat equals w x plus b"><span>ŷ = <em>{slope.toFixed(2)}</em>x + <em>{intercept.toFixed(0)}</em></span></FormulaBlock>
          <dl className="grl-variable-map">
            <div><Typography as="dt" variant="bodySmall" tone="accent">x</Typography><Typography as="dd" variant="body">父母平均身高 · 输入</Typography></div>
            <div><Typography as="dt" variant="bodySmall" tone="success">ŷ</Typography><Typography as="dd" variant="body">模型预测身高 · 输出</Typography></div>
            <div><Typography as="dt" variant="bodySmall" tone="warning">y</Typography><Typography as="dd" variant="body">实际成年身高 · 答案</Typography></div>
          </dl>
          <div className="grl-model__readout">
            <Typography variant="bodySmall" tone="muted">代入 x = 174 cm</Typography>
            <Typography as="strong" variant="h2">ŷ = {examplePrediction.toFixed(1)} cm</Typography>
          </div>
        </aside>
      </div>
    </ContentBlock>
  );
}

