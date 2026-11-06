import { Fragment, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Button, MathFormulaBlock, MathFormulaStatic, Typography, type LessonStepContext } from '../../shared/react';
import { rainImage } from '../media';
import './LessonVisuals.css';

export { rainImage };
export function Text({ children }: { children: ReactNode }) { return <Typography variant="body">{children}</Typography>; }
export function Heading({ children }: { children: ReactNode }) { return <Typography as="h2" variant="h3" tone="accent">{children}</Typography>; }
export function Action({ children, onClick, active, disabled, label }: { children: ReactNode; onClick: () => void; active?: boolean; disabled?: boolean; label?: string }) {
  return <Button onClick={onClick} active={active} disabled={disabled} aria-label={label} aria-pressed={active}><Typography as="span" variant="bodySmall" tone="inherit">{children}</Typography></Button>;
}

// Count distinct visible states, including the initial state.
export function useStepSequence<T extends HTMLElement = HTMLDivElement>(steps: number) {
  const hostRef = useRef<T>(null);
  const [step, setStep] = useState(0);
  const lastStep = Math.max(0, steps - 1);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (host.closest('.scenedeck-thumbnail__surface')) {
      setStep(lastStep);
    }
  }, [lastStep]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || host.closest('.scenedeck-thumbnail__surface')) return;
    host.dataset.lessonStepSequence = 'true';
    const advanceFromContent = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest('button, a, input, select, textarea, [role="button"], [contenteditable="true"], .vlm-auto-control, .exp-attention-toolbar')) return;
      setStep(current => Math.min(lastStep, current + 1));
    };
    host.addEventListener('click', advanceFromContent);
    return () => {
      host.removeEventListener('click', advanceFromContent);
      delete host.dataset.lessonStepSequence;
    };
  }, [lastStep]);

  return {
    hostRef,
    step,
    steps,
    previous: () => setStep(current => Math.max(0, Math.min(lastStep, current - 1))),
    next: () => setStep(current => Math.max(0, Math.min(lastStep, current + 1))),
  };
}

