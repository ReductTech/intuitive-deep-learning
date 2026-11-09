import { SceneDeck, type DeckDefinition } from "@shuku/course-style/react/presentation";
import { EverydayChoice } from './pages/everyday-choice-cover/EverydayChoice';
import outline from './outlines.json';

export const deck: DeckDefinition = {
  id: outline.id, title: outline.title, subtitle: outline.description,
  scenes: [{ id: outline.pages.find(page => page.id === '1e01d924-d7b9-42cc-9d40-6934cbd6e905')!.id, title: outline.pages.find(page => page.id === '1e01d924-d7b9-42cc-9d40-6934cbd6e905')!.title, section: '生活中的二叉树', render: () => <EverydayChoice /> }],
};
export function getPptNotes(sceneId: string) {
  return outline.pages.filter(page => page.id === sceneId).map(page => ({ text: page.snippet, selectors: ['.bt-cover'] }));
}
export function BinaryTreePpt() {
  return <SceneDeck catalog={[deck]} moduleId={outline.id} assetId={outline.moduleIdentity.id} progressKey={`${outline.moduleIdentity.id}:ppt`} getNotes={getPptNotes} />;
}
