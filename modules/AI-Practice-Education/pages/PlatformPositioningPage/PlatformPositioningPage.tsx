import { useId, type CSSProperties } from 'react';
import { ContentBlock, Typography, moduleAssetUrl } from '../../../shared/react';
import outline from '../../outlines.json';
import './PlatformPositioningPage.css';

const abilities=[
 {id:'information',number:'01',title:'科研信息供给',description:'论文分析与个性化推荐',position:'0% 0%'},
 {id:'content',number:'02',title:'知识重组与内容生成',description:'知识重组与交互素材生成',position:'100% 0%'},
 {id:'practice',number:'03',title:'编程与可视化实践',description:'环境辅助、代码实现与可视化',position:'100% 100%'},
 {id:'evaluation',number:'04',title:'学习者建模与评价',description:'学习偏好与效果建模',position:'0% 100%'},
];
// Use one filled arc per arrow: separate SVG markers can leave the shaft
// protruding through the arrowhead. All four arcs share the same geometry.
const loopArrows=[252,342,72,162];
function ringArrow(start:number) {
 const radius=Math.hypot(200,200),end=start+36,headBase=end-7.5;
 const point=(angle:number,r:number)=>{
  const radians=angle*Math.PI/180;
  return `${(780+r*Math.cos(radians)).toFixed(3)} ${(345+r*Math.sin(radians)).toFixed(3)}`;
 };
 return [
  `M${point(start,radius+12)}`,
  `A${radius+12} ${radius+12} 0 0 1 ${point(headBase,radius+12)}`,
  `L${point(headBase,radius+24)}`,
  `L${point(end,radius)}`,
  `L${point(headBase,radius-24)}`,
  `L${point(headBase,radius-12)}`,
  `A${radius-12} ${radius-12} 0 0 0 ${point(start,radius-12)}`,
  'Z',
 ].join(' ');
}

export function PlatformPositioningPage(){
 const id=useId().replaceAll(':','');
 const asset=moduleAssetUrl(outline.moduleIdentity.id,'images/platform-capability-icons-v1.png');
 return <ContentBlock className="aipe-platform-page" headingLevel={1} title={outline.pages[3].title}
  subtitle="以多模态大模型支撑信息供给、内容生成、编程实践与学习评价" bodyClassName="aipe-platform-body">
  <div className="aipe-platform-diagram" role="group" aria-label="面向知识探索者的平台四项能力，按01到04顺时针阅读，评价反馈支持优化">
   <svg className="aipe-platform-arrows" viewBox="0 0 1538 690" aria-hidden="true"><defs>
    <linearGradient id={`${id}-blue`}><stop stopColor="#b3d5fb"/><stop offset="1" stopColor="#6498d9"/></linearGradient>
   </defs>
   {loopArrows.map((start,index)=><path key={start} data-loop-arrow={index+1} d={ringArrow(start)} fill={index===3?'#f07e47':`url(#${id}-blue)`}/>)}</svg>
   <div className="aipe-platform-center"><Typography as="h2" variant="h1" tone="accent">知识探索者</Typography></div>
   <Typography as="span" variant="body" tone="inherit" className="aipe-platform-feedback">反馈优化</Typography>
   {abilities.map(a=><div key={a.id} className={`aipe-platform-ability aipe-platform-${a.id}`}>
    <div className="aipe-platform-icon" aria-hidden="true" style={{backgroundImage:`url("${asset}")`,backgroundPosition:a.position} as CSSProperties}/>
    <div className="aipe-platform-number"><Typography as="span" variant="h3" tone="inherit">{a.number}</Typography></div>
    <section className="aipe-platform-copy"><Typography as="h2" variant="h3" tone="accent">{a.title}</Typography><Typography as="p" variant="bodySmall" tone="muted">{a.description}</Typography></section>
   </div>)}
  </div>
 </ContentBlock>;
}
