import { useEffect, useState } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
import './RepeatedWorkPage.css';

// 固定续写只用于展示依赖关系；这些字和预测结果不是模型实测。
const SEQUENCE = ['我', '爱', '学', '习', '新'] as const;
type Phase = 'ready' | 'calculating' | 'result';
type MatrixKind = 'q' | 'k' | 'v';

function TokenMatrix({ kind, step }: { kind: MatrixKind; step: number }) {
  const current = SEQUENCE[step];
  const count = kind === 'q' ? 1 : step + 1;

  return <div shuku-edit-id="e-b9e4eafc-49c9-4223-9738-0046fb961fba" className={`kvc3-matrix kvc3-matrix--${kind}`}>
    <div shuku-edit-id="e-63fd28df-8bcc-4825-a2ca-2ca501af7175" className="kvc3-matrix-heading">
      <Typography shuku-edit-id="e-b3857c41-bc64-4644-b93f-83497e76d718" as="strong" variant="h3" tone="main">
        {kind.toUpperCase()}
      </Typography>
      <Typography shuku-edit-id="e-a7174ecd-4438-463b-b084-f31ebcb3cf06" as="span" variant="body" tone="muted">[{count}, 64]</Typography>
    </div>
    <div shuku-edit-id="e-09e6df27-0a2f-4b84-a00d-64791a24b3d5" className="kvc3-matrix-rows">
      {SEQUENCE.slice(0, 4).map((token, index) => {
        const visible = index <= step && (kind !== 'q' || index === step);
        return <div shuku-edit-id="e-29c55f92-afd2-47be-9593-a60d42f32174" className="kvc3-matrix-slot" key={`${kind}-${token}`}>
          {visible && <Typography shuku-edit-id="e-854acfb9-31cf-46b9-9c3d-7e9dd13fb7f1" as="span" variant="h3" tone="inherit" className={`kvc3-matrix-bar ${index === step ? 'is-current' : ''}`}>
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

  return <section shuku-edit-id="e-715dcc85-c55e-498f-9f2a-8a9688d92be1" className="kvc3-slide" aria-label="KV Cache 第三页：当前 Q 与截至当前的所有 K/V 参与预测">
    <header shuku-edit-id="e-1a759da0-8863-42e5-a69c-4f0f55ebb294" className="kvc3-header">
      <Typography shuku-edit-id="e-eeb3a67a-e309-4ffc-bb12-6dc9310f8f89" as="h1" variant="h1" tone="main">只看 Q、K、V：预测下一个字要用哪些行？</Typography>
      <Typography shuku-edit-id="e-e8e5e13c-986e-47c0-92cb-e8f3a3e8617c" as="p" variant="bodySmall" tone="muted">从「我」开始。每轮得到的新字，下一轮才送回模型。</Typography>
    </header>

    <main shuku-edit-id="e-6972256e-b41f-4792-b737-cf692450e24f" className="kvc3-stage">
      <div shuku-edit-id="e-6778cbb6-2f75-45c8-a666-db49e0ece71b" className="kvc3-input-line">
        <Typography shuku-edit-id="e-c63e4335-6b9a-4a36-b704-cf634575c6de" as="strong" variant="body" tone="muted">本轮输入</Typography>
        <div shuku-edit-id="e-a1ee920c-499d-42c6-bd7d-2ae7707a294b" className="kvc3-input-tokens">
          {SEQUENCE.slice(0, step + 1).map((token, index) => <Typography shuku-edit-id="e-d478986f-5e2e-4ede-b56e-0f64170f9c38" as="span" variant="h3" tone="main" className={`kvc3-input-token ${index === step ? 'is-current' : ''}`} key={token}>{token}</Typography>)}
        </div>
      </div>

      <div shuku-edit-id="e-4a4db67f-56ea-4855-8a3b-f111917f42a1" className="kvc3-matrices">
        <TokenMatrix kind="q" step={step} />
        <TokenMatrix kind="k" step={step} />
        <TokenMatrix kind="v" step={step} />
      </div>

      <div shuku-edit-id="e-e9a16428-7a3f-4a31-a25b-80c6feca74cc" className="kvc3-process" aria-label="由注意力与后续模型层得到下一字">
        <div shuku-edit-id="e-3b1c9f5b-e947-4d2f-bcb9-e3e2d4d91caf" className="kvc3-process-arrows" aria-hidden="true"><span shuku-edit-id="e-485504f8-2949-4458-9a2a-38d7a65a3640" /> <span shuku-edit-id="e-89b1e21c-7483-424f-b311-6ca5e024182b" /> <span shuku-edit-id="e-1ecfc8be-a4b7-4db7-92d5-1c98b22dd2bd" /></div>
        <div shuku-edit-id="e-6b38f31f-1b65-4db6-a0c3-6b4d625d8e8a" className="kvc3-process-path">
          <Typography shuku-edit-id="e-5531e318-671f-4d53-9040-0f7fc5210781" as="strong" variant="body" tone="main" className="kvc3-process-stage">注意力计算</Typography>
          <Typography shuku-edit-id="e-1733a38f-e86c-44b4-a767-9b61e4ccff3c" as="span" variant="h3" tone="muted">→</Typography>
          <Typography shuku-edit-id="e-cacc65ae-329b-4cf1-aad8-6e6a8b9bb356" as="strong" variant="body" tone="main" className="kvc3-process-stage">模型其余计算＋词表预测</Typography>
          <Typography shuku-edit-id="e-315dbf26-dbb5-4343-b3cf-5d43d717c31e" as="span" variant="h3" tone="muted">→</Typography>
          <div shuku-edit-id="e-fb783650-febc-4e52-81ff-8cbf29a93a93" className="kvc3-next-token" aria-live="polite">
            <Typography shuku-edit-id="e-c5d20014-c6eb-479c-8fdf-cc04305d5f3c" as="span" variant="bodySmall" tone="muted">下一个字</Typography>
            <Typography shuku-edit-id="e-91135b59-4317-4327-9ef2-f48960b65302" as="strong" variant="h3" tone="main" className={phase === 'result' ? 'is-revealed' : ''}>
              {phase === 'result' ? nextToken : '？'}
            </Typography>
          </div>
        </div>
      </div>
    </main>

    <footer shuku-edit-id="e-a7e26d81-0944-4094-9c46-e36d4a130ad9" className="kvc3-footer">
      <Typography shuku-edit-id="e-a229c9fe-613c-44f4-814b-2046f35ad121" as="span" variant="bodySmall" tone="muted">固定续写示意：一个汉字暂作一个 token，预测字并非模型实测。</Typography>
      <Button variant="primary" onClick={advance} disabled={phase === 'calculating'}>{phase === 'calculating' ? '正在计算…' : buttonLabel} →</Button>
    </footer>
  </section>;
}
