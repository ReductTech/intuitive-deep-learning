import { useEffect, useRef, useState } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
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

  return <div shuku-edit-id="e-87f2bba8-8c43-4765-9ff4-83515565b8aa" className={`fai-matrix fai-matrix--${name.toLowerCase()} ${ready ? 'is-ready' : 'is-empty'} ${active ? 'is-active' : ''}`} aria-label={`${name} ${ready ? '已在 HBM' : '尚未产生'}`}>
    <Typography shuku-edit-id="e-7516d5ed-3c2e-4c5e-a74e-10f9aa26effa" as="strong" variant="h2" tone="inherit">{name}</Typography>
    {(name === 'S' || name === 'P') && <Typography shuku-edit-id="e-74fb784d-0d73-4a73-baaf-7dc3b29c3840" as="span" variant="bodySmall" tone="inherit">T × T</Typography>}
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

  return <section shuku-edit-id="e-d06aa391-72c8-479f-9bde-e7d3d1142da9" className="fai-slide" aria-label="普通 Attention 的显存搬运过程">
    <header shuku-edit-id="e-1c3a7155-f68c-41fc-80eb-c6f938a0e706" className="fai-header">
      <Typography shuku-edit-id="e-14b388a8-7adf-46a3-a0fd-442656fe405f" as="h1" variant="h1">大矩阵算完，还要来回搬</Typography>
    </header>

    <div shuku-edit-id="e-cd873666-f8f3-406b-8ab6-e60a3e098476" className="fai-body">
      <div shuku-edit-id="e-6966512b-3a82-46be-981c-e6eb7ddfa103" className="fai-process">
        <div shuku-edit-id="e-dd6d0f0e-17bb-432e-aaf6-116f4f295031" className="fai-hbm">
          <div shuku-edit-id="e-47baff51-429f-4e1c-8aad-0538dafa8278" className="fai-space-name">
            <Typography shuku-edit-id="e-6adcd984-aff8-4e2d-9d82-5e080657e3ed" as="strong" variant="display">HBM</Typography>
            <Typography shuku-edit-id="e-91dc4bf4-4f2d-4b98-a42f-166eee3364f8" as="span" variant="h3" tone="muted">容量大</Typography>
          </div>
          <div shuku-edit-id="e-c69d56a5-e68c-41d3-be6e-7154e9391a46" className="fai-matrix-row">
            {(['Q', 'K', 'S', 'P', 'V'] as const).map(name => <StoredMatrix key={name} name={name} step={step} />)}
          </div>
        </div>

        <div shuku-edit-id="e-8ba73fdd-7763-4094-841d-45a4e4948c0c" className={`fai-crossing ${current ? `is-${current.direction}` : ''}`} aria-label={current ? `${current.cargo} 从 ${current.direction === 'down' ? 'HBM 读入 SRAM' : 'SRAM 写回 HBM'}` : 'HBM 与 SRAM 的边界'}>
          <div shuku-edit-id="e-0fc3a159-209f-40cc-88d9-1623c9d70434" className="fai-boundary" aria-hidden="true" />
          {current && <>
            <div shuku-edit-id="e-67a92638-f645-440c-93fb-6b7f01f7aab2" className="fai-path" aria-hidden="true" />
            <div shuku-edit-id="e-d6b8fe39-dca9-44f3-bfa3-0cfec464ab43" className="fai-cargo" key={step}>
              <Typography shuku-edit-id="e-5e445c8f-9d1a-4a18-97da-0d6e3fa31c66" as="strong" variant="h3" tone="inherit">{current.cargo}</Typography>
            </div>
            <Typography shuku-edit-id="e-19cb2f84-b9e0-4cd3-bc2c-a43d79d75635" as="span" variant="h3" tone="inherit" className="fai-move-label">{current.direction === 'down' ? '↓ 读取' : '↑ 写回'}</Typography>
          </>}
        </div>

        <div shuku-edit-id="e-5fe9b160-8629-4fcc-8082-4652a6c707d5" className="fai-sram-wrap">
          <div shuku-edit-id="e-3c07d0e9-59e1-4f15-959a-039ff4b2f365" className="fai-sram">
            <div shuku-edit-id="e-d68234e5-e4af-4b98-8780-f9fdc5f4e248" className="fai-space-name">
              <Typography shuku-edit-id="e-e10f847e-39dc-496d-b88d-ed1ce92a2067" as="strong" variant="display">SRAM</Typography>
              <Typography shuku-edit-id="e-d7967abc-68c4-480a-ab82-8cd7f14132af" as="span" variant="h3" tone="muted">靠近计算</Typography>
            </div>
            <div shuku-edit-id="e-f488c5e8-95fd-4302-b90b-5f3cf2b7ab5a" className="fai-work">
              {current && <Typography shuku-edit-id="e-8c16187a-3f3a-4e54-9daf-5eebe2a1a45f" as="strong" variant="h2" align="center" aria-live="polite">{current.work}</Typography>}
            </div>
          </div>
        </div>
      </div>

      <aside shuku-edit-id="e-ceee15e3-b3d9-40e6-be18-541f33682abe" className="fai-steps" aria-label="当前计算步骤">
        {STEPS.map((item, index) => <div shuku-edit-id="e-926be218-b475-4e7b-8d5d-a7f9e75cd04a" key={item.label} className={`fai-step ${step === index + 1 ? 'is-current' : ''} ${step > index + 1 ? 'is-done' : ''}`}>
          <span shuku-edit-id="e-8c1ce54c-5572-4b68-a075-9ae0f90eca57" className="fai-step-dot" aria-hidden="true" />
          <Typography shuku-edit-id="e-233d2490-f496-49ac-99b1-648735b96a7b" as="span" variant="h3" tone={step === index + 1 ? 'main' : 'muted'}>{item.label}</Typography>
        </div>)}
      </aside>
    </div>

    <footer shuku-edit-id="e-dc0f84b2-dce8-431c-8fb2-bcb2c4e43ec0" className="fai-footer">
      <Typography shuku-edit-id="e-492b501a-9b3e-421a-92b3-1894c9293f4e" as="p" variant="h2" align="center" className="fai-subtitle" aria-live="polite">{step === 0 ? '观察一次普通 Attention 的搬运过程' : step === STEPS.length ? 'S、P：写回，再读回' : current?.caption}</Typography>
      <Button variant="primary" disabled={locked} onClick={event => { event.stopPropagation(); advance(); }}>{step === STEPS.length ? '重新开始' : '下一步'}</Button>
    </footer>
  </section>;
}
