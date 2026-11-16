import { useState } from 'react';
import { LessonFlow } from "@shuku/course-style/react";
import { convolutionLessonSteps } from './workflow/copied-course/GuidePage';
import { GomokuLessonProvider } from './workflow/copied-course/LessonContext';
import './NativeStudyPreview.css';

/** Reuse the real course steps, with fresh preview progress and no course shell. */
export function NativeStudyPreview() {
  const [progressKey] = useState(() => `ai-practice-education:convolution-preview:${crypto.randomUUID()}`);
  return <main shuku-edit-id="e-56dc9b97-ab73-404a-a1a3-7c0f28ac13c7" className="cg-study-embedded cg-copy-course-shell cg-copy-tw-root">
    <GomokuLessonProvider><LessonFlow steps={convolutionLessonSteps} persistenceKey={progressKey} initialVisibleCount={4}/></GomokuLessonProvider>
  </main>;
}
