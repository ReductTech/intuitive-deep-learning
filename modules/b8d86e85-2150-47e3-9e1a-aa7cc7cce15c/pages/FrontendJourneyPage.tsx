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
  return <article shuku-edit-id="e-ccc936b4-85d1-4ba1-be5e-44890255cab2" className="cg-journey-page cg-creator-typography" aria-labelledby="cg-journey-title">
    <img shuku-edit-id="e-01b82ddb-08c9-442a-9081-4f8966bdfb95" className="cg-journey-full-art" src={moduleAssetUrl('images/creator-equal-ascent-clean-background.jpg')} alt="通往交互式知识呈现的冰阶上，叠加着 AI 专业知识与前端工程能力两类门槛。" />
    <header shuku-edit-id="e-aa7360b8-343b-4cc5-b0e3-9c95717f575d" className="cg-journey-photo-heading"><Typography shuku-edit-id="e-84686714-210a-4165-b7b2-64c7f30278b4" as="h1" id="cg-journey-title" variant="h1" tone="inherit">从想法到交互式知识呈现，还隔着一道技术门槛</Typography><Typography shuku-edit-id="e-205cc7b9-4ef3-465a-a0bc-bf6ec8d5d1b0" variant="body" tone="inherit">既要懂 AI，也要懂前端，实现起来并不容易。</Typography></header>
    <section shuku-edit-id="e-836fd7c2-5c4a-488e-b214-a08352349ead" className="cg-journey-flag cg-journey-flag-ai" aria-label="AI专业创作者"><Typography shuku-edit-id="e-8ac8e7fd-6caa-49cb-8178-4a1d1638acc3" as="h2" variant="body" tone="inherit">AI 专业创作者</Typography><Typography shuku-edit-id="e-807636f8-dc8d-41bf-9dfb-0c6679c4d547" variant="body" tone="inherit">更懂 AI<br shuku-edit-id="e-c8ce882f-7cdb-45eb-8c5d-9a31340a593b" />不太懂前端</Typography></section>
    <section shuku-edit-id="e-3feb81d3-6674-4beb-b145-6ac54179e8a5" className="cg-journey-flag cg-journey-flag-web" aria-label="前端工程师"><Typography shuku-edit-id="e-df3538ed-9df0-429e-99e5-7a9e99538ef6" as="h2" variant="body" tone="inherit">前端工程师</Typography><Typography shuku-edit-id="e-68cea0dd-5e54-421c-8760-6b139f82cf4f" variant="body" tone="inherit">更懂前端<br shuku-edit-id="e-4aa50e17-44f3-4ff3-aa90-83d25de81254" />不太懂 AI</Typography></section>
    <div shuku-edit-id="e-690cbf6b-81d4-4f47-b69b-aa50547a566e" className="cg-journey-summit-label"><Typography shuku-edit-id="e-498be7e4-da70-4408-a023-de5972911a3f" variant="bodySmall" tone="inherit">交互式知识呈现</Typography></div>
    <div shuku-edit-id="e-c37e5922-889d-46dc-8e2f-00cbe98e7a72" className="cg-journey-stairs" aria-label="制作交互式知识呈现需要跨越的专业与工程门槛">{stairLabels.map(stair => <div shuku-edit-id="e-1e6680a6-a8af-4656-8551-7ef61756aa79" key={stair.text} className="cg-journey-stair" style={{ left: stair.x - 205, top: stair.y - 30 }}><Typography shuku-edit-id="e-0960c10f-64d6-416d-9446-2b2896e46461" variant="h3" tone="inherit" wrap="nowrap" style={{ transform: `scale(${stair.scale})` }}>{stair.text}</Typography></div>)}</div>
    <footer shuku-edit-id="e-f467e94e-5649-42e4-858a-fb3e0c35696c" className="cg-journey-photo-footer"><Typography shuku-edit-id="e-44b04e0d-d5f4-44ee-a932-ba6c28430b93" variant="h3" tone="inherit">为降低这道门槛，我们开发了 Creator Skill。</Typography></footer>
  </article>;
}
