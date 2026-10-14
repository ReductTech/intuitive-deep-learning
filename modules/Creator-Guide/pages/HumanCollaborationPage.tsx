import { Typography, moduleAssetUrl } from '../../shared/react';
import outline from '../outlines.json';
import './HumanCollaborationPage.css';
function CausalMask({ plain = false }: { plain?: boolean }) {
  return <div className={`cg-human-mask${plain ? ' is-plain' : ''}`} role="img" aria-label="因果可见性矩阵：包含对角线的下三角为1，上三角为0">{Array.from({length:16},(_,i)=><Typography as="span" variant="bodySmall" tone="inherit" key={i} className={i%4<=Math.floor(i/4)?'is-allowed':'is-blocked'}>{i%4<=Math.floor(i/4)?1:0}</Typography>)}</div>;
}
export function HumanCollaborationPage(){return <article className="cg-human-page cg-creator-typography" aria-labelledby="cg-human-title">
  <img className="cg-human-art" src={moduleAssetUrl(outline.moduleIdentity.id,'images/human-causal-mask.png')} alt="AI 展示掩码界面，学习者困惑，人与 AI 协作重新设计讲解"/>
  <header><Typography as="h1" variant="display" tone="inherit" id="cg-human-title">AI 能做出教学界面，但还需要人的协作</Typography><Typography variant="subtitle" tone="inherit">AI 可以生成内容和精美界面，但教学的难点在于：<span>如何让初学者真正理解。</span></Typography></header>
  <section className="cg-human-stage cg-human-stage-ai"><div className="cg-human-stage-heading"><Typography as="span" variant="h2" tone="inherit">1</Typography><Typography as="h2" variant="h2" tone="inherit">AI 做出了教学界面</Typography></div><Typography variant="body" tone="inherit">技术上能运行，视觉上也不错。</Typography></section>
  <section className="cg-human-stage cg-human-stage-learner"><div className="cg-human-stage-heading"><Typography as="span" variant="h2" tone="inherit">2</Typography><Typography as="h2" variant="h2" tone="inherit">学习者仍然可能看不懂</Typography></div><Typography variant="body" tone="inherit">熟悉的人一眼就懂，初学者却可能<br/>不知道这个矩阵在控制什么。</Typography></section>
  <section className="cg-human-stage cg-human-stage-human"><div className="cg-human-stage-heading"><Typography as="span" variant="h2" tone="inherit">3</Typography><Typography as="h2" variant="h2" tone="inherit">因此需要人的协作</Typography></div><Typography variant="body" tone="inherit">发现学习者缺少的中间步骤，<br/>再与 AI 一起修改讲法和交互。</Typography></section>
  <Typography variant="h2" tone="inherit" className="cg-human-robot-speech">我做好了！</Typography>
  <div className="cg-human-screen"><Typography variant="bodySmall" tone="inherit">因果注意力掩码</Typography><CausalMask/></div>
  <div className="cg-human-quality">{['✓ 可运行','◉ 好看','⚡ 功能完整'].map(t=><Typography key={t} variant="bodySmall" tone="inherit">{t}</Typography>)}</div>
  <div className="cg-human-thought cg-human-thought-matrix"><CausalMask plain/><Typography variant="bodySmall" tone="inherit">这个三角形<br/>代表什么？</Typography></div>
  <Typography variant="body" tone="inherit" className="cg-human-thought cg-human-thought-row">行和列<br/>各代表谁？</Typography>
  <Typography variant="body" tone="inherit" className="cg-human-thought cg-human-thought-why">为什么有些<br/>位置看不到？</Typography>
  <div className="cg-human-teacher-thought cg-human-teacher-start"><Typography as="span" variant="h2" tone="inherit" aria-hidden="true">✦</Typography><Typography variant="bodySmall" tone="inherit">先从生成下一个词<br/>不能提前看答案讲起</Typography></div>
  <div className="cg-human-teacher-thought cg-human-teacher-steps"><Typography as="span" variant="h2" tone="inherit" aria-hidden="true">↳</Typography><Typography variant="bodySmall" tone="inherit">把每个位置<br/>对应到矩阵的一行</Typography></div>
  <div className="cg-human-teacher-thought cg-human-teacher-interaction"><Typography as="span" variant="h2" tone="inherit" aria-hidden="true">☝</Typography><Typography variant="bodySmall" tone="inherit">移动到一个词<br/>看它能参考谁</Typography></div>
  <svg className="cg-human-arrows" viewBox="0 0 1600 900" aria-hidden="true"><path d="M526 553h40m-14-14 14 14-14 14M1038 553h40m-14-14 14 14-14 14" stroke="#a9b8c9" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
</article>;}
