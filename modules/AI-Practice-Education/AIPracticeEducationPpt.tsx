import { SceneDeck } from '../shared/react/presentation';
import outline from './outlines.json';
import { deck, getPptNotes } from './course';
export { deck, getPptNotes } from './course';
export function AIPracticeEducationPpt() {
 return <SceneDeck catalog={[deck]} moduleId={outline.id} assetId={outline.moduleIdentity.id} progressKey={`${outline.moduleIdentity.id}:ppt`} getNotes={getPptNotes} />;
}
