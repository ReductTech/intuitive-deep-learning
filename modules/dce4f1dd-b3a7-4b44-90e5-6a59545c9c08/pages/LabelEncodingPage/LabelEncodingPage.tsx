import { useState } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
import { LessonPage } from '../../components/LessonPage';
import { PhotoStage } from '../../components/PhotoStage';
import { TargetWeights } from '../../components/TargetWeights';
export function LabelEncodingPage(){
 const [pear,setPear]=useState(false);
 return <LessonPage id="2aca8518-ef4a-45aa-8afc-33785a729049" subtitle="选择一个水果，观察同一个分类标签的两种数值表示。" takeaway="编号是类别索引；独热向量的每个位置对应一个类别。两者表达同一个答案。">
 <div shuku-edit-id="e-3b12e0c2-3a12-4698-9e29-a9b2196c6a94" className="daa-two"><div shuku-edit-id="e-8e85cb3b-2445-4a96-ba71-b2d130c75e15" className="daa-center"><PhotoStage file={pear?'02-bartlett-pear.jpg':'01-fuji-apple.jpg'}/><div shuku-edit-id="e-37d17e2b-c396-4629-92e7-1389a1db27f9" className="daa-actions">{['苹果','梨'].map((name,i)=><Button key={name} active={pear===(i===1)} onClick={()=>setPear(i===1)}><Typography shuku-edit-id="e-faac1e0e-9307-4274-bbbc-c154ac11cb5f" as="span" variant="bodySmall" tone="inherit">选择{name}</Typography></Button>)}</div></div>
 <div shuku-edit-id="e-0dc0b867-cd2c-40a1-bac9-b2a61a7e514f" className="daa-reading daa-label-reading"><Typography shuku-edit-id="e-ca6b0a70-4ef4-445c-96ae-9e3ee0ef7982" variant="h3">单标签分类：{pear?'梨':'苹果'}</Typography><Typography shuku-edit-id="e-06b4b1de-7572-45ab-bbd6-475303d48398" variant="bodySmall">表示一 · 类别编号：{pear?1:0}</Typography><Typography shuku-edit-id="e-a0b02cf2-f3c6-4289-ad0b-81476a80b86d" variant="bodySmall">表示二 · 独热向量（顺序：苹果、梨）</Typography><TargetWeights apple={pear?0:1}/><Typography shuku-edit-id="e-d1bb0e6c-218c-4947-88a3-8bfe89a46364" variant="bodySmall" tone="muted">本页每图只含一种水果。苹果编号 0，梨编号 1；柱状图表示标签。</Typography></div></div></LessonPage>;
}
