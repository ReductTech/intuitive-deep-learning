import { ATTENTION_PAGE_COUNT, formatCoursePageNumber } from '../model/coursePageNumber';
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type Dispatch, type SetStateAction } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, Question, Typography, type QuestionOption } from "@shuku/course-style/react";
import './AttentionActivity.css';
export type ActivityProps = { onComplete: () => void; isComplete: boolean };
export const numberText = (n: number, digits = 3) => (Math.abs(n) < 1e-9 ? 0 : n).toFixed(digits).replace('-', '−');
export const vectorLatex = (values: readonly number[], digits = 3) => `\\begin{bmatrix}${values.map(v => (Math.abs(v)<1e-9?0:v).toFixed(digits)).join('\\\\')}\\end{bmatrix}`;
export function useActivityState<T>(key: string, initial: T, validate: (value: unknown) => value is T = (value): value is T => typeof value === typeof initial): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    try { const saved: unknown = JSON.parse(localStorage.getItem(`attention-mechanism:${key}-v20`) ?? 'null'); if (saved !== null && validate(saved)) return saved; } catch { /* Memory fallback. */ }
    return initial;
  });
  useEffect(() => { try { localStorage.setItem(`attention-mechanism:${key}-v20`, JSON.stringify(state)); } catch { /* Memory fallback. */ } }, [key, state]);
  return [state, setState];
}
export function AttentionActivity({ number, title, titleVisual, learningFlow, eyebrow = '数值示例', children, footer, done, onComplete, isComplete, className = '', footerHeight = 158 }: ActivityProps & { number: number; title: string; titleVisual?: ReactNode; learningFlow?: ReactNode; eyebrow?: ReactNode; children: ReactNode; footer?: ReactNode; done: boolean; className?: string; footerHeight?: number }) {
  const root = useRef<HTMLElement>(null);
  useLayoutEffect(() => { if (root.current) root.current.inert = Boolean(root.current.closest('[aria-hidden="true"]')); }, []);
  useEffect(() => { if (done && !isComplete && !root.current?.closest('[aria-hidden="true"]')) onComplete(); }, [done, isComplete, onComplete]);
  return <article shuku-edit-id="e-6c75bf77-5420-48c4-a2aa-4d6279ba7244" ref={root} className={`attn-activity ${className}`} data-activity={`C${String(number).padStart(2,'0')}`} data-activity-complete={done} aria-label={title} style={{ gridTemplateRows: `auto minmax(0,1fr) ${footer ? `${footerHeight}px` : '0px'}` }}>
    <ContentBlock shuku-edit-id="e-6637fa14-83e6-431b-a0f1-05cd93778d01" title={titleVisual ?? title} headingLevel={1} className="attn-page-content">
    <div shuku-edit-id="e-4ae70573-13b3-48bc-b650-34ea502212e6" className={'attn-activity-main'+(learningFlow?' attn-activity-main--with-flow':'')}>{learningFlow}{children}</div>
    {footer && <footer shuku-edit-id="e-41209f94-7d25-4ef0-a3d5-e48f15c98bdb" className="attn-activity-footer" onKeyDown={event => { if ([' ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(event.key)) event.stopPropagation(); }}>{footer}</footer>}
    </ContentBlock>
  </article>;
}
export function Formula({ latex, label, className = '' }: { latex: string; label: string; className?: string }) { return <MathFormulaBlock className={`attn-activity-formula ${className}`} ariaLabel={label}><MathFormulaStatic latex={latex}/></MathFormulaBlock>; }
export function LessonCheck({ id, title, options, answer, correct, done, onDone }: { id: string; title: string; options: QuestionOption[]; answer: string; correct: string; done: boolean; onDone: () => void }) {
  const checkRoot = useRef<HTMLDivElement>(null);
  const [checked, setChecked] = useState(false);
  const [reviewing,setReviewing]=useState(false);
  const [attempt,setAttempt]=useState('');
  return <div shuku-edit-id="e-be9e3996-8742-4ef7-8cfb-955014bbba01" ref={checkRoot} className="attn-lesson-check">{done && !reviewing ? <div shuku-edit-id="e-a7578dc1-dc15-4cca-a60e-08676bbe2e4c" className="attn-lesson-check-result"><Typography shuku-edit-id="e-3e3df684-66e5-409c-a7d7-f7966fcb8dfc" variant="bodySmall" tone="muted">{title}</Typography><div shuku-edit-id="e-b6cc68b1-e90e-4a8a-ad7d-4fd9cecda973" className="attn-lesson-check-retry"><Typography shuku-edit-id="e-d55f1499-46a4-4253-8417-831560e9df6f" variant="bodySmall" tone="success">{correct}</Typography><Button onClick={()=>{setAttempt(crypto.randomUUID());setChecked(false);setReviewing(true);}}><Typography shuku-edit-id="e-8d49901d-f88c-4067-9982-0c5faeb8ea51" as="span" variant="bodySmall" tone="inherit">重新作答</Typography></Button></div></div> : <Question key={attempt} typeLabel="" showFeedback={checked} persistenceKey={`attention-v20-${id}${attempt?'-'+attempt:''}`} title={title} options={options} answer={answer} feedback={{ correct, initial: '' }} onCheck={result => { setChecked(true); if(result.ok && !checkRoot.current?.closest('[aria-hidden="true"], [inert]')){onDone();setReviewing(false);} }} />}</div>;
}
export function ChoiceButtons({ options, value, onChange, label }: { options: {value: string; label: ReactNode; ariaLabel?: string}[]; value: string; onChange: (value: string)=>void; label: string }) {
  return <div shuku-edit-id="e-025ba5c9-b08d-4e9d-8911-fafe7971e64b" className="attn-choice-row" role="group" aria-label={label}>{options.map(option => <Button key={option.value} aria-label={option.ariaLabel} active={option.value===value} aria-pressed={option.value===value} onClick={()=>onChange(option.value)}><Typography shuku-edit-id="e-e67484b0-cee9-4512-86f5-3bcadf7e8dc8" as="span" variant="bodySmall" tone="inherit">{option.label}</Typography></Button>)}</div>;
}
