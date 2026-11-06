import { SceneDeck, type DeckDefinition } from '../shared/react/presentation';
import { ToolOverviewPage } from './pages/ToolOverviewPage/ToolOverviewPage';
import { LearnByExplainingPage } from './pages/LearnByExplainingPage/LearnByExplainingPage';
import { EngineeringCollaborationPage } from './pages/EngineeringCollaborationPage/EngineeringCollaborationPage';
import { CreatorJudgmentPage } from './pages/CreatorJudgmentPage/CreatorJudgmentPage';
import { ContributionRecordPage } from './pages/ContributionRecordPage/ContributionRecordPage';
import { ModuleDirectoryPage } from './pages/ModuleDirectoryPage/ModuleDirectoryPage';
import { ProjectFrameworkPage } from './pages/ProjectFrameworkPage/ProjectFrameworkPage';
import { SkillWorkflowPage } from './pages/SkillWorkflowPage/SkillWorkflowPage';
import outline from './outlines.json';

export const deck: DeckDefinition = {
  id: outline.id,
  title: outline.title,
  subtitle: outline.description,
  scenes: [
    { id: outline.pages[0].id, title: outline.pages[0].title, section: '环境准备', render: () => <ToolOverviewPage /> },
    { id: outline.pages[1].id, title: outline.pages[1].title, section: '做课件对自己有什么帮助', render: () => <LearnByExplainingPage /> },
    { id: outline.pages[2].id, title: outline.pages[2].title, section: '做课件对自己有什么帮助', render: () => <EngineeringCollaborationPage /> },
    { id: outline.pages[3].id, title: outline.pages[3].title, section: '做课件对自己有什么帮助', render: () => <CreatorJudgmentPage /> },
    { id: 'publish-and-credit-contributors', title: outline.pages.find(page => page.id === 'publish-and-credit-contributors')!.title, section: '做课件对自己有什么帮助', render: () => <ContributionRecordPage /> },
    { id: 'define-the-experiment', title: outline.pages.find(page => page.id === 'define-the-experiment')!.title, section: '项目开发入门', render: () => <ProjectFrameworkPage /> },
    { id: 'run-the-first-interface', title: outline.pages.find(page => page.id === 'run-the-first-interface')!.title, section: '项目开发入门', render: () => <ModuleDirectoryPage /> },
    { id: 'iterate-with-a-screenshot', title: outline.pages.find(page => page.id === 'iterate-with-a-screenshot')!.title, section: '项目开发入门', render: () => <SkillWorkflowPage /> },
  ],
};

export function getPptNotes(sceneId: string) {
  const selectors: Record<string, string> = { 'model-harness-workspace': '.acw-environment', 'learn-by-explaining': '.acw-learning-page', 'learn-through-engineering-challenges': '.acw-engineering-page', 'develop-creator-judgment': '.acw-judgment-page', 'publish-and-credit-contributors': '.acw-credit-page' };
  selectors['define-the-experiment'] = '.acw-framework-page';
  selectors['iterate-with-a-screenshot'] = '.acw-skill-page';
  return outline.pages.filter(page => page.id === sceneId).map(page => ({ text: page.snippet, selectors: [sceneId === 'run-the-first-interface' ? '.acw-directory-page' : selectors[sceneId] ?? '.acw-environment'] }));
}

export function AiCreatorWorkshopPpt() {
  return <SceneDeck catalog={[deck]} moduleId={outline.id} assetId={outline.moduleIdentity.id} progressKey={`${outline.moduleIdentity.id}:ppt`} getNotes={getPptNotes} />;
}
