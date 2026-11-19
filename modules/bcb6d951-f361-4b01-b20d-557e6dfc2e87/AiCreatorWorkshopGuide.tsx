import { deck } from './AiCreatorWorkshopPpt';
import outline from './outlines.json';
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
  return <main shuku-edit-id="e-3634bb7a-0ea9-4ea7-b447-3c56e6a55547" className="acw-learning-guide">{outline.pages.map(page => {
    const scene = deck.scenes.find(scene => scene.id === page.id);
    if (!scene) throw new Error('Missing creator workshop page: ' + page.id);
    return <GuideFrame key={page.id} id={page.id}>{scene.render({ complete: () => {}, reset: () => {}, isComplete: false })}</GuideFrame>;
  })}</main>;
}

