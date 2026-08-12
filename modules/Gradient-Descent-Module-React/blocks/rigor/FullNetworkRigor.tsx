import { MathFormulaBlock, MathFormulaStatic, MathFormulaTerm } from '../../../shared/react/learning/MathFormulaBlock';
import { Typography } from '../../../shared/react/typography/Typography';

export function NetworkObjectiveSection() {
  return (
    <section className="gd-react-rigor-note" aria-labelledby="gd-network-objective-title">
      <Typography as="h3" variant="h3" tone="accent" id="gd-network-objective-title">从一个样本推广到真实训练目标</Typography>
      <Typography variant="bodySmall">本页用一个输入与一个 GT 展示完整更新。真实训练通常先把 m 个训练样本的损失取平均，得到经验风险 J(θ)；其中 θ 统一表示网络中全部可学习参数。</Typography>
      <Typography variant="bodySmall">每个训练样本由输入 xᵢ 与目标 yᵢ 组成。单样本梯度只反映这一对数据建议的修正方向，可能偏离整个训练集的平均方向。实践中主要有三种取样和更新方式：</Typography>
      <dl className="gd-react-definition-list" aria-label="批量、随机和小批量梯度下降对比">
        <div>
          <Typography as="dt" variant="bodySmall" tone="accent">批量梯度下降</Typography>
          <Typography as="dd" variant="bodySmall">每次更新都使用整个训练集计算经验风险的准确梯度。方向确定，但当训练集很大时，一次更新的计算和存储代价较高。</Typography>
        </div>
        <div>
          <Typography as="dt" variant="bodySmall" tone="accent">随机梯度下降</Typography>
          <Typography as="dd" variant="bodySmall">每次随机抽取一个训练样本，用该样本的梯度估计训练集梯度并更新参数。单次计算成本低，但梯度估计的波动通常较大。</Typography>
        </div>
        <div>
          <Typography as="dt" variant="bodySmall" tone="accent">小批量梯度下降</Typography>
          <Typography as="dd" variant="bodySmall">每次使用随机抽取的一小批样本的平均梯度更新参数，是深度学习中最常见的训练方式。批量大小在梯度估计噪声、计算吞吐和显存占用之间形成权衡。</Typography>
        </div>
      </dl>
      <Typography variant="bodySmall">若小批量从训练集均匀随机抽取，它的平均梯度是完整梯度的无偏估计：单次结果会波动，但长期不会系统性偏向错误方向。增大批量通常能降低波动并提高并行计算效率，同时也会增加计算量和显存占用。一次小批量更新称为一次<strong>迭代</strong>；完整遍历一遍训练数据称为一个 <strong>epoch</strong>，一个 epoch 往往包含多次迭代。</Typography>
      <MathFormulaBlock ariaLabel="经验风险 J theta 等于 m 个样本损失的平均值，最优参数 theta star 是使 J 最小的参数">
        <MathFormulaTerm latex="J(\boldsymbol\theta)" tooltip="J(θ)：参数为 θ 时训练集上的经验风险。" ariaLabel="参数 theta 的经验风险" />
        <MathFormulaStatic latex="=" />
        <MathFormulaTerm latex="\frac{1}{m}\sum_{i=1}^{m}" tooltip="对 m 个训练样本的损失求平均。" ariaLabel="m 个样本的平均" />
        <MathFormulaTerm latex="\ell\!\left(y_i,f_{\boldsymbol\theta}(x_i)\right)" tooltip="第 i 个样本的真实标签与模型预测之间的损失。" ariaLabel="第 i 个样本的损失" />
        <MathFormulaStatic latex="," />
        <MathFormulaTerm latex="\boldsymbol\theta^{*}" tooltip="θ*：使训练目标最小的一组参数候选。" ariaLabel="最优参数 theta star" />
        <MathFormulaStatic latex="=" />
        <MathFormulaTerm latex="\underset{\boldsymbol\theta}{\operatorname{arg\,min}}" tooltip="arg min：在候选参数中寻找使后面目标函数最小的一组。" ariaLabel="对 theta 寻找最小目标值" />
        <MathFormulaTerm latex="J(\boldsymbol\theta)" tooltip="需要被最小化的经验风险。" ariaLabel="经验风险 J theta" />
      </MathFormulaBlock>
      <Typography variant="bodySmall">深度学习常从训练集中抽取小批量 Bₜ，用批内平均梯度近似整个训练集的梯度，再同时更新所有参数。本页相当于批量大小为 1 的教学示例。</Typography>
      <MathFormulaBlock ariaLabel="第 t 步的小批量梯度 g t 等于批内样本梯度的平均值，下一步参数等于当前参数减学习率乘 g t">
        <MathFormulaTerm latex="\boldsymbol g_t" tooltip="gₜ：第 t 次迭代使用的小批量平均梯度。" ariaLabel="第 t 步小批量梯度" />
        <MathFormulaStatic latex="=" />
        <MathFormulaTerm latex="\frac{1}{|\mathcal B_t|}\sum_{i\in\mathcal B_t}" tooltip="对当前小批量 Bₜ 中的样本梯度求平均。" ariaLabel="当前小批量的样本平均" />
        <MathFormulaTerm latex="\nabla_{\boldsymbol\theta}\ell_i\!\left(\boldsymbol\theta^{(t)}\right)" tooltip="第 i 个样本的损失关于全部参数的梯度。" ariaLabel="单样本损失的参数梯度" />
        <MathFormulaStatic latex="," />
        <MathFormulaTerm latex="\boldsymbol\theta^{(t+1)}" tooltip="本次更新后得到的新参数向量。" ariaLabel="下一步参数向量" />
        <MathFormulaStatic latex="=" />
        <MathFormulaTerm latex="\boldsymbol\theta^{(t)}" tooltip="本次更新开始时的旧参数向量。" ariaLabel="当前参数向量" />
        <MathFormulaStatic latex="-" />
        <MathFormulaTerm latex="\eta_t" tooltip="ηₜ：当前迭代使用的学习率。" ariaLabel="第 t 步学习率" tone="warm" />
        <MathFormulaTerm latex="\boldsymbol g_t" tooltip="当前小批量计算得到的平均梯度。" ariaLabel="第 t 步小批量梯度" />
      </MathFormulaBlock>
      <Typography variant="bodySmall">在近似独立抽样、单样本梯度方差有限的条件下，批内平均不会改变梯度期望；若批量含 b 个样本，其估计标准差大致按 b 的平方根倒数缩小。这说明增大批量能降低噪声，但不能让收益与计算成本同比增长。</Typography>
      <MathFormulaBlock ariaLabel="小批量梯度的期望等于完整训练集梯度，批量为 b 时标准差近似按 b 的负二分之一次方缩小">
        <MathFormulaTerm latex="\mathbb E[\boldsymbol g_t]" tooltip="对随机抽取的小批量取期望后得到的平均更新方向。" ariaLabel="小批量梯度的期望" />
        <MathFormulaStatic latex="=" />
        <MathFormulaTerm latex="\nabla J(\boldsymbol\theta^{(t)})" tooltip="当前参数处由完整训练集定义的经验风险梯度。" ariaLabel="完整训练集目标的梯度" />
        <MathFormulaStatic latex="," />
        <MathFormulaTerm latex="\operatorname{SD}(\boldsymbol g_t)" tooltip="小批量梯度估计围绕其期望的典型波动尺度。" ariaLabel="小批量梯度的标准差" />
        <MathFormulaStatic latex="\propto" />
        <MathFormulaTerm latex="b^{-1/2}" tooltip="在近似独立同分布条件下，批量扩大到 b 个样本时，平均梯度标准差按 1/√b 缩小。" ariaLabel="批量大小 b 的负二分之一次方" />
      </MathFormulaBlock>
      <section className="gd-react-worked-example" aria-labelledby="gd-batch-example-title">
        <Typography as="h4" variant="bodySmall" tone="accent" id="gd-batch-example-title">小例子：小批量怎样在计算量和波动之间折中</Typography>
        <Typography variant="bodySmall">假设当前参数下，4 个训练样本给出的单样本梯度分别为 2、4、6、8。完整训练集梯度是它们的平均值 5。</Typography>
        <MathFormulaBlock ariaLabel="四个单样本梯度为二四六八，完整训练集平均梯度等于五">
          <MathFormulaTerm latex="[g_1,g_2,g_3,g_4]" tooltip="4 个样本分别给出的单样本梯度。" ariaLabel="四个单样本梯度" />
          <MathFormulaStatic latex="=" />
          <MathFormulaTerm latex="[2,4,6,8]" tooltip="用一维数值简化展示不同样本产生的梯度差异。" ariaLabel="二四六八组成的梯度列表" />
          <MathFormulaStatic latex="," />
          <MathFormulaTerm latex="\nabla J" tooltip="完整训练集上单样本梯度的平均值。" ariaLabel="完整训练集梯度" />
          <MathFormulaStatic latex="=" />
          <MathFormulaTerm latex="\frac{2+4+6+8}{4}" tooltip="使用全部 4 个样本计算平均梯度。" ariaLabel="四个梯度之和除以四" />
          <MathFormulaStatic latex="=" />
          <MathFormulaTerm latex="5" tooltip="完整训练集的平均更新方向。" ariaLabel="完整梯度等于五" />
        </MathFormulaBlock>
        <Typography variant="bodySmall">随机梯度下降一次只看到一个值，本次可能是 2，也可能是 8；批量大小为 2 时，例如抽到 [2,4] 得到平均梯度 3，抽到 [6,8] 得到 7。它们不一定等于 5，但比单样本结果更靠近完整平均值。</Typography>
        <MathFormulaBlock ariaLabel="两个示例小批量的平均梯度分别等于三和七">
          <MathFormulaTerm latex="g_{\{1,2\}}" tooltip="由第 1、2 个样本组成的小批量平均梯度。" ariaLabel="第一组小批量梯度" />
          <MathFormulaStatic latex="=" />
          <MathFormulaTerm latex="\frac{2+4}{2}=3" tooltip="这个小批量估计小于完整梯度 5。" ariaLabel="二和四的平均等于三" />
          <MathFormulaStatic latex="," />
          <MathFormulaTerm latex="g_{\{3,4\}}" tooltip="由第 3、4 个样本组成的小批量平均梯度。" ariaLabel="第二组小批量梯度" />
          <MathFormulaStatic latex="=" />
          <MathFormulaTerm latex="\frac{6+8}{2}=7" tooltip="这个小批量估计大于完整梯度 5。" ariaLabel="六和八的平均等于七" />
        </MathFormulaBlock>
        <Typography variant="bodySmall">若每次均匀随机抽取，许多次小批量估计的平均会回到完整梯度 5；单次更新仍有噪声，而这种噪声正是减少计算量所付出的代价。</Typography>
      </section>
      <Typography variant="bodySmall" tone="muted">实际训练样本并不总是独立同分布，重复样本、分层采样和数据相关性都会改变方差关系；因此上式是理解批量权衡的基准，不是对所有数据加载方式的无条件保证。</Typography>
    </section>
  );
}

