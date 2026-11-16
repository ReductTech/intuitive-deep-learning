// @refresh reset
import { useEffect, useState } from 'react';
import { Button, ContentBlock, Typography } from "@shuku/course-style/react";
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
  return <ContentBlock shuku-edit-id="e-eea0cbdf-9612-49db-a489-e792402953a4" headingLevel={1} className="rtg-workflow" title="拿到预训练权重以后，下一步怎么做？" subtitle="逐步看数据、参数与验证的作用。"
    data-step={step} data-frame={frame} data-count={completed} data-playing={playback.playing} data-complete={completed === 6}
    onKeyDown={event => { if ((event.key === ' ' || event.key === 'Enter') && (event.target as Element).closest('button')) {
      event.stopPropagation(); if (event.repeat) event.preventDefault();
    } }}>
    <section shuku-edit-id="e-fe1df662-2ae5-4270-a867-ba558b75f0f0" className="rtg-workflow__lab" aria-label="迁移学习六步动画">
      <nav shuku-edit-id="e-cf68b227-6863-42a7-bbfe-250890e5517f" className="rtg-workflow__rail" aria-label="六步流程，可回看已完成步骤">{FLOW_STEPS.map((item, index) =>
        <div shuku-edit-id="e-059f934a-8a1e-449f-8c36-7ed99c839941" key={item.short} className={(index < completed ? 'is-done ' : '') + (step === index ? 'is-current' : '')}>
          <Button data-flow-node={index} aria-label={'查看' + item.short} aria-current={step === index ? 'step' : undefined}
            disabled={playback.playing || index > Math.min(completed, 5)} onClick={() => review(index)}>
            <Typography shuku-edit-id="e-1215ffc2-ff99-440c-a435-9b7ff2ab1a5e" as="span" variant="body" tone="inherit">{index < completed ? '✓' : index + 1}</Typography>
          </Button><Typography shuku-edit-id="e-f75dcaa3-a8a7-4293-9142-4246f1c62296" variant="bodySmall" tone="accent" align="center">{item.short}</Typography>
        </div>)}</nav>
      <div shuku-edit-id="e-c9c891a4-adad-4f58-a166-14825e408073" className="rtg-workflow__main">
        <Typography shuku-edit-id="e-5f9a94a3-565d-4ea0-8589-f27d46f47361" variant="h3" tone="accent">{'0' + (step + 1) + ' · ' + FLOW_STEPS[step].title}</Typography>
        <div shuku-edit-id="e-5ece1364-48e0-4ac5-b39f-69b544ea1eff" key={step + '-' + playback.run} className={'rtg-workflow__scene scene-' + step + (playback.playing ? ' is-playing' : '')} data-scene-frame={frame}>
          {step === 0 && <div shuku-edit-id="e-3dce1d25-d719-4e3e-b564-d82eec2e5a5d" className="rtg-workflow__split"><PhotoStack label="未划分的样本" /><TransferArrow /><DatasetSplit frame={frame} /></div>}
          {step === 1 && <div shuku-edit-id="e-f1231590-17a1-4553-b3d6-823efd60ca32" className="rtg-workflow__load">
            <figure shuku-edit-id="e-22640b81-8cb0-4937-b333-9ea4774b25da" className={'rtg-workflow__weight-source' + (frame >= 1 ? ' is-moving' : '')}><WeightCheckpoint /><Typography shuku-edit-id="e-8f7dfdea-3220-4134-9e5a-ad04de1651be" as="figcaption" variant="bodySmall" tone="accent">预训练权重</Typography></figure>
            <TransferArrow /><figure shuku-edit-id="e-3739536b-5ff9-43e1-b612-b5ec68b0c19c" data-weights-loaded={frame === 3}><TransferSlabs tone={frame >= 2 ? 'original' : 'empty'} />
              <Typography shuku-edit-id="e-b137e8fd-f4e3-4c8a-9359-5d4e44f47d3f" as="figcaption" variant="bodySmall" tone={frame === 3 ? 'success' : 'accent'} align="center">{frame === 3 ? '✓ 骨干参数已装入' : 'ResNet-18 骨干'}</Typography></figure>
          </div>}
          {step === 2 && <div shuku-edit-id="e-63ce45dd-dded-4008-a707-4095e32c389e" className="rtg-workflow__replace"><figure shuku-edit-id="e-6e78c0e6-7857-43ed-995f-b3b6d8df470e"><TransferSlabs /><Typography shuku-edit-id="e-5ab1ee25-e1ad-433f-b370-cb838bcfd544" as="figcaption" variant="bodySmall" tone="accent" align="center">保留骨干</Typography></figure><TransferArrow />
            <figure shuku-edit-id="e-ad9ca145-3f75-40c2-bc5f-384a64465bb2" className="rtg-workflow__head-swap" data-new-head-ready={frame >= 2}>
              <div shuku-edit-id="e-46147f8b-c130-4292-9a6e-43b006ded9a8"><div shuku-edit-id="e-e69b7e0b-a664-4b88-9ecb-16e671c4ac97" className="old-head"><TransferSlabs count={1} tone="frozen" /></div><div shuku-edit-id="e-e8340652-3a01-4d4d-9fa6-c78ebaac0359" className="new-head"><TransferSlabs count={1} tone="trainable" /></div></div>
              <Typography shuku-edit-id="e-b3cd5077-7d3d-4d43-9098-0ce2259df8a4" as="figcaption" variant="bodySmall" tone={frame >= 2 ? 'warning' : 'muted'} align="center">{frame >= 2 ? '三分类头 · 新建' : '旧分类头'}</Typography>
            </figure>
          </div>}
          {step === 3 && <ParameterRange trainableFrom={5} pending={frame === 0} label="冻结骨干，仅新分类头可训练" />}
          {step === 4 && <div shuku-edit-id="e-7b1e05c1-96c3-4055-8273-aa5aca77ee9c" className="rtg-workflow__train" data-update-target="head">
            <div shuku-edit-id="e-8d6d652b-0529-4d0c-8148-c9fbed8d8a26" className="rtg-workflow__pipeline"><PhotoStack /><TransferArrow />
              <figure shuku-edit-id="e-5cf6f4b4-60f3-4a35-80ad-d4fda94662ff"><TransferSlabs tone="frozen" /><Typography shuku-edit-id="e-68c51bfa-96c3-4029-aba2-236142cc5c27" as="figcaption" variant="bodySmall" tone="accent" align="center"><span shuku-edit-id="e-91f470ee-cb5a-4793-a547-3047f7e326c8" className="rtg-workflow__locked-caption"><TransferLock />骨干 · 冻结</span></Typography></figure>
              <TransferArrow /><figure shuku-edit-id="e-4d14c0ae-96d0-4845-baab-dd090d0d93dc" className={playback.playing && frame >= 1 ? 'is-updating' : ''}><TransferSlabs count={1} tone="trainable" />
                <Typography shuku-edit-id="e-ea47d428-2cb0-4ed7-9f65-202d82fe1e4c" as="figcaption" variant="bodySmall" tone="warning" align="center">新头 · 可训练</Typography></figure><TransferArrow />
              <div shuku-edit-id="e-e02be4d3-0436-4fb8-8743-e0437bd05327" className="rtg-workflow__loss"><Typography shuku-edit-id="e-308774c4-7cc5-4cd9-90bb-18e67d934f3c" variant="bodySmall" tone="accent" align="center">训练损失</Typography></div>
            </div>
            <div shuku-edit-id="e-0d06d154-86a8-4b63-95bc-f0dd9fbac12e" className={'rtg-workflow__update-path' + (frame >= 2 ? ' is-visible' : '')}>
              <svg shuku-edit-id="e-5f0dae5d-2cec-4504-932a-1e996dd5caba" viewBox="0 0 400 70" aria-hidden="true"><path shuku-edit-id="e-dad5852c-9dd2-46a8-84ea-9f5f32b9e3a1" d="M360 2C360 78 120 78 120 2M110 14L120 2L130 14" /></svg>
              <Typography shuku-edit-id="e-88b49898-020b-4b7c-8853-8d2eb21c7451" variant="bodySmall" tone="warning" align="center">仅更新新头</Typography>
            </div>
          </div>}
          {step === 5 && <ValidationPaths frame={frame} />}
        </div>
      </div>
      <div shuku-edit-id="e-c96e5301-fa29-4402-98ca-96f4da71ec4f" className="rtg-workflow__annotation" role="status" aria-live="polite">
        <Typography shuku-edit-id="e-488e7354-5349-4f7d-b8f9-b52f5e68ddd4" variant="bodySmall" tone="accent">{FLOW_STEPS[step].note}</Typography>
        <span shuku-edit-id="e-6917cfc8-adf7-4733-995e-db715a4c0e83" className="rtg-workflow__test-lock"><TransferLock open={step === 5 && frame === 3} /><Typography shuku-edit-id="e-06aff674-8c91-46de-8a31-8620bd285924" as="span" variant="bodySmall" tone="muted">测试集 · 最后使用</Typography></span>
      </div>
    </section>
    <footer shuku-edit-id="e-c7fd77a3-9cc9-4720-9770-31315ca87ae7" className="rtg-workflow__actions">
      <Button data-reset onClick={reset}>重新演示</Button>
      <Button data-flow-next variant="primary" disabled={playback.playing} hint={completed === 0 && !playback.playing} onClick={next}>{label}</Button>
      <Typography shuku-edit-id="e-0b92a346-5ad8-4e71-8f66-11952556f6cb" variant="bodySmall" tone="muted" align="end">教学动画，非训练实测。</Typography>
    </footer>
  </ContentBlock>;
}
