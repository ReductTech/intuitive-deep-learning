import { SceneDeck } from '../shared/react/presentation';
import { deck, getPptNotes } from './course';
import outline from './outlines.json';
export { deck, getPptNotes } from './course';
export function NaipPpt(){return <SceneDeck catalog={[deck]} moduleId={outline.id} assetId={outline.moduleIdentity.id} progressKey="naip:chinese-course:progress:v1" getNotes={getPptNotes}/>;}
