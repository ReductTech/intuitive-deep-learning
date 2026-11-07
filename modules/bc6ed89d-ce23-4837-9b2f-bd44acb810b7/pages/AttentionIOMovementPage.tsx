import { useEffect, useRef, useState } from 'react';
import { Button, Typography } from '../../shared/react';
import './AttentionIOMovementPage.css';

const STEPS = [
  { label: '读 Q、K', direction: 'down', cargo: 'Q  K', work: 'Q × Kᵀ → S', caption: '读入 Q、K，算出 S' },
  { label: '写回 S', direction: 'up', cargo: 'S', work: 'S', caption: 'S 写回 HBM' },
  { label: '读回 S', direction: 'down', cargo: 'S', work: 'Softmax(S) → P', caption: '再读回 S，算出 P' },
  { label: '写回 P', direction: 'up', cargo: 'P', work: 'P', caption: 'P 写回 HBM' },
  { label: '读 P、V', direction: 'down', cargo: 'P  V', work: 'P × V → O', caption: '再读入 P、V，得到 O' },
] as const;

type ObjectName = 'Q' | 'K' | 'S' | 'P' | 'V';

function StoredMatrix({ name, step }: { name: ObjectName; step: number }) {
  const ready = name === 'S' ? step >= 2 : name === 'P' ? step >= 4 : true;
  const active = step > 0 && (
    (step === 1 && (name === 'Q' || name === 'K')) ||
    ((step === 2 || step === 3) && name === 'S') ||
    (step === 4 && name === 'P') ||
    (step === 5 && (name === 'P' || name === 'V'))
  );

  return <div className={`fai-matrix fai-matrix--${name.toLowerCase()} ${ready ? 'is-ready' : 'is-empty'} ${active ? 'is-active' : ''}`} aria-label={`${name} ${ready ? '已在 HBM' : '尚未产生'}`}>
    <Typography as="strong" variant="h2" tone="inherit">{name}</Typography>
    {(name === 'S' || name === 'P') && <Typography as="span" variant="bodySmall" tone="inherit">T × T</Typography>}
  </div>;
}

export function AttentionIOMovementPage() {
  const [step, setStep] = useState(0);
  const [locked, setLocked] = useState(false);
  const lockedUntil = useRef(0);
  const unlockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (unlockTimer.current !== null) clearTimeout(unlockTimer.current);
  }, []);
  const current = step > 0 ? STEPS[step - 1] : null;

  const advance = () => {
    const now = performance.now();
    if (now < lockedUntil.current) return;
    lockedUntil.current = now + 500;
    setLocked(true);
    if (unlockTimer.current !== null) clearTimeout(unlockTimer.current);
    unlockTimer.current = setTimeout(() => {
      setLocked(false);
      unlockTimer.current = null;
    }, 500);
    setStep(value => value === STEPS.length ? 0 : value + 1);
  };

  return <section className="fai-slide" aria-label="普通 Attention 的显存搬运过程">
    <header className="fai-header">
      <Typography as="h1" variant="h1">大矩阵算完，还要来回搬</Typography>
    </header>

    <div className="fai-body">
      <div className="fai-process">
        <div className="fai-hbm">
          <div className="fai-space-name">
            <Typography as="strong" variant="display">HBM</Typography>
            <Typography as="span" variant="h3" tone="muted">容量大</Typography>
          </div>
          <div className="fai-matrix-row">
            {(['Q', 'K', 'S', 'P', 'V'] as const).map(name => <StoredMatrix key={name} name={name} step={step} />)}
          </div>
        </div>

        <div className={`fai-crossing ${current ? `is-${current.direction}` : ''}`} aria-label={current ? `${current.cargo} 从 ${current.direction === 'down' ? 'HBM 读入 SRAM' : 'SRAM 写回 HBM'}` : 'HBM 与 SRAM 的边界'}>
          <div className="fai-boundary" aria-hidden="true" />
          {current && <>
            <div className="fai-path" aria-hidden="true" />
            <div className="fai-cargo" key={step}>
              <Typography as="strong" variant="h3" tone="inherit">{current.cargo}</Typography>
            </div>
            <Typography as="span" variant="h3" tone="inherit" className="fai-move-label">{current.direction === 'down' ? '↓ 读取' : '↑ 写回'}</Typography>
          </>}
        </div>

        <div className="fai-sram-wrap">
          <div className="fai-sram">
            <div className="fai-space-name">
              <Typography as="strong" variant="display">SRAM</Typography>
              <Typography as="span" variant="h3" tone="muted">靠近计算</Typography>
            </div>
            <div className="fai-work">
              {current && <Typography as="strong" variant="h2" align="center" aria-live="polite">{current.work}</Typography>}
            </div>
          </div>
        </div>
      </div>

      <aside className="fai-steps" aria-label="当前计算步骤">
        {STEPS.map((item, index) => <div key={item.label} className={`fai-step ${step === index + 1 ? 'is-current' : ''} ${step > index + 1 ? 'is-done' : ''}`}>
          <span className="fai-step-dot" aria-hidden="true" />
          <Typography as="span" variant="h3" tone={step === index + 1 ? 'main' : 'muted'}>{item.label}</Typography>
        </div>)}
      </aside>
    </div>

    <footer className="fai-footer">
      <Typography as="p" variant="h2" align="center" className="fai-subtitle" aria-live="polite">{step === 0 ? '观察一次普通 Attention 的搬运过程' : step === STEPS.length ? 'S、P：写回，再读回' : current?.caption}</Typography>
      <Button variant="primary" disabled={locked} onClick={event => { event.stopPropagation(); advance(); }}>{step === STEPS.length ? '重新开始' : '下一步'}</Button>
    </footer>
  </section>;
}
