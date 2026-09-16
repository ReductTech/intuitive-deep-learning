import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Button, ContentBlock, NoticeStrip, Question, RangeControl } from '../../shared/react';

interface BatchStepEpochBlockProps { onComplete?: () => void; }

const SAMPLE_COUNT = 256;
const BATCH_SIZES = [8, 16, 32, 64];

function estimate(batchSize: number) {
  const steps = Math.ceil(SAMPLE_COUNT / batchSize);
  const memoryGb = 2.7 + batchSize * .045;
  const utilization = .35 + .6 * (1 - Math.exp(-batchSize / 24));
  const sampleComputeMs = SAMPLE_COUNT * 12 / utilization;
  const stepOverheadMs = steps * 6;
  return { steps, memoryGb, epochSeconds: (sampleComputeMs + stepOverheadMs) / 1000 };
}

export function BatchStepEpochBlock({ onComplete }: BatchStepEpochBlockProps) {
  const [batchSize, setBatchSize] = useState(32);
  const [currentStep, setCurrentStep] = useState(0);
  const [epoch, setEpoch] = useState(1);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const animationRef = useRef<number | null>(null);
  const metrics = useMemo(() => estimate(batchSize), [batchSize]);
  useEffect(() => () => { if (animationRef.current !== null) cancelAnimationFrame(animationRef.current); }, []);

  function changeBatchSize(value: number) {
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    setBatchSize(value);
    setCurrentStep(0);
    setEpoch(1);
    setRunning(false);
    setCompleted(false);
  }

  function simulateEpoch() {
    if (running) return;
    if (completed) setEpoch((value) => value + 1);
    setCurrentStep(0);
    setCompleted(false);
    setRunning(true);
    const startedAt = performance.now();
    const duration = metrics.epochSeconds * 1000;
    const animate = (now: number) => {
      const ratio = Math.min(1, (now - startedAt) / duration);
      setCurrentStep(Math.min(metrics.steps, Math.floor(ratio * metrics.steps)));
      if (ratio < 1) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      animationRef.current = null;
      setCurrentStep(metrics.steps);
      setRunning(false);
      setCompleted(true);
    };
    animationRef.current = requestAnimationFrame(animate);
  }

  return (
    <ContentBlock className="misc-block misc-bse-block" title="Batch、Step 与 Epoch" subtitle="Batch：一批数据　·　Step：一次参数更新　·　Epoch：完整遍历一次训练集">
      <section className="misc-bse-simulator" aria-label="Batch Size 对训练资源和进度的影响">
        <header className="misc-bse-metrics">
          <article><span>估算显存</span><strong>{metrics.memoryGb.toFixed(1)} GB</strong><i style={{ '--misc-meter': `${metrics.memoryGb / estimate(128).memoryGb * 100}%` } as CSSProperties} /></article>
          <article><span>每个 Epoch 的 Step</span><strong>{metrics.steps}</strong><i style={{ '--misc-meter': `${metrics.steps / estimate(8).steps * 100}%` } as CSSProperties} /></article>
          <article><span>每个 Epoch 总时间</span><strong>{metrics.epochSeconds.toFixed(2)} s</strong><i style={{ '--misc-meter': `${metrics.epochSeconds / estimate(8).epochSeconds * 100}%` } as CSSProperties} /></article>
        </header>

        <div className="misc-bse-control-row">
          <RangeControl label="Batch Size" min={0} max={BATCH_SIZES.length - 1} step={1} value={BATCH_SIZES.indexOf(batchSize)} discrete scale={BATCH_SIZES.map(String)} formatValue={(value) => String(BATCH_SIZES[Number(value)])} disabled={running} onChange={(event) => changeBatchSize(BATCH_SIZES[Number(event.currentTarget.value)])} />
        </div>

        <section className="misc-bse-epoch-process" aria-label="一个 Epoch 的模拟过程">
          <header><div><span>Epoch {epoch}</span><strong>{SAMPLE_COUNT} 个样本</strong></div><p>{SAMPLE_COUNT} ÷ {batchSize} = <strong>{metrics.steps} 个 Step</strong></p></header>
          <div className="misc-bse-epoch-track" style={{ '--misc-step-columns': metrics.steps } as CSSProperties} aria-label={`Epoch 进度，共 ${metrics.steps} 个 Step`}>
            {Array.from({ length: metrics.steps }, (_, index) => <i key={index} className={index < currentStep ? 'is-complete' : running && index === currentStep ? 'is-active' : ''} />)}
          </div>
          <p className="misc-bse-block-scale">每格代表 1 个 Step</p>
          <div className="misc-bse-process-labels"><span>开始</span><strong>{completed ? `Epoch ${epoch} 完成` : running ? `Step ${Math.max(1, currentStep)} / ${metrics.steps}` : '等待开始'}</strong><span>结束</span></div>
          <div className="misc-bse-cycle"><span>{batchSize} 个样本</span><b>→</b><span>前向 + 反向</span><b>→</b><span>更新参数</span></div>
        </section>

        <div className="misc-bse-actions">
          <NoticeStrip tone="blue"><strong>Batch 越大：</strong>显存增加，Step 减少，总时间通常缩短。</NoticeStrip>
          <Button variant="primary" disabled={running} onClick={simulateEpoch}>{running ? `模拟中 ${currentStep} / ${metrics.steps}` : completed ? '再模拟一个 Epoch' : '模拟一个 Epoch'}</Button>
        </div>
      </section>

      <section className="misc-bse-method"><span>估算条件：中型 CNN、单张消费级 GPU、256 个样本</span><span>动画时长 = 当前估算的 Epoch 总时间；真实结果仍取决于具体软硬件</span></section>

      <Question persistenceKey="misc-batch-step-epoch-v3" type="choice" title="训练集大小不变时，增大 Batch Size，下面哪项描述最准确？" options={[{ key: 'A', value: 'all-down', label: '显存和 Step 数都会减少', wrongFeedback: 'Step 数会减少，但单次送入模型的样本更多，显存通常会上升。' }, { key: 'B', value: 'tradeoff', label: '显存增加，Step 数减少，单轮总时间通常缩短' }, { key: 'C', value: 'epoch', label: '每个 Epoch 包含的样本会减少', wrongFeedback: 'Epoch 仍然要求完整遍历训练集，变化的是每批样本数和 Step 数。' }, { key: 'D', value: 'free', label: '样本本身不再需要前向与反向传播', wrongFeedback: '所有样本仍需前向与反向传播；更大的 Batch 只是提高并行度并减少更新次数。' }]} answer="tradeoff" feedback={{ correct: '正确。更大的 Batch 用更多显存并行处理样本，同时减少参数更新次数。', wrong: '训练集仍需完整遍历，样本本身的计算不会消失。' }} onCheck={(result) => { if (result.ok) onComplete?.(); }} />
    </ContentBlock>
  );
}
