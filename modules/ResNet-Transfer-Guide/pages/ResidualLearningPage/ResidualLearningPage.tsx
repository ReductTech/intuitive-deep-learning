import { useEffect, useRef, useState } from 'react';
import { ContentBlock, NoticeStrip, Typography, type QuestionCheckResult } from '../../../shared/react';
import { RtgQuestion } from '../../components/RtgQuestion/RtgQuestion';
import { useCompleteOnce } from '../../hooks/useCompleteOnce';
import './ResidualLearningPage.css';

const input = [3, 3, 2];
const target = [3, 4, 2];
const residual = target.map((value, index) => value - input[index]);
const recomposed = input.map((value, index) => value + residual[index]);
const stageNames = ['observe', 'difference', 'compose'] as const;
const stageLabels = ['找到变化', '显示修改量', '加回输入'];
const vector = (values: number[]) => `[${values.join(', ')}]`;

export interface ResidualLearningPageProps { onComplete?: () => void; }

export function ResidualLearningPage({ onComplete }: ResidualLearningPageProps) {
  const [stage, setStage] = useState<0 | 1 | 2>(0);
  const [meaningResult, setMeaningResult] = useState<QuestionCheckResult | null>(null);
  const [easeResult, setEaseResult] = useState<QuestionCheckResult | null>(null);
  const [attempt, setAttempt] = useState(0);
  const changeButton = useRef<HTMLButtonElement | null>(null);
  const checkpoint = useRef<HTMLDivElement | null>(null);
  const completionHeading = useRef<HTMLHeadingElement | null>(null);
  const differenceVisible = stage >= 1;
  const complete = stage === 2 && Boolean(meaningResult?.ok) && Boolean(easeResult?.ok);
  const question = stage < 2 ? 'none' : complete ? 'complete' : meaningResult?.ok ? 'ease' : 'meaning';
  const hasWrongAnswer = meaningResult?.ok === false || easeResult?.ok === false;
  const questionId = (id: string) => attempt ? `${id}-attempt-${attempt}` : id;
  useCompleteOnce(complete, onComplete);

  useEffect(() => {
    if (complete) completionHeading.current?.focus({ preventScroll: true });
    else if (meaningResult?.ok && stage === 2) checkpoint.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
  }, [complete, meaningResult?.ok, stage]);

  function restart() {
    setStage(0); setMeaningResult(null); setEaseResult(null);
    setAttempt(current => current + 1);
    changeButton.current?.focus({ preventScroll: true });
  }

  const notice = hasWrongAnswer
    ? !meaningResult?.ok
      ? '残差分支输出的是相对输入的修正，不是损失，也不是真实标签。'
      : '这个例子展示了学习对象的改变，不能保证任何任务的准确率都会提高。'
    : complete
      ? '保留输入，学习修正；这是一种映射改写，不是准确率保证。'
      : stage === 0
        ? '点击中间高亮的 3 → 4，看看只有哪一个位置需要改变。'
        : stage === 1
          ? '修改量已经显现。点击右侧的 + [0, 1, 0]，把它加回输入。'
          : meaningResult?.ok
            ? '第一题已完成。再判断这个例子能支持什么结论。'
            : '两条路线到达同一个目标。现在检查：残差与损失是不是同一件事？';

  return <ContentBlock headingLevel={1} className="rtg-residual-learning" data-stage={stageNames[stage]} data-question={question} data-complete={complete}
    title="为什么学习“修改量”会更容易？"
    subtitle="当输入已经接近目标时，比较学习完整映射与学习相对输入的修改量。"
    onKeyDown={event => {
      if ((event.key === ' ' || event.key === 'Enter') && (event.target as Element).closest('button')) {
        event.stopPropagation(); if (event.repeat) event.preventDefault();
      }
    }}>
    <div className="rtg-residual-learning__toolbar">
      <ol className="rtg-residual-learning__progress" aria-label="修改量显影步骤">
        {stageLabels.map((label, index) => <li key={label} className={index === stage ? 'is-current' : index < stage ? 'is-seen' : ''} aria-current={index === stage ? 'step' : undefined}><Typography as="span" variant="bodySmall" tone="inherit">0{index + 1}</Typography><Typography as="span" variant="bodySmall" tone="inherit">{label}</Typography></li>)}
      </ol>
      <button type="button" className="rtg-residual-learning__reset" onClick={restart}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M4 10a8 8 0 1 1 1 7M4 4v6h6" /></svg><Typography as="span" variant="bodySmall" tone="inherit">重新观察</Typography></button>
    </div>

    <section className="rtg-residual-learning__workbench" aria-label="修改量显影台：对齐比较同一输入与目标">
      <div className="rtg-residual-learning__alignment" role="group" aria-label="输入、目标与差值的三个位置严格对齐">
        <Typography variant="bodySmall" tone="muted" className="rtg-residual-learning__grid-caption">对齐比较</Typography>
        {input.map((_, index) => <Typography key={`position-${index}`} variant="bodySmall" tone={index === 1 ? 'warning' : 'muted'} className="rtg-residual-learning__position" style={{ gridColumn: index + 2, gridRow: 1 }}>位置 {index + 1}</Typography>)}
        {['输入 x', '目标 H(x)', '差值 F(x)'].map((label, index) => <Typography key={label} variant="bodySmall" tone={index === 2 ? 'warning' : 'accent'} className="rtg-residual-learning__row-label" style={{ gridColumn: 1, gridRow: index + 2 }}>{label}</Typography>)}
        {[0, 2].map(index => <Typography key={`input-${index}`} as="span" variant="h3" tone="inherit" className="rtg-residual-learning__number is-unchanged" data-input-position={index} style={{ gridColumn: index + 2, gridRow: 2 }}>{input[index]}</Typography>)}
        {[0, 2].map(index => <Typography key={`target-${index}`} as="span" variant="h3" tone="inherit" className="rtg-residual-learning__number is-unchanged" data-target-position={index} style={{ gridColumn: index + 2, gridRow: 3 }}>{target[index]}</Typography>)}
        <button type="button" className="rtg-residual-learning__change" data-show-difference ref={changeButton} aria-pressed={differenceVisible}
          aria-label="位置2从3变成4，点击显示修改量" aria-describedby="rtg-residual-learning-hint" onClick={() => { if (stage === 0) setStage(1); }}>
          <Typography as="span" variant="h3" tone="accent" data-input-position={1}>{input[1]}</Typography>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 4v16m-5-5 5 5 5-5" /></svg>
          <Typography as="span" variant="h3" tone="warning" data-target-position={1}>{target[1]}</Typography>
        </button>
        {residual.map((value, index) => <Typography key={`difference-${index}`} as="span" variant="h3" tone="inherit" data-difference-position={index}
          className={`rtg-residual-learning__number rtg-residual-learning__difference${differenceVisible ? ' is-visible' : ''}${index === 1 ? ' is-change' : ''}`}
          aria-label={differenceVisible ? `位置${index + 1}的修改量${value}` : `位置${index + 1}的修改量尚未显示`}
          style={{ gridColumn: index + 2, gridRow: 4 }}>{differenceVisible ? value : '—'}</Typography>)}
      </div>

      <div className="rtg-residual-learning__routes" aria-label="两种结构共享同一个目标">
        <article className="rtg-residual-learning__route rtg-residual-learning__route--direct">
          <div className="rtg-residual-learning__route-head"><Typography as="h2" variant="bodySmall" tone="accent">普通网络</Typography><Typography variant="bodySmall" tone="muted">直接学习完整映射</Typography></div>
          <Typography as="code" variant="body" tone="accent" className="rtg-residual-learning__learning-object">H(x) = {vector(target)}</Typography>
        </article>
        <article className="rtg-residual-learning__route rtg-residual-learning__route--residual">
          <div className="rtg-residual-learning__route-head"><Typography as="h2" variant="bodySmall" tone="warning">残差网络</Typography><Typography variant="bodySmall" tone="muted">学习相对输入的修改量</Typography></div>
          <Typography as="code" variant="body" tone={differenceVisible ? 'warning' : 'muted'} className="rtg-residual-learning__learning-object" aria-live="polite">{differenceVisible ? `F(x) = ${vector(residual)}` : 'F(x) = H(x) − x'}</Typography>
          <div className={`rtg-residual-learning__compose${stage === 2 ? ' is-composed' : ''}`} aria-label={stage === 2 ? '输入加上修改量得到同一个目标' : '把修改量加回输入'}>
            <Typography as="code" variant="bodySmall" tone="accent">{vector(input)}</Typography>
            <button type="button" data-add-residual disabled={!differenceVisible} aria-pressed={stage === 2} onClick={() => setStage(2)}
              aria-label={differenceVisible ? '把修改量[0,1,0]加回输入，查看完整输出' : '先点击中间的3到4，显示修改量'} aria-describedby="rtg-residual-learning-hint"><Typography as="code" variant="bodySmall" tone="inherit">+ {differenceVisible ? vector(residual) : 'F(x)'}</Typography></button>
            <Typography as="span" variant="bodySmall" tone="muted">=</Typography>
            <Typography as="code" variant="bodySmall" tone={stage === 2 ? 'success' : 'muted'} className="rtg-residual-learning__result" data-recomposed aria-label={stage === 2 ? `完整输出${vector(recomposed)}` : '完整输出等待计算'}>{stage === 2 ? vector(recomposed) : '?'}</Typography>
          </div>
        </article>
      </div>
    </section>

    <div className="rtg-residual-learning__checkpoint" ref={checkpoint}>
      {complete ? <div className="rtg-residual-learning__completion"><div><Typography as="h2" variant="body" tone="success" tabIndex={-1} ref={completionHeading}>学习对象变了，最终目标没有变</Typography><Typography variant="bodySmall" tone="muted">两项理解检查已完成。输入接近目标时，可以保留输入，让残差分支学习修正。</Typography></div><span className="rtg-residual-learning__completion-mark" aria-hidden="true" /></div>
      : stage === 2 ? !meaningResult?.ok ? <RtgQuestion key={`meaning-${attempt}`} pageId="13-residual-learning" questionId={questionId('residual-meaning')} className="rtg-residual-learning__question" type="choice" typeLabel="理解检查 · 第 1 / 2 题"
        title="这里的残差 F(x) 指什么？" answer="correction" options={[
          { key: <Typography as="span" variant="bodySmall" tone="inherit" className="rtg-residual-learning__option-letter">A</Typography>, value: 'correction', label: '在输入 x 上需要补充的修改量' },
          { key: <Typography as="span" variant="bodySmall" tone="inherit" className="rtg-residual-learning__option-letter">B</Typography>, value: 'loss', label: '预测错误的大小', wrongFeedback: '这里的F(x)是输出修正，不是训练损失。' },
          { key: <Typography as="span" variant="bodySmall" tone="inherit" className="rtg-residual-learning__option-letter">C</Typography>, value: 'label', label: '训练样本的真实标签', wrongFeedback: '真实标签提供监督，不是残差分支的输出。' },
        ]} feedback={{ correct: '正确。F(x)描述相对输入的修正。' }} showFeedback={false} onCheck={setMeaningResult} />
      : <RtgQuestion key={`ease-${attempt}`} pageId="13-residual-learning" questionId={questionId('residual-ease')} className="rtg-residual-learning__question rtg-residual-learning__question--ease" type="choice" typeLabel="理解检查 · 第 2 / 2 题"
        title="这个例子支持哪种理解？" answer="smaller-change" options={[
          { key: <Typography as="span" variant="bodySmall" tone="inherit" className="rtg-residual-learning__option-letter">A</Typography>, value: 'smaller-change', label: '输入已接近目标，只需学习差值 [0, 1, 0]' },
          { key: <Typography as="span" variant="bodySmall" tone="inherit" className="rtg-residual-learning__option-letter">B</Typography>, value: 'always-accurate', label: '使用残差后，任何任务的准确率一定更高', wrongFeedback: '残差结构不是准确率保证。' },
        ]} feedback={{ correct: '正确。本例学习的是相对输入的较小修正，不代表普遍的准确率保证。' }} showFeedback={false} onCheck={setEaseResult} />
      : <div className="rtg-residual-learning__insight"><Typography as="h2" variant="body" tone="accent">{stage === 0 ? '先找到唯一发生变化的位置' : '修改量已经显影：只有中间一项需要 +1'}</Typography><Typography variant="bodySmall" tone="muted">{stage === 0 ? '三个位置上下对齐。点击琥珀色的 3 → 4，显示目标与输入的差值。' : '普通网络直接学习完整映射；残差分支学习差值，再与保留的输入相加。'}</Typography></div>}
    </div>

    <Typography variant="bodySmall" tone="muted" className="rtg-residual-learning__disclaimer">数值为教学示意；差值大小不是学习难度的度量。</Typography>
    <NoticeStrip tone={complete ? 'green' : hasWrongAnswer ? 'orange' : 'blue'} role="status" aria-live="polite"><Typography id="rtg-residual-learning-hint" variant="bodySmall" tone="inherit">{notice}</Typography></NoticeStrip>
  </ContentBlock>;
}
