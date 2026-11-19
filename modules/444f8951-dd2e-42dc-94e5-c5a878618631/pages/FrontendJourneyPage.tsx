import creator_equal_ascent_clean_backgroundAsset0 from "../assets/images/creator-equal-ascent-clean-background.webp";
import { Typography } from "@shuku/course-style/react";
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
  return <article shuku-edit-id="e-708b5810-2d2f-46f6-bc4e-8a6fadd98668" className="cg-journey-page cg-creator-typography" aria-labelledby="cg-journey-title">
    <img shuku-edit-id="e-6948a55f-5db2-431a-a792-62379bb97f72" className="cg-journey-full-art" src={creator_equal_ascent_clean_backgroundAsset0} alt="学生专注专业理解与内容设计，平台提供工程基础，支持网页制作与工程实现。" />
    <header shuku-edit-id="e-9ce76d83-26ac-4e0f-b7f5-0a789d08082c" className="cg-journey-photo-heading"><Typography shuku-edit-id="e-7aa736ca-b97a-4860-b6d9-4443790f0f68" as="h1" id="cg-journey-title" variant="h1" tone="inherit" align="center">围绕培养目标，提供工程支持</Typography></header>
    <section shuku-edit-id="e-568ac707-cd2f-494e-afc0-95a19cd433c4" className="cg-journey-flag cg-journey-flag-ai" aria-label="本次培养重点是专业理解、实践与判断"><Typography shuku-edit-id="e-9ea52cd4-8d12-49b3-a07a-004e3591d6bf" as="h2" variant="body" tone="inherit">本次培养重点</Typography><Typography shuku-edit-id="e-57d4c8fe-8a4d-4a49-8f7b-635a802f9d4b" variant="body" tone="inherit">专业理解<br shuku-edit-id="e-8e2c4847-2e71-40aa-a886-43094bd723bc" />实践与判断</Typography></section>
    <section shuku-edit-id="e-59cebb1d-4e19-4e69-a869-c0992d641d33" className="cg-journey-flag cg-journey-flag-web" aria-label="平台提供工程基础，支持网页制作"><Typography shuku-edit-id="e-0db655ca-e83e-4763-8a8e-b993398179d8" as="h2" variant="body" tone="inherit">平台的支持</Typography><Typography shuku-edit-id="e-ff9a944e-c1a6-4dfa-8270-b614a122d45a" variant="body" tone="inherit">提供工程基础<br shuku-edit-id="e-53b8e932-b337-4fbe-8d29-a3f5ac8718db" />支持网页制作</Typography></section>
    <div shuku-edit-id="e-688ffea8-df3d-467e-a55a-afc86bbd28ef" className="cg-journey-summit-label"><Typography shuku-edit-id="e-1a55e1d5-af62-4c6b-8638-261e4a15b0ba" variant="bodySmall" tone="inherit">交互式知识呈现</Typography></div>
    <div shuku-edit-id="e-36cdb31a-6245-425b-826c-354131dd1dac" className="cg-journey-stairs" aria-label="学生承担理解与判断，平台支持网页布局、交互实现和工程调试">{stairLabels.map(stair => <div shuku-edit-id="e-70f4f1a4-23f7-4878-afb3-539ce7ea2f90" key={stair.text} className="cg-journey-stair" style={{ left: stair.x - 205, top: stair.y - 30 }}><Typography shuku-edit-id="e-e1f7ac96-188e-47c3-b600-be55e5fc7616" variant="h3" tone="inherit" wrap="nowrap" style={{ transform: `scale(${stair.scale})` }}>{stair.text}</Typography></div>)}</div>
    <footer shuku-edit-id="e-acba56a0-e163-4cb2-afdb-a618d69e107c" className="cg-journey-photo-footer"><Typography shuku-edit-id="e-f2250520-9ec9-4558-9967-32126dcde684" variant="h3" tone="inherit">平台提供工程基础，让学生把专业理解落实成作品。</Typography></footer>
  </article>;
}
