import { useState } from 'react';
import { Button, ContentBlock, NoticeStrip, Typography, type QuestionCheckResult } from '../../../shared/react';
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

  return <ContentBlock headingLevel={1} className="rtg-transferable" title="旧任务的视觉经验，哪些可以复用？" subtitle={act === 0 ? '给六条线索分类：可复用表示，还是旧任务答案？' : '分类已完成，判断原因，再用一个线索说明。'} data-act={act} data-checked={checked} data-complete={complete}>
    <nav className="rtg-transferable__nav" aria-label="第22页的两幕">
      <Button data-act-choice={0} variant={act === 0 ? 'primary' : 'default'} onClick={() => setAct(0)}>{classified ? '✓ ' : ''}1 · 线索分类</Button>
      <Button data-act-choice={1} variant={act === 1 ? 'primary' : 'default'} disabled={!classified} onClick={() => { if (classified) setAct(1); }}>{complete ? '✓ ' : ''}2 · 理解与应用</Button>
    </nav>
    <div className="rtg-transferable__classification" hidden={act !== 0}>
    <section className="rtg-transferable__lab" aria-label="六条线索分类">
      <section className="rtg-transferable__choices" aria-label="为六条线索分别选择归属">
        <Typography as="h2" variant="h3" tone="accent">这些线索，哪些能复用？</Typography>
        <div className="rtg-transferable__rows">{TRANSFER_CLUES.map((clue, index) => {
          const wrong = checked && feedback.wrong.includes(index);
          return <div className={'rtg-transferable__row' + (wrong ? ' is-wrong' : '')} key={clue.id} role="group" aria-label={clue.label} data-clue-row={clue.id} data-wrong={wrong}>
            <Typography as="strong" variant="h3" tone={wrong ? 'danger' : 'accent'}>{wrong ? '! ' : ''}{clue.label}</Typography>
            <Button data-clue-id={clue.id} data-choice="reusable" variant={choices[index] === 'reusable' ? 'primary' : 'default'} aria-pressed={choices[index] === 'reusable'} aria-label={clue.label + '：可复用表示'} onClick={() => choose(index, 'reusable')}>可复用表示</Button>
            <Button data-clue-id={clue.id} data-choice="old-task" variant={choices[index] === 'old-task' ? 'warn' : 'default'} aria-pressed={choices[index] === 'old-task'} aria-label={clue.label + '：旧任务答案'} onClick={() => choose(index, 'old-task')}>旧任务答案</Button>
          </div>;
        })}</div>
      </section>
      <aside className="rtg-transferable__buckets" aria-label="你的分类结果">{(['reusable', 'old-task'] as const).map(category => {
        const selected = TRANSFER_CLUES.filter((_, index) => choices[index] === category);
        return <section className={'rtg-transferable__bucket' + (category === 'old-task' ? ' is-task' : '')} key={category} data-bucket={category}>
          <Typography as="h2" variant={category === 'reusable' ? 'h2' : 'h3'} tone={category === 'reusable' ? 'success' : 'warning'}>{category === 'reusable' ? '可复用表示' : '旧任务答案'}</Typography>
          {selected.length ? selected.map(clue => <Typography variant="bodySmall" tone="accent" key={clue.id}>{checked && clue.answer === category ? '✓ ' : '· '}{clue.label}</Typography>) : <Typography variant="bodySmall" tone="muted">选择后显示在这里</Typography>}
        </section>;
      })}</aside>
    </section>
    <footer className="rtg-transferable__footer">
      <NoticeStrip tone={classified ? 'green' : checked ? 'orange' : 'blue'} role="status" aria-live="polite"><Typography variant="bodySmall" tone="inherit">{checked ? feedback.message : '为六条线索分别选择归属，再检查分类。'}</Typography></NoticeStrip>
      <div className="rtg-transferable__actions"><Button data-reset onClick={reset}>重新分类</Button><Button data-check-classification variant="primary" onClick={checkClassification}>检查分类</Button></div>
    </footer>
    </div>
    <TransferCheckPanel key={attempt} attempt={attempt} hidden={act !== 1} onCheck={setQuestionResult} />
  </ContentBlock>;
}
