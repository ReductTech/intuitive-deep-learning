import { Typography } from '../../shared/react';
import { ElectronCloudLab } from '../components/ElectronCloudLab';
import './IntuitiveLearningPage.css';

function LearningIcon({ kind }: { kind: 'light' | 'flask' | 'bars' | 'target' }) {
  const paths = {
    light: 'M11 25c0-4-5-6-5-12a10 10 0 0 1 20 0c0 6-5 8-5 12H11ZM12 29h8M14 33h4M16 0v-3M2 6l-3-2M30 6l3-2M1 17h-4M31 17h4',
    flask: 'M10 2h12M12 2v11L3 29a2 2 0 0 0 2 3h22a2 2 0 0 0 2-3l-9-16V2M7 22h18M13 17h.01M20 26h.01',
    bars: 'M3 22h6v10H3ZM13 13h6v19h-6ZM23 2h6v30h-6Z',
    target: 'M28 8a14 14 0 1 0 3 7M23 11a8 8 0 1 0 2 6M16 17 31 2M25 2h6v6',
  };
  return <svg viewBox="-5 -5 44 44" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={paths[kind]}/></svg>;
}
export function IntuitiveLearningPage() {
  return <article className="cg-intuitive-page cg-creator-typography" aria-labelledby="cg-intuitive-title">
    <header className="cg-intuitive-header"><Typography as="h1" id="cg-intuitive-title" variant="display" tone="inherit">直觉式学习会怎样讲解知识？</Typography><Typography variant="subtitle" tone="inherit">通过更直观的展示、适量的交互与必要的严谨定义，让学习者先建立正确直觉，再逐步进入专业深度。</Typography></header>
    <section className="cg-intuitive-example-space" aria-label="电子云三维交互案例"><ElectronCloudLab /></section>
    <aside className="cg-intuitive-right"><Typography as="h2" variant="h2" tone="inherit" className="cg-intuitive-right-title">这页在帮助学生建立什么</Typography><div className="cg-intuitive-benefits">{[
      { kind: 'light' as const, title: '建立直觉', lines: ['先形成清晰画面，', '而不是先背公式'] },
      { kind: 'flask' as const, title: '保持严谨', lines: ['在直觉基础上，', '再连接定义与专业知识'] },
      { kind: 'bars' as const, title: '支持深入', lines: ['理解后更容易继续学习', '更复杂内容'] },
    ].map(({ kind, title, lines }) => <div className="cg-intuitive-benefit" key={title}><span className="cg-intuitive-icon"><LearningIcon kind={kind}/></span><div><Typography as="h3" variant="h3" tone="inherit">{title}</Typography><Typography variant="bodySmall" tone="inherit">{lines[0]}<br/>{lines[1]}</Typography></div></div>)}</div></aside>
    <div className="cg-intuitive-conclusion"><LearningIcon kind="target"/><Typography variant="body" tone="inherit">我们想要的，不是更浅的解释，而是更容易进入、同时能走向严谨理解的呈现方式。</Typography></div>
  </article>;
}
