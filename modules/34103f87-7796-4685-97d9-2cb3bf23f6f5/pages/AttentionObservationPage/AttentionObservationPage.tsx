import { ATTENTION_PAGE_COUNT } from '../../model/coursePageNumber';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { ContentBlock, Button, Feedback, Question, Typography, type QuestionCheckResult } from "@shuku/course-style/react";
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

  return <article shuku-edit-id="e-c2aa5104-2aca-44ef-b765-1b9dacc5233a" ref={root} className="attn-observation-page" data-observation-phase={state.phase} aria-label="两轮观察体验">
    <ContentBlock shuku-edit-id="e-28dfd066-0b1c-4c90-bac7-908f17c9171b" title="任务决定关注重点" headingLevel={1} className="attn-page-content">

    <div shuku-edit-id="e-a03c5a18-6691-4f6b-a82b-e6a1582b6af4" className="attn-observation-main">
      <div shuku-edit-id="e-0d77edb2-622e-4daf-ac64-6810f3aea841" className={'attn-observation-visual' + (done ? ' is-comparison' : '')}>
        {done ? <div shuku-edit-id="e-a9c8b337-fd3e-4681-81c5-f51911a4b15e" className="attn-observation-comparison" aria-label="两轮观察结果">
          {([1, 2] as const).map((round) => {
            const chosen = round === 1 ? state.firstAnswer : state.secondAnswer;
            const expected = round === 1 ? 2 : 3;
            return <section shuku-edit-id="e-547b5faa-2ad1-4852-96c2-e41441fcfaac" className="attn-observation-round" key={round}>
              <Typography shuku-edit-id="e-de61bd61-fd29-476e-b67c-bba8c745715f" as="h2" variant="h3">{round === 1 ? '先看后问' : '先问后看'}</Typography>
              <DeskVectorScene roundTwo={round === 2} />
              <Typography shuku-edit-id="e-5751d540-7064-4836-917a-1de43459c7e4" variant="bodySmall" tone="muted">你的回答：{chosen} 瓶 · 实际：{expected} 瓶</Typography>
              <Typography shuku-edit-id="e-e66baa33-c4c0-4a6c-a3d3-6d8b9d0f67da" variant="body" tone={chosen === expected ? 'success' : 'warning'}>{chosen === expected ? '与实际数量一致' : '与实际数量不同'}</Typography>
            </section>;
          })}
        </div> : briefing ? <div shuku-edit-id="e-dcb4ed01-92e7-4dad-9548-b0be022ccc59" className="attn-observation-hidden"><Typography shuku-edit-id="e-d9790f1c-a480-4c38-8ef6-16841b225f44" variant="bodySmall" tone="accent">先知道要找什么</Typography><Typography shuku-edit-id="e-ce9bc5af-982b-4b12-8970-ddca309570ff" variant="h2">货架上有几瓶冰水？</Typography><Typography shuku-edit-id="e-8b289c7b-d27f-4f50-9420-3dfae43ffc7f" variant="body" tone="muted">记住这个任务，再打开新场景。</Typography></div> : observing ? <DeskVectorScene roundTwo={!firstRound} /> : <div shuku-edit-id="e-ef9bd495-1247-4d08-8b91-7bc37fa8003b" className="attn-observation-hidden" role="status">
          <svg shuku-edit-id="e-baa1272c-9b67-4774-92da-f406f90821c2" viewBox="0 0 96 96" aria-hidden="true"><rect shuku-edit-id="e-33442a85-7901-429e-b56e-c56b610c34a5" x="12" y="18" width="72" height="60" rx="8" /><path shuku-edit-id="e-366b867e-52ff-4cc4-8ba3-c1f5322b6f18" d="m20 66 19-20 14 14 10-10 13 16M20 14l56 68" /><circle shuku-edit-id="e-4d2b7b7e-54b0-4307-a091-036e9b9ec581" cx="61" cy="35" r="6" /></svg>
          <Typography shuku-edit-id="e-d7571469-0af7-4aaa-b11c-7db7eb3fec29" variant="h3">图片已隐藏</Typography>
          <Typography shuku-edit-id="e-5edf6f6a-a761-4a44-9193-4ec3f41806c2" variant="body" tone="muted">只凭刚才的印象回答</Typography>
        </div>}
      </div>

      <section shuku-edit-id="e-1bfd62fd-0128-4d6a-8b03-555e60175de8" className="attn-observation-task" aria-label="当前任务" onKeyDown={(event) => {
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(event.key)) event.stopPropagation();
      }}>
        <Typography shuku-edit-id="e-793a6f5e-d986-4feb-9b79-c79dc2fcbf22" variant="bodySmall" tone="accent">{done ? '两轮之后' : firstRound ? '第一轮 · 先看一眼' : '第二轮 · 带着任务看'}</Typography>
        {done ? <>
          <Typography shuku-edit-id="e-cceb4196-bbf7-4731-b924-66260fc38cd4" as="h2" variant="h2" tabIndex={-1}>刚才，你主动<br shuku-edit-id="e-6d99b104-4c90-4657-8165-444c8df83eab" />寻找了什么？</Typography>
          <Typography shuku-edit-id="e-22a97f2a-b450-4105-ab9e-294a3da213b2" variant="body">带着“几瓶冰水”的问题，观察就有了目标。</Typography>
          <Button onClick={retry}><Typography shuku-edit-id="e-382f906b-fbf9-4dda-b93d-b049e800364e" as="span" variant="bodySmall" tone="inherit">重新体验</Typography></Button>
        </> : briefing ? <>
          <Typography shuku-edit-id="e-a955e5af-12c0-445b-9abf-f89e3758c145" as="h2" variant="h2" tabIndex={-1}>这一次，<br shuku-edit-id="e-6e9ff290-c41f-48d0-9941-5244509ba595" />先给你一个任务。</Typography>
          <Typography shuku-edit-id="e-28ce6442-5e01-47c5-a9cc-e4eab162ed3e" variant="body" tone="muted">接下来，留意货架上的冰水。</Typography>
          <Button variant="primary" onClick={() => dispatch({ type: 'show-second' })}><Typography shuku-edit-id="e-7c9e4b60-bc00-42c1-bff9-24d836da3eee" as="span" variant="bodySmall" tone="inherit">带着任务看新场景</Typography></Button>
        </> : observing ? <>
          <Typography shuku-edit-id="e-6a59a258-39da-4b89-9e4a-7ac74ee6d063" as="h2" variant="h2" tabIndex={-1}>{firstRound ? <>小明走进商店，<br shuku-edit-id="e-c7118aef-a412-4c0b-a366-ffbd50c69edc" />先看一眼货架。</> : <>这一次，先找出<br shuku-edit-id="e-11a00f7d-5707-4d74-82e6-3fdb9770018b" />有几瓶冰水。</>}</Typography>
          <Typography shuku-edit-id="e-68c02c3b-ea3e-480d-a6f9-77593e86a0c3" variant="body" tone="muted">{firstRound ? '看好了，再把图片隐藏。' : '带着这个问题看新场景，看好了再隐藏。'}</Typography>
          <Button variant="primary" onClick={() => dispatch({ type: 'hide' })}><Typography shuku-edit-id="e-1eb60d9a-f080-48b8-ac2f-d87bfff6adee" as="span" variant="bodySmall" tone="inherit">隐藏图片，开始回忆</Typography></Button>
        </> : answeredFirst ? <>
          <Typography shuku-edit-id="e-9df1d7e8-6433-41f6-880e-030bb675dcce" as="h2" variant="h2" tabIndex={-1}>刚才货架上<br shuku-edit-id="e-7d0dd842-5da2-4a1d-bfdd-827a6ca4e9d2" />有 2 瓶冰水。</Typography>
          <Feedback status={state.firstAnswer === 2 ? 'correct' : 'hint'} message={state.firstAnswer === 2 ? '你记住了 2 瓶。' : `你回答了 ${state.firstAnswer} 瓶。刚才先注意到了什么？`} />
          <Button variant="primary" onClick={() => dispatch({ type: 'next-round' })}><Typography shuku-edit-id="e-38027dae-ba45-4e17-a0b4-fbca8b4c0f5d" as="span" variant="bodySmall" tone="inherit">进入第二轮</Typography></Button>
        </> : <>
          <Typography shuku-edit-id="e-56160003-159d-49e0-9507-7e5922deaa94" as="h2" variant="h2" tabIndex={-1}>{firstRound ? <>刚才货架上<br shuku-edit-id="e-6376fd4f-66dd-4feb-876c-bd30b9bdfb57" />有几瓶冰水？</> : <>这次货架上<br shuku-edit-id="e-fa12002c-adec-49a9-8e4d-ac257889c1e9" />有几瓶冰水？</>}</Typography>
          <Question key={`${state.attempt}-${firstRound ? 1 : 2}`} className="attn-observation-question" title="请选择你记得的数量" typeLabel="凭印象作答" showFeedback={false}
            persistenceKey={`attention-observation-${state.attempt}-${firstRound ? 1 : 2}`}
            options={(firstRound ? [1, 2, 3] : [2, 3, 4]).map((value) => ({ value: String(value), label: `${value} 瓶` }))}
            answer={firstRound ? '2' : '3'} onCheck={answer} />
        </>}
      </section>
    </div>

    <footer shuku-edit-id="e-b275026b-5733-4cf1-b9ad-bc576aa9173f" className={'attn-observation-footer' + (done ? ' is-revealed' : '')} aria-live="polite">
      {done ? <>
        <Typography shuku-edit-id="e-c5f843a9-5b2a-4c45-8413-56a461f77349" variant="h3">问题引导我们选择相关信息</Typography>
        <Typography shuku-edit-id="e-7b4d2030-6189-410d-aa4f-ca9a06f20d7e" variant="bodySmall" tone="muted">这是注意力的生活类比，不是受控实验；两次对错不能用来判断记忆能力。</Typography>
      </> : <>
        <Typography shuku-edit-id="e-cfbb8ad5-703e-4b4a-815e-ddc76110a12a" variant="body" tone="accent">{firstRound ? '观察货架 → 隐藏图片 → 凭印象作答' : '先知道任务 → 观察新场景 → 隐藏后作答'}</Typography>
        <Typography shuku-edit-id="e-428f853c-3dda-4ce8-8695-d7280e31c3df" variant="bodySmall" tone="muted">{answeredFirst ? '货架补了货，再试一次。' : '按自己的节奏观察，不计时。'}</Typography>
      </>}
    </footer>
    </ContentBlock>
  </article>;
}
