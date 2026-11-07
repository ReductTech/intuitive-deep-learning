import { useRef, type ReactNode } from 'react';
import { useSceneScale } from '../shared/react/presentation/canvas';
import '../shared/react/styles.css';
import '../shared/react/presentation.css';
import { ToolOverviewPage } from './pages/ToolOverviewPage/ToolOverviewPage';
import { LearnByExplainingPage } from './pages/LearnByExplainingPage/LearnByExplainingPage';
import { EngineeringCollaborationPage } from './pages/EngineeringCollaborationPage/EngineeringCollaborationPage';
import { CreatorJudgmentPage } from './pages/CreatorJudgmentPage/CreatorJudgmentPage';
import { ContributionRecordPage } from './pages/ContributionRecordPage/ContributionRecordPage';
import { ModuleDirectoryPage } from './pages/ModuleDirectoryPage/ModuleDirectoryPage';
import { ProjectFrameworkPage } from './pages/ProjectFrameworkPage/ProjectFrameworkPage';
import { SkillWorkflowPage } from './pages/SkillWorkflowPage/SkillWorkflowPage';

function GuideFrame({ id, children }: { id: string; children: ReactNode }) {
  const frame = useRef<HTMLDivElement>(null);
  const scale = useSceneScale(frame);
  return <section id={id} ref={frame} className="acw-learning-guide-frame"><div className="acw-learning-guide-canvas" style={{ transform: `scale(${scale})` }}>{children}</div></section>;
}

export function AiCreatorWorkshopGuide() {
  return <main className="acw-learning-guide"><GuideFrame id="model-harness-workspace"><ToolOverviewPage /></GuideFrame><GuideFrame id="learn-by-explaining"><LearnByExplainingPage /></GuideFrame><GuideFrame id="learn-through-engineering-challenges"><EngineeringCollaborationPage /></GuideFrame><GuideFrame id="develop-creator-judgment"><CreatorJudgmentPage /></GuideFrame><GuideFrame id="publish-and-credit-contributors"><ContributionRecordPage /></GuideFrame><GuideFrame id="define-the-experiment"><ProjectFrameworkPage /></GuideFrame><GuideFrame id="run-the-first-interface"><ModuleDirectoryPage /></GuideFrame><GuideFrame id="iterate-with-a-screenshot"><SkillWorkflowPage /></GuideFrame></main>;
}

