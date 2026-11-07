import { MathFormulaBlock, MathFormulaStatic, Typography } from '../../../../shared/react';
import { WormholeBenefit, WormholeLessonFrame } from '../components/WormholeLessonFrame';
import './ProfessionalEducationPage.css';

function Formula({ latex, label }: { latex: string; label: string }) {
  return <MathFormulaBlock appearance="plain" ariaLabel={label}><MathFormulaStatic latex={latex} /></MathFormulaBlock>;
}

export function ProfessionalEducationPage() {
  return <WormholeLessonFrame className="aipe-replay-cg-pro-page" title="专业教育的问题是什么？" subtitle="直接从时空几何与场方程展开，严谨，但初次接触的门槛更高。" conclusion="从公式开始，学习者可能还没有建立可理解的画面。" sidebar={<>
    <Typography as="h2" variant="h2" tone="accent" className="aipe-replay-cg-wormhole-sidebar-title">专业教育的优势与问题</Typography>
    <WormholeBenefit kind="book" title="体系完整">从基本原理到推导</WormholeBenefit>
    <WormholeBenefit kind="formula" title="理论严谨">基于明确的物理框架</WormholeBenefit>
    <WormholeBenefit kind="eye" title="可以深挖">走向更深入的研究</WormholeBenefit>
    <div className="aipe-replay-cg-wormhole-questions"><Typography as="h3" variant="h3" tone="inherit">第一次接触时</Typography><Typography variant="bodySmall" tone="inherit">符号与前置知识多<br />难把公式对应到图像</Typography></div>
  </>}>
    <Typography as="h2" variant="h2" tone="accent">专业方式讲解虫洞</Typography>
    <div className="aipe-replay-cg-pro-metric"><Typography variant="bodySmall" tone="accent">静态球对称 Morris–Thorne 度规</Typography><Formula label="静态球对称虫洞的时空线元" latex={String.raw`ds^2=-e^{2\Phi(r)}c^2dt^2+\frac{dr^2}{1-b(r)/r}+r^2d\Omega^2`} /></div>
    <div className="aipe-replay-cg-pro-topics">
      <div><Typography as="h3" variant="h3" tone="accent">喉部条件</Typography><Formula label="喉部的形状与张开条件" latex={String.raw`\begin{gathered}b(r_0)=r_0\\b'(r_0)<1\end{gathered}`} /></div>
      <div><Typography as="h3" variant="h3" tone="accent">无事件视界</Typography><Formula label="红移函数为有限值" latex={String.raw`|\Phi(r)|<\infty`} /></div>
      <div><Typography as="h3" variant="h3" tone="accent">物质与几何</Typography><Formula label="无宇宙学常数的爱因斯坦场方程" latex={String.raw`G_{\mu\nu}=\frac{8\pi G}{c^4}T_{\mu\nu}`} /></div>
    </div>
    <div className="aipe-replay-cg-pro-flow">{['度规', '喉部几何', '物质条件', '可通过性'].map((label, index) => <div className="aipe-replay-cg-pro-flow-step" key={label}><Typography variant="bodySmall" tone="accent">{label}</Typography>{index < 3 && <svg viewBox="0 0 30 30" aria-hidden="true"><path d="M3 15h23M18 7l8 8-8 8" fill="none" stroke="currentColor" strokeWidth="2" /></svg>}</div>)}</div>
    <Typography variant="bodySmall" tone="muted" className="aipe-replay-cg-pro-model-note">这些几何条件还不足以保证稳定、安全地通过虫洞。</Typography>
  </WormholeLessonFrame>;
}

