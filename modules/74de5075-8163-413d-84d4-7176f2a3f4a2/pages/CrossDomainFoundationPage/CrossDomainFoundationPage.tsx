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
 return <ContentBlock shuku-edit-id="e-c9e43c5b-af37-48e4-8bd4-5a1f916324d1" className="aipe-knowledge-entry-page" title={outline.pages.find(page => page.id === '8435c800-bca3-476a-b09c-6290d44f935d')!.title} headingLevel={1}
  bodyClassName="aipe-knowledge-entry-body">
  <img shuku-edit-id="e-61168517-2b8b-41ef-8848-36204cd130e2" className="aipe-knowledge-entry-background" src={moduleAssetUrl('images/beginner-library-background-v2.jpg')} alt="四位学习者一起走进开放的大学图书馆" draggable={false}/>
  <div shuku-edit-id="e-3c138198-9b6f-4b5a-8041-38c093c1b6c5" className="aipe-knowledge-entry-needs">{needs.map(need=><section shuku-edit-id="e-d9a562af-0b0a-445d-9a3d-3dafe8d6e5cd" className="aipe-knowledge-entry-need" key={need.id}>
   <img shuku-edit-id="e-107348a6-8a0c-48f4-bb6f-bc1cf183149b" className="aipe-knowledge-entry-icon" src={moduleAssetUrl(`images/beginner-${need.id}-v2.png`)} alt="" aria-hidden="true" draggable={false}/>
   <Typography shuku-edit-id="e-891a0a06-964b-405e-895d-48d7f9f587da" as="h2" variant="h2" tone="accent">{need.title}</Typography>
  </section>)}</div>
 </ContentBlock>;
}
