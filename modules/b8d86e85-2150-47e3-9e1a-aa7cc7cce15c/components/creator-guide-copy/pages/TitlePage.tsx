import { Typography } from "@shuku/course-style/react";
import './TitlePage.css';

/** Fine contour lines form a continuous ribbon: loose ideas gathering into structure. */
function KnowledgeRibbon() {
  return <svg shuku-edit-id="e-93a30b40-4f8e-48cd-9b65-6cb44c9ccf4f" className="aipe-replay-cg-cover-ribbon" viewBox="0 0 800 820" fill="none" aria-hidden="true">
    <defs shuku-edit-id="e-748df303-e3d9-44ac-a668-9d0d4216d3dc">
      <linearGradient shuku-edit-id="e-51411abd-3efa-4fa7-bf0e-722047414d7f" id="aipe-replay-cg-cover-ink" x1="0" y1="400" x2="770" y2="400" gradientUnits="userSpaceOnUse">
        <stop shuku-edit-id="e-7e307267-9a2b-419c-b9bb-8fd1b4d98293" stopColor="#237cff" stopOpacity="0"/><stop shuku-edit-id="e-6367bed9-9f3d-4416-9a1c-46fb2d5d1081" offset=".32" stopColor="#237cff" stopOpacity=".2"/><stop shuku-edit-id="e-bfdf1a11-09d0-47e9-878c-cca94f56890d" offset=".7" stopColor="#1670ed" stopOpacity=".76"/><stop shuku-edit-id="e-5b8325b9-c8a7-481f-bd16-ffebf2ebb616" offset="1" stopColor="#4c9aff" stopOpacity=".3"/>
      </linearGradient>
    </defs>
    {Array.from({ length: 100 }, (_, i) => {
      const t = i / 99;
      const d = `M ${12 + 60 * t} ${50 + 690 * t} C ${310 - 45 * t} ${90 + 640 * t}, ${400 + 55 * t} ${560 - 420 * t}, ${606 + 62 * t} ${334 - 244 * t} C ${846 - 112 * t} ${55 - 20 * t}, ${781 - 145 * t} ${575 - 390 * t}, ${571 + 56 * t} ${496 - 85 * t} C ${374 + 180 * t} ${416 + 70 * t}, ${465 + 22 * t} ${738 + 36 * t}, ${654 + 62 * t} ${759 - 90 * t} C ${787 - 45 * t} ${770 - 30 * t}, ${765 - 66 * t} ${622 - 54 * t}, ${545 + 30 * t} ${565 - 70 * t}`;
      return <path shuku-edit-id="e-38f8f05b-4111-44bc-8e9c-aae69f523301" key={i} d={d} stroke="url(#aipe-replay-cg-cover-ink)" strokeWidth={i % 5 === 0 ? 1.05 : .65}/>;
    })}
    <path shuku-edit-id="e-5c52449a-f350-4c05-80dc-dd16276645b1" d="M 92 603 C 330 585, 487 451, 604 306 C 660 237, 690 190, 712 177" stroke="#ed9a38" strokeWidth="1.6" opacity=".8"/>
  </svg>;
}

export function TitlePage() {
  return <article shuku-edit-id="e-9505e443-f457-4647-b1c9-fd1b08fc055f" className="aipe-replay-cg-cover-page aipe-replay-cg-creator-typography" aria-labelledby="aipe-replay-cg-cover-title">
    <KnowledgeRibbon/>
    <div shuku-edit-id="e-b8da6132-bb8b-4013-85a0-12de2bb2c89e" className="aipe-replay-cg-cover-eyebrow"><Typography shuku-edit-id="e-48d5e1c5-e664-4476-b3fe-31907ab73425" variant="bodySmall" tone="inherit">CREATOR SKILL</Typography></div>
    <div shuku-edit-id="e-1a7ab112-5715-4bf8-8af2-88c9a82103ef" className="aipe-replay-cg-cover-title"><Typography shuku-edit-id="e-a24063b0-7c5d-484d-b8b0-ada8f56d6768" as="h1" variant="display" tone="inherit" wrap="nowrap" id="aipe-replay-cg-cover-title">实践创作指南</Typography></div>
    <div shuku-edit-id="e-bd270817-c69d-473b-a617-bcadd0f49770" className="aipe-replay-cg-cover-subtitle"><Typography shuku-edit-id="e-099f7d6b-9edc-4dfe-a29f-b2d1787fc003" as="p" variant="h2" tone="inherit" wrap="nowrap">把专业知识，变成容易理解的知识呈现作品</Typography></div>
    <div shuku-edit-id="e-dc744fbc-575a-482a-aa1d-66fe8ce7f3fb" className="aipe-replay-cg-cover-description"><Typography shuku-edit-id="e-6ee44605-c243-421e-90a0-af6d1174a2cb" variant="subtitle" tone="inherit" wrap="nowrap">借助 Creator Skill，从内容构思到交互呈现</Typography></div>
    <footer shuku-edit-id="e-3bee0da3-9325-4887-b1d8-4687e851224a" className="aipe-replay-cg-cover-footer">
      {['明确目标', '设计讲解', '迭代成稿'].map((step, i) => <div shuku-edit-id="e-2586ca58-0083-4e83-be99-020e48cea577" className="aipe-replay-cg-cover-step" key={step}>
        {i > 0 && <Typography shuku-edit-id="e-54aedebf-ebc6-468a-b7e2-4714124be957" as="span" variant="body" tone="inherit" className="aipe-replay-cg-cover-arrow" aria-hidden="true">→</Typography>}
        <Typography shuku-edit-id="e-bcaf08c5-c90a-4efb-8f27-d0842bda3145" as="span" variant="bodySmall" tone="inherit">{step}</Typography>
      </div>)}
    </footer>
    <Typography shuku-edit-id="e-16f5cc61-184d-482f-b0f6-feb981f7f9ab" as="span" variant="bodySmall" tone="inherit" className="aipe-replay-cg-cover-number" aria-label="第 1 页">01</Typography>
  </article>;
}
