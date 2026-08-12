import {
  MathFormulaBlock,
  MathFormulaStatic,
  MathFormulaTerm,
} from '../../../shared/react/learning/MathFormulaBlock';
import { Typography } from '../../../shared/react/typography/Typography';

export function CrossEntropySection() {
  return (
    <section className="lg-react-rigor-note" aria-labelledby="lg-cross-entropy-title">
      <div className="lg-react-rigor-heading">
        <Typography as="h3" variant="h3" tone="accent" id="lg-cross-entropy-title">
          分类任务需要不同的损失：交叉熵
        </Typography>
        <Typography variant="bodySmall">
          L1 和 L2 损失衡量连续数值之间的差距，适合回归任务。分类任务中，模型输出的是<strong>类别概率</strong>——需要衡量两个概率分布之间的差异，而不是数值距离。交叉熵（Cross-Entropy）正是为此设计的标准损失。
        </Typography>
      </div>

      <section aria-labelledby="lg-bce-title">
        <Typography as="h4" variant="bodySmall" tone="accent" id="lg-bce-title">
          二分类交叉熵
        </Typography>
        <Typography variant="bodySmall">
          对于二分类，标签 y ∈ &#123;0, 1&#125;，模型输出一个概率 p ∈ (0, 1) 表示属于正类的置信度。假设标签服从<strong>伯努利分布</strong>，在输入 x 下观测到标签 y 的似然为：
        </Typography>
        <MathFormulaBlock ariaLabel="给定输入 x 和参数 theta 时观测到标签 y 的条件概率等于 p 的 y 次方乘 1 减 p 的 1 减 y 次方">
          <MathFormulaTerm latex="P_{\theta}(y\mid x)" tooltip="给定输入 x 和参数 θ，观测到标签 y 的条件概率。" ariaLabel="给定输入和参数时标签的条件概率" />
          <MathFormulaStatic latex="=" />
          <MathFormulaTerm latex="p^{y}(1-p)^{1-y}" tooltip="伯努利分布：y=1 时取 p，y=0 时取 1−p。" ariaLabel="p 的 y 次方乘 1 减 p 的 1 减 y 次方" />
          <MathFormulaStatic latex="," />
          <MathFormulaTerm latex="p" tooltip="p：模型预测正类的概率，由 sigmoid 等函数将 logit 压缩到 (0,1)。" ariaLabel="预测概率 p" />
          <MathFormulaStatic latex="=" />
          <MathFormulaTerm latex="\sigma(z)" tooltip="σ(z) = 1/(1+e^{-z})：sigmoid 函数，将实数 logit 映射为概率。" ariaLabel="sigmoid 函数作用在 logit 上" />
          <MathFormulaStatic latex="," />
          <MathFormulaTerm latex="y\in\{0,1\}" tooltip="y：二分类标签，取 0 或 1。" ariaLabel="标签 y 属于零一集合" />
        </MathFormulaBlock>
        <Typography variant="bodySmall">
          取负对数，把最大化似然转化为最小化目标，就得到<strong>二分类交叉熵</strong>（也称对数损失 / Log Loss）：
        </Typography>
        <MathFormulaBlock ariaLabel="二分类交叉熵等于负的 y 乘 log p 加 1 减 y 乘 log 1 减 p">
          <MathFormulaTerm latex="\ell_{\mathrm{BCE}}" tooltip="ℓ_BCE：单个样本的二分类交叉熵损失。" ariaLabel="二分类交叉熵损失" />
          <MathFormulaStatic latex="=" />
          <MathFormulaTerm latex="-y\log p-(1-y)\log(1-p)" tooltip="负对数似然。y=1 时只剩 −log p；y=0 时只剩 −log(1−p)。" ariaLabel="负的 y 乘 log p 减 1 减 y 乘 log 1 减 p" />
        </MathFormulaBlock>
        <div className="lg-react-prose-sequence">
          <Typography variant="bodySmall">
            当 y = 1 时，损失 = −log p。若模型预测 p → 0（错误），损失 → +∞，产生极强的修正信号；若 p → 1（正确），损失 → 0。
          </Typography>
          <Typography variant="bodySmall">
            当 y = 0 时，损失 = −log(1−p)。若 p → 1（错误），损失 → +∞；若 p → 0（正确），损失 → 0。交叉熵对「自信地犯错」施加的惩罚远大于「犹豫地犯错」。
          </Typography>
        </div>
      </section>

      <section aria-labelledby="lg-softmax-title">
        <Typography as="h4" variant="bodySmall" tone="accent" id="lg-softmax-title">
          从二分类到多分类：Softmax
        </Typography>
        <Typography variant="bodySmall">
          多分类有 K 个互斥类别。模型为每个类别输出一个原始分值（logit）z₁, z₂, …, z_K。Softmax 函数将 logits 转化为归一化概率向量 p = (p₁, …, p_K)，满足 Σ p_k = 1 且每个 p_k ∈ (0, 1)：
        </Typography>
        <MathFormulaBlock ariaLabel="softmax 第 k 个分量等于 e 的 z k 次方除以所有 e 的 z j 次方之和">
          <MathFormulaTerm latex="p_k" tooltip="p_k：模型预测样本属于第 k 类的概率，由 softmax 从 logits 计算得到。" ariaLabel="第 k 类的预测概率" />
          <MathFormulaStatic latex="=" />
          <MathFormulaTerm latex="\frac{e^{z_k}}{\sum_{j=1}^{K}e^{z_j}}" tooltip="分子用指数保证概率非负，分母确保所有类别概率之和为 1。" ariaLabel="e 的 z k 次方除以所有 e 的 z j 次方之和" />
          <MathFormulaStatic latex="," />
          <MathFormulaTerm latex="k=1,\ldots,K" tooltip="k 遍历全部 K 个类别。" ariaLabel="k 从 1 到 K" />
        </MathFormulaBlock>
        <Typography variant="bodySmall">
          Softmax 不是损失函数，而是<strong>激活函数</strong>——它只负责把 logits 变成概率分布。指数运算放大了 logit 之间的相对差异：最大的 logit 在概率中占据主导地位。
        </Typography>
      </section>

      <section aria-labelledby="lg-multi-ce-title">
        <Typography as="h4" variant="bodySmall" tone="accent" id="lg-multi-ce-title">
          多分类交叉熵
        </Typography>
        <Typography variant="bodySmall">
          真实标签用 one-hot 向量 y = (y₁, …, y_K) 表示，只有真实类别对应的位置为 1，其余为 0。多分类交叉熵衡量预测分布 p 与真实分布 y 之间的 KL 散度（去掉与参数无关的熵项后）：
        </Typography>
        <MathFormulaBlock ariaLabel="多分类交叉熵等于负的真实分布各分量乘 log 预测概率的求和，由于 y 是 one-hot 向量，只有真实类别项保留">
          <MathFormulaTerm latex="\ell_{\mathrm{CE}}" tooltip="ℓ_CE：单个样本的多分类交叉熵损失。" ariaLabel="多分类交叉熵损失" />
          <MathFormulaStatic latex="=" />
          <MathFormulaTerm latex="-\sum_{k=1}^{K}y_k\log p_k" tooltip="对 K 个类别求和；因为 y 是 one-hot 向量，实际上只有真实类别 k* 对应的那一项非零。" ariaLabel="负的真实标签各分量乘 log 预测概率的求和" />
          <MathFormulaStatic latex="=" />
          <MathFormulaTerm latex="-\log p_{k^{*}}" tooltip="p_k*：模型分配给真实类别 k* 的预测概率。损失只关心这一项。" ariaLabel="负的 log 真实类别预测概率" />
        </MathFormulaBlock>
        <Typography variant="bodySmall">
          多分类交叉熵只惩罚模型在<strong>真实类别</strong>上分配的概率。若 p_k* → 1，损失 → 0；若 p_k* → 0，损失 → +∞。其他类别上的概率分布不影响损失值——但这不意味着可以随便分配，因为 softmax 的归一化约束使得提高 p_k* 必然压低其他 p_k。
        </Typography>
      </section>

      <section className="lg-react-worked-example" aria-labelledby="lg-ce-worked-title">
        <Typography as="h4" variant="bodySmall" tone="accent" id="lg-ce-worked-title">
          关键洞察：为什么分类不用 MSE？
        </Typography>
        <Typography variant="bodySmall">
          对于二分类，若改用 sigmoid + MSE 作为损失，求导后会出现 <strong>p(1−p)</strong> 因子。当模型预测很确定（p → 0 或 p → 1）但预测错了时，这个因子趋近于 0，导致<strong>梯度消失</strong>——模型几乎停止学习。
        </Typography>
        <Typography variant="bodySmall">
          而交叉熵 + sigmoid/softmax 的组合带来了优雅的梯度形式：
        </Typography>
        <div className="lg-react-formula-stack">
          <MathFormulaBlock ariaLabel="二分类交叉熵加 sigmoid 对 logit z 的导数等于预测概率减真实标签">
            <MathFormulaTerm latex="\frac{\partial\ell_{\mathrm{BCE}}}{\partial z}" tooltip="二分类交叉熵关于 logit z 的偏导数。" ariaLabel="二分类交叉熵对 logit 的偏导" />
            <MathFormulaStatic latex="=" />
            <MathFormulaTerm latex="\sigma(z)-y" tooltip="σ(z) 是模型预测概率 p，y 是真实标签。梯度恰好等于「预测减真实」，简洁且不会在饱和区消失。" ariaLabel="sigmoid z 减 y" />
            <MathFormulaStatic latex="=" />
            <MathFormulaTerm latex="p-y" tooltip="梯度 = 预测概率 − 真实标签。预测正确时梯度接近 0；预测错误时梯度远离 0，产生强修正。" ariaLabel="p 减 y" />
          </MathFormulaBlock>
          <MathFormulaBlock ariaLabel="多分类交叉熵加 softmax 对 logit z k 的导数等于预测概率减真实标签">
            <MathFormulaTerm latex="\frac{\partial\ell_{\mathrm{CE}}}{\partial z_k}" tooltip="多分类交叉熵关于第 k 个 logit 的偏导数。" ariaLabel="多分类交叉熵对第 k 个 logit 的偏导" />
            <MathFormulaStatic latex="=" />
            <MathFormulaTerm latex="p_k-y_k" tooltip="对于真实类别 k*，梯度 = p_k* − 1（负值，鼓励概率上升）；对于其他类别，梯度 = p_k（正值，鼓励概率下降）。" ariaLabel="p k 减 y k" />
          </MathFormulaBlock>
        </div>
        <div className="lg-react-prose-sequence">
          <Typography variant="bodySmall">
            CE + softmax 的梯度不包含饱和因子：预测越错，梯度幅度越大，修正越强。这一性质使得交叉熵成为分类任务的<strong>标准选择</strong>。
          </Typography>
          <Typography variant="bodySmall">
            对比之下，MSE + sigmoid 的梯度为 <MathFormulaTerm latex="2(p-y)\,p(1-p)" tooltip="p(1-p) 在 p 接近 0 或 1 时趋近于 0，造成梯度饱和。" ariaLabel="二乘 p 减 y 乘 p 乘 1 减 p" />。即使预测完全错误 (p ≈ 0 而 y = 1)，p(1−p) ≈ 0 也会让梯度几乎消失，导致训练陷入停滞。
          </Typography>
        </div>
      </section>

      <Typography variant="bodySmall" tone="muted">
        以上讨论假设标签是互斥的。多标签分类（一个样本可同时属于多个类别）需改用逐标签的二分类交叉熵之和。另外，交叉熵要求 p_k &gt; 0，实际实现中会在 log 内部添加极小常数（如 10⁻⁷）防止数值溢出。
      </Typography>
    </section>
  );
}
