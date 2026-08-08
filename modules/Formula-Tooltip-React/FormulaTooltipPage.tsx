import { Callout, ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, MathSymbolTerm, ModuleShell } from '../shared/react';
import './formula-tooltip-react.css';

export function FormulaTooltipPage() {
  return (
    <ModuleShell
      title="训练目标如何写成公式"
      subtitle="用 LaTeX 渲染专业公式，并把变量、算子和正则项逐段解释清楚。"
      shellClassName="formula-tooltip-shell edu-shell--scaled"
    >
      <ContentBlock title="一个可解释的训练目标" subtitle="模型寻找一组权重，让预测更准确，同时避免权重无限变大。">
        <MathFormulaBlock ariaLabel="W star 等于对 W 求使损失函数加 lambda 乘 W 的二范数平方最小的值">
          <MathSymbolTerm latex="W^{*}" tooltip="W*：训练结束时找到的最优权重。这个符号不在花书固定符号表中，因此仍按普通 LaTeX 渲染。" ariaLabel="W star，训练得到的最优权重" />
          <MathFormulaStatic latex="=" />
          <MathFormulaTerm latex="\underset{W}{\operatorname{arg\,min}}" tooltip="arg min：在所有候选权重 W 中，选择让整个目标函数数值最小的一组。" ariaLabel="arg min，对 W 寻找最小目标值" />
          <MathFormulaStatic latex="(" />
          <MathFormulaTerm latex="\operatorname{Loss}" tooltip="Loss：损失函数，衡量模型预测和真实答案之间相差多少。它通常会汇总成关于参数的训练目标。" ariaLabel="Loss，衡量预测误差的损失函数" />
          <MathFormulaStatic latex="(" />
          <MathSymbolTerm symbolKey="trainingTarget" latex="y" tooltip="y：样本的真实目标值。花书固定符号表中监督目标写作 y^(i)，这里按当前公式上下文简写为 y。" ariaLabel="y，样本真实目标值" />
          <MathFormulaStatic latex="," />
          <MathSymbolTerm symbolKey="parameterizedFunction" latex="\hat{y}" tooltip="ŷ：模型根据当前参数给出的预测值，可看作参数化函数 f(x; θ) 的输出。" ariaLabel="y hat，模型预测值" />
          <MathFormulaStatic latex=")" />
          <MathFormulaStatic latex="+" />
          <MathSymbolTerm latex="\lambda" tooltip="λ：正则化强度。它决定模型在“拟合数据”和“保持权重较小”之间如何权衡。" ariaLabel="lambda，正则化强度" tone="warm" />
          <MathSymbolTerm symbolKey="normTwo" latex="\lVert W\rVert_2^2" tooltip="||W||₂²：权重 W 的 L2 范数平方。它沿用共享符号表中 L2 范数的样式，但解释可在模块内改成正则化语境。" ariaLabel="W 的 L2 范数平方，权重大小惩罚" tone="warm" />
          <MathFormulaStatic latex=")" />
        </MathFormulaBlock>
        <Callout tone="blue" label="实现方式">
          固定数学符号从 shared 的花书符号表读取 LaTeX、默认解释和样式；模块仍可按上下文覆盖说明。符号表没有收录的片段继续按普通 LaTeX 渲染。
        </Callout>
      </ContentBlock>
    </ModuleShell>
  );
}
