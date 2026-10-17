import { SceneDeck, type DeckDefinition, type SpeakerNote } from '../shared/react/presentation';
import { course } from './course';
import outline from './outlines.json';
export const deck: DeckDefinition = { id:'policy-gradient',title:outline.title,subtitle:`从走迷宫到策略学习 · ${course.length} 页`,scenes:course.map(({id,title,section,component:Component})=>({id,title,section,render:()=> <Component/>})) };
export function getPptNotes(id: string): SpeakerNote[] { const page=outline.pages.find(p=>p.id===id);return page?[{text:page.snippet,selectors:['.pg-main']}]:[]; }
export function PolicyGradientPpt() { return <SceneDeck catalog={[deck]} moduleId="policy-gradient" assetId="policy-gradient" progressKey="policy-gradient-reinforce-v4" getNotes={getPptNotes}/>; }
