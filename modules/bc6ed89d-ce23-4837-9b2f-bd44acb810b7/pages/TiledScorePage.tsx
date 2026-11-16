import { useEffect, useState } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
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
  return <div shuku-edit-id="e-d1dc3076-a9dc-4839-b44f-af6a05e91b29" className={`fts-matrix${small ? ' fts-matrix--small' : ''}${partitioned ? ' fts-matrix--partitioned' : ''}`} style={partitioned ? undefined : { gridTemplateColumns: `repeat(${cols}, 1fr)` }} role="img" aria-label={label}>
    {Array.from({ length: rows * cols }, (_, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;
      return <span shuku-edit-id="e-4b5ba6e1-d4ef-4dc8-9ff7-cc322b24f389" key={index} style={partitioned ? { gridRow: row + 1 + (row >= 3 ? 1 : 0), gridColumn: col + 1 + (col >= 3 ? 1 : 0) } : undefined} className={`fts-cell ${cellClass?.(row, col) ?? ''}`} />;
    })}
  </div>;
}

function TransferArrow() {
  return <svg shuku-edit-id="e-040bfc3b-cb25-405d-af9d-4a8322211a89" className="fts-transfer" viewBox="0 0 58 88" fill="none" aria-hidden="true">
    <path shuku-edit-id="e-9039aea5-dc80-46c1-a512-aca94c21b83d" d="M22 3h14v52h16L29 83 6 55h16V3Z" fill="currentColor" stroke="#5F656A" strokeWidth="2" strokeLinejoin="round" />
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

  return <section shuku-edit-id="e-2029ff34-02bb-43bb-bd1e-f8c0b3ac0b92" className="fts-slide" aria-label="Q 和 K 转置分块计算 S">
    <header shuku-edit-id="e-6e07c6b7-2f46-4048-91c0-659af4d02422" className="fts-header">
      <Typography shuku-edit-id="e-da418a9d-0e90-4378-9c92-3b87aa14a554" as="h1" variant="display">把大矩阵切割成小矩阵</Typography>
      <Typography shuku-edit-id="e-11dec511-d6d3-40e6-8fd8-e440ccdbf56d" as="p" variant="h3" tone="muted">Q、Kᵀ 留在 HBM；S 只标示计算结果的逻辑位置。</Typography>
    </header>

    <div shuku-edit-id="e-9b1e749c-4550-47ef-8172-8bae315ddf38" className="fts-diagram">
      <div shuku-edit-id="e-99800270-7ef5-41f0-b9b1-a826c90d2ba0" className="fts-band fts-band--hbm">
        <div shuku-edit-id="e-64966fc5-bb28-4715-a7b5-5a8bca289a71" className="fts-zone-name">
          <Typography shuku-edit-id="e-63d0aa6c-c2f2-44d3-ab0e-b4adc427ddf1" as="strong" variant="display">HBM</Typography>
        </div>
        <div shuku-edit-id="e-31631ffa-e518-4411-95bb-58f80ab35a0f" className="fts-object">
          <Typography shuku-edit-id="e-d3d8938e-207c-4247-9b86-3754e169b60e" as="strong" variant="h2">Q</Typography>
          <Matrix rows={6} cols={4} cellClass={qClass} label="Q，六行四列，分为上下两块" />
          <Typography shuku-edit-id="e-ef2108fb-0a64-4fba-a4ac-969cf0b08297" as="span" variant="h3" tone="muted">[T, d]</Typography>
        </div>
        <div shuku-edit-id="e-cd36567a-bbba-4cba-97e7-541e192853fb" className="fts-object">
          <Typography shuku-edit-id="e-dc74c51c-fef5-4e4a-961f-d96a1dcf77f7" as="strong" variant="h2">Kᵀ</Typography>
          <Matrix rows={4} cols={6} cellClass={kClass} label="K 转置，四行六列，分为左右两块" />
          <Typography shuku-edit-id="e-789f4e65-a3a7-46f8-85ed-eaecae95e29f" as="span" variant="h3" tone="muted">[d, T]</Typography>
        </div>
        <div shuku-edit-id="e-b2b10c0c-6a1f-42b3-9677-c9ba0465a825" className="fts-object fts-object--s-view">
          <Typography shuku-edit-id="e-3a357573-557c-42b2-9b7d-63baee3ac7a1" as="strong" variant="h2">S（逻辑示意）</Typography>
          <div shuku-edit-id="e-406a859b-ebd2-4b9e-aacf-0407eb4a2d1a" className="fts-s-view">
            <Matrix rows={6} cols={6} partitioned cellClass={sClass} label="S 的逻辑位置，六行六列；四块之间留半格缝隙，已算出的区域变红，但不写回 HBM" />
            <div shuku-edit-id="e-f4ef1875-2648-430a-892c-cb371eb3ac4a" className="fts-s-names" aria-hidden="true">
              {STEPS.map((item, index) => <div shuku-edit-id="e-7f63a034-b6fa-4a84-9edf-7646924bce49" className="fts-s-name-slot" key={item.label}>
                {index < step || (index === step && !busy) ? <Typography shuku-edit-id="e-d93a329b-acb8-4d7c-9cc3-bd4a55705630" as="span" variant="h2" className="fts-s-name">{item.label}</Typography> : null}
              </div>)}
            </div>
          </div>
          <Typography shuku-edit-id="e-0ab594fe-cc73-4fcb-99fa-5c0bcbff5627" as="span" variant="h3" tone="muted">[T, T]</Typography>
        </div>
      </div>

      <div shuku-edit-id="e-5f5fa31a-3c00-4a14-b793-61b72a23b6ed" className="fts-transfer-band">
        <span shuku-edit-id="e-29726c2f-d96a-4a7f-bbcd-c9af94eedc6f" className="fts-boundary" aria-hidden="true" />
        <div shuku-edit-id="e-7c242525-4545-4cab-80ee-8cd6823579a5" />
        <div shuku-edit-id="e-bb3d1552-6c05-4ad7-8702-151a6c8d4347" className="fts-arrow-position">{current && (step === 0 || step === 2) && <TransferArrow />}</div>
        <div shuku-edit-id="e-e33166f2-8e99-4fb6-98ef-878233eab4cc" className="fts-arrow-position">{current && <TransferArrow />}</div>
        <div shuku-edit-id="e-1fceebc5-4e6a-4165-b57c-23c8a045f3ec" className="fts-arrow-position" />
      </div>

      <div shuku-edit-id="e-7a108192-b0c0-468a-af0c-364515367cf2" className="fts-band fts-band--sram">
        <div shuku-edit-id="e-d569a72a-0318-4027-8c8b-aed938a7e59e" className="fts-zone-name">
          <Typography shuku-edit-id="e-ec2feb2a-3e21-4827-8c32-d3eadf19e719" as="strong" variant="display">SRAM</Typography>
        </div>
        <div shuku-edit-id="e-359ea9df-07c8-4573-8e26-fa24d71ccc74" className="fts-object fts-object--local">
          {current && <>
            <Typography shuku-edit-id="e-94e582d4-2e4a-4108-8057-56e5b2eba32b" as="strong" variant="h2">Q<sub shuku-edit-id="e-4a882a46-8234-4e4d-b068-b5ab73500600">{current.q}</sub></Typography>
            <Matrix rows={3} cols={4} small cellClass={() => 'fts-cell--active'} label={`当前 Q${current.q} 小块，三行四列`} />
          </>}
        </div>
        <div shuku-edit-id="e-c0e4c54a-97cf-42a6-87f2-57a6e453fb0e" className="fts-object fts-object--local">
          {current && <>
            <Typography shuku-edit-id="e-beb4eacc-c4d0-4837-b1a7-98d3c2795761" as="strong" variant="h2">K<sub shuku-edit-id="e-27dd78b0-3a8b-445a-ae89-1bee8ab475bb">{current.k}</sub>ᵀ</Typography>
            <Matrix rows={4} cols={3} small cellClass={() => 'fts-cell--active'} label={`当前 K${current.k} 转置小块，四行三列`} />
          </>}
        </div>
        <div shuku-edit-id="e-e55d528b-1383-4811-a306-494fc68ea7e8" className="fts-object fts-object--local">
          {current && <>
            <Typography shuku-edit-id="e-4f5fae95-10bd-46da-a153-3b3b12ff6214" as="strong" variant="h2">{current.label}</Typography>
            <Matrix rows={3} cols={3} small cellClass={() => busy ? 'fts-cell--target' : 'fts-cell--active'} label={`局部结果 ${current.label}，三行三列`} />
          </>}
        </div>
        {current && <>
          <Typography shuku-edit-id="e-770cc556-b214-477f-9a29-6b4317951b0f" as="span" variant="display" className="fts-operator fts-operator--multiply">×</Typography>
          <Typography shuku-edit-id="e-cc2d4453-aebf-45bf-aa62-7e7a343d128e" as="span" variant="display" className="fts-operator fts-operator--equals">=</Typography>
        </>}
      </div>
    </div>

    <footer shuku-edit-id="e-d5295356-561b-4d96-b378-9007294f6981" className="fts-footer">
      <div shuku-edit-id="e-f04fd0c7-fde5-43a4-a961-072e2f3c83a0" className="fts-step-mark" aria-label={`第 ${step + 1} 步，共四步`}>
        {STEPS.map((item, index) => <span shuku-edit-id="e-d83ed2fb-5b40-4f67-b9d5-a136f6dfac46" key={item.label} className={index <= step ? 'fts-step-mark--on' : ''} />)}
      </div>
      <div shuku-edit-id="e-8673509e-d19c-4a03-9842-cb8b5d9f2d5b" className="fts-footer-message">
        {step === 3 && !busy && <Typography shuku-edit-id="e-8daba356-fc3f-42ad-80c7-f131b47fd9ff" as="strong" variant="h2">S 小块不写回 HBM</Typography>}
      </div>
      <Button variant="primary" disabled={busy} onClick={playOneStep}>
        {step === 3 ? '重播' : step < 0 ? '播放第 1 步' : `播放第 ${step + 2} 步`}
      </Button>
    </footer>
  </section>;
}
