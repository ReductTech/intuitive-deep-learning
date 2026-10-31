import { useEffect, useState } from 'react';
import { Button, Typography } from '../../shared/react';
import './RepeatedWorkPage.css';

// 固定续写只用于展示依赖关系；这些字和预测结果不是模型实测。
const SEQUENCE = ['我', '爱', '学', '习', '新'] as const;
type Phase = 'ready' | 'calculating' | 'result';
type MatrixKind = 'q' | 'k' | 'v';

function TokenMatrix({ kind, step }: { kind: MatrixKind; step: number }) {
  const current = SEQUENCE[step];
  const count = kind === 'q' ? 1 : step + 1;

  return <div className={`kvc3-matrix kvc3-matrix--${kind}`}>
    <div className="kvc3-matrix-heading">
      <Typography as="strong" variant="h3" tone="main">
        {kind.toUpperCase()}
      </Typography>
      <Typography as="span" variant="body" tone="muted">[{count}, 64]</Typography>
    </div>
    <div className="kvc3-matrix-rows">
      {SEQUENCE.slice(0, 4).map((token, index) => {
        const visible = index <= step && (kind !== 'q' || index === step);
        return <div className="kvc3-matrix-slot" key={`${kind}-${token}`}>
          {visible && <Typography as="span" variant="h3" tone="inherit" className={`kvc3-matrix-bar ${index === step ? 'is-current' : ''}`}>
            {kind === 'q' ? current : token}
          </Typography>}
        </div>;
      })}
    </div>
  </div>;
}

export function RepeatedWorkPage() {
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<Phase>('ready');

  useEffect(() => {
    if (phase !== 'calculating') return;
    const timer = window.setTimeout(() => setPhase('result'), 650);
    return () => window.clearTimeout(timer);
  }, [phase, step]);

  const advance = () => {
    if (phase === 'calculating') return;
    if (phase === 'result' && step === 3) {
      setStep(0);
      setPhase('ready');
      return;
    }
    if (phase === 'result') setStep((current) => current + 1);
    setPhase('calculating');
  };

  const nextToken = SEQUENCE[step + 1];
  const buttonLabel = phase === 'ready' ? '计算下一个字' : step === 3 ? '从头重看' : `送入「${nextToken}」并继续`;

  return <section className="kvc3-slide" aria-label="KV Cache 第三页：当前 Q 与截至当前的所有 K/V 参与预测">
    <header className="kvc3-header">
      <Typography as="h1" variant="h1" tone="main">只看 Q、K、V：预测下一个字要用哪些行？</Typography>
      <Typography as="p" variant="bodySmall" tone="muted">从「我」开始。每轮得到的新字，下一轮才送回模型。</Typography>
    </header>

    <main className="kvc3-stage">
      <div className="kvc3-input-line">
        <Typography as="strong" variant="body" tone="muted">本轮输入</Typography>
        <div className="kvc3-input-tokens">
          {SEQUENCE.slice(0, step + 1).map((token, index) => <Typography as="span" variant="h3" tone="main" className={`kvc3-input-token ${index === step ? 'is-current' : ''}`} key={token}>{token}</Typography>)}
        </div>
      </div>

      <div className="kvc3-matrices">
        <TokenMatrix kind="q" step={step} />
        <TokenMatrix kind="k" step={step} />
        <TokenMatrix kind="v" step={step} />
      </div>

      <div className="kvc3-process" aria-label="由注意力与后续模型层得到下一字">
        <div className="kvc3-process-arrows" aria-hidden="true"><span /> <span /> <span /></div>
        <div className="kvc3-process-path">
          <Typography as="strong" variant="body" tone="main" className="kvc3-process-stage">注意力计算</Typography>
          <Typography as="span" variant="h3" tone="muted">→</Typography>
          <Typography as="strong" variant="body" tone="main" className="kvc3-process-stage">模型其余计算＋词表预测</Typography>
          <Typography as="span" variant="h3" tone="muted">→</Typography>
          <div className="kvc3-next-token" aria-live="polite">
            <Typography as="span" variant="bodySmall" tone="muted">下一个字</Typography>
            <Typography as="strong" variant="h3" tone="main" className={phase === 'result' ? 'is-revealed' : ''}>
              {phase === 'result' ? nextToken : '？'}
            </Typography>
          </div>
        </div>
      </div>
    </main>

    <footer className="kvc3-footer">
      <Typography as="span" variant="bodySmall" tone="muted">固定续写示意：一个汉字暂作一个 token，预测字并非模型实测。</Typography>
      <Button variant="primary" onClick={advance} disabled={phase === 'calculating'}>{phase === 'calculating' ? '正在计算…' : buttonLabel} →</Button>
    </footer>
  </section>;
}
