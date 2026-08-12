import { MathFormulaBlock, MathFormulaStatic, MathFormulaTerm } from '../../../shared/react/learning/MathFormulaBlock';
import { Typography } from '../../../shared/react/typography/Typography';

export function GradientDefinitionSection() {
  return (
    <section className="gd-react-rigor-note" aria-labelledby="gd-gradient-definition-title">
      <Typography as="h3" variant="h3" tone="accent" id="gd-gradient-definition-title">梯度是目标函数关于全部参数的局部变化率</Typography>
      <div className="gd-react-prose-sequence">
        <Typography variant="bodySmall"><strong>局部导数</strong>描述一个量在当前位置对另一个量的瞬时变化率，只保证附近的一阶关系。权重先影响预测、预测再影响 Loss，因此需要用<strong>链式法则</strong>把计算路径上的局部导数连接起来，得到 Loss 对每个权重的偏导。</Typography>
        <Typography variant="bodySmall">把 Loss 关于全部待学习参数的偏导按顺序排列，就得到<strong>参数梯度</strong>。在欧氏长度下，负梯度是当前位置的一阶最速下降方向；它给出局部方向，但是否真的让目标下降，还取决于学习率是否合适。</Typography>
      </div>
      <Typography variant="bodySmall">对 d 个参数组成的向量，梯度把每个参数方向上的偏导按相同顺序排列。目标函数从参数空间映射到一个标量，因此梯度与参数向量形状一致，才能逐分量执行更新。</Typography>
      <MathFormulaBlock ariaLabel="目标函数 J 从 d 维参数空间映射到实数，梯度由 J 对每个参数分量的偏导数组成">
        <MathFormulaTerm latex="J:\mathbb R^d\to\mathbb R" tooltip="目标函数接收 d 维参数向量并输出一个实数标量。" ariaLabel="目标函数从 d 维实数空间映射到实数" />
        <MathFormulaStatic latex="," />
        <MathFormulaTerm latex="\nabla J(\boldsymbol\theta)" tooltip="J 在当前参数 θ 处的梯度，与 θ 具有相同维度。" ariaLabel="目标函数在 theta 处的梯度" />
        <MathFormulaStatic latex="=" />
        <MathFormulaTerm latex="\begin{bmatrix}\frac{\partial J}{\partial\theta_1}&\cdots&\frac{\partial J}{\partial\theta_d}\end{bmatrix}^{\!\top}" tooltip="依次收集目标函数关于 θ₁ 到 θd 的偏导数，组成列向量。" ariaLabel="由 d 个参数偏导数组成的梯度列向量" />
      </MathFormulaBlock>
    </section>
  );
}

