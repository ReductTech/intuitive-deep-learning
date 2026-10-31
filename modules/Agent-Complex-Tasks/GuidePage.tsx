import { ModuleShell } from '../shared/react';
import { LessonSlide } from './pages/LessonSlide/LessonSlide';
import outline from './outlines.json';
import './pages/LessonSlide/LessonSlide.css';

export function GuidePage() {
  return <ModuleShell title={outline.title} subtitle={outline.description} shellClassName="act-guide">
    {outline.pages.map((page, index) => <div className="act-guide-frame" id={page.id} key={page.id}><div className="course-page-surface"><LessonSlide index={index} /></div></div>)}
  </ModuleShell>;
}
