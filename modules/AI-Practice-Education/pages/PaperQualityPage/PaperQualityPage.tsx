import { ContentBlock, Typography, moduleAssetUrl } from '../../../shared/react';
import outline from '../../outlines.json';
import './PaperQualityPage.css';

const references=[
 {label:'AAAI 2025',text:'From Words to Worth: Newborn Article Impact Prediction with LLM.',url:'https://doi.org/10.1609/aaai.v39i1.32106'},
 {label:'ICLR 2026',text:'NAIPv2: Debiased Pairwise Learning for Efficient Paper Quality Estimation.',url:'https://openreview.net/forum?id=rNl8XiSHiJ'},
];
export function PaperQualityPage(){
 return <ContentBlock className="aipe-paper-method-page" headingLevel={1} title={outline.pages[6].title}
  subtitle="训练时学习相对质量，推理时保持单篇打分" bodyClassName="aipe-paper-method-body">
  <div className="aipe-paper-method-figure"><img src={moduleAssetUrl(outline.moduleIdentity.id,'images/naipv2-method.svg')} alt="NAIPv2方法总图：对比自回归评价、NAIPv1单篇回归、NAIPv2成对训练与单篇推理。"/></div>
  <div className="aipe-paper-method-references" aria-label="论文引用">{references.map((ref,i)=><section className="aipe-paper-method-publication" key={ref.label}>
   <div className="aipe-paper-method-publication-head"><Typography as="span" variant="bodySmall" tone={i===0?'accent':'success'} className="aipe-paper-method-venue"><strong>{ref.label}</strong></Typography><a className="aipe-paper-method-paper-link" href={ref.url} target="_blank" rel="noreferrer" aria-label={`打开 ${ref.label} 论文：${ref.text}`}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M5 19 19 5M6 5h13v13"/></svg></a></div>
   <Typography as="p" variant="h3" tone="accent">{ref.text.replace(/\.$/,'')}</Typography>
  </section>)}</div>
 </ContentBlock>;
}
