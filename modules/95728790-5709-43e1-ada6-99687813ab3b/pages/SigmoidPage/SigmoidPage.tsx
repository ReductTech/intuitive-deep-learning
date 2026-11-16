import { useState } from 'react';
import { Tips } from '@icon-park/react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaTerm, Typography } from "@shuku/course-style/react";
import { SigmoidPlot } from './SigmoidPlot';
import './SigmoidPage.css';

export function SigmoidPage() {
  const [z, setZ] = useState(0);
  const [classification, setClassification] = useState(false);
  return <ContentBlock shuku-edit-id="e-2087020e-acc6-44ac-9330-993e8ad2d811" headingLevel={1} title="逻辑回归的概率预测与类别判定" subtitle="由对数几率模型反解概率，得到 Sigmoid 映射。" className="rl-sig-page">
    <div shuku-edit-id="e-893339cf-3dc2-4a2d-8f22-75c6532784c3" className="rl-sig-layout">
      <section shuku-edit-id="e-a6b7bfbb-0243-4450-a9b2-9d20a901c42f" className="rl-sig-derivation" aria-label="由对数几率模型反解概率">
        <Typography shuku-edit-id="e-020bc0b8-80a5-4089-9ad2-7345191aa6aa" variant="bodySmall" tone="accent">反解概率</Typography>
        <div shuku-edit-id="e-6fb19e42-419e-4795-9ee4-e7799f211f80" className="rl-sig-derivation-flow">
          <MathFormulaBlock appearance="plain" className="rl-sig-derivation-start"><MathFormulaTerm latex="\ln\frac{p}{1-p}=z" tooltip="承接上一页：逻辑回归将正类概率的对数几率建模为线性分数z。" /></MathFormulaBlock>
          <div shuku-edit-id="e-eb56985b-472c-49a6-9200-55d1cc12c236" className="rl-sig-derivation-arrow"><Typography shuku-edit-id="e-63ff53c2-09e8-4d3d-a9a2-d41dc5cd021a" variant="bodySmall" tone="muted" wrap="nowrap">两边取指数</Typography><span shuku-edit-id="e-4b477f09-0df1-4587-95b5-9ae503299fb4" aria-hidden="true" /></div>
          <div shuku-edit-id="e-275357a4-463f-4cc7-97c2-ab007babccfa" className="rl-sig-derivation-middle">
            <MathFormulaBlock appearance="plain"><MathFormulaTerm latex="\frac{p}{1-p}=e^z" tooltip="自然对数与以e为底的指数互为逆运算。两边取指数后，左边恢复为几率。" /></MathFormulaBlock>
            <MathFormulaBlock appearance="plain"><MathFormulaTerm latex="p=e^z(1-p)" tooltip="两边乘以1-p。对有限线性分数，概率严格介于0和1之间，因此1-p不为零。" /></MathFormulaBlock>
          </div>
          <div shuku-edit-id="e-f19fd914-f14e-410f-b6fb-2507bc090cce" className="rl-sig-derivation-arrow"><Typography shuku-edit-id="e-a9ceb8c4-4b52-447f-b91e-cb35c5f968f9" variant="bodySmall" tone="muted" wrap="nowrap">移项并整理</Typography><span shuku-edit-id="e-ef62eb94-d743-42a8-86f3-baccbab41862" aria-hidden="true" /></div>
          <div shuku-edit-id="e-abce7e2d-a65b-452d-87cd-d9826e69ca5f" className="rl-sig-derivation-result"><MathFormulaBlock appearance="plain"><MathFormulaTerm latex="p=\frac{e^z}{1+e^z}=\frac{1}{1+e^{-z}}" tooltip="展开得到p=e^z-e^zp；移项得p(1+e^z)=e^z。除以1+e^z，再将分子分母同除以e^z，就得到Sigmoid。" /></MathFormulaBlock><Typography shuku-edit-id="e-cf38418a-49ac-4ffb-b8b9-6138480aea2c" variant="bodySmall" tone="inherit" align="center">Sigmoid</Typography></div>
        </div>
      </section>
      <section shuku-edit-id="e-df6e461d-ad26-4ee7-8e84-58a62b8374cd" className="rl-sig-visual"><div shuku-edit-id="e-85211c5d-3ab7-4654-bbe4-09c5112750e3" className="rl-sig-class-toggle"><Button aria-pressed={classification} onClick={()=>setClassification(value=>!value)}>{classification?'隐藏分类判定':'显示分类判定'}</Button></div><SigmoidPlot z={z} onChange={setZ} classification={classification}/></section>
      <div shuku-edit-id="e-406ba62e-e737-485f-ace8-dafc7f744d8c" className="rl-sig-conclusion"><div shuku-edit-id="e-fbd04393-110a-4953-8984-530601fbcea1" className="rl-sig-model"><MathFormulaBlock appearance="plain"><MathFormulaTerm latex="z=\mathbf w^\top\mathbf x+b" tooltip="输入特征与权重的内积，加偏置，得到线性分数z。" tooltipPlacement="top"/></MathFormulaBlock></div><div shuku-edit-id="e-e35c0a9b-3c55-4a3a-bfcf-e177a7d7c0d5"><span shuku-edit-id="e-c9f7d900-c7a9-40ee-83c7-e4082dd2d186" aria-hidden="true"><Tips theme="two-tone" size={52} fill={['#009eaa','#d5f5ee']} strokeWidth={3}/></span><Typography shuku-edit-id="e-f4181d87-59e7-44d6-9670-127e315691ea" variant="h3" tone="accent">线性分数 → 类别概率 → 类别判定。</Typography></div></div>
    </div>
  </ContentBlock>;
}
