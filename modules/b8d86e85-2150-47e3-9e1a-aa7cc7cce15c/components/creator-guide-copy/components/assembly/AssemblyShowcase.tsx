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
      root.current?.querySelector<HTMLButtonElement>('.aipe-replay-cg-assembly-toolbar button')?.focus({ preventScroll: true });
    }
    previousPhase.current = phase;
  }, [phase]);

  return <div shuku-edit-id="e-a5cedf59-ab03-408c-98b6-7f9674f9e302" ref={root} className={`aipe-replay-cg-kit-assembly-page aipe-replay-cg-creator-typography is-${phase}`} data-assembly-step={step} onKeyDown={event => {
    if (event.target instanceof Element && event.target.closest('button,input,select,textarea,canvas,[role="listbox"]') && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', ' '].includes(event.key)) event.stopPropagation();
  }}>
    {phase !== 'ready' && <div shuku-edit-id="e-c8436266-0ee2-4af2-9c15-4f3f84b2fcb5" className="aipe-replay-cg-assembly-catalog" inert={phase === 'assembling'}><UIKitCatalog/></div>}
    {phase !== 'catalog' && <div shuku-edit-id="e-b4b9ada7-fa55-4563-8063-63ffc19ee0d3" className="aipe-replay-cg-kit-result-shell" inert={phase === 'assembling'}><AssemblyGomoku onComplete={onGameComplete} active={phase === 'ready'}/></div>}
    <div shuku-edit-id="e-b4b396d4-5143-4c71-b6d0-78fce908ffce" ref={overlay} className="aipe-replay-cg-assembly-overlay" aria-hidden="true"/>
    <div shuku-edit-id="e-a45e972c-f5a2-4a2c-81dd-d910c681d6c1" className="aipe-replay-cg-assembly-toolbar">
      {phase === 'catalog' ? <Button variant="primary" onClick={() => { setStep(0); setPhase('assembling'); }}><Typography shuku-edit-id="e-7ee0ce8f-069d-4192-87b3-b8f8a03d5be7" as="span" variant="bodySmall" tone="inherit">组装一个教学页面 →</Typography></Button>
        : phase === 'assembling' ? <Button onClick={() => setPhase('ready')}><Typography shuku-edit-id="e-d30a2443-a82d-42b1-a2fc-731586eb4d8e" as="span" variant="bodySmall" tone="inherit">跳过动画</Typography></Button>
          : <Button onClick={() => setPhase('catalog')}><Typography shuku-edit-id="e-ea7ce9a4-dba1-449e-ae57-c006d6ca4a8b" as="span" variant="bodySmall" tone="inherit">← 返回组件，重新组装</Typography></Button>}
    </div>
    {phase === 'assembling' && <div shuku-edit-id="e-375041e3-c9b5-4220-a9f0-3536283b08a8" className="aipe-replay-cg-assembly-progress" role="status" aria-live="polite"><span shuku-edit-id="e-c8017f78-aaf4-442d-b047-4cbcdcd18286" className="aipe-replay-cg-assembly-progress-dot" aria-hidden="true"/><Typography shuku-edit-id="e-74bdcc84-5af1-4f9d-b360-5a199f96cd1d" variant="bodySmall" tone="inherit">{steps[step]}</Typography></div>}
  </div>;
}
