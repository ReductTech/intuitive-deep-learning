import { useState } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, MathFormulaTerm, RangeControl, Typography } from "@shuku/course-style/react";
import './LogOddsPage.css';

export function LogOddsPage() {
  const [percent, setPercent] = useState(80);
  const p = percent / 100;
  const odds = p / (1 - p);
  const logOdds = Math.log(odds);
  return <ContentBlock shuku-edit-id="e-bb105758-ca2d-40e2-90bc-076b16860ca6" headingLevel={1} title="对数几率回归" subtitle="线性回归建模条件均值；逻辑回归建模正类概率的对数几率。" className="rl-logit-page">
    <div shuku-edit-id="e-475b9b20-0005-4731-ab25-4f9af6dfeed3" className="rl-logit-layout">
      <section shuku-edit-id="e-307d4c84-1ded-4cfc-8c7b-1f7f0b56e70e" className="rl-logit-comparison rl-logit-linear">
        <Typography shuku-edit-id="e-a0581f0d-4a3a-400c-bf94-e3f5b1e9e4e8" variant="h3" tone="accent">线性回归 · 数值的均值是线性的</Typography>
        <MathFormulaBlock appearance="plain">
          <MathFormulaTerm latex="\mu" tooltip="给定输入时，连续目标的条件均值。模型用它作为数值预测。"/>
          <MathFormulaStatic latex="="/>
          <MathFormulaTerm latex="\mathbb E[Y\mid\mathbf x]" tooltip="固定输入x，目标Y的平均水平。例如同样石重下，考虑测量波动后的平均下沉深度。"/>
          <MathFormulaStatic latex="="/>
          <MathFormulaTerm latex="\mathbf w^\top\mathbf x" tooltip="各输入特征乘以对应权重后求和。线性指参数w和b以一次形式进入表达式。"/>
          <MathFormulaStatic latex="+"/>
          <MathFormulaTerm latex="b" tooltip="截距；输入为零时的模型均值。"/>
        </MathFormulaBlock>
        <div shuku-edit-id="e-6024e570-bfd0-449c-a772-28daf57f05f5" className="rl-logit-model-note"><Typography shuku-edit-id="e-a9010e22-ec43-43d1-9e8f-f0941558c32d" variant="body" tone="accent">直接输出数值预测</Typography>
          <MathFormulaBlock appearance="plain"><MathFormulaTerm latex="\hat y=\mu" tooltip="预测值与模型条件均值相同。这里使用恒等映射，输出范围不受限制。"/></MathFormulaBlock>
        </div>
        <Typography shuku-edit-id="e-304510d1-3dc4-4c6d-afdf-81339fa857cb" variant="bodySmall" tone="muted">输入石重 → 预测下沉深度</Typography>
      </section>
      <section shuku-edit-id="e-5aa0b103-d037-4564-962a-519422cc9e32" className="rl-logit-comparison rl-logit-logistic">
        <Typography shuku-edit-id="e-239ca385-cff9-4526-884d-5771a66d882c" variant="h3" tone="accent">逻辑回归 · 对数几率是线性的</Typography>
        <MathFormulaBlock appearance="plain">
          <MathFormulaTerm latex="\ln" tooltip="自然对数，底数为e。这里取的是几率的对数，不是概率的对数。"/>
          <MathFormulaTerm latex="\frac{p}{1-p}" tooltip="正类概率与负类概率的比值，称为几率（odds）。p=0.8时几率是4，不是80%。"/>
          <MathFormulaStatic latex="="/>
          <MathFormulaTerm latex="\mathbf w^\top\mathbf x" tooltip="线性分数。逻辑回归假设概率的对数几率对输入特征呈线性关系。"/>
          <MathFormulaStatic latex="+"/>
          <MathFormulaTerm latex="b" tooltip="偏置；输入为零时的模型对数几率。"/>
        </MathFormulaBlock>
        <div shuku-edit-id="e-9fa0451a-ef34-47a5-906f-2d21199b3c7c" className="rl-logit-model-note"><Typography shuku-edit-id="e-51c5fe34-fb04-4e58-b951-0e2775c7a4b1" variant="body" tone="accent">等价地，输出正类概率</Typography>
          <MathFormulaBlock appearance="plain">
            <MathFormulaTerm latex="p" tooltip="p=P(Y=1|x)。二分类标签Y为0或1，条件均值E[Y|x]也恰好等于p。"/>
            <MathFormulaStatic latex="="/>
            <MathFormulaTerm latex="\sigma(\mathbf w^\top\mathbf x+b)" tooltip="上一页的Sigmoid模型。解出左边的对数几率方程，就得到这个概率表达式。"/>
          </MathFormulaBlock>
        </div>
        <Typography shuku-edit-id="e-1451e0b7-f313-48e5-a10f-0548c56d621b" variant="bodySmall" tone="muted">输入船体参数 → 估计能承载的概率</Typography>
      </section>

      <section shuku-edit-id="e-579b9bd5-09cc-4a39-b8fa-4ec31a8ef297" className="rl-logit-transform">
        <div shuku-edit-id="e-17704880-5cbd-415c-93e8-92eda535d66a" className="rl-logit-control"><Typography shuku-edit-id="e-3891b504-8a30-417a-8e03-1fedccf16bc5" variant="h3" tone="accent">同一个预测，三种表示</Typography><div shuku-edit-id="e-07051e02-e6a1-44e2-a21f-4805b36692c6" className="rl-logit-presets"><Button onClick={()=>setPercent(50)}>50%</Button><Button onClick={()=>setPercent(80)}>80%</Button><Button onClick={()=>setPercent(20)}>20%</Button></div></div>
        <div shuku-edit-id="e-8e4ca69c-8403-4951-8acf-edce5480e1c2" className="rl-logit-values">
          <div shuku-edit-id="e-a8620a40-92ae-40f3-b441-c00555ebead1"><Typography shuku-edit-id="e-0e3a7ed5-6223-42a6-a381-f7b8bf008ba0" variant="bodySmall" tone="muted">概率 p · 0 到 1</Typography><Typography shuku-edit-id="e-62e63cfa-4936-4801-b25d-66430ae43240" variant="h2" tone="accent">{percent.toFixed(1)}%</Typography><MathFormulaBlock appearance="plain"><MathFormulaTerm latex="P(Y=1\mid\mathbf x)" tooltip="固定同一组输入时，模型估计类别1的条件概率；这是概率，不是某次观测的0/1标签。"/></MathFormulaBlock></div>
          <Typography shuku-edit-id="e-2b96d576-d2ec-4cdd-92d2-b9b1658f645d" variant="h2" tone="muted">→</Typography>
          <div shuku-edit-id="e-76486c20-5407-425a-b7aa-fd8b0ce2c9f8"><Typography shuku-edit-id="e-a3990e56-28d9-409a-8413-0d4f764eec45" variant="bodySmall" tone="muted">几率 odds · 大于 0</Typography><Typography shuku-edit-id="e-9712a989-ed30-4e15-be39-35e1698c6bff" variant="h2" tone="accent">{odds.toFixed(2)} : 1</Typography><MathFormulaBlock appearance="plain"><MathFormulaTerm latex="\frac{p}{1-p}=e^z" tooltip="从p=1/(1+e^(−z))可得1−p=e^(−z)/(1+e^(−z))；两式相除，几率就是e^z。"/></MathFormulaBlock></div>
          <Typography shuku-edit-id="e-f99bc607-0d1b-452b-8c02-69462af9f945" variant="h2" tone="muted">→</Typography>
          <div shuku-edit-id="e-6ce64c39-1671-4b8b-b12b-4a0ec4c831cb"><Typography shuku-edit-id="e-e4c7fbb5-a2d9-4b5a-bd94-8c015de61081" variant="bodySmall" tone="muted">对数几率 logit · 任意实数</Typography><Typography shuku-edit-id="e-62834cfc-dea8-4d30-b6b2-b55302e7fd92" variant="h2" tone="accent">{logOdds.toFixed(2)}</Typography><MathFormulaBlock appearance="plain"><MathFormulaTerm latex="\ln\frac{p}{1-p}=z" tooltip="取自然对数抵消指数，恢复上一页的线性分数z。p=0.5对应z=0；概率趋向0或1时，z趋向负或正无穷。"/></MathFormulaBlock></div>
        </div>
        <RangeControl label="调节正类概率 p" min={1} max={99} step={1} value={percent} digits={1} suffix="%" onChange={event=>setPercent(Number(event.currentTarget.value))}/>
      </section>

      <section shuku-edit-id="e-babe842a-0008-4225-ac91-c9b9642ed4fb" className="rl-logit-coefficient">
        <div shuku-edit-id="e-5140297b-a940-4f27-9e57-9241635e5798"><Typography shuku-edit-id="e-c4f579f8-56e1-4938-ab2f-6a8cfc85978c" variant="h3" tone="accent">权重的含义</Typography><Typography shuku-edit-id="e-e9539118-80e5-429b-9b9e-4058f6344125" variant="bodySmall" tone="muted">其他特征不变，xⱼ 增加 1</Typography></div>
        <MathFormulaBlock appearance="plain">
          <MathFormulaTerm latex="\Delta\operatorname{logit}(p)=w_j" tooltip="特征x_j增加一个单位，线性分数及对数几率都增加w_j。变化大小依赖特征的计量单位。" tooltipPlacement="top"/>
          <MathFormulaStatic latex="\quad\Longrightarrow\quad"/>
          <MathFormulaTerm latex="\frac{\mathrm{odds}_{\mathrm{new}}}{\mathrm{odds}_{\mathrm{old}}}=e^{w_j}" tooltip="几率乘以e^(w_j)，概率本身不会乘以这个倍数。例如w_j=ln2时，几率翻倍；p从0.5变成2/3，而不是1。" tooltipPlacement="top"/>
        </MathFormulaBlock>
      </section>
      <div shuku-edit-id="e-91398369-263d-44b2-83d3-5bba6f41b59a" className="rl-logit-next"><Typography shuku-edit-id="e-0791e54c-38d3-4281-86e8-76b95a40edab" variant="bodySmall" tone="muted">《机器学习》§3.3：对数几率回归（Logistic Regression）</Typography><Typography shuku-edit-id="e-b5031536-194b-42bd-974f-3af98e70a6a4" variant="bodySmall" tone="accent">下一步：如何用 0 / 1 标签学习 w 和 b？→ 最大似然</Typography></div>
    </div>
  </ContentBlock>;
}
