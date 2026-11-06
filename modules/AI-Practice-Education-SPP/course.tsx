import { ShowcaseMultiKernelPage } from './pages/ShowcaseMultiKernelPage/ShowcaseMultiKernelPage';
import { ShowcaseDigitNetworkPage } from './pages/ShowcaseDigitNetworkPage/ShowcaseDigitNetworkPage';
import { ShowcaseOpenIdentityPage } from './pages/ShowcaseOpenIdentityPage/ShowcaseOpenIdentityPage';
import { ShowcaseDisguisePage } from './pages/ShowcaseDisguisePage/ShowcaseDisguisePage';
import { ShowcaseTripletLossPage } from './pages/ShowcaseTripletLossPage/ShowcaseTripletLossPage';
import { PdfVisualExtractionPage } from './pages/PdfVisualExtractionPage/PdfVisualExtractionPage';
import { MainFigureSelectionPage } from './pages/MainFigureSelectionPage/MainFigureSelectionPage';
import { AirflowControlPage } from './pages/AirflowControlPage/AirflowControlPage';
import { ShukuWebsiteShowcasePage } from './pages/ShukuWebsiteShowcasePage/ShukuWebsiteShowcasePage';
import { ImplementationBarrierPage } from './pages/ImplementationBarrierPage/ImplementationBarrierPage';
import { PublicationGrowthPage } from './pages/PublicationGrowthPage/PublicationGrowthPage';
import { KnowledgeGrowthPage } from './pages/KnowledgeGrowthPage/KnowledgeGrowthPage';
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
import { PaperQualityPage } from './pages/PaperQualityPage/PaperQualityPage';
import { ResearchServicePage } from './pages/ResearchServicePage/ResearchServicePage';
import { CrossDomainFoundationPage } from './pages/CrossDomainFoundationPage/CrossDomainFoundationPage';
import { EducationPathsPage } from './pages/EducationPathsPage/EducationPathsPage';
import { ConvolutionObservationPage } from './pages/ConvolutionObservationPage/ConvolutionObservationPage';
import { ConvolutionDefinitionPage } from './pages/ConvolutionDefinitionPage/ConvolutionDefinitionPage';
import { ConvolutionWalkthroughPage } from './pages/ConvolutionWalkthroughPage/ConvolutionWalkthroughPage';
import { CodePracticePage } from './pages/CodePracticePage/CodePracticePage';
import type { DeckDefinition, SpeakerNote, LessonContext } from '../shared/react/presentation';
import outline from './outlines.json';
import './CreatorTypography.css';
import './CourseTypography.css';
import './ResearchFoundation.css';
const sceneDefinitions = {
 id:outline.id,title:outline.title,subtitle:`${outline.pages.length} 页 · 结构预览`,
 scenes:[
  {id:'opening',title:outline.pages.find(page => page.id === 'opening')!.title,section:'学习目标',render:()=> <OpeningPage/>},
  {id:'spp-research-implementation-barrier',title:outline.pages.find(page => page.id === 'spp-research-implementation-barrier')!.title,section:'时代背景与问题',render:()=> <ImplementationBarrierPage/>},
  {id:'spp-knowledge-frontier',title:outline.pages.find(page => page.id === 'spp-knowledge-frontier')!.title,section:'时代背景与问题',render:()=> <KnowledgeGrowthPage/>},
  {id:'learning-goals',title:outline.pages.find(page => page.id === 'learning-goals')!.title,section:'学习目标',render:()=> <LearningGoalPage/>},
  {id:'student-capabilities',title:outline.pages.find(page => page.id === 'student-capabilities')!.title,section:'学习目标',render:()=> <StudentCapabilitiesPage/>},
  {id:'platform-positioning',title:outline.pages.find(page => page.id === 'platform-positioning')!.title,section:'平台概览',render:()=> <PlatformPositioningPage/>},
  {id:'spp-research-publication-growth',title:outline.pages.find(page => page.id === 'spp-research-publication-growth')!.title,section:'时代背景与问题',render:()=> <PublicationGrowthPage/>},
  {id:'personalized-research-supply',title:outline.pages.find(page => page.id === 'personalized-research-supply')!.title,section:'科研信息获取',render:()=> <PersonalizedResearchSupplyPage/>},
  {id:'paper-quality',title:outline.pages.find(page => page.id === 'paper-quality')!.title,section:'科研信息获取',render:()=> <PaperQualityPage/>},
  {id:'research-service',title:outline.pages.find(page => page.id === 'research-service')!.title,section:'科研信息获取',render:()=> <ResearchServicePage/>},
  {id:'spp-foundation-pdf-structuring',title:outline.pages.find(page => page.id === 'spp-foundation-pdf-structuring')!.title,section:'科研信息获取',render:(context?:LessonContext)=> <PdfVisualExtractionPage onComplete={()=>{context?.complete();context?.next?.();}}/>},
  {id:'spp-foundation-main-figure-selection',title:outline.pages.find(page => page.id === 'spp-foundation-main-figure-selection')!.title,section:'科研信息获取',render:(context?:LessonContext)=> <MainFigureSelectionPage onComplete={()=>{context?.complete();context?.next?.();}}/>},
  {id:'spp-foundation-literature-service',title:outline.pages.find(page => page.id === 'spp-foundation-literature-service')!.title,section:'科研信息获取',render:(context?:LessonContext)=> <AirflowControlPage onComplete={()=>{context?.complete();context?.next?.();}}/>},
  {id:'research-recommendation-app',title:outline.pages.find(page => page.id === 'research-recommendation-app')!.title,section:'科研信息获取',render:()=> <ResearchRecommendationAppPage/>},
  {id:'cross-domain-foundation',title:outline.pages.find(page => page.id === 'cross-domain-foundation')!.title,section:'交互式知识呈现与学习体验',render:()=> <CrossDomainFoundationPage/>},
  {id:'education-paths',title:outline.pages.find(page => page.id === 'education-paths')!.title,section:'交互式知识呈现与学习体验',render:()=> <EducationPathsPage/>},
  {id:'popular-science',title:outline.pages.find(page => page.id === 'popular-science')!.title,section:'交互式知识呈现与学习体验',render:()=> <ConvolutionObservationPage/>},
  {id:'professional-education',title:outline.pages.find(page => page.id === 'professional-education')!.title,section:'交互式知识呈现与学习体验',render:()=> <ConvolutionDefinitionPage/>},
  {id:'intuitive-learning',title:outline.pages.find(page => page.id === 'intuitive-learning')!.title,section:'交互式知识呈现与学习体验',render:()=> <ConvolutionWalkthroughPage/>},
  {id:'showcase-gomoku',title:outline.pages.find(page => page.id === 'showcase-gomoku')!.title,section:'交互式知识呈现与学习体验',render:()=> <ShowcaseGomokuPage page="play"/>},
  {id:'showcase-window-scan',title:outline.pages.find(page => page.id === 'showcase-window-scan')!.title,section:'交互式知识呈现与学习体验',render:()=> <ShowcaseGomokuPage page="scan"/>},
  {id:'showcase-kernel-design',title:outline.pages.find(page => page.id === 'showcase-kernel-design')!.title,section:'交互式知识呈现与学习体验',render:()=> <ShowcaseGomokuPage page="design"/>},
  {id:'showcase-multi-kernel',title:outline.pages.find(page => page.id === 'showcase-multi-kernel')!.title,section:'交互式知识呈现与学习体验',render:()=> <ShowcaseMultiKernelPage/>},
  {id:'showcase-digit-network',title:outline.pages.find(page => page.id === 'showcase-digit-network')!.title,section:'交互式知识呈现与学习体验',render:()=> <ShowcaseDigitNetworkPage/>},
  {id:'showcase-open-identity',title:outline.pages.find(page => page.id === 'showcase-open-identity')!.title,section:'交互式知识呈现与学习体验',render:()=> <ShowcaseOpenIdentityPage/>},
  {id:'showcase-disguise-verification',title:outline.pages.find(page => page.id === 'showcase-disguise-verification')!.title,section:'交互式知识呈现与学习体验',render:()=> <ShowcaseDisguisePage/>},
  {id:'showcase-triplet-loss',title:outline.pages.find(page => page.id === 'showcase-triplet-loss')!.title,section:'交互式知识呈现与学习体验',render:()=> <ShowcaseTripletLossPage/>},
  {id:'creator-copy-optional-interaction',title:outline.pages.find(page => page.id === 'creator-copy-optional-interaction')!.title,section:'交互式知识呈现与学习体验',render:()=> <CreatorGuideReplay page="optional-interaction"/>},
  {id:'creator-copy-progressive-disclosure',title:outline.pages.find(page => page.id === 'creator-copy-progressive-disclosure')!.title,section:'交互式知识呈现与学习体验',render:()=> <CreatorGuideReplay page="progressive-disclosure"/>},
  {id:'creator-copy-discovery-learning',title:outline.pages.find(page => page.id === 'creator-copy-discovery-learning')!.title,section:'交互式知识呈现与学习体验',render:()=> <CreatorGuideReplay page="discovery-learning"/>},
  {id:'res2net-thinking',title:outline.pages.find(page => page.id === 'res2net-thinking')!.title,section:'交互式知识呈现与学习体验',render:()=> <Res2NetThinkingPage/>},
  {id:'code-practice',title:outline.pages.find(page => page.id === 'code-practice')!.title,section:'交互式知识呈现与学习体验',render:()=> <CodePracticePage/>},
  {id:'spp-foundation-showcase-shuku',title:outline.pages.find(page => page.id === 'spp-foundation-showcase-shuku')!.title,section:'交互式知识呈现与学习体验',render:(context?:LessonContext)=> <ShukuWebsiteShowcasePage/>},
  {id:'creator-copy-multi-format',title:outline.pages.find(page => page.id === 'creator-copy-multi-format')!.title,section:'交互式知识呈现与学习体验',render:()=> <CreatorGuideReplay page="multi-format"/>},
  {id:'flexible-teaching-modes',title:outline.pages.find(page => page.id === 'flexible-teaching-modes')!.title,section:'课程组织与实践创作',render:()=> <FlexibleTeachingModesPage/>},
  {id:'recommended-assessment',title:outline.pages.find(page => page.id === 'recommended-assessment')!.title,section:'课程组织与实践创作',render:()=> <RecommendedAssessmentPage/>},
  {id:'dual-learning-evaluation',title:outline.pages.find(page => page.id === 'dual-learning-evaluation')!.title,section:'学习评价',render:()=> <DualLearningEvaluationPage/>},
  {id:'creator-copy-presentation-comparison',title:outline.pages.find(page => page.id === 'creator-copy-presentation-comparison')!.title,section:'课程组织与实践创作',render:()=> <CreatorGuideReplay page="presentation-comparison"/>},
  {id:'creator-copy-frontend-journey',title:outline.pages.find(page => page.id === 'creator-copy-frontend-journey')!.title,section:'课程组织与实践创作',render:()=> <CreatorGuideReplay page="frontend-journey"/>},
  {id:'creator-copy-skill-overview',title:outline.pages.find(page => page.id === 'creator-copy-skill-overview')!.title,section:'课程组织与实践创作',render:()=> <CreatorGuideReplay page="skill-overview"/>},
  {id:'creator-copy-skill-constraints',title:outline.pages.find(page => page.id === 'creator-copy-skill-constraints')!.title,section:'课程组织与实践创作',render:()=> <CreatorGuideReplay page="skill-constraints"/>},
  {id:'creator-copy-ui-kit',title:outline.pages.find(page => page.id === 'creator-copy-ui-kit')!.title,section:'课程组织与实践创作',render:()=> <CreatorGuideReplay page="ui-kit"/>},
  {id:'creator-copy-creation-workflow',title:outline.pages.find(page => page.id === 'creator-copy-creation-workflow')!.title,section:'课程组织与实践创作',render:()=> <CreatorGuideReplay page="creation-workflow"/>},
  {id:'educational-agent-practice',title:outline.pages.find(page => page.id === 'educational-agent-practice')!.title,section:'课程组织与实践创作',render:()=> <ShukuCommunityEvolutionPage/>},
  {id:'teaching-talent-discovery',title:outline.pages.find(page => page.id === 'teaching-talent-discovery')!.title,section:'人才与生态',render:()=> <TeachingTalentDiscoveryPage/>},
  {id:'education-ecosystem-preview',title:outline.pages.find(page => page.id === 'education-ecosystem-preview')!.title,section:'人才与生态',render:()=> <EducationEcosystemPreviewPage/>},
 ]
} satisfies DeckDefinition;
export const deck = sceneDefinitions;
export function getPptNotes(sceneId:string):SpeakerNote[] {
 const page=outline.pages.find(page=>page.id===sceneId);
 return page?[{text:page.snippet,selectors:[]}]:[];
}
