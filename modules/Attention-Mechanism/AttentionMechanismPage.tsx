import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type SyntheticEvent } from 'react';
import { LessonFlow, ModuleShell, type LessonFlowStep, type LessonStepContext } from '../shared/react';
import '../shared/react/styles.css';
import '../shared/react/ui-kit.css';
import '../shared/react/presentation.css';
import { AttentionLessonProvider } from './model/AttentionLessonContext';
import { ATTENTION_PROGRESS_ID, attentionCourse } from './course';
import './AttentionMechanismPage.css';

const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 900;
// Guide unlocks must not inherit the presentation player's navigation progress.
const GUIDE_PROGRESS_ID = `${ATTENTION_PROGRESS_ID}-sequential-guide-v2`;

function AttentionGuideCanvas({ id, children, onInteract }: { id: string; children: ReactNode; onInteract: (event: SyntheticEvent) => void }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const updateScale = () => {
      // Preserve fractional CSS pixels so the scaled surface fits both frame edges.
      const width = frame.getBoundingClientRect().width;
      if (width > 0) setScale(Math.min(1, width / CANVAS_WIDTH));
    };
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={frameRef}
      id={id}
      className="lesson-canvas-frame attention-guide-canvas"
      style={{ height: CANVAS_HEIGHT * scale }}
    >
      <div className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }} onClickCapture={onInteract} onChangeCapture={onInteract}>
        {children}
      </div>
    </div>
  );
}

function AttentionGuideStep({ id, component, context }: { id: string; component: (context: LessonStepContext) => ReactNode; context: LessonStepContext }) {
  const [interacted,setInteracted]=useState(false);
  const complete=useCallback(()=>{
    // A restored result is not a new interaction. Recheck the page's own goal
    // after the learner operates its controls, instead of cascading on mount.
    if(interacted)context.complete();
  },[interacted,context.complete]);
  const onInteract=(event:SyntheticEvent)=>{
    if(event.target instanceof Element && event.target.closest('button,input,select,[role="slider"],[role="button"]'))setInteracted(true);
  };
  return <AttentionGuideCanvas id={id} onInteract={onInteract}>{component({...context,complete})}</AttentionGuideCanvas>;
}

export const attentionGuideLessonSteps: LessonFlowStep[] = attentionCourse.map(
  ({ id, revealMode, component }) => ({
    id,
    revealMode,
    render: (context) => <AttentionGuideStep id={id} component={component} context={context}/>,
  }),
);

export function AttentionMechanismPage() {
  const [guideProgressKey, setGuideProgressKey] = useState<string | null>(null);
  const preparedRun = useRef(false);

  useLayoutEffect(() => {
    // Keep available width stable when scaled pages cross the vertical scroll threshold.
    const documentRoot = document.documentElement;
    documentRoot.classList.add('attention-guide-document');
    return () => documentRoot.classList.remove('attention-guide-document');
  }, []);

  useLayoutEffect(() => {
    // Opening the guide starts a new reading run. Saved activity/model results
    // remain available, but must never restore already-unlocked pages.
    if (preparedRun.current) return;
    preparedRun.current = true;
    const progressKey = `lesson-flow:${GUIDE_PROGRESS_ID}`;
    try {
      const raw = localStorage.getItem(progressKey);
      if (raw !== null) localStorage.setItem(`${progressKey}:previous-session`, raw);
      localStorage.setItem(progressKey, JSON.stringify({ completedIds: [], visibleCount: 1, completed: false }));
      setGuideProgressKey(GUIDE_PROGRESS_ID);
    } catch {
      // With storage disabled, isolate this run from old telemetry progress too.
      setGuideProgressKey(`${GUIDE_PROGRESS_ID}-run-${crypto.randomUUID()}`);
    }
  }, []);
  useEffect(() => {
    document.title = '注意力机制 · 互动学习';
    let requestedId = '';
    const content = document.querySelector('.attention-guide-shell');
    const observer = new MutationObserver(() => scrollWhenAvailable());
    function scrollWhenAvailable() {
      const chapter = document.getElementById(requestedId);
      if (!chapter) return;
      chapter.scrollIntoView({ block: 'start' });
      observer.disconnect();
    }
    const followAnchor = () => {
      observer.disconnect();
      requestedId = window.location.hash.slice(1);
      if (requestedId === 'C29') { requestedId = 'C28'; window.history.replaceState(null, '', '#C28'); }
      if (['C31'].includes(requestedId)) { requestedId = 'C32'; window.history.replaceState(null, '', '#C32'); }
      if (requestedId === 'C23' || requestedId === 'C22') { requestedId = 'C21'; window.history.replaceState(null, '', '#C21'); }
      if (!attentionCourse.some((chapter) => chapter.id === requestedId)) return;
      // Wait only until the requested chapter is revealed, then leave scrolling to the learner.
      if (content) observer.observe(content, { childList: true, subtree: true });
      scrollWhenAvailable();
    };
    followAnchor();
    window.addEventListener('hashchange', followAnchor);
    return () => { observer.disconnect(); window.removeEventListener('hashchange', followAnchor); };
  }, []);

  return (
    <AttentionLessonProvider>
      <ModuleShell shellClassName="course-shell course-blog-shell attention-guide-shell">
        {guideProgressKey && <LessonFlow key={guideProgressKey} steps={attentionGuideLessonSteps} persistenceKey={guideProgressKey} />}
      </ModuleShell>
    </AttentionLessonProvider>
  );
}
