import { ArrowRight, FileText, Image as ImageIcon, ListTree, ScanText, Users, Check } from 'lucide-react';
import { ContentBlock, Typography, moduleAssetUrl } from '../../../shared/react';
import outline from '../../outlines.json';
import './PdfStructuringPage.css';

function Figure(){return <div className="rf-pdf-flow-figure" data-ppt-viewport="复用论文配图作为代表图表识别示例"><img src={moduleAssetUrl(outline.moduleIdentity.id,'images/recommendation-app/feed-reference.jpg')} alt="论文图表视觉元素示例" style={{width:`${1129/1009*100}%`,left:`${-60/1009*100}%`,top:`${-1280/340*100}%`}}/></div>}
function TextLines(){return <div className="rf-pdf-flow-lines" aria-hidden="true"><i/><i/><i/><i/></div>}
export function PdfStructuringPage(){
 return <ContentBlock className="rf-page rf-pdf-flow" title="把海量论文 PDF，转成结构化研究材料">
  <div className="rf-pdf-flow-chain">
   <section className="rf-pdf-flow-stage rf-pdf-flow-input"><Typography variant="h3">海量论文 PDF</Typography><div className="rf-pdf-flow-stack"><div/><div/><article><FileText size={29}/><Typography variant="bodySmall">Research Paper</Typography><TextLines/><div className="rf-pdf-flow-input-image"><ImageIcon size={31}/></div><TextLines/></article></div><Typography variant="bodySmall" tone="muted">原始论文版面</Typography></section>
   <ArrowRight className="rf-pdf-flow-arrow" size={31}/>
   <section className="rf-pdf-flow-stage"><Typography variant="h3">视觉解析</Typography><div className="rf-pdf-flow-analysis"><div className="rf-pdf-flow-region title"><Typography variant="bodySmall">标题与作者</Typography></div><div className="rf-pdf-flow-region text"><Typography variant="bodySmall">正文</Typography><TextLines/></div><div className="rf-pdf-flow-region image"><ImageIcon size={30}/><Typography variant="bodySmall">图表</Typography></div><div className="rf-pdf-flow-region text"><TextLines/></div></div><div className="rf-pdf-flow-methods"><ScanText size={21}/><Typography variant="bodySmall">OCR · 版面分析</Typography></div></section>
   <ArrowRight className="rf-pdf-flow-arrow" size={31}/>
   <section className="rf-pdf-flow-stage rf-pdf-flow-selection"><Typography variant="h3">代表性图表识别</Typography><div className="rf-pdf-flow-candidates" aria-label="从候选图表中识别代表性视觉元素"><div className="rf-pdf-flow-candidate"><ImageIcon size={27}/></div><div className="rf-pdf-flow-candidate"><ImageIcon size={27}/></div><div className="rf-pdf-flow-selected"><Figure/><span><Check size={17}/></span></div></div><Typography variant="bodySmall" tone="muted">保留核心视觉信息</Typography></section>
   <ArrowRight className="rf-pdf-flow-arrow" size={31}/>
   <section className="rf-pdf-flow-stage rf-pdf-flow-result"><Typography variant="h3">结构化表示</Typography><div className="rf-pdf-flow-fields">{[[FileText,'正文与章节'],[ImageIcon,'代表图表'],[ListTree,'大纲与总结'],[Users,'作者与机构']].map(([Icon,label])=>{const I=Icon as typeof FileText;return <div key={String(label)}><I size={25}/><Typography variant="body">{String(label)}</Typography></div>})}</div><Typography variant="bodySmall" tone="muted">可检索 · 可复用</Typography></section>
  </div>
  <Typography className="rf-pdf-flow-note" variant="bodySmall" tone="muted">处理流程示意</Typography>
 </ContentBlock>;
}
