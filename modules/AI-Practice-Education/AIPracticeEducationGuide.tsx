import { useRef, useState, type ReactNode } from 'react';
import { useSceneScale } from '../shared/react/presentation/canvas';
import { Typography } from '../shared/react';
import '../shared/react/styles.css';
import '../shared/react/ui-kit.css';
import '../shared/react/presentation.css';
import { NativeStudyPreview } from './components/NativeStudyPreview';
import { deck, getPptNotes } from './course';
import './StructurePreview.css';
function GuideSlide({id,index,children}:{id:string;index:number;children:ReactNode}) {
 const frame=useRef<HTMLDivElement>(null);const scale=useSceneScale(frame);
 return <section className="aipe-preview-section"><div className="aipe-preview-caption"><Typography variant="bodySmall" tone="muted">{deck.scenes[index].title}</Typography></div><div ref={frame} id={id} className="llmpe-guide-frame" data-scene-id={id}><div className="course-page-surface" style={{transform:`scale(${scale})`}}>{children}</div></div></section>;
}
export function AIPracticeEducationGuide() {
 const [selected,setSelected]=useState(deck.scenes[0].id);const [showNotes,setShowNotes]=useState(false);
 if(new URLSearchParams(window.location.search).get('studyPreview')==='convolution')return <NativeStudyPreview/>;
 function jump(id:string){setSelected(id);document.getElementById(id)?.scrollIntoView({block:'start',behavior:'instant'});}
 return <><nav className="aipe-preview-nav" aria-label="课件页序"><Typography variant="bodySmall" tone="accent">课件预览</Typography><select aria-label="跳转页面" value={selected} onChange={e=>jump(e.target.value)}>{deck.scenes.map((s,i)=><option key={s.id} value={s.id}>{i+1}. {s.title}</option>)}</select><button type="button" onClick={()=>setShowNotes(!showNotes)}>{showNotes?'收起讲稿':'显示讲稿'}</button></nav><main className="llmpe-guide aipe-structure-guide">{deck.scenes.map((scene,index)=><div key={scene.id}><GuideSlide id={scene.id} index={index}>{scene.render()}</GuideSlide>{showNotes&&<aside className="aipe-preview-notes"><Typography as="p" variant="body" tone="muted">{getPptNotes(scene.id)[0]?.text}</Typography></aside>}</div>)}</main></>;
}
