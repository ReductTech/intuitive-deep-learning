import { useRef, useState, type PointerEvent } from 'react';
import { RangeControl, Typography } from "@shuku/course-style/react";
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
  return <LessonPage id="52467f44-e381-4b66-8e4b-85f06774a274" subtitle="拖动蓝色窗口内部移动，拖动左右边线改变范围。" takeaway={retained===0?'目标已消失：分类标签不能照搬，检测记录也应移除。':'裁剪后求交并平移目标框；剩余框面积比例不等于目标真实可见比例。'}>
    <div shuku-edit-id="e-95b434cf-73f3-49cc-9f06-2e6d35251214" className="daa-two daa-equal"><div shuku-edit-id="e-174244ce-53be-4a30-8b1d-9c4421988dab" className="daa-center"><PhotoStage><BoxOverlay boxes={[appleBox]}/>
      <svg shuku-edit-id="e-efefd51a-fcc1-4dbe-a2a6-90d502b07064" className="daa-photo-overlay daa-box-editor" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="裁剪窗口编辑器" onPointerMove={move} onPointerUp={()=>{drag.current=null;}} onLostPointerCapture={()=>{drag.current=null;}}>
        <rect shuku-edit-id="e-ceccbd8d-fe6e-4426-88e3-2cc9ec1cb3a7" className="daa-crop-area" x={x*100} y="10" width={w*100} height="80" fill="var(--ui-accent)" fillOpacity=".1" stroke="var(--ui-accent)" strokeWidth=".6" style={{cursor:'move'}} onPointerDown={e=>start(e,'move')}/>
        {(['left','right'] as const).map(side=><line shuku-edit-id="e-8ad05402-8b25-478a-a010-f7609d2e85b3" key={side} data-crop-edge={side} x1={(side==='left'?x:x+w)*100} x2={(side==='left'?x:x+w)*100} y1="10" y2="90" stroke="transparent" strokeWidth="4" style={{cursor:'ew-resize'}} onPointerDown={e=>start(e,side)}/>)}
        {[x,x+w].map((v,i)=><rect shuku-edit-id="e-4d72eb97-b836-408d-a651-5905869d3e4e" key={i} x={v*100-.7} y="45" width="1.4" height="10" fill="var(--ui-accent)" pointerEvents="none"/>)}
      </svg></PhotoStage>
      <Typography shuku-edit-id="e-f73b6c5c-a1a7-4748-b4d3-6f309ee5f858" variant="bodySmall"><Typography shuku-edit-id="e-fa4c212f-6cbc-47df-9931-f7918804e767" as="span" variant="bodySmall" tone="warning">橙色：GT 目标框</Typography> · <Typography shuku-edit-id="e-5c5391dc-fa56-4cbb-907e-7a6338313f37" as="span" variant="bodySmall" tone="accent">蓝色：裁剪窗口（左右边均可拖拽）</Typography></Typography>
      <RangeControl label="裁剪窗口宽度" value={w} min={.1} max={.8} step={.01} digits={2} onChange={e=>{const width=+e.target.value;setCrop({x:Math.min(x,1-width),w:width});}}/></div>
      <div shuku-edit-id="e-93d75fb5-0328-4864-878e-fafa274c4ff0" className="daa-reading"><div shuku-edit-id="e-98fc48e0-96fc-441a-bcc2-adef35103b75" data-ppt-viewport="按裁剪框显示图像及同步变换后的标注" className="daa-transform-window" style={{height:260,width:260*1.5*w/.8,aspectRatio:'auto'}}><img shuku-edit-id="e-8c8a2fc4-98e8-48e0-a61c-553dcd930e03" src={photoUrl("01-fuji-apple.webp")} alt="裁剪后的水果图像" style={{position:'absolute',width:`${100/w}%`,maxWidth:'none',height:'125%',left:`${-x/w*100}%`,top:'-12.5%'}}/>{retained>=.25&&<BoxOverlay boxes={[box]}/>}</div>
        <Typography shuku-edit-id="e-0daae99e-095b-4f57-bed0-7781a0e518a1" variant="body">剩余框面积：{Math.round(retained*100)}%</Typography><Typography shuku-edit-id="e-f6fff118-02db-4a40-ab3d-de5da4138eee" variant="bodySmall" tone="muted">本例保留阈值为 25%，不是通用标准。</Typography><Typography shuku-edit-id="e-884678aa-8ff1-4a11-9160-ee9ef5000401" variant="body" tone={retained>=.25?'success':'warning'}>检测记录：{retained>=.25?'保留并更新框':'丢弃目标框'}</Typography>
      </div></div>
  </LessonPage>;
}
