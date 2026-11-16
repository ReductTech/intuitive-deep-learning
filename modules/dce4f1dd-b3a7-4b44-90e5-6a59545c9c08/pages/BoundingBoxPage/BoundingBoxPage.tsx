import { useState } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
import { LessonPage } from '../../components/LessonPage';
import { BoxEditor } from '../../components/PhotoStage';
import { appleBox } from '../../data';
export function BoundingBoxPage(){
 const [box,setBox]=useState({x1:.1,y1:.02,x2:.93,y2:.97}),[normal,setNormal]=useState(false);
 const values=[box.x1,box.y1,box.x2,box.y2].map((v,i)=>normal?Number(v.toFixed(3)):Math.round(v*(i%2===0?1536:1024)));
 return <LessonPage id="385a7e62-a647-45e5-8e60-6fd5275d5951" subtitle="先框住可见目标，再把同一个框保存为坐标。" takeaway="可见紧框包含果柄；坐标保存前核对原点、单位和字段顺序。">
 <div shuku-edit-id="e-c245e506-e7ea-4e3e-8b68-2a91d0b9f812" className="daa-two"><div shuku-edit-id="e-00b4dea8-3867-461a-998f-dbf09482f0a4" className="daa-center"><BoxEditor box={box} onChange={setBox}/><Typography shuku-edit-id="e-f868fc6f-a9a1-425f-8bdc-fca031ccb1aa" variant="bodySmall" tone="muted">拖动四条边，坐标同步变化</Typography></div>
 <div shuku-edit-id="e-6ce907dc-3cd3-406b-8ecf-516019749a92" className="daa-reading daa-label-reading"><Typography shuku-edit-id="e-c684dcd9-a806-4f3b-a28c-31ce51a402d3" variant="bodySmall">框住可见水果与果柄，减少额外背景。左上角为原点，向右、向下增大。</Typography><div shuku-edit-id="e-d5db4c9c-d3a7-4b13-8f4a-12c84e094128" className="daa-actions"><Button onClick={()=>setBox(appleBox)}><Typography shuku-edit-id="e-b3c6e770-e55c-47db-8134-18d0e78eff45" as="span" variant="bodySmall" tone="inherit">贴紧目标</Typography></Button><Button active={!normal} onClick={()=>setNormal(false)}><Typography shuku-edit-id="e-bb09ef62-5f89-46b5-a4bd-67f6021f01c5" as="span" variant="bodySmall" tone="inherit">像素</Typography></Button><Button active={normal} onClick={()=>setNormal(true)}><Typography shuku-edit-id="e-9e4bfbc1-515c-402c-91b3-4833cefb2de2" as="span" variant="bodySmall" tone="inherit">归一化</Typography></Button></div><div shuku-edit-id="e-67b7a92c-193d-4788-8ddd-08e63c8dc237" className="daa-record"><Typography shuku-edit-id="e-83c99549-48b9-47a0-b803-22424bd00412" as="code" variant="bodySmall" className="daa-code">{`{\n  "class_id": 0,\n  "box": [${values.join(', ')}],\n  "format": "XYXY",\n  "unit": "${normal?'normalized':'pixels'}"\n}`}</Typography></div><Typography shuku-edit-id="e-eacab3d1-7724-4854-b22b-04045a21a16b" variant="bodySmall" tone="muted">XYXY：左、上、右、下。</Typography></div></div></LessonPage>;
}
