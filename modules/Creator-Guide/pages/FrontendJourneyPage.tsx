import type { CSSProperties } from 'react';
import { Typography, moduleAssetUrl } from '../../shared/react';
import outline from '../outlines.json';
import './FrontendJourneyPage.css';

function JourneyIcon({ kind }: { kind: 'react' | 'tools' | 'deploy' | 'screen' }) {
  if (kind === 'react') return <svg viewBox="0 0 40 40" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6"><ellipse cx="20" cy="20" rx="18" ry="7"/><ellipse cx="20" cy="20" rx="18" ry="7" transform="rotate(60 20 20)"/><ellipse cx="20" cy="20" rx="18" ry="7" transform="rotate(120 20 20)"/><circle cx="20" cy="20" r="3" fill="currentColor"/></svg>;
  const paths = { tools: 'M25 4a9 9 0 0 0-9 12L4 28a4 4 0 0 0 6 6l12-12A9 9 0 0 0 34 10l-7 5-5-5ZM6 4l5 2 5 7-4 4-7-5Z M20 24l10 10', deploy: 'M10 28H7a6 6 0 0 1-1-12 11 11 0 0 1 21-4 8 8 0 0 1 5 16h-6M19 32V16m-6 6 6-6 6 6', screen: 'M3 4h32v23H3ZM19 27v8M11 35h16M9 11h9M9 17h16' };
  return <svg viewBox="0 0 40 40" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d={paths[kind]}/></svg>;
}
const steps = [
  { name: 'HTML', detail: '网页结构', duration: '1–2 个月', badge: '5', color: '#ed612d', left: 214, top: 750, width: 318, height: 67 },
  { name: 'CSS', detail: '样式与布局', duration: '1–2 个月', badge: '3', color: '#2479dc', left: 243, top: 660, width: 313, height: 64 },
  { name: 'JavaScript', detail: '交互逻辑', duration: '2–3 个月', badge: 'JS', color: '#f1c238', left: 287, top: 571, width: 309, height: 62 },
  { name: 'React', detail: '组件化开发', duration: '2–4 个月', icon: 'react' as const, color: '#19a8c5', left: 332, top: 487, width: 291, height: 63 },
  { name: 'TypeScript', detail: '类型系统', duration: '1–2 个月', badge: 'TS', color: '#2e7fcc', left: 377, top: 409, width: 262, height: 60 },
  { name: '工程化工具', detail: '打包、路由、状态管理', duration: '1–2 个月', icon: 'tools' as const, color: '#526178', left: 419, top: 338, width: 245, height: 56 },
  { name: '部署与调试', detail: '', duration: '1–2 个月', icon: 'deploy' as const, color: '#3c80b6', left: 461, top: 286, width: 215, height: 39 },
];
export function FrontendJourneyPage() {
  const style = { '--cg-journey-art': `url("${moduleAssetUrl(outline.moduleIdentity.id,'images/frontend-journey.png')}")` } as CSSProperties;
  return <article className="cg-journey-page cg-creator-typography" style={style} aria-labelledby="cg-journey-title">
    <div className="cg-journey-art" role="img" aria-label="学习者沿前端技术台阶攀登，右侧展示最终的课件编辑界面"/>
    <header className="cg-journey-header"><Typography as="h1" id="cg-journey-title" variant="display" tone="inherit">传统开发：要做这样的前端界面并不容易</Typography><Typography variant="subtitle" tone="inherit">一个完整的交互式课件界面，背后需要从零学习多种前端技术，学习周期可能长达一两年。</Typography></header>
    <div className="cg-journey-intro"><Typography variant="body" tone="inherit">需要掌握的主要技术栈</Typography><Typography variant="bodySmall" tone="inherit">学习路径长，涉及多种工具和概念</Typography></div>
    {steps.map((step,i)=><div key={step.name} className={`cg-journey-step cg-journey-step-${i}`} style={{ left:step.left, top:step.top, width:step.width, height:step.height, '--cg-step-color':step.color } as CSSProperties}><span className="cg-journey-step-icon">{'badge' in step ? <Typography as="span" variant="body" tone="inherit">{step.badge}</Typography> : <JourneyIcon kind={step.icon!}/>}</span><div className="cg-journey-step-copy"><Typography variant="body" tone="inherit">{step.name}</Typography>{step.detail&&<Typography variant="bodySmall" tone="inherit">{step.detail}</Typography>}</div><Typography variant="bodySmall" tone="inherit" className="cg-journey-duration">{step.duration}</Typography></div>)}
    <div className="cg-journey-summit"><JourneyIcon kind="screen"/><Typography variant="bodySmall" tone="inherit">完整的交互式<br/>前端界面</Typography></div>
    <div className="cg-journey-result"><span><JourneyIcon kind="screen"/></span><div><Typography variant="body" tone="inherit">最终得到的效果</Typography><Typography variant="bodySmall" tone="inherit">功能丰富、可交互、视觉精美的教学界面</Typography></div></div>
  </article>;
}
