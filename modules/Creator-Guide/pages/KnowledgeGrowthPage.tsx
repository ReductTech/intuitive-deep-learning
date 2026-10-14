import type { CSSProperties } from 'react';
import { Typography, moduleAssetUrl } from '../../shared/react';
import outline from '../outlines.json';
import './KnowledgeGrowthPage.css';

type IconKind = 'layers' | 'book' | 'people' | 'growth' | 'tools' | 'network' | 'sprout';
function Icon({ kind }: { kind: IconKind }) {
  const paths: Record<IconKind, string> = {
    layers: 'M3 8 16 2 29 8 16 14Z M3 15 16 21 29 15 M3 22 16 28 29 22',
    book: 'M8 3h17v26H8a4 4 0 0 1 0-8h17 M8 3a4 4 0 0 0-4 4v18 M11 9h10 M11 14h10',
    people: 'M16 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M6 8a3 3 0 1 0 0 6 3 3 0 0 0 0-6 M26 8a3 3 0 1 0 0 6 3 3 0 0 0 0-6 M9 29v-6a7 7 0 0 1 14 0v6 M2 27v-5a5 5 0 0 1 5-5 M30 27v-5a5 5 0 0 0-5-5',
    growth: 'M4 28V18h5v10 M14 28V12h5v16 M24 28V5h5v23 M3 12 16 5 25 2 M20 2h5v5',
    tools: 'M21 3a9 9 0 0 0-10 12L3 23a4 4 0 0 0 6 6l8-8A9 9 0 0 0 29 10l-6 5-6-6Z',
    network: 'M16 4v10 M16 16 5 26 M16 16 27 26 M16 1a3 3 0 1 0 0 6 3 3 0 0 0 0-6 M16 12a3 3 0 1 0 0 6 3 3 0 0 0 0-6 M5 23a3 3 0 1 0 0 6 3 3 0 0 0 0-6 M27 23a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
    sprout: 'M16 29V14 M16 18C5 18 4 9 4 7c8 0 12 4 12 11 M16 14C16 6 22 3 29 3c0 7-4 11-13 11 M10 31h12',
  };
  return <svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d={paths[kind]} /></svg>;
}
function Feature({ icon, children }: { icon: IconKind; children: string }) {
  return <div className="cg-feature"><span className="cg-feature-icon"><Icon kind={icon} /></span><Typography variant="bodySmall" tone="inherit" wrap="nowrap">{children}</Typography></div>;
}
function GrowthDiagram() {
  return <div className="cg-growth" aria-label="知识增长与人类学习速度的概念示意">
    <Typography className="cg-growth-title" variant="bodySmall" tone="inherit">知识增长曲线</Typography>
    <svg className="cg-growth-lines" viewBox="0 0 250 320" aria-hidden="true">
      <defs><linearGradient id="cg-growth-fill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#63afff" stopOpacity=".28"/><stop offset="1" stopColor="#63afff" stopOpacity="0"/></linearGradient></defs>
      <path d="M16 277C84 264 136 221 166 69L166 290H16Z" fill="url(#cg-growth-fill)"/>
      <path d="M16 55V290H216" fill="none" stroke="#718299" strokeWidth="1.5"/>
      <path d="m12 60 4-8 4 8 M211 286l8 4-8 4" fill="#718299"/>
      <path d="M16 277C84 264 136 221 166 69" fill="none" stroke="#096af0" strokeWidth="2.6"/>
      <path d="M16 284Q111 274 172 228" fill="none" stroke="#526073" strokeWidth="2.3"/>
      <circle cx="166" cy="69" r="4.5" fill="#096af0"/><circle cx="172" cy="228" r="4.5" fill="#526073"/>
    </svg>
    <div className="cg-growth-fast"><Typography variant="bodySmall" tone="inherit" wrap="nowrap">知识量<br/>（AI时代）</Typography></div>
    <div className="cg-growth-slow"><Typography variant="bodySmall" tone="inherit">人类学习速度<br/>（相对较慢）</Typography></div>
    <Typography className="cg-growth-time" variant="bodySmall" tone="inherit">时间</Typography>
  </div>;
}
export function KnowledgeGrowthPage() {
  const style = { '--cg-art': `url("${moduleAssetUrl(outline.moduleIdentity.id, 'images/knowledge-growth-art.png')}")` } as CSSProperties;
  return <article className="cg-knowledge-page cg-creator-typography" style={style} aria-labelledby="cg-intro-title">
    <div className="cg-art" aria-hidden="true" />
    <header className="cg-intro-header">
      <Typography as="h1" variant="display" tone="inherit" id="cg-intro-title">知识增长正在重新定义学习</Typography>
      <Typography variant="subtitle" tone="inherit">工业时代建立的教育模式，正在面对 AI 时代的新挑战</Typography>
    </header>
    <section className="cg-era cg-industrial" aria-labelledby="cg-industrial-title">
      <Typography as="h2" variant="h1" tone="inherit" className="cg-era-badge" id="cg-industrial-title">工业时代</Typography>
      <div className="cg-features"><Feature icon="layers">知识相对稳定</Feature><Feature icon="book">统一教材</Feature><Feature icon="people">规模化培养</Feature></div>
      <Typography className="cg-era-summary" variant="bodySmall" tone="inherit">目标是用可控成本，培养大规模、标准化的人才。</Typography>
    </section>
    <div className="cg-center-rule" aria-hidden="true"/><GrowthDiagram/>
    <section className="cg-era cg-ai" aria-labelledby="cg-ai-title">
      <Typography as="h2" variant="h1" tone="inherit" className="cg-era-badge" id="cg-ai-title">AI 时代</Typography>
      <div className="cg-domains"><Typography variant="bodySmall" tone="inherit">科学<br/>技术<br/>工程<br/>艺术<br/>商业<br/>…</Typography></div>
      <div className="cg-features"><Feature icon="growth">知识爆发式增长</Feature><Feature icon="tools">工具快速迭代</Feature><Feature icon="network">跨领域门槛上升</Feature></div>
      <Typography className="cg-era-summary" variant="bodySmall" tone="inherit">问题不再只是学会旧知识，而是<strong>更快理解</strong>不断出现的新知识。</Typography>
    </section>
    <div className="cg-conclusion"><span className="cg-conclusion-icon"><Icon kind="sprout"/></span><Typography variant="h3" tone="inherit">未来学习需要的，不只是更多内容，而是<span>更快建立直觉、更快进入专业深度。</span></Typography></div>
  </article>;
}
