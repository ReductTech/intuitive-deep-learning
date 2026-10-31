import { useState } from 'react';
import { Button, Typography } from '../../../shared/react';
import { LessonPage } from '../../components/LessonPage';
import { BoxEditor } from '../../components/PhotoStage';
import { appleBox } from '../../data';
export function BoundingBoxPage(){
 const [box,setBox]=useState({x1:.1,y1:.02,x2:.93,y2:.97}),[normal,setNormal]=useState(false);
 const values=[box.x1,box.y1,box.x2,box.y2].map((v,i)=>normal?Number(v.toFixed(3)):Math.round(v*(i%2===0?1536:1024)));
 return <LessonPage id="06" subtitle="先框住可见目标，再把同一个框保存为坐标。" takeaway="可见紧框包含果柄；坐标保存前核对原点、单位和字段顺序。">
 <div className="daa-two"><div className="daa-center"><BoxEditor box={box} onChange={setBox}/><Typography variant="bodySmall" tone="muted">拖动四条边，坐标同步变化</Typography></div>
 <div className="daa-reading daa-label-reading"><Typography variant="bodySmall">框住可见水果与果柄，减少额外背景。左上角为原点，向右、向下增大。</Typography><div className="daa-actions"><Button onClick={()=>setBox(appleBox)}><Typography as="span" variant="bodySmall" tone="inherit">贴紧目标</Typography></Button><Button active={!normal} onClick={()=>setNormal(false)}><Typography as="span" variant="bodySmall" tone="inherit">像素</Typography></Button><Button active={normal} onClick={()=>setNormal(true)}><Typography as="span" variant="bodySmall" tone="inherit">归一化</Typography></Button></div><div className="daa-record"><Typography as="code" variant="bodySmall" className="daa-code">{`{\n  "class_id": 0,\n  "box": [${values.join(', ')}],\n  "format": "XYXY",\n  "unit": "${normal?'normalized':'pixels'}"\n}`}</Typography></div><Typography variant="bodySmall" tone="muted">XYXY：左、上、右、下。</Typography></div></div></LessonPage>;
}
