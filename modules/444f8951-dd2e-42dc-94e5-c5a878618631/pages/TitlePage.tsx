import { Typography } from "@shuku/course-style/react";
import './TitlePage.css';

/** Fine contour lines form a continuous ribbon: loose ideas gathering into structure. */
function KnowledgeRibbon() {
  return <svg shuku-edit-id="e-279254a1-7bcc-4add-840f-5cb3fd2dec5a" className="cg-cover-ribbon" viewBox="0 0 800 820" fill="none" aria-hidden="true">
    <defs shuku-edit-id="e-30c492e0-59a9-478c-88cd-6b2260ee4eaa">
      <linearGradient shuku-edit-id="e-6ff21bc2-f10f-47f6-8340-dd35c47fe945" id="cg-cover-ink" x1="0" y1="400" x2="770" y2="400" gradientUnits="userSpaceOnUse">
        <stop shuku-edit-id="e-3c417ad8-054e-485d-94e9-16e34693c195" stopColor="#237cff" stopOpacity="0"/><stop shuku-edit-id="e-8972b8a3-3631-448a-8514-1591b92535ed" offset=".32" stopColor="#237cff" stopOpacity=".2"/><stop shuku-edit-id="e-a77917ae-e71c-4b93-a2ba-8fd7ad0178c2" offset=".7" stopColor="#1670ed" stopOpacity=".76"/><stop shuku-edit-id="e-76e10900-6527-4fa3-a377-63340d8436cd" offset="1" stopColor="#4c9aff" stopOpacity=".3"/>
      </linearGradient>
    </defs>
    {Array.from({ length: 100 }, (_, i) => {
      const t = i / 99;
      const d = `M ${12 + 60 * t} ${50 + 690 * t} C ${310 - 45 * t} ${90 + 640 * t}, ${400 + 55 * t} ${560 - 420 * t}, ${606 + 62 * t} ${334 - 244 * t} C ${846 - 112 * t} ${55 - 20 * t}, ${781 - 145 * t} ${575 - 390 * t}, ${571 + 56 * t} ${496 - 85 * t} C ${374 + 180 * t} ${416 + 70 * t}, ${465 + 22 * t} ${738 + 36 * t}, ${654 + 62 * t} ${759 - 90 * t} C ${787 - 45 * t} ${770 - 30 * t}, ${765 - 66 * t} ${622 - 54 * t}, ${545 + 30 * t} ${565 - 70 * t}`;
      return <path shuku-edit-id="e-b80b8cb2-70e8-474a-a97b-07cf8109ab21" key={i} d={d} stroke="url(#cg-cover-ink)" strokeWidth={i % 5 === 0 ? 1.05 : .65}/>;
    })}
    <path shuku-edit-id="e-64a5b5e8-dac1-49bc-b6e3-597d619a0127" d="M 92 603 C 330 585, 487 451, 604 306 C 660 237, 690 190, 712 177" stroke="#ed9a38" strokeWidth="1.6" opacity=".8"/>
  </svg>;
}

export function TitlePage() {
  return <article shuku-edit-id="e-cbd4aca9-10a0-47b6-8dbe-6a0e2261abd5" className="cg-cover-page cg-creator-typography" aria-labelledby="cg-cover-title">
    <KnowledgeRibbon/>
    <div shuku-edit-id="e-810d68bb-3652-4fcf-8af3-96bde9bde4b2" className="cg-cover-eyebrow"><Typography shuku-edit-id="e-b736e60b-a814-4ab8-a86e-02dd57c187c1" variant="bodySmall" tone="inherit">CREATOR SKILL</Typography></div>
    <div shuku-edit-id="e-2af9ed9f-ad4b-48c1-8eaa-a41274ee92ce" className="cg-cover-title"><Typography shuku-edit-id="e-6d709221-f2d9-4f3a-b8a2-5d0f7969221d" as="h1" variant="display" tone="inherit" wrap="nowrap" id="cg-cover-title">实践创作指南</Typography></div>
    <div shuku-edit-id="e-5eaf8395-e8c4-41b4-9edc-dd9c749c173d" className="cg-cover-subtitle"><Typography shuku-edit-id="e-1f4dfe06-e885-4f60-9e1d-fedd60e70f39" as="p" variant="h2" tone="inherit" wrap="nowrap">把专业知识，变成容易理解的知识呈现作品</Typography></div>
    <div shuku-edit-id="e-0f84e583-8b6a-41e9-9b5d-577cd77c164b" className="cg-cover-description"><Typography shuku-edit-id="e-c65d58c0-86ce-492e-b4b6-5047fed14315" variant="subtitle" tone="inherit" wrap="nowrap">借助 Creator Skill，从内容构思到交互呈现</Typography></div>
    <footer shuku-edit-id="e-ebad9728-eece-4abb-9e3e-82eb8fe7f04d" className="cg-cover-footer">
      {['明确目标', '设计讲解', '迭代成稿'].map((step, i) => <div shuku-edit-id="e-db6aad0e-11fb-4f7e-80bb-36b6a418e07d" className="cg-cover-step" key={step}>
        {i > 0 && <Typography shuku-edit-id="e-8763c07e-41c1-46a4-9420-3ddf328566c7" as="span" variant="body" tone="inherit" className="cg-cover-arrow" aria-hidden="true">→</Typography>}
        <Typography shuku-edit-id="e-b668ae40-a9ce-46fd-be14-b6c7253a5ea6" as="span" variant="bodySmall" tone="inherit">{step}</Typography>
      </div>)}
    </footer>
    <Typography shuku-edit-id="e-2f51b458-655a-4ea0-9573-4975864a0d65" as="span" variant="bodySmall" tone="inherit" className="cg-cover-number" aria-label="第 1 页">01</Typography>
  </article>;
}
