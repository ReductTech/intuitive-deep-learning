import { Typography } from "@shuku/course-style/react";
import './DesignComparisonHeader.css';

export function DesignComparisonHeader({ ours = false, description }: { ours?: boolean; description: string }) {
  return <header shuku-edit-id="e-fa58284a-505c-463c-8280-c46177dac6c3" className={`cg-design-comparison-heading${ours ? ' is-ours' : ''}`}>
    <Typography shuku-edit-id="e-3bfd8e58-f114-4cf5-8b54-937b7bbf8dad" as="h2" variant="h3" tone="inherit" className="cg-design-comparison-label">{ours ? '我们的设计' : '常见设计'}</Typography>
    <Typography shuku-edit-id="e-75e3df7d-5e25-4ae3-bcd6-3ae23871f3cf" variant="bodySmall" tone="muted">{description}</Typography>
  </header>;
}

export function DesignComparisonArrow() {
  return <svg shuku-edit-id="e-afb6e999-a717-42fe-85ca-c42a0fe0e3cf" className="cg-design-comparison-arrow" viewBox="0 0 32 26" aria-hidden="true"><path shuku-edit-id="e-c700bfe5-4f57-4d86-8df9-c152f3ef7beb" d="M3 13h24M18 4l9 9-9 9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
