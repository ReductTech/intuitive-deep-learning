import { SceneDeck, type DeckDefinition } from '../shared/react/presentation';
import { EverydayChoice } from './pages/everyday-choice-cover/EverydayChoice';
import outline from './outlines.json';

export const deck: DeckDefinition = {
  id: outline.id, title: outline.title, subtitle: outline.description,
  scenes: [{ id: outline.pages[0].id, title: outline.pages[0].title, section: '生活中的二叉树', render: () => <EverydayChoice /> }],
};
export function getPptNotes(sceneId: string) {
  return outline.pages.filter(page => page.id === sceneId).map(page => ({ text: page.snippet, selectors: ['.bt-cover'] }));
}
export function BinaryTreePpt() {
  return <SceneDeck catalog={[deck]} moduleId={outline.id} assetId={outline.moduleIdentity.id} progressKey={`${outline.moduleIdentity.id}:ppt`} getNotes={getPptNotes} />;
}
