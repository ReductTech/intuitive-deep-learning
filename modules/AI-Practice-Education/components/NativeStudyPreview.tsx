import { useState } from 'react';
import { LessonFlow } from '../../shared/react';
import { convolutionLessonSteps } from './workflow/copied-course/GuidePage';
import { GomokuLessonProvider } from './workflow/copied-course/LessonContext';
import './NativeStudyPreview.css';

/** Reuse the real course steps, with fresh preview progress and no course shell. */
export function NativeStudyPreview() {
  const [progressKey] = useState(() => `ai-practice-education:convolution-preview:${crypto.randomUUID()}`);
  return <main className="cg-study-embedded cg-copy-course-shell cg-copy-tw-root">
    <GomokuLessonProvider><LessonFlow steps={convolutionLessonSteps} persistenceKey={progressKey} initialVisibleCount={4}/></GomokuLessonProvider>
  </main>;
}
