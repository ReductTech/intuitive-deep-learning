import { SceneDeck, type DeckDefinition } from "@shuku/course-style/react/presentation";
import { CreatorSkillIntro } from './pages/CreatorSkillIntro/CreatorSkillIntro';
import outline from './outlines.json';

export const deck: DeckDefinition = {
  id: outline.id,
  title: outline.title,
  subtitle: outline.description,
  scenes: [{ id: outline.pages.find(page => page.id === 'f44e1a4d-1b51-4732-89ac-338e08d2ef97')!.id, title: outline.pages.find(page => page.id === 'f44e1a4d-1b51-4732-89ac-338e08d2ef97')!.title, section: '基础示例', render: () => <CreatorSkillIntro /> }],
};

export function getPptNotes(sceneId: string) {
  return outline.pages.filter(page => page.id === sceneId).map(page => ({ text: page.snippet, selectors: ['.be-intro'] }));
}

export function BasicExamplePpt() {
  return <SceneDeck catalog={[deck]} moduleId={outline.id} assetId={outline.moduleIdentity.id} progressKey={`${outline.moduleIdentity.id}:ppt`} getNotes={getPptNotes} />;
}
