import { useRef } from 'react';
import { useSceneScale } from '../shared/react/presentation/canvas';
import '../shared/react/styles.css';
import '../shared/react/presentation.css';
import { OpeningPage } from './pages/OpeningPage/OpeningPage';
import { KnowledgeGrowthPage } from './pages/KnowledgeGrowthPage/KnowledgeGrowthPage';
import { LearningGoalPage } from './pages/LearningGoalPage/LearningGoalPage';
import { FoundationFrontierPage } from './pages/FoundationFrontierPage/FoundationFrontierPage';
import { EducationPathsPage } from './pages/EducationPathsPage/EducationPathsPage';
import { ConvolutionObservationPage } from './pages/ConvolutionObservationPage/ConvolutionObservationPage';
import { ConvolutionDefinitionPage } from './pages/ConvolutionDefinitionPage/ConvolutionDefinitionPage';
import { ConvolutionWalkthroughPage } from './pages/ConvolutionWalkthroughPage/ConvolutionWalkthroughPage';

function GuideSlide({ id, children }: { id: string; children: React.ReactNode }) {
  const frame = useRef<HTMLDivElement>(null);
  const scale = useSceneScale(frame);
  return (
    <div ref={frame} id={id} className="llmpe-guide-frame" data-scene-id={id}>
      <div className="course-page-surface" style={{ transform: `scale(${scale})` }}>{children}</div>
    </div>
  );
}

export function LLMPracticeEducationGuide() {
  return (
    <main className="llmpe-guide">
      <GuideSlide id="opening"><OpeningPage /></GuideSlide>
      <GuideSlide id="knowledge-growth"><KnowledgeGrowthPage /></GuideSlide>
      <GuideSlide id="learning-goals"><LearningGoalPage /></GuideSlide>
      <GuideSlide id="foundation-frontier"><FoundationFrontierPage /></GuideSlide>
      <GuideSlide id="education-paths"><EducationPathsPage /></GuideSlide>
      <GuideSlide id="popular-science"><ConvolutionObservationPage /></GuideSlide>
      <GuideSlide id="professional-education"><ConvolutionDefinitionPage /></GuideSlide>
      <GuideSlide id="intuitive-learning"><ConvolutionWalkthroughPage /></GuideSlide>
    </main>
  );
}
