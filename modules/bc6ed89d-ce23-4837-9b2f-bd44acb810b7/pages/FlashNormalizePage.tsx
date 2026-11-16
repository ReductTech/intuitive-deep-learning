import { useEffect, useRef, useState } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
import './FlashNormalizePage.css';

const CAPTIONS = ['沿用上一页的四块 S', '先遮住未来的位置', 'S₁₁：形成上三行的权重', 'S₁₂ 全部被遮罩，权重不变', 'S₂₁：先得到暂时的权重', '加入 S₂₂：更新 P₂₁，形成 P₂₂'] as const;
const NAMES = ['₁₁', '₁₂', '₂₁', '₂₂'] as const;
const BUTTONS = ['加因果遮罩', '计算 S₁₁', '加入 S₁₂', '计算 S₂₁', '加入 S₂₂', '重播'] as const;

function LogicalMatrix({ kind, step }: { kind: 'S' | 'P'; step: number }) {
  const activeBlock = step >= 2 ? step - 2 : -1;
  return <div shuku-edit-id="e-8c8cbfee-fc83-4a3a-a8ce-5ccc0ce96d81" className={`fnp-logical fnp-logical--${kind.toLowerCase()}`} role="img"
    aria-label={kind === 'S' ? `六行六列的逻辑 S 矩阵${step >= 1 ? '，未来位置已被遮罩' : ''}` : '六行六列的逻辑 P 矩阵；颜色仅表示计算状态，不表示概率大小'}>
    {NAMES.map((name, block) => {
      const formed = kind === 'S' || (block === 0 && step >= 2) || (block === 1 && step >= 3) || (block === 2 && step >= 4) || (block === 3 && step >= 5);
      const provisional = kind === 'P' && block === 2 && step === 4;
      return <div shuku-edit-id="e-c7a94b5a-8341-4274-95b1-032640cff52c" key={name} className={`fnp-tile${kind === 'S' && block === activeBlock ? ' fnp-tile--current' : ''}${provisional ? ' fnp-tile--temporary' : ''}${kind === 'P' && block >= 2 && step === 5 ? ' fnp-tile--revised' : ''}`}>
        {Array.from({ length: 9 }, (_, index) => {
          const row = Math.floor(index / 3) + (block >= 2 ? 3 : 0);
          const col = index % 3 + (block % 2 ? 3 : 0);
          const masked = col > row && (kind === 'S' ? step >= 1 : formed);
          return <span shuku-edit-id="e-3404281b-7c01-4e9c-8277-c7a314572435" key={index} className={`fnp-cell${masked ? ' fnp-cell--masked' : formed ? provisional ? ' fnp-cell--temporary' : ' fnp-cell--formed' : ''}`} />;
        })}
        {formed && <Typography shuku-edit-id="e-62f288be-85da-411c-add0-0e02c492a93d" as="span" variant="h2" className="fnp-tile-name">{kind}{name}</Typography>}
      </div>;
    })}
  </div>;
}

function ScorePair({ step }: { step: number }) {
  const lower = step >= 4;
  const leftBlock = lower ? 2 : 0;
  const arrived = step === 3 || step === 5;
  return <div shuku-edit-id="e-92a3c134-be12-4da3-957c-0e0c2bb6c92e" className="fnp-work" key={lower ? 'lower' : 'upper'}>
    <Typography shuku-edit-id="e-89ea6578-7a8e-436a-b58c-1672821ad826" as="strong" variant="h2">{lower ? '下三行' : '上三行'}</Typography>
    <div shuku-edit-id="e-ee4e922f-01c0-41c9-b932-8a9e31dd34f6" className="fnp-pair" role="img" aria-label={`${lower ? 'S21 与 S22' : 'S11 与 S12'} 横向对应同一组三行；沿六个位置归一化`}>
      {[leftBlock, leftBlock + 1].map((block, side) => <div shuku-edit-id="e-e66e6b6e-40a1-4e0c-9b47-25d8bcb16b4a" key={block} className={`fnp-tile fnp-pair-tile${side === 1 && !arrived ? ' fnp-pair-tile--waiting' : ''}${side === Number(arrived) ? ' fnp-tile--current' : ''}`}>
        {Array.from({ length: 9 }, (_, index) => {
          const row = Math.floor(index / 3) + (lower ? 3 : 0);
          const col = index % 3 + side * 3;
          return <span shuku-edit-id="e-94a616c8-fe6e-4bf7-9dd7-b06e7af46974" key={index} className={`fnp-cell${col > row ? ' fnp-cell--masked' : ' fnp-cell--formed'}`} />;
        })}
        <Typography shuku-edit-id="e-d71191bc-06d2-40d3-a4ea-69ebd3c756cb" as="span" variant="h2" className="fnp-tile-name">S{NAMES[block]}</Typography>
      </div>)}
    </div>
    <div shuku-edit-id="e-01866496-4ae3-44f6-88f3-c9462e072543" className="fnp-row-scope" aria-hidden="true" />
    <Typography shuku-edit-id="e-7f661239-a6ad-4f79-9c82-b119054ac7ae" as="strong" variant="h2">Softmax</Typography>
    <Typography shuku-edit-id="e-82b9e847-a7ba-4e1d-acb1-75080ad9b475" as="span" variant="h3" tone="muted">按行归一化</Typography>
    {step === 3 && <Typography shuku-edit-id="e-3b316720-915a-4d39-b6aa-d5be987f1df9" as="span" variant="h3" className="fnp-result-note">结果不变</Typography>}
    {step === 5 && <Typography shuku-edit-id="e-d199153c-d9ac-43fb-ad6f-5285a22b5bd0" as="span" variant="h3" className="fnp-result-note">同一行的权重一起更新</Typography>}
  </div>;
}

