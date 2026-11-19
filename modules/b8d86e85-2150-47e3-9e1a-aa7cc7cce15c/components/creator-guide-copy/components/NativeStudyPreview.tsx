import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { LessonFlow, type LessonFlowStep, type LessonStepContext } from "@shuku/course-style/react";
import { creatorGuideAssetUrl } from '../creatorGuideAssets';
import { demoOutcome, GomokuLessonProvider, useGomokuOutcome } from './workflow/copied-course/LessonContext';
import { BoardAsNumbersPage } from './workflow/copied-course/pages/BoardAsNumbersPage/BoardAsNumbersPage';
import { WindowScanPage } from './workflow/copied-course/pages/WindowScanPage/WindowScanPage';
import { KernelDesignPage } from './workflow/copied-course/pages/KernelDesignPage/KernelDesignPage';
import './workflow/copied-course/tailwind.css';
import './NativeStudyPreview.css';

const image = (completed: boolean) => creatorGuideAssetUrl('', `images/multi-format/convolution/gomoku-play${completed ? '-completed' : ''}.webp`);

/** Only the first step is simulated; subsequent steps retain the real lesson flow. */
function ExampleGomokuStep({ complete, isComplete, autoDemo }: LessonStepContext & { autoDemo: boolean }) {
  const { recordOutcome } = useGomokuOutcome();
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!autoDemo) return;
    const timer = setTimeout(() => button.current?.click(), 650);
    return () => clearTimeout(timer);
  }, [autoDemo]);
  function showExample() {
    if (isComplete) return;
    recordOutcome(demoOutcome());
    complete();
  }
  return <div shuku-edit-id="e-f72db7bb-1c04-4b6f-b1f2-89485ebb2856" className="aipe-replay-cg-study-demo" data-preview-scene={isComplete ? 'gomoku-example' : 'gomoku-play'}>
    <img shuku-edit-id="e-0a6863a3-d7f0-49b6-a8b8-f0cf029c1634" src={image(isComplete)} alt={isComplete ? '示例棋局：五子连线' : '从五子棋开始认识卷积核'} draggable={false}/>
    <button shuku-edit-id="e-4e853209-5f14-4440-87cd-ce572cde2283" ref={button} className="aipe-replay-cg-study-example" aria-label="示例棋局" onClick={showExample}/>
  </div>;
}

const PlaybackContext = createContext(false);

// The embedded reader is fixed at 1600px; no resize measurements are needed.
function PreviewCanvas({ children }: { children: ReactNode }) {
  return <div shuku-edit-id="e-36b642ec-77c0-4443-b9d5-d51414d5eae6" className="lesson-canvas-frame relative w-full overflow-hidden" style={{ width: 1600, height: 900, maxWidth: 'none', flexShrink: 0 }}>
    <div shuku-edit-id="e-58510579-8cee-42da-8641-09d36a945e4e" className="course-page-surface aipe-replay-cg-copy-course-shell aipe-replay-cg-copy-tw-canvas origin-top-left" style={{ width: 1600, minWidth: 1600, maxWidth: 'none', height: 900, position: 'relative', transform: 'scale(1)', transformOrigin: 'top left' }}>{children}</div>
  </div>;
}

function AutoStep({ completed, children }: { completed: boolean; children: (active: boolean) => ReactNode }) {
  const running = useContext(PlaybackContext);
  const root = useRef<HTMLDivElement>(null);
  const active = running && !completed;
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => {
      const target = root.current;
      const scroller = target?.closest<HTMLElement>('.aipe-replay-cg-format-native-content');
      if (!target || !scroller) return;
      const container = scroller.getBoundingClientRect();
      const scale = container.height / scroller.clientHeight;
      if (scale > 0) scroller.scrollTo({ top: scroller.scrollTop + (target.getBoundingClientRect().top - container.top) / scale, behavior: 'smooth' });
    }, 250);
    return () => clearTimeout(timer);
  }, [active]);
  return <div shuku-edit-id="e-0608e671-6f38-4db4-a8b3-60c17ff34343" ref={root}>{children(active)}</div>;
}

const previewSteps: LessonFlowStep[] = [
  { id: 'd4af3cf5-56ae-4416-a37f-bff6135f3701', revealMode: 'immediate', render: context => <AutoStep completed={context.isComplete}>{active => <ExampleGomokuStep {...context} autoDemo={active}/>}</AutoStep> },
  { id: '613473b0-4ca0-40e8-a7cb-9c22a1c334d9', revealMode: 'immediate', render: context => <AutoStep completed={context.isComplete}>{active => <PreviewCanvas><BoardAsNumbersPage onComplete={context.complete} autoDemo={active}/></PreviewCanvas>}</AutoStep> },
  { id: '821bd225-32a3-43fb-95bb-01592ae8c50a', revealMode: 'immediate', render: context => <AutoStep completed={context.isComplete}>{active => <PreviewCanvas><WindowScanPage onComplete={context.complete} autoDemo={active}/></PreviewCanvas>}</AutoStep> },
  { id: '301b37a7-6437-456c-9303-60ee58a997c9', revealMode: 'immediate', completesLesson: true, render: context => <AutoStep completed={context.isComplete}>{active => <PreviewCanvas><KernelDesignPage onComplete={context.complete} autoDemo={active}/></PreviewCanvas>}</AutoStep> },
];

export function NativeStudyPreview() {
  const [progressKey] = useState(() => `ai-practice-education:creator-guide-copy:convolution-preview:${crypto.randomUUID()}`);
  const root = useRef<HTMLElement>(null);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    let intersecting = false;
    const update = () => setRunning(intersecting && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { intersecting = entry.isIntersecting; update(); });
    if (root.current) observer.observe(root.current);
    document.addEventListener('visibilitychange', update);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, []);
  return <main shuku-edit-id="e-874576fb-0eed-4ae0-b3d8-d9130951d4ee" ref={root} className="aipe-replay-cg-study-embedded aipe-replay-cg-copy-course-shell aipe-replay-cg-copy-tw-root">
    <PlaybackContext.Provider value={running}><GomokuLessonProvider><LessonFlow steps={previewSteps} persistenceKey={progressKey}/></GomokuLessonProvider></PlaybackContext.Provider>
  </main>;
}
