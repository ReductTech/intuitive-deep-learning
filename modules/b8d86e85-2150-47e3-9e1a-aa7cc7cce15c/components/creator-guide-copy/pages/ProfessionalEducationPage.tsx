import { MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import { WormholeBenefit, WormholeLessonFrame } from '../components/WormholeLessonFrame';
import './ProfessionalEducationPage.css';

function Formula({ latex, label }: { latex: string; label: string }) {
  return <MathFormulaBlock appearance="plain" ariaLabel={label}><MathFormulaStatic latex={latex} /></MathFormulaBlock>;
}

export function ProfessionalEducationPage() {
  return <WormholeLessonFrame className="aipe-replay-cg-pro-page" title="专业教育的问题是什么？" subtitle="直接从时空几何与场方程展开，严谨，但初次接触的门槛更高。" conclusion="从公式开始，学习者可能还没有建立可理解的画面。" sidebar={<>
    <Typography shuku-edit-id="e-96ae3eab-3bcd-45cd-bc27-d6ad9a8c5987" as="h2" variant="h2" tone="accent" className="aipe-replay-cg-wormhole-sidebar-title">专业教育的优势与问题</Typography>
    <WormholeBenefit kind="book" title="体系完整">从基本原理到推导</WormholeBenefit>
    <WormholeBenefit kind="formula" title="理论严谨">基于明确的物理框架</WormholeBenefit>
    <WormholeBenefit kind="eye" title="可以深挖">走向更深入的研究</WormholeBenefit>
    <div shuku-edit-id="e-bcedcd43-181a-4b22-a14b-235d9cbfddf7" className="aipe-replay-cg-wormhole-questions"><Typography shuku-edit-id="e-583c6de0-65c3-4a40-8714-7662bda9a3bd" as="h3" variant="h3" tone="inherit">第一次接触时</Typography><Typography shuku-edit-id="e-62a51ade-c730-4814-bc79-776629f15a3f" variant="bodySmall" tone="inherit">符号与前置知识多<br shuku-edit-id="e-be149a50-23dd-40f5-b870-5597a5371718" />难把公式对应到图像</Typography></div>
  </>}>
    <Typography shuku-edit-id="e-b82836f6-a99c-4e2b-a342-81a4f8e37358" as="h2" variant="h2" tone="accent">专业方式讲解虫洞</Typography>
    <div shuku-edit-id="e-76d831d0-5c6e-4999-9dcd-8b03aa1d7f3e" className="aipe-replay-cg-pro-metric"><Typography shuku-edit-id="e-01d90a63-420f-42f9-a446-bc47067a0838" variant="bodySmall" tone="accent">静态球对称 Morris–Thorne 度规</Typography><Formula label="静态球对称虫洞的时空线元" latex={String.raw`ds^2=-e^{2\Phi(r)}c^2dt^2+\frac{dr^2}{1-b(r)/r}+r^2d\Omega^2`} /></div>
    <div shuku-edit-id="e-6ff4868c-d371-4f09-8583-52c914fbbad7" className="aipe-replay-cg-pro-topics">
      <div shuku-edit-id="e-8ab85c18-5cec-4199-a8b1-dca87b2a9e9b"><Typography shuku-edit-id="e-71e415da-3979-4b90-82ca-ace44dab8186" as="h3" variant="h3" tone="accent">喉部条件</Typography><Formula label="喉部的形状与张开条件" latex={String.raw`\begin{gathered}b(r_0)=r_0\\b'(r_0)<1\end{gathered}`} /></div>
      <div shuku-edit-id="e-a17ca06f-709b-4a85-852a-d0a12ece9297"><Typography shuku-edit-id="e-be0dc402-eb15-4014-b2f4-2f8542355643" as="h3" variant="h3" tone="accent">无事件视界</Typography><Formula label="红移函数为有限值" latex={String.raw`|\Phi(r)|<\infty`} /></div>
      <div shuku-edit-id="e-c4a6b45c-40bf-4ac5-96c2-4cc9cb9807fd"><Typography shuku-edit-id="e-be235d88-3ed4-4983-ba51-bd325a4e07c3" as="h3" variant="h3" tone="accent">物质与几何</Typography><Formula label="无宇宙学常数的爱因斯坦场方程" latex={String.raw`G_{\mu\nu}=\frac{8\pi G}{c^4}T_{\mu\nu}`} /></div>
    </div>
    <div shuku-edit-id="e-69809779-b009-4f56-888e-da1c1500ec5f" className="aipe-replay-cg-pro-flow">{['度规', '喉部几何', '物质条件', '可通过性'].map((label, index) => <div shuku-edit-id="e-88757a66-b8bf-4a3a-9a93-90e98e4cbd17" className="aipe-replay-cg-pro-flow-step" key={label}><Typography shuku-edit-id="e-2a761442-aa6d-4ab6-b598-e125c458d5b3" variant="bodySmall" tone="accent">{label}</Typography>{index < 3 && <svg shuku-edit-id="e-97c0b3a3-bdae-4514-a610-3a86595a2e3c" viewBox="0 0 30 30" aria-hidden="true"><path shuku-edit-id="e-e806cb94-a149-471d-aefe-d43a60887c6e" d="M3 15h23M18 7l8 8-8 8" fill="none" stroke="currentColor" strokeWidth="2" /></svg>}</div>)}</div>
    <Typography shuku-edit-id="e-c92542b1-d3f1-4cc1-8980-afb929ba0f9e" variant="bodySmall" tone="muted" className="aipe-replay-cg-pro-model-note">这些几何条件还不足以保证稳定、安全地通过虫洞。</Typography>
  </WormholeLessonFrame>;
}

