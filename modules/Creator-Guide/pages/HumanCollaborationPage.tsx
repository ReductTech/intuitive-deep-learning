import { Typography, moduleAssetUrl } from '../../shared/react';
import outline from '../outlines.json';
import './HumanCollaborationPage.css';
function CausalMask({ plain = false }: { plain?: boolean }) {
  return <div className={`cg-human-mask${plain ? ' is-plain' : ''}`} role="img" aria-label="因果可见性矩阵：包含对角线的下三角为1，上三角为0">{Array.from({length:16},(_,i)=><Typography as="span" variant="bodySmall" tone="inherit" key={i} className={i%4<=Math.floor(i/4)?'is-allowed':'is-blocked'}>{i%4<=Math.floor(i/4)?1:0}</Typography>)}</div>;
}
export function HumanCollaborationPage(){return <article className="cg-human-page cg-creator-typography" aria-labelledby="cg-human-title">
  <img className="cg-human-art" src={moduleAssetUrl(outline.moduleIdentity.id,'images/human-causal-mask-single-question.png')} alt="AI 生成教学内容，学生关注可信依据，专业人士审核知识与理解路径，并可通过联名等背书方式建立信任"/>
  <header><Typography as="h1" variant="display" tone="inherit" id="cg-human-title">制作直觉式课件，人的作用是什么？</Typography></header>
  <section className="cg-human-stage cg-human-stage-ai"><div className="cg-human-stage-heading"><Typography as="span" variant="h2" tone="inherit">1</Typography><Typography as="h2" variant="h2" tone="inherit">AI 能组织内容与制作界面</Typography></div><Typography variant="body" tone="inherit">训练赋予 AI 知识与表达能力，<br/>它能生成讲解、图示和交互界面。</Typography></section>
  <section className="cg-human-stage cg-human-stage-learner"><div className="cg-human-stage-heading"><Typography as="span" variant="h2" tone="inherit">2</Typography><Typography as="h2" variant="h2" tone="inherit">AI 生成的内容仍需审核</Typography></div><Typography variant="body" tone="inherit">内容可能存在事实错误，<br/>也未必符合人的理解过程。</Typography></section>
  <section className="cg-human-stage cg-human-stage-human"><div className="cg-human-stage-heading"><Typography as="span" variant="h2" tone="inherit">3</Typography><Typography as="h2" variant="h2" tone="inherit">人工审核兼顾正确与理解</Typography></div><Typography variant="body" tone="inherit">核验事实，检查讲解是否便于理解；<br/>可通过联名等背书方式建立信任。</Typography></section>
  <Typography variant="h2" tone="inherit" className="cg-human-robot-speech">我生成好了！</Typography>
  <div className="cg-human-screen"><Typography variant="bodySmall" tone="inherit">AI 生成的<br/>教学内容</Typography><CausalMask/></div>
  <div className="cg-human-quality">{['✓ 快速生成','◉ 样式优美'].map(t=><Typography key={t} variant="bodySmall" tone="inherit">{t}</Typography>)}</div>
  <div className="cg-human-thought cg-human-thought-matrix"><Typography as="span" variant="display" tone="inherit" aria-hidden="true">?</Typography><Typography variant="bodySmall" tone="inherit">AI 生成的这些知识<br/>是正确的吗？</Typography></div>
  <div className="cg-human-teacher-thought cg-human-teacher-start"><Typography as="span" variant="h2" tone="inherit" aria-hidden="true">✦</Typography><Typography variant="bodySmall" tone="inherit">核查事实性错误<br/>修正知识表述</Typography></div>
  <div className="cg-human-teacher-thought cg-human-teacher-steps"><Typography as="span" variant="h2" tone="inherit" aria-hidden="true">↳</Typography><Typography variant="bodySmall" tone="inherit">检查理解路径<br/>让讲解便于理解</Typography></div>
  <div className="cg-human-teacher-thought cg-human-teacher-interaction"><Typography as="span" variant="h2" tone="inherit" aria-hidden="true">☝</Typography><Typography variant="bodySmall" tone="inherit">发现知识遗漏<br/>补全关键前提</Typography></div>
  <svg className="cg-human-arrows" viewBox="0 0 1600 900" aria-hidden="true"><path d="M526 553h40m-14-14 14 14-14 14M1038 553h40m-14-14 14 14-14 14" stroke="#a9b8c9" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
</article>;}
