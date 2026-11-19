import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import './CrossDomainFoundationPage.css';

const needs=[
 {id:'concept',title:'看懂概念'},
 {id:'connections',title:'理清联系'},
 {id:'system',title:'形成体系'},
] as const;
export function CrossDomainFoundationPage(){
 return <ContentBlock shuku-edit-id="e-284f4ae0-221f-4366-a7d3-a0d08a45ab2b" className="aipe-knowledge-entry-page" title={outline.pages.find(page => page.id === '43fb0e5e-348b-4f16-9f3a-b65843674b9b')!.title} headingLevel={1}
  bodyClassName="aipe-knowledge-entry-body">
  <img shuku-edit-id="e-b65dad6d-3c0d-4d16-afe4-9064c89ac3c0" className="aipe-knowledge-entry-background" src={moduleAssetUrl("images/beginner-library-background-v2.webp")} alt="四位学习者一起走进开放的大学图书馆" draggable={false}/>
  <div shuku-edit-id="e-405846de-53f6-4960-8f78-616c43b98fbf" className="aipe-knowledge-entry-needs">{needs.map(need=><section shuku-edit-id="e-d42269ba-e888-4985-89bf-b02ed0f221e4" className="aipe-knowledge-entry-need" key={need.id}>
   <img shuku-edit-id="e-b99b07ad-04b2-43c0-8433-fb372db3ba7c" className="aipe-knowledge-entry-icon" src={moduleAssetUrl(`images/beginner-${need.id}-v2.webp`)} alt="" aria-hidden="true" draggable={false}/>
   <Typography shuku-edit-id="e-b31efd8c-c96f-471e-8364-a4dd98b9fa70" as="h2" variant="h2" tone="accent">{need.title}</Typography>
  </section>)}</div>
 </ContentBlock>;
}
