import {
  MathFormulaBlock,
  MathFormulaStatic,
  MathFormulaTerm,
} from '../../../shared/react/learning/MathFormulaBlock';
import { Typography } from '../../../shared/react/typography/Typography';

export function LossObjectiveSection() {
  return (
    <section className="lg-react-rigor-note" aria-labelledby="lg-objective-definition-title">
      <Typography as="h3" variant="h3" tone="accent" id="lg-objective-definition-title">从单个样本到训练目标</Typography>
      <div className="lg-react-prose-sequence">
        <Typography variant="bodySmall"><strong>残差</strong>记为 eᵢ = ŷᵢ − yᵢ。它保留方向：正号表示预测偏高，负号表示预测偏低；如果直接平均残差，正负误差可能相互抵消。</Typography>
        <Typography variant="bodySmall"><strong>绝对误差</strong>取 |eᵢ|，让损失随偏离大小线性增长；<strong>平方误差</strong>取 eᵢ²，让损失随偏离大小二次增长。两者都消除了正负号抵消，但对大残差的重视程度不同。</Typography>
      </div>
      <div className="lg-react-formula-stack">
        <MathFormulaBlock ariaLabel="残差 e i 等于预测值 y hat i 减真实值 y i">
          <MathFormulaTerm latex="e_i" tooltip="eᵢ：第 i 个样本的残差，保留预测偏高或偏低的方向。" ariaLabel="第 i 个样本的残差" />
          <MathFormulaStatic latex="=" />
          <MathFormulaTerm latex="\hat{y}_i" tooltip="ŷᵢ：模型对第 i 个样本的预测值。" ariaLabel="第 i 个样本的预测值" />
          <MathFormulaStatic latex="-" />
          <MathFormulaTerm latex="y_i" tooltip="yᵢ：训练数据给出的第 i 个样本真实目标。" ariaLabel="第 i 个样本的真实目标" />
        </MathFormulaBlock>
        <MathFormulaBlock ariaLabel="第 i 个样本的 L1 损失等于残差绝对值，L2 损失等于残差平方">
          <MathFormulaTerm latex="\ell_{\mathrm{L1}}^{(i)}" tooltip="第 i 个样本的 L1 损失，也就是绝对误差。" ariaLabel="第 i 个样本的 L1 损失" />
          <MathFormulaStatic latex="=" />
          <MathFormulaTerm latex="|e_i|" tooltip="|eᵢ|：取残差的绝对值，去掉方向并保留偏离大小。" ariaLabel="残差绝对值" />
          <MathFormulaStatic latex="," />
          <MathFormulaTerm latex="\ell_{\mathrm{L2}}^{(i)}" tooltip="第 i 个样本的 L2 损失，本模块沿用原命名表示平方误差。" ariaLabel="第 i 个样本的 L2 损失" />
          <MathFormulaStatic latex="=" />
          <MathFormulaTerm latex="e_i^2" tooltip="eᵢ²：残差平方，会以二次速度放大较大的残差。" ariaLabel="残差平方" />
        </MathFormulaBlock>
      </div>
      <Typography variant="bodySmall">教材中也常把平方误差写成二分之一乘残差平方。这个正常数只会整体缩放损失和梯度，不会改变使目标达到最小值的参数；它的作用是让求导后的表达式更简洁。本模块为了延续原有交互，数值仍显示未经二分之一缩放的平方误差。</Typography>
      <MathFormulaBlock ariaLabel="二分之一残差平方对预测值的导数等于残差，并且与未缩放平方误差具有相同的最小值位置">
        <MathFormulaTerm latex="\tilde\ell_{mathrm{L2}}^{(i)}" tooltip="教材常用的缩放平方误差，在残差平方前乘二分之一。" ariaLabel="缩放后的单样本平方误差" />
        <MathFormulaStatic latex="=" />
        <MathFormulaTerm latex="\frac{1}{2}e_i^2" tooltip="乘以正常数二分之一不会改变最优参数，只会改变目标及其梯度的尺度。" ariaLabel="二分之一乘残差平方" />
        <MathFormulaStatic latex="," />
        <MathFormulaTerm latex="\frac{\partial\tilde\ell_{mathrm{L2}}^{(i)}}{\partial\hat y_i}" tooltip="缩放平方误差关于预测值的偏导。" ariaLabel="缩放平方误差对预测值的偏导" />
        <MathFormulaStatic latex="=" />
        <MathFormulaTerm latex="e_i" tooltip="系数二分之一抵消平方求导产生的系数二，结果正好等于残差。" ariaLabel="导数等于残差" />
      </MathFormulaBlock>
      <Typography variant="bodySmall">本页题目计算的是一个样本的损失。真正训练模型时，需要把 m 个训练样本的损失取平均，得到关于参数 θ 的经验风险（也常称训练目标或代价函数）。</Typography>
      <div className="lg-react-prose-sequence">
        <Typography variant="bodySmall">训练集中全部样本损失的平均值称为<strong>经验风险</strong> J(θ)。它来自有限训练数据，可以被直接计算和最小化。模型真正关心的是未知数据分布上的<strong>期望风险</strong>，训练时只能用经验风险近似；因此训练 Loss 下降说明优化取得进展，却不能单独证明泛化能力变好。</Typography>
        <Typography variant="bodySmall">逐样本损失还需要通过 <strong>reduction</strong> 汇总。取平均能让目标尺度较少依赖样本数；取和会随样本数整体放大。样本权重一致时，两者的最小值位置相同，但梯度尺度不同。</Typography>
      </div>
      <Typography variant="bodySmall" tone="muted">“损失”严格地说常指单样本量 ℓ，“经验风险”指训练集平均量 J；工程语境中二者也经常统称为 loss。本模块沿用原有命名，将绝对误差称为 L1 Loss、平方误差称为 L2 Loss；取训练集平均后通常称为 MAE、MSE。</Typography>
      <MathFormulaBlock ariaLabel="训练目标 J theta 等于 m 个样本损失的平均值，最优参数 theta star 是使训练目标最小的参数">
        <MathFormulaTerm latex="J(\theta)" tooltip="J(θ)：参数为 θ 时，训练集上的经验风险或平均训练目标。" ariaLabel="参数 theta 的经验风险" />
        <MathFormulaStatic latex="=" />
        <MathFormulaTerm latex="\frac{1}{m}\sum_{i=1}^{m}" tooltip="对 m 个训练样本求和后除以 m，得到单样本损失的平均值。" ariaLabel="m 个样本的平均" />
        <MathFormulaTerm latex="\ell\!\left(y_i,f_{\theta}(x_i)\right)" tooltip="第 i 个样本的损失：比较真实目标 yᵢ 与模型预测 fθ(xᵢ)。" ariaLabel="第 i 个样本的损失" />
        <MathFormulaStatic latex="," />
        <MathFormulaTerm latex="\theta^{*}" tooltip="θ*：在当前训练目标下找到的最优参数候选。" ariaLabel="最优参数 theta star" />
        <MathFormulaStatic latex="=" />
        <MathFormulaTerm latex="\underset{\theta}{\operatorname{arg\,min}}" tooltip="arg min：在所有候选参数 θ 中，寻找使后面目标函数最小的一组。" ariaLabel="对 theta 寻找目标函数最小值" />
        <MathFormulaTerm latex="J(\theta)" tooltip="被最小化的经验风险 J(θ)。" ariaLabel="经验风险 J theta" />
      </MathFormulaBlock>
      <Typography variant="bodySmall">把绝对误差和平方误差分别代入平均训练目标，就得到 MAE 与 MSE。MAE 与标签保持相同量纲；MSE 的量纲被平方，因此两者的数值不能直接横向比较，比较模型时还必须使用同一数据集和同一指标。</Typography>
      <div className="lg-react-formula-stack">
        <MathFormulaBlock ariaLabel="平均绝对误差 MAE 等于 m 个样本绝对残差的平均值">
          <MathFormulaTerm latex="\operatorname{MAE}" tooltip="平均绝对误差：全部样本绝对残差的算术平均。" ariaLabel="平均绝对误差 MAE" />
          <MathFormulaStatic latex="=" />
          <MathFormulaTerm latex="\frac{1}{m}\sum_{i=1}^{m}|e_i|" tooltip="先对每个残差取绝对值，再对 m 个样本求平均。" ariaLabel="m 个绝对残差的平均" />
        </MathFormulaBlock>
        <MathFormulaBlock ariaLabel="均方误差 MSE 等于 m 个样本平方残差的平均值">
          <MathFormulaTerm latex="\operatorname{MSE}" tooltip="均方误差：全部样本平方残差的算术平均。" ariaLabel="均方误差 MSE" />
          <MathFormulaStatic latex="=" />
          <MathFormulaTerm latex="\frac{1}{m}\sum_{i=1}^{m}e_i^2" tooltip="先将每个残差平方，再对 m 个样本求平均。" ariaLabel="m 个平方残差的平均" />
        </MathFormulaBlock>
      </div>
      <section className="lg-react-worked-example" aria-labelledby="lg-dataset-example-title">
        <Typography as="h4" variant="bodySmall" tone="accent" id="lg-dataset-example-title">小例子：同一组残差怎样得到不同的总体损失</Typography>
        <Typography variant="bodySmall">某个回归模型在 4 个样本上的残差依次为 −2、0、1、5。先对每个残差取绝对值或平方，再分别求平均。</Typography>
        <div className="lg-react-formula-stack">
          <MathFormulaBlock ariaLabel="残差为负二、零、一、五时，平均绝对误差等于二">
            <MathFormulaTerm latex="\boldsymbol e" tooltip="4 个样本的残差向量，保留每次预测偏高或偏低的方向。" ariaLabel="四个样本的残差向量" />
            <MathFormulaStatic latex="=" />
            <MathFormulaTerm latex="[-2,0,1,5]" tooltip="最后一个样本的残差 5 明显大于其余残差。" ariaLabel="负二零一五组成的残差向量" />
            <MathFormulaStatic latex="," />
            <MathFormulaTerm latex="\operatorname{MAE}" tooltip="对 4 个绝对残差求平均。" ariaLabel="平均绝对误差" />
            <MathFormulaStatic latex="=" />
            <MathFormulaTerm latex="\frac{2+0+1+5}{4}" tooltip="绝对残差分别为 2、0、1、5，总和为 8。" ariaLabel="绝对残差之和除以四" />
            <MathFormulaStatic latex="=" />
            <MathFormulaTerm latex="2" tooltip="这组数据的平均绝对误差。" ariaLabel="平均绝对误差等于二" />
          </MathFormulaBlock>
          <MathFormulaBlock ariaLabel="残差为负二、零、一、五时，均方误差等于七点五">
            <MathFormulaTerm latex="\operatorname{MSE}" tooltip="对 4 个平方残差求平均。" ariaLabel="均方误差" />
            <MathFormulaStatic latex="=" />
            <MathFormulaTerm latex="\frac{4+0+1+25}{4}" tooltip="平方残差分别为 4、0、1、25；残差 5 被平方后贡献 25。" ariaLabel="平方残差之和除以四" />
            <MathFormulaStatic latex="=" />
            <MathFormulaTerm latex="7.5" tooltip="这组数据的均方误差。" ariaLabel="均方误差等于七点五" />
          </MathFormulaBlock>
        </div>
        <Typography variant="bodySmall">虽然只有一个较大的残差 5，但它贡献了 MSE 分子中的 25，占平方误差总和的五分之六；在 MAE 中，它只按原大小贡献 5。这就是“平方误差更容易被大残差主导”的具体含义。</Typography>
        <Typography variant="bodySmall">若最后一个残差从 5 增加到 10，MAE 从 2 增加到 3.25，而 MSE 从 7.5 增加到 26.25。两种指标都变差，但 MSE 的变化明显更强。</Typography>
        <MathFormulaBlock ariaLabel="把最后一个残差由五改为十后，平均绝对误差等于三点二五，均方误差等于二十六点二五">
          <MathFormulaTerm latex="\boldsymbol e'" tooltip="只把原残差向量的最后一个值从 5 改为 10。" ariaLabel="修改后的残差向量" />
          <MathFormulaStatic latex="=" />
          <MathFormulaTerm latex="[-2,0,1,10]" tooltip="用于观察单个大残差对两种总体损失的影响。" ariaLabel="负二零一十组成的残差向量" />
          <MathFormulaStatic latex="," />
          <MathFormulaTerm latex="\operatorname{MAE}'=\frac{13}{4}=3.25" tooltip="绝对残差总和由 8 增加到 13。" ariaLabel="修改后的平均绝对误差等于三点二五" />
          <MathFormulaStatic latex="," />
          <MathFormulaTerm latex="\operatorname{MSE}'=\frac{105}{4}=26.25" tooltip="平方残差总和由 30 增加到 105，大残差的影响被平方放大。" ariaLabel="修改后的均方误差等于二十六点二五" />
        </MathFormulaBlock>
      </section>
      <div className="lg-react-prose-sequence">
        <Typography variant="bodySmall">MAE 对每增加一个单位的残差施加相同惩罚；MSE 对大残差增长得更快。因此 MSE 会更积极地修正大错误，也更容易被少量极端样本主导。若模型只能输出一个常数，最小化 MSE 得到样本均值，最小化 MAE 得到样本中位数，这说明损失函数会改变模型认为“最有代表性”的预测。</Typography>
        <Typography variant="bodySmall">实际选择还要结合任务代价与噪声假设：希望强烈惩罚大偏差、且高斯噪声假设合理时常用平方误差；异常值较多或噪声更重尾时，绝对误差通常更稳健。最终仍需用验证数据比较。</Typography>
      </div>
    </section>
  );
}
