import gomoku_play_completedAsset0 from "../assets/images/multi-format/convolution/gomoku-play-completed.webp";
import gomoku_playAsset1 from "../assets/images/multi-format/convolution/gomoku-play.webp";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { LessonFlow, type LessonFlowStep, type LessonStepContext } from "@shuku/course-style/react";
import { demoOutcome, GomokuLessonProvider, useGomokuOutcome } from './workflow/copied-course/LessonContext';
import { BoardAsNumbersPage } from './workflow/copied-course/pages/BoardAsNumbersPage/BoardAsNumbersPage';
import { WindowScanPage } from './workflow/copied-course/pages/WindowScanPage/WindowScanPage';
import { KernelDesignPage } from './workflow/copied-course/pages/KernelDesignPage/KernelDesignPage';
import './workflow/copied-course/tailwind.css';
import './NativeStudyPreview.css';

const image = (completed: boolean) => completed ? gomoku_play_completedAsset0 : gomoku_playAsset1;

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
  return <div shuku-edit-id="e-87815bd4-cda6-4930-868a-32ef08a340e5" className="cg-study-demo" data-preview-scene={isComplete ? 'gomoku-example' : 'gomoku-play'}>
    <img shuku-edit-id="e-5f02f619-7e4e-47b6-a995-ae65bd834b6f" src={image(isComplete)} alt={isComplete ? '示例棋局：五子连线' : '从五子棋开始认识卷积核'} draggable={false}/>
    <button shuku-edit-id="e-212f3e86-ebb2-4c89-8a01-5029c2459930" ref={button} className="cg-study-example" aria-label="示例棋局" onClick={showExample}/>
  </div>;
}

const PlaybackContext = createContext(false);

// The embedded reader is fixed at 1600px; no resize measurements are needed.
function PreviewCanvas({ children }: { children: ReactNode }) {
  return <div shuku-edit-id="e-25e40b58-635f-4786-8fd9-c31fc6269653" className="lesson-canvas-frame relative w-full overflow-hidden" style={{ width: 1600, height: 900, maxWidth: 'none', flexShrink: 0 }}>
    <div shuku-edit-id="e-be21f6f1-3ec7-4b1a-a14b-428b7391614c" className="course-page-surface cg-copy-course-shell cg-copy-tw-canvas origin-top-left" style={{ width: 1600, minWidth: 1600, maxWidth: 'none', height: 900, position: 'relative', transform: 'scale(1)', transformOrigin: 'top left' }}>{children}</div>
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
      const scroller = target?.closest<HTMLElement>('.cg-format-native-content');
      if (!target || !scroller) return;
      const container = scroller.getBoundingClientRect();
      const scale = container.height / scroller.clientHeight;
      if (scale > 0) scroller.scrollTo({ top: scroller.scrollTop + (target.getBoundingClientRect().top - container.top) / scale, behavior: 'smooth' });
    }, 250);
    return () => clearTimeout(timer);
  }, [active]);
  return <div shuku-edit-id="e-97e2d155-89ee-4c0c-8bea-5c3a4f7495ef" ref={root}>{children(active)}</div>;
}

const previewSteps: LessonFlowStep[] = [
  { id: '2f973013-a68b-41b8-a60a-d7a2ce638425', revealMode: 'immediate', render: context => <AutoStep completed={context.isComplete}>{active => <ExampleGomokuStep {...context} autoDemo={active}/>}</AutoStep> },
  { id: '8c1957ca-507e-46b7-90ea-19967ee71ef8', revealMode: 'immediate', render: context => <AutoStep completed={context.isComplete}>{active => <PreviewCanvas><BoardAsNumbersPage onComplete={context.complete} autoDemo={active}/></PreviewCanvas>}</AutoStep> },
  { id: '8973b376-0795-4b82-9fc6-eb88c3daa262', revealMode: 'immediate', render: context => <AutoStep completed={context.isComplete}>{active => <PreviewCanvas><WindowScanPage onComplete={context.complete} autoDemo={active}/></PreviewCanvas>}</AutoStep> },
  { id: 'eef2860e-bea5-4d68-ac93-f97f46d64084', revealMode: 'immediate', completesLesson: true, render: context => <AutoStep completed={context.isComplete}>{active => <PreviewCanvas><KernelDesignPage onComplete={context.complete} autoDemo={active}/></PreviewCanvas>}</AutoStep> },
];

export function NativeStudyPreview() {
  const [progressKey] = useState(() => `creator-guide:convolution-preview:${crypto.randomUUID()}`);
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
  return <main shuku-edit-id="e-eededd8d-ec98-41b4-b8be-02ff1ee4b9ee" ref={root} className="cg-study-embedded cg-copy-course-shell cg-copy-tw-root">
    <PlaybackContext.Provider value={running}><GomokuLessonProvider><LessonFlow steps={previewSteps} persistenceKey={progressKey}/></GomokuLessonProvider></PlaybackContext.Provider>
  </main>;
}
