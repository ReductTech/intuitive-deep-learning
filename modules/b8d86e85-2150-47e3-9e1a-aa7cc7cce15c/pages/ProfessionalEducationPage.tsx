import { MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import { WormholeBenefit, WormholeLessonFrame } from '../components/WormholeLessonFrame';
import './ProfessionalEducationPage.css';

function Formula({ latex, label }: { latex: string; label: string }) {
  return <MathFormulaBlock appearance="plain" ariaLabel={label}><MathFormulaStatic latex={latex} /></MathFormulaBlock>;
}

export function ProfessionalEducationPage() {
  return <WormholeLessonFrame className="cg-pro-page" title="专业教育的问题是什么？" subtitle="直接从时空几何与场方程展开，严谨，但初次接触的门槛更高。" conclusion="从公式开始，学习者可能还没有建立可理解的画面。" sidebar={<>
    <Typography shuku-edit-id="e-38466d7e-398c-4e2e-9155-e2d2a9f9df27" as="h2" variant="h2" tone="accent" className="cg-wormhole-sidebar-title">专业教育的优势与问题</Typography>
    <WormholeBenefit kind="book" title="体系完整">从基本原理到推导</WormholeBenefit>
    <WormholeBenefit kind="formula" title="理论严谨">基于明确的物理框架</WormholeBenefit>
    <WormholeBenefit kind="eye" title="可以深挖">走向更深入的研究</WormholeBenefit>
    <div shuku-edit-id="e-4d3a334e-7778-4358-a3ff-bf1c05da0db4" className="cg-wormhole-questions"><Typography shuku-edit-id="e-3b82e30c-168d-434d-92e0-d95955c70567" as="h3" variant="h3" tone="inherit">第一次接触时</Typography><Typography shuku-edit-id="e-3dfbada7-98a2-4df6-a608-04ec39a502a7" variant="bodySmall" tone="inherit">符号与前置知识多<br shuku-edit-id="e-e11b75c8-6662-4d41-90f0-486b5a0de19e" />难把公式对应到图像</Typography></div>
  </>}>
    <Typography shuku-edit-id="e-d3d9116c-a396-4b74-962b-abdc404ad960" as="h2" variant="h2" tone="accent">专业方式讲解虫洞</Typography>
    <div shuku-edit-id="e-4c9f29f7-3d2c-4bf5-adfd-37afc062ec35" className="cg-pro-metric"><Typography shuku-edit-id="e-9da2a5f9-935a-4160-9b58-093aabcbc3df" variant="bodySmall" tone="accent">静态球对称 Morris–Thorne 度规</Typography><Formula label="静态球对称虫洞的时空线元" latex={String.raw`ds^2=-e^{2\Phi(r)}c^2dt^2+\frac{dr^2}{1-b(r)/r}+r^2d\Omega^2`} /></div>
    <div shuku-edit-id="e-23ee36a2-8f2e-4235-80a7-5e8f912f8ea9" className="cg-pro-topics">
      <div shuku-edit-id="e-616aac63-06e7-4f80-a90a-23a3e49a7f6c"><Typography shuku-edit-id="e-ebe2fdb1-bbc1-424f-b834-8629775e2b05" as="h3" variant="h3" tone="accent">喉部条件</Typography><Formula label="喉部的形状与张开条件" latex={String.raw`\begin{gathered}b(r_0)=r_0\\b'(r_0)<1\end{gathered}`} /></div>
      <div shuku-edit-id="e-dce6cc8d-2f6b-43fd-a24c-0a230ea1bf7c"><Typography shuku-edit-id="e-6375d256-f4bd-4242-9ca7-18e8c3285210" as="h3" variant="h3" tone="accent">无事件视界</Typography><Formula label="红移函数为有限值" latex={String.raw`|\Phi(r)|<\infty`} /></div>
      <div shuku-edit-id="e-f53b401a-0936-4abd-b244-0fc8e9c5eb2e"><Typography shuku-edit-id="e-e437f3b0-d9ab-46c2-a5ef-425c45a35bc5" as="h3" variant="h3" tone="accent">物质与几何</Typography><Formula label="无宇宙学常数的爱因斯坦场方程" latex={String.raw`G_{\mu\nu}=\frac{8\pi G}{c^4}T_{\mu\nu}`} /></div>
    </div>
    <div shuku-edit-id="e-ab13aa30-cc30-4cdc-9e3e-4b8f336798ce" className="cg-pro-flow">{['度规', '喉部几何', '物质条件', '可通过性'].map((label, index) => <div shuku-edit-id="e-7a54eb12-6d79-441c-bfc4-6d73c28b8b30" className="cg-pro-flow-step" key={label}><Typography shuku-edit-id="e-c775ba40-7239-403d-ac82-b29c2db147e3" variant="bodySmall" tone="accent">{label}</Typography>{index < 3 && <svg shuku-edit-id="e-b8a3a070-ae7f-46dc-b3b3-ee6a7fc107b7" viewBox="0 0 30 30" aria-hidden="true"><path shuku-edit-id="e-3a995667-bd18-44e3-933e-6e4d7680c88b" d="M3 15h23M18 7l8 8-8 8" fill="none" stroke="currentColor" strokeWidth="2" /></svg>}</div>)}</div>
    <Typography shuku-edit-id="e-c4a713d7-7a47-4c8a-abcb-dcddc485ed59" variant="bodySmall" tone="muted" className="cg-pro-model-note">这些几何条件还不足以保证稳定、安全地通过虫洞。</Typography>
  </WormholeLessonFrame>;
}

