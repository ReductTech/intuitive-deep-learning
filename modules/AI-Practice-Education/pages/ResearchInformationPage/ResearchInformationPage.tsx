import { ContentBlock, Typography, moduleAssetUrl } from '../../../shared/react';
import outline from '../../outlines.json';
import './ResearchInformationPage.css';

const source='https://hai.stanford.edu/assets/files/hai_ai_index_report_2025.pdf#page=30';
const image=(name:string)=>moduleAssetUrl(outline.moduleIdentity.id,`images/${name}`);
export function ResearchInformationPage() {
 const art={backgroundImage:`url("${image('paper-overload-art-v1.png')}")`};
 return <ContentBlock className="aipe-research-challenge" headingLevel={1} title={outline.pages[4].title}
  subtitle="论文不断涌现，阅读与深入理解都需要时间" bodyClassName="aipe-research-challenge-body">
  <div className="aipe-research-chart-area">
   <Typography as="h2" variant="h3" tone="accent">全球计算机领域 AI 论文年度发布量</Typography>
   <Typography as="p" variant="body" tone="muted" className="aipe-research-stat">2023 年：<strong>24.27 万篇</strong>，折合约 <strong>665 篇 / 日</strong></Typography>
   <figure className="aipe-research-chart">
    <img src={image('stanford-ai-index-2025-fig-1-1-1.png')} alt="斯坦福AI Index 2025报告图1.1.1原图：2013至2023年全球计算机领域英文AI论文年度数量，单位千篇；2023年为242.74千篇。"/>
    <div className="aipe-research-paper-backdrop" style={art} aria-hidden="true"/>
   </figure>
   <div className="aipe-research-source">
    <Typography as="a" variant="bodySmall" tone="muted" href={source} target="_blank" rel="noreferrer">来源：Stanford AI Index 2025，图 1.1.1（报告第 29 页） ↗</Typography>
    <Typography as="p" variant="bodySmall" tone="muted">口径：计算机领域英文 AI 论文；日均按 2023 年总量 ÷ 365 折算。</Typography>
   </div>
  </div>
  <div className="aipe-research-reader-area">
   <div className="aipe-research-reader-art" style={art} role="img" aria-label="学习者阅读论文，桌边的时钟提示阅读与理解需要时间"/>
   <Typography as="h2" variant="h2" tone="accent" align="center">个人精力有限</Typography>
  </div>
 </ContentBlock>;
}
