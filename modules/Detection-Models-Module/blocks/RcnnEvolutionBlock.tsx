import { useEffect, useRef, useState } from 'react';
import { Button, ContentBlock, Feedback, NoticeStrip, Question, ValueTile, emitTelemetry, getTelemetryState } from '../../shared/react';

type VariantId = 'rcnn' | 'fast' | 'faster' | 'mask';

interface RcnnEvolutionBlockProps {
  onComplete?: () => void;
}

interface RcnnState {
  active?: VariantId;
  visited?: VariantId[];
}

const stateKey = 'experiment:rcnn-evolution-v1';
const variants: Array<{
  id: VariantId;
  label: string;
  passes: string;
  proposal: string;
  output: string;
  summary: string;
  steps: string[];
}> = [
  {
    id: 'rcnn', label: 'R-CNN', passes: '约 2000 次', proposal: '选择性搜索', output: '类别 + 边界框',
    summary: '每个提议区域分别送进 CNN，重叠区域会被重复计算。',
    steps: ['选择性搜索生成区域', '逐个裁剪并缩放', '每个区域独立跑 CNN', '分类并回归边界框'],
  },
  {
    id: 'fast', label: 'Fast R-CNN', passes: '整图 1 次', proposal: '选择性搜索', output: '类别 + 边界框',
    summary: '先对整图提取共享特征，再用 RoI Pooling 为每个区域取得定长特征。',
    steps: ['整图运行 CNN', '选择性搜索提供区域', 'RoI Pooling 提取区域特征', '分类并回归边界框'],
  },
  {
    id: 'faster', label: 'Faster R-CNN', passes: '整图 1 次', proposal: '可训练 RPN', output: '类别 + 边界框',
    summary: '区域提议也交给网络学习，RPN 与检测头共享整图特征并端到端训练。',
    steps: ['整图运行 CNN', 'RPN 预测候选区域', 'RoI Pooling 对齐特征', '分类并回归边界框'],
  },
  {
    id: 'mask', label: 'Mask R-CNN', passes: '整图 1 次', proposal: '可训练 RPN', output: '类别 + 框 + 掩码',
    summary: '用 RoI Align 更好地保留空间位置，并增加像素级实例掩码分支。',
    steps: ['整图运行 CNN', 'RPN 预测候选区域', 'RoI Align 保留空间位置', '分类、回归框并预测掩码'],
  },
];

export function RcnnEvolutionBlock({ onComplete }: RcnnEvolutionBlockProps) {
  const [active, setActive] = useState<VariantId>('rcnn');
  const [visited, setVisited] = useState<VariantId[]>(['rcnn']);
  const [questionCorrect, setQuestionCorrect] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const completedRef = useRef(false);
  const current = variants.find((variant) => variant.id === active) ?? variants[0];
  const inspectedAll = variants.every((variant) => visited.includes(variant.id));

  useEffect(() => {
    let alive = true;
    void getTelemetryState<RcnnState>(stateKey).then((entry) => {
      if (!alive) return;
      const restoredActive = entry?.state?.active;
      const restoredVisited = entry?.state?.visited?.filter((id): id is VariantId => variants.some((variant) => variant.id === id));
      if (restoredActive && variants.some((variant) => variant.id === restoredActive)) setActive(restoredActive);
      if (restoredVisited?.length) setVisited(restoredVisited);
      setHydrated(true);
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!hydrated || !inspectedAll || !questionCorrect || completedRef.current) return;
    completedRef.current = true;
    onComplete?.();
  }, [hydrated, inspectedAll, onComplete, questionCorrect]);

  function inspect(next: VariantId) {
    const nextVisited = visited.includes(next) ? visited : [...visited, next];
    setActive(next);
    setVisited(nextVisited);
    emitTelemetry('rcnn_variant_inspect', null, {
      state_key: stateKey,
      variant: next,
      visited: nextVisited,
      state: { active: next, visited: nextVisited },
    });
  }

  return (
    <ContentBlock
      className="dmm-block dmm-rcnn-block"
      title="R-CNN 系列一直在消除重复计算，并把手工步骤变成可学习模块"
      subtitle="依次查看四代结构，比较卷积前向次数、候选区域来源和最终输出。"
    >
      <NoticeStrip tone="blue" lead="演进主线：">R-CNN 逐区域提特征 → Fast 共享整图特征 → Faster 用 RPN 学习提议 → Mask 增加像素级分支。</NoticeStrip>
      <div className="dmm-variant-tabs" aria-label="选择 R-CNN 变体">
        {variants.map((variant) => (
          <Button key={variant.id} active={active === variant.id} hint={!visited.includes(variant.id)} onClick={() => inspect(variant.id)}>{variant.label}</Button>
        ))}
      </div>
      <div className="dmm-rcnn-layout">
        <div className="dmm-architecture-panel">
          <header><strong>{current.label}</strong><span>{current.summary}</span></header>
          <ol className="dmm-pipeline-steps">
            {current.steps.map((step, index) => <li key={step}><span>{index + 1}</span><strong>{step}</strong></li>)}
          </ol>
        </div>
        <div className="dmm-variant-console">
          <ValueTile label="CNN 特征提取" value={current.passes} tone={active === 'rcnn' ? 'orange' : 'success'} />
          <ValueTile label="提议区域来源" value={current.proposal} tone="blue" />
          <ValueTile label="输出任务" value={current.output} tone={active === 'mask' ? 'success' : 'blue'} />
          <Feedback
            className="dmm-variant-feedback"
            status={inspectedAll ? 'correct' : 'hint'}
            message={inspectedAll ? '四代结构已经看完。现在用下面的问题概括两次最关键的效率改进。' : `还需查看 ${variants.length - visited.length} 个结构，注意每次变化发生在哪个步骤。`}
          />
        </div>
      </div>
      <Question
        type="choice"
        title="Fast R-CNN 与 Faster R-CNN 分别解决了哪两个瓶颈？"
        options={[
          { key: 'A', value: 'share-and-rpn', label: 'Fast 共享整图 CNN 特征；Faster 用可训练 RPN 替代选择性搜索' },
          { key: 'B', value: 'mask-and-nms', label: 'Fast 增加实例掩码；Faster 删除 NMS', wrongFeedback: '实例掩码属于 Mask R-CNN；Faster R-CNN 的 RPN 和最终检测仍会使用 NMS。' },
          { key: 'C', value: 'more-crops', label: 'Fast 增加逐区域 CNN 次数；Faster 改回手工候选区', wrongFeedback: '演进方向正好相反：减少重复卷积，并把候选区生成变成可学习网络。' },
        ]}
        answer="share-and-rpn"
        feedback={{ correct: inspectedAll ? '正确。共享特征消除重叠区域的重复卷积，RPN 则把候选区域生成纳入端到端训练。' : '判断正确；还需查看上方所有四代结构，确认完整演进链路。' }}
        persistenceKey="rcnn-evolution-check-v1"
        onCheck={(result) => setQuestionCorrect(result.ok)}
      />
    </ContentBlock>
  );
}
