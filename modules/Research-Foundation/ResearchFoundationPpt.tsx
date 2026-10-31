import { SceneDeck, type DeckDefinition, type SpeakerNote } from '../shared/react/presentation';
import '../shared/react/styles.css';
import '../shared/react/presentation.css';
import './ResearchFoundation.css';
import outline from './outlines.json';
import { FoundationOneTitlePage } from './pages/FoundationOneTitlePage/FoundationOneTitlePage';
import { PdfVisualExtractionPage } from './pages/PdfVisualExtractionPage/PdfVisualExtractionPage';
import { AirflowControlPage } from './pages/AirflowControlPage/AirflowControlPage';
import { ResearchMethodsPage } from './pages/ResearchMethodsPage/ResearchMethodsPage';
import { InteractivePrototypePage } from './pages/InteractivePrototypePage/InteractivePrototypePage';
import { PlatformFoundationPage } from './pages/PlatformFoundationPage/PlatformFoundationPage';
import { EducationCasePage } from './pages/EducationCasePage/EducationCasePage';

const pages=[
 {id:'foundation-one-title',Component:FoundationOneTitlePage},
 {id:'pdf-structuring',Component:PdfVisualExtractionPage},
 {id:'literature-service',Component:AirflowControlPage},
 {id:'research-methods',Component:ResearchMethodsPage},
 {id:'interactive-prototype',Component:InteractivePrototypePage},
 {id:'platform-foundation',Component:PlatformFoundationPage},
 {id:'education-case',Component:EducationCasePage},
];
export const deck:DeckDefinition={id:outline.id,title:outline.title,subtitle:'研究基础 · 讲者手动演示',scenes:pages.map(({id,Component},i)=>({id,title:outline.pages[i].title,section:'研究基础',render:()=><Component/>}))};
export function getPptNotes(id:string):SpeakerNote[]{const i=pages.findIndex(page=>page.id===id);return i<0?[]:[{text:outline.pages[i].snippet,selectors:['.rf-page']}];}
export function ResearchFoundationPpt(){return <SceneDeck catalog={[deck]} moduleId={outline.id} assetId={outline.moduleIdentity.id} progressKey={`${outline.id}:ppt:v1`} getNotes={getPptNotes}/>;}