export function ChainRuleSection() {
  return (
    <section className="gd-react-rigor-note" aria-labelledby="gd-chain-rule-title">
      <Typography as="h3" variant="h3" tone="accent" id="gd-chain-rule-title">链式法则把局部变化率连成参数梯度</Typography>
      <Typography variant="bodySmall">上面的三个偏导不是彼此独立的答案。对任一输出层权重 vⱼ，Loss 对权重的偏导等于“Loss 对预测的变化率”与“预测对该权重的变化率”之积。</Typography>
      <MathFormulaBlock ariaLabel="L 对 v j 的偏导等于 L 对 y 的偏导乘 y 对 v j 的偏导，并且 y 对 v j 的偏导等于 h j">
        <MathFormulaTerm latex="\frac{\partial L}{\partial v_j}" tooltip="损失 L 关于第 j 个输出层权重 vⱼ 的偏导数。" ariaLabel="损失对权重 v j 的偏导" />
        <MathFormulaStatic latex="=" />
        <MathFormulaTerm latex="\frac{\partial L}{\partial y}" tooltip="损失关于预测值的局部变化率，给出当前误差修正方向。" ariaLabel="损失对预测值的偏导" />
        <MathFormulaTerm latex="\frac{\partial y}{\partial v_j}" tooltip="预测值关于权重 vⱼ 的局部变化率。" ariaLabel="预测值对权重 v j 的偏导" />
        <MathFormulaStatic latex="," />
        <MathFormulaTerm latex="\frac{\partial y}{\partial v_j}" tooltip="在线性输出层中，预测对某个权重的偏导等于与它相乘的输入。" ariaLabel="预测值对权重 v j 的偏导" />
        <MathFormulaStatic latex="=" />
        <MathFormulaTerm latex="h_j" tooltip="hⱼ：与权重 vⱼ 相乘的第 j 个隐藏层输出。" ariaLabel="第 j 个隐藏层输出" />
        <MathFormulaStatic latex="," />
        <MathFormulaTerm latex="j\in\{1,2\}" tooltip="本阶段仅有两个输出层权重，因此 j 取 1 或 2。" ariaLabel="j 属于一和二" />
      </MathFormulaBlock>
      <Typography variant="bodySmall">当前 y &lt; GT，所以 ∂L/∂y = −1；与 h₁ = 3、h₂ = 1 相乘后，两个权重的梯度分别为 −3 和 −1。更新规则减去负梯度，因此两个权重都会增大。</Typography>
      <Typography variant="bodySmall" tone="muted">严格地说，L1 Loss 在 y = GT 处不可导；此时可使用区间 [−1, 1] 内的次梯度。本演示在 Loss 足够小时停止更新，避免在折点附近反复跳动。</Typography>
      <MathFormulaBlock ariaLabel="当前关于 v1 和 v2 的梯度向量等于负三和负一，下一步参数等于当前参数减学习率乘梯度">
        <MathFormulaTerm latex="\nabla_{\boldsymbol v}L" tooltip="损失关于两个输出层权重的梯度向量。" ariaLabel="损失关于输出层权重的梯度" />
        <MathFormulaStatic latex="=" />
        <MathFormulaTerm latex="\begin{bmatrix}-1\times3\\-1\times1\end{bmatrix}" tooltip="链式法则把损失对预测的偏导分别乘以两个隐藏层输出。" ariaLabel="链式法则计算的两个梯度分量" />
        <MathFormulaStatic latex="=" />
        <MathFormulaTerm latex="\begin{bmatrix}-3\\-1\end{bmatrix}" tooltip="当前得到的两个权重梯度分别为 −3 和 −1。" ariaLabel="负三和负一组成的梯度向量" />
        <MathFormulaStatic latex="," />
        <MathFormulaTerm latex="\boldsymbol v^{(t+1)}" tooltip="第 t+1 次迭代使用的新权重向量。" ariaLabel="下一步权重向量" />
        <MathFormulaStatic latex="=" />
        <MathFormulaTerm latex="\boldsymbol v^{(t)}" tooltip="第 t 次迭代开始时的旧权重向量。" ariaLabel="当前权重向量" />
        <MathFormulaStatic latex="-" />
        <MathFormulaTerm latex="\eta_t" tooltip="ηₜ：第 t 次更新使用的学习率，控制移动步长。" ariaLabel="第 t 步学习率" tone="warm" />
        <MathFormulaTerm latex="\nabla_{\boldsymbol v}L\!\left(\boldsymbol v^{(t)}\right)" tooltip="在同一组旧权重上计算得到的当前梯度。" ariaLabel="当前权重处的损失梯度" />
      </MathFormulaBlock>
    </section>
  );
}

