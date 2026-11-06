import { ContentBlock, Typography, moduleAssetUrl } from '../../../shared/react';
import outline from '../../outlines.json';
import './CrossDomainFoundationPage.css';

const needs=[
 {id:'concept',title:'看懂概念'},
 {id:'connections',title:'理清联系'},
 {id:'system',title:'形成体系'},
] as const;
export function CrossDomainFoundationPage(){
 return <ContentBlock className="aipe-knowledge-entry-page" title={outline.pages[9].title} headingLevel={1}
  bodyClassName="aipe-knowledge-entry-body">
  <img className="aipe-knowledge-entry-background" src={moduleAssetUrl(outline.moduleIdentity.id,'images/beginner-library-background-v2.png')} alt="四位学习者一起走进开放的大学图书馆" draggable={false}/>
  <div className="aipe-knowledge-entry-needs">{needs.map(need=><section className="aipe-knowledge-entry-need" key={need.id}>
   <img className="aipe-knowledge-entry-icon" src={moduleAssetUrl(outline.moduleIdentity.id,`images/beginner-${need.id}-v2.png`)} alt="" aria-hidden="true" draggable={false}/>
   <Typography as="h2" variant="h2" tone="accent">{need.title}</Typography>
  </section>)}</div>
 </ContentBlock>;
}
