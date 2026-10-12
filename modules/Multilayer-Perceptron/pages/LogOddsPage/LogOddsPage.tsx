import { useState } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, RangeControl, Typography } from '../../../shared/react';
import './LogOddsPage.css';

export function LogOddsPage() {
  const [percent, setPercent] = useState(80);
  const p = percent / 100;
  const odds = p / (1 - p);
  const logOdds = Math.log(odds);
  return <ContentBlock headingLevel={1} title="对数几率回归" subtitle="线性回归建模条件均值；逻辑回归建模正类概率的对数几率。" className="rl-logit-page">
    <div className="rl-logit-layout">
      <section className="rl-logit-comparison rl-logit-linear">
        <Typography variant="h3" tone="accent">线性回归 · 数值的均值是线性的</Typography>
        <MathFormulaBlock appearance="plain">
          <MathFormulaTerm latex="\mu" tooltip="给定输入时，连续目标的条件均值。模型用它作为数值预测。"/>
          <MathFormulaStatic latex="="/>
          <MathFormulaTerm latex="\mathbb E[Y\mid\mathbf x]" tooltip="固定输入x，目标Y的平均水平。例如同样石重下，考虑测量波动后的平均下沉深度。"/>
          <MathFormulaStatic latex="="/>
          <MathFormulaTerm latex="\mathbf w^\top\mathbf x" tooltip="各输入特征乘以对应权重后求和。线性指参数w和b以一次形式进入表达式。"/>
          <MathFormulaStatic latex="+"/>
          <MathFormulaTerm latex="b" tooltip="截距；输入为零时的模型均值。"/>
        </MathFormulaBlock>
        <div className="rl-logit-model-note"><Typography variant="body" tone="accent">直接输出数值预测</Typography>
          <MathFormulaBlock appearance="plain"><MathFormulaTerm latex="\hat y=\mu" tooltip="预测值与模型条件均值相同。这里使用恒等映射，输出范围不受限制。"/></MathFormulaBlock>
        </div>
        <Typography variant="bodySmall" tone="muted">输入石重 → 预测下沉深度</Typography>
      </section>
      <section className="rl-logit-comparison rl-logit-logistic">
        <Typography variant="h3" tone="accent">逻辑回归 · 对数几率是线性的</Typography>
        <MathFormulaBlock appearance="plain">
          <MathFormulaTerm latex="\ln" tooltip="自然对数，底数为e。这里取的是几率的对数，不是概率的对数。"/>
          <MathFormulaTerm latex="\frac{p}{1-p}" tooltip="正类概率与负类概率的比值，称为几率（odds）。p=0.8时几率是4，不是80%。"/>
          <MathFormulaStatic latex="="/>
          <MathFormulaTerm latex="\mathbf w^\top\mathbf x" tooltip="线性分数。逻辑回归假设概率的对数几率对输入特征呈线性关系。"/>
          <MathFormulaStatic latex="+"/>
          <MathFormulaTerm latex="b" tooltip="偏置；输入为零时的模型对数几率。"/>
        </MathFormulaBlock>
        <div className="rl-logit-model-note"><Typography variant="body" tone="accent">等价地，输出正类概率</Typography>
          <MathFormulaBlock appearance="plain">
            <MathFormulaTerm latex="p" tooltip="p=P(Y=1|x)。二分类标签Y为0或1，条件均值E[Y|x]也恰好等于p。"/>
            <MathFormulaStatic latex="="/>
            <MathFormulaTerm latex="\sigma(\mathbf w^\top\mathbf x+b)" tooltip="上一页的Sigmoid模型。解出左边的对数几率方程，就得到这个概率表达式。"/>
          </MathFormulaBlock>
        </div>
        <Typography variant="bodySmall" tone="muted">输入船体参数 → 估计能承载的概率</Typography>
      </section>

      <section className="rl-logit-transform">
        <div className="rl-logit-control"><Typography variant="h3" tone="accent">同一个预测，三种表示</Typography><div className="rl-logit-presets"><Button onClick={()=>setPercent(50)}>50%</Button><Button onClick={()=>setPercent(80)}>80%</Button><Button onClick={()=>setPercent(20)}>20%</Button></div></div>
        <div className="rl-logit-values">
          <div><Typography variant="bodySmall" tone="muted">概率 p · 0 到 1</Typography><Typography variant="h2" tone="accent">{percent.toFixed(1)}%</Typography><MathFormulaBlock appearance="plain"><MathFormulaTerm latex="P(Y=1\mid\mathbf x)" tooltip="固定同一组输入时，模型估计类别1的条件概率；这是概率，不是某次观测的0/1标签。"/></MathFormulaBlock></div>
          <Typography variant="h2" tone="muted">→</Typography>
          <div><Typography variant="bodySmall" tone="muted">几率 odds · 大于 0</Typography><Typography variant="h2" tone="accent">{odds.toFixed(2)} : 1</Typography><MathFormulaBlock appearance="plain"><MathFormulaTerm latex="\frac{p}{1-p}=e^z" tooltip="从p=1/(1+e^(−z))可得1−p=e^(−z)/(1+e^(−z))；两式相除，几率就是e^z。"/></MathFormulaBlock></div>
          <Typography variant="h2" tone="muted">→</Typography>
          <div><Typography variant="bodySmall" tone="muted">对数几率 logit · 任意实数</Typography><Typography variant="h2" tone="accent">{logOdds.toFixed(2)}</Typography><MathFormulaBlock appearance="plain"><MathFormulaTerm latex="\ln\frac{p}{1-p}=z" tooltip="取自然对数抵消指数，恢复上一页的线性分数z。p=0.5对应z=0；概率趋向0或1时，z趋向负或正无穷。"/></MathFormulaBlock></div>
        </div>
        <RangeControl label="调节正类概率 p" min={1} max={99} step={1} value={percent} digits={1} suffix="%" onChange={event=>setPercent(Number(event.currentTarget.value))}/>
      </section>

      <section className="rl-logit-coefficient">
        <div><Typography variant="h3" tone="accent">权重的含义</Typography><Typography variant="bodySmall" tone="muted">其他特征不变，xⱼ 增加 1</Typography></div>
        <MathFormulaBlock appearance="plain">
          <MathFormulaTerm latex="\Delta\operatorname{logit}(p)=w_j" tooltip="特征x_j增加一个单位，线性分数及对数几率都增加w_j。变化大小依赖特征的计量单位。" tooltipPlacement="top"/>
          <MathFormulaStatic latex="\quad\Longrightarrow\quad"/>
          <MathFormulaTerm latex="\frac{\mathrm{odds}_{\mathrm{new}}}{\mathrm{odds}_{\mathrm{old}}}=e^{w_j}" tooltip="几率乘以e^(w_j)，概率本身不会乘以这个倍数。例如w_j=ln2时，几率翻倍；p从0.5变成2/3，而不是1。" tooltipPlacement="top"/>
        </MathFormulaBlock>
      </section>
      <div className="rl-logit-next"><Typography variant="bodySmall" tone="muted">《机器学习》§3.3：对数几率回归（Logistic Regression）</Typography><Typography variant="bodySmall" tone="accent">下一步：如何用 0 / 1 标签学习 w 和 b？→ 最大似然</Typography></div>
    </div>
  </ContentBlock>;
}
