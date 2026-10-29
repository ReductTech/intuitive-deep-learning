import { PlatformPositioningPage } from './pages/PlatformPositioningPage/PlatformPositioningPage';
import { OpeningPage } from './pages/OpeningPage/OpeningPage';
import { LearningGoalPage } from './pages/LearningGoalPage/LearningGoalPage';
import { FoundationFrontierPage } from './pages/FoundationFrontierPage/FoundationFrontierPage';
import { ResearchInformationPage } from './pages/ResearchInformationPage/ResearchInformationPage';
import { PaperQualityPage } from './pages/PaperQualityPage/PaperQualityPage';
import { ResearchServicePage } from './pages/ResearchServicePage/ResearchServicePage';
import { CrossDomainFoundationPage } from './pages/CrossDomainFoundationPage/CrossDomainFoundationPage';
import { EducationPathsPage } from './pages/EducationPathsPage/EducationPathsPage';
import { ConvolutionObservationPage } from './pages/ConvolutionObservationPage/ConvolutionObservationPage';
import { ConvolutionDefinitionPage } from './pages/ConvolutionDefinitionPage/ConvolutionDefinitionPage';
import { ConvolutionWalkthroughPage } from './pages/ConvolutionWalkthroughPage/ConvolutionWalkthroughPage';
import { MultimodalGenerationPage } from './pages/MultimodalGenerationPage/MultimodalGenerationPage';
import { HumanCollaborationPage } from './pages/HumanCollaborationPage';
import { CreationWorkflowPage } from './pages/CreationWorkflowPage';
import { GomokuLearningPage } from './pages/GomokuLearningPage/GomokuLearningPage';
import { CodePracticePage } from './pages/CodePracticePage/CodePracticePage';
import { ExperimentAnalysisPage } from './pages/ExperimentAnalysisPage/ExperimentAnalysisPage';
import { ResearchExtensionPage } from './pages/ResearchExtensionPage/ResearchExtensionPage';
import { ProgressiveDisclosurePage } from './pages/ProgressiveDisclosurePage';
import { DiscoveryLearningPage } from './pages/DiscoveryLearningPage';
import { LearnerEvaluationPage } from './pages/LearnerEvaluationPage/LearnerEvaluationPage';
import { FeedbackLoopPage } from './pages/FeedbackLoopPage/FeedbackLoopPage';
import { KnowledgeStructurePage } from './pages/KnowledgeStructurePage/KnowledgeStructurePage';
import { CourseOrganizationPage } from './pages/CourseOrganizationPage/CourseOrganizationPage';
import { StudentOutcomesPage } from './pages/StudentOutcomesPage/StudentOutcomesPage';
import { ShukuGrowthPage } from './pages/ShukuIntroPages';
import { ResearchEducationEcosystemPage } from './pages/ResearchEducationEcosystemPage/ResearchEducationEcosystemPage';
import { CooperationInvitationPage } from './pages/CooperationInvitationPage/CooperationInvitationPage';
import type { DeckDefinition, SpeakerNote } from '../shared/react/presentation';
import outline from './outlines.json';
import './CreatorTypography.css';
import './CourseTypography.css';
const sceneDefinitions = {
 id:outline.id,title:outline.title,subtitle:`${outline.pages.length} 页 · 结构预览`,
 scenes:[
  {id:'opening',title:outline.pages[0].title,section:'学习目标',render:()=> <OpeningPage/>},
  {id:'learning-goals',title:outline.pages[1].title,section:'学习目标',render:()=> <LearningGoalPage/>},
  {id:'foundation-frontier',title:outline.pages[2].title,section:'学习目标',render:()=> <FoundationFrontierPage/>},
  {id:'platform-positioning',title:outline.pages[3].title,section:'平台概览',render:()=> <PlatformPositioningPage/>},
  {id:'research-information',title:outline.pages[4].title,section:'科研信息获取',render:()=> <ResearchInformationPage/>},
  {id:'paper-quality',title:outline.pages[5].title,section:'科研信息获取',render:()=> <PaperQualityPage/>},
  {id:'research-service',title:outline.pages[6].title,section:'科研信息获取',render:()=> <ResearchServicePage/>},
  {id:'cross-domain-foundation',title:outline.pages[7].title,section:'理解与内容生成',render:()=> <CrossDomainFoundationPage/>},
  {id:'education-paths',title:outline.pages[8].title,section:'理解与内容生成',render:()=> <EducationPathsPage/>},
  {id:'popular-science',title:outline.pages[9].title,section:'理解与内容生成',render:()=> <ConvolutionObservationPage/>},
  {id:'professional-education',title:outline.pages[10].title,section:'理解与内容生成',render:()=> <ConvolutionDefinitionPage/>},
  {id:'intuitive-learning',title:outline.pages[11].title,section:'理解与内容生成',render:()=> <ConvolutionWalkthroughPage/>},
  {id:'multimodal-generation',title:outline.pages[12].title,section:'理解与内容生成',render:()=> <MultimodalGenerationPage/>},
  {id:'human-collaboration',title:outline.pages[13].title,section:'理解与内容生成',render:()=> <HumanCollaborationPage/>},
  {id:'creation-workflow',title:outline.pages[14].title,section:'理解与内容生成',render:()=> <CreationWorkflowPage/>},
  {id:'gomoku-learning',title:outline.pages[15].title,section:'理解与内容生成',render:()=> <GomokuLearningPage/>},
  {id:'code-practice',title:outline.pages[16].title,section:'实践与深入探索',render:()=> <CodePracticePage/>},
  {id:'experiment-analysis',title:outline.pages[17].title,section:'实践与深入探索',render:()=> <ExperimentAnalysisPage/>},
  {id:'research-extension',title:outline.pages[18].title,section:'实践与深入探索',render:()=> <ResearchExtensionPage/>},
  {id:'progressive-disclosure',title:outline.pages[19].title,section:'实践与深入探索',render:()=> <ProgressiveDisclosurePage/>},
  {id:'discovery-learning',title:outline.pages[20].title,section:'实践与深入探索',render:()=> <DiscoveryLearningPage/>},
  {id:'learner-evaluation',title:outline.pages[21].title,section:'评价与生态育人',render:()=> <LearnerEvaluationPage/>},
  {id:'feedback-loop',title:outline.pages[22].title,section:'评价与生态育人',render:()=> <FeedbackLoopPage/>},
  {id:'knowledge-structure',title:outline.pages[23].title,section:'评价与生态育人',render:()=> <KnowledgeStructurePage/>},
  {id:'course-organization',title:outline.pages[24].title,section:'评价与生态育人',render:()=> <CourseOrganizationPage/>},
  {id:'student-outcomes',title:outline.pages[25].title,section:'评价与生态育人',render:()=> <StudentOutcomesPage/>},
  {id:'shuku-growth',title:outline.pages[26].title,section:'评价与生态育人',render:()=> <ShukuGrowthPage/>},
  {id:'research-education-ecosystem',title:outline.pages[27].title,section:'评价与生态育人',render:()=> <ResearchEducationEcosystemPage/>},
  {id:'cooperation-invitation',title:outline.pages[28].title,section:'评价与生态育人',render:()=> <CooperationInvitationPage/>},
 ]
} satisfies DeckDefinition;
export const deck = sceneDefinitions;
export function getPptNotes(sceneId:string):SpeakerNote[] {
 const index=deck.scenes.findIndex(scene=>scene.id===sceneId);
 return index<0?[]:[{text:outline.pages[index].snippet,selectors:[]}];
}
