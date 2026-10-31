import { useState } from 'react';
import { Button, Typography } from '../../../shared/react';
import { LessonPage } from '../../components/LessonPage';
import { PhotoStage, BoxOverlay } from '../../components/PhotoStage';
import { sceneBoxes, appleSceneOutline, pearSceneOutline, polygonPath } from '../../data';
export function TaskLabelsPage() {
 const [mode,setMode]=useState('分类');
 return <LessonPage id="02" subtitle="同一张图，换一个问题，答案的形式就变了。" takeaway={mode==='分类'?'整图多标签分类：这张图同时包含苹果和梨。':mode==='检测'?'检测标签同时记录每个目标的类别与位置。':'语义分割为每个像素赋类别；同类实例共用类别。'}>
 <div className="daa-two"><div className="daa-center"><PhotoStage file="10-two-fruits.png">{mode==='检测'&&<BoxOverlay boxes={sceneBoxes}/>} {mode==='分割'&&<svg className="daa-photo-overlay" viewBox="0 0 600 400"><path d={polygonPath(appleSceneOutline,600,400)} fill="var(--ui-accent-alt)" opacity=".55"/><path d={polygonPath(pearSceneOutline,600,400)} fill="var(--ui-accent)" opacity=".55"/></svg>}</PhotoStage><Typography variant="bodySmall" tone="muted">AI 生成图片 · 框与掩膜为人工示意</Typography></div>
 <div className="daa-reading"><div className="daa-actions">{['分类','检测','分割'].map(x=><Button active={mode===x} key={x} onClick={()=>setMode(x)}><Typography as="span" variant="bodySmall" tone="inherit">{x}</Typography></Button>)}</div><Typography variant="h2">{mode==='分类'?'是什么？':mode==='检测'?'是什么，在哪里？':'每个像素是什么？'}</Typography><div className="daa-record"><Typography variant="body">{mode==='分类'?'苹果、梨':mode==='检测'?'苹果 → 左侧框；梨 → 右侧框':'橙色区域 → 苹果；蓝色区域 → 梨'}</Typography></div><Typography variant="bodySmall" tone="muted">标签由要解决的任务决定，而不是由文件格式决定。</Typography></div></div></LessonPage>;
}
