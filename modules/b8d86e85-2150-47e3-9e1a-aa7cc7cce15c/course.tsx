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
  {id:'e7f31889-ab3c-4124-9d5b-eb56df8d2e8f',title:outline.pages.find(page => page.id === 'e7f31889-ab3c-4124-9d5b-eb56df8d2e8f')!.title,section:'学习目标',render:()=> <OpeningPage/>},
  {id:'66cefa17-c522-4228-a8ae-50c9785721d4',title:outline.pages.find(page => page.id === '66cefa17-c522-4228-a8ae-50c9785721d4')!.title,section:'学习目标',render:()=> <LearningGoalPage/>},
  {id:'d4992bfd-162d-4646-9d80-66ecbff8b190',title:outline.pages.find(page => page.id === 'd4992bfd-162d-4646-9d80-66ecbff8b190')!.title,section:'学习目标',render:()=> <StudentCapabilitiesPage/>},
  {id:'76acaf20-39a6-420c-9283-e7340cd139c7',title:outline.pages.find(page => page.id === '76acaf20-39a6-420c-9283-e7340cd139c7')!.title,section:'平台概览',render:()=> <PlatformPositioningPage/>},
  {id:'09effd37-4057-4b45-9441-2490a231bd96',title:outline.pages.find(page => page.id === '09effd37-4057-4b45-9441-2490a231bd96')!.title,section:'科研信息获取',render:()=> <ResearchInformationPage/>},
  {id:'1c673e39-9fd4-4402-858e-67185f3125dd',title:outline.pages.find(page => page.id === '1c673e39-9fd4-4402-858e-67185f3125dd')!.title,section:'科研信息获取',render:()=> <PersonalizedResearchSupplyPage/>},
  {id:'c51115d8-0d27-4fc1-a962-cf7f41dd783e',title:outline.pages.find(page => page.id === 'c51115d8-0d27-4fc1-a962-cf7f41dd783e')!.title,section:'科研信息获取',render:()=> <PaperQualityPage/>},
  {id:'3b2b1ca6-6e33-4ef8-965a-0c6077b374e4',title:outline.pages.find(page => page.id === '3b2b1ca6-6e33-4ef8-965a-0c6077b374e4')!.title,section:'科研信息获取',render:()=> <ResearchServicePage/>},
  {id:'37b3ae2a-6923-4e2b-9d67-a05488969bff',title:outline.pages.find(page => page.id === '37b3ae2a-6923-4e2b-9d67-a05488969bff')!.title,section:'科研信息获取',render:()=> <ResearchRecommendationAppPage/>},
  {id:'43fb0e5e-348b-4f16-9f3a-b65843674b9b',title:outline.pages.find(page => page.id === '43fb0e5e-348b-4f16-9f3a-b65843674b9b')!.title,section:'交互式知识呈现与学习体验',render:()=> <CrossDomainFoundationPage/>},
  {id:'74f59148-64d5-4754-9993-77aa06a25e3c',title:outline.pages.find(page => page.id === '74f59148-64d5-4754-9993-77aa06a25e3c')!.title,section:'交互式知识呈现与学习体验',render:()=> <EducationPathsPage/>},
  {id:'af2c0a55-e6a7-41f8-a8d4-e5cda1b314cf',title:outline.pages.find(page => page.id === 'af2c0a55-e6a7-41f8-a8d4-e5cda1b314cf')!.title,section:'交互式知识呈现与学习体验',render:()=> <ConvolutionObservationPage/>},
  {id:'bab294fb-0874-4f74-ac74-898a56412a8a',title:outline.pages.find(page => page.id === 'bab294fb-0874-4f74-ac74-898a56412a8a')!.title,section:'交互式知识呈现与学习体验',render:()=> <ConvolutionDefinitionPage/>},
  {id:'a33e7663-d8d9-4139-bfc8-1c85ebaca9fe',title:outline.pages.find(page => page.id === 'a33e7663-d8d9-4139-bfc8-1c85ebaca9fe')!.title,section:'交互式知识呈现与学习体验',render:()=> <ConvolutionWalkthroughPage/>},
  {id:'ece0082a-3f11-41f9-823e-ffa37d703eca',title:outline.pages.find(page => page.id === 'ece0082a-3f11-41f9-823e-ffa37d703eca')!.title,section:'交互式知识呈现与学习体验',render:()=> <ShowcaseGomokuPage page="play"/>},
  {id:'81bd2b62-7f22-40a7-9c9e-10760e87f10d',title:outline.pages.find(page => page.id === '81bd2b62-7f22-40a7-9c9e-10760e87f10d')!.title,section:'交互式知识呈现与学习体验',render:()=> <ShowcaseGomokuPage page="scan"/>},
  {id:'1f7821d2-910c-45d2-9c8f-19be73b6a397',title:outline.pages.find(page => page.id === '1f7821d2-910c-45d2-9c8f-19be73b6a397')!.title,section:'交互式知识呈现与学习体验',render:()=> <CreatorGuideReplay page="45aafc10-be52-48fe-96d1-56b69ff6ce9a"/>},
  {id:'18fbd353-03f0-4ca2-93bd-d7060214d890',title:outline.pages.find(page => page.id === '18fbd353-03f0-4ca2-93bd-d7060214d890')!.title,section:'交互式知识呈现与学习体验',render:()=> <CreatorGuideReplay page="a4dd9f43-f53d-4de5-892c-4b7b9b51859d"/>},
  {id:'9bb146e3-27b6-4aa9-8222-d4b95047d3d9',title:outline.pages.find(page => page.id === '9bb146e3-27b6-4aa9-8222-d4b95047d3d9')!.title,section:'交互式知识呈现与学习体验',render:()=> <CreatorGuideReplay page="e97cdd2c-b314-4804-aaaa-aadf2c06fa68"/>},
  {id:'eb184234-e05a-4c3b-945e-8e898f5adf4d',title:outline.pages.find(page => page.id === 'eb184234-e05a-4c3b-945e-8e898f5adf4d')!.title,section:'交互式知识呈现与学习体验',render:()=> <CreatorGuideReplay page="becbdeab-c773-44dd-855e-8595b6796147"/>},
  {id:'8f773d2d-b7cb-4662-913d-4d1cbb06a481',title:outline.pages.find(page => page.id === '8f773d2d-b7cb-4662-913d-4d1cbb06a481')!.title,section:'交互式知识呈现与学习体验',render:()=> <CodePracticePage/>},
  {id:'3ef43424-082a-4982-a8f2-0e2bec5b6fe4',title:outline.pages.find(page => page.id === '3ef43424-082a-4982-a8f2-0e2bec5b6fe4')!.title,section:'交互式知识呈现与学习体验',render:()=> <Res2NetThinkingPage/>},
  {id:'d709a294-b2b5-40b5-ab63-2d7b7148484c',title:outline.pages.find(page => page.id === 'd709a294-b2b5-40b5-ab63-2d7b7148484c')!.title,section:'课程组织与实践创作',render:()=> <FlexibleTeachingModesPage/>},
  {id:'54d05bf2-9263-47c5-9cd8-34cf8cae85e1',title:outline.pages.find(page => page.id === '54d05bf2-9263-47c5-9cd8-34cf8cae85e1')!.title,section:'课程组织与实践创作',render:()=> <RecommendedAssessmentPage/>},
  {id:'ca1a3e4d-06a4-4ee7-9a2a-4359e79a8aaf',title:outline.pages.find(page => page.id === 'ca1a3e4d-06a4-4ee7-9a2a-4359e79a8aaf')!.title,section:'课程组织与实践创作',render:()=> <CreatorGuideReplay page="47b4d6e4-5d50-4bd7-9ff3-2581ddea5350"/>},
  {id:'2ffd7dec-ead1-4cb0-a1c4-76fd158861eb',title:outline.pages.find(page => page.id === '2ffd7dec-ead1-4cb0-a1c4-76fd158861eb')!.title,section:'课程组织与实践创作',render:()=> <CreatorGuideReplay page="b3d55367-3696-490f-86af-12b6283844e8"/>},
  {id:'3c6b5760-fb60-4ef7-9a8b-568b3dde3d14',title:outline.pages.find(page => page.id === '3c6b5760-fb60-4ef7-9a8b-568b3dde3d14')!.title,section:'课程组织与实践创作',render:()=> <CreatorGuideReplay page="50944a07-a6e1-4069-a11c-df775597c87b"/>},
  {id:'2b9d4ae6-c2c5-4563-b5b3-dc567e8c3d2b',title:outline.pages.find(page => page.id === '2b9d4ae6-c2c5-4563-b5b3-dc567e8c3d2b')!.title,section:'课程组织与实践创作',render:()=> <CreatorGuideReplay page="04405b26-e4ce-4be6-ab64-485984da36e6"/>},
  {id:'c1aa826f-05f5-4cf3-a137-3805f902b683',title:outline.pages.find(page => page.id === 'c1aa826f-05f5-4cf3-a137-3805f902b683')!.title,section:'课程组织与实践创作',render:()=> <CreatorGuideReplay page="547f38b2-a668-4440-b161-463f85dabd41"/>},
  {id:'d1046113-3c53-4789-ae80-b2e4d6ae5ede',title:outline.pages.find(page => page.id === 'd1046113-3c53-4789-ae80-b2e4d6ae5ede')!.title,section:'课程组织与实践创作',render:()=> <CreatorGuideReplay page="b2ea0179-d0ff-4c8d-b9bc-3735b55ca5cd"/>},
  {id:'2e605fc8-06d2-40d0-a3e1-92e61bf6b1d1',title:outline.pages.find(page => page.id === '2e605fc8-06d2-40d0-a3e1-92e61bf6b1d1')!.title,section:'课程组织与实践创作',render:()=> <ShukuCommunityEvolutionPage/>},
  {id:'6999d97a-3ec8-4c01-9d0a-bfc9a342e27b',title:outline.pages.find(page => page.id === '6999d97a-3ec8-4c01-9d0a-bfc9a342e27b')!.title,section:'学习评价',render:()=> <DualLearningEvaluationPage/>},
  {id:'8cf558d0-cdc3-4c30-92a4-909c2d556b40',title:outline.pages.find(page => page.id === '8cf558d0-cdc3-4c30-92a4-909c2d556b40')!.title,section:'人才与生态',render:()=> <TeachingTalentDiscoveryPage/>},
  {id:'e6dbf69a-bcd1-41a4-a543-a591c4647e17',title:outline.pages.find(page => page.id === 'e6dbf69a-bcd1-41a4-a543-a591c4647e17')!.title,section:'人才与生态',render:()=> <EducationEcosystemPreviewPage/>},
 ]
} satisfies DeckDefinition;
export const deck = sceneDefinitions;
export function getPptNotes(sceneId:string):SpeakerNote[] {
 const index=deck.scenes.findIndex(scene=>scene.id===sceneId);
 return index<0?[]:[{text:outline.pages[index].snippet,selectors:[]}];
}
