import {ShukuCoCreationLoop} from './pages/ShukuCoCreationLoop';
import {ShukuWhyPage,ShukuParticipationPage,ShukuReviewPage,ShukuGrowthPage} from './pages/ShukuIntroPages';
import { NativeStudyPreview } from './components/NativeStudyPreview';
import './CreatorTypography.css';
import { TitlePage } from './pages/TitlePage';
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import '../shared/react/styles.css';
import '../shared/react/ui-kit.css';
import { LearningGoalPage } from './pages/LearningGoalPage';
import { EducationPathsPage } from './pages/EducationPathsPage';
import { PopularSciencePage } from './pages/PopularSciencePage';
import { ProfessionalEducationPage } from './pages/ProfessionalEducationPage';
import { IntuitiveLearningPage } from './pages/IntuitiveLearningPage';
import { MultiFormatPage } from './pages/MultiFormatPage';
import { DiscoveryLearningPage } from './pages/DiscoveryLearningPage';
import { ProgressiveDisclosurePage } from './pages/ProgressiveDisclosurePage';
import { OptionalInteractionPage } from './pages/OptionalInteractionPage';
import { CreationWorkflowPage } from './pages/CreationWorkflowPage';
import { HumanCollaborationPage } from './pages/HumanCollaborationPage';
import { PresentationComparisonPage } from './pages/PresentationComparisonPage';
import { UIKitPage } from './pages/UIKitPage';
import { SkillOverviewPage } from './pages/SkillOverviewPage';
import { SkillConstraintsPage } from './pages/SkillConstraintsPage';
import { FrontendJourneyPage } from './pages/FrontendJourneyPage';

function GuideCanvas({ children, id }: { children: ReactNode; id: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const frame = ref.current;
    if (!frame) return;
    const update = () => setScale(Math.min(1, frame.clientWidth / 1600));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} id={id} className="cg-guide-frame" style={{ height: 900 * scale }}><div className="cg-guide-surface" style={{ transform: `scale(${scale})` }}>{children}</div></div>;
}
export function CreatorGuide() {
  if (new URLSearchParams(window.location.search).get('studyPreview') === 'convolution') return <NativeStudyPreview/>;
  return <main className="cg-guide"><GuideCanvas id="creator-guide-title"><TitlePage /></GuideCanvas><GuideCanvas id="learning-goals"><LearningGoalPage /></GuideCanvas><GuideCanvas id="education-paths"><EducationPathsPage /></GuideCanvas><GuideCanvas id="popular-science"><PopularSciencePage /></GuideCanvas><GuideCanvas id="professional-education"><ProfessionalEducationPage /></GuideCanvas><GuideCanvas id="intuitive-learning"><IntuitiveLearningPage /></GuideCanvas><GuideCanvas id="frontend-journey"><FrontendJourneyPage /></GuideCanvas><GuideCanvas id="skill-overview"><SkillOverviewPage /></GuideCanvas><GuideCanvas id="skill-constraints"><SkillConstraintsPage /></GuideCanvas><GuideCanvas id="ui-kit"><UIKitPage /></GuideCanvas><GuideCanvas id="multi-format"><MultiFormatPage /></GuideCanvas><GuideCanvas id="human-collaboration"><HumanCollaborationPage /></GuideCanvas><GuideCanvas id="presentation-comparison"><PresentationComparisonPage /></GuideCanvas><GuideCanvas id="creation-workflow"><CreationWorkflowPage /></GuideCanvas><GuideCanvas id="optional-interaction"><OptionalInteractionPage /></GuideCanvas><GuideCanvas id="progressive-disclosure"><ProgressiveDisclosurePage /></GuideCanvas><GuideCanvas id="discovery-learning"><DiscoveryLearningPage /></GuideCanvas><GuideCanvas id="shuku-why"><ShukuWhyPage/></GuideCanvas><GuideCanvas id="shuku-participation"><ShukuParticipationPage/></GuideCanvas><GuideCanvas id="shuku-review"><ShukuReviewPage/></GuideCanvas><GuideCanvas id="shuku-growth"><ShukuGrowthPage/></GuideCanvas><GuideCanvas id="shuku-cocreation-loop"><ShukuCoCreationLoop/></GuideCanvas></main>;
}
