import {ShukuCoCreationLoop} from './pages/ShukuCoCreationLoop';
import {ShukuWhyPage,ShukuParticipationPage,ShukuReviewPage,ShukuGrowthPage} from './pages/ShukuIntroPages';
import './CreatorTypography.css';
import { TitlePage } from './pages/TitlePage';
import { SceneDeck, type DeckDefinition } from "@shuku/course-style/react/presentation";
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
    { id: '36a07f33-67e6-4506-ac5d-899713539767', title: outline.pages.find(page => page.id === '36a07f33-67e6-4506-ac5d-899713539767')!.title, section: '课件创作指南', render: () => <TitlePage /> },
    { id: 'c1766733-2d0c-49c0-9acf-98b5f2bf3a29', title: outline.pages.find(page => page.id === 'c1766733-2d0c-49c0-9acf-98b5f2bf3a29')!.title, section: '为什么需要新的学习方式', render: () => <LearningGoalPage /> },
    { id: 'abe35996-1789-4f4f-9175-8996da3ed46b', title: outline.pages.find(page => page.id === 'abe35996-1789-4f4f-9175-8996da3ed46b')!.title, section: '为什么需要新的学习方式', render: () => <EducationPathsPage /> },
    { id: '82deb7aa-8b4a-43b8-b809-2827b01458dd', title: outline.pages.find(page => page.id === '82deb7aa-8b4a-43b8-b809-2827b01458dd')!.title, section: '为什么需要新的学习方式', render: () => <PopularSciencePage /> },
    { id: 'db916416-104c-42c0-95ad-8c66bb75b0d0', title: outline.pages.find(page => page.id === 'db916416-104c-42c0-95ad-8c66bb75b0d0')!.title, section: '为什么需要新的学习方式', render: () => <ProfessionalEducationPage /> },
    { id: '70a617c1-ef45-4e65-8a64-2aac06667897', title: outline.pages.find(page => page.id === '70a617c1-ef45-4e65-8a64-2aac06667897')!.title, section: '直觉式学习', render: () => <IntuitiveLearningPage /> },
    { id: '46a6fcd1-df79-4298-9f8e-de7d5462a846', title: outline.pages.find(page => page.id === '46a6fcd1-df79-4298-9f8e-de7d5462a846')!.title, section: '课件创作工具', render: () => <FrontendJourneyPage /> },
    { id: '20270d29-3f3c-44f3-ac02-a8bf362ff3ec', title: outline.pages.find(page => page.id === '20270d29-3f3c-44f3-ac02-a8bf362ff3ec')!.title, section: '课件创作工具', render: () => <SkillOverviewPage /> },
    { id: 'a8ecfc2e-62b7-4f0e-8996-f5668b1e95f6', title: outline.pages.find(page => page.id === 'a8ecfc2e-62b7-4f0e-8996-f5668b1e95f6')!.title, section: '课件创作工具', render: () => <SkillConstraintsPage /> },
    { id: '74e76127-5081-4903-92e9-e1bb04c27fe9', title: outline.pages.find(page => page.id === '74e76127-5081-4903-92e9-e1bb04c27fe9')!.title, section: '课件创作工具', render: () => <UIKitPage /> },
    { id: '8a1ba192-783a-4a0e-8f42-9fedb3ddce5b', title: outline.pages.find(page => page.id === '8a1ba192-783a-4a0e-8f42-9fedb3ddce5b')!.title, section: '直觉式学习', render: () => <MultiFormatPage /> },
    { id: 'e85b60a5-f071-44f7-9a02-70c80fce87df', title: outline.pages.find(page => page.id === 'e85b60a5-f071-44f7-9a02-70c80fce87df')!.title, section: '人与 AI 协作', render: () => <HumanCollaborationPage /> },
    { id: 'ba969d5f-76cf-40d8-b766-2c6d3b9a9aac', title: outline.pages.find(page => page.id === 'ba969d5f-76cf-40d8-b766-2c6d3b9a9aac')!.title, section: '课件创作实例', render: () => <PresentationComparisonPage /> },
    { id: '3e17188f-cfcc-4b53-a359-8a8eb0b6bc27', title: outline.pages.find(page => page.id === '3e17188f-cfcc-4b53-a359-8a8eb0b6bc27')!.title, section: '人与 AI 协作', render: () => <CreationWorkflowPage /> },
    { id: '0a3d818c-ae0c-432a-b244-5e9a6129ec22', title: outline.pages.find(page => page.id === '0a3d818c-ae0c-432a-b244-5e9a6129ec22')!.title, section: '教学设计示意', render: () => <OptionalInteractionPage /> },
    { id: '1ab0d195-ccc9-4bc8-ac9d-7d88e7240d74', title: outline.pages.find(page => page.id === '1ab0d195-ccc9-4bc8-ac9d-7d88e7240d74')!.title, section: '教学设计示意', render: () => <ProgressiveDisclosurePage /> },
    { id: 'ad7cdb0d-2834-48ba-a537-36e0b38a1e07', title: outline.pages.find(page => page.id === 'ad7cdb0d-2834-48ba-a537-36e0b38a1e07')!.title, section: '教学设计示意', render: () => <DiscoveryLearningPage /> },
    { id: '4f7f611a-cb68-48f9-895a-ef3ca2aa73a0', title: outline.pages.find(page => page.id === '4f7f611a-cb68-48f9-895a-ef3ca2aa73a0')!.title, section: '术库 · 知识共创', render: () => <ShukuWhyPage /> },
    { id: 'b4c2ce9c-1fc2-4b62-bba5-4b93a43beee6', title: outline.pages.find(page => page.id === 'b4c2ce9c-1fc2-4b62-bba5-4b93a43beee6')!.title, section: '术库 · 知识共创', render: () => <ShukuParticipationPage /> },
    { id: '472981bb-4fb2-464b-993a-1229db64efea', title: outline.pages.find(page => page.id === '472981bb-4fb2-464b-993a-1229db64efea')!.title, section: '术库 · 知识共创', render: () => <ShukuReviewPage /> },
    { id: 'ce06694c-ba51-42af-9871-781cdaff679c', title: outline.pages.find(page => page.id === 'ce06694c-ba51-42af-9871-781cdaff679c')!.title, section: '术库 · 知识共创', render: () => <ShukuGrowthPage /> },
    { id: '3ccbfdd4-22de-40ea-a6f3-613bcc668199', title: outline.pages.find(page => page.id === '3ccbfdd4-22de-40ea-a6f3-613bcc668199')!.title, section: '术库 · 知识共创', render: () => <ShukuCoCreationLoop /> },
  ],
};
const shukuPageSelectors: Record<string, string> = {
  '4f7f611a-cb68-48f9-895a-ef3ca2aa73a0': '.cg-shuku-why',
  'b4c2ce9c-1fc2-4b62-bba5-4b93a43beee6': '.cg-shuku-participation',
  '472981bb-4fb2-464b-993a-1229db64efea': '.cg-shuku-review',
  'ce06694c-ba51-42af-9871-781cdaff679c': '.cg-shuku-growth',
  '3ccbfdd4-22de-40ea-a6f3-613bcc668199': '.cg-shuku-cocreation-loop',
};
export const getPptNotes = (sceneId: string) => [{ text: outline.pages.find(page => page.id === sceneId)?.snippet ?? '', selectors: [shukuPageSelectors[sceneId] ?? (sceneId === '36a07f33-67e6-4506-ac5d-899713539767' ? '.cg-cover-page' : sceneId === 'c1766733-2d0c-49c0-9acf-98b5f2bf3a29' ? '.cg-goal-page' : sceneId === 'abe35996-1789-4f4f-9175-8996da3ed46b' ? '.cg-education-page' : sceneId === '82deb7aa-8b4a-43b8-b809-2827b01458dd' ? '.cg-pop-page' : sceneId === 'db916416-104c-42c0-95ad-8c66bb75b0d0' ? '.cg-pro-page' : sceneId === '70a617c1-ef45-4e65-8a64-2aac06667897' ? '.cg-intuitive-page' : sceneId === '8a1ba192-783a-4a0e-8f42-9fedb3ddce5b' ? '.cg-format-page' : sceneId === 'ad7cdb0d-2834-48ba-a537-36e0b38a1e07' ? '.cg-discovery-page' : sceneId === '1ab0d195-ccc9-4bc8-ac9d-7d88e7240d74' ? '.cg-disclosure-page' : sceneId === '0a3d818c-ae0c-432a-b244-5e9a6129ec22' ? '.cg-translation-page' : sceneId === '3e17188f-cfcc-4b53-a359-8a8eb0b6bc27' ? '.cg-workflow-page' : sceneId === 'e85b60a5-f071-44f7-9a02-70c80fce87df' ? '.cg-human-page' : sceneId === 'ba969d5f-76cf-40d8-b766-2c6d3b9a9aac' ? '.cg-case-page' : sceneId === '74e76127-5081-4903-92e9-e1bb04c27fe9' ? '.cg-kit-assembly-page' : sceneId === '20270d29-3f3c-44f3-ac02-a8bf362ff3ec' ? '.cg-overview-page' : sceneId === 'a8ecfc2e-62b7-4f0e-8996-f5668b1e95f6' ? '.cg-constraints-page' : sceneId === '46a6fcd1-df79-4298-9f8e-de7d5462a846' ? '.cg-journey-page' : '.cg-cover-page')] }];
export function CreatorPpt() {
  return <SceneDeck catalog={[deck]} moduleId={outline.id} assetId={outline.moduleIdentity.id} progressKey="lesson-flow:creator-guide-v1" getNotes={getPptNotes}/>;
}
