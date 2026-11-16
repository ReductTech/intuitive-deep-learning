import outline from '../../outlines.json';
import { MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import { WormholeBenefit, WormholeLessonFrame } from '../../components/WormholeLessonFrame';
import './ProfessionalEducationPage.css';

function Formula({ latex, label }: { latex: string; label: string }) {
  return <MathFormulaBlock appearance="plain" ariaLabel={label}><MathFormulaStatic latex={latex} /></MathFormulaBlock>;
}

export function ProfessionalEducationPage() {
  return <WormholeLessonFrame className="llmpe-cg-pro-page" title={outline.pages.find(page => page.id === '3b2b1ca6-6e33-4ef8-965a-0c6077b374e4')!.title} subtitle="直接从时空几何与场方程展开，严谨，但初次接触的门槛更高。" conclusion="从公式开始，学习者可能还没有建立可理解的画面。" sidebar={<>
    <Typography shuku-edit-id="e-e12788b4-5594-4213-bde3-1c9382e7b96d" as="h2" variant="h2" tone="accent" className="llmpe-cg-wormhole-sidebar-title">专业教育的优势与问题</Typography>
    <WormholeBenefit kind="book" title="体系完整">从基本原理到推导</WormholeBenefit>
    <WormholeBenefit kind="formula" title="理论严谨">基于明确的物理框架</WormholeBenefit>
    <WormholeBenefit kind="eye" title="可以深挖">走向更深入的研究</WormholeBenefit>
    <div shuku-edit-id="e-f5a49198-2f50-4ce0-8cb8-a28fa9c3c5e3" className="llmpe-cg-wormhole-questions"><Typography shuku-edit-id="e-5ed97279-b8b8-4980-b704-5b48fca1d981" as="h3" variant="h3" tone="inherit">第一次接触时</Typography><Typography shuku-edit-id="e-e2bd1a8c-cc58-4e62-bac0-55caab958590" variant="bodySmall" tone="inherit">符号与前置知识多<br shuku-edit-id="e-ad19894d-3fa9-47f0-9e57-7112d3f876e0" />难把公式对应到图像</Typography></div>
  </>}>
    <Typography shuku-edit-id="e-f2cef313-e89d-4182-af4a-bd10da8ff8ba" as="h2" variant="h2" tone="accent">专业方式讲解虫洞</Typography>
    <div shuku-edit-id="e-41184ab3-420c-49a6-abfa-ed21f98afd49" className="llmpe-cg-pro-metric"><Typography shuku-edit-id="e-617ad6e3-ddf2-4dd3-bfd0-e256b5a5a1e9" variant="bodySmall" tone="accent">静态球对称 Morris–Thorne 度规</Typography><Formula label="静态球对称虫洞的时空线元" latex={String.raw`ds^2=-e^{2\Phi(r)}c^2dt^2+\frac{dr^2}{1-b(r)/r}+r^2d\Omega^2`} /></div>
    <div shuku-edit-id="e-b34e3aa0-52fb-4456-9420-0585f8f127bd" className="llmpe-cg-pro-topics">
      <div shuku-edit-id="e-fe27c042-3b6a-4dd2-a724-c70a314692b3"><Typography shuku-edit-id="e-7b09a479-6a45-465c-b1a0-9ec0d4e2d8b0" as="h3" variant="h3" tone="accent">喉部条件</Typography><Formula label="喉部的形状与张开条件" latex={String.raw`\begin{gathered}b(r_0)=r_0\\b'(r_0)<1\end{gathered}`} /></div>
      <div shuku-edit-id="e-97c7b60e-bf06-4db6-bd2d-532b7ad26246"><Typography shuku-edit-id="e-67099bb7-ba88-4fb4-87df-ce2b9d212f09" as="h3" variant="h3" tone="accent">无事件视界</Typography><Formula label="红移函数为有限值" latex={String.raw`|\Phi(r)|<\infty`} /></div>
      <div shuku-edit-id="e-5b496ad2-8a1d-4ef6-8733-aea4b6fe54f7"><Typography shuku-edit-id="e-096d3527-901d-465d-ad59-bf0f5ae70edb" as="h3" variant="h3" tone="accent">物质与几何</Typography><Formula label="无宇宙学常数的爱因斯坦场方程" latex={String.raw`G_{\mu\nu}=\frac{8\pi G}{c^4}T_{\mu\nu}`} /></div>
    </div>
    <div shuku-edit-id="e-3ba81b8c-897e-4a38-9cff-c4e5955f5ef3" className="llmpe-cg-pro-flow">{['度规', '喉部几何', '物质条件', '可通过性'].map((label, index) => <div shuku-edit-id="e-a67526bc-d13e-4618-b943-08db0893f48b" className="llmpe-cg-pro-flow-step" key={label}><Typography shuku-edit-id="e-5b5f1092-5115-4ee3-9e3f-6f67ccb02e6f" variant="bodySmall" tone="accent">{label}</Typography>{index < 3 && <svg shuku-edit-id="e-28037554-60c6-44d7-8bb9-110eb125871b" viewBox="0 0 30 30" aria-hidden="true"><path shuku-edit-id="e-c7331a1d-f578-4fe2-99b0-38aaf938148d" d="M3 15h23M18 7l8 8-8 8" fill="none" stroke="currentColor" strokeWidth="2" /></svg>}</div>)}</div>
    <Typography shuku-edit-id="e-c952aa14-f521-4b8b-8a5f-857a7fab20f9" variant="bodySmall" tone="muted" className="llmpe-cg-pro-model-note">这些几何条件还不足以保证稳定、安全地通过虫洞。</Typography>
  </WormholeLessonFrame>;
}

