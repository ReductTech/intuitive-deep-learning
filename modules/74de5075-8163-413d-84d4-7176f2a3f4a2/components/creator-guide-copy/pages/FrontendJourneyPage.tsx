import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { creatorGuideAssetUrl } from '../creatorGuideAssets';
import { Typography } from "@shuku/course-style/react";
import outline from '../outlines.json';
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
  return <article shuku-edit-id="e-13bfccf4-c0e0-498f-8194-4daadba0d371" className="aipe-replay-cg-journey-page aipe-replay-cg-creator-typography" aria-labelledby="aipe-replay-cg-journey-title">
    <img shuku-edit-id="e-ad412550-b661-4187-b388-9067d3028630" className="aipe-replay-cg-journey-full-art" src={creatorGuideAssetUrl(outline.moduleIdentity.id, "images/creator-equal-ascent-clean-background.webp")} alt="学生专注专业理解与内容设计，平台提供工程基础，支持网页制作与工程实现。" />
    <header shuku-edit-id="e-16b371df-c591-48a5-a07e-7af1355bcdd2" className="aipe-replay-cg-journey-photo-heading"><Typography shuku-edit-id="e-15486c3c-cf85-4265-abea-bcb6b6980360" as="h1" id="aipe-replay-cg-journey-title" variant="h1" tone="inherit" align="center">围绕培养目标，提供工程支持</Typography></header>
    <section shuku-edit-id="e-487e7ba3-01ad-4e7e-9fb3-b484f56c3d0a" className="aipe-replay-cg-journey-flag aipe-replay-cg-journey-flag-ai" aria-label="本次培养重点是专业理解、实践与判断"><Typography shuku-edit-id="e-8b82bbbf-e946-4482-898e-649ce5bce76d" as="h2" variant="body" tone="inherit">本次培养重点</Typography><Typography shuku-edit-id="e-419a4639-13a7-4fef-a4b5-402048957947" variant="body" tone="inherit">专业理解<br shuku-edit-id="e-af6fb8c2-1ce4-4129-b4c2-b29c0fabc23e" />实践与判断</Typography></section>
    <section shuku-edit-id="e-b207a4b5-a06d-429f-b2db-3bcfdf2150b0" className="aipe-replay-cg-journey-flag aipe-replay-cg-journey-flag-web" aria-label="平台提供工程基础，支持网页制作"><Typography shuku-edit-id="e-d75cb434-e54a-4828-bdca-d73eceb84498" as="h2" variant="body" tone="inherit">平台的支持</Typography><Typography shuku-edit-id="e-8f11d003-e2fa-45a7-999a-952b33f4de11" variant="body" tone="inherit">提供工程基础<br shuku-edit-id="e-b5f4a2e1-94f1-414c-9559-022db17257e2" />支持网页制作</Typography></section>
    <div shuku-edit-id="e-5ac08de6-d15d-4a97-b724-5a90ed6286ae" className="aipe-replay-cg-journey-summit-label"><Typography shuku-edit-id="e-aff8df48-6518-43a8-8851-efc588ac1c06" variant="bodySmall" tone="inherit">交互式知识呈现</Typography></div>
    <div shuku-edit-id="e-341f1703-b8bf-4962-a4ad-a634e2a30c84" className="aipe-replay-cg-journey-stairs" aria-label="学生承担理解与判断，平台支持网页布局、交互实现和工程调试">{stairLabels.map(stair => <div shuku-edit-id="e-729cc4e9-d027-4906-a365-1d3444243e99" key={stair.text} className="aipe-replay-cg-journey-stair" style={{ left: stair.x - 205, top: stair.y - 30 }}><Typography shuku-edit-id="e-9b9c9efb-2a8f-402a-bc5e-86bbea0ae1cd" variant="h3" tone="inherit" wrap="nowrap" style={{ transform: `scale(${stair.scale})` }}>{stair.text}</Typography></div>)}</div>
    <footer shuku-edit-id="e-1ce1a52e-2639-41bb-81ef-39497abe23fa" className="aipe-replay-cg-journey-photo-footer"><Typography shuku-edit-id="e-dd888f83-e840-4b12-853b-0060e08aef6a" variant="h3" tone="inherit">平台提供工程基础，让学生把专业理解落实成作品。</Typography></footer>
  </article>;
}
