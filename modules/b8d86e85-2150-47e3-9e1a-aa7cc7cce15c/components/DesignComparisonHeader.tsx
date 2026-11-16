import { Typography } from "@shuku/course-style/react";
import './DesignComparisonHeader.css';

export function DesignComparisonHeader({ ours = false, description }: { ours?: boolean; description: string }) {
  return <header shuku-edit-id="e-2327428f-2b86-41d3-a188-a7cfc49d6694" className={`aipe-design-comparison-heading${ours ? ' is-ours' : ''}`}>
    <Typography shuku-edit-id="e-32778d38-fbd3-49b9-ba8b-acdf55313360" as="h2" variant="h3" tone="inherit" className="aipe-design-comparison-label">{ours ? '我们的设计' : '常见设计'}</Typography>
    <Typography shuku-edit-id="e-18c49689-4f95-4638-a214-b3244c8240f1" variant="bodySmall" tone="muted">{description}</Typography>
  </header>;
}

export function DesignComparisonArrow() {
  return <svg shuku-edit-id="e-5203d01a-0745-4b54-8e4f-4b971938c32b" className="aipe-design-comparison-arrow" viewBox="0 0 32 26" aria-hidden="true"><path shuku-edit-id="e-7e7726e8-ed95-4d04-bac6-1a6f32e5b3c8" d="M3 13h24M18 4l9 9-9 9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
