import { ArrowRight } from 'lucide-react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import './ReportPreviewPage.css';

const questions = [
  { before: '如何', emphasis: '更早发现', after: '前沿？', outcome: '个性化信息供给' },
  { before: '如何', emphasis: '真正理解', after: '知识？', outcome: '渐进交互学习' },
  { before: '如何形成', emphasis: '实践能力', after: '？', outcome: 'AI 辅助实践' },
  { before: '如何', emphasis: '看见', after: '真实成长？', outcome: '过程与能力评价' },
  { before: '如何形成', emphasis: '育人生态', after: '？', outcome: '师生 · 科研 · 产业' },
] as const;

export function ReportPreviewPage() {
  return <ContentBlock shuku-edit-id="e-6d2de357-fcb7-46b2-bf20-3618f81bc1ff" headingLevel={1}
    title={outline.pages.find(page => page.id === 'report-preview')!.title}
    className="spp-report-preview" bodyClassName="spp-report-preview-body" data-scene-id="report-preview">
    <ol shuku-edit-id="e-decb5435-5355-4a7a-bc37-35f22a3fd86d" className="spp-report-preview-list" aria-label="报告将回答的五个问题">
      {questions.map((question, index) => <li shuku-edit-id="e-bc8c103e-ac86-4c9c-a734-1b67d6639d2e" key={question.outcome} className="spp-report-preview-row">
        <Typography shuku-edit-id="e-955af2be-d9f8-4bab-9586-37f7538518d0" as="span" variant="h3" tone="accent" className="spp-report-preview-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</Typography>
        <Typography shuku-edit-id="e-ea2a5bab-ecbc-440f-8bc7-90a6574a8554" as="h2" variant="h2" tone="accent" className="spp-report-preview-question">{question.before}<span shuku-edit-id="e-9f50a640-7a93-4ecb-a7d7-70008a3ba744">{question.emphasis}</span>{question.after}</Typography>
        <ArrowRight className="spp-report-preview-arrow" aria-hidden="true" />
        <Typography shuku-edit-id="e-fc2a0b45-c8ba-4b0b-8bed-38873791294f" as="p" variant="h2" tone="accent" className="spp-report-preview-outcome"><span shuku-edit-id="e-d0008c5d-ef28-4732-a5cd-aee08c935ea0">{question.outcome}</span></Typography>
      </li>)}
    </ol>
    <footer shuku-edit-id="e-db550bce-313d-4e33-ba0d-2ec3bb3d37f2" className="spp-report-preview-takeaway"><Typography shuku-edit-id="e-2fc91966-6fbc-4637-9d6c-b20521208f4b" variant="h2" tone="accent" align="center">让信息变成理解，让知识走向实践</Typography></footer>
  </ContentBlock>;
}
