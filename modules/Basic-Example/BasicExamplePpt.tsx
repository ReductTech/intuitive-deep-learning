import { SceneDeck, type DeckDefinition } from '../shared/react/presentation';
import { CreatorSkillIntro } from './pages/CreatorSkillIntro';
import outline from './outlines.json';

export const deck: DeckDefinition = {
  id: outline.id,
  title: outline.title,
  subtitle: outline.description,
  scenes: [{ id: outline.pages[0].id, title: outline.pages[0].title, section: '基础示例', render: () => <CreatorSkillIntro /> }],
};

export function getPptNotes(sceneId: string) {
  return outline.pages.filter(page => page.id === sceneId).map(page => ({ text: page.snippet, selectors: ['.be-intro'] }));
}

export function BasicExamplePpt() {
  return <SceneDeck catalog={[deck]} moduleId={outline.id} assetId={outline.moduleIdentity.id} progressKey={`${outline.moduleIdentity.id}:ppt`} getNotes={getPptNotes} />;
}
