import { SceneDeck, type DeckDefinition, type SpeakerNote } from '../shared/react/presentation';
import '../shared/react/styles.css';
import '../shared/react/presentation.css';
import './ResearchFoundation.css';
import outline from './outlines.json';
import { FoundationOneTitlePage } from './pages/FoundationOneTitlePage/FoundationOneTitlePage';
import { FoundationTwoTitlePage } from './pages/FoundationTwoTitlePage/FoundationTwoTitlePage';
import { FoundationThreeTitlePage } from './pages/FoundationThreeTitlePage/FoundationThreeTitlePage';
import { FoundationFourTitlePage } from './pages/FoundationFourTitlePage/FoundationFourTitlePage';
import { FoundationFiveTitlePage } from './pages/FoundationFiveTitlePage/FoundationFiveTitlePage';
import { PdfVisualExtractionPage } from './pages/PdfVisualExtractionPage/PdfVisualExtractionPage';
import { MainFigureSelectionPage } from './pages/MainFigureSelectionPage/MainFigureSelectionPage';
import { AirflowControlPage } from './pages/AirflowControlPage/AirflowControlPage';
import { PaperQualityPage } from './pages/PaperQualityPage/PaperQualityPage';
import { ResearchServicePage } from './pages/ResearchServicePage/ResearchServicePage';
import { ResearchMethodsPage } from './pages/ResearchMethodsPage/ResearchMethodsPage';
import { CaoChongShowcasePage } from './pages/CaoChongShowcasePage/CaoChongShowcasePage';
import { RegressionFitShowcasePage } from './pages/RegressionFitShowcasePage/RegressionFitShowcasePage';
import { CodeExecutionShowcasePage } from './pages/CodeExecutionShowcasePage/CodeExecutionShowcasePage';
import { ShukuWebsiteShowcasePage } from './pages/ShukuWebsiteShowcasePage/ShukuWebsiteShowcasePage';
import { PlatformFoundationPage } from './pages/PlatformFoundationPage/PlatformFoundationPage';
import { UserFoundationPage } from './pages/UserFoundationPage/UserFoundationPage';
import { SproutLearningPage } from './pages/SproutLearningPage/SproutLearningPage';
import { EducationCasePage } from './pages/EducationCasePage/EducationCasePage';

const pages=[
 {id:'foundation-one-title',Component:FoundationOneTitlePage},
 {id:'pdf-structuring',Component:PdfVisualExtractionPage},
 {id:'main-figure-selection',Component:MainFigureSelectionPage},
 {id:'literature-service',Component:AirflowControlPage},
 {id:'foundation-two-title',Component:FoundationTwoTitlePage},
 {id:'paper-quality',Component:PaperQualityPage},
 {id:'research-service',Component:ResearchServicePage},
 {id:'research-methods',Component:ResearchMethodsPage},
 {id:'foundation-three-title',Component:FoundationThreeTitlePage},
 {id:'showcase-caochong',Component:CaoChongShowcasePage},
 {id:'showcase-regression-fit',Component:RegressionFitShowcasePage},
 {id:'showcase-code-execution',Component:CodeExecutionShowcasePage},
 {id:'showcase-shuku',Component:ShukuWebsiteShowcasePage},
 {id:'foundation-four-title',Component:FoundationFourTitlePage},
 {id:'platform-foundation',Component:PlatformFoundationPage},
 {id:'user-foundation',Component:UserFoundationPage},
 {id:'foundation-five-title',Component:FoundationFiveTitlePage},
 {id:'sprout-learning',Component:SproutLearningPage},
 {id:'education-case',Component:EducationCasePage},
];
export const deck:DeckDefinition={id:outline.id,title:outline.title,subtitle:'研究基础 · 自动演示与交互',scenes:pages.map(({id,Component},i)=>({id,title:outline.pages[i].title,section:'研究基础',render:context=><Component {...(['foundation-one-title','foundation-two-title','foundation-three-title','foundation-four-title','foundation-five-title','pdf-structuring','main-figure-selection','literature-service'].includes(id)?{onComplete:context.complete}:{})}/>}))};
export function getPptNotes(id:string):SpeakerNote[]{const i=pages.findIndex(page=>page.id===id);return i<0?[]:[{text:outline.pages[i].snippet,selectors:['.rf-page','.rf-paper-method-page','.rf-service-page']}];}
export function ResearchFoundationPpt(){return <SceneDeck catalog={[deck]} moduleId={outline.id} assetId={outline.moduleIdentity.id} progressKey={`${outline.id}:ppt:v1`} getNotes={getPptNotes}/>;}

