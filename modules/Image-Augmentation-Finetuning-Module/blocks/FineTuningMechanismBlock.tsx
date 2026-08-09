import { useEffect, useRef, useState } from 'react';
import { Button, ContentBlock, Feedback, NoticeStrip, Question, Select, emitTelemetry, getTelemetryState } from '../../shared/react';

interface FineTuningMechanismBlockProps {
  onComplete?: () => void;
}

type WarmupMode = '' | 'all' | 'head' | 'none';
type BackboneRate = '' | 'same' | 'smaller' | 'larger';

interface FineTuningState {
  warmupMode?: WarmupMode;
  backboneRate?: BackboneRate;
  configured?: boolean;
}

const stateKey = 'experiment:vision-finetuning-setup-v1';

export function FineTuningMechanismBlock({ onComplete }: FineTuningMechanismBlockProps) {
  const [warmupMode, setWarmupMode] = useState<WarmupMode>('');
  const [backboneRate, setBackboneRate] = useState<BackboneRate>('');
  const [configured, setConfigured] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    void getTelemetryState<FineTuningState>(stateKey).then((entry) => {
      if (!active) return;
      const state = entry?.state;
      if (state?.warmupMode) setWarmupMode(state.warmupMode);
      if (state?.backboneRate) setBackboneRate(state.backboneRate);
      if (state?.configured) {
        setConfigured(true);
        setAttempted(true);
      }
      setHydrated(true);
    });
    return () => { active = false; };
  }, []);

  function runSetup() {
    if (!hydrated || !warmupMode || !backboneRate) return;
    const correct = warmupMode === 'head' && backboneRate === 'smaller';
    setAttempted(true);
    setConfigured(correct);
    emitTelemetry('finetuning_setup_submit', rootRef.current, {
      state_key: stateKey,
      state: { warmupMode, backboneRate, configured: correct },
      correct,
    });
  }

  const feedback = (() => {
    if (!attempted) return null;
    if (configured) return { status: 'correct' as const, message: '配置成功：先让随机初始化的新分类头稳定下来，再小幅调整已经学会通用视觉特征的骨干网络。' };
    if (warmupMode !== 'head') return { status: 'wrong' as const, message: '第一阶段应先冻结骨干网络，只训练刚替换的新分类头，避免随机分类头把大梯度传回骨干。' };
    return { status: 'wrong' as const, message: '解冻后，骨干网络应使用更小学习率；它已有有用特征，只需要针对新数据做小幅调整。' };
  })();

  return (
    <ContentBlock
      className="vgen-block vgen-finetuning-block"
      title="预训练模型已经会看图，哪些参数还要重新学？"
      subtitle="骨干网络从大数据中学到边缘、纹理和形状；原分类头只认识旧任务的类别。微调需要保护前者并替换后者。"
    >
      <div className="vgen-finetuning-layout" ref={rootRef}>
        <section className="vgen-network-transfer" aria-labelledby="vgen-transfer-title">
          <header>
            <span>预训练模型 → 新任务</span>
            <h3 id="vgen-transfer-title">保留通用特征，替换任务专属输出</h3>
          </header>
          <div className="vgen-network-stack" role="img" aria-label="预训练骨干网络包含边缘、纹理和形状特征，旧分类头被新的两分类头替换">
            <div className="vgen-feature-layer"><span>浅层特征</span><strong>边缘与颜色</strong><small>通用性高</small></div>
            <span className="vgen-layer-arrow" aria-hidden="true">→</span>
            <div className="vgen-feature-layer"><span>中层特征</span><strong>纹理与局部形状</strong><small>可迁移</small></div>
            <span className="vgen-layer-arrow" aria-hidden="true">→</span>
            <div className="vgen-feature-layer"><span>深层特征</span><strong>组合形状</strong><small>小幅调整</small></div>
            <span className="vgen-layer-arrow" aria-hidden="true">→</span>
            <div className="vgen-head-swap">
              <span className="is-old">旧分类头 · 1000 类</span>
              <strong aria-hidden="true">↓ 替换</strong>
              <span className="is-new">新分类头 · 2 类</span>
            </div>
          </div>
          <NoticeStrip tone="blue" lead="关键区别：">预训练所在的 ImageNet 是源数据集，猫狗照片是目标数据集；迁移学习描述“复用源模型知识”，微调则是复用后继续用目标数据更新部分或全部参数。</NoticeStrip>
        </section>

        <section className="vgen-finetuning-console" aria-labelledby="vgen-console-title">
          <header>
            <span>你的任务</span>
            <h3 id="vgen-console-title">为 800 张猫狗照片配置微调流程</h3>
            <p>预训练骨干来自 ImageNet；新分类头刚刚随机初始化。</p>
          </header>
          <div className="vgen-phase-row">
            <b>阶段 1</b>
            <Select
              label="刚替换分类头时，先更新哪些参数？"
              value={warmupMode}
              options={[
                { value: '', label: '请选择', disabled: true },
                { value: 'all', label: '骨干网络和分类头全部更新' },
                { value: 'head', label: '冻结骨干，只更新新分类头' },
                { value: 'none', label: '全部冻结，不更新参数' },
              ]}
              onChange={(value) => { setWarmupMode(value as WarmupMode); setAttempted(false); setConfigured(false); }}
            />
          </div>
          <div className="vgen-phase-row">
            <b>阶段 2</b>
            <Select
              label="解冻骨干后，它的学习率应如何设置？"
              value={backboneRate}
              options={[
                { value: '', label: '请选择', disabled: true },
                { value: 'same', label: '与新分类头完全相同' },
                { value: 'smaller', label: '设为新分类头的约 1/10' },
                { value: 'larger', label: '设为新分类头的约 10 倍' },
              ]}
              onChange={(value) => { setBackboneRate(value as BackboneRate); setAttempted(false); setConfigured(false); }}
            />
          </div>
          <Button variant="primary" hint={!attempted} disabled={!warmupMode || !backboneRate} onClick={runSetup}>运行两阶段微调</Button>
          {feedback && <Feedback status={feedback.status} message={feedback.message} />}
        </section>
      </div>

      {configured && (
        <Question
          persistenceKey="vision-finetuning-mechanism-v1"
          type="multiple"
          multiple
          title="为什么不能把预训练骨干当作一个随机初始化的新网络来猛烈更新？（多选）"
          options={[
            { key: 'A', value: 'reuse', label: '骨干已经学到可复用的视觉特征，过大的更新可能破坏这些知识', missedFeedback: '预训练的价值正是这些已学到的通用特征。' },
            { key: 'B', value: 'head-random', label: '新分类头开始时是随机的，先单独训练能减少不稳定梯度对骨干的影响', missedFeedback: '先稳定新分类头，是常见的微调起点。' },
            { key: 'C', value: 'never-update', label: '预训练骨干永远不能再更新任何参数', wrongFeedback: '当新任务与原任务存在差异时，解冻并小幅更新骨干通常有帮助。' },
            { key: 'D', value: 'no-data', label: '使用预训练模型后不再需要新任务的标注数据', wrongFeedback: '新的分类头和任务适配仍需要新任务数据。' },
          ]}
          answer={['reuse', 'head-random']}
          feedback={{ correct: '正确。微调不是从零重学，而是在保护已有能力的同时让模型适应新任务。' }}
          onCheck={(result) => { if (result.ok) onComplete?.(); }}
        />
      )}
    </ContentBlock>
  );
}
