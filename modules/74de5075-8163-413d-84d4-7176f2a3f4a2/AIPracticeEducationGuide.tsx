import { useRef, useState, type ReactNode } from 'react';
import { useSceneScale } from "@shuku/course-style/react/presentation/canvas";
import { Typography } from "@shuku/course-style/react";
import "@shuku/course-style/react/styles.css";
import "@shuku/course-style/react/ui-kit.css";
import "@shuku/course-style/react/presentation.css";
import { NativeStudyPreview } from './components/NativeStudyPreview';
import { NativeStudyPreview as CreatorGuideStudyPreview } from './components/creator-guide-copy/components/NativeStudyPreview';
import { deck, getPptNotes } from './course';
import './StructurePreview.css';
function GuideSlide({id,index,children}:{id:string;index:number;children:ReactNode}) {
 const frame=useRef<HTMLDivElement>(null);const scale=useSceneScale(frame);
 return <section shuku-edit-id="e-a2834c8a-6177-403c-95c2-4928d29e7423" className="aipe-preview-section"><div shuku-edit-id="e-1f94ad59-5be2-4a6c-ad4b-3c15711f3037" className="aipe-preview-caption"><Typography shuku-edit-id="e-33cdc8aa-8f5a-4758-b4e8-1420a61a7980" variant="bodySmall" tone="muted">{deck.scenes[index].title}</Typography></div><div shuku-edit-id="e-fcfa5ca0-70f2-4b7e-96ec-f969f0097027" ref={frame} id={id} className="llmpe-guide-frame" data-scene-id={id}><div shuku-edit-id="e-eb1da905-c877-4bac-95e4-7786e6a021f7" className="course-page-surface" style={{transform:`scale(${scale})`}}>{children}</div></div></section>;
}
export function AIPracticeEducationGuide() {
 const [selected,setSelected]=useState(deck.scenes[0].id);const [showNotes,setShowNotes]=useState(false);
 if(new URLSearchParams(window.location.search).get('studyPreview')==='convolution')return <NativeStudyPreview/>;
 if(new URLSearchParams(window.location.search).get('studyPreview')==='creator-guide-copy')return <CreatorGuideStudyPreview/>;
 function jump(id:string){setSelected(id);document.getElementById(id)?.scrollIntoView({block:'start',behavior:'instant'});}
 return <><nav shuku-edit-id="e-890e1188-d348-4db6-a586-0fcb4ff2fd47" className="aipe-preview-nav" aria-label="知识呈现作品页序"><Typography shuku-edit-id="e-6e34a285-c2b7-4019-a81a-1336dd7708f2" variant="bodySmall" tone="accent">实践作品预览</Typography><select shuku-edit-id="e-db4dd6bb-d2d5-4671-b53e-c6b02d857f9a" aria-label="跳转页面" value={selected} onChange={e=>jump(e.target.value)}>{deck.scenes.map((s,i)=><option shuku-edit-id="e-e9c439a3-4f84-436e-a523-6da27f0154cb" key={s.id} value={s.id}>{i+1}. {s.title}</option>)}</select><button shuku-edit-id="e-5177a7ef-6c90-4561-bb66-5baba58079c2" type="button" onClick={()=>setShowNotes(!showNotes)}>{showNotes?'收起讲稿':'显示讲稿'}</button></nav><main shuku-edit-id="e-bfbe6ade-afd4-4ba3-8517-b6bfda0fe851" className="llmpe-guide aipe-structure-guide">{deck.scenes.map((scene,index)=><div shuku-edit-id="e-f7fc9694-572c-4a9d-bb87-f31bdbaec60b" key={scene.id}><GuideSlide id={scene.id} index={index}>{scene.render()}</GuideSlide>{showNotes&&<aside shuku-edit-id="e-ef13d43f-313a-4a8c-bf65-0167c64d481f" className="aipe-preview-notes"><Typography shuku-edit-id="e-9b9ef643-7839-42fb-b535-5b1cb1eb619b" as="p" variant="body" tone="muted">{getPptNotes(scene.id)[0]?.text}</Typography></aside>}</div>)}</main></>;
}
