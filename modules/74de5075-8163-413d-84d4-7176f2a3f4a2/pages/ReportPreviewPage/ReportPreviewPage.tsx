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
  return <ContentBlock headingLevel={1}
    title={outline.pages.find(page => page.id === 'report-preview')!.title}
    className="spp-report-preview" bodyClassName="spp-report-preview-body" data-scene-id="report-preview">
    <ol className="spp-report-preview-list" aria-label="报告将回答的五个问题">
      {questions.map((question, index) => <li key={question.outcome} className="spp-report-preview-row">
        <Typography as="span" variant="h3" tone="accent" className="spp-report-preview-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</Typography>
        <Typography as="h2" variant="h2" tone="accent" className="spp-report-preview-question">{question.before}<span>{question.emphasis}</span>{question.after}</Typography>
        <ArrowRight className="spp-report-preview-arrow" aria-hidden="true" />
        <Typography as="p" variant="h2" tone="accent" className="spp-report-preview-outcome"><span>{question.outcome}</span></Typography>
      </li>)}
    </ol>
    <footer className="spp-report-preview-takeaway"><Typography variant="h2" tone="accent" align="center">让信息变成理解，让知识走向实践</Typography></footer>
  </ContentBlock>;
}
