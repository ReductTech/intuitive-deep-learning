import { ResearchRecommendationAppPage } from './pages/ResearchRecommendationAppPage/ResearchRecommendationAppPage';
import { ShukuCommunityEvolutionPage } from './pages/ShukuCommunityEvolutionPage/ShukuCommunityEvolutionPage';
import { FlexibleTeachingModesPage } from './pages/FlexibleTeachingModesPage/FlexibleTeachingModesPage';
import { RecommendedAssessmentPage } from './pages/RecommendedAssessmentPage/RecommendedAssessmentPage';
import { ShukuEditingPreviewPage } from './pages/ShukuEditingPreviewPage/ShukuEditingPreviewPage';
import { DualLearningEvaluationPage } from './pages/DualLearningEvaluationPage/DualLearningEvaluationPage';
import { TeachingTalentDiscoveryPage } from './pages/TeachingTalentDiscoveryPage/TeachingTalentDiscoveryPage';
import { EducationEcosystemPreviewPage } from './pages/EducationEcosystemPreviewPage/EducationEcosystemPreviewPage';
import { StudentCapabilitiesPage } from './pages/StudentCapabilitiesPage/StudentCapabilitiesPage';
import { Res2NetThinkingPage } from './pages/Res2NetThinkingPage/Res2NetThinkingPage';
import { PersonalizedResearchSupplyPage } from './pages/PersonalizedResearchSupplyPage/PersonalizedResearchSupplyPage';
import { ShowcaseGomokuPage } from './components/ShowcaseGomokuPage';
import { CreatorGuideReplay } from './components/creator-guide-copy/CreatorGuideReplay';
import { PlatformPositioningPage } from './pages/PlatformPositioningPage/PlatformPositioningPage';
import { OpeningPage } from './pages/OpeningPage/OpeningPage';
import { LearningGoalPage } from './pages/LearningGoalPage/LearningGoalPage';
import { ResearchInformationPage } from './pages/ResearchInformationPage/ResearchInformationPage';
import { PaperQualityPage } from './pages/PaperQualityPage/PaperQualityPage';
import { ResearchServicePage } from './pages/ResearchServicePage/ResearchServicePage';
import { CrossDomainFoundationPage } from './pages/CrossDomainFoundationPage/CrossDomainFoundationPage';
import { EducationPathsPage } from './pages/EducationPathsPage/EducationPathsPage';
import { ConvolutionObservationPage } from './pages/ConvolutionObservationPage/ConvolutionObservationPage';
import { ConvolutionDefinitionPage } from './pages/ConvolutionDefinitionPage/ConvolutionDefinitionPage';
import { ConvolutionWalkthroughPage } from './pages/ConvolutionWalkthroughPage/ConvolutionWalkthroughPage';
import { CodePracticePage } from './pages/CodePracticePage/CodePracticePage';
import type { DeckDefinition, SpeakerNote } from '../shared/react/presentation';
import outline from './outlines.json';
import './CreatorTypography.css';
import './CourseTypography.css';
const sceneDefinitions = {
 id:outline.id,title:outline.title,subtitle:`${outline.pages.length} 页 · 结构预览`,
 scenes:[
  {id:'opening',title:outline.pages[0].title,section:'学习目标',render:()=> <OpeningPage/>},
  {id:'learning-goals',title:outline.pages[1].title,section:'学习目标',render:()=> <LearningGoalPage/>},
  {id:'student-capabilities',title:outline.pages[2].title,section:'学习目标',render:()=> <StudentCapabilitiesPage/>},
  {id:'platform-positioning',title:outline.pages[3].title,section:'平台概览',render:()=> <PlatformPositioningPage/>},
  {id:'research-information',title:outline.pages[4].title,section:'科研信息获取',render:()=> <ResearchInformationPage/>},
  {id:'personalized-research-supply',title:outline.pages[5].title,section:'科研信息获取',render:()=> <PersonalizedResearchSupplyPage/>},
  {id:'paper-quality',title:outline.pages[6].title,section:'科研信息获取',render:()=> <PaperQualityPage/>},
  {id:'research-service',title:outline.pages[7].title,section:'科研信息获取',render:()=> <ResearchServicePage/>},
  {id:'research-recommendation-app',title:outline.pages[8].title,section:'科研信息获取',render:()=> <ResearchRecommendationAppPage/>},
  {id:'cross-domain-foundation',title:outline.pages[9].title,section:'交互式知识呈现与学习体验',render:()=> <CrossDomainFoundationPage/>},
  {id:'education-paths',title:outline.pages[10].title,section:'交互式知识呈现与学习体验',render:()=> <EducationPathsPage/>},
  {id:'popular-science',title:outline.pages[11].title,section:'交互式知识呈现与学习体验',render:()=> <ConvolutionObservationPage/>},
  {id:'professional-education',title:outline.pages[12].title,section:'交互式知识呈现与学习体验',render:()=> <ConvolutionDefinitionPage/>},
  {id:'intuitive-learning',title:outline.pages[13].title,section:'交互式知识呈现与学习体验',render:()=> <ConvolutionWalkthroughPage/>},
  {id:'showcase-gomoku',title:outline.pages[14].title,section:'交互式知识呈现与学习体验',render:()=> <ShowcaseGomokuPage page="play"/>},
  {id:'showcase-window-scan',title:outline.pages[15].title,section:'交互式知识呈现与学习体验',render:()=> <ShowcaseGomokuPage page="scan"/>},
  {id:'creator-copy-multi-format',title:outline.pages[16].title,section:'交互式知识呈现与学习体验',render:()=> <CreatorGuideReplay page="multi-format"/>},
  {id:'creator-copy-optional-interaction',title:outline.pages[17].title,section:'交互式知识呈现与学习体验',render:()=> <CreatorGuideReplay page="optional-interaction"/>},
  {id:'creator-copy-progressive-disclosure',title:outline.pages[18].title,section:'交互式知识呈现与学习体验',render:()=> <CreatorGuideReplay page="progressive-disclosure"/>},
  {id:'creator-copy-discovery-learning',title:outline.pages[19].title,section:'交互式知识呈现与学习体验',render:()=> <CreatorGuideReplay page="discovery-learning"/>},
  {id:'code-practice',title:outline.pages[20].title,section:'交互式知识呈现与学习体验',render:()=> <CodePracticePage/>},
  {id:'res2net-thinking',title:outline.pages[21].title,section:'交互式知识呈现与学习体验',render:()=> <Res2NetThinkingPage/>},
  {id:'flexible-teaching-modes',title:outline.pages[22].title,section:'课程组织与实践创作',render:()=> <FlexibleTeachingModesPage/>},
  {id:'recommended-assessment',title:outline.pages[23].title,section:'课程组织与实践创作',render:()=> <RecommendedAssessmentPage/>},
  {id:'creator-copy-presentation-comparison',title:outline.pages[24].title,section:'课程组织与实践创作',render:()=> <CreatorGuideReplay page="presentation-comparison"/>},
  {id:'creator-copy-frontend-journey',title:outline.pages[25].title,section:'课程组织与实践创作',render:()=> <CreatorGuideReplay page="frontend-journey"/>},
  {id:'creator-copy-skill-overview',title:outline.pages[26].title,section:'课程组织与实践创作',render:()=> <CreatorGuideReplay page="skill-overview"/>},
  {id:'creator-copy-skill-constraints',title:outline.pages[27].title,section:'课程组织与实践创作',render:()=> <CreatorGuideReplay page="skill-constraints"/>},
  {id:'creator-copy-ui-kit',title:outline.pages[28].title,section:'课程组织与实践创作',render:()=> <CreatorGuideReplay page="ui-kit"/>},
  {id:'creator-copy-creation-workflow',title:outline.pages[29].title,section:'课程组织与实践创作',render:()=> <CreatorGuideReplay page="creation-workflow"/>},
  {id:'educational-agent-practice',title:outline.pages[30].title,section:'课程组织与实践创作',render:()=> <ShukuCommunityEvolutionPage/>},
  {id:'dual-learning-evaluation',title:outline.pages[31].title,section:'学习评价',render:()=> <DualLearningEvaluationPage/>},
  {id:'teaching-talent-discovery',title:outline.pages[32].title,section:'人才与生态',render:()=> <TeachingTalentDiscoveryPage/>},
  {id:'education-ecosystem-preview',title:outline.pages[33].title,section:'人才与生态',render:()=> <EducationEcosystemPreviewPage/>},
 ]
} satisfies DeckDefinition;
export const deck = sceneDefinitions;
export function getPptNotes(sceneId:string):SpeakerNote[] {
 const index=deck.scenes.findIndex(scene=>scene.id===sceneId);
 return index<0?[]:[{text:outline.pages[index].snippet,selectors:[]}];
}
