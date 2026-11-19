import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { Typography } from "@shuku/course-style/react";
import { moduleIdentity } from '../../outlines.json';
import './OpeningPage.css';

export function OpeningPage() {
  return (
    <section shuku-edit-id="e-b5eb6954-b3ae-4a6b-8aed-4c17260ab2a1" className="llmpe-opening" aria-label="大模型驱动的实践能力培养体系与平台">
      <header shuku-edit-id="e-f16ee5e3-e59e-4ac1-96a8-1e0bb4a1270e" className="llmpe-opening-copy">
        <Typography shuku-edit-id="e-e5575f07-84d0-4e4c-ac93-9161d5178fe7" as="h1" variant="display" tone="accent" className="llmpe-opening-title">
          <span shuku-edit-id="e-8ba2b654-c9bb-422f-8545-70dc40120176" className="llmpe-opening-title-line">大模型驱动的</span>
          <span shuku-edit-id="e-4430ca45-c927-4392-840b-bfc23b9203a1" className="llmpe-opening-title-line"><span shuku-edit-id="e-e914149a-633e-45ab-b277-4a7b67de74a4" className="llmpe-opening-emphasis">实践能力</span>培养体系与平台</span>
        </Typography>
        <Typography shuku-edit-id="e-418f1185-e070-44e1-818a-e1bdeb3c058f" variant="subtitle" tone="muted" className="llmpe-opening-subtitle">
          让 AI 把时间还给理解、实践与创新
        </Typography>
      </header>
      <img shuku-edit-id="e-1dbe6d83-614b-464e-9b1f-307cf949176d"
        className="llmpe-opening-illustration"
        src={moduleAssetUrl("images/opening-illustration-v1.webp")}
        alt="论文资料、知识图示与编程实验面板"
        draggable={false}
      />
    </section>
  );
}
