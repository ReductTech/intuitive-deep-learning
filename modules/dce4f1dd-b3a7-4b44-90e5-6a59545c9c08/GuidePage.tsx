import { Button, Select, Typography } from "@shuku/course-style/react";
import "@shuku/course-style/react/styles.css";
import "@shuku/course-style/react/ui-kit.css";
import "@shuku/course-style/react/presentation.css";
import { course } from './course';
import { LessonCanvas } from './components/LessonCanvas';
import './preview/preview.css';
export function GuidePage() {
  return <main shuku-edit-id="e-0836b994-849e-4cee-a9ec-75c322d8ecf6" className="daa-guide">
    <nav shuku-edit-id="e-5a75c4f1-db64-4a3d-9e11-7e4ffaaa2378" className="daa-guide-nav" aria-label="课程导航">
      <Typography shuku-edit-id="e-bbdc3f7c-995c-41a3-96a7-7606c4eeabab" variant="body" tone="accent">数据标注与数据增广 · {course.length} 页</Typography>
      <div shuku-edit-id="e-0cdff481-aae4-4c61-8bd0-122a4dda0b0f" style={{ width: 540 }}><Select label="跳到教学页" options={course.map(page=>({value:page.id,label:`${page.id} · ${page.title}`}))} onChange={id=>document.getElementById(`daa-page-${id}`)?.scrollIntoView({behavior:'smooth'})}/></div>
      <Button href="?view=ppt"><Typography shuku-edit-id="e-b05f7a44-c8cc-4e42-a3b3-e06512009223" as="span" variant="bodySmall" tone="inherit">课堂演示</Typography></Button>
    </nav>
    {course.map(({id, Component})=><LessonCanvas key={id} id={`daa-page-${id}`}><Component /></LessonCanvas>)}
  </main>;
}
