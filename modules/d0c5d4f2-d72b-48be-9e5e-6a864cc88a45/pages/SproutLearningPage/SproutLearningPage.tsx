import { Bean, Sprout, TreeDeciduous } from 'lucide-react';
import { Typography } from "@shuku/course-style/react";
import { ResearchAppPhone } from '../../../b8d86e85-2150-47e3-9e1a-aa7cc7cce15c/pages/ResearchRecommendationAppPage/ResearchAppPhone';
import './SproutLearningPage.css';

const stages=[{name:'播种',caption:'基础',Icon:Bean},{name:'培育',caption:'实践',Icon:Sprout},{name:'成长',caption:'表达',Icon:TreeDeciduous}];
export function SproutLearningPage(){
 return <section shuku-edit-id="e-a96a26ae-5af1-4160-bc7a-27723d96604d" className="rf-page rf-sprout-learning" aria-label="新芽训练营：播种、培育、成长">
  <header shuku-edit-id="e-ff7a0389-7034-4b24-862b-460151e5061f" className="rf-sprout-heading"><Typography shuku-edit-id="e-f9ad04e8-b566-48a4-835b-6ec727228882" variant="bodySmall" className="rf-sprout-eyebrow">教育实践基础</Typography><Typography shuku-edit-id="e-0ca77b21-ed56-45ae-87b0-de93deb0c39e" as="h1" variant="h1">新芽训练营</Typography><Typography shuku-edit-id="e-0e044f18-2f46-4e47-8b95-8acbbade2efc" variant="subtitle">让科研潜力，持续生长</Typography></header>
  <div shuku-edit-id="e-d6343859-6547-43ba-9887-137280c571f0" className="rf-sprout-journey" aria-label="培养阶段"><svg shuku-edit-id="e-850382fc-3ed5-4efd-bbb5-e6592205cf6f" className="rf-sprout-path" viewBox="0 0 900 70" aria-hidden="true"><path shuku-edit-id="e-af5aa098-be7b-4d5c-a95d-443817a095c3" d="M150 22.5 C260 49 350 37 450 17.5 C550 4 650 0 750 6.5"/></svg>{stages.map(({name,caption,Icon},index)=><div shuku-edit-id="e-b7cccf72-fbe0-41ad-acdf-531c107ce90f" className={`rf-sprout-stage rf-sprout-stage-${index}`} key={name}><div shuku-edit-id="e-05919732-8a3a-4f16-83ed-8e455b9b6d94" className="rf-sprout-stage-icon" role="img" aria-label={['种子','幼苗','树木'][index]}><Icon aria-hidden="true" strokeWidth={1.45}/></div><i shuku-edit-id="e-290985f6-cc70-41e2-b1fe-3c4e21553dae" aria-hidden="true"/><Typography shuku-edit-id="e-40482534-7cef-4337-936f-3cf6876c5b6a" as="h2" variant="h2">{name}</Typography><Typography shuku-edit-id="e-937fd3ae-30e2-41b7-bb67-529a1ed92f9f" variant="body">{caption}</Typography></div>)}</div>
  <div shuku-edit-id="e-54ee33d8-e354-4b69-962a-65d2fea02d8b" className="rf-sprout-phone-host"><ResearchAppPhone initialEntry="sprout" autoPlaySprout/></div>
 </section>;
}
