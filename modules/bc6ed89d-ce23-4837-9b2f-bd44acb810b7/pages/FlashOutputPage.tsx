import { useState } from 'react';
import { Button, Typography } from '../../shared/react';
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
  return <Typography as="span" variant="h2" className="fop-operation">{children}</Typography>;
}

function OutputLane({ row, active, quiet, showOutput }: { row: 1 | 2; active: boolean; quiet: boolean; showOutput: boolean }) {
  const first = row === 1 ? '11' : '21';
  const second = row === 1 ? '12' : '22';
  return <div className={`fop-lane${active ? ' fop-lane--active' : ''}${quiet ? ' fop-lane--quiet' : ''}`}>
    <Typography as="strong" variant="h2" className="fop-lane-label">{row === 1 ? '上三行' : '下三行'}</Typography>
    <FlashBlock name={P_NAMES[first]} position={first as '11' | '21'} active={active} />
    <StepOperation>×</StepOperation>
    <FlashBlock name="V₁" rows={3} cols={4} active={active} />
    <StepOperation>+</StepOperation>
    <FlashBlock name={P_NAMES[second]} position={second as '12' | '22'} active={active} />
    <StepOperation>×</StepOperation>
    <FlashBlock name="V₂" rows={3} cols={4} active={active} />
    <StepOperation>=</StepOperation>
    <div className={`fop-output${showOutput ? ' fop-output--visible' : ''}`}>
      <FlashBlock name={`O${row === 1 ? '₁' : '₂'}`} rows={3} cols={4} active={showOutput} />
    </div>
  </div>;
}

export function FlashOutputPage() {
  const [step, setStep] = useState(0);
  const next = () => setStep(previous => previous === 3 ? 0 : previous + 1);

  return <section className="fop-slide" aria-label="逻辑权重矩阵 P 分块乘 V，得到注意力输出 O">
    <header className="fop-header">
      <Typography as="h1" variant="display">权重 P 分块乘 V，得到输出 O</Typography>
    </header>

    <div className="fop-main">
      <Typography as="strong" variant="display" className="fop-zone-name">SRAM</Typography>
      <div className="fop-lanes">
        <OutputLane row={1} active={step === 1} quiet={step === 2} showOutput={step === 1 || step === 3} />
        <OutputLane row={2} active={step === 2} quiet={step === 1} showOutput={step === 2 || step === 3} />
      </div>
      <div className={`fop-final${step === 3 ? ' fop-final--visible' : ''}`}>
        <Typography as="strong" variant="h2">上下拼接</Typography>
        <FlashBlock name="O" rows={6} cols={4} active={step === 3} />
        <Typography as="span" variant="h3" tone="muted">[T, d]</Typography>
      </div>
    </div>

    <footer className="fop-footer">
      <div className="fop-progress" aria-label={`第 ${step + 1} 个画面，共四个`}>
        {CAPTIONS.map((caption, index) => <span key={caption} className={index <= step ? 'fop-progress--active' : ''} />)}
      </div>
      <Typography as="strong" variant="h2" align="center" aria-live="polite">{CAPTIONS[step]}</Typography>
      <Button variant="primary" onClick={next}>{step === 3 ? '重播' : '下一步'}</Button>
    </footer>
  </section>;
}
