import { useState } from 'react';
import { Button, Typography } from '../../../shared/react';
import { LessonPage } from '../../components/LessonPage';
import { PhotoStage } from '../../components/PhotoStage';
import { TargetWeights } from '../../components/TargetWeights';
export function LabelEncodingPage(){
 const [pear,setPear]=useState(false);
 return <LessonPage id="03" subtitle="选择一个水果，观察同一个分类标签的两种数值表示。" takeaway="编号是类别索引；独热向量的每个位置对应一个类别。两者表达同一个答案。">
 <div className="daa-two"><div className="daa-center"><PhotoStage file={pear?'02-bartlett-pear.png':'01-fuji-apple.png'}/><div className="daa-actions">{['苹果','梨'].map((name,i)=><Button key={name} active={pear===(i===1)} onClick={()=>setPear(i===1)}><Typography as="span" variant="bodySmall" tone="inherit">选择{name}</Typography></Button>)}</div></div>
 <div className="daa-reading daa-label-reading"><Typography variant="h3">单标签分类：{pear?'梨':'苹果'}</Typography><Typography variant="bodySmall">表示一 · 类别编号：{pear?1:0}</Typography><Typography variant="bodySmall">表示二 · 独热向量（顺序：苹果、梨）</Typography><TargetWeights apple={pear?0:1}/><Typography variant="bodySmall" tone="muted">本页每图只含一种水果。苹果编号 0，梨编号 1；柱状图表示标签。</Typography></div></div></LessonPage>;
}
