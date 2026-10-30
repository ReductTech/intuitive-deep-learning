import { ContentBlock, Typography, moduleAssetUrl } from '../../../shared/react';
import outline from '../../outlines.json';
import './CrossDomainFoundationPage.css';

const needs=[
 {id:'concept',title:'看懂概念',description:'理解专业术语的含义'},
 {id:'connections',title:'理清联系',description:'把概念、方法联系起来'},
 {id:'system',title:'形成体系',description:'逐步建立系统认识'},
] as const;
function KnowledgeIcon({kind}:{kind:typeof needs[number]['id']}){
 return <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
  {kind==='concept'&&<><path d="M32 18c-8-5-17-6-25-3v35c8-3 17-2 25 3 8-5 17-6 25-3V15c-8-3-17-2-25 3Z"/><path d="M32 18v35"/></>}
  {kind==='connections'&&<><path d="m27 25-12 19m22-19 12 19"/><circle cx="32" cy="16" r="9"/><circle cx="12" cy="51" r="8"/><circle cx="52" cy="51" r="8"/></>}
  {kind==='system'&&<><rect x="23" y="5" width="18" height="14" rx="2"/><path d="M32 19v11M11 44V32h42v12M32 30v14"/><rect x="4" y="44" width="14" height="15" rx="2"/><rect x="25" y="44" width="14" height="15" rx="2"/><rect x="46" y="44" width="14" height="15" rx="2"/></>}
 </svg>;
}
export function CrossDomainFoundationPage(){
 return <ContentBlock className="aipe-knowledge-entry-page" title={outline.pages[8].title} headingLevel={1}
  subtitle="面向大学新生，以及刚进入一个新领域的学习者" bodyClassName="aipe-knowledge-entry-body">
  <div className="aipe-knowledge-entry-scene"><img src={moduleAssetUrl(outline.moduleIdentity.id,'images/learners-entering-knowledge-hall-v1.png')} alt="六位学习者的背影，沿台阶走向庄重的学术殿堂入口，象征开始系统学习专业知识" draggable={false}/></div>
  <div className="aipe-knowledge-entry-needs">{needs.map(need=><section className="aipe-knowledge-entry-need" key={need.id}>
   <div className="aipe-knowledge-entry-icon"><KnowledgeIcon kind={need.id}/></div>
   <div className="aipe-knowledge-entry-copy"><Typography as="h2" variant="h2" tone="accent">{need.title}</Typography><Typography as="p" variant="body" tone="muted">{need.description}</Typography></div>
  </section>)}</div>
 </ContentBlock>;
}
