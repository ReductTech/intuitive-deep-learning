import { useState } from 'react';
import { Button, Typography, moduleAssetUrl } from '../../shared/react';
import { moduleIdentity } from '../outlines.json';
import './CourseMaterialImage.css';
type Frame = {columns:number;rows:number;column:number;row:number};
export function CourseMaterialImage({path,alt,frame}:{path:string;alt:string;frame?:Frame}) {
 const [attempt,setAttempt]=useState(0),[loaded,setLoaded]=useState(false),[failed,setFailed]=useState(false);
 const asset=moduleAssetUrl(moduleIdentity.id,path);
 const src=attempt?asset+(asset.includes('?')?'&':'?')+'retry='+attempt:asset;
 return <div className="attn-material-image" data-capture-ready={loaded||failed} aria-busy={!loaded&&!failed} data-image-failed={failed} data-ppt-viewport={frame?'原视频逐秒预览图；固定展示第28秒的完整一帧，不裁切帧内内容':undefined}>
  {failed?<Button aria-label={'重新加载：'+alt} onClick={()=>{setLoaded(false);setFailed(false);setAttempt(v=>v+1);}}><Typography as="span" variant="bodySmall" tone="inherit">重新加载</Typography></Button>
   :<img key={attempt} src={src} alt={alt} draggable={false} onLoad={()=>setLoaded(true)} onError={()=>setFailed(true)} style={frame?{position:'absolute',maxWidth:'none',width:frame.columns*100+'%',height:frame.rows*100+'%',left:-frame.column*100+'%',top:-frame.row*100+'%'}:undefined}/>}
 </div>;
}
