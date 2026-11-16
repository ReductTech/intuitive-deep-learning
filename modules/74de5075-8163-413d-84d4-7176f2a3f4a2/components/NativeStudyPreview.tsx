import { useState } from 'react';
import { LessonFlow } from "@shuku/course-style/react";
import { convolutionLessonSteps } from './workflow/copied-course/GuidePage';
import { GomokuLessonProvider } from './workflow/copied-course/LessonContext';
import './NativeStudyPreview.css';

/** Reuse the real course steps, with fresh preview progress and no course shell. */
export function NativeStudyPreview() {
  const [progressKey] = useState(() => `ai-practice-education-spp:convolution-preview:${crypto.randomUUID()}`);
  return <main shuku-edit-id="e-f73f5a55-dc27-434e-829a-529090508038" className="cg-study-embedded cg-copy-course-shell cg-copy-tw-root">
    <GomokuLessonProvider><LessonFlow steps={convolutionLessonSteps} persistenceKey={progressKey} initialVisibleCount={4}/></GomokuLessonProvider>
  </main>;
}
