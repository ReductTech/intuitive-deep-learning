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
  return <article shuku-edit-id="e-69440907-fc29-4dd3-b2a9-70c8af45eea1" className="aipe-replay-cg-journey-page aipe-replay-cg-creator-typography" aria-labelledby="aipe-replay-cg-journey-title">
    <img shuku-edit-id="e-f684160d-4bd3-4372-93d8-48230001e3cb" className="aipe-replay-cg-journey-full-art" src={creatorGuideAssetUrl(outline.moduleIdentity.id, 'images/creator-equal-ascent-clean-background.jpg')} alt="学生专注专业理解与内容设计，平台提供工程基础，支持网页制作与工程实现。" />
    <header shuku-edit-id="e-d1027b48-f385-4430-b310-be9e7ae9cb54" className="aipe-replay-cg-journey-photo-heading"><Typography shuku-edit-id="e-8c1783a2-d03b-4e74-8d1b-a1eea3470eab" as="h1" id="aipe-replay-cg-journey-title" variant="h1" tone="inherit" align="center">围绕培养目标，提供工程支持</Typography></header>
    <section shuku-edit-id="e-3b1b592c-e678-45a0-91cd-bb53f9a0f791" className="aipe-replay-cg-journey-flag aipe-replay-cg-journey-flag-ai" aria-label="本次培养重点是专业理解、实践与判断"><Typography shuku-edit-id="e-71e0c5c2-b574-40b7-84aa-75740f968f24" as="h2" variant="body" tone="inherit">本次培养重点</Typography><Typography shuku-edit-id="e-9fb33d01-d108-4a22-a1cc-4b969ea8343d" variant="body" tone="inherit">专业理解<br shuku-edit-id="e-91bb2e14-55fa-4ec8-b2b0-baca05a76027" />实践与判断</Typography></section>
    <section shuku-edit-id="e-983e15e5-6a2b-45c7-ad5a-b1648efcd828" className="aipe-replay-cg-journey-flag aipe-replay-cg-journey-flag-web" aria-label="平台提供工程基础，支持网页制作"><Typography shuku-edit-id="e-c2e3249b-82d1-478c-820a-4aeafcf10760" as="h2" variant="body" tone="inherit">平台的支持</Typography><Typography shuku-edit-id="e-54a6debb-b349-450a-9e2c-767d61d6d162" variant="body" tone="inherit">提供工程基础<br shuku-edit-id="e-087ff610-903e-4a9c-8e3d-0fae347a4c30" />支持网页制作</Typography></section>
    <div shuku-edit-id="e-3a320585-f489-431f-942d-3505e657f4de" className="aipe-replay-cg-journey-summit-label"><Typography shuku-edit-id="e-f2480e97-3ad5-4f37-8d68-5c596ba69634" variant="bodySmall" tone="inherit">交互式知识呈现</Typography></div>
    <div shuku-edit-id="e-beb16785-c7f9-454e-8bab-6501377e81e0" className="aipe-replay-cg-journey-stairs" aria-label="学生承担理解与判断，平台支持网页布局、交互实现和工程调试">{stairLabels.map(stair => <div shuku-edit-id="e-09de27c6-4f28-4bcf-8b50-d8187e5ee329" key={stair.text} className="aipe-replay-cg-journey-stair" style={{ left: stair.x - 205, top: stair.y - 30 }}><Typography shuku-edit-id="e-9f815bc4-934e-44c4-a649-6c44bf007481" variant="h3" tone="inherit" wrap="nowrap" style={{ transform: `scale(${stair.scale})` }}>{stair.text}</Typography></div>)}</div>
    <footer shuku-edit-id="e-b76d99e8-9c12-4010-9b72-e1b529b56dcb" className="aipe-replay-cg-journey-photo-footer"><Typography shuku-edit-id="e-d4ed5da2-e4e9-464f-b54e-a1938aa6d133" variant="h3" tone="inherit">平台提供工程基础，让学生把专业理解落实成作品。</Typography></footer>
  </article>;
}
