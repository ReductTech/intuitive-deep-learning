import { Atom, Code2, Pencil, Zap, ArrowRight, FileCode2, Braces } from 'lucide-react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import './ProjectFrameworkPage.css';

function LessonPreview({ index, source = false }: { index: number; source?: boolean }) {
  return <div shuku-edit-id="e-dd9585a7-bd3d-4144-b84b-0f64a7607810" className={`acw-framework-lesson${source ? ' acw-framework-lesson-source' : ''}`}>
    {source && <div shuku-edit-id="e-fea8e961-5157-4e58-adfc-e3b484c33a55" className="acw-framework-pencil" aria-hidden="true"><Pencil /></div>}
    <Typography shuku-edit-id="e-6c7784c1-a4e6-42d8-8dd6-9433fcb421e3" variant="body">课件 {index}</Typography>
    <div shuku-edit-id="e-45abd312-488c-45dd-85a4-1f9b323e9a7f" className="acw-framework-lines" aria-hidden="true"><i shuku-edit-id="e-c55ca515-1524-4b23-b2cb-8f7ce99e2baa" /><i shuku-edit-id="e-7a04b642-864a-42ab-a250-748bcaed2832" /><i shuku-edit-id="e-7a27f66a-7c18-42db-b5c5-19f359a7cd09" /></div>
    <Typography shuku-edit-id="e-7b5eec32-87a5-414a-8832-c582bda50f08" as="div" variant="bodySmall" align="center" className="acw-framework-demo-button">下一步</Typography>
    {source && <Typography shuku-edit-id="e-2b3ec6a9-6a2e-47cf-a284-540a35dfb8cd" as="code" variant="bodySmall" className="acw-framework-html">{'<button>'}</Typography>}
  </div>;
}

function SourceFile({ compact = false }: { compact?: boolean }) {
  return <div shuku-edit-id="e-a8782ed5-e90c-4247-a352-898f42a52fb5" className={`acw-framework-file${compact ? ' acw-framework-file-compact' : ''}`}>
    <Typography shuku-edit-id="e-d50f63ba-8120-497c-a5df-79fe6ad0cc92" variant="bodySmall" className="acw-framework-file-tab">{compact ? 'TSX' : 'NextButton.tsx'}</Typography>
    <Typography shuku-edit-id="e-573c48a1-9919-49bb-863f-cfa1224407bf" as="code" variant="bodySmall" tone="accent">{compact ? '<Page />' : '<button>…</button>'}</Typography>
    <div shuku-edit-id="e-2c1412af-7583-422a-b3ba-f844cec216c6" className="acw-framework-lines" aria-hidden="true"><i shuku-edit-id="e-1ca7af11-3fbc-4cf9-bc03-d6f0b7764eb0" /><i shuku-edit-id="e-b6f57cf3-e6cd-4334-9fbf-b720943fb57d" /><i shuku-edit-id="e-f9746c21-c48d-4857-9e00-58aaf6c7fb6c" /></div>
  </div>;
}

function BrowserPreview() {
  return <div shuku-edit-id="e-3f9284ea-63d5-44ee-9c9c-fc8e0e44e769" className="acw-framework-browser" aria-hidden="true">
    <div shuku-edit-id="e-f33e964a-d9c7-47c8-b1b9-ac72d8018e21" className="acw-framework-browser-bar"><i shuku-edit-id="e-3464bf05-aa46-4b7b-84f9-a29028cd1713" /><i shuku-edit-id="e-0837c3b8-2472-4ff6-b7e7-80bab318a615" /><i shuku-edit-id="e-3a17119c-188c-4627-8157-4ec3760e6307" /></div>
    <div shuku-edit-id="e-9583637f-8a26-4694-9597-ab3fe099c58f" className="acw-framework-browser-content"><div shuku-edit-id="e-cb220b40-b3eb-404c-b38b-160934ddf6fa" className="acw-framework-video">▶</div><div shuku-edit-id="e-01cc6e12-42f0-43de-8e02-898a42eff4eb" className="acw-framework-lines"><i shuku-edit-id="e-8487c4a3-01cb-4a1f-8f39-92a58321fae2" /><i shuku-edit-id="e-d8b6267e-76fd-4ee9-a058-a414e1b2962f" /><i shuku-edit-id="e-1c59892c-2004-44c7-99d7-bafecd1ee105" /></div></div>
    <Typography shuku-edit-id="e-a4e9e307-5f15-4b71-8dc2-63bfd6442f43" as="div" variant="bodySmall" align="center" className="acw-framework-demo-button">下一步</Typography>
  </div>;
}

