import { MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import { WormholeBenefit, WormholeLessonFrame } from '../components/WormholeLessonFrame';
import './ProfessionalEducationPage.css';

function Formula({ latex, label }: { latex: string; label: string }) {
  return <MathFormulaBlock appearance="plain" ariaLabel={label}><MathFormulaStatic latex={latex} /></MathFormulaBlock>;
}

export function ProfessionalEducationPage() {
  return <WormholeLessonFrame className="cg-pro-page" title="专业教育的问题是什么？" subtitle="直接从时空几何与场方程展开，严谨，但初次接触的门槛更高。" conclusion="从公式开始，学习者可能还没有建立可理解的画面。" sidebar={<>
    <Typography shuku-edit-id="e-a18cf796-9daf-4709-a3a3-20408b801eda" as="h2" variant="h2" tone="accent" className="cg-wormhole-sidebar-title">专业教育的优势与问题</Typography>
    <WormholeBenefit kind="book" title="体系完整">从基本原理到推导</WormholeBenefit>
    <WormholeBenefit kind="formula" title="理论严谨">基于明确的物理框架</WormholeBenefit>
    <WormholeBenefit kind="eye" title="可以深挖">走向更深入的研究</WormholeBenefit>
    <div shuku-edit-id="e-a033c55a-8dc4-4152-a1d0-b377a82b420d" className="cg-wormhole-questions"><Typography shuku-edit-id="e-809bfffe-5f9d-4b24-95e5-cabee03b1dd1" as="h3" variant="h3" tone="inherit">第一次接触时</Typography><Typography shuku-edit-id="e-1dcc5ccd-4c74-424e-ae77-d975e3b2d7e7" variant="bodySmall" tone="inherit">符号与前置知识多<br shuku-edit-id="e-4356a148-e047-49b2-8e06-195c9880babc" />难把公式对应到图像</Typography></div>
  </>}>
    <Typography shuku-edit-id="e-0d8f244c-82d0-4c0b-b4ad-15f94ec09e71" as="h2" variant="h2" tone="accent">专业方式讲解虫洞</Typography>
    <div shuku-edit-id="e-f99c3b30-3229-4db5-b76a-0335eb216949" className="cg-pro-metric"><Typography shuku-edit-id="e-6bae7cce-477b-48a7-8a54-1dc6ff6f10a7" variant="bodySmall" tone="accent">静态球对称 Morris–Thorne 度规</Typography><Formula label="静态球对称虫洞的时空线元" latex={String.raw`ds^2=-e^{2\Phi(r)}c^2dt^2+\frac{dr^2}{1-b(r)/r}+r^2d\Omega^2`} /></div>
    <div shuku-edit-id="e-b87d8665-4c5f-4312-bd47-3d3d750dcd89" className="cg-pro-topics">
      <div shuku-edit-id="e-4553fbaf-3d27-4768-a3fe-baf1363db42b"><Typography shuku-edit-id="e-bd89e069-a1b9-4b09-a900-98897c0b2417" as="h3" variant="h3" tone="accent">喉部条件</Typography><Formula label="喉部的形状与张开条件" latex={String.raw`\begin{gathered}b(r_0)=r_0\\b'(r_0)<1\end{gathered}`} /></div>
      <div shuku-edit-id="e-f97ea34b-4637-45e9-84d9-c5219df84694"><Typography shuku-edit-id="e-e9b1180b-c1fa-4015-8565-143ebcf134ba" as="h3" variant="h3" tone="accent">无事件视界</Typography><Formula label="红移函数为有限值" latex={String.raw`|\Phi(r)|<\infty`} /></div>
      <div shuku-edit-id="e-0f22963a-da5f-4eab-8d44-272bebbffcfc"><Typography shuku-edit-id="e-d8e9595d-e786-4a29-b3d0-2344340c49e0" as="h3" variant="h3" tone="accent">物质与几何</Typography><Formula label="无宇宙学常数的爱因斯坦场方程" latex={String.raw`G_{\mu\nu}=\frac{8\pi G}{c^4}T_{\mu\nu}`} /></div>
    </div>
    <div shuku-edit-id="e-37f05799-7014-42a5-ada5-7d8e55fafa50" className="cg-pro-flow">{['度规', '喉部几何', '物质条件', '可通过性'].map((label, index) => <div shuku-edit-id="e-b85c8c5e-07d2-4e49-93ff-af1926e581b4" className="cg-pro-flow-step" key={label}><Typography shuku-edit-id="e-24c9ff00-7052-4727-bce9-9fe3a1b9c62d" variant="bodySmall" tone="accent">{label}</Typography>{index < 3 && <svg shuku-edit-id="e-60a0ebd1-5f52-4802-a86f-f608fcf8137a" viewBox="0 0 30 30" aria-hidden="true"><path shuku-edit-id="e-92a2e746-27b2-4d3c-98a8-659cb9075444" d="M3 15h23M18 7l8 8-8 8" fill="none" stroke="currentColor" strokeWidth="2" /></svg>}</div>)}</div>
    <Typography shuku-edit-id="e-0ef12cb1-583f-4de4-a075-77b0f4aa237f" variant="bodySmall" tone="muted" className="cg-pro-model-note">这些几何条件还不足以保证稳定、安全地通过虫洞。</Typography>
  </WormholeLessonFrame>;
}

