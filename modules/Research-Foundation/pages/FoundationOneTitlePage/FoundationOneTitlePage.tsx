import { Typography } from '../../../shared/react';
import './FoundationOneTitlePage.css';

/** Static chapter divider; the speaker owns the pace and advances manually. */
export function FoundationOneTitlePage() {
  return <section className="rf-page rf-foundation-one-title" aria-label="研究基础一：规模化文献处理与质量评价">
    <div className="rf-foundation-one-copy">
      <span className="rf-foundation-one-accent" aria-hidden="true"/>
      <Typography variant="subtitle" tone="inherit" className="rf-foundation-one-label">研究基础一</Typography>
      <Typography as="h1" variant="display" tone="inherit" className="rf-foundation-one-heading">
        <Typography as="span" variant="display" tone="inherit">规模化文献处理</Typography>
        <Typography as="span" variant="display" tone="inherit" className="rf-foundation-one-topic">与质量评价</Typography>
      </Typography>
    </div>
  </section>;
}