export function BackpropagationSection() {
  return (
    <section className="gd-react-rigor-note" aria-labelledby="gd-backprop-title">
      <Typography as="h3" variant="h3" tone="accent" id="gd-backprop-title">反向传播负责求梯度，梯度下降负责更新参数</Typography>
      <Typography variant="bodySmall">反向传播沿计算图反向应用链式法则，计算每个参数对 Loss 的影响。例如，w₁₁ 通过隐藏量 h₁ 再影响输出 y，因此其梯度由路径上的局部导数相乘得到。</Typography>
      <Typography variant="bodySmall">可以把一次训练理解为一条连续流水线：</Typography>
      <ol className="gd-react-process-list">
        <Typography as="li" variant="bodySmall"><strong>前向传播：</strong>按照网络连接方向，用输入和当前参数逐层计算隐藏表示、预测与 Loss，同时保存反向求导需要的中间变量。</Typography>
        <Typography as="li" variant="bodySmall"><strong>建立依赖：</strong>计算图用节点表示变量或运算、用有向边表示依赖关系，明确每个参数通过哪些路径影响最终 Loss。</Typography>
        <Typography as="li" variant="bodySmall"><strong>反向传播：</strong>从 Loss 出发，沿计算图反方向复用链式法则，累积得到损失关于每个参数的梯度。</Typography>
        <Typography as="li" variant="bodySmall"><strong>参数更新：</strong>优化器接收梯度和学习率，同时生成下一组参数。反向传播只负责求导，本身不决定更新步长。</Typography>
      </ol>
      <Typography variant="bodySmall">从一个最终目标出发，让梯度穿过整个可微网络并联合更新所有参数，就是<strong>端到端训练</strong>。因为反向阶段需要复用前向激活和局部导数，训练通常比只做预测占用更多内存；预测只执行前向传播，不需要保存完整的反向状态。</Typography>
      <Typography variant="bodySmall">若一个中间变量通过多条路径影响最终 Loss，反向传播需要把各条路径贡献相加；若变量是向量或张量，还必须遵守相应的形状、转置和逐元素乘法规则。因此标量链式法则给出直觉，实际网络则由自动微分系统完成张量级累积。</Typography>
      <Typography variant="bodySmall">一轮更新应先在同一组旧参数上计算全部梯度，再同时生成新参数；不能更新一个权重后立刻用它计算另一个权重的本轮梯度，否则实现的就不再是上式所描述的同一步更新。</Typography>
      <ul className="gd-react-rigor-list">
        <Typography as="li" variant="bodySmall">梯度接近 0 只说明到达驻点；对非凸神经网络，它不保证是全局最小点，也可能对应鞍点或平坦区域。</Typography>
        <Typography as="li" variant="bodySmall">训练 Loss 足够低表示优化目标被较好地降低，但模型能否在新样本上表现良好仍需验证集或测试集评估。</Typography>
      </ul>
      <MathFormulaBlock ariaLabel="L 对 w11 的偏导等于 L 对 y 的偏导乘 y 对 h1 的偏导乘 h1 对 w11 的偏导">
        <MathFormulaTerm latex="\frac{\partial L}{\partial w_{11}}" tooltip="损失关于第一层权重 w₁₁ 的偏导数。" ariaLabel="损失对权重 w11 的偏导" />
        <MathFormulaStatic latex="=" />
        <MathFormulaTerm latex="\frac{\partial L}{\partial y}" tooltip="损失关于最终预测 y 的局部变化率。" ariaLabel="损失对预测值的偏导" />
        <MathFormulaTerm latex="\frac{\partial y}{\partial h_1}" tooltip="最终预测关于隐藏量 h₁ 的局部变化率。" ariaLabel="预测值对隐藏量 h1 的偏导" />
        <MathFormulaTerm latex="\frac{\partial h_1}{\partial w_{11}}" tooltip="隐藏量 h₁ 关于权重 w₁₁ 的局部变化率。" ariaLabel="隐藏量 h1 对权重 w11 的偏导" />
      </MathFormulaBlock>
      <section className="gd-react-worked-example" aria-labelledby="gd-backprop-example-title">
        <Typography as="h4" variant="bodySmall" tone="accent" id="gd-backprop-example-title">小例子：沿一条计算路径完成前向、反向和更新</Typography>
        <Typography variant="bodySmall">设一个最简单的标量模型 ŷ=wx，输入 x=3、权重 w=2、真实目标 y=5，并采用绝对误差。前向传播先得到预测 6 和 Loss 1。</Typography>
        <MathFormulaBlock ariaLabel="输入三乘权重二得到预测六，预测六与目标五的绝对误差等于一">
          <MathFormulaTerm latex="\hat y" tooltip="标量模型给出的预测值。" ariaLabel="模型预测值" />
          <MathFormulaStatic latex="=" />
          <MathFormulaTerm latex="wx" tooltip="权重与输入的乘积。" ariaLabel="权重乘输入" />
          <MathFormulaStatic latex="=" />
          <MathFormulaTerm latex="2\times3=6" tooltip="代入当前权重 2 和输入 3 完成前向计算。" ariaLabel="二乘三等于六" />
          <MathFormulaStatic latex="," />
          <MathFormulaTerm latex="L" tooltip="当前样本的绝对误差。" ariaLabel="当前损失" />
          <MathFormulaStatic latex="=" />
          <MathFormulaTerm latex="|6-5|=1" tooltip="预测高于目标 1，因此绝对误差为 1。" ariaLabel="六减五的绝对值等于一" />
        </MathFormulaBlock>
        <Typography variant="bodySmall">因为当前预测高于目标，∂L/∂ŷ=1；又因为 ∂ŷ/∂w=x=3，所以链式法则得到 ∂L/∂w=3。</Typography>
        <MathFormulaBlock ariaLabel="损失对权重的偏导等于损失对预测的偏导一乘预测对权重的偏导三，结果等于三">
          <MathFormulaTerm latex="\frac{\partial L}{\partial w}" tooltip="反向传播最终需要得到的权重梯度。" ariaLabel="损失对权重的偏导" />
          <MathFormulaStatic latex="=" />
          <MathFormulaTerm latex="\frac{\partial L}{\partial\hat y}" tooltip="当前残差为正，所以绝对误差对预测的偏导为 1。" ariaLabel="损失对预测的偏导" />
          <MathFormulaTerm latex="\frac{\partial\hat y}{\partial w}" tooltip="ŷ=wx 对 w 求导得到输入 x=3。" ariaLabel="预测对权重的偏导" />
          <MathFormulaStatic latex="=" />
          <MathFormulaTerm latex="1\times3=3" tooltip="沿计算路径相乘得到权重梯度 3。" ariaLabel="一乘三等于三" />
        </MathFormulaBlock>
        <Typography variant="bodySmall">若学习率 η=0.1，优化器把权重从 2 更新为 1.7。再次前向计算得到预测 5.1，Loss 从 1 降到 0.1。</Typography>
        <MathFormulaBlock ariaLabel="权重二减零点一乘梯度三得到新权重一点七，新预测为五点一，新损失为零点一">
          <MathFormulaTerm latex="w_{\mathrm{new}}" tooltip="优化器执行一次梯度下降后得到的新权重。" ariaLabel="更新后的权重" />
          <MathFormulaStatic latex="=" />
          <MathFormulaTerm latex="2-0.1\times3=1.7" tooltip="旧权重减去学习率乘权重梯度。" ariaLabel="二减零点一乘三等于一点七" />
          <MathFormulaStatic latex="," />
          <MathFormulaTerm latex="\hat y_{\mathrm{new}}=1.7\times3=5.1" tooltip="使用新权重重新执行前向传播。" ariaLabel="新预测等于五点一" />
          <MathFormulaStatic latex="," />
          <MathFormulaTerm latex="L_{\mathrm{new}}=|5.1-5|=0.1" tooltip="新预测更接近目标，因此绝对误差下降。" ariaLabel="新损失等于零点一" />
        </MathFormulaBlock>
      </section>
      <Typography variant="bodySmall" tone="muted">反向传播不负责选择学习率，也不直接修改参数；它只高效计算梯度。优化器接收这些梯度后，才依据更新规则生成下一组参数。</Typography>
    </section>
  );
}
