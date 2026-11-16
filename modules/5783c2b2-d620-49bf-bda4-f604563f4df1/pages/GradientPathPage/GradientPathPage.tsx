import { useState } from 'react';
import { Button, ContentBlock, NoticeStrip, Typography } from "@shuku/course-style/react";
import { useCompleteOnce } from '../../hooks/useCompleteOnce';
import './GradientPathPage.css';

type Depth = 2 | 5 | 10;
type SignalMode = 'decay' | 'amplify';

export interface GradientPathPageProps { onComplete?: () => void; }

export function GradientPathPage({ onComplete }: GradientPathPageProps) {
  const [depth, setDepth] = useState<Depth>(2);
  const [travelled, setTravelled] = useState(0);
  const [mode, setMode] = useState<SignalMode>('decay');
  const [completedDepths, setCompletedDepths] = useState<Set<Depth>>(() => new Set());
  const [extensionSeen, setExtensionSeen] = useState(false);
  const factor = mode === 'decay' ? 0.8 : 1.1;
  const currentSignal = Math.pow(factor, travelled);
  const decayExplored = ([2, 5, 10] as Depth[]).every((value) => completedDepths.has(value));
  const complete = decayExplored && extensionSeen;

  useCompleteOnce(complete, onComplete);

  const chooseDepth = (value: Depth) => {
    setDepth(value);
    setTravelled(0);
    setMode('decay');
  };

  const nextLayer = () => {
    const next = Math.min(depth, travelled + 1);
    setTravelled(next);
    if (mode === 'decay' && next === depth) setCompletedDepths((current) => new Set([...current, depth]));
    if (mode === 'amplify' && next === depth) setExtensionSeen(true);
  };

  const openAmplify = () => {
    setMode('amplify');
    setDepth(10);
    setTravelled(0);
  };

  return (
    <ContentBlock shuku-edit-id="e-67a4b2ac-1344-4a7b-ac8d-0d4d89c96974"
      headingLevel={1}
      className="rtg-gradient-path"
      title="训练信号要穿过多少层？"
      subtitle="固定每层的局部变化，手动让梯度从损失端一层一层传回输入端。"
    >
      <div shuku-edit-id="e-ec7e3ffe-ac42-4862-850f-32275b6e8cfd" className="rtg-gradient-path__toolbar">
        <div shuku-edit-id="e-99a23639-54f4-421c-8d2d-db2bdaaaba2f" role="group" aria-label="选择网络深度">
          <Typography shuku-edit-id="e-5100fbd9-df61-414c-8463-4d1b11045c01" as="strong" variant="bodySmall" tone="warning">网络深度</Typography>
          {([2, 5, 10] as Depth[]).map((value) => (
            <Button key={value} active={mode === 'decay' && depth === value} variant={mode === 'decay' && depth === value ? 'primary' : 'default'} onClick={() => chooseDepth(value)}>
              <Typography shuku-edit-id="e-697bf71a-7e76-4e19-a33c-60b5319fd02a" as="span" variant="bodySmall" tone="inherit">{value} 层</Typography>
            </Button>
          ))}
        </div>
        <Typography shuku-edit-id="e-5b83c6bc-ef7a-4ae3-b982-f8868ca0baa2" as="code" variant="body" tone={mode === 'decay' ? 'accent' : 'warning'}>
          每层 × {factor.toFixed(1)}
        </Typography>
        {decayExplored && (
          <Button variant={mode === 'amplify' ? 'warn' : 'default'} active={mode === 'amplify'} onClick={openAmplify}>
            <Typography shuku-edit-id="e-f6507e51-9c34-45f7-bff1-cdbc96857687" as="span" variant="bodySmall" tone="inherit">扩展：每层 × 1.1</Typography>
          </Button>
        )}
      </div>

      <section shuku-edit-id="e-04058834-7ec9-44c2-ae81-ae8f60ab65ff" className={`rtg-gradient-path__stage is-${mode}`} aria-label="梯度逐层传播示意">
        <div shuku-edit-id="e-538585ac-8829-41cc-a772-fb61bace257d" className="rtg-gradient-path__summary">
          <div shuku-edit-id="e-9da3889d-d3ae-4f8e-8ac0-ca4552766f04">
            <Typography shuku-edit-id="e-98fcb5db-6087-4a68-9565-df7c40c6b917" as="span" variant="bodySmall" tone="muted">已经穿过</Typography>
            <Typography shuku-edit-id="e-4fbaca4b-a329-48dd-bab2-27a89beda0b7" as="strong" variant="h2" tone="accent">{travelled} / {depth} 层</Typography>
          </div>
          <div shuku-edit-id="e-5f04d28a-fd0c-46f6-aec0-f798b13e3d55">
            <Typography shuku-edit-id="e-333b585b-ccbf-493a-8405-505a7a135145" as="span" variant="bodySmall" tone="muted">当前相对信号</Typography>
            <Typography shuku-edit-id="e-10fa7e43-527e-4107-a34d-b1f8655a727f" as="strong" variant="h1" tone={mode === 'decay' ? 'accent' : 'warning'}>{currentSignal.toFixed(3)}</Typography>
          </div>
          <Typography shuku-edit-id="e-c40d6e95-3081-47c2-b075-adfc4caf1a36" as="code" variant="body" tone="muted">{factor.toFixed(1)}^{travelled} = {currentSignal.toFixed(3)}</Typography>
        </div>

        <div shuku-edit-id="e-7b85d385-35ea-4f8e-bc66-e7a69029cce1" className="rtg-gradient-path__network">
          <div shuku-edit-id="e-ed3c096d-fcf7-411d-91cd-4cbb45750e2a" className="rtg-gradient-path__endpoint">
            <Typography shuku-edit-id="e-e169e4f0-b002-4319-bd9a-922fb16c7978" as="strong" variant="body" tone="accent">前端层</Typography>
            <Typography shuku-edit-id="e-01355b74-4a0b-4b61-a3a2-131a2b2276f1" variant="bodySmall" tone="muted">等待训练信号</Typography>
          </div>
          <div shuku-edit-id="e-0816b70c-8607-4ed1-9f97-7038a76b5060" className="rtg-gradient-path__layers">
            {Array.from({ length: depth }, (_, index) => {
              const stepFromLoss = depth - index;
              const active = stepFromLoss <= travelled;
              return (
                <div shuku-edit-id="e-c45c8744-9aa3-49a9-bc96-3848b8c48da3" className={active ? 'is-active' : ''} key={index}>
                  <span shuku-edit-id="e-b14f8c9b-c123-493a-be56-1640dca09244" aria-hidden="true" />
                  <Typography shuku-edit-id="e-256353f5-e885-4241-b846-d5641cce831e" as="span" variant="bodySmall" tone={active ? 'accent' : 'light'}>L{index + 1}</Typography>
                  {active && <Typography shuku-edit-id="e-01210bc7-7edf-4a5c-8b88-e7bca4d3097b" as="code" variant="bodySmall" tone="inherit">{Math.pow(factor, stepFromLoss).toFixed(2)}</Typography>}
                </div>
              );
            })}
          </div>
          <div shuku-edit-id="e-90f10369-fb5d-4719-8291-f788ecb18406" className="rtg-gradient-path__endpoint is-loss">
            <Typography shuku-edit-id="e-5f78cb32-dea0-433b-897d-de428dd92473" as="strong" variant="body" tone="danger">损失</Typography>
            <Typography shuku-edit-id="e-d7a1c7c3-6ab1-47a4-992b-e5259c02a328" variant="bodySmall" tone="muted">梯度从这里出发</Typography>
          </div>
        </div>

        <div shuku-edit-id="e-4d6d78d5-6747-4367-bd30-813bf65e99a3" className="rtg-gradient-path__actions">
          <Button disabled={travelled === 0} onClick={() => setTravelled((value) => Math.max(0, value - 1))}>
            <Typography shuku-edit-id="e-36b5148e-1132-4264-8f0e-f6b14371fe61" as="span" variant="bodySmall" tone="inherit">退回一层</Typography>
          </Button>
          <Typography shuku-edit-id="e-124f4b77-faff-40f1-a0b3-404dd08af52e" as="span" variant="bodySmall" tone="muted">由你决定何时继续，不自动播放</Typography>
          <Button variant="primary" disabled={travelled >= depth} hint={travelled === 0} onClick={nextLayer}>
            <Typography shuku-edit-id="e-0c93f107-6f2c-4e24-8134-5fcd33eaab4e" as="span" variant="bodySmall" tone="inherit">{travelled >= depth ? '已到达输入端' : '让梯度再穿过一层'}</Typography>
          </Button>
        </div>
      </section>

      <NoticeStrip tone={complete ? 'green' : mode === 'amplify' ? 'orange' : 'blue'} role="status">
        <Typography shuku-edit-id="e-a5b0334b-9765-42f5-9af4-73fc2076138b" variant="body" tone="inherit">
          {complete
            ? '连续相乘既可能让梯度越来越小，也可能让它越来越大；深层训练首先是优化问题。'
            : mode === 'amplify'
              ? '现在每层乘 1.1。把信号送完 10 层，观察另一种累积结果。'
              : travelled === depth
                ? `${depth} 层传播完成。切换其他深度，比较最终到达前端的信号。`
                : '点击右侧按钮，手动推进一次反向传播。'}
        </Typography>
      </NoticeStrip>
    </ContentBlock>
  );
}
