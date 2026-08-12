import { MathFormulaBlock, MathFormulaStatic, MathFormulaTerm } from '../../../shared/react/learning/MathFormulaBlock';
import { Typography } from '../../../shared/react/typography/Typography';

export function MomentumSection() {
  return (
    <section className="gd-react-rigor-note" aria-labelledby="gd-momentum-title">
      <Typography as="h3" variant="h3" tone="accent" id="gd-momentum-title">
        动量法：让梯度更新带上「惯性」
      </Typography>

      <div className="gd-react-prose-sequence">
        <Typography variant="bodySmall">
          标准梯度下降只看当前位置的梯度决定下一步方向。当目标函数的「地形」在一个方向上陡峭、另一个方向上平坦时（病态条件），参数会在陡峭方向上来回震荡，在平坦方向上几乎不动——就像在一条窄沟的两壁之间反复弹跳。
        </Typography>
        <Typography variant="bodySmall">
          动量法引入一个<strong>速度变量 v</strong>，每一步不仅看当前梯度，还把过去梯度的指数加权平均纳入考虑。梯度变化较慢的方向（通常是可用的下降方向）上速度会持续累积并加速；梯度方向来回翻转的方向上正负互相抵消，速度保持较小。
        </Typography>
      </div>

      <MathFormulaBlock ariaLabel="动量法速度更新：v t 等于 beta 乘 v t 减 1 加当前梯度 g t">
        <MathFormulaTerm latex="\boldsymbol v_t" tooltip="vₜ：第 t 步的速度向量，形状与参数相同，累积了历史梯度信息。" ariaLabel="第 t 步的速度向量" />
        <MathFormulaStatic latex="=" />
        <MathFormulaTerm latex="\beta\,\boldsymbol v_{t-1}" tooltip="β·v_{t-1}：保留上一步速度的 β 比例，β 决定历史信息衰减速度。" ariaLabel="beta 乘上一步速度" />
        <MathFormulaStatic latex="+" />
        <MathFormulaTerm latex="\boldsymbol g_t" tooltip="gₜ：当前位置用当前数据计算得到的梯度（可以是单样本、小批量或完整训练集梯度）。" ariaLabel="当前梯度" />
        <MathFormulaStatic latex="," />
        <MathFormulaTerm latex="\beta\in(0,1)" tooltip="β 越接近 1，保留越久的历史梯度信息；常用 β=0.9。" ariaLabel="beta 在零到一之间" />
      </MathFormulaBlock>

      <MathFormulaBlock ariaLabel="参数更新：下一步参数等于当前参数减学习率乘速度">
        <MathFormulaTerm latex="\boldsymbol\theta_{t+1}" tooltip="更新后的新参数向量。" ariaLabel="下一步参数" />
        <MathFormulaStatic latex="=" />
        <MathFormulaTerm latex="\boldsymbol\theta_t" tooltip="当前参数向量。" ariaLabel="当前参数" />
        <MathFormulaStatic latex="-" />
        <MathFormulaTerm latex="\eta" tooltip="学习率，控制每次更新的基本步长。" ariaLabel="学习率" tone="warm" />
        <MathFormulaTerm latex="\boldsymbol v_t" tooltip="用累积速度替代瞬时梯度进行参数更新。" ariaLabel="速度向量" />
      </MathFormulaBlock>

      <Typography variant="bodySmall">
        将速度定义展开，可以直观看出动量为什么等价于对过去梯度做指数加权移动平均：
      </Typography>

      <MathFormulaBlock ariaLabel="速度展开为过去所有梯度的指数加权和：v t 等于从 tau 等于零到 t 减一的 beta tau 次方乘 g t 减 tau 的累加">
        <MathFormulaTerm latex="\boldsymbol v_t" tooltip="当前速度是对过去梯度的指数加权累积。" ariaLabel="速度向量" />
        <MathFormulaStatic latex="=" />
        <MathFormulaTerm latex="\sum_{\tau=0}^{t-1}\beta^{\tau}\,\boldsymbol g_{t-\tau}" tooltip="第 τ 步之前的梯度权重为 β^τ；β=0.9 时最近 10 步的权重合计约 65%。" ariaLabel="过去梯度的指数加权和" />
      </MathFormulaBlock>

      <div className="gd-react-prose-sequence">
        <Typography variant="bodySmall">
          β=0.9 是实践中最常用的取值：它等效于对大约 1/(1−β)=10 步的近期梯度做加权平均。每一步的梯度贡献权重按 β^τ 衰减——距今越远，影响越小。
        </Typography>
        <Typography variant="bodySmall">
          β=0 时动量法退化为标准梯度下降（vₜ = gₜ）；β 接近 1 时速度变化很慢，对方向变化的反应迟钝。所以 β 同样是一个需要调节的<strong>超参数</strong>，但它的选择范围比学习率窄得多，0.9 是通用默认值。
        </Typography>
      </div>

      <section className="gd-react-worked-example" aria-labelledby="gd-momentum-example-title">
        <Typography as="h4" variant="bodySmall" tone="accent" id="gd-momentum-example-title">
          小例子：动量如何抑制震荡
        </Typography>
        <Typography variant="bodySmall">
          假设一个二维优化问题，某个方向上梯度大小始终为 10，但符号在正负之间交替（震荡方向）；另一个方向上梯度始终为 −1（一致下降方向）。取 β=0.9：
        </Typography>
        <div className="gd-react-prose-sequence">
          <Typography variant="bodySmall">
            <strong>震荡方向：</strong>g = [+10, −10, +10, −10, …]。由于正负交替，指数加权和接近 0，速度在该方向上近乎为零——参数几乎不移动。标准 GD 每次都会在正负 10 之间弹跳，而动量直接吸收了这些震荡。
          </Typography>
          <Typography variant="bodySmall">
            <strong>一致下降方向：</strong>g = [−1, −1, −1, −1, …]。指数加权和快速累积到约 −1/(1−0.9) = −10，速度在该方向上被放大 10 倍——参数加速向最小值移动。标准 GD 每步只走 −η，动量则相当于以约 10η 的有效步长在一致方向上推进。
          </Typography>
        </div>
      </section>

      <Typography variant="bodySmall">
        需要特别指出的是：动量法是关于<strong>更新规则</strong>的改进，与损失函数的选择无关——它可以与 L1、L2、交叉熵、小批量 SGD 等任何损失和采样方式结合使用。它也不改变梯度的数学定义，只改变「用梯度来更新参数」的方式。
      </Typography>

      <Typography variant="bodySmall" tone="muted">
        动量法的一个变体是 Nesterov 加速梯度：先沿当前速度方向迈出一小步，在那一步的位置计算梯度，再做正式更新——相当于「先看一眼前方再决定」。工程实践中，Adam 等自适应优化器已将动量思想内嵌，是一个单独的教学模块。
      </Typography>
    </section>
  );
}