export function StepSequenceControl({ step, steps, onPrevious, onNext, label = '逐步查看' }: { step: number; steps: number; onPrevious: () => void; onNext: () => void; label?: string }) {
  return <div className="vlm-auto-control" aria-label={label}>
    <Typography variant="bodySmall" tone="muted">{label}</Typography>
    <Action onClick={onPrevious} disabled={step <= 0}>上一步</Action>
    <Action onClick={onNext} disabled={step >= steps - 1}>下一步</Action>
  </div>;
}
export function Choices({ labels, value, onChange }: { labels: string[]; value: number; onChange: (index: number) => void }) {
  return <div className="vlm-options">{labels.map((label, index) => <Action key={label} active={index === value} onClick={() => onChange(index)}>{label}</Action>)}</div>;
}
export function Equation({ latex, label }: { latex: string; label: string }) {
  return <MathFormulaBlock ariaLabel={label}><MathFormulaStatic latex={latex} /></MathFormulaBlock>;
}
export function Metric({ value, label }: { value: ReactNode; label: string }) {
  return <div className="vlm-metric"><Typography variant="display" tone="accent">{value}</Typography><Text>{label}</Text></div>;
}
export function Photo({ src = rainImage, alt = '原课件图片：女孩与龙猫站在雨中', children, square = false }: { src?: string; alt?: string; children?: ReactNode; square?: boolean }) {
  return <div className={`vlm-photo ${square ? 'vlm-photo-square' : ''}`}><img src={src} alt={alt} />{children}</div>;
}
export function Tokens({ labels, selected = -1, onSelect }: { labels: string[]; selected?: number; onSelect?: (i: number) => void }) {
  return <div className="vlm-token-strip">{labels.map((label, i) => onSelect
    ? <Action key={i} active={selected === i} onClick={() => onSelect(i)}>{label}</Action>
    : <Typography key={i} as="span" variant="bodySmall" className={`vlm-token ${selected === i ? 'is-selected' : ''}`}>{label}</Typography>)}</div>;
}
export function Flow({ labels, active = 0, onSelect }: { labels: string[]; active?: number; onSelect?: (i: number) => void }) {
  return <div className="vlm-flow" style={{ '--flow-count': labels.length } as CSSProperties}>{labels.map((label, i) => <Fragment key={label}>
    <div className={`vlm-flow-node ${active === i ? 'is-current' : ''}`}>
      {onSelect ? <Action onClick={() => onSelect(i)} active={active === i}>{label}</Action> : <Typography variant="bodySmall" align="center">{label}</Typography>}
    </div>{i < labels.length - 1 && <Typography as="span" variant="body" tone="muted" aria-hidden="true">→</Typography>}
  </Fragment>)}</div>;
}
export function Bars({ labels, values, percent = false }: { labels: string[]; values: number[]; percent?: boolean }) {
  return <div className="vlm-bars">{values.map((value, i) => <div className="vlm-bar-row" key={labels[i]}>
    <div className="vlm-bar-caption"><Text>{labels[i]}</Text><Typography variant="bodySmall" tone="accent">{percent ? `${(value * 100).toFixed(1)}%` : value.toFixed(2)}</Typography></div>
    <div className="vlm-bar-track"><div className="vlm-bar-fill" style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} /></div>
  </div>)}</div>;
}
export function PatchGrid({ side, selected = -1, onSelect }: { side: number; selected?: number; onSelect?: (i: number) => void }) {
  // Large grids use CSS lines, avoiding thousands of DOM nodes in thumbnails.
  if (!onSelect) return <div className="vlm-grid-lines" aria-hidden="true" style={{ backgroundSize: `${100 / side}% ${100 / side}%` }} />;
  return <div className="vlm-patch-pick" role="group" aria-label="图像 Patch，使用方向键移动" style={{ gridTemplateColumns: `repeat(${side}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${side}, minmax(0, 1fr))` }}>
    {Array.from({ length: side ** 2 }, (_, i) => <Button key={i} className={`vlm-patch-button ${selected === i ? 'is-selected' : ''}`} tabIndex={selected === i || (selected < 0 && i === 0) ? 0 : -1} aria-label={`第 ${Math.floor(i / side) + 1} 行，第 ${i % side + 1} 列，Patch ${i + 1}`} aria-pressed={selected === i} onClick={() => onSelect(i)} onKeyDown={event => {
      let next = i;
      if (event.key === 'ArrowLeft' && i % side > 0) next--;
      else if (event.key === 'ArrowRight' && i % side < side - 1) next++;
      else if (event.key === 'ArrowUp') next = Math.max(0, i - side);
      else if (event.key === 'ArrowDown') next = Math.min(side ** 2 - 1, i + side);
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = side ** 2 - 1;
      else return;
      event.preventDefault();
      event.stopPropagation();
      if (next !== i) {
        (event.currentTarget.parentElement?.children.item(next) as HTMLButtonElement | null)?.focus();
        onSelect(next);
      }
    }} />)}
  </div>;
}
export function Page({ number, title, takeaway, resettable = false, context, children }: { number: number; title: string; mission?: string; takeaway: string; note?: string; resettable?: boolean; context: LessonStepContext; children: ReactNode }) {
  const id = useId(); const [revision, setRevision] = useState(0);
  return <article className="vlm-lesson-page ng-ppt-slide-surface" data-page={number} aria-labelledby={id}
    onKeyDown={event => { if ((event.target instanceof HTMLButtonElement || event.target instanceof HTMLInputElement) && [' ', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) event.stopPropagation(); }}>
    <header className="vlm-lesson-header"><Typography variant="bodySmall" tone="accent">{number <= 10 ? 'ViT' : number <= 17 ? 'CLIP' : 'VLM'} / {String(number).padStart(2, '0')}</Typography><Typography as="h1" variant="h1" id={id}>{title}</Typography></header>
    <div className="vlm-lesson-content" key={revision}>{children}</div>
    <footer className="vlm-lesson-footer"><Typography variant="body" tone="accent">{takeaway}</Typography><div className="vlm-options">
      {resettable ? <Action onClick={() => setRevision(v => v + 1)}>重置实验</Action> : null}
      <Button variant="primary" onClick={context.complete} disabled={context.isComplete}><Typography as="span" variant="bodySmall" tone="inherit">{context.isComplete ? '已完成本页' : number === 27 ? '完成课程' : '继续学习'}</Typography></Button>
    </div></footer>
  </article>;
}
