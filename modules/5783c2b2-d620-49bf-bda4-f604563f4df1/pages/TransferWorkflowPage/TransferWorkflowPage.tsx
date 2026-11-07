// @refresh reset
import { useEffect, useState } from 'react';
import { Button, ContentBlock, Typography } from '../../../shared/react';
import { ParameterRange } from '../../components/ParameterRange/ParameterRange';
import { DatasetSplit, PhotoStack, TransferArrow, TransferLock, TransferSlabs, ValidationPaths, WeightCheckpoint } from '../../components/TransferVisuals/TransferVisuals';
import { useTeachingPlayback } from '../../hooks/useTeachingPlayback';
import { useCompleteOnce } from '../../hooks/useCompleteOnce';
import './TransferWorkflowPage.css';

export const FLOW_STEPS = [
  { short: '划分数据', title: '先划分，再训练', note: '训练、验证、测试，使用独立样本。' },
  { short: '装入权重', title: '借用已有视觉经验', note: '装入的是参数，不是旧任务答案。' },
  { short: '替换新头', title: '换成三分类头', note: '新头输出塑料瓶、易拉罐、纸盒的分数。' },
  { short: '确定范围', title: '先冻结骨干，训练新头', note: '冻结层仍做前向计算，但不更新参数。' },
  { short: '训练模型', title: '训练新分类头', note: '训练集更新参数；冻结层保持不变。' },
  { short: '验证迭代', title: '验证比较，再独立测试', note: '验证选择方案；确定后再使用测试集。' },
] as const;
export interface TransferWorkflowPageProps { onComplete?: () => void; }
export function TransferWorkflowPage({ onComplete }: TransferWorkflowPageProps) {
  const [step, setStep] = useState(0), [completed, setCompleted] = useState(0);
  const playback = useTeachingPlayback(400);
  const frame = !playback.playing && playback.frame === 0 && step < completed ? 3 : playback.frame;
  useEffect(() => {
    if (playback.frame === 3 && !playback.playing) setCompleted(previous => step <= previous ? Math.max(previous, step + 1) : previous);
  }, [playback.frame, playback.playing, step]);
  useCompleteOnce(completed === 6, onComplete);
  function next() {
    if (playback.playing) return;
    if (step < completed && step < 5) setStep(previous => previous + 1);
    playback.play();
  }
  function review(index: number) {
    if (playback.playing || !Number.isInteger(index) || index < 0 || index > Math.min(completed, 5)) return;
    playback.reset(); setStep(index);
  }
  function reset() { playback.reset(); setStep(0); setCompleted(0); }
  const label = playback.playing ? '演示中…' : step === 5 && completed === 6 ? '重播验证闭环'
    : step < completed ? '继续：' + FLOW_STEPS[Math.min(5, step + 1)].short + ' →' : '演示：' + FLOW_STEPS[step].short;
  return <ContentBlock headingLevel={1} className="rtg-workflow" title="拿到预训练权重以后，下一步怎么做？" subtitle="逐步看数据、参数与验证的作用。"
    data-step={step} data-frame={frame} data-count={completed} data-playing={playback.playing} data-complete={completed === 6}
    onKeyDown={event => { if ((event.key === ' ' || event.key === 'Enter') && (event.target as Element).closest('button')) {
      event.stopPropagation(); if (event.repeat) event.preventDefault();
    } }}>
    <section className="rtg-workflow__lab" aria-label="迁移学习六步动画">
      <nav className="rtg-workflow__rail" aria-label="六步流程，可回看已完成步骤">{FLOW_STEPS.map((item, index) =>
        <div key={item.short} className={(index < completed ? 'is-done ' : '') + (step === index ? 'is-current' : '')}>
          <Button data-flow-node={index} aria-label={'查看' + item.short} aria-current={step === index ? 'step' : undefined}
            disabled={playback.playing || index > Math.min(completed, 5)} onClick={() => review(index)}>
            <Typography as="span" variant="body" tone="inherit">{index < completed ? '✓' : index + 1}</Typography>
          </Button><Typography variant="bodySmall" tone="accent" align="center">{item.short}</Typography>
        </div>)}</nav>
      <div className="rtg-workflow__main">
        <Typography variant="h3" tone="accent">{'0' + (step + 1) + ' · ' + FLOW_STEPS[step].title}</Typography>
        <div key={step + '-' + playback.run} className={'rtg-workflow__scene scene-' + step + (playback.playing ? ' is-playing' : '')} data-scene-frame={frame}>
          {step === 0 && <div className="rtg-workflow__split"><PhotoStack label="未划分的样本" /><TransferArrow /><DatasetSplit frame={frame} /></div>}
          {step === 1 && <div className="rtg-workflow__load">
            <figure className={'rtg-workflow__weight-source' + (frame >= 1 ? ' is-moving' : '')}><WeightCheckpoint /><Typography as="figcaption" variant="bodySmall" tone="accent">预训练权重</Typography></figure>
            <TransferArrow /><figure data-weights-loaded={frame === 3}><TransferSlabs tone={frame >= 2 ? 'original' : 'empty'} />
              <Typography as="figcaption" variant="bodySmall" tone={frame === 3 ? 'success' : 'accent'} align="center">{frame === 3 ? '✓ 骨干参数已装入' : 'ResNet-18 骨干'}</Typography></figure>
          </div>}
          {step === 2 && <div className="rtg-workflow__replace"><figure><TransferSlabs /><Typography as="figcaption" variant="bodySmall" tone="accent" align="center">保留骨干</Typography></figure><TransferArrow />
            <figure className="rtg-workflow__head-swap" data-new-head-ready={frame >= 2}>
              <div><div className="old-head"><TransferSlabs count={1} tone="frozen" /></div><div className="new-head"><TransferSlabs count={1} tone="trainable" /></div></div>
              <Typography as="figcaption" variant="bodySmall" tone={frame >= 2 ? 'warning' : 'muted'} align="center">{frame >= 2 ? '三分类头 · 新建' : '旧分类头'}</Typography>
            </figure>
          </div>}
          {step === 3 && <ParameterRange trainableFrom={5} pending={frame === 0} label="冻结骨干，仅新分类头可训练" />}
          {step === 4 && <div className="rtg-workflow__train" data-update-target="head">
            <div className="rtg-workflow__pipeline"><PhotoStack /><TransferArrow />
              <figure><TransferSlabs tone="frozen" /><Typography as="figcaption" variant="bodySmall" tone="accent" align="center"><span className="rtg-workflow__locked-caption"><TransferLock />骨干 · 冻结</span></Typography></figure>
              <TransferArrow /><figure className={playback.playing && frame >= 1 ? 'is-updating' : ''}><TransferSlabs count={1} tone="trainable" />
                <Typography as="figcaption" variant="bodySmall" tone="warning" align="center">新头 · 可训练</Typography></figure><TransferArrow />
              <div className="rtg-workflow__loss"><Typography variant="bodySmall" tone="accent" align="center">训练损失</Typography></div>
            </div>
            <div className={'rtg-workflow__update-path' + (frame >= 2 ? ' is-visible' : '')}>
              <svg viewBox="0 0 400 70" aria-hidden="true"><path d="M360 2C360 78 120 78 120 2M110 14L120 2L130 14" /></svg>
              <Typography variant="bodySmall" tone="warning" align="center">仅更新新头</Typography>
            </div>
          </div>}
          {step === 5 && <ValidationPaths frame={frame} />}
        </div>
      </div>
      <div className="rtg-workflow__annotation" role="status" aria-live="polite">
        <Typography variant="bodySmall" tone="accent">{FLOW_STEPS[step].note}</Typography>
        <span className="rtg-workflow__test-lock"><TransferLock open={step === 5 && frame === 3} /><Typography as="span" variant="bodySmall" tone="muted">测试集 · 最后使用</Typography></span>
      </div>
    </section>
    <footer className="rtg-workflow__actions">
      <Button data-reset onClick={reset}>重新演示</Button>
      <Button data-flow-next variant="primary" disabled={playback.playing} hint={completed === 0 && !playback.playing} onClick={next}>{label}</Button>
      <Typography variant="bodySmall" tone="muted" align="end">教学动画，非训练实测。</Typography>
    </footer>
  </ContentBlock>;
}
