import {
  MathFormulaBlock,
  MathFormulaStatic,
  MathFormulaTerm,
} from '../../../shared/react/learning/MathFormulaBlock';
import { Typography } from '../../../shared/react/typography/Typography';

export function LikelihoodSection() {
  return (
    <section className="lg-react-rigor-note" aria-labelledby="lg-nll-title">
      <Typography as="h3" variant="h3" tone="accent" id="lg-nll-title">为什么会得到 L1 或 L2：负对数似然视角</Typography>
      <Typography variant="bodySmall">若模型定义了给定输入后的条件分布，训练可以表述为最大化观测数据的条件似然。取负对数后，样本概率的乘积会转化为可以求平均并最小化的目标。</Typography>
      <Typography variant="bodySmall">在固定噪声尺度的假设下，高斯观测噪声对应平均平方误差，拉普拉斯观测噪声对应平均绝对误差。这一对应依赖建模假设，不表示真实数据必然严格服从某个分布。</Typography>
      <MathFormulaBlock ariaLabel="独立样本的条件似然等于各样本条件概率的乘积，最大化似然等价于最小化负对数似然">
        <MathFormulaTerm latex="\mathcal L(\theta)" tooltip="似然函数：把已观测到的标签视为固定数据，衡量不同参数 θ 对这些数据的解释程度。" ariaLabel="参数 theta 的似然函数" />
        <MathFormulaStatic latex="=" />
        <MathFormulaTerm latex="\prod_{i=1}^{m}p_{\theta}(y_i\mid x_i)" tooltip="在样本条件独立的建模假设下，联合条件似然写成各样本条件概率或密度的乘积。" ariaLabel="m 个样本条件概率的乘积" />
        <MathFormulaStatic latex="," />
        <MathFormulaTerm latex="\underset{\theta}{\operatorname{arg\,max}}\,\mathcal L(\theta)" tooltip="最大似然估计寻找使观测数据最可能出现的参数。" ariaLabel="最大化似然的参数" />
        <MathFormulaStatic latex="=" />
        <MathFormulaTerm latex="\underset{\theta}{\operatorname{arg\,min}}\,J_{\mathrm{NLL}}(\theta)" tooltip="对数是单调函数，取负号后最大化似然与最小化负对数似然具有相同参数解。" ariaLabel="最小化负对数似然的参数" />
      </MathFormulaBlock>
      <MathFormulaBlock ariaLabel="负对数似然训练目标等于所有样本条件概率对数的负平均值">
        <MathFormulaTerm latex="J_{\mathrm{NLL}}(\theta)" tooltip="J_NLL(θ)：参数 θ 对应的平均负对数似然训练目标。" ariaLabel="负对数似然训练目标" />
        <MathFormulaStatic latex="=" />
        <MathFormulaTerm latex="-\frac{1}{m}\sum_{i=1}^{m}" tooltip="对 m 个样本的对数条件概率求和、取负并计算平均。" ariaLabel="m 个样本负对数概率的平均" />
        <MathFormulaTerm latex="\log" tooltip="log：把样本似然的乘积转为对数项之和；前面的负号把最大化似然转为最小化目标。" ariaLabel="对数函数" />
        <MathFormulaTerm latex="p_{\theta}(y_i\mid x_i)" tooltip="模型在输入 xᵢ 条件下，为真实目标 yᵢ 分配的条件概率或概率密度。" ariaLabel="真实目标的条件概率" />
      </MathFormulaBlock>
      <div className="lg-react-formula-stack">
        <MathFormulaBlock ariaLabel="高斯噪声假设下负对数似然等于常数加平方误差的缩放">
          <MathFormulaTerm latex="\varepsilon_i\sim\mathcal{N}(0,\sigma^2)" tooltip="εᵢ 服从均值为 0、方差为 σ² 的高斯噪声假设。" ariaLabel="零均值高斯噪声假设" />
          <MathFormulaStatic latex="\Longrightarrow" />
          <MathFormulaTerm latex="J_{\mathrm{NLL}}" tooltip="在这一观测模型下得到的负对数似然目标。" ariaLabel="负对数似然目标" />
          <MathFormulaStatic latex="=" />
          <MathFormulaTerm latex="C" tooltip="C：与模型参数无关的常数，不影响最优参数的位置。" ariaLabel="与参数无关的常数" />
          <MathFormulaStatic latex="+" />
          <MathFormulaTerm latex="\frac{1}{2\sigma^2m}" tooltip="由噪声方差和样本数决定的正常数缩放。" ariaLabel="高斯噪声下的缩放系数" />
          <MathFormulaTerm latex="\sum_{i=1}^{m}e_i^2" tooltip="全部样本残差平方之和，因此固定方差高斯噪声导出均方误差形式。" ariaLabel="样本平方误差之和" />
        </MathFormulaBlock>
        <MathFormulaBlock ariaLabel="拉普拉斯噪声假设下负对数似然等于常数加绝对误差的缩放">
          <MathFormulaTerm latex="\varepsilon_i\sim\operatorname{Laplace}(0,b)" tooltip="εᵢ 服从位置为 0、尺度为 b 的拉普拉斯噪声假设。" ariaLabel="零位置拉普拉斯噪声假设" />
          <MathFormulaStatic latex="\Longrightarrow" />
          <MathFormulaTerm latex="J_{\mathrm{NLL}}" tooltip="在这一观测模型下得到的负对数似然目标。" ariaLabel="负对数似然目标" />
          <MathFormulaStatic latex="=" />
          <MathFormulaTerm latex="C" tooltip="C：与模型参数无关的常数，不影响最优参数的位置。" ariaLabel="与参数无关的常数" />
          <MathFormulaStatic latex="+" />
          <MathFormulaTerm latex="\frac{1}{bm}" tooltip="由拉普拉斯尺度和样本数决定的正常数缩放。" ariaLabel="拉普拉斯噪声下的缩放系数" />
          <MathFormulaTerm latex="\sum_{i=1}^{m}|e_i|" tooltip="全部样本绝对残差之和，因此固定尺度拉普拉斯噪声导出平均绝对误差形式。" ariaLabel="样本绝对误差之和" />
        </MathFormulaBlock>
      </div>
      <Typography variant="bodySmall" tone="muted">这里的“概率”对连续标签严格说是概率密度。常数 C 与参数 θ 无关，删除它不会改变最优参数；若噪声尺度也参与学习，则相应的对数尺度项不能被当作常数省略。</Typography>
    </section>
  );
}
