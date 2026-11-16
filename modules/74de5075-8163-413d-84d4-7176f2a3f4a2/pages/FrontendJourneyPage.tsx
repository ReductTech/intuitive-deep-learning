import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { Typography } from "@shuku/course-style/react";
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
  return <article shuku-edit-id="e-6c9f34f4-0f5d-4370-97e9-819ab6b2b8fd" className="cg-journey-page cg-creator-typography" aria-labelledby="cg-journey-title">
    <img shuku-edit-id="e-03dcb928-ee92-45c8-9857-77a382bfe071" className="cg-journey-full-art" src={moduleAssetUrl('images/creator-equal-ascent-clean-background.jpg')} alt="通往交互式知识呈现的冰阶上，叠加着 AI 专业知识与前端工程能力两类门槛。" />
    <header shuku-edit-id="e-6eb41b06-71ca-4e39-b1bf-11a649ecb706" className="cg-journey-photo-heading"><Typography shuku-edit-id="e-25f04e1d-a032-4bdd-99ff-96b07dec6267" as="h1" id="cg-journey-title" variant="h1" tone="inherit">从想法到交互式知识呈现，还隔着一道技术门槛</Typography><Typography shuku-edit-id="e-a5a2eb56-7ea2-4176-ba54-67044d1b21df" variant="body" tone="inherit">既要懂 AI，也要懂前端，实现起来并不容易。</Typography></header>
    <section shuku-edit-id="e-aaa97b88-58ba-4527-af35-df47d380b4fc" className="cg-journey-flag cg-journey-flag-ai" aria-label="AI专业创作者"><Typography shuku-edit-id="e-5cafe714-423e-4d95-974f-4fa6101cdde9" as="h2" variant="body" tone="inherit">AI 专业创作者</Typography><Typography shuku-edit-id="e-447efb0f-9f3e-46a8-98cd-d3d78a05f496" variant="body" tone="inherit">更懂 AI<br shuku-edit-id="e-dfee60a6-23a4-433e-bd75-71cd9ede2266" />不太懂前端</Typography></section>
    <section shuku-edit-id="e-d0af0068-37c4-46cc-8400-217a4c548414" className="cg-journey-flag cg-journey-flag-web" aria-label="前端工程师"><Typography shuku-edit-id="e-3205c60f-9212-459c-8861-cb5fc57e42e7" as="h2" variant="body" tone="inherit">前端工程师</Typography><Typography shuku-edit-id="e-776faa30-b56e-4352-bcd8-3d148cef0863" variant="body" tone="inherit">更懂前端<br shuku-edit-id="e-ac9dbc2e-8931-48be-a9b0-469cbea60c1a" />不太懂 AI</Typography></section>
    <div shuku-edit-id="e-5bc67e95-73f1-46fb-80d1-ec6e31bd1f27" className="cg-journey-summit-label"><Typography shuku-edit-id="e-685cda84-7798-4610-b5d7-da0349b5fdc4" variant="bodySmall" tone="inherit">交互式知识呈现</Typography></div>
    <div shuku-edit-id="e-afb9b9de-eb81-4285-b3fa-1458f14a4fb8" className="cg-journey-stairs" aria-label="制作交互式知识呈现需要跨越的专业与工程门槛">{stairLabels.map(stair => <div shuku-edit-id="e-abc1558e-0df0-44da-8883-c7538d166e98" key={stair.text} className="cg-journey-stair" style={{ left: stair.x - 205, top: stair.y - 30 }}><Typography shuku-edit-id="e-fd04e3cb-85f5-4b14-b5f0-4241bf2a4831" variant="h3" tone="inherit" wrap="nowrap" style={{ transform: `scale(${stair.scale})` }}>{stair.text}</Typography></div>)}</div>
    <footer shuku-edit-id="e-70d14a18-03d6-4cda-9a45-ec7bd43eba3d" className="cg-journey-photo-footer"><Typography shuku-edit-id="e-b6440e58-6f33-4d4d-88da-309fdd155a1b" variant="h3" tone="inherit">为降低这道门槛，我们开发了 Creator Skill。</Typography></footer>
  </article>;
}
