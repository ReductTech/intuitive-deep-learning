import { useState } from 'react';
import { Button, RangeControl, Question, Typography } from "@shuku/course-style/react";
import { LessonPage } from '../../components/LessonPage';
import { NoisyPhoto } from '../../components/NoisyPhoto';
import './AppearanceAugmentationPage.css';

export function AppearanceAugmentationPage() {
  const [kind,setKind]=useState<'hue'|'brightness'|'noise'|'blur'>('hue');
  const [hue,setHue]=useState(0);
  const [brightness,setBrightness]=useState(1),[noise,setNoise]=useState(0),[blur,setBlur]=useState(0);
  return <LessonPage id="846bb852-80b1-4e3e-8665-c957294ecf8d" subtitle="在同一图片上比较色偏、光照、噪声和模糊，检查判别信息是否仍然可用。" takeaway="外观增广要保留任务所需信息；幅度应匹配实际条件，并通过独立数据验证。">
    <div shuku-edit-id="e-5dbacfa5-4680-469b-a336-5f6114fcb0a6" className="daa-two"><div shuku-edit-id="e-aef9ad37-bacc-476c-9eec-7bb907643a43" className="daa-center"><NoisyPhoto hue={hue} brightness={brightness} noise={noise} blur={blur}/><Typography shuku-edit-id="e-43e91acd-e079-4678-af4a-7583db189744" variant="bodySmall" tone="muted">改变颜色，削弱“红色才是苹果”的捷径</Typography></div>
      <div shuku-edit-id="e-19c0cb14-9709-4ce6-b593-41c33c1d70b6" className="daa-reading daa-appearance-reading"><div shuku-edit-id="e-b2f7a315-07b9-46e1-a0e6-aca948f413b3" className="daa-actions">{(['hue','brightness','noise','blur'] as const).map((value,i)=><Button key={value} active={kind===value} onClick={()=>setKind(value)}><Typography shuku-edit-id="e-5f362028-0299-4514-927c-3c8d6f684021" as="span" variant="bodySmall" tone="inherit">{['色偏','光照','噪声','模糊'][i]}</Typography></Button>)}<Button onClick={()=>{setHue(0);setBrightness(1);setNoise(0);setBlur(0);}}><Typography shuku-edit-id="e-2ecf718b-3a5c-4bfd-a475-df0d39324861" as="span" variant="bodySmall" tone="inherit">重置图片</Typography></Button></div>
        {kind==='hue'?<RangeControl label="色相偏移" value={hue} min={-35} max={35} step={1} suffix="°" onChange={e=>setHue(+e.target.value)}/>:kind==='brightness'?<RangeControl label="亮度倍率" value={brightness} min={.2} max={4} step={.1} digits={1} onChange={e=>setBrightness(+e.target.value)}/>:kind==='noise'?<RangeControl label="噪声幅度（8 位像素）" value={noise} min={0} max={160} step={5} onChange={e=>setNoise(+e.target.value)}/>:<RangeControl label="模糊半径" value={blur} min={0} max={35} step={1} suffix=" px" onChange={e=>setBlur(+e.target.value)}/>}
        
        <Question title="严重失真后，能只凭原标签用于训练吗？" answer="no" options={[{value:'no',label:'不能，先检查辨识信息是否保留'},{value:'yes',label:'能，原图是苹果就可以'}]} feedback={{correct:'正确：原图类别不变，不代表失真后的视图仍保留足够辨识信息。',wrong:'错误：要检查当前图片是否还支持判断，不能只看原图标签。'}}/>
      </div></div>
  </LessonPage>;
}
