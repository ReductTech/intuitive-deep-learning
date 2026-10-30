import { SceneDeck, type DeckDefinition } from '../shared/react/presentation';
import outline from './outlines.json';
import { OpeningPage } from './pages/OpeningPage/OpeningPage';

// Only implemented pages enter the player; the remaining outline is retained for authoring.
const opening = outline.pages[0];
export const deck: DeckDefinition = {
  id: outline.id,
  title: outline.title,
  subtitle: `首页预览 · 新版大纲 ${outline.pages.length + outline.plannedPages.length} 页，页面待调整`,
  scenes: [{ id: 'opening', title: opening.title, section: '人工智能带来的求学问题', render: () => <OpeningPage /> }],
};
export const getPptNotes = (sceneId: string) => [{
  text: sceneId === 'opening' ? opening.snippet : '',
  selectors: ['.ale-opening'],
}];
export function LearningExplorationPpt() {
  return <SceneDeck catalog={[deck]} moduleId={outline.id} assetId={outline.moduleIdentity.id}
    progressKey={`lesson-flow:${outline.id}`} getNotes={getPptNotes} />;
}
