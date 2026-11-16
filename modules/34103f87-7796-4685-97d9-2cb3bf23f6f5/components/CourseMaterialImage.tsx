import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useState } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
import { moduleIdentity } from '../outlines.json';
import './CourseMaterialImage.css';
type Frame = {columns:number;rows:number;column:number;row:number};
export function CourseMaterialImage({path,alt,frame}:{path:string;alt:string;frame?:Frame}) {
 const [attempt,setAttempt]=useState(0),[loaded,setLoaded]=useState(false),[failed,setFailed]=useState(false);
 const asset=moduleAssetUrl(path);
 const src=attempt?asset+(asset.includes('?')?'&':'?')+'retry='+attempt:asset;
 return <div shuku-edit-id="e-4bf2c426-5324-443a-a387-66f2df9b4613" className="attn-material-image" data-capture-ready={loaded||failed} aria-busy={!loaded&&!failed} data-image-failed={failed} data-ppt-viewport={frame?'原视频逐秒预览图；固定展示第28秒的完整一帧，不裁切帧内内容':undefined}>
  {failed?<Button aria-label={'重新加载：'+alt} onClick={()=>{setLoaded(false);setFailed(false);setAttempt(v=>v+1);}}><Typography shuku-edit-id="e-d7a0727d-ecc2-4ac0-bd41-4534716a10b0" as="span" variant="bodySmall" tone="inherit">重新加载</Typography></Button>
   :<img shuku-edit-id="e-86499af4-8c24-4613-a17f-4aadd89f24cf" key={attempt} src={src} alt={alt} draggable={false} onLoad={()=>setLoaded(true)} onError={()=>setFailed(true)} style={frame?{position:'absolute',maxWidth:'none',width:frame.columns*100+'%',height:frame.rows*100+'%',left:-frame.column*100+'%',top:-frame.row*100+'%'}:undefined}/>}
 </div>;
}
