import { Typography } from "@shuku/course-style/react";
import './TitlePage.css';

/** Fine contour lines form a continuous ribbon: loose ideas gathering into structure. */
function KnowledgeRibbon() {
  return <svg shuku-edit-id="e-ae6601ff-88bc-4ab5-9337-86a27a52735b" className="cg-cover-ribbon" viewBox="0 0 800 820" fill="none" aria-hidden="true">
    <defs shuku-edit-id="e-1fe39a45-735d-4166-8efb-eb26a1f5fd18">
      <linearGradient shuku-edit-id="e-b5c42302-b99e-4efe-ae18-62636bec96ab" id="cg-cover-ink" x1="0" y1="400" x2="770" y2="400" gradientUnits="userSpaceOnUse">
        <stop shuku-edit-id="e-54757faf-03e5-4c52-9bc8-e51c7b298e1f" stopColor="#237cff" stopOpacity="0"/><stop shuku-edit-id="e-a7b685db-da87-4030-b52e-f68e9ad60da0" offset=".32" stopColor="#237cff" stopOpacity=".2"/><stop shuku-edit-id="e-0f527260-b0a8-46c4-b790-5156462a77a0" offset=".7" stopColor="#1670ed" stopOpacity=".76"/><stop shuku-edit-id="e-a9cefed1-853d-4638-b05d-baf9adcdf2be" offset="1" stopColor="#4c9aff" stopOpacity=".3"/>
      </linearGradient>
    </defs>
    {Array.from({ length: 100 }, (_, i) => {
      const t = i / 99;
      const d = `M ${12 + 60 * t} ${50 + 690 * t} C ${310 - 45 * t} ${90 + 640 * t}, ${400 + 55 * t} ${560 - 420 * t}, ${606 + 62 * t} ${334 - 244 * t} C ${846 - 112 * t} ${55 - 20 * t}, ${781 - 145 * t} ${575 - 390 * t}, ${571 + 56 * t} ${496 - 85 * t} C ${374 + 180 * t} ${416 + 70 * t}, ${465 + 22 * t} ${738 + 36 * t}, ${654 + 62 * t} ${759 - 90 * t} C ${787 - 45 * t} ${770 - 30 * t}, ${765 - 66 * t} ${622 - 54 * t}, ${545 + 30 * t} ${565 - 70 * t}`;
      return <path shuku-edit-id="e-eaf07d6e-dbc6-481f-866f-6959b6273506" key={i} d={d} stroke="url(#cg-cover-ink)" strokeWidth={i % 5 === 0 ? 1.05 : .65}/>;
    })}
    <path shuku-edit-id="e-5ce23dee-1d05-483d-85a3-05c132ae5d2b" d="M 92 603 C 330 585, 487 451, 604 306 C 660 237, 690 190, 712 177" stroke="#ed9a38" strokeWidth="1.6" opacity=".8"/>
  </svg>;
}

export function TitlePage() {
  return <article shuku-edit-id="e-9d70fbd1-0098-4747-930a-37f080b969ab" className="cg-cover-page cg-creator-typography" aria-labelledby="cg-cover-title">
    <KnowledgeRibbon/>
    <div shuku-edit-id="e-54d0507b-b0c2-4f97-9f81-dc8b20806908" className="cg-cover-eyebrow"><Typography shuku-edit-id="e-2ea91159-dccb-48be-9e47-64345bdb4e21" variant="bodySmall" tone="inherit">CREATOR SKILL</Typography></div>
    <div shuku-edit-id="e-039b1d65-61b1-4c6b-875c-51b00c8f94b7" className="cg-cover-title"><Typography shuku-edit-id="e-57e8c984-ef7e-42f7-a8de-89d798e0a364" as="h1" variant="display" tone="inherit" wrap="nowrap" id="cg-cover-title">实践创作指南</Typography></div>
    <div shuku-edit-id="e-4fa0d6dd-783a-4c0f-8378-201e5c0bb292" className="cg-cover-subtitle"><Typography shuku-edit-id="e-d1e203cf-0b5e-4efc-b2cd-45d959f96fdb" as="p" variant="h2" tone="inherit" wrap="nowrap">把专业知识，变成容易理解的知识呈现作品</Typography></div>
    <div shuku-edit-id="e-de8a8fb4-bb07-44d8-b7a1-09b4ee9174c3" className="cg-cover-description"><Typography shuku-edit-id="e-aa5f97b0-9179-4169-a362-877a30615261" variant="subtitle" tone="inherit" wrap="nowrap">借助 Creator Skill，从内容构思到交互呈现</Typography></div>
    <footer shuku-edit-id="e-76f1d9dd-775a-4f06-9ed8-ad143f7504a4" className="cg-cover-footer">
      {['明确目标', '设计讲解', '迭代成稿'].map((step, i) => <div shuku-edit-id="e-ecea88e7-a66a-4bc3-9bfc-09dd707b3472" className="cg-cover-step" key={step}>
        {i > 0 && <Typography shuku-edit-id="e-b465f3d5-ecea-4c43-b849-63c9c59a35e5" as="span" variant="body" tone="inherit" className="cg-cover-arrow" aria-hidden="true">→</Typography>}
        <Typography shuku-edit-id="e-2f04d8f7-4745-4c8a-8e1b-f2735c968233" as="span" variant="bodySmall" tone="inherit">{step}</Typography>
      </div>)}
    </footer>
    <Typography shuku-edit-id="e-81444f20-bef8-48fe-9d94-4a072404e5ef" as="span" variant="bodySmall" tone="inherit" className="cg-cover-number" aria-label="第 1 页">01</Typography>
  </article>;
}
