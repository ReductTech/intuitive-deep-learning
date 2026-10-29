import { ArrowDown, ArrowRight, Brain, Clock3, FileSearch, ChartColumnIncreasing, UserRound, UserRoundCog } from './SupplyIcons';
import { ContentBlock, Typography, moduleAssetUrl } from '../../../shared/react';
import outline from '../../outlines.json';
import './PersonalizedResearchSupplyPage.css';

const stages=[{label:'论文分析',Icon:FileSearch},{label:'创新性评价',Icon:ChartColumnIncreasing},{label:'个性化推荐',Icon:UserRoundCog}];
export function PersonalizedResearchSupplyPage(){
 const art={backgroundImage:`url("${moduleAssetUrl(outline.moduleIdentity.id,'images/personalized-research-papers-v1.png')}")`};
 return <ContentBlock className="aipe-supply-page" headingLevel={1} title={outline.pages[5].title}
  subtitle="前沿发展太快，论文太多，学习者的时间与理解能力有限" bodyClassName="aipe-supply-body">
  <Typography as="p" variant="h3" tone="inherit" className="aipe-supply-kicker">01 丨 科研信息供给</Typography>
  <section className="aipe-supply-input">
   <Typography as="h2" variant="h2" tone="accent" align="center">信息过载</Typography>
   <div className="aipe-supply-paper-pile" style={art} role="img" aria-label="大量科研论文形成信息过载"/>
   <div className="aipe-supply-limits"><div><Clock3 aria-hidden="true"/><Typography as="span" variant="bodySmall" tone="accent">时间有限</Typography></div><div><Brain aria-hidden="true"/><Typography as="span" variant="bodySmall" tone="accent">理解带宽有限</Typography></div></div>
  </section>
  <ArrowRight className="aipe-supply-flow aipe-supply-flow-in" aria-hidden="true"/>
  <section className="aipe-supply-platform">
   <Typography as="h2" variant="h2" tone="accent" align="center">平台分析与推荐</Typography>
   <div className="aipe-supply-panel">
    <div className="aipe-supply-goal"><UserRound aria-hidden="true"/><Typography as="span" variant="bodySmall" tone="accent">个人兴趣与研究目标</Typography></div>
    <ArrowDown className="aipe-supply-goal-arrow" aria-hidden="true"/>
    <div className="aipe-supply-stages">{stages.map(({label,Icon},i)=><div key={label} className="aipe-supply-stage"><div className="aipe-supply-stage-icon"><Icon aria-hidden="true"/></div><Typography as="h3" variant="body" tone="accent" align="center">{label}</Typography>{i<2&&<ArrowRight className="aipe-supply-stage-arrow" aria-hidden="true"/>}</div>)}</div>
    <div className="aipe-supply-daily"><Typography as="p" variant="body" tone="accent" align="center">每天自动分析数百篇文章</Typography></div>
   </div>
  </section>
  <ArrowRight className="aipe-supply-flow aipe-supply-flow-out" aria-hidden="true"/>
  <section className="aipe-supply-output">
   <Typography as="h2" variant="h2" tone="accent" align="center">按需供给</Typography>
   <div className="aipe-supply-selected-papers" style={art} role="img" aria-label="与个人目标匹配的高质量论文"/>
   <Typography as="p" variant="h3" tone="accent" align="center" className="aipe-supply-output-caption">高质量科研信息<br/>与个人目标匹配</Typography>
  </section>
  <Typography as="p" variant="h2" tone="accent" align="center" className="aipe-supply-conclusion">把<span>信息过载</span>转化为<span>按需供给</span>，让有限时间用在值得关注的研究上</Typography>
 </ContentBlock>;
}
