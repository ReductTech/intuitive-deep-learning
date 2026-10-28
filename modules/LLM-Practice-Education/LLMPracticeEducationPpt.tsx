import { SceneDeck, type DeckDefinition } from '../shared/react/presentation';
import { OpeningPage } from './pages/OpeningPage/OpeningPage';
import { KnowledgeGrowthPage } from './pages/KnowledgeGrowthPage/KnowledgeGrowthPage';
import { LearningGoalPage } from './pages/LearningGoalPage/LearningGoalPage';
import { FoundationFrontierPage } from './pages/FoundationFrontierPage/FoundationFrontierPage';
import { EducationPathsPage } from './pages/EducationPathsPage/EducationPathsPage';
import { ConvolutionObservationPage } from './pages/ConvolutionObservationPage/ConvolutionObservationPage';
import { ConvolutionDefinitionPage } from './pages/ConvolutionDefinitionPage/ConvolutionDefinitionPage';
import { ConvolutionWalkthroughPage } from './pages/ConvolutionWalkthroughPage/ConvolutionWalkthroughPage';
import outline from './outlines.json';

export const deck: DeckDefinition = {
  id: outline.id,
  title: outline.title,
  subtitle: outline.description,
  scenes: [
    {
      id: 'opening',
      title: outline.pages[0].title,
      section: '知识增长与科研信息供给',
      render: () => <OpeningPage />,
    },
    {
      id: 'knowledge-growth',
      title: outline.pages[1].title,
      section: '知识增长与科研信息供给',
      render: () => <KnowledgeGrowthPage />,
    },
    {
      id: 'learning-goals',
      title: outline.pages[2].title,
      section: '知识增长与科研信息供给',
      render: () => <LearningGoalPage />,
    },
    {
      id: 'foundation-frontier',
      title: outline.pages[3].title,
      section: '知识增长与科研信息供给',
      render: () => <FoundationFrontierPage />,
    },
    { id: 'education-paths', title: outline.pages[4].title, section: '打牢基础', render: () => <EducationPathsPage /> },
    { id: 'popular-science', title: outline.pages[5].title, section: '打牢基础', render: () => <ConvolutionObservationPage /> },
    { id: 'professional-education', title: outline.pages[6].title, section: '打牢基础', render: () => <ConvolutionDefinitionPage /> },
    { id: 'intuitive-learning', title: outline.pages[7].title, section: '打牢基础', render: () => <ConvolutionWalkthroughPage /> },
  ],
};

export function getPptNotes(sceneId: string) {
  const migrated = {
    'education-paths': [4, '.llmpe-cg-education-page'],
    'popular-science': [5, '.llmpe-conv-page'],
    'professional-education': [6, '.llmpe-def-page'],
    'intuitive-learning': [7, '.llmpe-walk-page'],
  } as const;
  if (sceneId in migrated) {
    const [index, selector] = migrated[sceneId as keyof typeof migrated];
    return [{ text: outline.pages[index].snippet, selectors: [selector] }];
  }
  if (sceneId === 'foundation-frontier') return [{ text: outline.pages[3].snippet, selectors: ['.llmpe-ff-page'] }];
  if (sceneId === 'learning-goals') return [{ text: outline.pages[2].snippet, selectors: ['.llmpe-goal-page'] }];
  if (sceneId === 'knowledge-growth') return [{
    text: outline.pages[1].snippet + '\n\n本页的时代、知识范围与个人积累是教学关系示意，不代表历史知识量测量、人物能力排名或未来预测。',
    selectors: ['.llmpe-kg-knowledge-page'],
  }];
  return sceneId === 'opening'
    ? [{ text: outline.pages[0].snippet, selectors: ['.llmpe-opening'] }]
    : [];
}

export function LLMPracticeEducationPpt() {
  return (
    <SceneDeck
      catalog={[deck]}
      moduleId={outline.id}
      assetId={outline.moduleIdentity.id}
      progressKey={`${outline.moduleIdentity.id}:ppt`}
      getNotes={getPptNotes}
    />
  );
}
