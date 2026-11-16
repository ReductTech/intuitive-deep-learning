import type { ReactNode } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import './LessonPrimitives.css';
import './CoursePolish.css';

export function LessonPage({ title, subtitle, children, footer, className = '' }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode; className?: string }) {
  return <ContentBlock shuku-edit-id="e-7ddd0ff3-946b-46d3-bb5c-4447367ecfcd" title={title} subtitle={subtitle} headingLevel={1} className={`vbrl-lesson ${className}`}><div shuku-edit-id="e-4a515cbb-814d-49c3-8f4d-a167e8138024" className="vbrl-page-body"><div shuku-edit-id="e-7472b2ba-e62a-42af-b09b-8643b5d651f9" className="vbrl-page-main">{children}</div><div shuku-edit-id="e-cb4c37d8-7acd-4468-b7ec-fa8db641e4b1" className="vbrl-page-footer">{typeof footer === 'string' ? <Typography shuku-edit-id="e-8980b0fc-ab3c-4b51-a623-1dab4829d3c5" variant="body" tone="accent">{footer}</Typography> : footer}</div></div></ContentBlock>;
}
export function Formula({ latex, label }: { latex: string; label?: string }) {
  return <MathFormulaBlock appearance="plain" ariaLabel={label ?? latex}><MathFormulaStatic latex={latex} /></MathFormulaBlock>;
}
export function Conclusion({ children }: { children: ReactNode }) { return <div shuku-edit-id="e-031b16e3-daae-44a0-affe-0b26ed69cd08" className="vbrl-conclusion"><Typography shuku-edit-id="e-9048f473-12f8-4b07-9194-29da258f6626" variant="body" tone="accent">{children}</Typography></div>; }
export function Metric({ label, value, tone = 'accent' }: { label: string; value: ReactNode; tone?: 'accent' | 'success' | 'warning' | 'danger' }) {
  return <div shuku-edit-id="e-0f527a68-56a3-4dc8-8f6f-b3a5eb3b2173" className="vbrl-metric"><Typography shuku-edit-id="e-a59481e5-2dd1-4aff-9a88-c354efac5c5b" variant="bodySmall" tone="muted">{label}</Typography><Typography shuku-edit-id="e-9b1fc012-9bc7-4ff5-8f8d-167e5c851907" variant="h2" tone={tone}>{value}</Typography></div>;
}
export function ActionValues({ values, probabilities = false, selected, onSelect }: { values: readonly number[]; probabilities?: boolean; selected?: number; onSelect?: (i: number) => void }) {
  const labels = ['向上', '向右', '向下', '向左']; const max = Math.max(...values.map(Math.abs), 1); const best = values.indexOf(Math.max(...values)); const signed = values.some(v => v < 0);
  return <div shuku-edit-id="e-d59db887-f0ee-4c74-ad57-572e9d04d75d" className="vbrl-action-values">{values.map((value, i) => <div shuku-edit-id="e-908ccd1a-37ff-483b-a25f-d3cb6d73bfa0" key={i} className={`vbrl-action-values__row${i === (selected ?? best) ? ' is-active' : ''}`} onClick={() => onSelect?.(i)}>
    <Typography shuku-edit-id="e-ee745179-7006-4eae-95b3-c14b227d61c4" variant="bodySmall" tone="accent">{labels[i]}</Typography><div shuku-edit-id="e-b6d55c46-9b1e-4fc8-966e-dfe374abcf52" className="vbrl-action-values__track"><div shuku-edit-id="e-3cd2a726-a5cc-4487-9aac-e684a92f156e" style={{ width: `${Math.abs(value) / max * (signed ? 50 : 100)}%`, position: signed ? 'absolute' : undefined, left: signed ? `${value < 0 ? 50 - Math.abs(value) / max * 50 : 50}%` : undefined, background: value < 0 ? 'var(--ui-danger)' : i === (selected ?? best) ? 'var(--ui-accent-alt)' : 'var(--ui-accent)' }} /></div><Typography shuku-edit-id="e-703499f6-003e-46e1-a486-8ad398dbdfe5" variant="body" tone={i === (selected ?? best) ? 'warning' : 'accent'}>{probabilities ? `${(value * 100).toFixed(0)}%` : value.toFixed(2)}</Typography>
  </div>)}</div>;
}
