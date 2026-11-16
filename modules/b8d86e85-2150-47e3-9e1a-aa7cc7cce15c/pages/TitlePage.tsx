import { Typography } from "@shuku/course-style/react";
import './TitlePage.css';

/** Fine contour lines form a continuous ribbon: loose ideas gathering into structure. */
function KnowledgeRibbon() {
  return <svg shuku-edit-id="e-3f393de7-3b9c-4db2-b26a-0d40f900f72c" className="cg-cover-ribbon" viewBox="0 0 800 820" fill="none" aria-hidden="true">
    <defs shuku-edit-id="e-953fd01a-13d9-4cd1-905b-30e6b57b21aa">
      <linearGradient shuku-edit-id="e-962f9a14-1a23-453c-957a-4375db6605e0" id="cg-cover-ink" x1="0" y1="400" x2="770" y2="400" gradientUnits="userSpaceOnUse">
        <stop shuku-edit-id="e-deea4da8-b05c-4f15-88df-379eec6d0da4" stopColor="#237cff" stopOpacity="0"/><stop shuku-edit-id="e-61d07cc1-f4f5-4377-99a3-8935084c9754" offset=".32" stopColor="#237cff" stopOpacity=".2"/><stop shuku-edit-id="e-dfeed26a-e859-4cb2-8c51-e0e4d6e2ad8f" offset=".7" stopColor="#1670ed" stopOpacity=".76"/><stop shuku-edit-id="e-1d826d16-871d-4bc6-8342-0e0261189f4d" offset="1" stopColor="#4c9aff" stopOpacity=".3"/>
      </linearGradient>
    </defs>
    {Array.from({ length: 100 }, (_, i) => {
      const t = i / 99;
      const d = `M ${12 + 60 * t} ${50 + 690 * t} C ${310 - 45 * t} ${90 + 640 * t}, ${400 + 55 * t} ${560 - 420 * t}, ${606 + 62 * t} ${334 - 244 * t} C ${846 - 112 * t} ${55 - 20 * t}, ${781 - 145 * t} ${575 - 390 * t}, ${571 + 56 * t} ${496 - 85 * t} C ${374 + 180 * t} ${416 + 70 * t}, ${465 + 22 * t} ${738 + 36 * t}, ${654 + 62 * t} ${759 - 90 * t} C ${787 - 45 * t} ${770 - 30 * t}, ${765 - 66 * t} ${622 - 54 * t}, ${545 + 30 * t} ${565 - 70 * t}`;
      return <path shuku-edit-id="e-24f933e6-fb5b-4f7e-8ecd-246c35baace9" key={i} d={d} stroke="url(#cg-cover-ink)" strokeWidth={i % 5 === 0 ? 1.05 : .65}/>;
    })}
    <path shuku-edit-id="e-069f46d9-1af5-43ba-b1f6-2dccb6abcf43" d="M 92 603 C 330 585, 487 451, 604 306 C 660 237, 690 190, 712 177" stroke="#ed9a38" strokeWidth="1.6" opacity=".8"/>
  </svg>;
}

export function TitlePage() {
  return <article shuku-edit-id="e-04cf84ba-3c87-47db-a0fd-e88170719649" className="cg-cover-page cg-creator-typography" aria-labelledby="cg-cover-title">
    <KnowledgeRibbon/>
    <div shuku-edit-id="e-3a0b6343-6d57-4bef-b454-2b7742bfb896" className="cg-cover-eyebrow"><Typography shuku-edit-id="e-3f89ace2-6e13-4bdf-b0b7-47e16021c803" variant="bodySmall" tone="inherit">CREATOR SKILL</Typography></div>
    <div shuku-edit-id="e-f2d5d781-23fe-4285-933b-5a27c8ff8642" className="cg-cover-title"><Typography shuku-edit-id="e-6aacf991-992f-4cff-a6ca-9ee83b1c6b6e" as="h1" variant="display" tone="inherit" wrap="nowrap" id="cg-cover-title">实践创作指南</Typography></div>
    <div shuku-edit-id="e-3f7f5a63-cddf-4455-aa48-d1cba08496e5" className="cg-cover-subtitle"><Typography shuku-edit-id="e-30e037d3-9e18-45d8-a5b4-dce016f60bf3" as="p" variant="h2" tone="inherit" wrap="nowrap">把专业知识，变成容易理解的知识呈现作品</Typography></div>
    <div shuku-edit-id="e-17f71e1f-ed87-46c2-a345-77f98525287b" className="cg-cover-description"><Typography shuku-edit-id="e-1a759e38-c280-4619-84bb-bfcced0744a4" variant="subtitle" tone="inherit" wrap="nowrap">借助 Creator Skill，从内容构思到交互呈现</Typography></div>
    <footer shuku-edit-id="e-abbc5a62-6fac-4096-88b4-6a455ec403a4" className="cg-cover-footer">
      {['明确目标', '设计讲解', '迭代成稿'].map((step, i) => <div shuku-edit-id="e-7ee2a5b4-734b-4b96-8473-5a9c6b2bcfbb" className="cg-cover-step" key={step}>
        {i > 0 && <Typography shuku-edit-id="e-21fc5f00-8c6b-4348-b882-ff10c2dec207" as="span" variant="body" tone="inherit" className="cg-cover-arrow" aria-hidden="true">→</Typography>}
        <Typography shuku-edit-id="e-748c043c-723b-4a3f-9d3f-7c5bd6bff26a" as="span" variant="bodySmall" tone="inherit">{step}</Typography>
      </div>)}
    </footer>
    <Typography shuku-edit-id="e-97549556-116d-4999-8e3c-5791067b8d8b" as="span" variant="bodySmall" tone="inherit" className="cg-cover-number" aria-label="第 1 页">01</Typography>
  </article>;
}
