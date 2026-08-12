import {
  MathFormulaBlock,
  MathFormulaStatic,
  MathFormulaTerm,
} from '../../../shared/react/learning/MathFormulaBlock';
import { Typography } from '../../../shared/react/typography/Typography';

export function LossDefinitionSection() {
  return (
    <section className="lg-react-rigor-note" aria-labelledby="lg-loss-definition-title">
      <div className="lg-react-rigor-heading">
        <Typography as="h3" variant="h3" tone="accent" id="lg-loss-definition-title">损失函数怎样衡量预测质量</Typography>
        <Typography variant="bodySmall">损失函数接收真实标签与模型预测，输出一个描述当前样本误差的标量。本页使用非负损失：数值越接近零，当前预测越准确；当预测完全正确时，绝对误差和平方误差都等于零。</Typography>
        <Typography variant="bodySmall">损失函数由任务决定，不要求在数学上一定构成“距离”。这里研究数值回归，所以从预测值与真实值的残差出发；其他任务会根据输出含义选择不同度量。</Typography>
      </div>
      <MathFormulaBlock ariaLabel="第 i 个样本的预测值等于参数为 theta 的模型作用于输入 x i，单样本损失等于真实值和预测值的损失函数值，并且不小于零">
        <MathFormulaTerm latex="\hat{y}^{(i)}" tooltip="第 i 个样本的模型预测值。" ariaLabel="第 i 个样本的预测值" />
        <MathFormulaStatic latex="=" />
        <MathFormulaTerm latex="f_{\theta}(x^{(i)})" tooltip="参数为 θ 的模型接收第 i 个输入样本后得到的输出。" ariaLabel="参数为 theta 的模型作用于第 i 个输入样本" />
        <MathFormulaStatic latex="," />
        <MathFormulaTerm latex="\ell^{(i)}(\theta)" tooltip="ℓ⁽ⁱ⁾(θ)：当前参数 θ 在第 i 个样本上产生的单样本损失。" ariaLabel="第 i 个样本的损失" />
        <MathFormulaStatic latex="=" />
        <MathFormulaTerm latex="\ell(y^{(i)},\hat{y}^{(i)})" tooltip="损失函数比较第 i 个样本的真实标签与预测值后输出一个标量。" ariaLabel="真实标签与预测值的损失函数值" />
        <MathFormulaTerm latex="\ge 0" tooltip="本页使用的绝对误差和平方误差都不小于 0；预测完全正确时损失为 0。" ariaLabel="损失不小于零" />
      </MathFormulaBlock>
      <Typography variant="bodySmall" tone="muted">“预测正确时损失为 0”是本页两种回归损失的性质；一般损失函数只要能给训练提供合适的比较标准即可，不应把这一性质误当成所有任务的唯一形式。</Typography>
    </section>
  );
}
