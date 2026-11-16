import { Typography } from "@shuku/course-style/react";
import './TitlePage.css';

/** Fine contour lines form a continuous ribbon: loose ideas gathering into structure. */
function KnowledgeRibbon() {
  return <svg shuku-edit-id="e-59f472d4-e1c7-4361-b238-482101e34425" className="aipe-replay-cg-cover-ribbon" viewBox="0 0 800 820" fill="none" aria-hidden="true">
    <defs shuku-edit-id="e-8d7216be-cb2f-4407-ab32-dab66150a73d">
      <linearGradient shuku-edit-id="e-5dcc4c66-f7f2-44e0-ac23-417604eff1aa" id="aipe-replay-cg-cover-ink" x1="0" y1="400" x2="770" y2="400" gradientUnits="userSpaceOnUse">
        <stop shuku-edit-id="e-9f231462-c3af-4ad7-9d63-55fe9bd74e4d" stopColor="#237cff" stopOpacity="0"/><stop shuku-edit-id="e-a8c6a7b7-f4cb-484b-ac90-cc2b27bfb122" offset=".32" stopColor="#237cff" stopOpacity=".2"/><stop shuku-edit-id="e-bb69c035-c115-4c1d-b5d4-306e2d55b37d" offset=".7" stopColor="#1670ed" stopOpacity=".76"/><stop shuku-edit-id="e-e1290470-36f9-43d0-8c35-3cede640d7de" offset="1" stopColor="#4c9aff" stopOpacity=".3"/>
      </linearGradient>
    </defs>
    {Array.from({ length: 100 }, (_, i) => {
      const t = i / 99;
      const d = `M ${12 + 60 * t} ${50 + 690 * t} C ${310 - 45 * t} ${90 + 640 * t}, ${400 + 55 * t} ${560 - 420 * t}, ${606 + 62 * t} ${334 - 244 * t} C ${846 - 112 * t} ${55 - 20 * t}, ${781 - 145 * t} ${575 - 390 * t}, ${571 + 56 * t} ${496 - 85 * t} C ${374 + 180 * t} ${416 + 70 * t}, ${465 + 22 * t} ${738 + 36 * t}, ${654 + 62 * t} ${759 - 90 * t} C ${787 - 45 * t} ${770 - 30 * t}, ${765 - 66 * t} ${622 - 54 * t}, ${545 + 30 * t} ${565 - 70 * t}`;
      return <path shuku-edit-id="e-50b1ccd6-c72c-499f-afe1-6deecbb5eeab" key={i} d={d} stroke="url(#aipe-replay-cg-cover-ink)" strokeWidth={i % 5 === 0 ? 1.05 : .65}/>;
    })}
    <path shuku-edit-id="e-91636168-43c9-4b82-ae87-cb2b314839a2" d="M 92 603 C 330 585, 487 451, 604 306 C 660 237, 690 190, 712 177" stroke="#ed9a38" strokeWidth="1.6" opacity=".8"/>
  </svg>;
}

export function TitlePage() {
  return <article shuku-edit-id="e-de37f3be-7e73-45d0-82c7-87c19c4328b7" className="aipe-replay-cg-cover-page aipe-replay-cg-creator-typography" aria-labelledby="aipe-replay-cg-cover-title">
    <KnowledgeRibbon/>
    <div shuku-edit-id="e-b83c7767-79a9-4e7e-bebc-96086705ae0b" className="aipe-replay-cg-cover-eyebrow"><Typography shuku-edit-id="e-b6f8696b-fc9c-4d63-a48a-b44ef14023fb" variant="bodySmall" tone="inherit">CREATOR SKILL</Typography></div>
    <div shuku-edit-id="e-3f3ade28-e12f-4181-85dc-e8cfc1fc1537" className="aipe-replay-cg-cover-title"><Typography shuku-edit-id="e-72c5d390-4cbe-4261-85c8-58eb4c112711" as="h1" variant="display" tone="inherit" wrap="nowrap" id="aipe-replay-cg-cover-title">实践创作指南</Typography></div>
    <div shuku-edit-id="e-1fe6ca4a-6986-4ed2-9872-6ad262e21b36" className="aipe-replay-cg-cover-subtitle"><Typography shuku-edit-id="e-24f20e95-3866-4289-94aa-4bb37918b39d" as="p" variant="h2" tone="inherit" wrap="nowrap">把专业知识，变成容易理解的知识呈现作品</Typography></div>
    <div shuku-edit-id="e-b2313fbc-81aa-4926-93da-3bc56036cabd" className="aipe-replay-cg-cover-description"><Typography shuku-edit-id="e-1f459954-8861-4016-8326-61a48fa628d5" variant="subtitle" tone="inherit" wrap="nowrap">借助 Creator Skill，从内容构思到交互呈现</Typography></div>
    <footer shuku-edit-id="e-8a001839-1e58-47eb-b95e-a33ce7c68c00" className="aipe-replay-cg-cover-footer">
      {['明确目标', '设计讲解', '迭代成稿'].map((step, i) => <div shuku-edit-id="e-cf9e8771-287b-403c-9fb5-f969c2a9773f" className="aipe-replay-cg-cover-step" key={step}>
        {i > 0 && <Typography shuku-edit-id="e-a310e17a-4072-454b-8a1a-67dbec6f2826" as="span" variant="body" tone="inherit" className="aipe-replay-cg-cover-arrow" aria-hidden="true">→</Typography>}
        <Typography shuku-edit-id="e-68c69899-5d07-481d-9a7a-ada997847098" as="span" variant="bodySmall" tone="inherit">{step}</Typography>
      </div>)}
    </footer>
    <Typography shuku-edit-id="e-a078dd1c-7dcd-46ea-a06e-cec4d9662b68" as="span" variant="bodySmall" tone="inherit" className="aipe-replay-cg-cover-number" aria-label="第 1 页">01</Typography>
  </article>;
}
