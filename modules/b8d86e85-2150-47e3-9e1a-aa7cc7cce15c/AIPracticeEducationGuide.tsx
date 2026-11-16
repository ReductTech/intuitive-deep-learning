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
 return <section shuku-edit-id="e-4ed26548-5752-4376-8442-4dc5185e3bba" className="aipe-preview-section"><div shuku-edit-id="e-9922936a-4eb9-4584-a8c7-d3a1f11fec7e" className="aipe-preview-caption"><Typography shuku-edit-id="e-5e906b1e-b118-45f4-b630-0991c3a07a8f" variant="bodySmall" tone="muted">{deck.scenes[index].title}</Typography></div><div shuku-edit-id="e-7f1f09ec-536c-44b7-a1a1-b7a41caac67f" ref={frame} id={id} className="llmpe-guide-frame" data-scene-id={id}><div shuku-edit-id="e-8582c772-c2d0-459a-a355-3522a8f24ac0" className="course-page-surface" style={{transform:`scale(${scale})`}}>{children}</div></div></section>;
}
export function AIPracticeEducationGuide() {
 const [selected,setSelected]=useState(deck.scenes[0].id);const [showNotes,setShowNotes]=useState(false);
 if(new URLSearchParams(window.location.search).get('studyPreview')==='convolution')return <NativeStudyPreview/>;
 if(new URLSearchParams(window.location.search).get('studyPreview')==='creator-guide-copy')return <CreatorGuideStudyPreview/>;
 function jump(id:string){setSelected(id);document.getElementById(id)?.scrollIntoView({block:'start',behavior:'instant'});}
 return <><nav shuku-edit-id="e-31cee65e-b4a7-44d7-8962-019cf38d598d" className="aipe-preview-nav" aria-label="知识呈现作品页序"><Typography shuku-edit-id="e-1dfba03e-2de7-4154-b096-206f3e9b4c9d" variant="bodySmall" tone="accent">实践作品预览</Typography><select shuku-edit-id="e-2487ff07-98e1-4018-8f9c-54285505a3aa" aria-label="跳转页面" value={selected} onChange={e=>jump(e.target.value)}>{deck.scenes.map((s,i)=><option shuku-edit-id="e-701cd286-1156-479d-aae7-1e16e7f3e4fc" key={s.id} value={s.id}>{i+1}. {s.title}</option>)}</select><button shuku-edit-id="e-c6c64741-741b-4546-9f66-5ca365a807e7" type="button" onClick={()=>setShowNotes(!showNotes)}>{showNotes?'收起讲稿':'显示讲稿'}</button></nav><main shuku-edit-id="e-58f9d70d-46c0-44dc-a3c9-5016b5f7b999" className="llmpe-guide aipe-structure-guide">{deck.scenes.map((scene,index)=><div shuku-edit-id="e-152ae5e9-7e54-474c-b6db-507b4d147e74" key={scene.id}><GuideSlide id={scene.id} index={index}>{scene.render()}</GuideSlide>{showNotes&&<aside shuku-edit-id="e-e3ab0625-3881-4c09-b7f1-e7d772be109f" className="aipe-preview-notes"><Typography shuku-edit-id="e-9f7990ac-19df-4e11-a3a3-60498272027a" as="p" variant="body" tone="muted">{getPptNotes(scene.id)[0]?.text}</Typography></aside>}</div>)}</main></>;
}
