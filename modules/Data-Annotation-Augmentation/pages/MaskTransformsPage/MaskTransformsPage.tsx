import { useState } from 'react';
import { Button, RangeControl, Typography } from '../../../shared/react';
import { LessonPage } from '../../components/LessonPage';
import { PhotoStage } from '../../components/PhotoStage';
import { appleOutline, polygonPath } from '../../data';
import './MaskTransformsPage.css';

export function MaskTransformsPage() {
  const [angle,setAngle]=useState(0),[scale,setScale]=useState(.5),[sync,setSync]=useState(true);
  const transform=`rotate(${angle}deg) scale(${scale})`;
  const aligned=sync||(angle===0&&scale===.5);
  return <LessonPage id="14" subtitle="同一颗苹果：左侧变换图片，右侧变换对应的标签掩膜。" takeaway="图像与掩膜必须使用同一组几何参数，才能保持逐像素对应。">
    <div className="daa-mask-geometry"><div className="daa-two daa-equal">
      <div className="daa-center"><Typography variant="h3">训练图片</Typography><div style={{width:360,maxWidth:'100%'}}><PhotoStage imageStyle={{transform}}/></div><Typography variant="bodySmall">缩放 {scale.toFixed(2)} 倍 · 旋转 {angle}°</Typography></div>
      <div className="daa-center"><Typography variant="h3">同一图片的标签掩膜</Typography><svg className="daa-mask-label" viewBox="0 0 600 400" aria-label="随图片变换的类别掩膜"><g style={{transform:sync?transform:'scale(.5)',transformOrigin:'300px 200px'}}><path d={polygonPath(appleOutline,600,400)} fill="var(--ui-accent-alt)"/></g></svg><Typography variant="bodySmall" tone={aligned?'success':'danger'}>{aligned?'正确：位置与图片一致':'错误：掩膜还停留在原位置'}</Typography></div>
    </div><div className="daa-mask-controls"><div><RangeControl label="共同缩放倍率" value={scale} min={.3} max={.65} step={.05} digits={2} onChange={e=>setScale(+e.target.value)}/><RangeControl label="共同旋转角" value={angle} min={-25} max={25} suffix="°" onChange={e=>setAngle(+e.target.value)}/></div><div className="daa-reading"><div className="daa-actions"><Button active={sync} onClick={()=>setSync(true)}><Typography as="span" variant="bodySmall" tone="inherit">正确：同步掩膜</Typography></Button><Button active={!sync} onClick={()=>{setSync(false);setAngle(20);}}><Typography as="span" variant="bodySmall" tone="inherit">错误示例：只变图片</Typography></Button></div><Typography variant="bodySmall" tone="muted">右侧是左侧苹果的人工粗略掩膜；两侧大小和坐标系相同。</Typography></div></div></div>
  </LessonPage>;
}