function FlowArrow({ visible }: { visible: boolean }) {
  return <svg shuku-edit-id="e-99ba384d-dd88-453d-a2f4-ebe3dd58872a" className={`fnp-arrow${visible ? ' fnp-arrow--visible' : ''}`} viewBox="0 0 80 30" fill="none" aria-hidden="true">
    <path shuku-edit-id="e-70f9ae6c-011c-4466-b62a-6dbb279873eb" d="M4 15h66m-13-11 13 11-13 11" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
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

  return <section shuku-edit-id="e-825cf6d8-7dd9-4e78-a11c-e2886541f147" className="fnp-slide" aria-label="因果遮罩后，逐块形成逻辑 P 矩阵">
    <header shuku-edit-id="e-bf1fbffe-1c19-44ff-92d1-e050566196ef" className="fnp-header"><Typography shuku-edit-id="e-d3088e36-8776-436a-810b-3a50413aaa0f" as="h1" variant="display">因果遮罩后，逐块形成 P</Typography></header>
    <div shuku-edit-id="e-80b2d046-8e4e-40bb-bc09-5d0e1993e6b6" className="fnp-stage">
      <Typography shuku-edit-id="e-ddfd2eb0-247e-435d-80e0-1cd09728bca6" as="strong" variant="display" className="fnp-zone-name">SRAM</Typography>
      <div shuku-edit-id="e-5c552c7c-5d00-4d06-a078-1bc706565097" className="fnp-matrix-column">
        <Typography shuku-edit-id="e-d1ca5e87-660f-4e10-a981-2669f5911b33" as="strong" variant="h2">S（逻辑示意）</Typography>
        <LogicalMatrix kind="S" step={step} />
        <Typography shuku-edit-id="e-7479fb95-f1f6-494d-b374-97d3401ae3b3" as="span" variant="h3" tone="muted">[6, 6]</Typography>
      </div>
      <FlowArrow visible={step >= 2} />
      <div shuku-edit-id="e-e7f9b70d-b4c0-4e15-98d1-5afd69949c99" className="fnp-operation">{step >= 2 && <ScorePair step={step} />}</div>
      <FlowArrow visible={step >= 2} />
      <div shuku-edit-id="e-c7302c2b-d5ac-42de-8a28-4dcbfc6048b5" className="fnp-matrix-column">
        <Typography shuku-edit-id="e-fa5e8306-fb20-4a69-973c-c168aed06932" as="strong" variant="h2">P（逻辑示意）</Typography>
        <LogicalMatrix kind="P" step={step} />
        <Typography shuku-edit-id="e-e6276368-b315-4f47-a13f-c9aec2c6e04f" as="span" variant="h3" tone="muted">[6, 6]</Typography>
        {step === 4 && <Typography shuku-edit-id="e-43d4d366-7071-4234-b21c-fcc8454f8a94" as="span" variant="h3" className="fnp-p-status">P₂₁ 暂态</Typography>}
        {step === 5 && <Typography shuku-edit-id="e-7e4e30a8-032f-4487-b560-7be9d72c888c" as="span" variant="h3" className="fnp-p-status">整行归一化完成</Typography>}
      </div>
    </div>
    <footer shuku-edit-id="e-a0410963-f532-4e3f-a12c-24900dc0e753" className="fnp-footer">
      <div shuku-edit-id="e-c69dbb35-9d50-4bba-b54c-44df53da83d9" className="fnp-progress" aria-label={`第 ${step + 1} 个画面，共六个`}>{CAPTIONS.map((caption, index) => <span shuku-edit-id="e-71ce54d5-d96f-43e6-b1bb-e4ac2e8baf94" key={caption} className={index <= step ? 'fnp-progress--active' : ''} />)}</div>
      <Typography shuku-edit-id="e-b6690cc8-5847-453d-9422-34f2c42dccc3" as="strong" variant="h2" align="center" aria-live="polite">{CAPTIONS[step]}</Typography>
      <Button variant="primary" disabled={advancing} onClick={advance}>{BUTTONS[step]}</Button>
    </footer>
  </section>;
}
