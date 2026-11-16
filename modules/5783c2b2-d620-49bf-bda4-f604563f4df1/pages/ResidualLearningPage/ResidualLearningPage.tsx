import { useEffect, useRef, useState } from 'react';
import { ContentBlock, NoticeStrip, Typography, type QuestionCheckResult } from "@shuku/course-style/react";
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

  return <ContentBlock shuku-edit-id="e-e1c9dc11-d824-4e7d-a4d2-ae983228d8a5" headingLevel={1} className="rtg-residual-learning" data-stage={stageNames[stage]} data-question={question} data-complete={complete}
    title="为什么学习“修改量”会更容易？"
    subtitle="当输入已经接近目标时，比较学习完整映射与学习相对输入的修改量。"
    onKeyDown={event => {
      if ((event.key === ' ' || event.key === 'Enter') && (event.target as Element).closest('button')) {
        event.stopPropagation(); if (event.repeat) event.preventDefault();
      }
    }}>
    <div shuku-edit-id="e-e7e621c9-9d32-43d3-8432-3b78c2022def" className="rtg-residual-learning__toolbar">
      <ol shuku-edit-id="e-7894b3c3-4468-4f68-b450-a6e6061e4404" className="rtg-residual-learning__progress" aria-label="修改量显影步骤">
        {stageLabels.map((label, index) => <li shuku-edit-id="e-52cae21a-2370-4de7-a3ff-83334516274a" key={label} className={index === stage ? 'is-current' : index < stage ? 'is-seen' : ''} aria-current={index === stage ? 'step' : undefined}><Typography shuku-edit-id="e-fe2adc6b-0c27-4918-9a66-b234a37cf8a3" as="span" variant="bodySmall" tone="inherit">0{index + 1}</Typography><Typography shuku-edit-id="e-62290736-f02d-4a2f-b8ee-9eee7f04e579" as="span" variant="bodySmall" tone="inherit">{label}</Typography></li>)}
      </ol>
      <button shuku-edit-id="e-101d3953-3242-43f2-84c5-ccf600d797f6" type="button" className="rtg-residual-learning__reset" onClick={restart}><svg shuku-edit-id="e-59c2f73e-4476-4071-9ad0-0bd5345784d3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path shuku-edit-id="e-05fc6a83-8c58-4e52-badb-c0ee87f795d4" d="M4 10a8 8 0 1 1 1 7M4 4v6h6" /></svg><Typography shuku-edit-id="e-625df125-32ec-43b7-812d-e7b24bd4d413" as="span" variant="bodySmall" tone="inherit">重新观察</Typography></button>
    </div>

    <section shuku-edit-id="e-6fa86a36-c4fb-49f5-91d9-1e22eee10571" className="rtg-residual-learning__workbench" aria-label="修改量显影台：对齐比较同一输入与目标">
      <div shuku-edit-id="e-1562629b-54e9-44e7-9c14-8f7cb121a246" className="rtg-residual-learning__alignment" role="group" aria-label="输入、目标与差值的三个位置严格对齐">
        <Typography shuku-edit-id="e-94d827e4-88ee-4053-af30-bceba6e96138" variant="bodySmall" tone="muted" className="rtg-residual-learning__grid-caption">对齐比较</Typography>
        {input.map((_, index) => <Typography shuku-edit-id="e-6e45085e-fb07-4874-b536-fc3818c71811" key={`position-${index}`} variant="bodySmall" tone={index === 1 ? 'warning' : 'muted'} className="rtg-residual-learning__position" style={{ gridColumn: index + 2, gridRow: 1 }}>位置 {index + 1}</Typography>)}
        {['输入 x', '目标 H(x)', '差值 F(x)'].map((label, index) => <Typography shuku-edit-id="e-250a807b-4ccd-4564-97c8-e22fa14ae980" key={label} variant="bodySmall" tone={index === 2 ? 'warning' : 'accent'} className="rtg-residual-learning__row-label" style={{ gridColumn: 1, gridRow: index + 2 }}>{label}</Typography>)}
        {[0, 2].map(index => <Typography shuku-edit-id="e-ffaaff16-c539-4004-997a-a760f15a59d4" key={`input-${index}`} as="span" variant="h3" tone="inherit" className="rtg-residual-learning__number is-unchanged" data-input-position={index} style={{ gridColumn: index + 2, gridRow: 2 }}>{input[index]}</Typography>)}
        {[0, 2].map(index => <Typography shuku-edit-id="e-2abc15eb-b8ac-44e9-aa4b-d5d737ccce0a" key={`target-${index}`} as="span" variant="h3" tone="inherit" className="rtg-residual-learning__number is-unchanged" data-target-position={index} style={{ gridColumn: index + 2, gridRow: 3 }}>{target[index]}</Typography>)}
        <button shuku-edit-id="e-20520263-7ab4-465a-8dfa-9489f1c898e3" type="button" className="rtg-residual-learning__change" data-show-difference ref={changeButton} aria-pressed={differenceVisible}
          aria-label="位置2从3变成4，点击显示修改量" aria-describedby="rtg-residual-learning-hint" onClick={() => { if (stage === 0) setStage(1); }}>
          <Typography shuku-edit-id="e-33cc495b-b13f-436f-ab74-3402b2eede40" as="span" variant="h3" tone="accent" data-input-position={1}>{input[1]}</Typography>
          <svg shuku-edit-id="e-07943ed5-6db2-4fef-8c15-9a0653163ccd" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path shuku-edit-id="e-825fe511-3ec4-42cf-9071-929f83573067" d="M12 4v16m-5-5 5 5 5-5" /></svg>
          <Typography shuku-edit-id="e-87328864-8d52-4b71-a2ca-bdd56340acd4" as="span" variant="h3" tone="warning" data-target-position={1}>{target[1]}</Typography>
        </button>
        {residual.map((value, index) => <Typography shuku-edit-id="e-7ec744be-c15c-4fac-83be-3d137980b0b0" key={`difference-${index}`} as="span" variant="h3" tone="inherit" data-difference-position={index}
          className={`rtg-residual-learning__number rtg-residual-learning__difference${differenceVisible ? ' is-visible' : ''}${index === 1 ? ' is-change' : ''}`}
          aria-label={differenceVisible ? `位置${index + 1}的修改量${value}` : `位置${index + 1}的修改量尚未显示`}
          style={{ gridColumn: index + 2, gridRow: 4 }}>{differenceVisible ? value : '—'}</Typography>)}
      </div>

      <div shuku-edit-id="e-11c0754b-0e61-40b9-8657-dd38e731d375" className="rtg-residual-learning__routes" aria-label="两种结构共享同一个目标">
        <article shuku-edit-id="e-347be095-2e71-4f9f-99ff-a5b7732a96f9" className="rtg-residual-learning__route rtg-residual-learning__route--direct">
          <div shuku-edit-id="e-a4b50da6-54b8-4328-b97b-2e502af2b318" className="rtg-residual-learning__route-head"><Typography shuku-edit-id="e-bd276546-88ca-44b9-b118-9e34961fb953" as="h2" variant="bodySmall" tone="accent">普通网络</Typography><Typography shuku-edit-id="e-ee37656c-b7b7-4d56-8e6a-73651d5662eb" variant="bodySmall" tone="muted">直接学习完整映射</Typography></div>
          <Typography shuku-edit-id="e-09759b4a-c4e3-4b24-9946-126d746c4253" as="code" variant="body" tone="accent" className="rtg-residual-learning__learning-object">H(x) = {vector(target)}</Typography>
        </article>
        <article shuku-edit-id="e-1388c86b-872f-46b4-b849-562513a4fd19" className="rtg-residual-learning__route rtg-residual-learning__route--residual">
          <div shuku-edit-id="e-5d4a39a3-13e1-40a0-ad15-6914c4151899" className="rtg-residual-learning__route-head"><Typography shuku-edit-id="e-1b109413-87cd-4b6d-88a8-33463c4aed13" as="h2" variant="bodySmall" tone="warning">残差网络</Typography><Typography shuku-edit-id="e-30710535-2226-481d-be0d-9f475d2e5d29" variant="bodySmall" tone="muted">学习相对输入的修改量</Typography></div>
          <Typography shuku-edit-id="e-42e30503-217f-4ceb-a577-d3cd361aae57" as="code" variant="body" tone={differenceVisible ? 'warning' : 'muted'} className="rtg-residual-learning__learning-object" aria-live="polite">{differenceVisible ? `F(x) = ${vector(residual)}` : 'F(x) = H(x) − x'}</Typography>
          <div shuku-edit-id="e-4ca32c7f-6755-47ea-8c73-f7b51d234674" className={`rtg-residual-learning__compose${stage === 2 ? ' is-composed' : ''}`} aria-label={stage === 2 ? '输入加上修改量得到同一个目标' : '把修改量加回输入'}>
            <Typography shuku-edit-id="e-13f2662e-10b1-4a8e-bf10-a52f10b33456" as="code" variant="bodySmall" tone="accent">{vector(input)}</Typography>
            <button shuku-edit-id="e-ba703142-6460-4742-a886-ab60e526cbb0" type="button" data-add-residual disabled={!differenceVisible} aria-pressed={stage === 2} onClick={() => setStage(2)}
              aria-label={differenceVisible ? '把修改量[0,1,0]加回输入，查看完整输出' : '先点击中间的3到4，显示修改量'} aria-describedby="rtg-residual-learning-hint"><Typography shuku-edit-id="e-8aa16e4b-6635-4c98-96b3-101a96aeb29c" as="code" variant="bodySmall" tone="inherit">+ {differenceVisible ? vector(residual) : 'F(x)'}</Typography></button>
            <Typography shuku-edit-id="e-6c2c6ca9-2ab4-4521-9fc1-2443076328a7" as="span" variant="bodySmall" tone="muted">=</Typography>
            <Typography shuku-edit-id="e-bbd02214-8ddb-4a65-86b8-4e782b93e3dd" as="code" variant="bodySmall" tone={stage === 2 ? 'success' : 'muted'} className="rtg-residual-learning__result" data-recomposed aria-label={stage === 2 ? `完整输出${vector(recomposed)}` : '完整输出等待计算'}>{stage === 2 ? vector(recomposed) : '?'}</Typography>
          </div>
        </article>
      </div>
    </section>

    <div shuku-edit-id="e-6000b04a-f23b-46e1-b50d-63a5a5a841e5" className="rtg-residual-learning__checkpoint" ref={checkpoint}>
      {complete ? <div shuku-edit-id="e-197c5617-9663-457e-b3ee-be44b23d2884" className="rtg-residual-learning__completion"><div shuku-edit-id="e-c30c4a66-37e9-4c73-a4a6-ad8877cfe6ac"><Typography shuku-edit-id="e-0512a14a-80b0-4f29-aa03-00333cfa46d2" as="h2" variant="body" tone="success" tabIndex={-1} ref={completionHeading}>学习对象变了，最终目标没有变</Typography><Typography shuku-edit-id="e-3aba9ea3-1d35-47e7-b093-665fea1db21d" variant="bodySmall" tone="muted">两项理解检查已完成。输入接近目标时，可以保留输入，让残差分支学习修正。</Typography></div><span shuku-edit-id="e-54bede0e-0185-4d39-9fec-316271eb12f2" className="rtg-residual-learning__completion-mark" aria-hidden="true" /></div>
      : stage === 2 ? !meaningResult?.ok ? <RtgQuestion key={`meaning-${attempt}`} pageId="13-residual-learning" questionId={questionId('residual-meaning')} className="rtg-residual-learning__question" type="choice" typeLabel="理解检查 · 第 1 / 2 题"
        title="这里的残差 F(x) 指什么？" answer="correction" options={[
          { key: <Typography shuku-edit-id="e-b6bd6f4e-d26d-40b2-b5e3-a6672f143a41" as="span" variant="bodySmall" tone="inherit" className="rtg-residual-learning__option-letter">A</Typography>, value: 'correction', label: '在输入 x 上需要补充的修改量' },
          { key: <Typography shuku-edit-id="e-f0308290-8cad-40f3-a56b-da18db9c332d" as="span" variant="bodySmall" tone="inherit" className="rtg-residual-learning__option-letter">B</Typography>, value: 'loss', label: '预测错误的大小', wrongFeedback: '这里的F(x)是输出修正，不是训练损失。' },
          { key: <Typography shuku-edit-id="e-4fe3efb1-69c8-4628-97e0-6e34d237889e" as="span" variant="bodySmall" tone="inherit" className="rtg-residual-learning__option-letter">C</Typography>, value: 'label', label: '训练样本的真实标签', wrongFeedback: '真实标签提供监督，不是残差分支的输出。' },
        ]} feedback={{ correct: '正确。F(x)描述相对输入的修正。' }} showFeedback={false} onCheck={setMeaningResult} />
      : <RtgQuestion key={`ease-${attempt}`} pageId="13-residual-learning" questionId={questionId('residual-ease')} className="rtg-residual-learning__question rtg-residual-learning__question--ease" type="choice" typeLabel="理解检查 · 第 2 / 2 题"
        title="这个例子支持哪种理解？" answer="smaller-change" options={[
          { key: <Typography shuku-edit-id="e-e40cd566-9de3-418c-bab8-ce55756dd4e3" as="span" variant="bodySmall" tone="inherit" className="rtg-residual-learning__option-letter">A</Typography>, value: 'smaller-change', label: '输入已接近目标，只需学习差值 [0, 1, 0]' },
          { key: <Typography shuku-edit-id="e-cdb245c3-950e-43f9-80c7-5f4be0af4b04" as="span" variant="bodySmall" tone="inherit" className="rtg-residual-learning__option-letter">B</Typography>, value: 'always-accurate', label: '使用残差后，任何任务的准确率一定更高', wrongFeedback: '残差结构不是准确率保证。' },
        ]} feedback={{ correct: '正确。本例学习的是相对输入的较小修正，不代表普遍的准确率保证。' }} showFeedback={false} onCheck={setEaseResult} />
      : <div shuku-edit-id="e-0eee2787-a480-4b35-8116-90103d2898b1" className="rtg-residual-learning__insight"><Typography shuku-edit-id="e-159d5fbe-d94a-44f2-9dbf-c397dc1e9a94" as="h2" variant="body" tone="accent">{stage === 0 ? '先找到唯一发生变化的位置' : '修改量已经显影：只有中间一项需要 +1'}</Typography><Typography shuku-edit-id="e-730af7c2-6197-46e3-a623-f56ebda4582d" variant="bodySmall" tone="muted">{stage === 0 ? '三个位置上下对齐。点击琥珀色的 3 → 4，显示目标与输入的差值。' : '普通网络直接学习完整映射；残差分支学习差值，再与保留的输入相加。'}</Typography></div>}
    </div>

    <Typography shuku-edit-id="e-1224a0aa-ffed-4d39-ac6a-80c7d62ae92a" variant="bodySmall" tone="muted" className="rtg-residual-learning__disclaimer">数值为教学示意；差值大小不是学习难度的度量。</Typography>
    <NoticeStrip tone={complete ? 'green' : hasWrongAnswer ? 'orange' : 'blue'} role="status" aria-live="polite"><Typography shuku-edit-id="e-2ff15d85-7ccf-4b0d-a748-d62b1a1320f1" id="rtg-residual-learning-hint" variant="bodySmall" tone="inherit">{notice}</Typography></NoticeStrip>
  </ContentBlock>;
}
