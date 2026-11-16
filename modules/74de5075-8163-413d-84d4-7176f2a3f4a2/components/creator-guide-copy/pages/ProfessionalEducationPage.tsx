import { MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import { WormholeBenefit, WormholeLessonFrame } from '../components/WormholeLessonFrame';
import './ProfessionalEducationPage.css';

function Formula({ latex, label }: { latex: string; label: string }) {
  return <MathFormulaBlock appearance="plain" ariaLabel={label}><MathFormulaStatic latex={latex} /></MathFormulaBlock>;
}

export function ProfessionalEducationPage() {
  return <WormholeLessonFrame className="aipe-replay-cg-pro-page" title="专业教育的问题是什么？" subtitle="直接从时空几何与场方程展开，严谨，但初次接触的门槛更高。" conclusion="从公式开始，学习者可能还没有建立可理解的画面。" sidebar={<>
    <Typography shuku-edit-id="e-1ad211b2-1a5e-4441-a7d4-03719679d070" as="h2" variant="h2" tone="accent" className="aipe-replay-cg-wormhole-sidebar-title">专业教育的优势与问题</Typography>
    <WormholeBenefit kind="book" title="体系完整">从基本原理到推导</WormholeBenefit>
    <WormholeBenefit kind="formula" title="理论严谨">基于明确的物理框架</WormholeBenefit>
    <WormholeBenefit kind="eye" title="可以深挖">走向更深入的研究</WormholeBenefit>
    <div shuku-edit-id="e-bb9c05c1-04b7-415a-94f5-6ff570a94a27" className="aipe-replay-cg-wormhole-questions"><Typography shuku-edit-id="e-79f55723-97c0-4f0a-94b5-78ae5a4b0a78" as="h3" variant="h3" tone="inherit">第一次接触时</Typography><Typography shuku-edit-id="e-05a5b3ce-de5e-4a00-82da-86d686c747be" variant="bodySmall" tone="inherit">符号与前置知识多<br shuku-edit-id="e-379cc193-d61a-4847-b443-0418c16b3356" />难把公式对应到图像</Typography></div>
  </>}>
    <Typography shuku-edit-id="e-600e03f8-19ea-45b8-8955-539024f1b7de" as="h2" variant="h2" tone="accent">专业方式讲解虫洞</Typography>
    <div shuku-edit-id="e-a205d54a-5b88-45f0-9d64-64bc233de76f" className="aipe-replay-cg-pro-metric"><Typography shuku-edit-id="e-f1e40d6a-ef09-46d0-bba7-78141389d0a6" variant="bodySmall" tone="accent">静态球对称 Morris–Thorne 度规</Typography><Formula label="静态球对称虫洞的时空线元" latex={String.raw`ds^2=-e^{2\Phi(r)}c^2dt^2+\frac{dr^2}{1-b(r)/r}+r^2d\Omega^2`} /></div>
    <div shuku-edit-id="e-a97747c0-df8e-4d8e-a755-de6b70046f70" className="aipe-replay-cg-pro-topics">
      <div shuku-edit-id="e-444e64e1-9a92-4754-b8df-42dd29fb85fb"><Typography shuku-edit-id="e-72073f22-7f71-44ee-b77d-8bba5eb337e2" as="h3" variant="h3" tone="accent">喉部条件</Typography><Formula label="喉部的形状与张开条件" latex={String.raw`\begin{gathered}b(r_0)=r_0\\b'(r_0)<1\end{gathered}`} /></div>
      <div shuku-edit-id="e-4ed2cac6-c6b1-4b9f-988f-e15db730945d"><Typography shuku-edit-id="e-28d5b60a-e444-4e94-8796-93a9862d6454" as="h3" variant="h3" tone="accent">无事件视界</Typography><Formula label="红移函数为有限值" latex={String.raw`|\Phi(r)|<\infty`} /></div>
      <div shuku-edit-id="e-b569d8af-9ca8-4b30-9e6f-e9a570222c13"><Typography shuku-edit-id="e-b9c3c9ca-ec8b-43a9-8162-0858e3e1826b" as="h3" variant="h3" tone="accent">物质与几何</Typography><Formula label="无宇宙学常数的爱因斯坦场方程" latex={String.raw`G_{\mu\nu}=\frac{8\pi G}{c^4}T_{\mu\nu}`} /></div>
    </div>
    <div shuku-edit-id="e-cd297303-f796-452d-b6d8-a9b240edfb61" className="aipe-replay-cg-pro-flow">{['度规', '喉部几何', '物质条件', '可通过性'].map((label, index) => <div shuku-edit-id="e-e441af89-5daa-41d0-b9b0-ebfd4f20c789" className="aipe-replay-cg-pro-flow-step" key={label}><Typography shuku-edit-id="e-ae6dc7ed-0440-45c9-9f87-cdced9c792f6" variant="bodySmall" tone="accent">{label}</Typography>{index < 3 && <svg shuku-edit-id="e-0bbd3c95-8e1b-4d0d-9a39-6e39eb90b9b1" viewBox="0 0 30 30" aria-hidden="true"><path shuku-edit-id="e-60f54ad2-4174-4d94-8217-ef9f35f11b90" d="M3 15h23M18 7l8 8-8 8" fill="none" stroke="currentColor" strokeWidth="2" /></svg>}</div>)}</div>
    <Typography shuku-edit-id="e-caf7428c-5e72-4c25-a79c-c5eccf1eb0e7" variant="bodySmall" tone="muted" className="aipe-replay-cg-pro-model-note">这些几何条件还不足以保证稳定、安全地通过虫洞。</Typography>
  </WormholeLessonFrame>;
}

