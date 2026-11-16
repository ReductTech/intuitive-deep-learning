import { useRef, type ReactNode } from 'react';
import { useSceneScale } from "@shuku/course-style/react/presentation/canvas";
import "@shuku/course-style/react/styles.css";
import "@shuku/course-style/react/presentation.css";
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
  return <section shuku-edit-id="e-fa236eff-18e2-4524-9a0b-1067594cb6b2" id={id} ref={frame} className="acw-learning-guide-frame"><div shuku-edit-id="e-2999b5e0-2251-49f7-bef4-710f3e1ac8f3" className="acw-learning-guide-canvas" style={{ transform: `scale(${scale})` }}>{children}</div></section>;
}

export function AiCreatorWorkshopGuide() {
  return <main shuku-edit-id="e-3634bb7a-0ea9-4ea7-b447-3c56e6a55547" className="acw-learning-guide"><GuideFrame id="model-harness-workspace"><ToolOverviewPage /></GuideFrame><GuideFrame id="learn-by-explaining"><LearnByExplainingPage /></GuideFrame><GuideFrame id="learn-through-engineering-challenges"><EngineeringCollaborationPage /></GuideFrame><GuideFrame id="develop-creator-judgment"><CreatorJudgmentPage /></GuideFrame><GuideFrame id="publish-and-credit-contributors"><ContributionRecordPage /></GuideFrame><GuideFrame id="define-the-experiment"><ProjectFrameworkPage /></GuideFrame><GuideFrame id="run-the-first-interface"><ModuleDirectoryPage /></GuideFrame><GuideFrame id="iterate-with-a-screenshot"><SkillWorkflowPage /></GuideFrame></main>;
}

