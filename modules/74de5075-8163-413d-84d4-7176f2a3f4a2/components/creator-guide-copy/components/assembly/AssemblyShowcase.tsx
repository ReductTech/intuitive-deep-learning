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

  return <div shuku-edit-id="e-f06a6060-b91f-4249-9f0f-fd556a6242e5" ref={root} className={`aipe-replay-cg-kit-assembly-page aipe-replay-cg-creator-typography is-${phase}`} data-assembly-step={step} onKeyDown={event => {
    if (event.target instanceof Element && event.target.closest('button,input,select,textarea,canvas,[role="listbox"]') && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', ' '].includes(event.key)) event.stopPropagation();
  }}>
    {phase !== 'ready' && <div shuku-edit-id="e-0557cdaf-3605-4326-a9e8-f19f88af7da4" className="aipe-replay-cg-assembly-catalog" inert={phase === 'assembling'}><UIKitCatalog/></div>}
    {phase !== 'catalog' && <div shuku-edit-id="e-49c68059-7706-4e88-b68c-42249d642f04" className="aipe-replay-cg-kit-result-shell" inert={phase === 'assembling'}><AssemblyGomoku onComplete={onGameComplete} active={phase === 'ready'}/></div>}
    <div shuku-edit-id="e-de2ba135-ee5b-413d-ab4e-dd5ca4c10cc5" ref={overlay} className="aipe-replay-cg-assembly-overlay" aria-hidden="true"/>
    <div shuku-edit-id="e-e7f0aba8-a003-479a-acbc-75c2552f1737" className="aipe-replay-cg-assembly-toolbar">
      {phase === 'catalog' ? <Button variant="primary" onClick={() => { setStep(0); setPhase('assembling'); }}><Typography shuku-edit-id="e-16aaea95-950f-4a50-a2ca-fdb5786edd1a" as="span" variant="bodySmall" tone="inherit">组装一个教学页面 →</Typography></Button>
        : phase === 'assembling' ? <Button onClick={() => setPhase('ready')}><Typography shuku-edit-id="e-ec64296b-d39f-4380-8446-1884cbac908e" as="span" variant="bodySmall" tone="inherit">跳过动画</Typography></Button>
          : <Button onClick={() => setPhase('catalog')}><Typography shuku-edit-id="e-85d6e1f6-9bc5-488d-88f0-d0ebadbd3aef" as="span" variant="bodySmall" tone="inherit">← 返回组件，重新组装</Typography></Button>}
    </div>
    {phase === 'assembling' && <div shuku-edit-id="e-5584b09a-f322-4c55-b4ba-6e92782c09a6" className="aipe-replay-cg-assembly-progress" role="status" aria-live="polite"><span shuku-edit-id="e-f9a476e8-e92d-4cd7-b5ce-738593e9a050" className="aipe-replay-cg-assembly-progress-dot" aria-hidden="true"/><Typography shuku-edit-id="e-935324d3-a3c0-4ace-ace7-fc6b04b94030" variant="bodySmall" tone="inherit">{steps[step]}</Typography></div>}
  </div>;
}
