import { useEffect, useRef, useState } from 'react';
import { Button, ContentBlock, NoticeStrip, Question, emitTelemetry, getTelemetryState } from '../../shared/react';

type Task = 'object' | 'direction';

interface LabelPreservationBlockProps {
  onComplete?: () => void;
}

const taskCopy: Record<Task, { title: string; question: string; before: string; after: string }> = {
  object: {
    title: '任务 A · 判断是不是交通指示牌',
    question: '模型只需要识别物体类别。左右翻转后，它还是交通指示牌吗？',
    before: '交通指示牌',
    after: '交通指示牌',
  },
  direction: {
    title: '任务 B · 判断箭头朝向',
    question: '模型需要区分向左和向右。左右翻转后，正确标签还一样吗？',
    before: '向右',
    after: '向左',
  },
};

const stateKey = 'experiment:vision-label-preservation-v1';

export function LabelPreservationBlock({ onComplete }: LabelPreservationBlockProps) {
  const [task, setTask] = useState<Task>('object');
  const [flipped, setFlipped] = useState(false);
  const [inspected, setInspected] = useState<Task[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const labRef = useRef<HTMLElement>(null);
  const current = taskCopy[task];
  const readyForCheck = inspected.length === 2;

  useEffect(() => {
    let active = true;
    void getTelemetryState<{ task?: Task; flipped?: boolean; inspected?: Task[] }>(stateKey).then((entry) => {
      if (!active) return;
      const state = entry?.state;
      if (state?.task === 'object' || state?.task === 'direction') setTask(state.task);
      if (typeof state?.flipped === 'boolean') setFlipped(state.flipped);
      if (Array.isArray(state?.inspected)) setInspected(state.inspected.filter((item): item is Task => item === 'object' || item === 'direction'));
      setHydrated(true);
    });
    return () => { active = false; };
  }, []);

  function chooseTask(nextTask: Task) {
    setTask(nextTask);
    setFlipped(false);
  }

  function flipImage() {
    const nextFlipped = !flipped;
    const nextInspected = inspected.includes(task) ? inspected : [...inspected, task];
    setFlipped(nextFlipped);
    setInspected(nextInspected);
    if (hydrated) {
      emitTelemetry('augmentation_flip', labRef.current, {
        state_key: stateKey,
        state: { task, flipped: nextFlipped, inspected: nextInspected },
        task,
        flipped: nextFlipped,
      });
    }
  }

  return (
    <ContentBlock
      className="vgen-block vgen-label-block"
      title="同一次翻转，为什么有时能用、有时不能？"
      subtitle="图像增广不是随意改图。只有变换前后任务标签仍成立，生成的样本才是有效训练数据。"
    >
      <div className="vgen-task-switch" role="group" aria-label="选择分类任务">
        <Button active={task === 'object'} aria-pressed={task === 'object'} onClick={() => chooseTask('object')}>任务 A · 识别物体</Button>
        <Button active={task === 'direction'} aria-pressed={task === 'direction'} onClick={() => chooseTask('direction')}>任务 B · 判断方向</Button>
      </div>

      <section className="vgen-augmentation-lab" aria-labelledby="vgen-label-lab-title" ref={labRef}>
        <div className="vgen-lab-copy">
          <span>{current.title}</span>
          <h3 id="vgen-label-lab-title">{current.question}</h3>
          <p>先观察原图，再执行同一个“水平翻转”。请在两个任务中各操作一次。</p>
          <Button variant="primary" hint={!flipped} onClick={flipImage}>
            {flipped ? '恢复原图' : '水平翻转图像'}
          </Button>
        </div>

        <div className="vgen-sign-comparison" aria-live="polite">
          <figure>
            <div className="vgen-road-scene" role="img" aria-label="原图：箭头朝右的交通指示牌">
              <span className="vgen-road-sign"><span aria-hidden="true">➜</span></span>
            </div>
            <figcaption>原图标签：<strong>{current.before}</strong></figcaption>
          </figure>
          <span className="vgen-transform-mark" aria-hidden="true">→</span>
          <figure className={flipped ? 'is-visible' : 'is-waiting'}>
            <div className="vgen-road-scene" role="img" aria-label={flipped ? '增广图：水平翻转后箭头朝左' : '等待执行水平翻转'}>
              {flipped ? <span className="vgen-road-sign is-flipped"><span aria-hidden="true">➜</span></span> : <span className="vgen-image-placeholder">等待翻转</span>}
            </div>
            <figcaption>增广后标签：<strong>{flipped ? current.after : '—'}</strong></figcaption>
          </figure>
        </div>
      </section>

      <NoticeStrip tone={readyForCheck ? 'green' : 'orange'} lead={readyForCheck ? '现象已经完整：' : '还差一步：'}>
        {readyForCheck
          ? '像素变换完全相同，但“标签是否保持”取决于模型正在解决的问题。'
          : `你已检查 ${inspected.length}/2 个任务；切换任务并再次翻转，比较标签。`}
      </NoticeStrip>

      {readyForCheck && (
        <Question
          persistenceKey="vision-augmentation-label-preservation-v1"
          type="multiple"
          multiple
          title="根据刚才的实验，哪些判断正确？（多选）"
          options={[
            { key: 'A', value: 'object-valid', label: '识别“是不是交通指示牌”时，水平翻转通常可以保持标签', missedFeedback: '左右翻转没有改变物体类别，它仍是交通指示牌。' },
            { key: 'B', value: 'direction-invalid', label: '识别箭头朝向时，水平翻转会改变标签，不能沿用原标签', missedFeedback: '向右箭头翻转后变成向左，原标签已经失效。' },
            { key: 'C', value: 'always-valid', label: '只要图像看起来仍然清晰，任何增广都一定有效', wrongFeedback: '清晰不等于标签不变；是否有效取决于任务语义。' },
            { key: 'D', value: 'fixed-list', label: '存在一份适用于所有视觉任务的固定增广清单', wrongFeedback: '同一个翻转在两个任务中已经得到不同结论，策略必须结合任务。' },
          ]}
          answer={['object-valid', 'direction-invalid']}
          feedback={{ correct: '判断正确。增广的核心不是“图片变了”，而是“在标签不变的前提下制造合理变化”。' }}
          onCheck={(result) => { if (result.ok) onComplete?.(); }}
        />
      )}
    </ContentBlock>
  );
}
