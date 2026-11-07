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
 '5938b6ae-3003-48ce-8e4b-a147819fabcf':FrontendJourneyPage,
 '01a05b0a-9d59-4694-986b-5d853378f176':SkillOverviewPage,
 '0e0ac5cb-6400-4fb7-9f93-96c830f9138e':SkillConstraintsPage,
 '49aed93c-5a72-4dfc-a205-ad44923bba32':UIKitPage,
 '2529070b-9d4e-4124-be29-107310405f89':MultiFormatPage,
 '5930c2e2-d82a-4993-bcf7-275299306f78':HumanCollaborationPage,
 '1502a3c2-01a6-4c20-b2ce-f68e722c5314':PresentationComparisonPage,
 '98f4b092-7d7e-461c-a320-e5d1f885c9a4':CreationWorkflowPage,
 'f63d0e01-e1ee-4a4e-8bd0-242fd64f8ab9':OptionalInteractionPage,
 'b4fe6d42-b120-4eaf-907d-1335568d836b':ProgressiveDisclosurePage,
 '50b60fc5-6773-4a2d-a62f-caf58162de05':DiscoveryLearningPage,
};
export function CreatorGuideReplay({page}:{page:keyof typeof pages}){
 const Page=pages[page];
 return <div className="aipe-creator-guide-replay aipe-replay-cg-creator-typography"><Page/></div>;
}
