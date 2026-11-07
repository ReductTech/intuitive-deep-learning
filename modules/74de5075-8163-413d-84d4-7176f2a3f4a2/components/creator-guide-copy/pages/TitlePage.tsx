import { Typography } from '../../../../shared/react';
import './TitlePage.css';

/** Fine contour lines form a continuous ribbon: loose ideas gathering into structure. */
function KnowledgeRibbon() {
  return <svg className="aipe-replay-cg-cover-ribbon" viewBox="0 0 800 820" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="aipe-replay-cg-cover-ink" x1="0" y1="400" x2="770" y2="400" gradientUnits="userSpaceOnUse">
        <stop stopColor="#237cff" stopOpacity="0"/><stop offset=".32" stopColor="#237cff" stopOpacity=".2"/><stop offset=".7" stopColor="#1670ed" stopOpacity=".76"/><stop offset="1" stopColor="#4c9aff" stopOpacity=".3"/>
      </linearGradient>
    </defs>
    {Array.from({ length: 100 }, (_, i) => {
      const t = i / 99;
      const d = `M ${12 + 60 * t} ${50 + 690 * t} C ${310 - 45 * t} ${90 + 640 * t}, ${400 + 55 * t} ${560 - 420 * t}, ${606 + 62 * t} ${334 - 244 * t} C ${846 - 112 * t} ${55 - 20 * t}, ${781 - 145 * t} ${575 - 390 * t}, ${571 + 56 * t} ${496 - 85 * t} C ${374 + 180 * t} ${416 + 70 * t}, ${465 + 22 * t} ${738 + 36 * t}, ${654 + 62 * t} ${759 - 90 * t} C ${787 - 45 * t} ${770 - 30 * t}, ${765 - 66 * t} ${622 - 54 * t}, ${545 + 30 * t} ${565 - 70 * t}`;
      return <path key={i} d={d} stroke="url(#aipe-replay-cg-cover-ink)" strokeWidth={i % 5 === 0 ? 1.05 : .65}/>;
    })}
    <path d="M 92 603 C 330 585, 487 451, 604 306 C 660 237, 690 190, 712 177" stroke="#ed9a38" strokeWidth="1.6" opacity=".8"/>
  </svg>;
}

export function TitlePage() {
  return <article className="aipe-replay-cg-cover-page aipe-replay-cg-creator-typography" aria-labelledby="aipe-replay-cg-cover-title">
    <KnowledgeRibbon/>
    <div className="aipe-replay-cg-cover-eyebrow"><Typography variant="bodySmall" tone="inherit">CREATOR SKILL</Typography></div>
    <div className="aipe-replay-cg-cover-title"><Typography as="h1" variant="display" tone="inherit" wrap="nowrap" id="aipe-replay-cg-cover-title">实践创作指南</Typography></div>
    <div className="aipe-replay-cg-cover-subtitle"><Typography as="p" variant="h2" tone="inherit" wrap="nowrap">把专业知识，变成容易理解的知识呈现作品</Typography></div>
    <div className="aipe-replay-cg-cover-description"><Typography variant="subtitle" tone="inherit" wrap="nowrap">借助 Creator Skill，从内容构思到交互呈现</Typography></div>
    <footer className="aipe-replay-cg-cover-footer">
      {['明确目标', '设计讲解', '迭代成稿'].map((step, i) => <div className="aipe-replay-cg-cover-step" key={step}>
        {i > 0 && <Typography as="span" variant="body" tone="inherit" className="aipe-replay-cg-cover-arrow" aria-hidden="true">→</Typography>}
        <Typography as="span" variant="bodySmall" tone="inherit">{step}</Typography>
      </div>)}
    </footer>
    <Typography as="span" variant="bodySmall" tone="inherit" className="aipe-replay-cg-cover-number" aria-label="第 1 页">01</Typography>
  </article>;
}
