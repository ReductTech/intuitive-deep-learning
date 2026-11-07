import { useState } from 'react';
import { Button, ContentBlock, NoticeStrip, Typography } from '../../../shared/react';
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
    <ContentBlock
      headingLevel={1}
      className="rtg-gradient-path"
      title="训练信号要穿过多少层？"
      subtitle="固定每层的局部变化，手动让梯度从损失端一层一层传回输入端。"
    >
      <div className="rtg-gradient-path__toolbar">
        <div role="group" aria-label="选择网络深度">
          <Typography as="strong" variant="bodySmall" tone="warning">网络深度</Typography>
          {([2, 5, 10] as Depth[]).map((value) => (
            <Button key={value} active={mode === 'decay' && depth === value} variant={mode === 'decay' && depth === value ? 'primary' : 'default'} onClick={() => chooseDepth(value)}>
              <Typography as="span" variant="bodySmall" tone="inherit">{value} 层</Typography>
            </Button>
          ))}
        </div>
        <Typography as="code" variant="body" tone={mode === 'decay' ? 'accent' : 'warning'}>
          每层 × {factor.toFixed(1)}
        </Typography>
        {decayExplored && (
          <Button variant={mode === 'amplify' ? 'warn' : 'default'} active={mode === 'amplify'} onClick={openAmplify}>
            <Typography as="span" variant="bodySmall" tone="inherit">扩展：每层 × 1.1</Typography>
          </Button>
        )}
      </div>

      <section className={`rtg-gradient-path__stage is-${mode}`} aria-label="梯度逐层传播示意">
        <div className="rtg-gradient-path__summary">
          <div>
            <Typography as="span" variant="bodySmall" tone="muted">已经穿过</Typography>
            <Typography as="strong" variant="h2" tone="accent">{travelled} / {depth} 层</Typography>
          </div>
          <div>
            <Typography as="span" variant="bodySmall" tone="muted">当前相对信号</Typography>
            <Typography as="strong" variant="h1" tone={mode === 'decay' ? 'accent' : 'warning'}>{currentSignal.toFixed(3)}</Typography>
          </div>
          <Typography as="code" variant="body" tone="muted">{factor.toFixed(1)}^{travelled} = {currentSignal.toFixed(3)}</Typography>
        </div>

        <div className="rtg-gradient-path__network">
          <div className="rtg-gradient-path__endpoint">
            <Typography as="strong" variant="body" tone="accent">前端层</Typography>
            <Typography variant="bodySmall" tone="muted">等待训练信号</Typography>
          </div>
          <div className="rtg-gradient-path__layers">
            {Array.from({ length: depth }, (_, index) => {
              const stepFromLoss = depth - index;
              const active = stepFromLoss <= travelled;
              return (
                <div className={active ? 'is-active' : ''} key={index}>
                  <span aria-hidden="true" />
                  <Typography as="span" variant="bodySmall" tone={active ? 'accent' : 'light'}>L{index + 1}</Typography>
                  {active && <Typography as="code" variant="bodySmall" tone="inherit">{Math.pow(factor, stepFromLoss).toFixed(2)}</Typography>}
                </div>
              );
            })}
          </div>
          <div className="rtg-gradient-path__endpoint is-loss">
            <Typography as="strong" variant="body" tone="danger">损失</Typography>
            <Typography variant="bodySmall" tone="muted">梯度从这里出发</Typography>
          </div>
        </div>

        <div className="rtg-gradient-path__actions">
          <Button disabled={travelled === 0} onClick={() => setTravelled((value) => Math.max(0, value - 1))}>
            <Typography as="span" variant="bodySmall" tone="inherit">退回一层</Typography>
          </Button>
          <Typography as="span" variant="bodySmall" tone="muted">由你决定何时继续，不自动播放</Typography>
          <Button variant="primary" disabled={travelled >= depth} hint={travelled === 0} onClick={nextLayer}>
            <Typography as="span" variant="bodySmall" tone="inherit">{travelled >= depth ? '已到达输入端' : '让梯度再穿过一层'}</Typography>
          </Button>
        </div>
      </section>

      <NoticeStrip tone={complete ? 'green' : mode === 'amplify' ? 'orange' : 'blue'} role="status">
        <Typography variant="body" tone="inherit">
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
