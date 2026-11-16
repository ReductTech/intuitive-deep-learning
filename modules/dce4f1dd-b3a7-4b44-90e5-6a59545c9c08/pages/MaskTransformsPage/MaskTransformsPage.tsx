import { useState } from 'react';
import { Button, RangeControl, Typography } from "@shuku/course-style/react";
import { LessonPage } from '../../components/LessonPage';
import { PhotoStage } from '../../components/PhotoStage';
import { appleOutline, polygonPath } from '../../data';
import './MaskTransformsPage.css';

export function MaskTransformsPage() {
  const [angle,setAngle]=useState(0),[scale,setScale]=useState(.5),[sync,setSync]=useState(true);
  const transform=`rotate(${angle}deg) scale(${scale})`;
  const aligned=sync||(angle===0&&scale===.5);
  return <LessonPage id="fadc7041-8021-415e-a175-40fe01071f4e" subtitle="同一颗苹果：左侧变换图片，右侧变换对应的标签掩膜。" takeaway="图像与掩膜必须使用同一组几何参数，才能保持逐像素对应。">
    <div shuku-edit-id="e-7e1fed1e-c3f7-4125-8ca7-7d4b3f4e9b2d" className="daa-mask-geometry"><div shuku-edit-id="e-d45d5ba2-cc84-4506-831d-2e79d9289081" className="daa-two daa-equal">
      <div shuku-edit-id="e-a01d8908-a1d5-4aaa-aac2-9d6f73531d21" className="daa-center"><Typography shuku-edit-id="e-9df66a5d-212c-4c27-9eac-9d3c8b4e60ed" variant="h3">训练图片</Typography><div shuku-edit-id="e-394020fb-5f9c-4a61-b048-5a40dac1b74e" style={{width:360,maxWidth:'100%'}}><PhotoStage imageStyle={{transform}}/></div><Typography shuku-edit-id="e-166be436-056b-45cf-84af-0bcaef1b8f5b" variant="bodySmall">缩放 {scale.toFixed(2)} 倍 · 旋转 {angle}°</Typography></div>
      <div shuku-edit-id="e-310508cf-0dbb-46a6-86a4-ab94a5b4ba5e" className="daa-center"><Typography shuku-edit-id="e-9676e350-f2d1-4e5e-a15f-9efc5543a827" variant="h3">同一图片的标签掩膜</Typography><svg shuku-edit-id="e-ce643324-5b9f-4d6f-a706-b52cd3265ae1" className="daa-mask-label" viewBox="0 0 600 400" aria-label="随图片变换的类别掩膜"><g shuku-edit-id="e-306882d0-9754-49af-b17b-3b4f0f8511d7" style={{transform:sync?transform:'scale(.5)',transformOrigin:'300px 200px'}}><path shuku-edit-id="e-9bf90a7a-485d-4848-9d69-04588c7bc83b" d={polygonPath(appleOutline,600,400)} fill="var(--ui-accent-alt)"/></g></svg><Typography shuku-edit-id="e-8fd80952-004d-44c6-9e86-52ce592c2821" variant="bodySmall" tone={aligned?'success':'danger'}>{aligned?'正确：位置与图片一致':'错误：掩膜还停留在原位置'}</Typography></div>
    </div><div shuku-edit-id="e-db26ce77-998f-47e7-8c6d-d7bec20bfad0" className="daa-mask-controls"><div shuku-edit-id="e-be0d285e-5245-4255-8980-dec5ec1ad6ba"><RangeControl label="共同缩放倍率" value={scale} min={.3} max={.65} step={.05} digits={2} onChange={e=>setScale(+e.target.value)}/><RangeControl label="共同旋转角" value={angle} min={-25} max={25} suffix="°" onChange={e=>setAngle(+e.target.value)}/></div><div shuku-edit-id="e-ae8df1c8-d7d4-4768-9c83-de8603693f53" className="daa-reading"><div shuku-edit-id="e-8ea54e7c-5266-45ac-a16a-30b10e842bc8" className="daa-actions"><Button active={sync} onClick={()=>setSync(true)}><Typography shuku-edit-id="e-f77b3eff-0620-4935-aa5f-22b450c21937" as="span" variant="bodySmall" tone="inherit">正确：同步掩膜</Typography></Button><Button active={!sync} onClick={()=>{setSync(false);setAngle(20);}}><Typography shuku-edit-id="e-64590991-1e46-4c72-ac24-51833deac06a" as="span" variant="bodySmall" tone="inherit">错误示例：只变图片</Typography></Button></div><Typography shuku-edit-id="e-9610b3a8-d408-41fc-9e01-281f0be1f52d" variant="bodySmall" tone="muted">右侧是左侧苹果的人工粗略掩膜；两侧大小和坐标系相同。</Typography></div></div></div>
  </LessonPage>;
}
