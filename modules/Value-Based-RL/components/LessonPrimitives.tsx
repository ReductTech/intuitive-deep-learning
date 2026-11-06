import type { ReactNode } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from '../../shared/react';
import './LessonPrimitives.css';
import './CoursePolish.css';

export function LessonPage({ title, subtitle, children, footer, className = '' }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode; className?: string }) {
  return <ContentBlock title={title} subtitle={subtitle} headingLevel={1} className={`vbrl-lesson ${className}`}><div className="vbrl-page-body"><div className="vbrl-page-main">{children}</div><div className="vbrl-page-footer">{typeof footer === 'string' ? <Typography variant="body" tone="accent">{footer}</Typography> : footer}</div></div></ContentBlock>;
}
export function Formula({ latex, label }: { latex: string; label?: string }) {
  return <MathFormulaBlock appearance="plain" ariaLabel={label ?? latex}><MathFormulaStatic latex={latex} /></MathFormulaBlock>;
}
export function Conclusion({ children }: { children: ReactNode }) { return <div className="vbrl-conclusion"><Typography variant="body" tone="accent">{children}</Typography></div>; }
export function Metric({ label, value, tone = 'accent' }: { label: string; value: ReactNode; tone?: 'accent' | 'success' | 'warning' | 'danger' }) {
  return <div className="vbrl-metric"><Typography variant="bodySmall" tone="muted">{label}</Typography><Typography variant="h2" tone={tone}>{value}</Typography></div>;
}
export function ActionValues({ values, probabilities = false, selected, onSelect }: { values: readonly number[]; probabilities?: boolean; selected?: number; onSelect?: (i: number) => void }) {
  const labels = ['向上', '向右', '向下', '向左']; const max = Math.max(...values.map(Math.abs), 1); const best = values.indexOf(Math.max(...values)); const signed = values.some(v => v < 0);
  return <div className="vbrl-action-values">{values.map((value, i) => <div key={i} className={`vbrl-action-values__row${i === (selected ?? best) ? ' is-active' : ''}`} onClick={() => onSelect?.(i)}>
    <Typography variant="bodySmall" tone="accent">{labels[i]}</Typography><div className="vbrl-action-values__track"><div style={{ width: `${Math.abs(value) / max * (signed ? 50 : 100)}%`, position: signed ? 'absolute' : undefined, left: signed ? `${value < 0 ? 50 - Math.abs(value) / max * 50 : 50}%` : undefined, background: value < 0 ? 'var(--ui-danger)' : i === (selected ?? best) ? 'var(--ui-accent-alt)' : 'var(--ui-accent)' }} /></div><Typography variant="body" tone={i === (selected ?? best) ? 'warning' : 'accent'}>{probabilities ? `${(value * 100).toFixed(0)}%` : value.toFixed(2)}</Typography>
  </div>)}</div>;
}
