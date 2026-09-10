import type { CSSProperties } from 'react';
import { ContentBlock, FormulaBlock, Typography } from '../../shared/react';

const errors = [1, 2, 6];
const maeValue = errors.reduce((sum, value) => sum + Math.abs(value), 0) / errors.length;
const mseValue = errors.reduce((sum, value) => sum + value ** 2, 0) / errors.length;

export function LossFunctionBlock() {
  return (
    <ContentBlock
      className="grl-block grl-loss-function"
      title="怎样把许多次“错多少”，汇总成一个总分？"
      subtitle="损失函数接收一组残差，输出一个可以比较的数字；越小，整条线总体越贴近数据。"
    >
      <div className="grl-loss-function__stage">
        <section className="grl-error-tape" aria-label="三个绝对误差的对比">
          <Typography as="span" variant="bodySmall" tone="accent">同一组误差：1、2、6 cm</Typography>
          <div className="grl-error-bars">
            {errors.map((error) => (
              <div key={error}>
                <span style={{ '--error-size': error } as CSSProperties} />
                <Typography as="strong" variant="bodySmall">{error} cm</Typography>
              </div>
            ))}
          </div>
          <Typography variant="bodySmall" tone="muted">最大的 6 cm 误差，是这组预测里最值得注意的偏离。</Typography>
        </section>

        <section className="grl-loss-compare" aria-label="MAE 和 MSE 对相同误差的比较">
          <article>
            <Typography as="span" variant="bodySmall" tone="muted">每厘米同等计数</Typography>
            <Typography as="h3" variant="h2">MAE</Typography>
            <FormulaBlock ariaLabel="mean absolute error"><span>(|1| + |2| + |6|) ÷ 3</span></FormulaBlock>
            <Typography as="strong" variant="h1">{maeValue.toFixed(1)} cm</Typography>
          </article>
          <article className="is-mse">
            <Typography as="span" variant="bodySmall" tone="muted">先平方，再平均</Typography>
            <Typography as="h3" variant="h2">MSE</Typography>
            <FormulaBlock ariaLabel="mean squared error"><span>(1² + 2² + 6²) ÷ 3</span></FormulaBlock>
            <Typography as="strong" variant="h1">{mseValue.toFixed(1)} cm²</Typography>
          </article>
        </section>
      </div>
      <div className="grl-loss-function__takeaway">
        <Typography as="strong" variant="h3">平方让大误差更“响亮”</Typography>
        <Typography variant="body">6 cm 在 MAE 中贡献 6，在 MSE 的总和中贡献 36。本课接下来用 MSE 选择直线。</Typography>
      </div>
    </ContentBlock>
  );
}
