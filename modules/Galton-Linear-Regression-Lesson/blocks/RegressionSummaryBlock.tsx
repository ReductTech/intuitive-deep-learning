import { ContentBlock, Typography } from '../../shared/react';

const steps = [
  { number: '01', title: '数据', text: '每个点提供输入 x 与真实答案 y。' },
  { number: '02', title: '模型', text: 'ŷ = wx + b 把总体趋势变成预测。' },
  { number: '03', title: '残差', text: 'e = y − ŷ 记录一次预测偏离多少。' },
  { number: '04', title: '损失', text: 'MSE 汇总所有平方残差，用来比较直线。' },
];

export function RegressionSummaryBlock() {
  return (
    <ContentBlock
      className="grl-block grl-summary"
      title="线性回归真正做的事：用损失选择一条预测线"
      subtitle="回到高尔顿的问题，现在可以把“似乎有关”翻译成一条完整、可检验的计算链。"
    >
      <div className="grl-summary__chain">
        {steps.map((step, index) => (
          <article key={step.number}>
            <Typography as="span" variant="bodySmall" tone="accent">{step.number}</Typography>
            <Typography as="h3" variant="h2">{step.title}</Typography>
            <Typography variant="body">{step.text}</Typography>
            {index < steps.length - 1 && <span className="grl-summary__arrow" aria-hidden="true">→</span>}
          </article>
        ))}
      </div>
      <section className="grl-transfer">
        <div>
          <Typography as="span" variant="bodySmall" tone="muted">迁移一下</Typography>
          <Typography as="h3" variant="h2">如果改为“用房屋面积预测租金”，什么会变，什么不变？</Typography>
        </div>
        <div className="grl-transfer__answer">
          <Typography variant="body"><strong>会变：</strong>x、y 的含义与单位。</Typography>
          <Typography variant="body"><strong>不变：</strong>画点 → 做预测 → 算残差 → 比损失。</Typography>
        </div>
      </section>
      <Typography variant="bodySmall" tone="warning" className="grl-boundary">
        适用边界：点云若明显弯曲，一条直线即使达到最小损失，也可能仍是错误的模型形状。
      </Typography>
    </ContentBlock>
  );
}

