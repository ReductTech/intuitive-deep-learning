import { SceneDeck, type DeckDefinition } from '../shared/react/presentation';
import { courseScenes } from './course';
import outline from './outlines.json';
import './components/ReferenceCanvas.css';

export const deck: DeckDefinition = { id: outline.id, title: outline.title, subtitle: outline.description, scenes: courseScenes };
export function getPptNotes(sceneId: string) {
  return outline.pages.filter(page => page.id === sceneId).map(page => ({ text: page.snippet, selectors: ['.vga-content'] }));
}
export function ArchitecturePpt() {
  return <SceneDeck catalog={[deck]} moduleId={outline.id} assetId={outline.moduleIdentity.id} progressKey={`${outline.moduleIdentity.id}:ppt`} getNotes={getPptNotes} />;
}