export function LearningRateSection() {
  return (
    <section className="gd-react-rigor-note" aria-labelledby="gd-learning-rate-title">
      <Typography as="h3" variant="h3" tone="accent" id="gd-learning-rate-title">负梯度给方向，学习率决定这一步是否可靠</Typography>
      <Typography variant="bodySmall">对可微目标 J，在当前位置附近做一阶近似，并令参数变化量 Δθ = −η∇J，可得到目标值下降的局部解释。</Typography>
      <div className="gd-react-prose-sequence">
        <Typography variant="bodySmall"><strong>学习率 η</strong> 是梯度前的正数缩放系数，控制一次更新走多远。它属于训练算法的超参数，而不是模型通过前向计算得到的参数。一次完整迭代应先用同一组旧参数完成前向计算、求损失和全部梯度，再同时生成下一组参数。</Typography>
        <Typography variant="bodySmall">随着迭代继续，参数或目标值可能逐渐稳定，这称为<strong>收敛</strong>。工程上常用梯度范数、目标变化量或迭代次数停止训练，但停止不等于已经在数学上收敛，收敛也不保证找到全局最优解。</Typography>
        <Typography variant="bodySmall">步长过大时，更新可能反复越过低值区域而<strong>震荡</strong>，甚至让参数和目标值持续远离合理范围而<strong>发散</strong>。让学习率逐步衰减，可以兼顾早期移动速度和后期稳定性；衰减过快会过早停住，过慢则可能长期波动。</Typography>
      </div>
      <ul className="gd-react-rigor-list">
        <Typography as="li" variant="bodySmall">η = 0 时参数不更新；η 很小时通常较稳定，但需要更多迭代。</Typography>
        <Typography as="li" variant="bodySmall">η 过大时，一阶近似不再可靠，更新可能越过低点并产生震荡，甚至让 Loss 发散。</Typography>
        <Typography as="li" variant="bodySmall">负梯度是当前位置的一阶最速下降方向，不等于“任意步长都使 Loss 下降”。</Typography>
      </ul>
      <MathFormulaBlock ariaLabel="J 在 theta 加 delta theta 处近似等于 J theta 加梯度与 delta theta 的内积，代入负学习率乘梯度后近似等于 J theta 减学习率乘梯度范数平方">
        <MathFormulaTerm latex="J(\boldsymbol\theta+\Delta\boldsymbol\theta)" tooltip="参数发生小变化 Δθ 后的目标函数值。" ariaLabel="参数变化后的目标值" />
        <MathFormulaStatic latex="\approx" />
        <MathFormulaTerm latex="J(\boldsymbol\theta)" tooltip="更新前参数 θ 对应的目标函数值。" ariaLabel="当前目标值" />
        <MathFormulaStatic latex="+" />
        <MathFormulaTerm latex="\nabla J(\boldsymbol\theta)^{\!\top}\Delta\boldsymbol\theta" tooltip="梯度与参数变化量的内积，给出目标函数的一阶变化近似。" ariaLabel="梯度与参数变化的内积" />
        <MathFormulaStatic latex="," />
        <MathFormulaTerm latex="J(\boldsymbol\theta-\eta\nabla J)" tooltip="沿负梯度方向移动一步后的目标函数值。" ariaLabel="负梯度更新后的目标值" />
        <MathFormulaStatic latex="\approx" />
        <MathFormulaTerm latex="J(\boldsymbol\theta)" tooltip="更新前的目标函数值。" ariaLabel="当前目标值" />
        <MathFormulaStatic latex="-" />
        <MathFormulaTerm latex="\eta" tooltip="η：学习率，控制本次参数移动长度。" ariaLabel="学习率 eta" tone="warm" />
        <MathFormulaTerm latex="\lVert\nabla J\rVert_2^2" tooltip="梯度的二范数平方，非负并刻画当前位置的一阶下降强度。" ariaLabel="梯度二范数平方" />
      </MathFormulaBlock>
      <Typography variant="bodySmall">上式省略了参数步长的二阶及更高阶项，所以它只在局部成立。学习率过大时，高阶项不再可以忽略；这正是“方向算对了，Loss 仍可能上升”的数学原因。</Typography>
      <section className="gd-react-worked-example" aria-labelledby="gd-rate-example-title">
        <Typography as="h4" variant="bodySmall" tone="accent" id="gd-rate-example-title">小例子：同一个梯度方向，步长不同会得到相反结果</Typography>
        <Typography variant="bodySmall">考虑最简单的一维目标 J(x)=x²/2。当前位置 x=4 时，梯度 J′(x)=x=4，负梯度方向指向更小的 x。</Typography>
        <MathFormulaBlock ariaLabel="目标函数 J x 等于二分之一 x 平方，在 x 等于四时梯度等于四，目标值等于八">
          <MathFormulaTerm latex="J(x)" tooltip="用于演示学习率作用的一维二次目标函数。" ariaLabel="一维目标函数 J x" />
          <MathFormulaStatic latex="=" />
          <MathFormulaTerm latex="\frac{1}{2}x^2" tooltip="开口向上的二次函数，其全局最小值位于 x=0。" ariaLabel="二分之一 x 平方" />
          <MathFormulaStatic latex="," />
          <MathFormulaTerm latex="J'(4)=4" tooltip="在 x=4 处，目标函数导数为 4，因此更新方向为负方向。" ariaLabel="x 等于四时梯度等于四" />
          <MathFormulaStatic latex="," />
          <MathFormulaTerm latex="J(4)=8" tooltip="更新前的目标函数值。" ariaLabel="x 等于四时目标值为八" />
        </MathFormulaBlock>
        <Typography variant="bodySmall">采用较小学习率 η=0.25，参数从 4 更新到 3，目标值从 8 降到 4.5，说明这一步有效。</Typography>
        <MathFormulaBlock ariaLabel="学习率为零点二五时，x 从四更新为三，目标值从八下降到四点五">
          <MathFormulaTerm latex="x_{mathrm{new}}" tooltip="执行一次梯度下降后的新参数。" ariaLabel="更新后的 x" />
          <MathFormulaStatic latex="=" />
          <MathFormulaTerm latex="4-0.25\times4" tooltip="旧参数减去学习率乘当前梯度。" ariaLabel="四减零点二五乘四" />
          <MathFormulaStatic latex="=" />
          <MathFormulaTerm latex="3" tooltip="较小步长使参数向最小值 x=0 靠近。" ariaLabel="更新后的 x 等于三" />
          <MathFormulaStatic latex="," />
          <MathFormulaTerm latex="J(3)=4.5\lt8" tooltip="更新后目标值小于更新前的 8。" ariaLabel="更新后的目标值四点五小于八" />
        </MathFormulaBlock>
        <Typography variant="bodySmall">若学习率改为 η=2.2，方向仍然是负梯度方向，但参数会越过最低点到达 −4.8，目标值反而增大到 11.52。</Typography>
        <MathFormulaBlock ariaLabel="学习率为二点二时，x 从四更新为负四点八，目标值从八上升到十一点五二">
          <MathFormulaTerm latex="x_{mathrm{new}}" tooltip="使用过大学习率得到的新参数。" ariaLabel="过大步长更新后的 x" />
          <MathFormulaStatic latex="=" />
          <MathFormulaTerm latex="4-2.2\times4" tooltip="更新方向没有错误，但移动距离过长。" ariaLabel="四减二点二乘四" />
          <MathFormulaStatic latex="=" />
          <MathFormulaTerm latex="-4.8" tooltip="参数越过最小值 x=0，并移动到离最小值更远的位置。" ariaLabel="更新后的 x 等于负四点八" />
          <MathFormulaStatic latex="," />
          <MathFormulaTerm latex="J(-4.8)=11.52\gt8" tooltip="更新后目标值大于更新前的 8，说明这一步失败。" ariaLabel="更新后的目标值十一点五二大于八" />
        </MathFormulaBlock>
      </section>
      <MathFormulaBlock ariaLabel="第 t 步学习率等于初始学习率乘衰减系数的 t 次方，其中衰减系数大于零且不超过一">
        <MathFormulaTerm latex="\eta_t" tooltip="第 t 次迭代实际使用的学习率。" ariaLabel="第 t 步学习率" tone="warm" />
        <MathFormulaStatic latex="=" />
        <MathFormulaTerm latex="\eta_0" tooltip="训练开始时设置的初始学习率。" ariaLabel="初始学习率" tone="warm" />
        <MathFormulaTerm latex="\gamma^t" tooltip="每次迭代把学习率乘以衰减系数 γ；t 次迭代后累计为 γ 的 t 次方。" ariaLabel="衰减系数 gamma 的 t 次方" />
        <MathFormulaStatic latex="," />
        <MathFormulaTerm latex="0<\gamma\le1" tooltip="γ=1 表示保持固定学习率；0<γ<1 表示学习率随迭代指数衰减。" ariaLabel="衰减系数大于零且不超过一" />
      </MathFormulaBlock>
      <Typography variant="bodySmall">常见调度还包括在指定节点降低学习率的分段常数策略，以及随迭代按幂次减小的多项式策略。调度形式本身不保证收敛；它必须与目标的光滑性、梯度噪声和训练预算共同考虑。</Typography>
      <MathFormulaBlock ariaLabel="常见学习率调度包括分段常数、指数衰减和多项式衰减">
        <MathFormulaTerm latex="\eta(t)=\eta_i\quad(t_i\le t<t_{i+1})" tooltip="分段常数：在一段迭代区间内保持学习率不变，到预定节点再降低。" ariaLabel="分段常数学习率" tone="warm" />
        <MathFormulaStatic latex="," />
        <MathFormulaTerm latex="\eta(t)=\eta_0e^{-\lambda t}" tooltip="指数衰减：学习率按固定指数速度减小；λ 控制衰减快慢。" ariaLabel="指数衰减学习率" tone="warm" />
        <MathFormulaStatic latex="," />
        <MathFormulaTerm latex="\eta(t)=\eta_0(\beta t+1)^{-\alpha}" tooltip="多项式衰减：学习率按幂函数减小，α 与 β 决定曲线形状。" ariaLabel="多项式衰减学习率" tone="warm" />
      </MathFormulaBlock>
      <Typography variant="bodySmall" tone="muted">学习率下降过快会让参数在到达合适区域前几乎停止；下降过慢则可能使随机梯度噪声长期主导更新。深度网络通常只能在给定假设和训练配置下讨论收敛，不能由某一种调度公式无条件保证。</Typography>
    </section>
  );
}
