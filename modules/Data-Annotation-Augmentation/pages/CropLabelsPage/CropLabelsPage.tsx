import { useRef, useState, type PointerEvent } from 'react';
import { RangeControl, Typography } from '../../../shared/react';
import { LessonPage } from '../../components/LessonPage';
import { PhotoStage, BoxOverlay } from '../../components/PhotoStage';
import { appleBox, photoUrl } from '../../data';

type Drag = { mode: 'left'|'right'|'move'; pointer: number; x: number; w: number };
export function CropLabelsPage() {
  const [crop,setCrop]=useState({x:.3,w:.4});
  const drag=useRef<Drag|null>(null);
  const {x,w}=crop;
  const start=(e:PointerEvent<SVGElement>,mode:Drag['mode'])=>{e.stopPropagation();e.preventDefault();const svg=e.currentTarget.ownerSVGElement!;const r=svg.getBoundingClientRect();drag.current={mode,pointer:(e.clientX-r.left)/r.width,x,w};svg.setPointerCapture(e.pointerId);};
  const move=(e:PointerEvent<SVGSVGElement>)=>{const d=drag.current;if(!d)return;const r=e.currentTarget.getBoundingClientRect();const delta=(e.clientX-r.left)/r.width-d.pointer;const right=d.x+d.w;
    if(d.mode==='left'){const left=Math.max(0,right-.8,Math.min(right-.1,d.x+delta));setCrop({x:left,w:right-left});}
    else if(d.mode==='right'){const end=Math.max(d.x+.1,Math.min(1,d.x+.8,right+delta));setCrop({x:d.x,w:end-d.x});}
    else setCrop({x:Math.max(0,Math.min(1-d.w,d.x+delta)),w:d.w});
  };
  const left=Math.max(x,appleBox.x1),right=Math.min(x+w,appleBox.x2),top=Math.max(.1,appleBox.y1),bottom=Math.min(.9,appleBox.y2);
  const retained=Math.max(0,right-left)*Math.max(0,bottom-top)/((appleBox.x2-appleBox.x1)*(appleBox.y2-appleBox.y1));
  const box={x1:(left-x)/w,x2:(right-x)/w,y1:(top-.1)/.8,y2:(bottom-.1)/.8};
  return <LessonPage id="13" subtitle="拖动蓝色窗口内部移动，拖动左右边线改变范围。" takeaway={retained===0?'目标已消失：分类标签不能照搬，检测记录也应移除。':'裁剪后求交并平移目标框；剩余框面积比例不等于目标真实可见比例。'}>
    <div className="daa-two daa-equal"><div className="daa-center"><PhotoStage><BoxOverlay boxes={[appleBox]}/>
      <svg className="daa-photo-overlay daa-box-editor" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="裁剪窗口编辑器" onPointerMove={move} onPointerUp={()=>{drag.current=null;}} onLostPointerCapture={()=>{drag.current=null;}}>
        <rect className="daa-crop-area" x={x*100} y="10" width={w*100} height="80" fill="var(--ui-accent)" fillOpacity=".1" stroke="var(--ui-accent)" strokeWidth=".6" style={{cursor:'move'}} onPointerDown={e=>start(e,'move')}/>
        {(['left','right'] as const).map(side=><line key={side} data-crop-edge={side} x1={(side==='left'?x:x+w)*100} x2={(side==='left'?x:x+w)*100} y1="10" y2="90" stroke="transparent" strokeWidth="4" style={{cursor:'ew-resize'}} onPointerDown={e=>start(e,side)}/>)}
        {[x,x+w].map((v,i)=><rect key={i} x={v*100-.7} y="45" width="1.4" height="10" fill="var(--ui-accent)" pointerEvents="none"/>)}
      </svg></PhotoStage>
      <Typography variant="bodySmall"><Typography as="span" variant="bodySmall" tone="warning">橙色：GT 目标框</Typography> · <Typography as="span" variant="bodySmall" tone="accent">蓝色：裁剪窗口（左右边均可拖拽）</Typography></Typography>
      <RangeControl label="裁剪窗口宽度" value={w} min={.1} max={.8} step={.01} digits={2} onChange={e=>{const width=+e.target.value;setCrop({x:Math.min(x,1-width),w:width});}}/></div>
      <div className="daa-reading"><div className="daa-transform-window" style={{height:260,width:260*1.5*w/.8,aspectRatio:'auto'}}><img src={photoUrl('01-fuji-apple.png')} alt="裁剪后的水果图像" style={{position:'absolute',width:`${100/w}%`,maxWidth:'none',height:'125%',left:`${-x/w*100}%`,top:'-12.5%'}}/>{retained>=.25&&<BoxOverlay boxes={[box]}/>}</div>
        <Typography variant="body">剩余框面积：{Math.round(retained*100)}%</Typography><Typography variant="bodySmall" tone="muted">本例保留阈值为 25%，不是通用标准。</Typography><Typography variant="body" tone={retained>=.25?'success':'warning'}>检测记录：{retained>=.25?'保留并更新框':'丢弃目标框'}</Typography>
      </div></div>
  </LessonPage>;
}
