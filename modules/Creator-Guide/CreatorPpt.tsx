import './CreatorTypography.css';
import { TitlePage } from './pages/TitlePage';
import { SceneDeck, type DeckDefinition } from '../shared/react/presentation';
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
import outline from './outlines.json';

export const deck: DeckDefinition = {
  id: outline.id, title: outline.title, subtitle: `课件创作 · ${outline.pages.length} 页`,
  scenes: [
    { id: 'creator-guide-title', title: outline.pages[0].title, section: '课件创作指南', render: () => <TitlePage /> },
    { id: 'learning-goals', title: outline.pages[1].title, section: '为什么需要新的学习方式', render: () => <LearningGoalPage /> },
    { id: 'education-paths', title: outline.pages[2].title, section: '为什么需要新的学习方式', render: () => <EducationPathsPage /> },
    { id: 'popular-science', title: outline.pages[3].title, section: '为什么需要新的学习方式', render: () => <PopularSciencePage /> },
    { id: 'professional-education', title: outline.pages[4].title, section: '为什么需要新的学习方式', render: () => <ProfessionalEducationPage /> },
    { id: 'intuitive-learning', title: outline.pages[5].title, section: '直觉式学习', render: () => <IntuitiveLearningPage /> },
    { id: 'frontend-journey', title: outline.pages[6].title, section: '课件创作工具', render: () => <FrontendJourneyPage /> },
    { id: 'skill-overview', title: outline.pages[7].title, section: '课件创作工具', render: () => <SkillOverviewPage /> },
    { id: 'skill-constraints', title: outline.pages[8].title, section: '课件创作工具', render: () => <SkillConstraintsPage /> },
    { id: 'ui-kit', title: outline.pages[9].title, section: '课件创作工具', render: () => <UIKitPage /> },
    { id: 'multi-format', title: outline.pages[10].title, section: '直觉式学习', render: () => <MultiFormatPage /> },
    { id: 'human-collaboration', title: outline.pages[11].title, section: '人与 AI 协作', render: () => <HumanCollaborationPage /> },
    { id: 'presentation-comparison', title: outline.pages[12].title, section: '课件创作实例', render: () => <PresentationComparisonPage /> },
    { id: 'creation-workflow', title: outline.pages[13].title, section: '人与 AI 协作', render: () => <CreationWorkflowPage /> },
    { id: 'optional-interaction', title: outline.pages[14].title, section: '教学设计示意', render: () => <OptionalInteractionPage /> },
    { id: 'progressive-disclosure', title: outline.pages[15].title, section: '教学设计示意', render: () => <ProgressiveDisclosurePage /> },
    { id: 'discovery-learning', title: outline.pages[16].title, section: '教学设计示意', render: () => <DiscoveryLearningPage /> },
  ],
};
export const getPptNotes = (sceneId: string) => [{ text: outline.pages.find(page => page.id === sceneId)?.snippet ?? '', selectors: [sceneId === 'creator-guide-title' ? '.cg-cover-page' : sceneId === 'learning-goals' ? '.cg-goal-page' : sceneId === 'education-paths' ? '.cg-education-page' : sceneId === 'popular-science' ? '.cg-pop-page' : sceneId === 'professional-education' ? '.cg-pro-page' : sceneId === 'intuitive-learning' ? '.cg-intuitive-page' : sceneId === 'multi-format' ? '.cg-format-page' : sceneId === 'discovery-learning' ? '.cg-discovery-page' : sceneId === 'progressive-disclosure' ? '.cg-disclosure-page' : sceneId === 'optional-interaction' ? '.cg-optional-page' : sceneId === 'creation-workflow' ? '.cg-workflow-page' : sceneId === 'human-collaboration' ? '.cg-human-page' : sceneId === 'presentation-comparison' ? '.cg-case-page' : sceneId === 'ui-kit' ? '.cg-kit-assembly-page' : sceneId === 'skill-overview' ? '.cg-overview-page' : sceneId === 'skill-constraints' ? '.cg-constraints-page' : sceneId === 'frontend-journey' ? '.cg-journey-page' : '.cg-cover-page'] }];
export function CreatorPpt() {
  return <SceneDeck catalog={[deck]} moduleId={outline.id} assetId={outline.moduleIdentity.id} progressKey="lesson-flow:creator-guide-v1" getNotes={getPptNotes}/>;
}
