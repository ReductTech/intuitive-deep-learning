import outline from '../../outlines.json';
import { MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import { WormholeBenefit, WormholeLessonFrame } from '../../components/WormholeLessonFrame';
import './ProfessionalEducationPage.css';

function Formula({ latex, label }: { latex: string; label: string }) {
  return <MathFormulaBlock appearance="plain" ariaLabel={label}><MathFormulaStatic latex={latex} /></MathFormulaBlock>;
}

export function ProfessionalEducationPage() {
  return <WormholeLessonFrame className="llmpe-cg-pro-page" title={outline.pages.find(page => page.id === '5ebd7132-4f46-483a-a1d6-90d22f87bb1e')!.title} subtitle="直接从时空几何与场方程展开，严谨，但初次接触的门槛更高。" conclusion="从公式开始，学习者可能还没有建立可理解的画面。" sidebar={<>
    <Typography shuku-edit-id="e-42f526e3-a587-4f56-877e-84155009cb74" as="h2" variant="h2" tone="accent" className="llmpe-cg-wormhole-sidebar-title">专业教育的优势与问题</Typography>
    <WormholeBenefit kind="book" title="体系完整">从基本原理到推导</WormholeBenefit>
    <WormholeBenefit kind="formula" title="理论严谨">基于明确的物理框架</WormholeBenefit>
    <WormholeBenefit kind="eye" title="可以深挖">走向更深入的研究</WormholeBenefit>
    <div shuku-edit-id="e-c413025f-1071-46d8-b10f-aa11007524f0" className="llmpe-cg-wormhole-questions"><Typography shuku-edit-id="e-82ae13e2-d4b9-435c-bd3e-bdb76dc5522e" as="h3" variant="h3" tone="inherit">第一次接触时</Typography><Typography shuku-edit-id="e-baa6e2b2-cfa3-429e-97b6-4541d3d38646" variant="bodySmall" tone="inherit">符号与前置知识多<br shuku-edit-id="e-bb6d626e-c780-4c03-b63c-75c25355503b" />难把公式对应到图像</Typography></div>
  </>}>
    <Typography shuku-edit-id="e-df7408a5-be47-483c-970a-5da098bb14cc" as="h2" variant="h2" tone="accent">专业方式讲解虫洞</Typography>
    <div shuku-edit-id="e-e5408e10-ee18-4490-a1f5-c5753da81925" className="llmpe-cg-pro-metric"><Typography shuku-edit-id="e-e0115016-6396-46f1-b252-b53716b410a3" variant="bodySmall" tone="accent">静态球对称 Morris–Thorne 度规</Typography><Formula label="静态球对称虫洞的时空线元" latex={String.raw`ds^2=-e^{2\Phi(r)}c^2dt^2+\frac{dr^2}{1-b(r)/r}+r^2d\Omega^2`} /></div>
    <div shuku-edit-id="e-8ec5e417-4a09-43c2-902f-817ad746bcda" className="llmpe-cg-pro-topics">
      <div shuku-edit-id="e-22d62fc6-ebdc-4178-a69d-167bc09eb7b6"><Typography shuku-edit-id="e-bf89e2a1-5a6c-4354-b867-f649b7a8af38" as="h3" variant="h3" tone="accent">喉部条件</Typography><Formula label="喉部的形状与张开条件" latex={String.raw`\begin{gathered}b(r_0)=r_0\\b'(r_0)<1\end{gathered}`} /></div>
      <div shuku-edit-id="e-54579c96-08c9-44c0-86c1-b8cdeaac51ed"><Typography shuku-edit-id="e-6b0af38d-3239-4d2d-ac31-e5723c015f74" as="h3" variant="h3" tone="accent">无事件视界</Typography><Formula label="红移函数为有限值" latex={String.raw`|\Phi(r)|<\infty`} /></div>
      <div shuku-edit-id="e-26bc1512-898b-4cc6-9f89-c722f78fbf3a"><Typography shuku-edit-id="e-10e10abb-46b5-434e-a92b-22f2175dd9a3" as="h3" variant="h3" tone="accent">物质与几何</Typography><Formula label="无宇宙学常数的爱因斯坦场方程" latex={String.raw`G_{\mu\nu}=\frac{8\pi G}{c^4}T_{\mu\nu}`} /></div>
    </div>
    <div shuku-edit-id="e-f6d3b9b4-6457-41f2-b202-41380913ded8" className="llmpe-cg-pro-flow">{['度规', '喉部几何', '物质条件', '可通过性'].map((label, index) => <div shuku-edit-id="e-2cd34714-fd1f-4286-accd-34f63820c82a" className="llmpe-cg-pro-flow-step" key={label}><Typography shuku-edit-id="e-137285b5-7b91-4764-8523-75f0ac002410" variant="bodySmall" tone="accent">{label}</Typography>{index < 3 && <svg shuku-edit-id="e-b6de6e2d-091b-4bc6-aee7-1d47b64e7e60" viewBox="0 0 30 30" aria-hidden="true"><path shuku-edit-id="e-f62ed7de-2900-4b17-b6fd-2bf2fbdebd5c" d="M3 15h23M18 7l8 8-8 8" fill="none" stroke="currentColor" strokeWidth="2" /></svg>}</div>)}</div>
    <Typography shuku-edit-id="e-c741274a-a2bf-40df-a84f-0a2a7f4e08af" variant="bodySmall" tone="muted" className="llmpe-cg-pro-model-note">这些几何条件还不足以保证稳定、安全地通过虫洞。</Typography>
  </WormholeLessonFrame>;
}

