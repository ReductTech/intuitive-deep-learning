import { MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import { WormholeBenefit, WormholeLessonFrame } from '../components/WormholeLessonFrame';
import './ProfessionalEducationPage.css';

function Formula({ latex, label }: { latex: string; label: string }) {
  return <MathFormulaBlock appearance="plain" ariaLabel={label}><MathFormulaStatic latex={latex} /></MathFormulaBlock>;
}

export function ProfessionalEducationPage() {
  return <WormholeLessonFrame className="cg-pro-page" title="专业教育的问题是什么？" subtitle="直接从时空几何与场方程展开，严谨，但初次接触的门槛更高。" conclusion="从公式开始，学习者可能还没有建立可理解的画面。" sidebar={<>
    <Typography shuku-edit-id="e-b4256f25-397b-4b3c-bd07-955e8bb7be17" as="h2" variant="h2" tone="accent" className="cg-wormhole-sidebar-title">专业教育的优势与问题</Typography>
    <WormholeBenefit kind="book" title="体系完整">从基本原理到推导</WormholeBenefit>
    <WormholeBenefit kind="formula" title="理论严谨">基于明确的物理框架</WormholeBenefit>
    <WormholeBenefit kind="eye" title="可以深挖">走向更深入的研究</WormholeBenefit>
    <div shuku-edit-id="e-61b51908-c6f7-4126-9255-ce122a1442ad" className="cg-wormhole-questions"><Typography shuku-edit-id="e-f6c28248-0617-45e3-8092-1c67b4b048e8" as="h3" variant="h3" tone="inherit">第一次接触时</Typography><Typography shuku-edit-id="e-8a5950c1-c969-4379-84d5-a389792d12cd" variant="bodySmall" tone="inherit">符号与前置知识多<br shuku-edit-id="e-950bca1b-b493-45c6-a79b-1b45e6d2e0a6" />难把公式对应到图像</Typography></div>
  </>}>
    <Typography shuku-edit-id="e-e8e2c826-780b-4baf-a67b-8d770e55e592" as="h2" variant="h2" tone="accent">专业方式讲解虫洞</Typography>
    <div shuku-edit-id="e-a2c9a7d2-5c26-4bac-8386-d0d46f375b7d" className="cg-pro-metric"><Typography shuku-edit-id="e-67cec585-31d9-41c5-89e5-35bcdb17c9bd" variant="bodySmall" tone="accent">静态球对称 Morris–Thorne 度规</Typography><Formula label="静态球对称虫洞的时空线元" latex={String.raw`ds^2=-e^{2\Phi(r)}c^2dt^2+\frac{dr^2}{1-b(r)/r}+r^2d\Omega^2`} /></div>
    <div shuku-edit-id="e-9d757f67-0f61-4e3a-bef9-4f1950b53d3c" className="cg-pro-topics">
      <div shuku-edit-id="e-2da949cb-e839-49a0-b4a8-3db3226aa8a0"><Typography shuku-edit-id="e-e55d947e-dafa-47e2-8982-6e8f99b8ea25" as="h3" variant="h3" tone="accent">喉部条件</Typography><Formula label="喉部的形状与张开条件" latex={String.raw`\begin{gathered}b(r_0)=r_0\\b'(r_0)<1\end{gathered}`} /></div>
      <div shuku-edit-id="e-118c031e-92d2-4134-86b4-ae25ba25639b"><Typography shuku-edit-id="e-4da9ca0c-2de0-4d18-b42d-e3444d2dd801" as="h3" variant="h3" tone="accent">无事件视界</Typography><Formula label="红移函数为有限值" latex={String.raw`|\Phi(r)|<\infty`} /></div>
      <div shuku-edit-id="e-0ca76d95-df12-4840-85c0-f0672c489a99"><Typography shuku-edit-id="e-bf06dd4e-ece1-4ac6-94af-10210f094e28" as="h3" variant="h3" tone="accent">物质与几何</Typography><Formula label="无宇宙学常数的爱因斯坦场方程" latex={String.raw`G_{\mu\nu}=\frac{8\pi G}{c^4}T_{\mu\nu}`} /></div>
    </div>
    <div shuku-edit-id="e-9cf1a0fd-5379-487d-bd4e-14b9ca60e939" className="cg-pro-flow">{['度规', '喉部几何', '物质条件', '可通过性'].map((label, index) => <div shuku-edit-id="e-c0c9e93a-397e-47a2-b477-e66b2af62a72" className="cg-pro-flow-step" key={label}><Typography shuku-edit-id="e-a17dc9b6-a7f7-4936-a2d7-88f0916a984b" variant="bodySmall" tone="accent">{label}</Typography>{index < 3 && <svg shuku-edit-id="e-a2cb97b5-7038-461b-b09e-1c3a1cb0478c" viewBox="0 0 30 30" aria-hidden="true"><path shuku-edit-id="e-6561f57e-0741-4e09-b5b3-91a8d7da7e3e" d="M3 15h23M18 7l8 8-8 8" fill="none" stroke="currentColor" strokeWidth="2" /></svg>}</div>)}</div>
    <Typography shuku-edit-id="e-cd80e084-c749-4f04-a759-7f547cfb43ed" variant="bodySmall" tone="muted" className="cg-pro-model-note">这些几何条件还不足以保证稳定、安全地通过虫洞。</Typography>
  </WormholeLessonFrame>;
}

