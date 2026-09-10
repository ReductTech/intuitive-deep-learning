import { Callout, ContentBlock, Typography } from '../../shared/react';

export function DecisionBridgeBlock() {
  return (
    <ContentBlock
      className="ng-lecture-stage"
      title="为什么用一个决定来观察人工神经元？"
      subtitle="决策例子同时具备多个输入、不同影响强弱和一个最终结果，适合把计算过程完整摊开。"
    >
      <div className="ng-decision-bridge">
        <div className="ng-bridge-question">
          <Typography as="span" variant="bodySmall" tone="muted">问题</Typography>
          <Typography as="strong" variant="body" tone="main">是否要读研？</Typography>
        </div>
        <div className="ng-bridge-factors" aria-label="影响读研决定的三个因素">
          <div><Typography as="code" variant="bodySmall" tone="accent">x₁</Typography><Typography as="strong" variant="bodySmall">研究兴趣</Typography><Typography variant="bodySmall" tone="muted">强不强？</Typography></div>
          <div><Typography as="code" variant="bodySmall" tone="accent">x₂</Typography><Typography as="strong" variant="bodySmall">职业帮助</Typography><Typography variant="bodySmall" tone="muted">明确吗？</Typography></div>
          <div><Typography as="code" variant="bodySmall" tone="accent">x₃</Typography><Typography as="strong" variant="bodySmall">经济承受力</Typography><Typography variant="bodySmall" tone="muted">能支持吗？</Typography></div>
        </div>
        <div className="ng-bridge-result"><Typography as="span" variant="bodySmall" tone="muted">一个输出</Typography><Typography as="strong" variant="bodySmall">支持或暂不支持</Typography></div>
      </div>
      <div className="ng-three-reasons">
        <article><Typography as="strong" variant="bodySmall" tone="accent">多个输入</Typography><Typography variant="bodySmall" tone="muted">单一因素不足以判断。</Typography></article>
        <article><Typography as="strong" variant="bodySmall" tone="accent">影响不同</Typography><Typography variant="bodySmall" tone="muted">每个因素有独立权重。</Typography></article>
        <article><Typography as="strong" variant="bodySmall" tone="accent">结果可观察</Typography><Typography variant="bodySmall" tone="muted">每项贡献都可追踪。</Typography></article>
      </div>
      <Callout tone="blue" label="说明" text="这里不是说人的真实决定由一个神经元完成，而是借一个熟悉的问题展示人工神经元的数学结构。" />
    </ContentBlock>
  );
}
