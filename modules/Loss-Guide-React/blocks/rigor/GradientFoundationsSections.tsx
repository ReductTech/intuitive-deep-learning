import {
  MathFormulaBlock,
  MathFormulaStatic,
  MathFormulaTerm,
} from '../../../shared/react/learning/MathFormulaBlock';
import { Typography } from '../../../shared/react/typography/Typography';

export function GradientFoundationsSections() {
  return (
    <>
      <section className="lg-react-rigor-note lg-react-rigor-note--compact" aria-labelledby="lg-calculus-definition-title">
        <Typography as="h3" variant="h3" tone="accent" id="lg-calculus-definition-title">先区分导数、偏导数和梯度</Typography>
        <Typography variant="bodySmall"><strong>导数</strong>描述单变量函数在某一点的局部变化率；面对多变量函数时，只改变一个变量并固定其他变量，得到的是<strong>偏导数</strong>；把标量目标关于全部变量的偏导按顺序排成向量，就得到<strong>梯度</strong>。所以求导前必须先写清“对谁求导”，才能判断结果是一个数还是一个向量。</Typography>
        <Typography variant="bodySmall" tone="muted">本页先研究损失关于预测值的变化率；梯度下降模块再沿计算路径把这一变化率传到权重。</Typography>
      </section>

      <section className="lg-react-rigor-note lg-react-rigor-note--compact" aria-labelledby="lg-gradient-variable-title">
        <Typography as="h3" variant="h3" tone="accent" id="lg-gradient-variable-title">求导变量必须写清楚</Typography>
        <Typography variant="bodySmall">下面把真实值视为训练样本中固定不变的常量，只考察预测值发生微小变化时，残差和损失如何改变。</Typography>
        <MathFormulaBlock ariaLabel="残差 e 等于预测值 y hat 减真实值 y，残差对预测值的导数等于一">
          <MathFormulaTerm latex="e" tooltip="e：残差，定义为预测值减去真实值；正负号分别表示高估和低估。" ariaLabel="残差 e" />
          <MathFormulaStatic latex="=" />
          <MathFormulaTerm latex="\hat{y}" tooltip="ŷ：模型当前给出的预测值，也是本页的求导变量。" ariaLabel="模型预测值 y hat" />
          <MathFormulaStatic latex="-" />
          <MathFormulaTerm latex="y" tooltip="y：训练样本给出的真实值；对预测值求导时把它视为常量。" ariaLabel="真实值 y" />
          <MathFormulaStatic latex="," />
          <MathFormulaTerm latex="\frac{\partial e}{\partial \hat{y}}" tooltip="残差对预测值的偏导：预测每增加一个单位，残差也增加一个单位。" ariaLabel="残差对预测值的偏导" />
          <MathFormulaStatic latex="=" />
          <MathFormulaTerm latex="1" tooltip="真实值固定时，预测每增加一个单位，残差也增加一个单位。" ariaLabel="偏导数等于一" />
        </MathFormulaBlock>
      </section>
    </>
  );
}
