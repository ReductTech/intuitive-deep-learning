import { Res2NetThinkingPage } from './pages/Res2NetThinkingPage/Res2NetThinkingPage';
import { CompleteLearningLoopPage } from './pages/CompleteLearningLoopPage/CompleteLearningLoopPage';
import { PlatformScalePage } from './pages/PlatformScalePage/PlatformScalePage';
import { PersonalizedResearchSupplyPage } from './pages/PersonalizedResearchSupplyPage/PersonalizedResearchSupplyPage';
import { CaoChongPage } from './pages/CaoChongPage/CaoChongPage';
import { EstimateWeightPage } from './pages/EstimateWeightPage/EstimateWeightPage';
import { ShowcaseGomokuPage } from './components/ShowcaseGomokuPage';
import { CreatorGuideReplay } from './components/creator-guide-copy/CreatorGuideReplay';
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
import { CodePracticePage } from './pages/CodePracticePage/CodePracticePage';
import { ExperimentAnalysisPage } from './pages/ExperimentAnalysisPage/ExperimentAnalysisPage';
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
  {id:'personalized-research-supply',title:outline.pages[5].title,section:'科研信息获取',render:()=> <PersonalizedResearchSupplyPage/>},
  {id:'paper-quality',title:outline.pages[6].title,section:'科研信息获取',render:()=> <PaperQualityPage/>},
  {id:'research-service',title:outline.pages[7].title,section:'科研信息获取',render:()=> <ResearchServicePage/>},
  {id:'cross-domain-foundation',title:outline.pages[8].title,section:'理解与内容生成',render:()=> <CrossDomainFoundationPage/>},
  {id:'education-paths',title:outline.pages[9].title,section:'理解与内容生成',render:()=> <EducationPathsPage/>},
  {id:'popular-science',title:outline.pages[10].title,section:'理解与内容生成',render:()=> <ConvolutionObservationPage/>},
  {id:'professional-education',title:outline.pages[11].title,section:'理解与内容生成',render:()=> <ConvolutionDefinitionPage/>},
  {id:'intuitive-learning',title:outline.pages[12].title,section:'理解与内容生成',render:()=> <ConvolutionWalkthroughPage/>},
  {id:'showcase-cao-chong',title:outline.pages[13].title,section:'从熟悉情境到专业理解',render:()=> <CaoChongPage/>},
  {id:'showcase-regression-loss',title:outline.pages[14].title,section:'从熟悉情境到专业理解',render:()=> <EstimateWeightPage showLoss/>},
  {id:'showcase-gomoku',title:outline.pages[15].title,section:'从熟悉情境到专业理解',render:()=> <ShowcaseGomokuPage page="play"/>},
  {id:'showcase-window-scan',title:outline.pages[16].title,section:'从熟悉情境到专业理解',render:()=> <ShowcaseGomokuPage page="scan"/>},
  {id:'creator-copy-frontend-journey',title:outline.pages[17].title,section:'课件创作工具',render:()=> <CreatorGuideReplay page="frontend-journey"/>},
  {id:'creator-copy-skill-overview',title:outline.pages[18].title,section:'课件创作工具',render:()=> <CreatorGuideReplay page="skill-overview"/>},
  {id:'creator-copy-skill-constraints',title:outline.pages[19].title,section:'课件创作工具',render:()=> <CreatorGuideReplay page="skill-constraints"/>},
  {id:'creator-copy-ui-kit',title:outline.pages[20].title,section:'课件创作工具',render:()=> <CreatorGuideReplay page="ui-kit"/>},
  {id:'creator-copy-multi-format',title:outline.pages[21].title,section:'直觉式学习',render:()=> <CreatorGuideReplay page="multi-format"/>},
  {id:'creator-copy-human-collaboration',title:outline.pages[22].title,section:'人与AI协作',render:()=> <CreatorGuideReplay page="human-collaboration"/>},
  {id:'creator-copy-presentation-comparison',title:outline.pages[23].title,section:'课件创作实例',render:()=> <CreatorGuideReplay page="presentation-comparison"/>},
  {id:'creator-copy-creation-workflow',title:outline.pages[24].title,section:'人与AI协作',render:()=> <CreatorGuideReplay page="creation-workflow"/>},
  {id:'creator-copy-optional-interaction',title:outline.pages[25].title,section:'教学设计示意',render:()=> <CreatorGuideReplay page="optional-interaction"/>},
  {id:'creator-copy-progressive-disclosure',title:outline.pages[26].title,section:'教学设计示意',render:()=> <CreatorGuideReplay page="progressive-disclosure"/>},
  {id:'creator-copy-discovery-learning',title:outline.pages[27].title,section:'教学设计示意',render:()=> <CreatorGuideReplay page="discovery-learning"/>},
  {id:'res2net-thinking',title:outline.pages[28].title,section:'实践与深入探索',render:()=> <Res2NetThinkingPage/>},
  {id:'code-practice',title:outline.pages[29].title,section:'实践与深入探索',render:()=> <CodePracticePage/>},
  {id:'experiment-analysis',title:outline.pages[30].title,section:'实践与深入探索',render:()=> <ExperimentAnalysisPage/>},
  {id:'complete-learning-loop',title:outline.pages[31].title,section:'实践与深入探索',render:()=> <CompleteLearningLoopPage/>},
  {id:'learner-evaluation',title:outline.pages[32].title,section:'评价与生态育人',render:()=> <LearnerEvaluationPage/>},
  {id:'feedback-loop',title:outline.pages[33].title,section:'评价与生态育人',render:()=> <FeedbackLoopPage/>},
  {id:'knowledge-structure',title:outline.pages[34].title,section:'评价与生态育人',render:()=> <KnowledgeStructurePage/>},
  {id:'course-organization',title:outline.pages[35].title,section:'评价与生态育人',render:()=> <CourseOrganizationPage/>},
  {id:'student-outcomes',title:outline.pages[36].title,section:'评价与生态育人',render:()=> <StudentOutcomesPage/>},
  {id:'research-education-ecosystem',title:outline.pages[37].title,section:'评价与生态育人',render:()=> <ResearchEducationEcosystemPage/>},
  {id:'shuku-growth',title:outline.pages[38].title,section:'评价与生态育人',render:()=> <ShukuGrowthPage/>},
  {id:'platform-scale',title:outline.pages[39].title,section:'评价与生态育人',render:()=> <PlatformScalePage/>},
  {id:'cooperation-invitation',title:outline.pages[40].title,section:'评价与生态育人',render:()=> <CooperationInvitationPage/>},
 ]
} satisfies DeckDefinition;
export const deck = sceneDefinitions;
export function getPptNotes(sceneId:string):SpeakerNote[] {
 const index=deck.scenes.findIndex(scene=>scene.id===sceneId);
 return index<0?[]:[{text:outline.pages[index].snippet,selectors:[]}];
}
