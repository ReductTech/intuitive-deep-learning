import { useState } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
import { FlashBlock } from '../components/FlashBlock';
import './FlashOutputPage.css';

const CAPTIONS = [
  '接上页：权重块与 V 相乘',
  '上三行：P₁₁ × V₁ + P₁₂ × V₂，得到 O₁',
  '下三行：P₂₁ × V₁ + P₂₂ × V₂，得到 O₂',
  'O₁、O₂ 上下拼接，得到 O',
];
const P_NAMES = { '11': 'P₁₁', '12': 'P₁₂', '21': 'P₂₁', '22': 'P₂₂' } as const;

function StepOperation({ children }: { children: string }) {
  return <Typography shuku-edit-id="e-0f3a6437-1ed5-40d8-bc85-b6098cb7b46d" as="span" variant="h2" className="fop-operation">{children}</Typography>;
}

function OutputLane({ row, active, quiet, showOutput }: { row: 1 | 2; active: boolean; quiet: boolean; showOutput: boolean }) {
  const first = row === 1 ? '11' : '21';
  const second = row === 1 ? '12' : '22';
  return <div shuku-edit-id="e-faa83b78-1c1a-4b24-ac32-46538816bb6e" className={`fop-lane${active ? ' fop-lane--active' : ''}${quiet ? ' fop-lane--quiet' : ''}`}>
    <Typography shuku-edit-id="e-a4dcf9d5-28e2-4cfe-9b9b-7b510eba040b" as="strong" variant="h2" className="fop-lane-label">{row === 1 ? '上三行' : '下三行'}</Typography>
    <FlashBlock name={P_NAMES[first]} position={first as '11' | '21'} active={active} />
    <StepOperation>×</StepOperation>
    <FlashBlock name="V₁" rows={3} cols={4} active={active} />
    <StepOperation>+</StepOperation>
    <FlashBlock name={P_NAMES[second]} position={second as '12' | '22'} active={active} />
    <StepOperation>×</StepOperation>
    <FlashBlock name="V₂" rows={3} cols={4} active={active} />
    <StepOperation>=</StepOperation>
    <div shuku-edit-id="e-35900f52-6c48-4fe3-a67f-911e2c774791" className={`fop-output${showOutput ? ' fop-output--visible' : ''}`}>
      <FlashBlock name={`O${row === 1 ? '₁' : '₂'}`} rows={3} cols={4} active={showOutput} />
    </div>
  </div>;
}

export function FlashOutputPage() {
  const [step, setStep] = useState(0);
  const next = () => setStep(previous => previous === 3 ? 0 : previous + 1);

  return <section shuku-edit-id="e-9d5bd360-d9e8-45ba-8633-0b174bf46808" className="fop-slide" aria-label="逻辑权重矩阵 P 分块乘 V，得到注意力输出 O">
    <header shuku-edit-id="e-9a193f7f-df63-4cbb-9433-5291cb46aea1" className="fop-header">
      <Typography shuku-edit-id="e-409e8650-ff57-461a-9b48-809d88eead40" as="h1" variant="display">权重 P 分块乘 V，得到输出 O</Typography>
    </header>

    <div shuku-edit-id="e-6f3ac468-ac06-41f1-a5c1-f4a288c900d2" className="fop-main">
      <Typography shuku-edit-id="e-7de3a69a-cfed-43bc-8779-0e9151b3f8c2" as="strong" variant="display" className="fop-zone-name">SRAM</Typography>
      <div shuku-edit-id="e-4172711c-b13e-4879-99b6-62c0c2fd5585" className="fop-lanes">
        <OutputLane row={1} active={step === 1} quiet={step === 2} showOutput={step === 1 || step === 3} />
        <OutputLane row={2} active={step === 2} quiet={step === 1} showOutput={step === 2 || step === 3} />
      </div>
      <div shuku-edit-id="e-1a96b403-1bad-49e1-8c2b-f2890338435c" className={`fop-final${step === 3 ? ' fop-final--visible' : ''}`}>
        <Typography shuku-edit-id="e-b0a3d69e-ea22-4f76-8025-9368e497f840" as="strong" variant="h2">上下拼接</Typography>
        <FlashBlock name="O" rows={6} cols={4} active={step === 3} />
        <Typography shuku-edit-id="e-cf82cb9d-e8c8-4015-861c-cc9fa2aa1857" as="span" variant="h3" tone="muted">[T, d]</Typography>
      </div>
    </div>

    <footer shuku-edit-id="e-4887b14a-dedc-46be-82f1-ba34f114c4e0" className="fop-footer">
      <div shuku-edit-id="e-7949098e-1af3-425a-a0c2-04b01a1b97d3" className="fop-progress" aria-label={`第 ${step + 1} 个画面，共四个`}>
        {CAPTIONS.map((caption, index) => <span shuku-edit-id="e-54d38cbc-0c4f-45cc-b68c-bfc0424cc30b" key={caption} className={index <= step ? 'fop-progress--active' : ''} />)}
      </div>
      <Typography shuku-edit-id="e-0463b0bb-295b-4238-926f-57ef62c3a616" as="strong" variant="h2" align="center" aria-live="polite">{CAPTIONS[step]}</Typography>
      <Button variant="primary" onClick={next}>{step === 3 ? '重播' : '下一步'}</Button>
    </footer>
  </section>;
}
