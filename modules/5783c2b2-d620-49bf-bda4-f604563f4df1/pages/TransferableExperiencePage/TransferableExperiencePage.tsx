import { useState } from 'react';
import { Button, ContentBlock, NoticeStrip, Typography, type QuestionCheckResult } from "@shuku/course-style/react";
import { useCompleteOnce } from '../../hooks/useCompleteOnce';
import { classificationFeedback, TRANSFER_CLUES, type ClueChoice } from './classification';
import { TransferCheckPanel } from './TransferCheckPanel';
import './TransferableExperiencePage.css';

export interface TransferableExperiencePageProps { onComplete?: () => void; }

export function TransferableExperiencePage({ onComplete }: TransferableExperiencePageProps) {
  const [choices, setChoices] = useState<ClueChoice[]>(() => TRANSFER_CLUES.map(() => null));
  const [checked, setChecked] = useState(false);
  const [act, setAct] = useState<0 | 1>(0);
  const [attempt, setAttempt] = useState(0);
  const [questionResult, setQuestionResult] = useState<QuestionCheckResult | null>(null);
  const feedback = classificationFeedback(choices);
  const classified = checked && feedback.complete;
  const complete = classified && Boolean(questionResult?.ok);
  useCompleteOnce(complete, onComplete);

  function choose(index: number, choice: ClueChoice) {
    setChoices(previous => previous.map((value, position) => position === index ? choice : value));
    setChecked(false);
  }
  function checkClassification() { setChecked(true); if (feedback.complete) setAct(1); }
  function reset() { setChoices(TRANSFER_CLUES.map(() => null)); setChecked(false); setAct(0); setQuestionResult(null); setAttempt(value => value + 1); }

  return <ContentBlock shuku-edit-id="e-76a645f4-21a2-4952-a347-2d339ad7b654" headingLevel={1} className="rtg-transferable" title="旧任务的视觉经验，哪些可以复用？" subtitle={act === 0 ? '给六条线索分类：可复用表示，还是旧任务答案？' : '分类已完成，判断原因，再用一个线索说明。'} data-act={act} data-checked={checked} data-complete={complete}>
    <nav shuku-edit-id="e-32791132-b457-4e92-b406-404069bdbf47" className="rtg-transferable__nav" aria-label="第22页的两幕">
      <Button data-act-choice={0} variant={act === 0 ? 'primary' : 'default'} onClick={() => setAct(0)}>{classified ? '✓ ' : ''}1 · 线索分类</Button>
      <Button data-act-choice={1} variant={act === 1 ? 'primary' : 'default'} disabled={!classified} onClick={() => { if (classified) setAct(1); }}>{complete ? '✓ ' : ''}2 · 理解与应用</Button>
    </nav>
    <div shuku-edit-id="e-9f1b3e6e-ab3a-4d27-9ba0-88194d602d8e" className="rtg-transferable__classification" hidden={act !== 0}>
    <section shuku-edit-id="e-0c553914-61af-483d-bdfe-916414cc5ca3" className="rtg-transferable__lab" aria-label="六条线索分类">
      <section shuku-edit-id="e-196b0db1-ae3c-424c-a350-211869975f41" className="rtg-transferable__choices" aria-label="为六条线索分别选择归属">
        <Typography shuku-edit-id="e-1a7a7685-7ddc-4258-bcb0-cddf9d089cac" as="h2" variant="h3" tone="accent">这些线索，哪些能复用？</Typography>
        <div shuku-edit-id="e-e439e339-3b81-4e13-b9db-ae0c7f66a63e" className="rtg-transferable__rows">{TRANSFER_CLUES.map((clue, index) => {
          const wrong = checked && feedback.wrong.includes(index);
          return <div shuku-edit-id="e-cbb93903-a81e-42d6-b6bb-8be6defa099f" className={'rtg-transferable__row' + (wrong ? ' is-wrong' : '')} key={clue.id} role="group" aria-label={clue.label} data-clue-row={clue.id} data-wrong={wrong}>
            <Typography shuku-edit-id="e-31d05ed1-67d1-4189-a391-bfd02ea344f3" as="strong" variant="h3" tone={wrong ? 'danger' : 'accent'}>{wrong ? '! ' : ''}{clue.label}</Typography>
            <Button data-clue-id={clue.id} data-choice="reusable" variant={choices[index] === 'reusable' ? 'primary' : 'default'} aria-pressed={choices[index] === 'reusable'} aria-label={clue.label + '：可复用表示'} onClick={() => choose(index, 'reusable')}>可复用表示</Button>
            <Button data-clue-id={clue.id} data-choice="old-task" variant={choices[index] === 'old-task' ? 'warn' : 'default'} aria-pressed={choices[index] === 'old-task'} aria-label={clue.label + '：旧任务答案'} onClick={() => choose(index, 'old-task')}>旧任务答案</Button>
          </div>;
        })}</div>
      </section>
      <aside shuku-edit-id="e-e4101be6-59b7-4516-89ad-874ce6a3de81" className="rtg-transferable__buckets" aria-label="你的分类结果">{(['reusable', 'old-task'] as const).map(category => {
        const selected = TRANSFER_CLUES.filter((_, index) => choices[index] === category);
        return <section shuku-edit-id="e-c0de1b41-da86-42f6-9dff-6bb41577a742" className={'rtg-transferable__bucket' + (category === 'old-task' ? ' is-task' : '')} key={category} data-bucket={category}>
          <Typography shuku-edit-id="e-94378560-9c1d-4617-ae02-01836f3e9e7c" as="h2" variant={category === 'reusable' ? 'h2' : 'h3'} tone={category === 'reusable' ? 'success' : 'warning'}>{category === 'reusable' ? '可复用表示' : '旧任务答案'}</Typography>
          {selected.length ? selected.map(clue => <Typography shuku-edit-id="e-421a1bca-f770-4df7-8867-314ea1a39740" variant="bodySmall" tone="accent" key={clue.id}>{checked && clue.answer === category ? '✓ ' : '· '}{clue.label}</Typography>) : <Typography shuku-edit-id="e-2f9dc257-1577-4bc7-9b93-f76ae48112a8" variant="bodySmall" tone="muted">选择后显示在这里</Typography>}
        </section>;
      })}</aside>
    </section>
    <footer shuku-edit-id="e-842db34c-69ab-48e3-8add-aa263ba8c857" className="rtg-transferable__footer">
      <NoticeStrip tone={classified ? 'green' : checked ? 'orange' : 'blue'} role="status" aria-live="polite"><Typography shuku-edit-id="e-dfa353c8-92da-4f8c-9c8d-07f262aa5b9d" variant="bodySmall" tone="inherit">{checked ? feedback.message : '为六条线索分别选择归属，再检查分类。'}</Typography></NoticeStrip>
      <div shuku-edit-id="e-e8b7bb3e-27fc-44c0-8fcf-cfa90e88203b" className="rtg-transferable__actions"><Button data-reset onClick={reset}>重新分类</Button><Button data-check-classification variant="primary" onClick={checkClassification}>检查分类</Button></div>
    </footer>
    </div>
    <TransferCheckPanel key={attempt} attempt={attempt} hidden={act !== 1} onCheck={setQuestionResult} />
  </ContentBlock>;
}