export function ProjectFrameworkPage() {
  const page = outline.pages.find(item => item.id === 'a001b726-fc23-4cdb-8c36-925a86656ab2')!;
  return <ContentBlock shuku-edit-id="e-50f69ec6-798b-4b8c-9a43-b9009b1c30da" className="acw-framework-page" data-scene-id={page.id} title={page.title}
    subtitle="以组件复用组织内容，以状态驱动交互，打通 TSX 到浏览器的呈现流程"
    bodyClassName="acw-framework-body">
    <div shuku-edit-id="e-045eb032-9753-485c-877b-73cce5a7638a" className="acw-framework-comparison">
      <section shuku-edit-id="e-b7918ca0-7825-4a78-80c7-bc10fda8be7a" className="acw-framework-panel acw-framework-manual">
        <div shuku-edit-id="e-8bfabee7-15e9-4d93-9945-f1f66b0daa09" className="acw-framework-panel-heading"><div shuku-edit-id="e-6893c298-242f-40db-9075-1ce6d4f356a9" className="acw-framework-icon" aria-hidden="true"><Code2 /></div><div shuku-edit-id="e-5f88df6c-ac11-41a2-9859-cee71568fcd0"><Typography shuku-edit-id="e-30b6b556-33d2-44aa-937a-bb95725f318f" variant="h3">直接写 HTML + JavaScript</Typography><Typography shuku-edit-id="e-19855739-50da-4094-b288-4ff4fd9665fa" variant="body" tone="muted">能做交互，复杂后需要自己维护</Typography></div></div>
        <div shuku-edit-id="e-ed07d30a-7d75-43c2-a529-5cf92e70dfb1" className="acw-framework-manual-lessons">{[1,2,3].map(index => <LessonPreview key={index} index={index} source />)}</div>
        <Typography shuku-edit-id="e-4d07b8b7-adef-41f4-a586-3d501929f896" variant="body" align="center" className="acw-framework-caption">重复界面要组织，状态与画面要同步</Typography>
      </section>
      <ArrowRight className="acw-framework-compare-arrow" aria-hidden="true" />
      <section shuku-edit-id="e-767fa807-73e8-4151-b1f2-7661aba0d4cc" className="acw-framework-panel acw-framework-react">
        <div shuku-edit-id="e-5f9980c1-ff1f-415d-b9fa-ae03fb219d61" className="acw-framework-panel-heading"><div shuku-edit-id="e-a0dae8dd-f0f1-4bed-8a30-48ffcce56c14" className="acw-framework-icon" aria-hidden="true"><Atom /></div><div shuku-edit-id="e-afb708e6-939f-48cb-acca-54b1ac2e19e1"><Typography shuku-edit-id="e-867f1aa0-4573-445e-95ad-d6de9ba1070b" variant="h3">用 React 组织组件</Typography><Typography shuku-edit-id="e-fbe0ddbb-9902-40d4-86d8-991fbe2d4cdb" variant="body" tone="muted">写一次组件，多处组合使用</Typography></div></div>
        <div shuku-edit-id="e-92aba1c1-8a68-4fc2-b820-602ad6a6445a" className="acw-framework-reuse">
          <SourceFile />
          <div shuku-edit-id="e-dd34d135-eacc-408c-b500-496813f35ef7" className="acw-framework-reuse-targets"><div shuku-edit-id="e-ba055742-469e-46cc-ad91-a16a3eb96d2c" className="acw-framework-branches" aria-hidden="true"><i shuku-edit-id="e-ade692be-15e2-4ee6-b968-af734b8b4323" /><i shuku-edit-id="e-c6384392-9a3f-4a67-85db-75b8ed7ca46b" /><i shuku-edit-id="e-6c515edb-97d6-4e2c-81ef-77a44d461ad0" /></div><div shuku-edit-id="e-cfbf3f04-c45d-41d7-9930-090e390aa722" className="acw-framework-reused-lessons">{[1,2,3].map(index => <div shuku-edit-id="e-d4994a1f-dda8-45ca-a201-0b500acae127" className="acw-framework-reuse-instance" key={index}><LessonPreview index={index} /></div>)}</div></div>
        </div>
        <Typography shuku-edit-id="e-6a7d31ea-0778-4532-a687-ec17ed3f7bd2" variant="body" align="center" className="acw-framework-caption">描述当前状态下，界面应该是什么样</Typography>
      </section>
    </div>
    <div shuku-edit-id="e-16267341-b3ad-4a00-8a0d-4f7a0259c396" className="acw-framework-pipeline" aria-label="从 TSX 源码到浏览器画面的过程">
      <div shuku-edit-id="e-6c0c20d9-a762-4038-98ee-93555e8bc32b" className="acw-framework-pipeline-source"><SourceFile compact /><div shuku-edit-id="e-e7e7b74b-cdb0-47ce-bba6-c8b6c9b7b06f"><Typography shuku-edit-id="e-9c1cea21-ca44-4fcc-b9d1-3f74fca633dd" variant="body">TSX 源码</Typography><Typography shuku-edit-id="e-596efa99-5d14-4c93-9197-acef2d2e479f" variant="bodySmall" tone="muted">TypeScript<br shuku-edit-id="e-134b0fd5-79d5-4bf5-b13e-dfb68677b309" />+ JSX</Typography></div></div>
      <ArrowRight className="acw-framework-arrow" aria-hidden="true" />
      <div shuku-edit-id="e-f0eac482-1d73-4bc2-807e-a7ca971c81ad" className="acw-framework-build"><Zap aria-hidden="true" /><Typography shuku-edit-id="e-3c51d99c-7c40-4f65-93f2-38397fa3e5ba" variant="body">Vite 转换 / 构建</Typography></div>
      <ArrowRight className="acw-framework-arrow" aria-hidden="true" />
      <div shuku-edit-id="e-39a51cb0-e3cc-4462-8819-bc391d3024c1" className="acw-framework-output"><div shuku-edit-id="e-02a88b22-e21d-4184-ae3c-8102c67e0942" className="acw-framework-assets" aria-hidden="true"><FileCode2 /><Braces /></div><Typography shuku-edit-id="e-642f2fba-19a7-422d-a7b2-9a7f3dd42ee0" variant="body">JavaScript<br shuku-edit-id="e-e12a8b95-873e-489e-8189-4c213cb5a780" />+ CSS</Typography></div>
      <div shuku-edit-id="e-8171d16b-64c4-4da4-bb0a-1e68071410b6" className="acw-framework-runtime"><Typography shuku-edit-id="e-cf4372c9-c444-49ec-a5b0-a8a238e39f45" variant="bodySmall" align="center">React DOM<br shuku-edit-id="e-49f6424f-47da-49c3-bcf0-712812bdf74c" />创建与更新 DOM</Typography><ArrowRight aria-hidden="true" /></div>
      <div shuku-edit-id="e-44a98be3-e686-4d06-90e1-c9f9822b6b50" className="acw-framework-result"><BrowserPreview /><Typography shuku-edit-id="e-6ddd0179-9b1e-4659-9eaf-dde814445276" variant="body">浏览器画面</Typography></div>
    </div>
    <Typography shuku-edit-id="e-fd64ac82-c3f1-4537-b69f-18e49e7883d1" variant="bodySmall" tone="muted" align="center" className="acw-framework-entry">浏览器加载 HTML 入口，再执行 JavaScript、应用 CSS</Typography>
  </ContentBlock>;
}
