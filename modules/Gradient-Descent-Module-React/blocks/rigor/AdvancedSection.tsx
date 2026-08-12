import { MathFormulaBlock, MathFormulaStatic, MathFormulaTerm } from '../../../shared/react/learning/MathFormulaBlock';
import { Typography } from '../../../shared/react/typography/Typography';

export function AdvancedSection() {
  return (
    <section className="gd-react-rigor-note" aria-labelledby="gd-advanced-title">
      <div className="gd-react-rigor-heading">
        <Typography as="h3" variant="h3" tone="accent" id="gd-advanced-title">
          延伸拓展
        </Typography>
        <Typography variant="bodySmall">
          以下内容供课堂延伸讲解或课后阅读。每个主题默认折叠，点击标题展开。
        </Typography>
      </div>

      {/* 凸性与收敛 */}
      <details className="gd-react-advanced-details">
        <summary>
          <Typography as="h4" variant="bodySmall" tone="accent">
            凸性：什么时候梯度下降保证找到全局最优
          </Typography>
        </summary>
        <div className="gd-react-advanced-body">
          <Typography variant="bodySmall">
            如果目标函数 J(θ) 关于参数 θ 是<strong>凸函数</strong>，则任意局部极小值都是全局极小值——梯度下降只要找到梯度为零的点，就保证找到了最优解。凸性由 Jensen 不等式定义：
          </Typography>
          <MathFormulaBlock ariaLabel="凸函数满足琴生不等式：函数在两点连线上的值不大于函数值的线性插值">
            <MathFormulaTerm latex="J(\alpha\theta_1+(1-\alpha)\theta_2)" tooltip="参数在 θ₁ 和 θ₂ 的凸组合处的目标值。" ariaLabel="参数凸组合处的目标值" />
            <MathFormulaStatic latex="\le" />
            <MathFormulaTerm latex="\alpha J(\theta_1)+(1-\alpha)J(\theta_2)" tooltip="目标值在相同权重下的线性插值。" ariaLabel="目标值的线性组合" />
            <MathFormulaStatic latex="," />
            <MathFormulaTerm latex="\forall\alpha\in[0,1]" tooltip="对所有在 0 到 1 之间的 α 和参数空间中任意两点都成立。" ariaLabel="对所有 alpha 在零一区间" />
          </MathFormulaBlock>

          <Typography variant="bodySmall">
            MSE 损失关于线性模型参数是凸的，这也是最小二乘法存在闭式解的根本原因。但深度网络引入非线性激活后，目标函数变为<strong>非凸</strong>——梯度为零只能说明到达了<strong>驻点</strong>，该点可能是全局极小、局部极小、鞍点或平坦区域。
          </Typography>

          <div className="gd-react-prose-sequence">
            <Typography variant="bodySmall">
              <strong>凸目标上的 GD 收敛速率：</strong>若 J 是凸函数且梯度 Lipschitz 连续（\|∇J(θ₁)−∇J(θ₂)\| ≤ L\|θ₁−θ₂\|），固定学习率 η ≤ 1/L 时，梯度下降经过 T 步后满足：
            </Typography>
          </div>

          <MathFormulaBlock ariaLabel="凸目标上梯度下降的收敛速率：J 在 T 步平均参数处的值与最优值之差不超过初始距离的平方除以 2 倍学习率乘 T">
            <MathFormulaTerm latex="J(\bar{\boldsymbol\theta}_T)-J(\boldsymbol\theta^*)" tooltip="T 步平均参数处的次优性。" ariaLabel="平均参数的次优性" />
            <MathFormulaStatic latex="\le" />
            <MathFormulaTerm latex="\frac{\|\boldsymbol\theta_0-\boldsymbol\theta^*\|^2}{2\eta T}" tooltip="次优性以 O(1/T) 速率收敛；初始距离越大或学习率越小，需要更多步数。" ariaLabel="初始距离平方除以 2 eta T" />
            <MathFormulaStatic latex="=" />
            <MathFormulaTerm latex="\mathcal O\!\left(\frac{1}{T}\right)" tooltip="大 O 记号表示次优性按 1/T 的速率减小到零。" ariaLabel="大 O 一除以 T" />
          </MathFormulaBlock>

          <Typography variant="bodySmall">
            强凸假设下可进一步加速到 O(γᵀ) 的线性收敛。但这些保证依赖凸性假设——深度网络不满足，因此不能从理论上保证 SGD 找到全局最优。实践中，SGD 的随机噪声、大型网络的过度参数化和现代初始化技术共同使得「足够好的局部极小」通常不难到达。
          </Typography>
        </div>
      </details>

      {/* SGD 收敛性 */}
      <details className="gd-react-advanced-details">
        <summary>
          <Typography as="h4" variant="bodySmall" tone="accent">
            SGD 的收敛性：为什么学习率必须衰减
          </Typography>
        </summary>
        <div className="gd-react-advanced-body">
          <Typography variant="bodySmall">
            随机梯度 gₜ 是完整梯度 ∇J 的无偏估计（E[gₜ] = ∇J），但每次只用一个或一小批样本，会引入随机波动。即使到了最优点附近，单次随机梯度仍可能非零——因此<strong>固定学习率的 SGD 无法收敛到精确最优</strong>，只能在最优解周围的一个球内震荡。
          </Typography>

          <Typography variant="bodySmall">
            在凸目标且随机梯度范数有界的假设下，取衰减学习率 ηₜ = r/(L√T)，SGD 经过 T 步后的期望次优性满足：
          </Typography>

          <MathFormulaBlock ariaLabel="凸目标上 SGD 的收敛速率：期望次优性不超过 r 乘 L 除以根号 T，即大 O 一除以根号 T">
            <MathFormulaTerm latex="\mathbb E[J(\bar{\boldsymbol\theta}_T)]-J(\boldsymbol\theta^*)" tooltip="T 步平均参数处的期望次优性。" ariaLabel="期望次优性" />
            <MathFormulaStatic latex="\le" />
            <MathFormulaTerm latex="\frac{rL}{\sqrt{T}}" tooltip="r 是初始距离、L 是梯度范数上界；分母 √T 意味着精确度每提升 10 倍需要 100 倍的迭代数。" ariaLabel="r L 除以根号 T" />
            <MathFormulaStatic latex="=" />
            <MathFormulaTerm latex="\mathcal O\!\left(\frac{1}{\sqrt{T}}\right)" tooltip="SGD 的次优性按 1/√T 速率减小，显著慢于全批量 GD 的 O(1/T)。" ariaLabel="大 O 一除以根号 T" />
          </MathFormulaBlock>

          <Typography variant="bodySmall">
            这个 O(1/√T) 速率解释了工程中的两条经验法则：① 学习率必须随训练推进而衰减（否则无法收敛）；② 衰减太快会导致过早停滞，衰减太慢会导致长期震荡。多项式衰减（ηₜ ∝ 1/√t）在凸问题中匹配理论最优速率。
          </Typography>

          <Typography variant="bodySmall" tone="muted">
            以上分析依赖凸性和梯度有界等强假设。深度网络的非凸性质使得这些结论不能直接应用，但它们为理解 SGD 的行为提供了重要的定性框架。
          </Typography>
        </div>
      </details>

      {/* Adam 桥接 */}
      <details className="gd-react-advanced-details">
        <summary>
          <Typography as="h4" variant="bodySmall" tone="accent">
            从 SGD 到 Adam：优化器的演化主线
          </Typography>
        </summary>
        <div className="gd-react-advanced-body">
          <Typography variant="bodySmall">
            本模块和 Loss Guide 模块覆盖了深度学习优化器的核心演化路径。完整的技术栈可以这样理解：
          </Typography>

          <div className="gd-react-reference-table" role="table" aria-label="优化器演化主线">
            <div className="gd-react-reference-row gd-react-reference-row--header" role="rowheader">
              <span>阶段</span>
              <span>解决的问题</span>
              <span>核心机制</span>
              <span>所处模块</span>
            </div>
            <div className="gd-react-reference-row" role="row">
              <span>梯度下降</span>
              <span>如何找到使损失下降的方向</span>
              <span>θ ← θ − η∇J</span>
              <span>本模块</span>
            </div>
            <div className="gd-react-reference-row" role="row">
              <span>小批量 SGD</span>
              <span>大数据集上每步计算代价太高</span>
              <span>用子样本梯度估计完整梯度</span>
              <span>本模块</span>
            </div>
            <div className="gd-react-reference-row" role="row">
              <span>动量法</span>
              <span>震荡和病态条件下的缓慢前进</span>
              <span>v ← βv + g，θ ← θ − ηv</span>
              <span>本模块</span>
            </div>
            <div className="gd-react-reference-row" role="row">
              <span>AdaGrad</span>
              <span>不同参数需要不同学习率</span>
              <span>按历史平方梯度缩放逐参数学习率</span>
              <span>自适应学习率模块</span>
            </div>
            <div className="gd-react-reference-row" role="row">
              <span>RMSProp</span>
              <span>AdaGrad 学习率衰减过度</span>
              <span>指数移动平均替代累加平方梯度</span>
              <span>自适应学习率模块</span>
            </div>
            <div className="gd-react-reference-row" role="row">
              <span>Adam</span>
              <span>需要同时解决方向和尺度问题</span>
              <span>动量（一阶矩）+ RMSProp（二阶矩）+ 偏差修正</span>
              <span>自适应学习率模块</span>
            </div>
          </div>

          <Typography variant="bodySmall">
            理解这条演化主线后，Adam 不再是一个「神秘的黑箱」——它的每个组件都是从具体问题出发的合理设计。完成本模块后，建议继续学习「从 SGD 到自适应学习率」模块，那里会用交互方式展示 AdaGrad 和 Adam 在相同问题上的行为差异。
          </Typography>
        </div>
      </details>

      {/* Nesterov */}
      <details className="gd-react-advanced-details">
        <summary>
          <Typography as="h4" variant="bodySmall" tone="accent">
            Nesterov 加速梯度：「先看一眼前方再迈步」
          </Typography>
        </summary>
        <div className="gd-react-advanced-body">
          <Typography variant="bodySmall">
            标准动量法在<strong>当前位置</strong>计算梯度，再与历史速度混合。Nesterov 加速梯度（NAG）换了一个顺序：先沿当前速度方向「预演」一步，在那一步的位置计算梯度，再用这个「前瞻梯度」更新。
          </Typography>

          <MathFormulaBlock ariaLabel="Nesterov 更新：先沿速度方向预演得到前瞻位置，在前瞻位置计算梯度，再更新速度和参数">
            <MathFormulaTerm latex="\tilde{\boldsymbol\theta}" tooltip="前瞻位置：先沿当前速度方向移动一步得到的临时参数。" ariaLabel="前瞻位置" />
            <MathFormulaStatic latex="=" />
            <MathFormulaTerm latex="\boldsymbol\theta_t+\beta\boldsymbol v_{t-1}" tooltip="在当前参数上叠加历史速度的 β 倍，预演下一步的大致位置。" ariaLabel="theta t 加 beta 乘 v t 减 1" />
            <MathFormulaStatic latex="," />
            <MathFormulaTerm latex="\boldsymbol v_t" tooltip="在前瞻位置计算梯度后，再与历史速度混合得到新速度。" ariaLabel="新速度" />
            <MathFormulaStatic latex="=" />
            <MathFormulaTerm latex="\beta\boldsymbol v_{t-1}+\eta\nabla J(\tilde{\boldsymbol\theta})" tooltip="速度更新使用前瞻位置的梯度，而非当前位置的梯度。" ariaLabel="beta 乘 v t 减 1 加 eta 乘前瞻位置梯度" />
          </MathFormulaBlock>

          <Typography variant="bodySmall">
            直觉上：标准动量相当于一个盲人顺着惯性往下走，边走边感知坡度；Nesterov 相当于「先顺着惯性迈一步，停下来感受坡度，再调整」。当速度方向与真实梯度方向不完全一致时，前瞻能够提前修正。
          </Typography>

          <Typography variant="bodySmall" tone="muted">
            在凸目标上，Nesterov 方法有理论上的最优收敛速率 O(1/T²)（对比标准 GD 的 O(1/T)）。但深度网络的非凸性质削弱了这一优势，实践中 NAG 与标准动量的差异通常不大。主流框架中 NAG 作为 SGD 的一个可选参数（momentum + nesterov=True）提供。
          </Typography>
        </div>
      </details>

      {/* Warmup */}
      <details className="gd-react-advanced-details">
        <summary>
          <Typography as="h4" variant="bodySmall" tone="accent">
            学习率 Warmup：给训练一个「热身期」
          </Typography>
        </summary>
        <div className="gd-react-advanced-body">
          <Typography variant="bodySmall">
            在训练的最初几千步中，参数离最优解很远，梯度的方向和尺度都不太可靠。此时直接使用完整的初始学习率可能导致参数跳到极差的位置，后面很难恢复。<strong>Warmup</strong> 策略让学习率从接近零开始，逐步线性（或余弦）增加到目标值，给优化器一个探索和适应的阶段。
          </Typography>

          <MathFormulaBlock ariaLabel="线性 warmup：在前 W 步中学习率从 eta 0 除以 W 线性增长到 eta 0">
            <MathFormulaTerm latex="\eta_t" tooltip="第 t 步实际使用的学习率。" ariaLabel="第 t 步学习率" tone="warm" />
            <MathFormulaStatic latex="=" />
            <MathFormulaTerm latex="\frac{t}{W}\,\eta_0" tooltip="前 W 步线性递增；第 W 步及之后按常规调度继续。" ariaLabel="t 除以 W 乘初始学习率" />
            <MathFormulaStatic latex="," />
            <MathFormulaTerm latex="t=1,\ldots,W" tooltip="W 为 warmup 步数，通常取几千步。" ariaLabel="t 从 1 到 W" />
          </MathFormulaBlock>

          <Typography variant="bodySmall">
            现代训练管线（尤其是 Transformer 架构）几乎标配 warmup。典型设置：W = 4000 步，之后切换到余弦衰减或线性衰减。warmup 与梯度裁剪互为补充——前者从步长角度保护初期训练，后者从梯度范数角度防止单步异常。
          </Typography>

          <Typography variant="bodySmall" tone="muted">
            warmup 的理论解释仍在活跃研究中：一种观点认为初期的大梯度方差使自适应优化器的二阶矩估计不可靠，warmup 给二阶矩足够的时间累积到有意义的尺度。
          </Typography>
        </div>
      </details>
    </section>
  );
}
