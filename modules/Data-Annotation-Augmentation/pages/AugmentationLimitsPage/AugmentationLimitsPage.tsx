import { useState } from 'react';
import { Button, RangeControl, Typography } from '../../../shared/react';
import { LessonPage } from '../../components/LessonPage';
import { AugmentedFruitView } from '../../components/AugmentedFruitView';
import { photoUrl } from '../../data';
import './AugmentationLimitsPage.css';
export function AugmentationLimitsPage(){
 const [count,setCount]=useState(8),[seed,setSeed]=useState(41),[wrong,setWrong]=useState(false);
 return <LessonPage id="23" subtitle="实际生成不同训练视图，但追溯原图时，来源依然只有一个。" takeaway="增加变化不等于增加真实实例；错标签也会被所有增广视图继承。">
 <div className="daa-two daa-equal"><div className="daa-reading"><Typography variant="h3">从这一张梨图开始</Typography><div className="daa-source-row"><img src={photoUrl('02-bartlett-pear.png')} alt="唯一原始来源"/><Typography variant="body" tone={wrong?'danger':'accent'}>标签：{wrong?'苹果':'梨'}</Typography></div><RangeControl label="生成视图数量" value={count} min={1} max={20} step={1} onChange={e=>setCount(+e.target.value)}/><div className="daa-actions"><Button onClick={()=>setSeed(Math.floor(Math.random()*1e8))}><Typography as="span" variant="bodySmall" tone="inherit">重新随机生成</Typography></Button><Button onClick={()=>setWrong(!wrong)}><Typography as="span" variant="bodySmall" tone="inherit">{wrong?'纠正源标签':'把源标签标错'}</Typography></Button></div><Typography variant="body">视图 {count} 个 · 独立来源 1 个</Typography><Typography variant="bodySmall" tone="muted">不同的真实梨、环境与拍摄场次，仍需实际采样。</Typography></div>
 <div className="daa-reading daa-generated-reading"><Typography variant="body" tone={wrong?'danger':'accent'}>{wrong?'这些视图全部继承错标签：苹果':'这些视图的分类标签都是：梨'}</Typography><div className="daa-generated-grid">{Array.from({length:count},(_,i)=><AugmentedFruitView key={i} seed={seed+i*7919}/>)}</div><Typography variant="bodySmall" tone="muted">每张图实际应用随机翻转、轻微旋转、裁切和颜色变化。</Typography></div></div></LessonPage>;
}
