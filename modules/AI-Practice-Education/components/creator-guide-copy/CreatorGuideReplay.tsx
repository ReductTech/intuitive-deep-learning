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
 'frontend-journey':FrontendJourneyPage,
 'skill-overview':SkillOverviewPage,
 'skill-constraints':SkillConstraintsPage,
 'ui-kit':UIKitPage,
 'multi-format':MultiFormatPage,
 'human-collaboration':HumanCollaborationPage,
 'presentation-comparison':PresentationComparisonPage,
 'creation-workflow':CreationWorkflowPage,
 'optional-interaction':OptionalInteractionPage,
 'progressive-disclosure':ProgressiveDisclosurePage,
 'discovery-learning':DiscoveryLearningPage,
};
export function CreatorGuideReplay({page}:{page:keyof typeof pages}){
 const Page=pages[page];
 return <div className="aipe-creator-guide-replay aipe-replay-cg-creator-typography"><Page/></div>;
}
