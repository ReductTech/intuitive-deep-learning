import { Typography } from "@shuku/course-style/react";
import './DesignComparisonHeader.css';

export function DesignComparisonHeader({ ours = false, description }: { ours?: boolean; description: string }) {
  return <header shuku-edit-id="e-71c06d49-1784-4608-b7ca-038fe3d54ad2" className={`aipe-design-comparison-heading${ours ? ' is-ours' : ''}`}>
    <Typography shuku-edit-id="e-df526458-f971-46a6-87e1-0ea925cc11b7" as="h2" variant="h3" tone="inherit" className="aipe-design-comparison-label">{ours ? '我们的设计' : '常见设计'}</Typography>
    <Typography shuku-edit-id="e-dc6cffc4-ec6e-40d6-ae8f-e69d29d78c95" variant="bodySmall" tone="muted">{description}</Typography>
  </header>;
}

export function DesignComparisonArrow() {
  return <svg shuku-edit-id="e-9aa65ad8-7ac4-49de-bdcd-dab0ef80cff7" className="aipe-design-comparison-arrow" viewBox="0 0 32 26" aria-hidden="true"><path shuku-edit-id="e-4130dce1-864d-4e78-a491-a50cdeb0a1a5" d="M3 13h24M18 4l9 9-9 9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
