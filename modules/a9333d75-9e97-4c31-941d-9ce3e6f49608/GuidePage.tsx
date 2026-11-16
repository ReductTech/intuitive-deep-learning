import { useRef } from 'react';
import { ModuleShell } from "@shuku/course-style/react";
import { useSceneScale } from '@shuku/course-style/react/presentation/canvas';
import { LessonSlide } from './pages/LessonSlide/LessonSlide';
import outline from './outlines.json';
import './pages/LessonSlide/LessonSlide.css';

function GuideSlide({ pageId }: { pageId: string }) {
  const frame = useRef<HTMLDivElement>(null);
  const scale = useSceneScale(frame);
  return <div shuku-edit-id="e-77bb2d7e-c09a-4843-8009-776d8b4d6d3d" ref={frame} className="act-guide-frame" id={pageId} data-step-id={pageId} style={{ height: 'auto', aspectRatio: '16 / 9' }}><div shuku-edit-id="e-505975e5-5cf1-40f6-b0c3-40ac648f31b6" className="course-page-surface" style={{ transform: `scale(${scale})` }}><LessonSlide pageId={pageId} /></div></div>;
}

export function GuidePage() {
  return <ModuleShell title={outline.title} subtitle={outline.description} shellClassName="act-guide">
    {outline.pages.map(page => <GuideSlide pageId={page.id} key={page.id} />)}
  </ModuleShell>;
}
