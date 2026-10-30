import { useEffect, useRef, useState } from 'react';
import { Button, Typography } from '../../shared/react';
import './FlashNormalizePage.css';

const CAPTIONS = ['沿用上一页的四块 S', '先遮住未来的位置', 'S₁₁：形成上三行的权重', 'S₁₂ 全部被遮罩，权重不变', 'S₂₁：先得到暂时的权重', '加入 S₂₂：更新 P₂₁，形成 P₂₂'] as const;
const NAMES = ['₁₁', '₁₂', '₂₁', '₂₂'] as const;
const BUTTONS = ['加因果遮罩', '计算 S₁₁', '加入 S₁₂', '计算 S₂₁', '加入 S₂₂', '重播'] as const;

function LogicalMatrix({ kind, step }: { kind: 'S' | 'P'; step: number }) {
  const activeBlock = step >= 2 ? step - 2 : -1;
  return <div className={`fnp-logical fnp-logical--${kind.toLowerCase()}`} role="img"
    aria-label={kind === 'S' ? `六行六列的逻辑 S 矩阵${step >= 1 ? '，未来位置已被遮罩' : ''}` : '六行六列的逻辑 P 矩阵；颜色仅表示计算状态，不表示概率大小'}>
    {NAMES.map((name, block) => {
      const formed = kind === 'S' || (block === 0 && step >= 2) || (block === 1 && step >= 3) || (block === 2 && step >= 4) || (block === 3 && step >= 5);
      const provisional = kind === 'P' && block === 2 && step === 4;
      return <div key={name} className={`fnp-tile${kind === 'S' && block === activeBlock ? ' fnp-tile--current' : ''}${provisional ? ' fnp-tile--temporary' : ''}${kind === 'P' && block >= 2 && step === 5 ? ' fnp-tile--revised' : ''}`}>
        {Array.from({ length: 9 }, (_, index) => {
          const row = Math.floor(index / 3) + (block >= 2 ? 3 : 0);
          const col = index % 3 + (block % 2 ? 3 : 0);
          const masked = col > row && (kind === 'S' ? step >= 1 : formed);
          return <span key={index} className={`fnp-cell${masked ? ' fnp-cell--masked' : formed ? provisional ? ' fnp-cell--temporary' : ' fnp-cell--formed' : ''}`} />;
        })}
        {formed && <Typography as="span" variant="h2" className="fnp-tile-name">{kind}{name}</Typography>}
      </div>;
    })}
  </div>;
}

function ScorePair({ step }: { step: number }) {
  const lower = step >= 4;
  const leftBlock = lower ? 2 : 0;
  const arrived = step === 3 || step === 5;
  return <div className="fnp-work" key={lower ? 'lower' : 'upper'}>
    <Typography as="strong" variant="h2">{lower ? '下三行' : '上三行'}</Typography>
    <div className="fnp-pair" role="img" aria-label={`${lower ? 'S21 与 S22' : 'S11 与 S12'} 横向对应同一组三行；沿六个位置归一化`}>
      {[leftBlock, leftBlock + 1].map((block, side) => <div key={block} className={`fnp-tile fnp-pair-tile${side === 1 && !arrived ? ' fnp-pair-tile--waiting' : ''}${side === Number(arrived) ? ' fnp-tile--current' : ''}`}>
        {Array.from({ length: 9 }, (_, index) => {
          const row = Math.floor(index / 3) + (lower ? 3 : 0);
          const col = index % 3 + side * 3;
          return <span key={index} className={`fnp-cell${col > row ? ' fnp-cell--masked' : ' fnp-cell--formed'}`} />;
        })}
        <Typography as="span" variant="h2" className="fnp-tile-name">S{NAMES[block]}</Typography>
      </div>)}
    </div>
    <div className="fnp-row-scope" aria-hidden="true" />
    <Typography as="strong" variant="h2">Softmax</Typography>
    <Typography as="span" variant="h3" tone="muted">按行归一化</Typography>
    {step === 3 && <Typography as="span" variant="h3" className="fnp-result-note">结果不变</Typography>}
    {step === 5 && <Typography as="span" variant="h3" className="fnp-result-note">同一行的权重一起更新</Typography>}
  </div>;
}

function FlowArrow({ visible }: { visible: boolean }) {
  return <svg className={`fnp-arrow${visible ? ' fnp-arrow--visible' : ''}`} viewBox="0 0 80 30" fill="none" aria-hidden="true">
    <path d="M4 15h66m-13-11 13 11-13 11" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}

export function FlashNormalizePage() {
  const [step, setStep] = useState(0);
  const [advancing, setAdvancing] = useState(false);
  const advancingRef = useRef(false);
  const advance = () => {
    if (advancingRef.current) return;
    advancingRef.current = true;
    setAdvancing(true);
    setStep(previous => previous === 5 ? 0 : previous + 1);
  };

  useEffect(() => {
    if (!advancing) return;
    const timer = window.setTimeout(() => {
      advancingRef.current = false;
      setAdvancing(false);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [advancing]);

  return <section className="fnp-slide" aria-label="因果遮罩后，逐块形成逻辑 P 矩阵">
    <header className="fnp-header"><Typography as="h1" variant="display">因果遮罩后，逐块形成 P</Typography></header>
    <div className="fnp-stage">
      <Typography as="strong" variant="display" className="fnp-zone-name">SRAM</Typography>
      <div className="fnp-matrix-column">
        <Typography as="strong" variant="h2">S（逻辑示意）</Typography>
        <LogicalMatrix kind="S" step={step} />
        <Typography as="span" variant="h3" tone="muted">[6, 6]</Typography>
      </div>
      <FlowArrow visible={step >= 2} />
      <div className="fnp-operation">{step >= 2 && <ScorePair step={step} />}</div>
      <FlowArrow visible={step >= 2} />
      <div className="fnp-matrix-column">
        <Typography as="strong" variant="h2">P（逻辑示意）</Typography>
        <LogicalMatrix kind="P" step={step} />
        <Typography as="span" variant="h3" tone="muted">[6, 6]</Typography>
        {step === 4 && <Typography as="span" variant="h3" className="fnp-p-status">P₂₁ 暂态</Typography>}
        {step === 5 && <Typography as="span" variant="h3" className="fnp-p-status">整行归一化完成</Typography>}
      </div>
    </div>
    <footer className="fnp-footer">
      <div className="fnp-progress" aria-label={`第 ${step + 1} 个画面，共六个`}>{CAPTIONS.map((caption, index) => <span key={caption} className={index <= step ? 'fnp-progress--active' : ''} />)}</div>
      <Typography as="strong" variant="h2" align="center" aria-live="polite">{CAPTIONS[step]}</Typography>
      <Button variant="primary" disabled={advancing} onClick={advance}>{BUTTONS[step]}</Button>
    </footer>
  </section>;
}
