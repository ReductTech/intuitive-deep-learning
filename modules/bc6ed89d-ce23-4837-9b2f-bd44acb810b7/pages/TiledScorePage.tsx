import { useEffect, useState } from 'react';
import { Button, Typography } from '../../shared/react';
import './TiledScorePage.css';

const STEPS = [
  { q: 1, k: 1, label: 'S₁₁' },
  { q: 1, k: 2, label: 'S₁₂' },
  { q: 2, k: 1, label: 'S₂₁' },
  { q: 2, k: 2, label: 'S₂₂' },
] as const;

function Matrix({ rows, cols, cellClass, label, small = false, partitioned = false }: {
  rows: number;
  cols: number;
  cellClass?: (row: number, col: number) => string;
  label: string;
  small?: boolean;
  partitioned?: boolean;
}) {
  return <div className={`fts-matrix${small ? ' fts-matrix--small' : ''}${partitioned ? ' fts-matrix--partitioned' : ''}`} style={partitioned ? undefined : { gridTemplateColumns: `repeat(${cols}, 1fr)` }} role="img" aria-label={label}>
    {Array.from({ length: rows * cols }, (_, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      return <span key={index} style={partitioned ? { gridRow: row + 1 + (row >= 3 ? 1 : 0), gridColumn: col + 1 + (col >= 3 ? 1 : 0) } : undefined} className={`fts-cell ${cellClass?.(row, col) ?? ''}`} />;
    })}
  </div>;
}

function TransferArrow() {
  return <svg className="fts-transfer" viewBox="0 0 58 88" fill="none" aria-hidden="true">
    <path d="M22 3h14v52h16L29 83 6 55h16V3Z" fill="currentColor" stroke="#5F656A" strokeWidth="2" strokeLinejoin="round" />
  </svg>;
}

export function TiledScorePage() {
  const [step, setStep] = useState(-1);
  const [busy, setBusy] = useState(false);
  const current = step >= 0 ? STEPS[step] : null;
  const currentQuadrant = current ? (current.q - 1) * 2 + current.k - 1 : -1;

  useEffect(() => {
    if (!busy) return;
    const timer = window.setTimeout(() => setBusy(false), 1600);
    return () => window.clearTimeout(timer);
  }, [busy, step]);

  const playOneStep = () => {
    if (busy) return;
    setStep(previous => (previous + 1) % STEPS.length);
    setBusy(true);
  };

  const qClass = (row: number) => current && Math.floor(row / 3) + 1 === current.q ? 'fts-cell--active' : '';
  const kClass = (_row: number, col: number) => current && Math.floor(col / 3) + 1 === current.k ? 'fts-cell--active' : '';
  const sClass = (row: number, col: number) => {
    const quadrant = Math.floor(row / 3) * 2 + Math.floor(col / 3);
    if (quadrant < step || (quadrant === step && !busy)) return 'fts-cell--done';
    if (quadrant === currentQuadrant && busy) return 'fts-cell--target';
    return '';
  };

  return <section className="fts-slide" aria-label="Q 和 K 转置分块计算 S">
    <header className="fts-header">
      <Typography as="h1" variant="display">把大矩阵切割成小矩阵</Typography>
      <Typography as="p" variant="h3" tone="muted">Q、Kᵀ 留在 HBM；S 只标示计算结果的逻辑位置。</Typography>
    </header>

    <div className="fts-diagram">
      <div className="fts-band fts-band--hbm">
        <div className="fts-zone-name">
          <Typography as="strong" variant="display">HBM</Typography>
        </div>
        <div className="fts-object">
          <Typography as="strong" variant="h2">Q</Typography>
          <Matrix rows={6} cols={4} cellClass={qClass} label="Q，六行四列，分为上下两块" />
          <Typography as="span" variant="h3" tone="muted">[T, d]</Typography>
        </div>
        <div className="fts-object">
          <Typography as="strong" variant="h2">Kᵀ</Typography>
          <Matrix rows={4} cols={6} cellClass={kClass} label="K 转置，四行六列，分为左右两块" />
          <Typography as="span" variant="h3" tone="muted">[d, T]</Typography>
        </div>
        <div className="fts-object fts-object--s-view">
          <Typography as="strong" variant="h2">S（逻辑示意）</Typography>
          <div className="fts-s-view">
            <Matrix rows={6} cols={6} partitioned cellClass={sClass} label="S 的逻辑位置，六行六列；四块之间留半格缝隙，已算出的区域变红，但不写回 HBM" />
            <div className="fts-s-names" aria-hidden="true">
              {STEPS.map((item, index) => <div className="fts-s-name-slot" key={item.label}>
                {index < step || (index === step && !busy) ? <Typography as="span" variant="h2" className="fts-s-name">{item.label}</Typography> : null}
              </div>)}
            </div>
          </div>
          <Typography as="span" variant="h3" tone="muted">[T, T]</Typography>
        </div>
      </div>

      <div className="fts-transfer-band">
        <span className="fts-boundary" aria-hidden="true" />
        <div />
        <div className="fts-arrow-position">{current && (step === 0 || step === 2) && <TransferArrow />}</div>
        <div className="fts-arrow-position">{current && <TransferArrow />}</div>
        <div className="fts-arrow-position" />
      </div>

      <div className="fts-band fts-band--sram">
        <div className="fts-zone-name">
          <Typography as="strong" variant="display">SRAM</Typography>
        </div>
        <div className="fts-object fts-object--local">
          {current && <>
            <Typography as="strong" variant="h2">Q<sub>{current.q}</sub></Typography>
            <Matrix rows={3} cols={4} small cellClass={() => 'fts-cell--active'} label={`当前 Q${current.q} 小块，三行四列`} />
          </>}
        </div>
        <div className="fts-object fts-object--local">
          {current && <>
            <Typography as="strong" variant="h2">K<sub>{current.k}</sub>ᵀ</Typography>
            <Matrix rows={4} cols={3} small cellClass={() => 'fts-cell--active'} label={`当前 K${current.k} 转置小块，四行三列`} />
          </>}
        </div>
        <div className="fts-object fts-object--local">
          {current && <>
            <Typography as="strong" variant="h2">{current.label}</Typography>
            <Matrix rows={3} cols={3} small cellClass={() => busy ? 'fts-cell--target' : 'fts-cell--active'} label={`局部结果 ${current.label}，三行三列`} />
          </>}
        </div>
        {current && <>
          <Typography as="span" variant="display" className="fts-operator fts-operator--multiply">×</Typography>
          <Typography as="span" variant="display" className="fts-operator fts-operator--equals">=</Typography>
        </>}
      </div>
    </div>

    <footer className="fts-footer">
      <div className="fts-step-mark" aria-label={`第 ${step + 1} 步，共四步`}>
        {STEPS.map((item, index) => <span key={item.label} className={index <= step ? 'fts-step-mark--on' : ''} />)}
      </div>
      <div className="fts-footer-message">
        {step === 3 && !busy && <Typography as="strong" variant="h2">S 小块不写回 HBM</Typography>}
      </div>
      <Button variant="primary" disabled={busy} onClick={playOneStep}>
        {step === 3 ? '重播' : step < 0 ? '播放第 1 步' : `播放第 ${step + 2} 步`}
      </Button>
    </footer>
  </section>;
}
