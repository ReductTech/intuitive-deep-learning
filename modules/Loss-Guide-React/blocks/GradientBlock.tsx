import { useState } from 'react';
import { Callout } from '../../shared/react/feedback/Callout';
import { ContentBlock } from '../../shared/react/layout/ContentBlock';
import { FormulaBlock, FormulaTerm } from '../../shared/react/learning/FormulaBlock';
import { MathFormulaBlock, MathFormulaStatic } from '../../shared/react/learning/MathFormulaBlock';
import { Question } from '../../shared/react/learning/Question';
import { Typography } from '../../shared/react/typography/Typography';
import type { LessonBlockProps } from './NumberLineBlock';

export function GradientBlock({ onComplete }: LessonBlockProps) {
  const [l1Complete, setL1Complete] = useState(false);
  const [l2Complete, setL2Complete] = useState(false);

  return (
    <ContentBlock className="lg-react-block" title="计算 L1 与 L2 的梯度" subtitle="损失告诉我们错了多少；梯度进一步告诉模型预测值应该往哪个方向改，以及需要多强的修正。">
      <Callout tone="blue" label="怎样读梯度" text="梯度的正负表示修正方向，绝对值表示当前误差产生的修正强度。训练时会沿梯度的反方向更新预测。" />
      <section className="lg-react-rigor-note lg-react-rigor-note--compact" aria-labelledby="lg-calculus-definition-title">
        <Typography as="h3" variant="h3" tone="accent" id="lg-calculus-definition-title">先区分导数、偏导数和梯度</Typography>
        <Typography variant="bodySmall">这三个词都描述局部变化率，但它们的输入对象不同。先写清“对谁求导”，才能判断结果是一个数还是一个向量。</Typography>
        <dl className="lg-react-definition-list">
          <div>
            <Typography as="dt" variant="label" tone="accent">导数</Typography>
            <Typography as="dd" variant="bodySmall">单变量函数在某一点的局部变化率。输入发生很小变化时，导数给出输出一阶变化的比例。</Typography>
          </div>
          <div>
            <Typography as="dt" variant="label" tone="accent">偏导数</Typography>
            <Typography as="dd" variant="bodySmall">多变量函数只改变其中一个变量、暂时固定其他变量时得到的变化率。本页的 ∂ℓ/∂ŷ 是损失关于预测值的一个偏导数。</Typography>
          </div>
          <div>
            <Typography as="dt" variant="label" tone="accent">梯度</Typography>
            <Typography as="dd" variant="bodySmall">标量目标关于一组变量的全部偏导数组成的向量。后续训练真正需要的是损失关于所有模型参数 θ 的梯度，而不只是关于预测 ŷ 的一个偏导数。</Typography>
          </div>
        </dl>
        <Typography variant="caption" tone="muted">本页先求 ∂ℓ/∂ŷ；梯度下降模块再通过链式法则把这一变化率传到每个权重，得到关于参数的梯度。</Typography>
      </section>
      <section className="lg-react-rigor-note lg-react-rigor-note--compact" aria-labelledby="lg-gradient-variable-title">
        <Typography as="h3" variant="h3" tone="accent" id="lg-gradient-variable-title">求导变量必须写清楚</Typography>
        <Typography variant="bodySmall">下面把残差定义为 e = ŷ − y，并对预测值 ŷ 求导。因为真实值 y 在训练样本中是常量，所以 ∂e/∂ŷ = 1。</Typography>
        <MathFormulaBlock ariaLabel="残差 e 等于预测值 y hat 减真实值 y，残差对预测值的导数等于一">
          <MathFormulaStatic latex="e=\hat{y}-y,\qquad \frac{\partial e}{\partial \hat{y}}=1" />
        </MathFormulaBlock>
      </section>
      <section className="lg-react-gradient-step"><Typography as="h3" variant="h3" tone="accent">L1 Loss</Typography><FormulaBlock ariaLabel="L1 损失公式"><FormulaTerm tooltip="L1：用绝对误差衡量预测偏差的损失">L₁</FormulaTerm> = <FormulaTerm tooltip="绝对值：只关心预测和真实值相差多远，不区分正负方向">|</FormulaTerm><FormulaTerm tooltip="y：数据中给出的真实目标值">y</FormulaTerm> − <FormulaTerm tooltip="ŷ：模型根据输入给出的预测值，读作 y hat">ŷ</FormulaTerm><FormulaTerm tooltip="绝对值：取差值的大小，结果始终不小于 0">|</FormulaTerm></FormulaBlock><FormulaBlock ariaLabel="L1 梯度公式"><FormulaTerm tooltip="∂：偏导符号，表示只考察一个量微小变化时带来的影响">∂</FormulaTerm><FormulaTerm tooltip="L1：绝对误差损失，等于预测值与真实值之差的绝对值">L₁</FormulaTerm>/<FormulaTerm tooltip="∂：这里表示对预测值 ŷ 求偏导">∂</FormulaTerm><FormulaTerm tooltip="ŷ：模型给出的预测值；分母说明我们关心改变预测值会怎样影响损失">ŷ</FormulaTerm> = <FormulaTerm tooltip="sign：只保留预测误差的正负号">sign</FormulaTerm>(<FormulaTerm tooltip="ŷ：模型当前给出的预测值">ŷ</FormulaTerm> − <FormulaTerm tooltip="y：数据中给出的真实目标值">y</FormulaTerm>)</FormulaBlock><div className="lg-react-technical-note"><Typography as="strong" variant="label" tone="accent">零点处的严格表述：</Typography><Typography as="span" variant="bodySmall">当 e = 0 时，|e| 不可导。优化中通常使用次梯度，并可按实现约定取 0。</Typography><MathFormulaBlock ariaLabel="绝对值函数的次梯度在负误差时为负一，在零误差时为负一到一的区间，在正误差时为正一"><MathFormulaStatic latex="\partial |e|=\begin{cases}-1,&e<0\\ \left[-1,1\right],&e=0\\ 1,&e>0\end{cases}" /></MathFormulaBlock></div><Question persistenceKey="l1-gradient" type="judgement" title="L1 Loss 的梯度包含误差大小信息。" options={[{ key: '对', value: 'true', label: '有，误差越大梯度绝对值越大', wrongFeedback: 'L1 梯度由 sign 决定，非零误差的梯度绝对值通常固定为 1。' }, { key: '错', value: 'false', label: '没有，它只用正负号表示方向' }]} answer="false" feedback={{ correct: '正确。L1 梯度通常只有 -1 或 +1，不会保留误差大小。' }} onCheck={(result) => setL1Complete(result.ok)} /></section>
      {l1Complete && <section className="lg-react-gradient-step"><Typography as="h3" variant="h3" tone="accent">L2 Loss</Typography><FormulaBlock ariaLabel="L2 损失公式"><FormulaTerm tooltip="L2：用平方误差衡量预测偏差的损失">L₂</FormulaTerm> = (<FormulaTerm tooltip="y：数据中给出的真实目标值">y</FormulaTerm> − <FormulaTerm tooltip="ŷ：模型根据输入给出的预测值，读作 y hat">ŷ</FormulaTerm>)<FormulaTerm tooltip="平方：把较大的误差放大得更明显">²</FormulaTerm></FormulaBlock><FormulaBlock ariaLabel="L2 梯度公式"><FormulaTerm tooltip="∂：偏导符号，表示只考察一个量微小变化时带来的影响">∂</FormulaTerm><FormulaTerm tooltip="L2：平方误差损失，等于预测值与真实值之差的平方">L₂</FormulaTerm>/<FormulaTerm tooltip="∂：这里表示对预测值 ŷ 求偏导">∂</FormulaTerm><FormulaTerm tooltip="ŷ：模型给出的预测值；分母说明我们关心改变预测值会怎样影响损失">ŷ</FormulaTerm> = <FormulaTerm tooltip="系数 2：来自平方求导">2</FormulaTerm>(<FormulaTerm tooltip="ŷ：模型当前给出的预测值">ŷ</FormulaTerm> − <FormulaTerm tooltip="y：数据中给出的真实目标值">y</FormulaTerm>)</FormulaBlock><div className="lg-react-technical-note"><Typography as="strong" variant="label" tone="accent">常见的系数约定：</Typography><Typography as="span" variant="bodySmall">教材也常写成 ½e²，使导数直接等于 e。乘以正常数不会改变最优参数，只会按同一比例缩放损失和梯度。</Typography><MathFormulaBlock ariaLabel="二分之一乘残差平方对预测值的导数等于残差"><MathFormulaStatic latex="\frac{\partial}{\partial \hat{y}}\left(\frac{1}{2}e^2\right)=e=\hat{y}-y" /></MathFormulaBlock></div><Question persistenceKey="l2-gradient" type="judgement" title="L2 Loss 的梯度包含误差大小信息。" options={[{ key: '对', value: 'true', label: '有，梯度绝对值会随误差变化' }, { key: '错', value: 'false', label: '没有，梯度绝对值始终固定', wrongFeedback: 'L2 梯度为 2(ŷ−y)，误差变化时梯度绝对值也随之变化。' }]} answer="true" feedback={{ correct: '正确。L2 梯度既提供方向，也会随着误差大小改变修正强度。' }} onCheck={(result) => setL2Complete(result.ok)} /></section>}
      {l2Complete && <Question persistenceKey="gradient-comparison" type="judgement" title="L1 的梯度只有方向信息，这是否意味着 L1 Loss 一定不如 L2 Loss？" options={[{ key: '对', value: 'true', label: '是，L2 永远更好', wrongFeedback: '损失函数没有绝对优劣；L1 对离群点更不敏感，在部分任务中反而更合适。' }, { key: '错', value: 'false', label: '不是，两者适合不同的误差假设' }]} answer="false" feedback={{ correct: '正确。面对离群点时，L1 不会让单个异常样本无限放大更新。' }} onCheck={(result) => { if (result.ok) onComplete(); }} />}
      {l2Complete && <section className="lg-react-rigor-note" aria-labelledby="lg-nll-title"><Typography as="h3" variant="h3" tone="accent" id="lg-nll-title">为什么会得到 L1 或 L2：负对数似然视角</Typography><Typography variant="bodySmall">若模型不只输出一个数，而是定义条件分布 pθ(y|x)，训练可以表述为最大化观测数据的条件似然。取负对数后，概率的乘积变为单样本项的求和，得到可最小化的负对数似然目标。</Typography><MathFormulaBlock ariaLabel="负对数似然训练目标等于所有样本条件概率对数的负平均值"><MathFormulaStatic latex="J_{\mathrm{NLL}}(\theta)=-\frac{1}{m}\sum_{i=1}^{m}\log p_{\theta}(y_i\mid x_i)" /></MathFormulaBlock><Typography variant="bodySmall">令 yᵢ = fθ(xᵢ) + εᵢ，并把噪声尺度视为固定常数。高斯噪声的负对数似然与平均平方误差只差常数项和正常数倍；拉普拉斯噪声则对应平均绝对误差。</Typography><div className="lg-react-formula-stack"><MathFormulaBlock ariaLabel="高斯噪声假设下负对数似然等于常数加平方误差的缩放"><MathFormulaStatic latex="\varepsilon_i\sim\mathcal{N}(0,\sigma^2)\;\Longrightarrow\;J_{\mathrm{NLL}}=C+\frac{1}{2\sigma^2m}\sum_{i=1}^{m}e_i^2" /></MathFormulaBlock><MathFormulaBlock ariaLabel="拉普拉斯噪声假设下负对数似然等于常数加绝对误差的缩放"><MathFormulaStatic latex="\varepsilon_i\sim\operatorname{Laplace}(0,b)\;\Longrightarrow\;J_{\mathrm{NLL}}=C+\frac{1}{bm}\sum_{i=1}^{m}|e_i|" /></MathFormulaBlock></div><ul className="lg-react-rigor-list"><Typography as="li" variant="bodySmall"><Typography as="strong" variant="inherit" tone="inherit">L2：</Typography>处处可导，对大残差施加更强惩罚；固定方差的高斯观测噪声给出这一形式。</Typography><Typography as="li" variant="bodySmall"><Typography as="strong" variant="inherit" tone="inherit">L1：</Typography>对大残差线性增长，通常更不易被极端值支配；拉普拉斯观测噪声给出这一形式。</Typography><Typography as="li" variant="bodySmall"><Typography as="strong" variant="inherit" tone="inherit">适用边界：</Typography>概率对应关系来自明确的噪声建模假设，不代表真实数据必然严格服从某个分布。</Typography></ul></section>}
    </ContentBlock>
  );
}
