import {
  MathFormulaBlock,
  MathFormulaStatic,
  MathFormulaTerm,
} from '../../../shared/react/learning/MathFormulaBlock';
import { Typography } from '../../../shared/react/typography/Typography';

export function AdvancedSection() {
  return (
    <section className="lg-react-rigor-note" aria-labelledby="lg-advanced-title">
      <div className="lg-react-rigor-heading">
        <Typography as="h3" variant="h3" tone="accent" id="lg-advanced-title">
          延伸拓展
        </Typography>
        <Typography variant="bodySmall">
          以下内容供教师延伸讲解或学生课后阅读，不纳入本模块必须掌握的范围。每个主题默认折叠，点击标题展开。
        </Typography>
      </div>

      {/* 1. 正则化 */}
      <details className="lg-react-advanced-details">
        <summary>
          <Typography as="h4" variant="bodySmall" tone="accent">
            从经验风险到结构风险：正则化
          </Typography>
        </summary>
        <div className="lg-react-advanced-body">
          <Typography variant="bodySmall">
            此前我们最小化的是<strong>经验风险</strong> J(θ)——训练集上的平均损失。但训练集只是从真实分布中采样的一小部分，在训练集上做到 J(θ)=0 并不保证在新数据上表现好（过拟合）。<strong>结构风险最小化</strong>在经验风险上增加一个惩罚项，约束模型复杂度：
          </Typography>
          <MathFormulaBlock ariaLabel="结构风险等于经验风险加正则化系数乘正则化项">
            <MathFormulaTerm latex="J_{\mathrm{reg}}(\theta)" tooltip="J_reg：结构风险，训练时实际被最小化的目标。" ariaLabel="结构风险" />
            <MathFormulaStatic latex="=" />
            <MathFormulaTerm latex="\underbrace{\frac{1}{m}\sum_{i=1}^{m}\ell(y_i,f_{\theta}(x_i))}_{\text{经验风险}}" tooltip="经验风险：模型在训练集上的平均损失。" ariaLabel="经验风险项" />
            <MathFormulaStatic latex="+" />
            <MathFormulaTerm latex="\lambda\,\underbrace{R(\theta)}_{\text{正则化项}}" tooltip="λ：正则化强度（超参数）；R(θ)：衡量模型复杂度的惩罚项。" ariaLabel="正则化系数乘正则化项" />
          </MathFormulaBlock>
          <div className="lg-react-prose-sequence">
            <Typography variant="bodySmall">
              <strong>L2 正则化（权重衰减）：</strong>R(θ) = ‖θ‖₂² = Σ θⱼ²。它鼓励权重接近零但不为零，相当于假设参数服从高斯先验。梯度下降时多出一项 −2λθⱼ，每一步都把权重向原点拉回一点。
            </Typography>
            <Typography variant="bodySmall">
              <strong>L1 正则化：</strong>R(θ) = ‖θ‖₁ = Σ |θⱼ|。它鼓励权重<strong>恰好为零</strong>（稀疏性），相当于假设参数服从拉普拉斯先验。梯度中多出一项 −λ·sign(θⱼ)，像一个恒定的推力把无关权重推过零。
            </Typography>
          </div>
          <MathFormulaBlock ariaLabel="L2 正则化梯度更新时权重的衰减，L1 正则化梯度更新时权重的稀疏化">
            <MathFormulaTerm latex="\theta_j\leftarrow\theta_j-\eta\frac{\partial\ell}{\partial\theta_j}" tooltip="标准梯度下降更新。" ariaLabel="标准梯度下降更新" />
            <MathFormulaTerm latex="\underbrace{-\eta\lambda\theta_j}_{\text{L2 衰减}}" tooltip="L2 正则化附加项：每一步按比例缩小权重。" ariaLabel="L2 衰减项" />
            <MathFormulaStatic latex="," />
            <MathFormulaTerm latex="\underbrace{-\eta\lambda\operatorname{sign}(\theta_j)}_{\text{L1 稀疏化}}" tooltip="L1 正则化附加项：恒定大小的符号推力，驱向零。" ariaLabel="L1 稀疏化项" />
          </MathFormulaBlock>
          <Typography variant="bodySmall" tone="muted">
            正则化只应在训练时使用；评估和测试时应使用不含正则项的经验风险。λ 通常很小（如 1e-4），通过验证集选择。
          </Typography>
        </div>
      </details>

      {/* 2. Huber Loss */}
      <details className="lg-react-advanced-details">
        <summary>
          <Typography as="h4" variant="bodySmall" tone="accent">
            Huber Loss：L1 和 L2 的平滑折中
          </Typography>
        </summary>
        <div className="lg-react-advanced-body">
          <Typography variant="bodySmall">
            L2 对小残差光滑可导，但对离群点过于敏感（梯度随残差线性放大）；L1 对离群点稳健，但在 e=0 处不可导。Huber Loss 在残差较小时表现为平方误差（光滑），在残差较大时切换为线性误差（稳健）：
          </Typography>
          <MathFormulaBlock ariaLabel="Huber 损失分段定义：残差绝对值小于等于 delta 时取二分之一残差平方，大于 delta 时取 delta 乘绝对值减二分之一 delta 平方">
            <MathFormulaTerm latex="\ell_{\delta}^{\mathrm{Huber}}(e)" tooltip="以 δ 为切换阈值的 Huber 损失。" ariaLabel="Huber 损失" />
            <MathFormulaStatic latex="=" />
            <MathFormulaTerm
              latex="\begin{cases}\frac{1}{2}e^{2},&|e|\le\delta\\ \delta|e|-\frac{1}{2}\delta^{2},&|e|>\delta\end{cases}"
              tooltip="|e|≤δ 时退化为缩放平方误差；|e|>δ 时退化为线性误差，减轻离群点影响。两段在 |e|=δ 处函数值和一阶导数都连续。"
              ariaLabel="残差小于 delta 取平方，大于 delta 取线性"
            />
          </MathFormulaBlock>
          <Typography variant="bodySmall">
            超参数 δ 控制切换点：δ 越小，行为越接近 L1（对离群点更稳健）；δ 越大，行为越接近 L2（对小误差更精确）。δ=1 是常见默认值。Huber Loss 既保留了小残差区域的光滑梯度，又避免了大残差放大问题，常用于目标检测等需要同时处理噪声和离群点的回归任务。
          </Typography>
          <Typography variant="bodySmall" tone="muted">
            Huber Loss 也称为 Smooth L1 Loss（在目标检测文献中常见）。它处处可导，因此比纯 L1 更适合梯度优化。
          </Typography>
        </div>
      </details>

      {/* 3. Hinge Loss */}
      <details className="lg-react-advanced-details">
        <summary>
          <Typography as="h4" variant="bodySmall" tone="accent">
            Hinge Loss：最大间隔分类的损失
          </Typography>
        </summary>
        <div className="lg-react-advanced-body">
          <Typography variant="bodySmall">
            交叉熵鼓励模型输出"正确的概率尽可能大"；Hinge Loss 只关心是否达到足够的分类间隔，一旦分类正确且置信度超过阈值就不再施加惩罚：
          </Typography>
          <MathFormulaBlock ariaLabel="二分类 Hinge 损失等于 max 0 与 1 减真实标签乘预测值">
            <MathFormulaTerm latex="\ell_{\mathrm{Hinge}}" tooltip="二分类 Hinge 损失，SVM 的标准损失函数。" ariaLabel="Hinge 损失" />
            <MathFormulaStatic latex="=" />
            <MathFormulaTerm latex="\max(0,\,1-y\cdot f(x))" tooltip="y∈{−1,+1}：二分类标签；f(x)：模型原始输出。y·f(x)≥1 时损失为零，模型不再被强制继续提高置信度。" ariaLabel="max 零和一减 y 乘 f x" />
          </MathFormulaBlock>
          <div className="lg-react-prose-sequence">
            <Typography variant="bodySmall">
              与交叉熵的关键区别：交叉熵永远会为更大的正确概率给出更低的损失（即使已经预测正确）；Hinge Loss 一旦 y·f(x) ≥ 1 就不再产生损失，产生了<strong>稀疏解</strong>——只有位于分类边界附近的"支持向量"参与梯度更新。
            </Typography>
            <Typography variant="bodySmall">
              多分类 Hinge Loss（Crammer-Singer 形式）：ℓ = Σ_{'k≠k*'} max(0, 1 + f_k(x) − f_{'k*'}(x))，要求真实类别的得分比其他类别高出至少 1。
            </Typography>
          </div>
          <Typography variant="bodySmall" tone="muted">
            Hinge Loss 在零点不可导，现代实现通常使用次梯度或平滑近似（如平方 Hinge Loss）。实践中，交叉熵 + softmax 比 SVM/Hinge 更常用于深度学习分类，因为 CE 提供更好的概率校准。
          </Typography>
        </div>
      </details>

      {/* 4. 凸性 */}
      <details className="lg-react-advanced-details">
        <summary>
          <Typography as="h4" variant="bodySmall" tone="accent">
            凸性：为什么损失函数的形状很重要
          </Typography>
        </summary>
        <div className="lg-react-advanced-body">
          <Typography variant="bodySmall">
            如果目标函数 J(θ) 关于参数 θ 是<strong>凸函数</strong>，那么任何局部极小值都是全局极小值——梯度下降只要找到 J 不再下降的点，就保证找到了最优解。MSE 关于线性模型（如 y = wx + b）的参数是凸的，因此普通最小二乘法可以一步求得闭式解。
          </Typography>
          <Typography variant="bodySmall">
            但深度神经网络引入了非线性激活函数（如 ReLU、sigmoid），使 J(θ) 变成<strong>非凸函数</strong>——存在多个局部极小值、鞍点和平坦区域。梯度下降只能保证走到一个"梯度为零"的点，不能保证它是全局最优。
          </Typography>
          <MathFormulaBlock ariaLabel="凸函数满足琴生不等式：函数在两点连线上的值不大于函数值的线性插值">
            <MathFormulaTerm latex="J(\alpha\theta_1+(1-\alpha)\theta_2)" tooltip="参数在 θ₁ 和 θ₂ 的线性组合处。" ariaLabel="参数线性组合处的目标值" />
            <MathFormulaStatic latex="\le" />
            <MathFormulaTerm latex="\alpha J(\theta_1)+(1-\alpha)J(\theta_2)" tooltip="目标值在相同权重下的线性组合。" ariaLabel="目标值的线性组合" />
            <MathFormulaStatic latex="," />
            <MathFormulaTerm latex="\alpha\in[0,1]" tooltip="α 取 0 到 1 之间的任意值，不等式对所有这样的 α 和任意两点都成立。" ariaLabel="alpha 在零到一之间" />
          </MathFormulaBlock>
          <Typography variant="bodySmall">
            实践中，深度网络的非凸优化并不是灾难：SGD 的随机噪声有助于逃离鞍点；大型过参数化网络通常有大量几乎等价的优良解；好的初始化和归一化技术（如 BatchNorm）也能改善优化地形。
          </Typography>
          <Typography variant="bodySmall" tone="muted">
            凸性是充分条件而非必要条件——非凸问题在实践中仍可能被优化到很好的程度，但不能从数学上获得最优性保证。
          </Typography>
        </div>
      </details>

      {/* 5. 速查表 */}
      <details className="lg-react-advanced-details">
        <summary>
          <Typography as="h4" variant="bodySmall" tone="accent">
            损失函数选择速查表
          </Typography>
        </summary>
        <div className="lg-react-advanced-body">
          <div className="lg-react-reference-table" role="table" aria-label="损失函数选择速查表">
            <div className="lg-react-reference-row lg-react-reference-row--header" role="rowheader">
              <span>任务类型</span>
              <span>推荐损失</span>
              <span>核心原因</span>
            </div>
            <div className="lg-react-reference-row" role="row">
              <span>回归，无离群点</span>
              <span><strong>MSE</strong></span>
              <span>凸且光滑，梯度随误差缩放，高斯噪声假设下等价于 MLE</span>
            </div>
            <div className="lg-react-reference-row" role="row">
              <span>回归，有离群点</span>
              <span><strong>MAE</strong> 或 <strong>Huber</strong></span>
              <span>线性增长不过度放大离群点；Huber 在零点可导，训练更稳定</span>
            </div>
            <div className="lg-react-reference-row" role="row">
              <span>二分类</span>
              <span><strong>BCE</strong></span>
              <span>伯努利分布的 NLL 推导；梯度 p−y 不会饱和</span>
            </div>
            <div className="lg-react-reference-row" role="row">
              <span>多分类（互斥）</span>
              <span><strong>CE + Softmax</strong></span>
              <span>范畴分布的 NLL；梯度 p_k−y_k 简洁且无饱和</span>
            </div>
            <div className="lg-react-reference-row" role="row">
              <span>多标签分类</span>
              <span><strong>逐标签 BCE</strong></span>
              <span>每个标签视为独立二分类，输出逐元素 sigmoid 后计算 BCE 之和</span>
            </div>
            <div className="lg-react-reference-row" role="row">
              <span>最大间隔分类</span>
              <span><strong>Hinge</strong></span>
              <span>只关心支持向量；产生稀疏解；不适合需要概率输出的场景</span>
            </div>
            <div className="lg-react-reference-row" role="row">
              <span>回归 + 正则化</span>
              <span><strong>MSE + L2 正则</strong></span>
              <span>等价于参数的高斯先验下的 MAP 估计</span>
            </div>
          </div>
          <Typography variant="bodySmall" tone="muted">
            速查表给出的是常见默认选择。实际项目中应比较多个候选损失在验证集上的表现，并结合领域知识做出决定。
          </Typography>
        </div>
      </details>
    </section>
  );
}
