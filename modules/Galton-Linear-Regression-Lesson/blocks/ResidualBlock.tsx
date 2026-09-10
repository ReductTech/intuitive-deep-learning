import { ContentBlock, FormulaBlock, Typography } from '../../shared/react';
import { RegressionPlot } from '../components/RegressionPlot';
import { heightTeachingSample } from '../data/galtonStory';
import { predict, referenceLine, residual } from '../model/regressionMath';

const highlightedIndex = 7;
const point = heightTeachingSample[highlightedIndex];
const prediction = predict(point.parent, referenceLine);
const pointResidual = residual(point, referenceLine);

export function ResidualBlock() {
  return (
    <ContentBlock
      className="grl-block grl-residual"
      title="一条线不会穿过所有点：每次预测究竟错了多少？"
      subtitle="对同一个 x，真实点与预测线的垂直距离就是残差。"
    >
      <div className="grl-residual__layout">
        <div className="grl-residual__visual">
          <RegressionPlot line={referenceLine} showResiduals highlightedPoint={highlightedIndex} ariaLabel="显示每个真实点到预测直线残差的散点图" />
          <div className="grl-legend" aria-label="图例">
            <Typography as="span" variant="bodySmall"><i className="is-point" />真实值 y</Typography>
            <Typography as="span" variant="bodySmall"><i className="is-line" />预测值 ŷ</Typography>
            <Typography as="span" variant="bodySmall"><i className="is-residual" />残差 e</Typography>
          </div>
        </div>
        <aside className="grl-residual__derivation">
          <Typography as="span" variant="bodySmall" tone="accent">放大一户家庭</Typography>
          <div className="grl-pair-values">
            <div><Typography variant="bodySmall" tone="muted">实际值 y</Typography><Typography as="strong" variant="h1">{point.child.toFixed(1)}</Typography></div>
            <span aria-hidden="true">−</span>
            <div><Typography variant="bodySmall" tone="muted">预测值 ŷ</Typography><Typography as="strong" variant="h1">{prediction.toFixed(1)}</Typography></div>
          </div>
          <FormulaBlock ariaLabel="residual equals true value minus predicted value"><span>e = y − ŷ = <em>{pointResidual.toFixed(1)} cm</em></span></FormulaBlock>
          <Typography variant="body">残差有正有负。只把它们直接相加，正负可能互相抵消，明明预测不准却得到 0。</Typography>
          <Typography variant="bodySmall" tone="warning">所以还需要一种不会被正负抵消的汇总方法。</Typography>
        </aside>
      </div>
    </ContentBlock>
  );
}

