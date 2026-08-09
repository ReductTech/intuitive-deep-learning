import { useEffect, useRef, useState } from 'react';
import { Button, ContentBlock, Feedback, NoticeStrip, Question, emitTelemetry, getTelemetryState } from '../../shared/react';

type TaskId = 'classification' | 'detection' | 'semantic' | 'instance';

interface PixelTaskBlockProps { onComplete?: () => void; }
interface PixelTaskState { active?: TaskId; visitedSemantic?: boolean; }

const stateKey = 'experiment:pixel-task-output-v1';
const tasks: Array<{ id: TaskId; label: string; output: string; summary: string }> = [
  { id: 'classification', label: '图像分类', output: '整张图一个类别', summary: '只回答画面主要是什么，不保留目标位置。' },
  { id: 'detection', label: '目标检测', output: '每个目标一个边界框', summary: '定位到矩形区域，但框内背景仍与目标混在一起。' },
  { id: 'semantic', label: '语义分割', output: '每个像素一个语义类别', summary: '同类目标使用同一个类别，不区分它们分别是哪一个实例。' },
  { id: 'instance', label: '实例分割', output: '每个实例一张像素掩码', summary: '既区分类别，也区分同一类别中的不同目标实例。' },
];

export function PixelTaskBlock({ onComplete }: PixelTaskBlockProps) {
  const [active, setActive] = useState<TaskId>('classification');
  const [visitedSemantic, setVisitedSemantic] = useState(false);
  const [questionCorrect, setQuestionCorrect] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const completedRef = useRef(false);
  const current = tasks.find((task) => task.id === active) ?? tasks[0];

  useEffect(() => {
    let alive = true;
    void getTelemetryState<PixelTaskState>(stateKey).then((entry) => {
      if (!alive) return;
      if (entry?.state?.active && tasks.some((task) => task.id === entry.state?.active)) setActive(entry.state.active);
      if (entry?.state?.visitedSemantic) setVisitedSemantic(true);
      setHydrated(true);
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!hydrated || !visitedSemantic || !questionCorrect || completedRef.current) return;
    completedRef.current = true;
    onComplete?.();
  }, [hydrated, onComplete, questionCorrect, visitedSemantic]);

  function inspect(next: TaskId) {
    const nextVisited = visitedSemantic || next === 'semantic' || next === 'instance';
    setActive(next);
    setVisitedSemantic(nextVisited);
    emitTelemetry('pixel_task_output_inspect', null, {
      state_key: stateKey,
      task: next,
      visited_semantic: nextVisited,
      state: { active: next, visitedSemantic: nextVisited },
    });
  }

  return (
    <ContentBlock className="pvm-block pvm-task-block" title="边界框知道目标大概在哪，像素级任务要回答每个位置是什么" subtitle="切换四种视觉任务，观察同一画面需要输出多细的空间信息。">
      <NoticeStrip tone="blue" lead="输出粒度决定任务：">从整图类别、矩形区域到逐像素类别，监督信息越来越精细。</NoticeStrip>
      <div className="pvm-task-tabs" aria-label="视觉任务类型">
        {tasks.map((task) => <Button key={task.id} active={active === task.id} onClick={() => inspect(task.id)}>{task.label}</Button>)}
      </div>
      <div className="pvm-task-layout">
        <div className={`pvm-pixel-scene is-${active}`} role="img" aria-label={`当前显示${current.label}输出：${current.output}`}>
          <span className="pvm-animal pvm-animal--one" aria-hidden="true" />
          <span className="pvm-animal pvm-animal--two" aria-hidden="true" />
          {active === 'classification' && <b className="pvm-image-label">狗</b>}
          {(active === 'detection' || active === 'instance') && <><i className="pvm-box pvm-box--one" /><i className="pvm-box pvm-box--two" /></>}
          {(active === 'semantic' || active === 'instance') && <span className="pvm-mask" aria-hidden="true" />}
        </div>
        <div className="pvm-task-copy"><strong>{current.output}</strong><p>{current.summary}</p><Feedback status={visitedSemantic ? 'correct' : 'hint'} message={visitedSemantic ? '已经看到像素级输出。继续回答语义分割与实例分割的关键区别。' : '至少查看一次语义分割或实例分割，比较它们与边界框的差异。'} /></div>
      </div>
      <Question
        type="choice"
        title="画面里有两只狗。语义分割与实例分割的输出差别是什么？"
        options={[
          { key: 'A', value: 'instances', label: '语义分割把两只狗都标为“狗”；实例分割还要区分狗 1 和狗 2' },
          { key: 'B', value: 'boxes', label: '语义分割只输出矩形框，实例分割只输出整图类别', wrongFeedback: '这分别更接近目标检测和图像分类，不是两种分割任务。' },
          { key: 'C', value: 'no-semantic', label: '语义分割不包含类别，实例分割才包含类别', wrongFeedback: '语义分割的核心就是为每个像素预测语义类别。' },
        ]}
        answer="instances"
        feedback={{ correct: visitedSemantic ? '正确。语义分割区分类别，实例分割还区分同类目标的不同实例。' : '判断正确；再在上方查看一次像素级输出。' }}
        persistenceKey="pixel-task-difference-v1"
        onCheck={(result) => setQuestionCorrect(result.ok)}
      />
    </ContentBlock>
  );
}
