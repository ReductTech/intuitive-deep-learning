import creator_equal_ascent_clean_backgroundAsset0 from '../assets/images/creator-equal-ascent-clean-background.jpg';
import { Typography } from "@shuku/course-style/react";
import './FrontendJourneyPage.css';

const stairLabels = [
  { text: '知识理解', x: 820, y: 394, scale: .72 },
  { text: '方法分析', x: 820, y: 427, scale: .78 },
  { text: '实验判断', x: 820, y: 463, scale: .84 },
  { text: '内容设计', x: 815, y: 505, scale: .90 },
  { text: '网页布局', x: 815, y: 550, scale: .98 },
  { text: '交互实现', x: 815, y: 605, scale: .94 },
  { text: '工程调试', x: 815, y: 665, scale: 1.08 },
];
export function FrontendJourneyPage() {
  return <article className="cg-journey-page cg-creator-typography" aria-labelledby="cg-journey-title">
    <img className="cg-journey-full-art" src={creator_equal_ascent_clean_backgroundAsset0} alt="学生专注专业理解与内容设计，平台提供工程基础，支持网页制作与工程实现。" />
    <header className="cg-journey-photo-heading"><Typography as="h1" id="cg-journey-title" variant="h1" tone="inherit" align="center">围绕培养目标，提供工程支持</Typography></header>
    <section className="cg-journey-flag cg-journey-flag-ai" aria-label="本次培养重点是专业理解、实践与判断"><Typography as="h2" variant="body" tone="inherit">本次培养重点</Typography><Typography variant="body" tone="inherit">专业理解<br />实践与判断</Typography></section>
    <section className="cg-journey-flag cg-journey-flag-web" aria-label="平台提供工程基础，支持网页制作"><Typography as="h2" variant="body" tone="inherit">平台的支持</Typography><Typography variant="body" tone="inherit">提供工程基础<br />支持网页制作</Typography></section>
    <div className="cg-journey-summit-label"><Typography variant="bodySmall" tone="inherit">交互式知识呈现</Typography></div>
    <div className="cg-journey-stairs" aria-label="学生承担理解与判断，平台支持网页布局、交互实现和工程调试">{stairLabels.map(stair => <div key={stair.text} className="cg-journey-stair" style={{ left: stair.x - 205, top: stair.y - 30 }}><Typography variant="h3" tone="inherit" wrap="nowrap" style={{ transform: `scale(${stair.scale})` }}>{stair.text}</Typography></div>)}</div>
    <footer className="cg-journey-photo-footer"><Typography variant="h3" tone="inherit">平台提供工程基础，让学生把专业理解落实成作品。</Typography></footer>
  </article>;
}
