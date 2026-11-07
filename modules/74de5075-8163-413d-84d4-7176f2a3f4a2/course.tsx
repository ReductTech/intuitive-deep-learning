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
  {id:'cd92f6e8-4aae-420f-aec3-50a78ddf79a9',title:outline.pages.find(page => page.id === 'cd92f6e8-4aae-420f-aec3-50a78ddf79a9')!.title,section:'学习目标',render:()=> <OpeningPage/>},
  {id:'aee1a1a1-9e6c-4d7c-90e3-25d418c52c4f',title:outline.pages.find(page => page.id === 'aee1a1a1-9e6c-4d7c-90e3-25d418c52c4f')!.title,section:'时代背景与问题',render:()=> <ImplementationBarrierPage/>},
  {id:'3eb8cbfa-5133-4a67-94c8-54408d834e2a',title:outline.pages.find(page => page.id === '3eb8cbfa-5133-4a67-94c8-54408d834e2a')!.title,section:'时代背景与问题',render:()=> <KnowledgeGrowthPage/>},
  {id:'186b2816-6a7e-4f75-8541-b6814c762821',title:outline.pages.find(page => page.id === '186b2816-6a7e-4f75-8541-b6814c762821')!.title,section:'学习目标',render:()=> <LearningGoalPage/>},
  {id:'50670946-ab25-4a39-88e0-4a63b4d70945',title:outline.pages.find(page => page.id === '50670946-ab25-4a39-88e0-4a63b4d70945')!.title,section:'学习目标',render:()=> <StudentCapabilitiesPage/>},
  {id:'8bca5254-091d-445c-b194-dce2c0dc354e',title:outline.pages.find(page => page.id === '8bca5254-091d-445c-b194-dce2c0dc354e')!.title,section:'平台概览',render:()=> <PlatformPositioningPage/>},
  {id:'3a66a203-9cea-41c6-ab20-b71d57733afe',title:outline.pages.find(page => page.id === '3a66a203-9cea-41c6-ab20-b71d57733afe')!.title,section:'时代背景与问题',render:()=> <PublicationGrowthPage/>},
  {id:'53c7df3e-7d4c-4501-86ff-459e78985dc7',title:outline.pages.find(page => page.id === '53c7df3e-7d4c-4501-86ff-459e78985dc7')!.title,section:'科研信息获取',render:()=> <PersonalizedResearchSupplyPage/>},
  {id:'2bdb1f72-89f6-4d31-80e6-97ecd980a6ca',title:outline.pages.find(page => page.id === '2bdb1f72-89f6-4d31-80e6-97ecd980a6ca')!.title,section:'科研信息获取',render:()=> <PaperQualityPage/>},
  {id:'5ebd7132-4f46-483a-a1d6-90d22f87bb1e',title:outline.pages.find(page => page.id === '5ebd7132-4f46-483a-a1d6-90d22f87bb1e')!.title,section:'科研信息获取',render:()=> <ResearchServicePage/>},
  {id:'2c29b4b8-4039-45ed-9d2a-a780654b131c',title:outline.pages.find(page => page.id === '2c29b4b8-4039-45ed-9d2a-a780654b131c')!.title,section:'科研信息获取',render:(context?:LessonContext)=> <PdfVisualExtractionPage onComplete={()=>{context?.complete();context?.next?.();}}/>},
  {id:'94bba564-d4ec-4aa2-9bcb-a8c40142f634',title:outline.pages.find(page => page.id === '94bba564-d4ec-4aa2-9bcb-a8c40142f634')!.title,section:'科研信息获取',render:(context?:LessonContext)=> <MainFigureSelectionPage onComplete={()=>{context?.complete();context?.next?.();}}/>},
  {id:'b1b26a9b-c341-408e-a6de-8de15e9025c1',title:outline.pages.find(page => page.id === 'b1b26a9b-c341-408e-a6de-8de15e9025c1')!.title,section:'科研信息获取',render:(context?:LessonContext)=> <AirflowControlPage onComplete={()=>{context?.complete();context?.next?.();}}/>},
  {id:'b4f18ddc-6815-4c49-8e6e-2c74b3eaeb01',title:outline.pages.find(page => page.id === 'b4f18ddc-6815-4c49-8e6e-2c74b3eaeb01')!.title,section:'科研信息获取',render:()=> <ResearchRecommendationAppPage/>},
  {id:'8435c800-bca3-476a-b09c-6290d44f935d',title:outline.pages.find(page => page.id === '8435c800-bca3-476a-b09c-6290d44f935d')!.title,section:'交互式知识呈现与学习体验',render:()=> <CrossDomainFoundationPage/>},
  {id:'96d7298c-135c-4ecb-8133-a97eb6c4e659',title:outline.pages.find(page => page.id === '96d7298c-135c-4ecb-8133-a97eb6c4e659')!.title,section:'交互式知识呈现与学习体验',render:()=> <EducationPathsPage/>},
  {id:'4b73bf56-5848-4873-8e5d-80739c8cbcb0',title:outline.pages.find(page => page.id === '4b73bf56-5848-4873-8e5d-80739c8cbcb0')!.title,section:'交互式知识呈现与学习体验',render:()=> <ConvolutionObservationPage/>},
  {id:'6e6236b7-c87e-48d7-a446-0051e47d901d',title:outline.pages.find(page => page.id === '6e6236b7-c87e-48d7-a446-0051e47d901d')!.title,section:'交互式知识呈现与学习体验',render:()=> <ConvolutionDefinitionPage/>},
  {id:'327440f9-b157-421c-8033-9e1085157d3a',title:outline.pages.find(page => page.id === '327440f9-b157-421c-8033-9e1085157d3a')!.title,section:'交互式知识呈现与学习体验',render:()=> <ConvolutionWalkthroughPage/>},
  {id:'b58d4893-18ba-4965-9d13-af75e5d7d457',title:outline.pages.find(page => page.id === 'b58d4893-18ba-4965-9d13-af75e5d7d457')!.title,section:'交互式知识呈现与学习体验',render:()=> <ShowcaseGomokuPage page="play"/>},
  {id:'1870b760-60e3-4320-8648-6005eaf2fcc4',title:outline.pages.find(page => page.id === '1870b760-60e3-4320-8648-6005eaf2fcc4')!.title,section:'交互式知识呈现与学习体验',render:()=> <ShowcaseGomokuPage page="scan"/>},
  {id:'5e33075a-74fa-400b-9be6-3bd39aa32d22',title:outline.pages.find(page => page.id === '5e33075a-74fa-400b-9be6-3bd39aa32d22')!.title,section:'交互式知识呈现与学习体验',render:()=> <ShowcaseGomokuPage page="design"/>},
  {id:'c4ed0766-5755-4ca7-bbd5-ba43bb43d6c1',title:outline.pages.find(page => page.id === 'c4ed0766-5755-4ca7-bbd5-ba43bb43d6c1')!.title,section:'交互式知识呈现与学习体验',render:()=> <ShowcaseMultiKernelPage/>},
  {id:'4d39d976-2806-4e4f-a2f9-fe75a4d03863',title:outline.pages.find(page => page.id === '4d39d976-2806-4e4f-a2f9-fe75a4d03863')!.title,section:'交互式知识呈现与学习体验',render:()=> <ShowcaseDigitNetworkPage/>},
  {id:'cd782b56-2aeb-4f68-a2e4-4e337be46847',title:outline.pages.find(page => page.id === 'cd782b56-2aeb-4f68-a2e4-4e337be46847')!.title,section:'交互式知识呈现与学习体验',render:()=> <ShowcaseOpenIdentityPage/>},
  {id:'4232ac4e-b42a-4cc1-881c-a90ea610caf9',title:outline.pages.find(page => page.id === '4232ac4e-b42a-4cc1-881c-a90ea610caf9')!.title,section:'交互式知识呈现与学习体验',render:()=> <ShowcaseDisguisePage/>},
  {id:'f9b7c2a0-f264-49b9-a1b1-cf3a63fdc708',title:outline.pages.find(page => page.id === 'f9b7c2a0-f264-49b9-a1b1-cf3a63fdc708')!.title,section:'交互式知识呈现与学习体验',render:()=> <ShowcaseTripletLossPage/>},
  {id:'59b91124-2c95-4d00-b285-bda6765c7b15',title:outline.pages.find(page => page.id === '59b91124-2c95-4d00-b285-bda6765c7b15')!.title,section:'交互式知识呈现与学习体验',render:()=> <CreatorGuideReplay page="f63d0e01-e1ee-4a4e-8bd0-242fd64f8ab9"/>},
  {id:'449762da-0ad4-4101-bc4e-0b696adf810e',title:outline.pages.find(page => page.id === '449762da-0ad4-4101-bc4e-0b696adf810e')!.title,section:'交互式知识呈现与学习体验',render:()=> <CreatorGuideReplay page="b4fe6d42-b120-4eaf-907d-1335568d836b"/>},
  {id:'ac7b3ec8-2bbc-4210-8017-ce0e569b6bba',title:outline.pages.find(page => page.id === 'ac7b3ec8-2bbc-4210-8017-ce0e569b6bba')!.title,section:'交互式知识呈现与学习体验',render:()=> <CreatorGuideReplay page="50b60fc5-6773-4a2d-a62f-caf58162de05"/>},
  {id:'73095b1f-b97a-4deb-b3b6-472528807e74',title:outline.pages.find(page => page.id === '73095b1f-b97a-4deb-b3b6-472528807e74')!.title,section:'交互式知识呈现与学习体验',render:()=> <Res2NetThinkingPage/>},
  {id:'d3d181cc-c778-4f9c-bd16-020fa2957308',title:outline.pages.find(page => page.id === 'd3d181cc-c778-4f9c-bd16-020fa2957308')!.title,section:'交互式知识呈现与学习体验',render:()=> <CodePracticePage/>},
  {id:'dc438046-fa16-4c6a-9abe-8300a58af6b0',title:outline.pages.find(page => page.id === 'dc438046-fa16-4c6a-9abe-8300a58af6b0')!.title,section:'交互式知识呈现与学习体验',render:(context?:LessonContext)=> <ShukuWebsiteShowcasePage/>},
  {id:'2d3361aa-4263-4f5c-b352-189ee0b890cb',title:outline.pages.find(page => page.id === '2d3361aa-4263-4f5c-b352-189ee0b890cb')!.title,section:'交互式知识呈现与学习体验',render:()=> <CreatorGuideReplay page="2529070b-9d4e-4124-be29-107310405f89"/>},
  {id:'4a3b72b2-16e6-4740-94ca-6f1d986746ad',title:outline.pages.find(page => page.id === '4a3b72b2-16e6-4740-94ca-6f1d986746ad')!.title,section:'课程组织与实践创作',render:()=> <FlexibleTeachingModesPage/>},
  {id:'763364ce-da3d-41ae-b4b7-fbdeaa038b1f',title:outline.pages.find(page => page.id === '763364ce-da3d-41ae-b4b7-fbdeaa038b1f')!.title,section:'课程组织与实践创作',render:()=> <RecommendedAssessmentPage/>},
  {id:'571b454b-3650-4ee0-bb95-43d41371c7ac',title:outline.pages.find(page => page.id === '571b454b-3650-4ee0-bb95-43d41371c7ac')!.title,section:'学习评价',render:()=> <DualLearningEvaluationPage/>},
  {id:'9146efc9-9f24-4ecd-bc68-bc8df903a106',title:outline.pages.find(page => page.id === '9146efc9-9f24-4ecd-bc68-bc8df903a106')!.title,section:'课程组织与实践创作',render:()=> <CreatorGuideReplay page="1502a3c2-01a6-4c20-b2ce-f68e722c5314"/>},
  {id:'4719665f-e424-456f-bff6-f2e197b724e4',title:outline.pages.find(page => page.id === '4719665f-e424-456f-bff6-f2e197b724e4')!.title,section:'课程组织与实践创作',render:()=> <CreatorGuideReplay page="5938b6ae-3003-48ce-8e4b-a147819fabcf"/>},
  {id:'9e304051-3ed6-4a9c-9bda-eb4f900c108a',title:outline.pages.find(page => page.id === '9e304051-3ed6-4a9c-9bda-eb4f900c108a')!.title,section:'课程组织与实践创作',render:()=> <CreatorGuideReplay page="01a05b0a-9d59-4694-986b-5d853378f176"/>},
  {id:'7417b501-e77f-4e98-9493-de9f83e475ae',title:outline.pages.find(page => page.id === '7417b501-e77f-4e98-9493-de9f83e475ae')!.title,section:'课程组织与实践创作',render:()=> <CreatorGuideReplay page="0e0ac5cb-6400-4fb7-9f93-96c830f9138e"/>},
  {id:'5ef1f82c-d6eb-47c7-9941-43ad681bb821',title:outline.pages.find(page => page.id === '5ef1f82c-d6eb-47c7-9941-43ad681bb821')!.title,section:'课程组织与实践创作',render:()=> <CreatorGuideReplay page="49aed93c-5a72-4dfc-a205-ad44923bba32"/>},
  {id:'f51293a6-5440-454c-9852-daca8d362b5a',title:outline.pages.find(page => page.id === 'f51293a6-5440-454c-9852-daca8d362b5a')!.title,section:'课程组织与实践创作',render:()=> <CreatorGuideReplay page="98f4b092-7d7e-461c-a320-e5d1f885c9a4"/>},
  {id:'b4abf5a8-577b-4fe3-bb83-2085b7c0a891',title:outline.pages.find(page => page.id === 'b4abf5a8-577b-4fe3-bb83-2085b7c0a891')!.title,section:'课程组织与实践创作',render:()=> <ShukuCommunityEvolutionPage/>},
  {id:'a3863cb3-5b2c-452e-9397-c8aa04e1bc4a',title:outline.pages.find(page => page.id === 'a3863cb3-5b2c-452e-9397-c8aa04e1bc4a')!.title,section:'人才与生态',render:()=> <TeachingTalentDiscoveryPage/>},
  {id:'109d9380-8050-44a8-a3a2-65f19d192980',title:outline.pages.find(page => page.id === '109d9380-8050-44a8-a3a2-65f19d192980')!.title,section:'人才与生态',render:()=> <EducationEcosystemPreviewPage/>},
 ]
} satisfies DeckDefinition;
export const deck = sceneDefinitions;
export function getPptNotes(sceneId:string):SpeakerNote[] {
 const page=outline.pages.find(page=>page.id===sceneId);
 return page?[{text:page.snippet,selectors:[]}]:[];
}
