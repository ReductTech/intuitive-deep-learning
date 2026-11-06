import { Button, Select, Typography } from '../shared/react';
import '../shared/react/styles.css';
import '../shared/react/ui-kit.css';
import '../shared/react/presentation.css';
import { course } from './course';
import { LessonCanvas } from './components/LessonCanvas';
import './preview/preview.css';
export function GuidePage() {
  return <main className="daa-guide">
    <nav className="daa-guide-nav" aria-label="课程导航">
      <Typography variant="body" tone="accent">数据标注与数据增广 · {course.length} 页</Typography>
      <div style={{ width: 540 }}><Select label="跳到教学页" options={course.map(page=>({value:page.id,label:`${page.id} · ${page.title}`}))} onChange={id=>document.getElementById(`daa-page-${id}`)?.scrollIntoView({behavior:'smooth'})}/></div>
      <Button href="?view=ppt"><Typography as="span" variant="bodySmall" tone="inherit">课堂演示</Typography></Button>
    </nav>
    {course.map(({id, Component})=><LessonCanvas key={id} id={`daa-page-${id}`}><Component /></LessonCanvas>)}
  </main>;
}
