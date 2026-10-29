import { creatorGuideAssetUrl } from '../creatorGuideAssets';
import { Typography, moduleAssetUrl } from '../../../../shared/react';
import outline from '../outlines.json';
import './FrontendJourneyPage.css';

const stairLabels = [
  { text: '高等数学基础', x: 820, y: 394, scale: .72 },
  { text: '线性代数基础', x: 820, y: 427, scale: .78 },
  { text: '机器学习基础', x: 820, y: 463, scale: .84 },
  { text: '深度学习基础', x: 815, y: 505, scale: .90 },
  { text: 'HTML', x: 815, y: 550, scale: .98 },
  { text: 'React', x: 815, y: 605, scale: .94 },
  { text: '工程实现与调试', x: 815, y: 665, scale: 1.08 },
];
export function FrontendJourneyPage() {
  return <article className="aipe-replay-cg-journey-page aipe-replay-cg-creator-typography" aria-labelledby="aipe-replay-cg-journey-title">
    <img className="aipe-replay-cg-journey-full-art" src={creatorGuideAssetUrl(outline.moduleIdentity.id, 'images/creator-equal-ascent-clean-background.png')} alt="通往交互课件的冰阶上，叠加着 AI 专业知识与前端工程能力两类门槛。" />
    <header className="aipe-replay-cg-journey-photo-heading"><Typography as="h1" id="aipe-replay-cg-journey-title" variant="h1" tone="inherit">从想法到交互课件，还隔着一道技术门槛</Typography><Typography variant="body" tone="inherit">既要懂 AI，也要懂前端，实现起来并不容易。</Typography></header>
    <section className="aipe-replay-cg-journey-flag aipe-replay-cg-journey-flag-ai" aria-label="AI专业创作者"><Typography as="h2" variant="body" tone="inherit">AI 专业创作者</Typography><Typography variant="body" tone="inherit">更懂 AI<br />不太懂前端</Typography></section>
    <section className="aipe-replay-cg-journey-flag aipe-replay-cg-journey-flag-web" aria-label="前端工程师"><Typography as="h2" variant="body" tone="inherit">前端工程师</Typography><Typography variant="body" tone="inherit">更懂前端<br />不太懂 AI</Typography></section>
    <div className="aipe-replay-cg-journey-summit-label"><Typography variant="bodySmall" tone="inherit">交互课件</Typography></div>
    <div className="aipe-replay-cg-journey-stairs" aria-label="制作交互课件需要跨越的专业与工程门槛">{stairLabels.map(stair => <div key={stair.text} className="aipe-replay-cg-journey-stair" style={{ left: stair.x - 205, top: stair.y - 30 }}><Typography variant="h3" tone="inherit" wrap="nowrap" style={{ transform: `scale(${stair.scale})` }}>{stair.text}</Typography></div>)}</div>
    <footer className="aipe-replay-cg-journey-photo-footer"><Typography variant="h3" tone="inherit">为降低这道门槛，我们开发了 Creator Skill。</Typography></footer>
  </article>;
}
