import { useState } from 'react';
import { Tips } from '@icon-park/react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaTerm, Typography } from '../../../shared/react';
import { SigmoidPlot } from './SigmoidPlot';
import './SigmoidPage.css';

export function SigmoidPage() {
  const [z, setZ] = useState(0);
  const [classification, setClassification] = useState(false);
  return <ContentBlock headingLevel={1} title="逻辑回归的概率预测与类别判定" subtitle="由对数几率模型反解概率，得到 Sigmoid 映射。" className="rl-sig-page">
    <div className="rl-sig-layout">
      <section className="rl-sig-derivation" aria-label="由对数几率模型反解概率">
        <Typography variant="bodySmall" tone="accent">反解概率</Typography>
        <div className="rl-sig-derivation-flow">
          <MathFormulaBlock appearance="plain" className="rl-sig-derivation-start"><MathFormulaTerm latex="\ln\frac{p}{1-p}=z" tooltip="承接上一页：逻辑回归将正类概率的对数几率建模为线性分数z。" /></MathFormulaBlock>
          <div className="rl-sig-derivation-arrow"><Typography variant="bodySmall" tone="muted" wrap="nowrap">两边取指数</Typography><span aria-hidden="true" /></div>
          <div className="rl-sig-derivation-middle">
            <MathFormulaBlock appearance="plain"><MathFormulaTerm latex="\frac{p}{1-p}=e^z" tooltip="自然对数与以e为底的指数互为逆运算。两边取指数后，左边恢复为几率。" /></MathFormulaBlock>
            <MathFormulaBlock appearance="plain"><MathFormulaTerm latex="p=e^z(1-p)" tooltip="两边乘以1-p。对有限线性分数，概率严格介于0和1之间，因此1-p不为零。" /></MathFormulaBlock>
          </div>
          <div className="rl-sig-derivation-arrow"><Typography variant="bodySmall" tone="muted" wrap="nowrap">移项并整理</Typography><span aria-hidden="true" /></div>
          <div className="rl-sig-derivation-result"><MathFormulaBlock appearance="plain"><MathFormulaTerm latex="p=\frac{e^z}{1+e^z}=\frac{1}{1+e^{-z}}" tooltip="展开得到p=e^z-e^zp；移项得p(1+e^z)=e^z。除以1+e^z，再将分子分母同除以e^z，就得到Sigmoid。" /></MathFormulaBlock><Typography variant="bodySmall" tone="inherit" align="center">Sigmoid</Typography></div>
        </div>
      </section>
      <section className="rl-sig-visual"><div className="rl-sig-class-toggle"><Button aria-pressed={classification} onClick={()=>setClassification(value=>!value)}>{classification?'隐藏分类判定':'显示分类判定'}</Button></div><SigmoidPlot z={z} onChange={setZ} classification={classification}/></section>
      <div className="rl-sig-conclusion"><div className="rl-sig-model"><MathFormulaBlock appearance="plain"><MathFormulaTerm latex="z=\mathbf w^\top\mathbf x+b" tooltip="输入特征与权重的内积，加偏置，得到线性分数z。" tooltipPlacement="top"/></MathFormulaBlock></div><div><span aria-hidden="true"><Tips theme="two-tone" size={52} fill={['#009eaa','#d5f5ee']} strokeWidth={3}/></span><Typography variant="h3" tone="accent">线性分数 → 类别概率 → 类别判定。</Typography></div></div>
    </div>
  </ContentBlock>;
}
