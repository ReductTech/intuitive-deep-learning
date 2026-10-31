import { ATTENTION_PAGE_COUNT } from '../../model/coursePageNumber';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { ContentBlock, Button, Feedback, Question, Typography, type QuestionCheckResult } from '../../../shared/react';
import { DeskVectorScene } from '../../components/DeskVectorScene';
import { useAttentionLesson } from '../../model/AttentionLessonContext';
import './AttentionObservationPage.css';

export function AttentionObservationPage({ onComplete, isComplete }: { onComplete: () => void; isComplete: boolean }) {
  const { observation: state, dispatchObservation: dispatch } = useAttentionLesson();
  const root = useRef<HTMLElement>(null);
  const previousView = useRef(`${state.phase}-${state.firstAnswer}`);
  const done = state.phase === 'complete';
  const firstRound = state.phase.startsWith('first');
  const briefing = state.phase === 'second-brief';
  const observing = state.phase.endsWith('observe');
  const answeredFirst = state.phase === 'first-recall' && state.firstAnswer !== null;

  useEffect(() => {
    // Shared thumbnails mount this component too; only the main surface reports completion.
    if (done && !isComplete && !root.current?.closest('[aria-hidden="true"]')) {
      onComplete();
    }
  }, [done, onComplete, isComplete]);

  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const preview = Boolean(element.closest('[aria-hidden="true"]'));
    element.inert = preview;
    const view = `${state.phase}-${state.firstAnswer}`;
    if (!preview && previousView.current !== view) {
      element.querySelector<HTMLElement>('.attn-observation-task h2')?.focus({ preventScroll: true });
    }
    previousView.current = view;
  }, [state.phase, state.firstAnswer]);

  const answer = (result: QuestionCheckResult) => {
    if (!result.empty && result.answer.length === 1) dispatch({ type: 'answer', value: Number(result.answer[0]) });
  };
  const retry = () => dispatch({ type: 'retry', attempt: crypto.randomUUID() });

  return <article ref={root} className="attn-observation-page" data-observation-phase={state.phase} aria-label="两轮观察体验">
    <ContentBlock title="任务决定关注重点" headingLevel={1} className="attn-page-content">

    <div className="attn-observation-main">
      <div className={'attn-observation-visual' + (done ? ' is-comparison' : '')}>
        {done ? <div className="attn-observation-comparison" aria-label="两轮观察结果">
          {([1, 2] as const).map((round) => {
            const chosen = round === 1 ? state.firstAnswer : state.secondAnswer;
            const expected = round === 1 ? 2 : 3;
            return <section className="attn-observation-round" key={round}>
              <Typography as="h2" variant="h3">{round === 1 ? '先看后问' : '先问后看'}</Typography>
              <DeskVectorScene roundTwo={round === 2} />
              <Typography variant="bodySmall" tone="muted">你的回答：{chosen} 瓶 · 实际：{expected} 瓶</Typography>
              <Typography variant="body" tone={chosen === expected ? 'success' : 'warning'}>{chosen === expected ? '与实际数量一致' : '与实际数量不同'}</Typography>
            </section>;
          })}
        </div> : briefing ? <div className="attn-observation-hidden"><Typography variant="bodySmall" tone="accent">先知道要找什么</Typography><Typography variant="h2">货架上有几瓶冰水？</Typography><Typography variant="body" tone="muted">记住这个任务，再打开新场景。</Typography></div> : observing ? <DeskVectorScene roundTwo={!firstRound} /> : <div className="attn-observation-hidden" role="status">
          <svg viewBox="0 0 96 96" aria-hidden="true"><rect x="12" y="18" width="72" height="60" rx="8" /><path d="m20 66 19-20 14 14 10-10 13 16M20 14l56 68" /><circle cx="61" cy="35" r="6" /></svg>
          <Typography variant="h3">图片已隐藏</Typography>
          <Typography variant="body" tone="muted">只凭刚才的印象回答</Typography>
        </div>}
      </div>

      <section className="attn-observation-task" aria-label="当前任务" onKeyDown={(event) => {
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(event.key)) event.stopPropagation();
      }}>
        <Typography variant="bodySmall" tone="accent">{done ? '两轮之后' : firstRound ? '第一轮 · 先看一眼' : '第二轮 · 带着任务看'}</Typography>
        {done ? <>
          <Typography as="h2" variant="h2" tabIndex={-1}>刚才，你主动<br />寻找了什么？</Typography>
          <Typography variant="body">带着“几瓶冰水”的问题，观察就有了目标。</Typography>
          <Button onClick={retry}><Typography as="span" variant="bodySmall" tone="inherit">重新体验</Typography></Button>
        </> : briefing ? <>
          <Typography as="h2" variant="h2" tabIndex={-1}>这一次，<br />先给你一个任务。</Typography>
          <Typography variant="body" tone="muted">接下来，留意货架上的冰水。</Typography>
          <Button variant="primary" onClick={() => dispatch({ type: 'show-second' })}><Typography as="span" variant="bodySmall" tone="inherit">带着任务看新场景</Typography></Button>
        </> : observing ? <>
          <Typography as="h2" variant="h2" tabIndex={-1}>{firstRound ? <>小明走进商店，<br />先看一眼货架。</> : <>这一次，先找出<br />有几瓶冰水。</>}</Typography>
          <Typography variant="body" tone="muted">{firstRound ? '看好了，再把图片隐藏。' : '带着这个问题看新场景，看好了再隐藏。'}</Typography>
          <Button variant="primary" onClick={() => dispatch({ type: 'hide' })}><Typography as="span" variant="bodySmall" tone="inherit">隐藏图片，开始回忆</Typography></Button>
        </> : answeredFirst ? <>
          <Typography as="h2" variant="h2" tabIndex={-1}>刚才货架上<br />有 2 瓶冰水。</Typography>
          <Feedback status={state.firstAnswer === 2 ? 'correct' : 'hint'} message={state.firstAnswer === 2 ? '你记住了 2 瓶。' : `你回答了 ${state.firstAnswer} 瓶。刚才先注意到了什么？`} />
          <Button variant="primary" onClick={() => dispatch({ type: 'next-round' })}><Typography as="span" variant="bodySmall" tone="inherit">进入第二轮</Typography></Button>
        </> : <>
          <Typography as="h2" variant="h2" tabIndex={-1}>{firstRound ? <>刚才货架上<br />有几瓶冰水？</> : <>这次货架上<br />有几瓶冰水？</>}</Typography>
          <Question key={`${state.attempt}-${firstRound ? 1 : 2}`} className="attn-observation-question" title="请选择你记得的数量" typeLabel="凭印象作答" showFeedback={false}
            persistenceKey={`attention-observation-${state.attempt}-${firstRound ? 1 : 2}`}
            options={(firstRound ? [1, 2, 3] : [2, 3, 4]).map((value) => ({ value: String(value), label: `${value} 瓶` }))}
            answer={firstRound ? '2' : '3'} onCheck={answer} />
        </>}
      </section>
    </div>

    <footer className={'attn-observation-footer' + (done ? ' is-revealed' : '')} aria-live="polite">
      {done ? <>
        <Typography variant="h3">问题引导我们选择相关信息</Typography>
        <Typography variant="bodySmall" tone="muted">这是注意力的生活类比，不是受控实验；两次对错不能用来判断记忆能力。</Typography>
      </> : <>
        <Typography variant="body" tone="accent">{firstRound ? '观察货架 → 隐藏图片 → 凭印象作答' : '先知道任务 → 观察新场景 → 隐藏后作答'}</Typography>
        <Typography variant="bodySmall" tone="muted">{answeredFirst ? '货架补了货，再试一次。' : '按自己的节奏观察，不计时。'}</Typography>
      </>}
    </footer>
    </ContentBlock>
  </article>;
}
