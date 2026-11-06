import { useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { Button, Feedback, Question, Typography, moduleAssetUrl, type QuestionCheckResult } from '../../../shared/react';
import { isObservationState, observationReducer, type ObservationState } from '../../model/AttentionLessonContext';
import { moduleIdentity } from '../../outlines.json';
import './AttentionObservationCoverPage.css';

const storageKey = 'attention-mechanism:observation-cover-v1';
const sceneUrls = [1, 2].map(round => moduleAssetUrl(moduleIdentity.id, `observation-cover/shop-round-${round}.png`));

function restore(): ObservationState {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
    if (isObservationState(value)) return value;
  } catch { /* The activity also works without browser storage. */ }
  return { version: 1, attempt: crypto.randomUUID(), phase: 'first-observe', firstAnswer: null, secondAnswer: null };
}

function ShopScene({ round }: { round: 1 | 2 }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [retry, setRetry] = useState(0);
  return <div className="attn-cover-scene" data-capture-ready={loaded || failed} aria-busy={!loaded && !failed}>
    {failed ? <div className="attn-cover-placeholder" role="status">
      <Typography variant="h3">场景暂时未加载</Typography>
      <Button onClick={() => { setFailed(false); setLoaded(false); setRetry(value => value + 1); }}>重新加载图片</Button>
    </div> : <>
      {!loaded && <Typography className="attn-cover-loading" variant="body" tone="muted" role="status">正在准备商店场景…</Typography>}
      <img key={retry} src={sceneUrls[round - 1]} alt={`小明站在商店货架旁，货架上有${round === 1 ? '两' : '三'}瓶蓝色冰水、一盒果汁和两只水果。`}
        onLoad={() => setLoaded(true)} onError={() => setFailed(true)} draggable={false} />
    </>}
  </div>;
}

