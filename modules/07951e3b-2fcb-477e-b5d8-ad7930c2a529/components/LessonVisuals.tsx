import { Fragment, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Button, MathFormulaBlock, MathFormulaStatic, Typography, type LessonStepContext } from "@shuku/course-style/react";
import { rainImage } from '../media';
import './LessonVisuals.css';

export { rainImage };
export function Text({ children }: { children: ReactNode }) { return <Typography shuku-edit-id="e-4780885b-a886-4427-8ec4-40721ea78440" variant="body">{children}</Typography>; }
export function Heading({ children }: { children: ReactNode }) { return <Typography shuku-edit-id="e-f20660fc-ed38-4a9d-bba1-ce65a3fa3cad" as="h2" variant="h3" tone="accent">{children}</Typography>; }
export function Action({ children, onClick, active, disabled, label }: { children: ReactNode; onClick: () => void; active?: boolean; disabled?: boolean; label?: string }) {
  return <Button onClick={onClick} active={active} disabled={disabled} aria-label={label} aria-pressed={active}><Typography shuku-edit-id="e-53e2fdef-0d34-4887-85d4-2995546414f7" as="span" variant="bodySmall" tone="inherit">{children}</Typography></Button>;
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
  return <div shuku-edit-id="e-7198789f-c3c2-4160-90d5-0f4fcd7557cf" className="vlm-auto-control" aria-label={label}>
    <Typography shuku-edit-id="e-0672f096-98dc-4dd3-8233-0eefb459ede6" variant="bodySmall" tone="muted">{label}</Typography>
    <Action onClick={onPrevious} disabled={step <= 0}>上一步</Action>
    <Action onClick={onNext} disabled={step >= steps - 1}>下一步</Action>
  </div>;
}
export function Choices({ labels, value, onChange }: { labels: string[]; value: number; onChange: (index: number) => void }) {
  return <div shuku-edit-id="e-48169846-d786-498a-a275-771b1a11d80f" className="vlm-options">{labels.map((label, index) => <Action key={label} active={index === value} onClick={() => onChange(index)}>{label}</Action>)}</div>;
}
export function Equation({ latex, label }: { latex: string; label: string }) {
  return <MathFormulaBlock ariaLabel={label}><MathFormulaStatic latex={latex} /></MathFormulaBlock>;
}
export function Metric({ value, label }: { value: ReactNode; label: string }) {
  return <div shuku-edit-id="e-d45d131c-3bd1-4af0-bda7-59e8736f4a61" className="vlm-metric"><Typography shuku-edit-id="e-b9eb48de-d735-4227-99ff-69f59a3b3e0b" variant="display" tone="accent">{value}</Typography><Text>{label}</Text></div>;
}
export function Photo({ src = rainImage, alt = '原课件图片：女孩与龙猫站在雨中', children, square = false }: { src?: string; alt?: string; children?: ReactNode; square?: boolean }) {
  return <div shuku-edit-id="e-c941efdd-e8b6-4055-aed7-a3b2e78e8267" className={`vlm-photo ${square ? 'vlm-photo-square' : ''}`}><img shuku-edit-id="e-f9e80318-81ec-4fc0-bfc2-2c2ab049abaa" src={src} alt={alt} />{children}</div>;
}
export function Tokens({ labels, selected = -1, onSelect }: { labels: string[]; selected?: number; onSelect?: (i: number) => void }) {
  return <div shuku-edit-id="e-2a243d64-4793-43a8-8cfe-4969e5b00f3a" className="vlm-token-strip">{labels.map((label, i) => onSelect
    ? <Action key={i} active={selected === i} onClick={() => onSelect(i)}>{label}</Action>
    : <Typography shuku-edit-id="e-94916521-4c99-43fa-82c1-3c95e5120831" key={i} as="span" variant="bodySmall" className={`vlm-token ${selected === i ? 'is-selected' : ''}`}>{label}</Typography>)}</div>;
}
export function Flow({ labels, active = 0, onSelect }: { labels: string[]; active?: number; onSelect?: (i: number) => void }) {
  return <div shuku-edit-id="e-a28bce0c-bd08-4728-a5e7-3bd97da61f4b" className="vlm-flow" style={{ '--flow-count': labels.length } as CSSProperties}>{labels.map((label, i) => <Fragment key={label}>
    <div shuku-edit-id="e-6aff79b4-b9f7-49fa-8cfc-83a0570d3724" className={`vlm-flow-node ${active === i ? 'is-current' : ''}`}>
      {onSelect ? <Action onClick={() => onSelect(i)} active={active === i}>{label}</Action> : <Typography shuku-edit-id="e-dd3d7602-6806-432f-a3a0-b83a793a2aa5" variant="bodySmall" align="center">{label}</Typography>}
    </div>{i < labels.length - 1 && <Typography shuku-edit-id="e-6a863304-26d6-4ae1-b4cb-cb6dd087fa32" as="span" variant="body" tone="muted" aria-hidden="true">→</Typography>}
  </Fragment>)}</div>;
}
export function Bars({ labels, values, percent = false }: { labels: string[]; values: number[]; percent?: boolean }) {
  return <div shuku-edit-id="e-f8278192-e041-442c-953c-5c4fb331e725" className="vlm-bars">{values.map((value, i) => <div shuku-edit-id="e-6293e3af-783f-433e-8e9d-7dd8faaf2ac8" className="vlm-bar-row" key={labels[i]}>
    <div shuku-edit-id="e-975503bd-ce37-4573-8458-f097e66f7b19" className="vlm-bar-caption"><Text>{labels[i]}</Text><Typography shuku-edit-id="e-900e7ead-33ef-4dd6-ad43-a87792b91c79" variant="bodySmall" tone="accent">{percent ? `${(value * 100).toFixed(1)}%` : value.toFixed(2)}</Typography></div>
    <div shuku-edit-id="e-b4066d53-ebb2-47e2-a6ac-bb2bf498e478" className="vlm-bar-track"><div shuku-edit-id="e-b17bca55-b2d5-47de-9f0f-1bcaa701db7e" className="vlm-bar-fill" style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} /></div>
  </div>)}</div>;
}
export function PatchGrid({ side, selected = -1, onSelect }: { side: number; selected?: number; onSelect?: (i: number) => void }) {
  // Large grids use CSS lines, avoiding thousands of DOM nodes in thumbnails.
  if (!onSelect) return <div shuku-edit-id="e-92d14252-c5c3-4e4b-9e09-fe6d20d8b15f" className="vlm-grid-lines" aria-hidden="true" style={{ backgroundSize: `${100 / side}% ${100 / side}%` }} />;
  return <div shuku-edit-id="e-8e54e6f9-15a6-4670-81e1-1e3bde2c3671" className="vlm-patch-pick" role="group" aria-label="图像 Patch，使用方向键移动" style={{ gridTemplateColumns: `repeat(${side}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${side}, minmax(0, 1fr))` }}>
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
  return <article shuku-edit-id="e-1e1a2e58-f580-475a-a1b1-e19f628b6140" className="vlm-lesson-page ng-ppt-slide-surface" data-page={number} aria-labelledby={id}
    onKeyDown={event => { if ((event.target instanceof HTMLButtonElement || event.target instanceof HTMLInputElement) && [' ', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) event.stopPropagation(); }}>
    <header shuku-edit-id="e-a64d4bd9-7b40-45a5-9831-a94d87758b6e" className="vlm-lesson-header"><Typography shuku-edit-id="e-359dfe64-3ba6-479f-b947-7954c94cd504" variant="bodySmall" tone="accent">{number <= 10 ? 'ViT' : number <= 17 ? 'CLIP' : 'VLM'} / {String(number).padStart(2, '0')}</Typography><Typography shuku-edit-id="e-70cae701-73af-4bf7-951d-edb0b9d99e64" as="h1" variant="h1" id={id}>{title}</Typography></header>
    <div shuku-edit-id="e-ccbd07d4-0255-4fe2-91b4-2e4210a0eebb" className="vlm-lesson-content" key={revision}>{children}</div>
    <footer shuku-edit-id="e-38dd0c38-6c82-4816-a8fd-a8e468e7fa9f" className="vlm-lesson-footer"><Typography shuku-edit-id="e-9d6bbb3b-2b04-4fd4-967a-2b40edd33b39" variant="body" tone="accent">{takeaway}</Typography><div shuku-edit-id="e-9a645cc2-9204-4628-9cd2-9c6dfd9dbd30" className="vlm-options">
      {resettable ? <Action onClick={() => setRevision(v => v + 1)}>重置实验</Action> : null}
      <Button variant="primary" onClick={context.complete} disabled={context.isComplete}><Typography shuku-edit-id="e-43f52da9-df2a-4972-b545-054eb4385d22" as="span" variant="bodySmall" tone="inherit">{context.isComplete ? '已完成本页' : number === 27 ? '完成课程' : '继续学习'}</Typography></Button>
    </div></footer>
  </article>;
}
