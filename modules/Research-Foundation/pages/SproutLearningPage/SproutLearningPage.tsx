import { Bean, Sprout, TreeDeciduous } from 'lucide-react';
import { Typography } from '../../../shared/react';
import { ResearchAppPhone } from '../../../AI-Practice-Education/pages/ResearchRecommendationAppPage/ResearchAppPhone';
import './SproutLearningPage.css';

const stages=[{name:'播种',caption:'基础',Icon:Bean},{name:'培育',caption:'实践',Icon:Sprout},{name:'成长',caption:'表达',Icon:TreeDeciduous}];
export function SproutLearningPage(){
 return <section className="rf-page rf-sprout-learning" aria-label="新芽训练营：播种、培育、成长">
  <header className="rf-sprout-heading"><Typography variant="bodySmall" className="rf-sprout-eyebrow">教育实践基础</Typography><Typography as="h1" variant="h1">新芽训练营</Typography><Typography variant="subtitle">让科研潜力，持续生长</Typography></header>
  <div className="rf-sprout-journey" aria-label="培养阶段"><svg className="rf-sprout-path" viewBox="0 0 900 70" aria-hidden="true"><path d="M150 22.5 C260 49 350 37 450 17.5 C550 4 650 0 750 6.5"/></svg>{stages.map(({name,caption,Icon},index)=><div className={`rf-sprout-stage rf-sprout-stage-${index}`} key={name}><div className="rf-sprout-stage-icon" role="img" aria-label={['种子','幼苗','树木'][index]}><Icon aria-hidden="true" strokeWidth={1.45}/></div><i aria-hidden="true"/><Typography as="h2" variant="h2">{name}</Typography><Typography variant="body">{caption}</Typography></div>)}</div>
  <div className="rf-sprout-phone-host"><ResearchAppPhone initialEntry="sprout" autoPlaySprout/></div>
 </section>;
}
