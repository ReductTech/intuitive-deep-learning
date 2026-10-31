import { Typography } from '../../shared/react';
import './DesignComparisonHeader.css';

export function DesignComparisonHeader({ ours = false, description }: { ours?: boolean; description: string }) {
  return <header className={`aipe-design-comparison-heading${ours ? ' is-ours' : ''}`}>
    <Typography as="h2" variant="h3" tone="inherit" className="aipe-design-comparison-label">{ours ? '我们的设计' : '常见设计'}</Typography>
    <Typography variant="bodySmall" tone="muted">{description}</Typography>
  </header>;
}

export function DesignComparisonArrow() {
  return <svg className="aipe-design-comparison-arrow" viewBox="0 0 32 26" aria-hidden="true"><path d="M3 13h24M18 4l9 9-9 9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
