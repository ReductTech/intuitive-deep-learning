import { useState } from 'react';
import { Callout } from '../../shared/react/feedback/Callout';
import { ContentBlock } from '../../shared/react/layout/ContentBlock';
import { Question } from '../../shared/react/learning/Question';
import { FunctionPlot, type FunctionSeries } from '../../shared/react';
import { MathFormulaBlock, MathFormulaStatic } from '../../shared/react/learning/MathFormulaBlock';
import { Typography } from '../../shared/react/typography/Typography';
import type { LessonBlockProps } from './NumberLineBlock';
import { reviewLossComparison } from '../services/lossFeedback';

const lossSeries: FunctionSeries[] = [
  { id: 'l1', label: 'L1 = |ŷ − y|', fn: (error) => Math.abs(error), stroke: '#f07e47', strokeWidth: 3 },
  { id: 'l2', label: 'L2 = (ŷ − y)²', fn: (error) => error ** 2, stroke: '#27446e', strokeWidth: 3 },
];

export function LossCalculationBlock({ onComplete }: LessonBlockProps) {
  const [calculated, setCalculated] = useState(false);
  const [explained, setExplained] = useState(false);

  return (
    <ContentBlock className="lg-react-block" title="亲手算一次" subtitle="现在真实值为 3，预测值为 7。图中同时画出了 L1 和 L2 随误差变化的形状。">
      <section className="lg-react-rigor-note" aria-labelledby="lg-objective-definition-title">
        <Typography as="h3" variant="h3" tone="accent" id="lg-objective-definition-title">从单个样本到训练目标</Typography>
        <Typography variant="bodySmall">记残差 eᵢ = ŷᵢ − yᵢ。L1 使用残差绝对值，L2 使用残差平方；两者都消除了残差正负号相互抵消的问题。</Typography>
        <div className="lg-react-formula-stack">
          <MathFormulaBlock ariaLabel="残差 e i 等于预测值 y hat i 减真实值 y i">
            <MathFormulaStatic latex="e_i=\hat{y}_i-y_i" />
          </MathFormulaBlock>
          <MathFormulaBlock ariaLabel="第 i 个样本的 L1 损失等于残差绝对值，L2 损失等于残差平方">
            <MathFormulaStatic latex="\ell_{\mathrm{L1}}^{(i)}=|e_i|,\qquad \ell_{\mathrm{L2}}^{(i)}=e_i^2" />
          </MathFormulaBlock>
        </div>
        <dl className="lg-react-definition-list">
          <div>
            <Typography as="dt" variant="label" tone="accent">残差</Typography>
            <Typography as="dd" variant="bodySmall">预测值减真实值所得的有符号误差。正号表示预测偏高，负号表示预测偏低，绝对值表示偏离目标的大小；直接平均残差可能让正负误差相互抵消。</Typography>
          </div>
          <div>
            <Typography as="dt" variant="label" tone="accent">绝对误差</Typography>
            <Typography as="dd" variant="bodySmall">残差的绝对值。它随误差大小线性增长，因此每增加一个单位误差，损失增加的量保持一致。</Typography>
          </div>
          <div>
            <Typography as="dt" variant="label" tone="accent">平方误差</Typography>
            <Typography as="dd" variant="bodySmall">残差的平方。它随误差大小二次增长，因此较大的残差会获得更高权重，也更容易主导总体训练目标。</Typography>
          </div>
        </dl>
        <Typography variant="bodySmall">本页题目计算的是一个样本的损失。真正训练模型时，需要把 m 个训练样本的损失取平均，得到关于参数 θ 的经验风险（也常称训练目标或代价函数）。</Typography>
        <MathFormulaBlock ariaLabel="训练目标 J theta 等于 m 个样本损失的平均值，最优参数 theta star 是使训练目标最小的参数">
          <MathFormulaStatic latex="J(\theta)=\frac{1}{m}\sum_{i=1}^{m}\ell\!\left(y_i,f_{\theta}(x_i)\right),\qquad \theta^{*}=\underset{\theta}{\operatorname{arg\,min}}\;J(\theta)" />
        </MathFormulaBlock>
        <dl className="lg-react-definition-list">
          <div>
            <Typography as="dt" variant="label" tone="accent">经验风险</Typography>
            <Typography as="dd" variant="bodySmall">训练集中全部样本损失的平均值 J(θ)。它是可以由现有数据计算并交给优化算法最小化的目标，名称中的“经验”强调它来自有限训练样本。</Typography>
          </div>
          <div>
            <Typography as="dt" variant="label" tone="accent">期望风险</Typography>
            <Typography as="dd" variant="bodySmall">模型在真实但未知的数据分布上的平均损失，也称总体风险。学习真正关心的是这一量，但训练时通常只能用经验风险近似它。</Typography>
          </div>
          <div>
            <Typography as="dt" variant="label" tone="accent">经验风险最小化</Typography>
            <Typography as="dd" variant="bodySmall">在候选参数中寻找使训练集平均损失尽可能小的参数。训练误差降低说明优化取得进展，但只有验证集或测试集表现才能进一步判断泛化能力。</Typography>
          </div>
        </dl>
        <Typography variant="caption" tone="muted">“损失”严格地说常指单样本量 ℓ，“经验风险”指训练集平均量 J；工程语境中二者也经常统称为 loss。本模块沿用原有命名，将绝对误差称为 L1 Loss、平方误差称为 L2 Loss；取训练集平均后通常称为 MAE、MSE。</Typography>
      </section>
      <Callout tone="orange" label="你的任务" text="先算出当前预测的 L1、L2 损失。计算正确后，再解释两种损失的区别。" />
      <FunctionPlot className="lg-react-chart" series={lossSeries} showLegend xLabel="误差 ŷ − y" yLabel="损失" initialCenter={{ x: 0, y: 8 }} initialScale={{ x: .025, y: .055 }} minHeight={340} ariaLabel="L1 与 L2 损失函数图" />
      <Question persistenceKey="loss-calculation" type="fill" title="真实值为 3、预测值为 7：L1 Loss = ____，L2 Loss = ____。" blanks={[{ label: 'L1 Loss', placeholder: 'L1' }, { label: 'L2 Loss', placeholder: 'L2' }]} answer={['4', '16']} feedback={{ correct: '计算正确。L1 = 4，L2 = 16。现在继续解释两种损失的区别。' }} onCheck={(result) => setCalculated(result.ok)} />
      {calculated && <Question persistenceKey="loss-comparison" type="short" title="L1 Loss 和 L2 Loss 的区别是什么？" submitText="提交回答" review={(answers) => reviewLossComparison(answers[0] ?? '')} onCheck={(result) => { if (!result.empty && !explained) { setExplained(true); onComplete(); } }} />}
    </ContentBlock>
  );
}
