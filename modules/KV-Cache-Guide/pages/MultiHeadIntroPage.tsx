import { useRef, useState } from 'react';
import { Button, Typography } from '../../shared/react';
import './MultiHeadIntroPage.css';

const TOKENS = ['我', '爱', '学', '习'] as const;
const PATHS = [{ kind: 'Q', y: 20 }, { kind: 'K', y: 208 }, { kind: 'V', y: 396 }] as const;
const MODES = [
  { name: 'MHA', fullName: 'Multi-head Attention', heads: 8, caption: '每个 Q 头使用独立的 K、V 头' },
  { name: 'GQA', fullName: 'Grouped-query Attention', heads: 4, caption: '每两个 Q 头共享一组 K、V 头' },
  { name: 'MQA', fullName: 'Multi-query Attention', heads: 1, caption: '所有 Q 头共享一组 K、V 头' },
] as const;

function Matrix({ name, shape, rows, columns, kind, tokens = false }: {
  name: string; shape: string; rows: number; columns: number; kind: string; tokens?: boolean;
}) {
  return <div className={`mhap-matrix mhap-matrix--${kind}`}>
    <Typography as="strong" variant="h3" tone="inherit">{name.startsWith('W') ? <>W<sub>{name.slice(1)}</sub></> : name}</Typography>
    <div className="mhap-matrix-body">
      {tokens && <div className="mhap-token-labels">{TOKENS.map(token => <Typography as="span" variant="body" tone="inherit" key={token}>{token}</Typography>)}</div>}
      <div className="mhap-grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)`, ...(kind === 'weight' ? { width: columns * 25 } : {}) }} aria-hidden="true">
        {Array.from({ length: rows * columns }, (_, index) => <span key={index} />)}
      </div>
    </div>
    <Typography as="span" variant="bodySmall" tone="muted" className="mhap-shape">{shape}</Typography>
  </div>;
}

function Result({ kind, heads, groups }: { kind: string; heads: number; groups: number }) {
  return <div className="mhap-matrix" role="img" aria-label={`${kind} [4,${heads * 64}]，${heads} 个头，每头 64 维`}>
    <div className="mhap-result-heading"><Typography as="strong" variant="h3" tone="inherit">{kind}</Typography><Typography as="span" variant="bodySmall" tone="muted">[4, {heads * 64}] · {heads} 头</Typography></div>
    <div className="mhap-head-bank is-split" style={{ width: heads * 62, gridTemplateColumns: `repeat(${heads}, 1fr)` }}>
      {Array.from({ length: heads }, (_, index) => index + 1).map(head => <div className="mhap-head" key={head}>
        <div className="mhap-head-grid" aria-hidden="true">{Array.from({ length: 8 }, (_, cell) => <span key={cell} />)}</div>
        <Typography as="span" variant="bodySmall" tone="inherit" className="mhap-head-label">{head}</Typography>
      </div>)}
    </div>
    {kind === 'Q' && <div className="mhap-sharing" style={{ gridTemplateColumns: `repeat(${groups}, 1fr)` }} aria-label={`${8 / groups} 个 Q 头共享一组 KV`}>{Array.from({ length: groups }, (_, index) => <span key={index} />)}</div>}
  </div>;
}

export function MultiHeadIntroPage() {
  const [step, setStep] = useState(0);
  const lastClick = useRef(0);
  const mode = MODES[step];
  return <section className="mhap-slide" aria-label="多头注意力：沿用第一页的 QKV 投影框架">
    <header className="mhap-header">
      <Typography as="h1" variant="h1" tone="main">真实情况中往往涉及多个注意力头</Typography>
    </header>
    <div className="mhap-diagram">
      <div className="mhap-mode" aria-live="polite"><Typography as="strong" variant="h2" tone="main">{mode.name}</Typography><Typography as="span" variant="body" tone="main">{mode.fullName}</Typography></div>
      <svg className="mhap-arrows" viewBox="0 0 1400 598" aria-hidden="true">
        <defs><marker id="mhap-arrow-head" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" orient="auto"><path d="M1 1 L8 4.5 L1 8" fill="none" stroke="currentColor" strokeWidth="1.5" /></marker></defs>
        {PATHS.map(({ kind, y }) => <path className={`mhap-arrow--${kind.toLowerCase()}`} d={`M310 312 C390 312, 390 ${y + 75}, 465 ${y + 75}`} key={kind} />)}
      </svg>
      <div className="mhap-input-stage">
        <Matrix name="X" shape="[4, 512]" rows={4} columns={4} kind="input" tokens />
      </div>
      {PATHS.map(({ kind, y }) => <div className={`mhap-lane mhap-lane--${kind.toLowerCase()}`} style={{ top: y }} key={kind}>
        <Typography as="span" variant="body" tone="inherit" className="mhap-multiply">×</Typography>
        <div className="mhap-weight"><Matrix name={`W${kind}`} shape={`[512, ${(kind === 'Q' ? 8 : mode.heads) * 64}]`} rows={6} columns={kind === 'Q' ? 8 : mode.heads} kind="weight" /></div>
        <Typography as="span" variant="body" tone="inherit" className="mhap-equals">=</Typography>
        <div className="mhap-result"><Result kind={kind} heads={kind === 'Q' ? 8 : mode.heads} groups={mode.heads} /></div>
      </div>)}
    </div>
    <footer className="mhap-footer">
      <Typography as="p" variant="body" tone="main" aria-live="polite">{mode.caption}</Typography>
      <Button variant="primary" onClick={event => { event.stopPropagation(); const now = Date.now(); if (now - lastClick.current < 900) return; lastClick.current = now; setStep(current => (current + 1) % MODES.length); }}>{step === 2 ? '重播' : `查看 ${MODES[step + 1].name}`} →</Button>
    </footer>
  </section>;
}
