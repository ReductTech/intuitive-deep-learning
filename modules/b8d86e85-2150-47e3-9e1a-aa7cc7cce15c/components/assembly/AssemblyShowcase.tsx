import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
import { UIKitCatalog } from './UIKitCatalog';
import { AssemblyGomoku } from './AssemblyGomoku';
import { playAssemblyTimeline } from './assemblyTimeline';
import './AssemblyShowcase.css';

type Phase = 'catalog' | 'assembling' | 'ready';
const steps = ['展开页面骨架', '让文字与控件归位', '加入棋盘与场景'];
const onGameComplete = () => undefined;

export function AssemblyShowcase() {
  const [phase, setPhase] = useState<Phase>('catalog');
  const [step, setStep] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (phase !== 'assembling' || !root.current || !overlay.current) return;
    return playAssemblyTimeline(root.current, overlay.current, setStep, () => setPhase('ready'));
  }, [phase]);

  const previousPhase = useRef(phase);
  useEffect(() => {
    if ((previousPhase.current === 'assembling' && phase === 'ready') || (previousPhase.current !== 'catalog' && phase === 'catalog')) {
      root.current?.querySelector<HTMLButtonElement>('.cg-assembly-toolbar button')?.focus({ preventScroll: true });
    }
    previousPhase.current = phase;
  }, [phase]);

  return <div shuku-edit-id="e-ab787589-379c-4e13-9d32-fa34bad8ef88" ref={root} className={`cg-kit-assembly-page cg-creator-typography is-${phase}`} data-assembly-step={step} onKeyDown={event => {
    if (event.target instanceof Element && event.target.closest('button,input,select,textarea,canvas,[role="listbox"]') && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', ' '].includes(event.key)) event.stopPropagation();
  }}>
    {phase !== 'ready' && <div shuku-edit-id="e-7383c7dd-8f38-4f18-a0fa-47f803d34ffc" className="cg-assembly-catalog" inert={phase === 'assembling'}><UIKitCatalog/></div>}
    {phase !== 'catalog' && <div shuku-edit-id="e-6546db48-ae5c-4211-b113-e3d986d630c6" className="cg-kit-result-shell" inert={phase === 'assembling'}><AssemblyGomoku onComplete={onGameComplete} active={phase === 'ready'}/></div>}
    <div shuku-edit-id="e-14a00d75-d031-4176-b555-71104623d4a2" ref={overlay} className="cg-assembly-overlay" aria-hidden="true"/>
    <div shuku-edit-id="e-8d9bb9ad-09c8-405e-8d01-a9eac00411f8" className="cg-assembly-toolbar">
      {phase === 'catalog' ? <Button variant="primary" onClick={() => { setStep(0); setPhase('assembling'); }}><Typography shuku-edit-id="e-51f7ac26-0c89-413c-a100-ac3fc204250a" as="span" variant="bodySmall" tone="inherit">组装一个教学页面 →</Typography></Button>
        : phase === 'assembling' ? <Button onClick={() => setPhase('ready')}><Typography shuku-edit-id="e-6306977f-30ee-4ba2-a639-cb27b5bec2f1" as="span" variant="bodySmall" tone="inherit">跳过动画</Typography></Button>
          : <Button onClick={() => setPhase('catalog')}><Typography shuku-edit-id="e-057128c2-9211-45fa-88de-31f9184c9c4f" as="span" variant="bodySmall" tone="inherit">← 返回组件，重新组装</Typography></Button>}
    </div>
    {phase === 'assembling' && <div shuku-edit-id="e-54e5660c-4202-40f6-bb4d-9b15cf80daf6" className="cg-assembly-progress" role="status" aria-live="polite"><span shuku-edit-id="e-1ace6121-3a1f-482f-b6b4-27da1d3c3554" className="cg-assembly-progress-dot" aria-hidden="true"/><Typography shuku-edit-id="e-11786934-7a7d-4c3f-a608-6a28d146906d" variant="bodySmall" tone="inherit">{steps[step]}</Typography></div>}
  </div>;
}
