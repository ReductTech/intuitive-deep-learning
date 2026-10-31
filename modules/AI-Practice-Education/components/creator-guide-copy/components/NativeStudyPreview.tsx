import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { LessonFlow, type LessonFlowStep, type LessonStepContext } from '../../../../shared/react';
import { creatorGuideAssetUrl } from '../creatorGuideAssets';
import { demoOutcome, GomokuLessonProvider, useGomokuOutcome } from './workflow/copied-course/LessonContext';
import { BoardAsNumbersPage } from './workflow/copied-course/pages/BoardAsNumbersPage/BoardAsNumbersPage';
import { WindowScanPage } from './workflow/copied-course/pages/WindowScanPage/WindowScanPage';
import { KernelDesignPage } from './workflow/copied-course/pages/KernelDesignPage/KernelDesignPage';
import './workflow/copied-course/tailwind.css';
import './NativeStudyPreview.css';

const image = (completed: boolean) => creatorGuideAssetUrl('', `images/multi-format/convolution/gomoku-play${completed ? '-completed' : ''}.jpg`);

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
  return <div className="aipe-replay-cg-study-demo" data-preview-scene={isComplete ? 'gomoku-example' : 'gomoku-play'}>
    <img src={image(isComplete)} alt={isComplete ? '示例棋局：五子连线' : '从五子棋开始认识卷积核'} draggable={false}/>
    <button ref={button} className="aipe-replay-cg-study-example" aria-label="示例棋局" onClick={showExample}/>
  </div>;
}

const PlaybackContext = createContext(false);

// The embedded reader is fixed at 1600px; no resize measurements are needed.
function PreviewCanvas({ children }: { children: ReactNode }) {
  return <div className="lesson-canvas-frame relative w-full overflow-hidden" style={{ width: 1600, height: 900, maxWidth: 'none', flexShrink: 0 }}>
    <div className="course-page-surface aipe-replay-cg-copy-course-shell aipe-replay-cg-copy-tw-canvas origin-top-left" style={{ width: 1600, minWidth: 1600, maxWidth: 'none', height: 900, position: 'relative', transform: 'scale(1)', transformOrigin: 'top left' }}>{children}</div>
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
  return <div ref={root}>{children(active)}</div>;
}

const previewSteps: LessonFlowStep[] = [
  { id: 'gomoku-play', revealMode: 'immediate', render: context => <AutoStep completed={context.isComplete}>{active => <ExampleGomokuStep {...context} autoDemo={active}/>}</AutoStep> },
  { id: 'board-as-numbers', revealMode: 'immediate', render: context => <AutoStep completed={context.isComplete}>{active => <PreviewCanvas><BoardAsNumbersPage onComplete={context.complete} autoDemo={active}/></PreviewCanvas>}</AutoStep> },
  { id: 'window-scan', revealMode: 'immediate', render: context => <AutoStep completed={context.isComplete}>{active => <PreviewCanvas><WindowScanPage onComplete={context.complete} autoDemo={active}/></PreviewCanvas>}</AutoStep> },
  { id: 'kernel-design', revealMode: 'immediate', completesLesson: true, render: context => <AutoStep completed={context.isComplete}>{active => <PreviewCanvas><KernelDesignPage onComplete={context.complete} autoDemo={active}/></PreviewCanvas>}</AutoStep> },
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
  return <main ref={root} className="aipe-replay-cg-study-embedded aipe-replay-cg-copy-course-shell aipe-replay-cg-copy-tw-root">
    <PlaybackContext.Provider value={running}><GomokuLessonProvider><LessonFlow steps={previewSteps} persistenceKey={progressKey}/></GomokuLessonProvider></PlaybackContext.Provider>
  </main>;
}