export function AttentionObservationCoverPage({ onComplete, isComplete }: { onComplete: () => void; isComplete: boolean }) {
  // This variant deliberately owns its state: trying it must not change C01.
  const [state, dispatch] = useReducer(observationReducer, undefined, restore);
  const root = useRef<HTMLElement>(null);
  const previousPhase = useRef(state.phase);
  const done = state.phase === 'complete';
  const first = state.phase.startsWith('first');
  const observing = state.phase.endsWith('observe');
  const briefing = state.phase === 'second-brief';
  const answered = state.phase === 'first-recall' && state.firstAnswer !== null;
  useEffect(() => {
    if (!root.current?.closest('[aria-hidden="true"]')) {
      try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { /* Keep in-memory progress. */ }
      if (done && !isComplete) onComplete();
    }
  }, [state, done, isComplete, onComplete]);
  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    element.inert = Boolean(element.closest('[aria-hidden="true"]'));
    if (!element.inert && previousPhase.current !== state.phase) element.querySelector<HTMLElement>('[data-task-heading]')?.focus({ preventScroll: true });
    previousPhase.current = state.phase;
  }, [state.phase]);
  const answer = (result: QuestionCheckResult) => {
    if (!result.empty && result.answer.length === 1) dispatch({ type: 'answer', value: Number(result.answer[0]) });
  };
  const stopNavigation = (event: React.KeyboardEvent) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(event.key)) event.stopPropagation();
  };
  const steps = ['观察货架', '隐藏图片', '凭印象作答'];
  return <article ref={root} className="attn-cover-page" data-observation-phase={state.phase} aria-label="商店场景观察体验">
    <section className="attn-cover-copy" onKeyDown={stopNavigation}>
      <Typography variant="bodySmall" tone="accent">注意力机制 · 开场体验</Typography>
      <Typography as="h1" variant="display" tone="accent" className="attn-cover-title">任务决定<br />关注重点</Typography>
      <div className="attn-cover-task" aria-live="polite">
        <div className="attn-cover-round"><span aria-hidden="true" /><Typography variant="body" tone="accent">{done ? '两轮之后 · 回看关注点' : first ? '第一轮 · 先看一眼' : '第二轮 · 带着任务看'}</Typography></div>
        <Typography as="h2" variant="h3" tabIndex={-1} data-task-heading>
          {done ? <>刚才，你主动<br />寻找了什么？</> : briefing ? <>这一次，先找出<br />有几瓶冰水。</> : answered ? <>刚才货架上<br />有 2 瓶冰水。</> : observing ? first ? <>小明走进商店，<br />先看一眼货架。</> : <>这次货架上<br />有几瓶冰水？</> : <>刚才货架上<br />有几瓶冰水？</>}
        </Typography>
        {observing ? <>
          <Typography variant="bodySmall" tone="muted">{first ? '看好了，再把图片隐藏。' : '带着问题观察，看好了再隐藏。'}</Typography>
          <Button variant="primary" className="attn-cover-primary" onClick={() => dispatch({ type: 'hide' })}><Typography as="span" variant="body" tone="inherit">隐藏图片，开始回忆</Typography></Button>
          <Typography variant="bodySmall" tone="muted">按自己的节奏观察，不计时。</Typography>
        </> : done ? <>
          <Typography variant="bodySmall" tone="muted">带着问题，观察就有了目标。</Typography>
          <Button onClick={() => dispatch({ type: 'retry', attempt: crypto.randomUUID() })}>重新体验</Button>
        </> : briefing ? <>
          <Typography variant="bodySmall" tone="muted">记住这个任务，再打开补货后的场景。</Typography>
          <Button variant="primary" onClick={() => dispatch({ type: 'show-second' })}>带着任务看新场景</Button>
        </> : answered ? <>
          <Feedback status={state.firstAnswer === 2 ? 'correct' : 'hint'} message={state.firstAnswer === 2 ? '你记住了 2 瓶。' : `你回答了 ${state.firstAnswer} 瓶。回想一下，刚才先注意到了什么？`} />
          <Button variant="primary" onClick={() => dispatch({ type: 'next-round' })}>进入第二轮</Button>
        </> : <Question key={`${state.attempt}-${first}`} className="attn-cover-question" title="请选择你记得的数量" typeLabel="凭印象作答" showFeedback={false}
          persistenceKey={`attention-cover-${state.attempt}-${first ? 1 : 2}`} options={(first ? [1, 2, 3] : [2, 3, 4]).map(value => ({ value: String(value), label: `${value} 瓶` }))} answer={first ? '2' : '3'} onCheck={answer} />}
      </div>
    </section>
    <section className="attn-cover-visual" aria-label={done ? '两轮观察结果' : '观察场景'}>
      {observing ? <ShopScene key={first ? 1 : 2} round={first ? 1 : 2} /> : done ? <div className="attn-cover-results">
        <Typography variant="h2" tone="accent">问题引导我们<br />选择相关信息</Typography>
        <div className="attn-cover-result-grid">{([1, 2] as const).map(round => <section key={round}>
          <Typography variant="h3">{round === 1 ? '先看后问' : '先问后看'}</Typography>
          <ShopScene round={round} />
          <Typography variant="bodySmall">你的回答：{round === 1 ? state.firstAnswer : state.secondAnswer} 瓶 · 实际：{round === 1 ? 2 : 3} 瓶</Typography>
        </section>)}</div>
        <Typography variant="bodySmall" tone="muted">这是注意力的生活类比，不是受控实验；两次对错不能用来判断记忆能力。</Typography>
      </div> : <div className="attn-cover-placeholder">
        <Typography variant="bodySmall" tone="accent">{briefing ? '先知道要找什么' : '图片已隐藏'}</Typography>
        <Typography variant="h2">{briefing ? '货架上有几瓶冰水？' : '只凭刚才的印象回答'}</Typography>
        <Typography variant="bodySmall" tone="muted">{briefing ? '带着这个问题，再观察一次。' : '选择你记得的数量。'}</Typography>
      </div>}
    </section>
    <footer className="attn-cover-footer" aria-label="体验步骤">
      <span className="attn-cover-rule" />
      {steps.map((step, index) => <div key={step} className="attn-cover-step">
        {index > 0 && <Typography as="span" variant="body" tone="light" aria-hidden="true">→</Typography>}
        <Typography as="span" variant="bodySmall" tone={(observing ? index === 0 : index === 2) ? 'accent' : 'muted'}>{step}</Typography>
      </div>)}
      <span className="attn-cover-rule" />
    </footer>
  </article>;
}
