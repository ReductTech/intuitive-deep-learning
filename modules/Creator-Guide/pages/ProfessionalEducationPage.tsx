import { MathFormulaBlock, MathFormulaStatic, Typography } from '../../shared/react';
import './ProfessionalEducationPage.css';

function Formula({ latex, label }: { latex: string; label: string }) {
  return <MathFormulaBlock appearance="plain" ariaLabel={label}><MathFormulaStatic latex={latex} /></MathFormulaBlock>;
}
function ProIcon({ kind }: { kind: 'tree' | 'flask' | 'bars' | 'book' | 'eye' | 'tangle' | 'target' }) {
  const paths = {
    tree: 'M12 2h8v8h-8ZM16 10v7M4 17h24M4 17v7M16 17v7M28 17v7M0 24h8v8H0ZM12 24h8v8h-8ZM24 24h8v8h-8Z',
    flask: 'M10 2h12M12 2v11L3 29a2 2 0 0 0 2 3h22a2 2 0 0 0 2-3l-9-16V2M7 22h18M13 17h.01M20 26h.01',
    bars: 'M3 22h6v10H3ZM13 13h6v19h-6ZM23 2h6v30h-6Z',
    book: 'M16 7C10 3 4 4 1 6v24c5-3 10-2 15 1V7ZM16 7c6-4 12-3 15-1v24c-5-3-10-2-15 1V7Z',
    eye: 'M0 16S6 5 16 5s16 11 16 11-6 11-16 11S0 16 0 16ZM16 10a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z',
    tangle: 'M2 12c0-14 29-14 29 0S2 35 2 20 19-2 27 12 13 38 5 23 8 0 22 7s12 26-6 26S-2 12 12 7s27 8 13 19S0 26 2 12Z',
    target: 'M28 8a14 14 0 1 0 3 7M23 11a8 8 0 1 0 2 6M16 17 31 2M25 2h6v6',
  };
  return <svg viewBox="-3 -3 38 38" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d={paths[kind]}/></svg>;
}
function Topic({ title, latex, label, detail, className = '' }: { title: string; latex: string; label: string; detail: string; className?: string }) {
  return <div className={`cg-pro-topic ${className}`}><Typography variant="bodySmall" tone="inherit" className="cg-pro-topic-title">{title}</Typography><div className="cg-pro-formula"><Formula latex={latex} label={label}/></div><Typography variant="bodySmall" tone="inherit" className="cg-pro-detail">{detail}</Typography></div>;
}
export function ProfessionalEducationPage() {
  return <article className="cg-pro-page cg-creator-typography" aria-labelledby="cg-pro-title">
    <header className="cg-pro-header"><Typography as="h1" id="cg-pro-title" variant="display" tone="inherit">专业教育的问题是什么？</Typography><Typography variant="subtitle" tone="inherit">它能够提供系统、严谨和可深入的知识体系，但如果第一次接触就这样展开，进入成本往往更高。</Typography></header>
    <section className="cg-pro-example"><div className="cg-pro-example-head"><Typography variant="h2" tone="inherit" className="cg-pro-example-pill">例子</Typography><Typography as="h2" variant="h1" tone="inherit">专业方式讲解电子云</Typography></div>
      <div className="cg-pro-primary">
        <Topic title="定态薛定谔方程" latex={String.raw`-\frac{\hbar^2}{2m_e}\nabla^2\psi(\mathbf r)+V(r)\psi(\mathbf r)=E\psi(\mathbf r)`} label="定态薛定谔方程" detail="描述电子在势场中的定态，求解能量本征值与对应的空间波函数。" className="cg-pro-schrodinger"/>
        <Topic title="库仑势" latex={String.raw`V(r)=-\frac{1}{4\pi\varepsilon_0}\frac{Ze^2}{r}`} label="核与单电子之间的库仑势" detail="氢及类氢离子中的单电子库仑势。"/>
      </div>
      <div className="cg-pro-secondary">
        <Topic title="概率密度与电子云" latex={String.raw`\rho(\mathbf r)=|\psi(\mathbf r)|^2`} label="概率密度等于波函数的模平方" detail="表示单位体积内找到电子的概率密度。"/>
        <Topic title="归一化条件" latex={String.raw`\int_{\mathbb R^3}|\psi(\mathbf r)|^2\,d^3r=1`} label="全空间概率积分等于一" detail="在全空间找到电子的总概率为 1。" className="cg-pro-normalization"/>
        <Topic title="束缚态边界条件" latex={String.raw`\psi(\mathbf r)\to0\quad(r\to\infty)`} label="束缚态波函数在无穷远趋于零" detail="还需单值、适当光滑且可归一化。" className="cg-pro-boundary"/>
        <div className="cg-pro-topic cg-pro-quantum"><Typography variant="bodySmall" tone="inherit" className="cg-pro-topic-title">空间量子数与轨道</Typography><div className="cg-pro-formula"><Formula latex={String.raw`\begin{aligned}n&=1,2,3,\ldots\\\ell&=0,1,\ldots,n-1\\m_\ell&=-\ell,\ldots,\ell\end{aligned}`} label="主量子数、角量子数与磁量子数的取值范围"/></div><Typography variant="bodySmall" tone="inherit" className="cg-pro-detail">不含自旋量子数。</Typography></div>
      </div>
      <div className="cg-pro-flow">{[
        ['波函数', String.raw`\psi(\mathbf r)`], ['概率密度', String.raw`|\psi(\mathbf r)|^2`], ['轨道形状', String.raw`s,p,d,\ldots`], ['量子数', String.raw`n,\ell,m_\ell`],
      ].map(([title, latex], i) => <div className="cg-pro-flow-pair" key={title}><div className="cg-pro-flow-box"><Typography variant="bodySmall" tone="inherit">{title}</Typography><Formula latex={latex} label={title}/></div>{i<3&&<Typography as="span" variant="h3" tone="inherit" className="cg-pro-flow-arrow" aria-hidden="true">→</Typography>}</div>)}</div>
    </section>
    <aside className="cg-pro-right"><Typography as="h2" variant="h2" tone="inherit" className="cg-pro-right-title">专业教育的优势与问题</Typography>
      <div className="cg-pro-advantages">{[
        ['tree','体系完整','能形成系统知识'], ['flask','理论严谨','能够解释原理与推导'], ['bars','可以深挖','更容易走向科研与工程应用'],
      ].map(([kind,title,detail])=><div className="cg-pro-advantage" key={title}><ProIcon kind={kind as 'tree'|'flask'|'bars'}/><div><Typography variant="h3" tone="inherit">{title}</Typography><Typography variant="bodySmall" tone="inherit">{detail}</Typography></div></div>)}</div>
      <div className="cg-pro-limits"><Typography as="h3" variant="h2" tone="inherit">但问题在于</Typography>{[
        ['book','默认学习者已有较多前置知识'], ['eye','第一次接触时不容易建立直觉'], ['tangle','容易让人一上来就被公式压住'],
      ].map(([kind,text])=><div className="cg-pro-limit" key={text}><ProIcon kind={kind as 'book'|'eye'|'tangle'}/><Typography variant="bodySmall" tone="inherit">{text}</Typography></div>)}</div>
    </aside>
    <div className="cg-pro-conclusion"><ProIcon kind="target"/><Typography variant="body" tone="inherit">专业教育并不是不好，而是如果<span>作为第一次接触的入口，往往会显得门槛较高。</span></Typography></div>
  </article>;
}
