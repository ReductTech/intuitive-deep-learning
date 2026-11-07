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
    { id: outline.pages.find(page => page.id === '18ad36ae-81cb-40b1-a240-301a3de410ac')!.id, title: outline.pages.find(page => page.id === '18ad36ae-81cb-40b1-a240-301a3de410ac')!.title, section: '环境准备', render: () => <ToolOverviewPage /> },
    { id: outline.pages.find(page => page.id === 'e828c4ec-c28f-4aa8-a4ee-4404531e2519')!.id, title: outline.pages.find(page => page.id === 'e828c4ec-c28f-4aa8-a4ee-4404531e2519')!.title, section: '做课件对自己有什么帮助', render: () => <LearnByExplainingPage /> },
    { id: outline.pages.find(page => page.id === 'e547db3b-9b4b-41a1-bcd7-69b6a3328edf')!.id, title: outline.pages.find(page => page.id === 'e547db3b-9b4b-41a1-bcd7-69b6a3328edf')!.title, section: '做课件对自己有什么帮助', render: () => <EngineeringCollaborationPage /> },
    { id: outline.pages.find(page => page.id === 'a0e58f48-21d3-402c-993e-991a661ca3c6')!.id, title: outline.pages.find(page => page.id === 'a0e58f48-21d3-402c-993e-991a661ca3c6')!.title, section: '做课件对自己有什么帮助', render: () => <CreatorJudgmentPage /> },
    { id: 'ce4ed8dd-ce1b-4b0c-a36a-cc9745f46b90', title: outline.pages.find(page => page.id === 'ce4ed8dd-ce1b-4b0c-a36a-cc9745f46b90')!.title, section: '做课件对自己有什么帮助', render: () => <ContributionRecordPage /> },
    { id: 'a001b726-fc23-4cdb-8c36-925a86656ab2', title: outline.pages.find(page => page.id === 'a001b726-fc23-4cdb-8c36-925a86656ab2')!.title, section: '项目开发入门', render: () => <ProjectFrameworkPage /> },
    { id: '17ce6165-3c41-4d34-80da-f07dbf3debbd', title: outline.pages.find(page => page.id === '17ce6165-3c41-4d34-80da-f07dbf3debbd')!.title, section: '项目开发入门', render: () => <ModuleDirectoryPage /> },
    { id: '6589da25-0890-4bc3-8359-dfccecbe8f9e', title: outline.pages.find(page => page.id === '6589da25-0890-4bc3-8359-dfccecbe8f9e')!.title, section: '项目开发入门', render: () => <SkillWorkflowPage /> },
  ],
};

export function getPptNotes(sceneId: string) {
  const selectors: Record<string, string> = { '18ad36ae-81cb-40b1-a240-301a3de410ac': '.acw-environment', 'e828c4ec-c28f-4aa8-a4ee-4404531e2519': '.acw-learning-page', 'e547db3b-9b4b-41a1-bcd7-69b6a3328edf': '.acw-engineering-page', 'a0e58f48-21d3-402c-993e-991a661ca3c6': '.acw-judgment-page', 'ce4ed8dd-ce1b-4b0c-a36a-cc9745f46b90': '.acw-credit-page' };
  selectors['a001b726-fc23-4cdb-8c36-925a86656ab2'] = '.acw-framework-page';
  selectors['6589da25-0890-4bc3-8359-dfccecbe8f9e'] = '.acw-skill-page';
  return outline.pages.filter(page => page.id === sceneId).map(page => ({ text: page.snippet, selectors: [sceneId === '17ce6165-3c41-4d34-80da-f07dbf3debbd' ? '.acw-directory-page' : selectors[sceneId] ?? '.acw-environment'] }));
}

export function AiCreatorWorkshopPpt() {
  return <SceneDeck catalog={[deck]} moduleId={outline.id} assetId={outline.moduleIdentity.id} progressKey={`${outline.moduleIdentity.id}:ppt`} getNotes={getPptNotes} />;
}
