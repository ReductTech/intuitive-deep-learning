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
 {id:'715b4edd-fa27-4ef5-bb83-200a7c1c3704',Component:FoundationOneTitlePage},
 {id:'5dac728a-d418-4b2d-ae37-bce3b5b90949',Component:PdfVisualExtractionPage},
 {id:'9d90a533-c4de-4403-a2ff-6eaca0e3b06d',Component:MainFigureSelectionPage},
 {id:'046255c6-c674-4df2-89f6-f8d50049cd31',Component:AirflowControlPage},
 {id:'d80af044-b6eb-4d2b-9ffd-41ccd0704f4e',Component:FoundationTwoTitlePage},
 {id:'43137cd3-71ea-4fde-8322-f4706d819016',Component:PaperQualityPage},
 {id:'dcad9b1e-06a9-4535-95b8-a7837e4afe5f',Component:ResearchServicePage},
 {id:'575af7b1-9c95-4cbe-8af5-c2888526b0f1',Component:ResearchMethodsPage},
 {id:'5f43daf3-4758-4a8a-ab78-8deb4d8366c3',Component:FoundationThreeTitlePage},
 {id:'b73c28f3-fdb5-4adc-b19d-6977169170ef',Component:CaoChongShowcasePage},
 {id:'b2255b3a-b91e-435f-ad25-ca7899011d57',Component:RegressionFitShowcasePage},
 {id:'61e3a590-92b5-4817-a2d3-08ea993735f3',Component:CodeExecutionShowcasePage},
 {id:'b7a3327f-eb1a-41a7-962c-efd68efe0183',Component:ShukuWebsiteShowcasePage},
 {id:'1459e234-0943-4055-8088-11603e9bb36e',Component:FoundationFourTitlePage},
 {id:'57cc9e9e-bdb6-46b3-820c-ee33bda44886',Component:PlatformFoundationPage},
 {id:'32d61739-577f-46d5-9419-f587012c7982',Component:UserFoundationPage},
 {id:'6cb75695-00b0-40f6-ad22-ceec5248ee40',Component:FoundationFiveTitlePage},
 {id:'8af96ed3-74ca-42c1-93ba-e88b9e7238dc',Component:SproutLearningPage},
 {id:'68aa560f-74f9-4a14-95c7-c2f91736d619',Component:EducationCasePage},
];
export const deck:DeckDefinition={id:outline.id,title:outline.title,subtitle:'研究基础 · 自动演示与交互',scenes:pages.map(({id,Component},i)=>({id,title:outline.pages[i].title,section:'研究基础',render:context=><Component {...(['715b4edd-fa27-4ef5-bb83-200a7c1c3704','d80af044-b6eb-4d2b-9ffd-41ccd0704f4e','5f43daf3-4758-4a8a-ab78-8deb4d8366c3','1459e234-0943-4055-8088-11603e9bb36e','6cb75695-00b0-40f6-ad22-ceec5248ee40','5dac728a-d418-4b2d-ae37-bce3b5b90949','9d90a533-c4de-4403-a2ff-6eaca0e3b06d','046255c6-c674-4df2-89f6-f8d50049cd31'].includes(id)?{onComplete:context.complete}:{})}/>}))};
export function getPptNotes(id:string):SpeakerNote[]{const i=pages.findIndex(page=>page.id===id);return i<0?[]:[{text:outline.pages[i].snippet,selectors:['.rf-page','.rf-paper-method-page','.rf-service-page']}];}
export function ResearchFoundationPpt(){return <SceneDeck catalog={[deck]} moduleId={outline.id} assetId={outline.moduleIdentity.id} progressKey={`${outline.id}:ppt:v1`} getNotes={getPptNotes}/>;}

