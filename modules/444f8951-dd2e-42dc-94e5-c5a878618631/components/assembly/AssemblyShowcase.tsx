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

  return <div shuku-edit-id="e-88c09879-7b68-4ba4-a1ab-90f8c1f73ebb" ref={root} className={`cg-kit-assembly-page cg-creator-typography is-${phase}`} data-assembly-step={step} onKeyDown={event => {
    if (event.target instanceof Element && event.target.closest('button,input,select,textarea,canvas,[role="listbox"]') && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', ' '].includes(event.key)) event.stopPropagation();
  }}>
    {phase !== 'ready' && <div shuku-edit-id="e-fabe7c7a-9cf9-4b9b-a518-0d13e5daf426" className="cg-assembly-catalog" inert={phase === 'assembling'}><UIKitCatalog/></div>}
    {phase !== 'catalog' && <div shuku-edit-id="e-d8561bfd-8336-47fd-97ea-2f8df116c5b6" className="cg-kit-result-shell" inert={phase === 'assembling'}><AssemblyGomoku onComplete={onGameComplete} active={phase === 'ready'}/></div>}
    <div shuku-edit-id="e-23d4b77d-d251-42f8-8e8e-da86cb8ab543" ref={overlay} className="cg-assembly-overlay" aria-hidden="true"/>
    <div shuku-edit-id="e-2f885f89-7f98-4538-9ad2-3bf1c4e1da4d" className="cg-assembly-toolbar">
      {phase === 'catalog' ? <Button variant="primary" onClick={() => { setStep(0); setPhase('assembling'); }}><Typography shuku-edit-id="e-02f31c7e-a5d2-43e5-acff-09a32b1ab38c" as="span" variant="bodySmall" tone="inherit">组装一个教学页面 →</Typography></Button>
        : phase === 'assembling' ? <Button onClick={() => setPhase('ready')}><Typography shuku-edit-id="e-727fead3-fe01-40d2-83c2-512acd878f93" as="span" variant="bodySmall" tone="inherit">跳过动画</Typography></Button>
          : <Button onClick={() => setPhase('catalog')}><Typography shuku-edit-id="e-e2655364-7efc-41ff-a227-b5f359f4d0da" as="span" variant="bodySmall" tone="inherit">← 返回组件，重新组装</Typography></Button>}
    </div>
    {phase === 'assembling' && <div shuku-edit-id="e-ac04e583-e9db-4ca7-ba3c-30ca43b4f1c6" className="cg-assembly-progress" role="status" aria-live="polite"><span shuku-edit-id="e-995fa9b8-8fe6-44fd-b062-210a2ba029f2" className="cg-assembly-progress-dot" aria-hidden="true"/><Typography shuku-edit-id="e-37f713ff-4815-42f5-8743-8b9be0ff6298" variant="bodySmall" tone="inherit">{steps[step]}</Typography></div>}
  </div>;
}
