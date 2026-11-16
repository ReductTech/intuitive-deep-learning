import { FrontendJourneyPage } from './pages/FrontendJourneyPage';
import { SkillOverviewPage } from './pages/SkillOverviewPage';
import { SkillConstraintsPage } from './pages/SkillConstraintsPage';
import { UIKitPage } from './pages/UIKitPage';
import { MultiFormatPage } from './pages/MultiFormatPage';
import { HumanCollaborationPage } from './pages/HumanCollaborationPage';
import { PresentationComparisonPage } from './pages/PresentationComparisonPage';
import { CreationWorkflowPage } from './pages/CreationWorkflowPage';
import { OptionalInteractionPage } from './pages/OptionalInteractionPage';
import { ProgressiveDisclosurePage } from './pages/ProgressiveDisclosurePage';
import { DiscoveryLearningPage } from './pages/DiscoveryLearningPage';
import './CreatorTypography.css';
import './CreatorGuideReplay.css';

const pages={
 'b3d55367-3696-490f-86af-12b6283844e8':FrontendJourneyPage,
 '50944a07-a6e1-4069-a11c-df775597c87b':SkillOverviewPage,
 '04405b26-e4ce-4be6-ab64-485984da36e6':SkillConstraintsPage,
 '547f38b2-a668-4440-b161-463f85dabd41':UIKitPage,
 '45aafc10-be52-48fe-96d1-56b69ff6ce9a':MultiFormatPage,
 'e86c0e43-f113-4336-aa5b-ab5239eb6acd':HumanCollaborationPage,
 '47b4d6e4-5d50-4bd7-9ff3-2581ddea5350':PresentationComparisonPage,
 'b2ea0179-d0ff-4c8d-b9bc-3735b55ca5cd':CreationWorkflowPage,
 'a4dd9f43-f53d-4de5-892c-4b7b9b51859d':OptionalInteractionPage,
 'e97cdd2c-b314-4804-aaaa-aadf2c06fa68':ProgressiveDisclosurePage,
 'becbdeab-c773-44dd-855e-8595b6796147':DiscoveryLearningPage,
};
export function CreatorGuideReplay({page}:{page:keyof typeof pages}){
 const Page=pages[page];
 return <div shuku-edit-id="e-76f96396-349b-47b3-907d-1f11c0b6c570" className="aipe-creator-guide-replay aipe-replay-cg-creator-typography"><Page/></div>;
}
