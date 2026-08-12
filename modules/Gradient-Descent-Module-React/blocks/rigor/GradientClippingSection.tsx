import { MathFormulaBlock, MathFormulaStatic, MathFormulaTerm } from '../../../shared/react/learning/MathFormulaBlock';
import { Typography } from '../../../shared/react/typography/Typography';

export function GradientClippingSection() {
  return (
    <section className="gd-react-rigor-note" aria-labelledby="gd-clipping-title">
      <Typography as="h3" variant="h3" tone="accent" id="gd-clipping-title">
        梯度裁剪：防止一次更新走太远
      </Typography>

      <div className="gd-react-prose-sequence">
        <Typography variant="bodySmall">
          深度网络（尤其是 RNN / Transformer）中，反向传播经过多层链式法则累积后，梯度范数可能急剧增长——这被称为<strong>梯度爆炸</strong>。一个过大的梯度会让参数在一次更新中跳到非常远的位置，导致训练崩溃（Loss 变成 NaN）。
        </Typography>
        <Typography variant="bodySmall">
          <strong>梯度裁剪</strong>是一个简单而有效的工程措施：在执行参数更新之前，先检查梯度的范数。如果它超过了一个预设的阈值，就按比例缩小梯度，使其范数恰好等于该阈值——方向不变，只限制长度。
        </Typography>
      </div>

      <MathFormulaBlock ariaLabel="梯度裁剪：如果梯度范数大于阈值则按比例缩小，否则保持不变">
        <MathFormulaTerm latex="\tilde{\boldsymbol g}" tooltip="裁剪后实际用于更新的梯度。" ariaLabel="裁剪后的梯度" />
        <MathFormulaStatic latex="=" />
        <MathFormulaTerm
          latex="\begin{cases}\displaystyle\frac{c}{\|\boldsymbol g\|}\,\boldsymbol g,&\|\boldsymbol g\|>c\\ \boldsymbol g,&\|\boldsymbol g\|\le c\end{cases}"
          tooltip="当梯度范数超过阈值 c 时，保持方向但将范数缩小到 c；未超过则保持不变。"
          ariaLabel="如果梯度范数大于阈值则按 c 除以范数缩放，否则不变"
        />
      </MathFormulaBlock>

      <div className="gd-react-prose-sequence">
        <Typography variant="bodySmall">
          常用阈值 c 在 1.0 到 5.0 之间（具体取决于模型和任务）。梯度裁剪不改变梯度方向——大梯度的方向通常是有效的修正方向，只是步长过大。裁剪相当于对本次更新施加了一个<strong>步长上限</strong>。
        </Typography>
        <Typography variant="bodySmall">
          另一种常见形式是<strong>按值裁剪</strong>：将梯度每个分量独立地 clamp 到 [−c, c] 区间内。按范数裁剪保持梯度方向，按值裁剪可能改变方向。实践中按范数裁剪更常用。
        </Typography>
      </div>

      <MathFormulaBlock ariaLabel="被裁剪的梯度用于参数更新：新参数等于旧参数减学习率乘裁剪后的梯度">
        <MathFormulaTerm latex="\boldsymbol\theta_{t+1}" tooltip="更新后的参数向量。" ariaLabel="新参数" />
        <MathFormulaStatic latex="=" />
        <MathFormulaTerm latex="\boldsymbol\theta_t" tooltip="当前参数向量。" ariaLabel="旧参数" />
        <MathFormulaStatic latex="-" />
        <MathFormulaTerm latex="\eta" tooltip="学习率。" ariaLabel="学习率" tone="warm" />
        <MathFormulaTerm latex="\tilde{\boldsymbol g}" tooltip="用裁剪后的梯度替代原始梯度进行更新。" ariaLabel="裁剪后的梯度" />
      </MathFormulaBlock>

      <Typography variant="bodySmall" tone="muted">
        梯度裁剪是训练稳定性的保障措施，不是优化算法的核心组成部分。它与动量法、学习率调度、自适应方法等均可组合使用。现代框架（PyTorch、TensorFlow）提供一行 API 即可启用。
      </Typography>
    </section>
  );
}
