import { Typography } from '../../../shared/react';
import { Figure } from '../PdfVisualExtractionPage/PdfVisualExtractionPage';
import { useResearchAnimation } from '../../components/useResearchAnimation';
import './MainFigureSelectionPage.css';

export function MainFigureSelectionPage({onComplete}:{onComplete?:()=>void}){
 const {elapsed,root}=useResearchAnimation(10000,onComplete);
 const phase=elapsed<2000?0:elapsed<3700?1:2;
 return <section ref={root} className={`rf-page rf-main-figure phase-${phase}`} data-phase={phase} aria-label="代表性主图识别动画">
  <div className="rf-main-figure-wall">{Array.from({length:9},(_,i)=>(phase<2||i===2)&&<div key={i} className={`rf-main-figure-item ${i===2?'representative':''}`}><Figure index={i}/>{phase===2&&<Typography variant="h3" className="rf-main-figure-label">主图</Typography>}</div>)}{phase===1&&<div className="rf-main-figure-scan" aria-hidden="true"/>}</div>
  {phase<2&&<Typography variant="body" tone="muted" className="rf-main-figure-caption">{phase===0?'提取论文图表':'识别代表性主图'}</Typography>}
 </section>;
}
