import { useRef, useState, type ReactNode } from 'react';
import { Button, MathFormulaStatic, Typography } from '../../shared/react';
import './LowRankCompressionPage.css';
import './GuidedLowRankPage.css';

export function LowRankSymbol({ base, upper, lower }: { base: string; upper?: string; lower?: string }) {
  return <span className="lrkc-symbol">{base}{(upper || lower) && <span className="lrkc-scripts"><sup>{upper || '\u00a0'}</sup><sub>{lower || '\u00a0'}</sub></span>}</span>;
}

export function LowRankMatrix({ label, shape, width, height, columns, rows, color }: {
  label: ReactNode; shape: string; width: number; height: number; columns: number; rows: number; color: string;
}) {
  return <div className={`lrkc-matrix lrkc-matrix--${color}`}>
    <Typography as="strong" variant="h3" tone="inherit">{label}</Typography>
    <div className="lrkc-grid" style={{ width, height, gridTemplateColumns: `repeat(${columns}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }} aria-hidden="true">
      {Array.from({ length: columns * rows }, (_, index) => <span key={index} />)}
    </div>
    <Typography as="span" variant="bodySmall" tone="muted" wrap="nowrap"><MathFormulaStatic latex={shape} /></Typography>
  </div>;
}

const GUIDED_CAPTIONS = [
  '同一组输入，经过三组不同投影，得到 Q、K、V。',
  '右下角的 t 表示 token 位置；这里 t = 3，对应「学」。',
  '将大投影矩阵分解为两个小矩阵；K、V 共享同一个下投影。',
  '同一个输入行，分别生成内容 K 和 V。',
  '代入旁边的低秩分解。',
  '依照矩阵乘法结合律，先计算两路相同部分。',
  '存下共同的潜在向量，代替内容 K、V 的缓存。',
] as const;

function GuidedSymbol({ base, upper, lower }: { base: string; upper?: string; lower?: string }) {
  return <MathFormulaStatic latex={`${base}${lower ? `_{${lower}}` : ''}${upper ? `^{${upper}}` : ''}`} />;
}

function TokenMatrix({ kind, selected }: { kind: 'X' | 'Q' | 'K' | 'V'; selected: boolean }) {
  const width = kind === 'X' ? 250 : 320;
  const height = kind === 'X' ? 260 : selected ? 80 : 96;
  return <div className={`glr-token-matrix glr-token-matrix--${kind.toLowerCase()}`}>
    <Typography as="strong" variant="h3" tone="inherit"><GuidedSymbol base={kind} /></Typography>
    <div className="glr-token-body" style={{ width, height }}>
      {kind === 'X' && <div className="glr-token-labels">{['我','爱','学','习'].map(token => <Typography as="span" variant="bodySmall" key={token}>{token}</Typography>)}</div>}
      <div className="glr-token-grid" aria-hidden="true">{Array.from({length:24},(_,i)=><span key={i} />)}</div>
      {selected && <><div className="glr-row-ring" /><Typography as="strong" variant="h3" tone="danger" className="glr-row-tag"><GuidedSymbol base={kind === 'X' ? 'h' : kind.toLowerCase()} lower="t" /></Typography></>}
    </div>
    <Typography as="span" variant="bodySmall" tone="muted"><MathFormulaStatic latex={kind === 'X' ? '[4, 7168]' : '[4, 16384]'} /></Typography>
  </div>;
}

function ProjectionScene({ selected }: { selected: boolean }) {
  return <div className={`glr-projection ${selected ? 'glr-projection--selected' : ''}`}>
    <svg className="glr-branches" viewBox="0 0 1420 610" aria-hidden="true"><defs><marker id="glr-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M1 1 L7 4 L1 7" fill="none" stroke="currentColor" strokeWidth="1.5" /></marker></defs>
      {[97,302,507].map(y=><path key={y} d={`M320 305 C375 305 370 ${y} 410 ${y}`} />)}
    </svg>
    <div className="glr-x-stage"><TokenMatrix kind="X" selected={selected} /></div>
    {(['Q','K','V'] as const).map((kind,i)=><div className="glr-lane" style={{top:i*205}} key={kind}>
      <Typography as="span" variant="h2">×</Typography>
      <LowRankMatrix label={<GuidedSymbol base="W" upper={kind} />} shape="[7168, 16384]" width={180} height={96} rows={4} columns={6} color={kind === 'Q' ? 'latent' : kind.toLowerCase()} />
      <Typography as="span" variant="h2">=</Typography>
      <TokenMatrix kind={kind} selected={selected} />
      {selected && <Typography as="p" variant="h3" tone="inherit" className={`glr-row-formula glr-row-formula--${kind.toLowerCase()}`}><MathFormulaStatic latex={`h_tW^{${kind}}=${kind.toLowerCase()}_t`} /></Typography>}
    </div>)}
  </div>;
}

function FactorizationScene() {
  return <div className="glr-factorizations">
    {(['K','V'] as const).map(kind=><div className="glr-factor-row" key={kind}>
      <LowRankMatrix label={<GuidedSymbol base="W" upper={kind} />} shape="[7168, 16384]" width={240} height={145} rows={6} columns={9} color={kind.toLowerCase()} />
      <Typography as="span" variant="h2">=</Typography>
      <LowRankMatrix label={<GuidedSymbol base="W" upper="DKV" />} shape="[7168, 512]" width={45} height={145} rows={6} columns={2} color="down" />
      <Typography as="span" variant="h2">×</Typography>
      <LowRankMatrix label={<GuidedSymbol base="W" upper={`U${kind}`} />} shape="[512, 16384]" width={300} height={45} rows={2} columns={10} color={kind.toLowerCase()} />
    </div>)}
  </div>;
}

function DerivationScene({ step }: { step: number }) {
  return <div className={`glr-derivations glr-derivations--step-${step}`}>
    <div className="glr-derivation-columns">
      {(['K','V'] as const).map(kind=><div className={`glr-derivation-route glr-derivation-route--${kind.toLowerCase()}`} key={kind}>
        <div className={`glr-substitution ${step === 4 ? 'is-visible' : ''}`} aria-hidden={step !== 4}>
          <Typography as="p" variant="h2" tone="inherit"><MathFormulaStatic latex={`W^{${kind}}=W^{DKV}W^{U${kind}}`} /></Typography>
          {step === 4 && <svg className="glr-substitution-arrow" viewBox="0 0 600 105" aria-hidden="true"><path d="M390 8 C450 35 430 70 340 90" /><path d="M350 78 L340 90 L355 94" /></svg>}
        </div>
        <Typography as="p" variant="display" className="glr-route-formula" aria-label={`${kind} 路的投影推导`}>
          <MathFormulaStatic className={`glr-color-${kind.toLowerCase()}`} latex={`${kind.toLowerCase()}_t=`} />
          {step === 3 ? <MathFormulaStatic latex={`h_tW^{${kind}}`} /> :
            step === 4 ? <MathFormulaStatic latex={String.raw`h_t\left(W^{DKV}W^{U${kind}}\right)`} /> :
            <><MathFormulaStatic className={`glr-shared-expression ${step === 6 ? 'is-extracted' : ''}`} latex={String.raw`\left(h_tW^{DKV}\right)`} /><MathFormulaStatic latex={`W^{U${kind}}`} /></>}
        </Typography>
      </div>)}
    </div>
    {step === 6 && <>
      <svg className="glr-extraction-lines" viewBox="0 0 1400 560" aria-hidden="true"><path d="M330 280 C330 330 580 315 680 390" /><path d="M1030 280 C1030 330 820 315 720 390" /><path d="M668 372 L680 390 L660 385 M732 372 L720 390 L740 385" /></svg>
      <div className="glr-latent-definition">
        <Typography as="p" variant="display" tone="inherit"><MathFormulaStatic latex={'c_t^{KV}=h_tW^{DKV}'} /></Typography>
        <Typography as="span" variant="h3" tone="inherit">要存的潜在向量 · [1, 512]</Typography>
      </div>
    </>}
  </div>;
}

export function LowRankCompressionPage() {
  const [step,setStep] = useState(0);
  const lastAdvance = useRef(0);
  const lastDirection = useRef<number | null>(null);
  const navigate = (direction: -1 | 1) => {
    const now = Date.now();
    if (lastDirection.current === direction && now - lastAdvance.current < 900) return;
    lastAdvance.current = now;
    lastDirection.current = direction;
    setStep(current => direction === -1 ? Math.max(0, current - 1) : current === 6 ? 0 : current + 1);
  };
  const title = step < 2 ? '我们要减少 KV 占的显存，就要知道它是咋来的。' : step === 2 ? '我们对它的投影矩阵 WK 和 WV 进行低秩压缩' : '从数学原理推导过程';
  return <section className="lrkc-slide glr-slide" data-glr-step={step} aria-label="逐步推导 KV 潜在向量">
    <Typography as="h1" variant={step >= 3 ? 'display' : 'h1'} align="center" aria-label={step >= 3 ? '我们通过存 c_t^{KV} 来代替存 k_t 和 v_t' : undefined}>{step >= 3 ? <span className="glr-math-title">我们通过存 <MathFormulaStatic latex={'c_t^{KV}'} /> 来代替存 <MathFormulaStatic latex={'k_t'} /> 和 <MathFormulaStatic latex={'v_t'} /></span> : step === 2 ? <span className="glr-math-title">我们对它的投影矩阵 <MathFormulaStatic latex={'W^K'} /> 和 <MathFormulaStatic latex={'W^V'} /> 进行低秩压缩</span> : title}</Typography>
    <main className="glr-stage" key={step}>
      {step < 2 ? <ProjectionScene selected={step === 1} /> : step === 2 ? <FactorizationScene /> : <DerivationScene step={step} />}
    </main>
    <footer className="glr-footer">
      <Button className="glr-back" disabled={step === 0} onClick={event => { event.stopPropagation(); navigate(-1); }}>← 播放上一步</Button>
      <Typography as="p" variant={step >= 3 ? 'h2' : step === 2 ? 'body' : 'h3'} align="center" aria-live="polite">{GUIDED_CAPTIONS[step]}</Typography>
      <Button variant="primary" onClick={event=>{
        event.stopPropagation();
        navigate(1);
      }}>{step === 6 ? '重新播放' : '播放下一步'} →</Button>
    </footer>
  </section>;
}
