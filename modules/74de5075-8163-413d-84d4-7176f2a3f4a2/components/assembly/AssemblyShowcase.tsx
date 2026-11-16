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

  return <div shuku-edit-id="e-afeb85f1-9d6a-410b-8711-0e6208340175" ref={root} className={`cg-kit-assembly-page cg-creator-typography is-${phase}`} data-assembly-step={step} onKeyDown={event => {
    if (event.target instanceof Element && event.target.closest('button,input,select,textarea,canvas,[role="listbox"]') && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', ' '].includes(event.key)) event.stopPropagation();
  }}>
    {phase !== 'ready' && <div shuku-edit-id="e-968c39c0-a29b-4039-8678-f70e7e893cec" className="cg-assembly-catalog" inert={phase === 'assembling'}><UIKitCatalog/></div>}
    {phase !== 'catalog' && <div shuku-edit-id="e-55a70d1e-5666-4fe2-9cbe-464b168394d2" className="cg-kit-result-shell" inert={phase === 'assembling'}><AssemblyGomoku onComplete={onGameComplete} active={phase === 'ready'}/></div>}
    <div shuku-edit-id="e-030a7ff9-336f-4c3c-a08e-fd2c4e9dbd1f" ref={overlay} className="cg-assembly-overlay" aria-hidden="true"/>
    <div shuku-edit-id="e-ba92ec12-bdc5-4499-8fce-1717957df3bc" className="cg-assembly-toolbar">
      {phase === 'catalog' ? <Button variant="primary" onClick={() => { setStep(0); setPhase('assembling'); }}><Typography shuku-edit-id="e-82ba07e7-bf18-4f42-bdf4-059897c3c859" as="span" variant="bodySmall" tone="inherit">组装一个教学页面 →</Typography></Button>
        : phase === 'assembling' ? <Button onClick={() => setPhase('ready')}><Typography shuku-edit-id="e-1bafcca7-6710-48f7-bb4b-ee3419e8de8a" as="span" variant="bodySmall" tone="inherit">跳过动画</Typography></Button>
          : <Button onClick={() => setPhase('catalog')}><Typography shuku-edit-id="e-60c74f1e-beb2-4edf-82a3-21162deb0bc2" as="span" variant="bodySmall" tone="inherit">← 返回组件，重新组装</Typography></Button>}
    </div>
    {phase === 'assembling' && <div shuku-edit-id="e-148a84c3-2946-4ce2-85d4-8a923a69619b" className="cg-assembly-progress" role="status" aria-live="polite"><span shuku-edit-id="e-9d27de8e-a9d4-4b2b-8c15-cdc9e40754b7" className="cg-assembly-progress-dot" aria-hidden="true"/><Typography shuku-edit-id="e-c51a9ffa-4265-4846-bd08-30410ea1fbdf" variant="bodySmall" tone="inherit">{steps[step]}</Typography></div>}
  </div>;
}
