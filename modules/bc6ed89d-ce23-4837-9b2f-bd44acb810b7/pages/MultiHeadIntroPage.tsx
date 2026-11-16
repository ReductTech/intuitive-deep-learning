import { useRef, useState } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
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
  return <div shuku-edit-id="e-07832ce2-e9f5-4c9b-ad2f-05dbc5cf1d72" className={`mhap-matrix mhap-matrix--${kind}`}>
    <Typography shuku-edit-id="e-173085b9-c181-48b9-9c73-7d5e356f5ed1" as="strong" variant="h3" tone="inherit">{name.startsWith('W') ? <>W<sub shuku-edit-id="e-da5f2161-e545-4d11-b62e-bb6f7cc01125">{name.slice(1)}</sub></> : name}</Typography>
    <div shuku-edit-id="e-b9ab4d72-e2a0-42ff-bc24-5d1507573180" className="mhap-matrix-body">
      {tokens && <div shuku-edit-id="e-0d74e1a7-f377-4081-bc2a-733409f54a96" className="mhap-token-labels">{TOKENS.map(token => <Typography shuku-edit-id="e-e074f280-0d39-4016-add7-08d444a86fcd" as="span" variant="body" tone="inherit" key={token}>{token}</Typography>)}</div>}
      <div shuku-edit-id="e-807a6f91-2696-4670-a288-ec653199e48c" className="mhap-grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)`, ...(kind === 'weight' ? { width: columns * 25 } : {}) }} aria-hidden="true">
        {Array.from({ length: rows * columns }, (_, index) => <span shuku-edit-id="e-2da88240-b553-4b9c-a7b7-723fa62f1e38" key={index} />)}
      </div>
    </div>
    <Typography shuku-edit-id="e-f999f917-922a-4bde-8253-b50b7e4fe5c5" as="span" variant="bodySmall" tone="muted" className="mhap-shape">{shape}</Typography>
  </div>;
}

function Result({ kind, heads, groups }: { kind: string; heads: number; groups: number }) {
  return <div shuku-edit-id="e-5e9de993-303e-45eb-9574-4b669f5d0b98" className="mhap-matrix" role="img" aria-label={`${kind} [4,${heads * 64}]，${heads} 个头，每头 64 维`}>
    <div shuku-edit-id="e-79fee779-c03d-4156-ab37-b1c5d78f7610" className="mhap-result-heading"><Typography shuku-edit-id="e-e49847e3-c4a4-4b37-933e-a48f906b14ef" as="strong" variant="h3" tone="inherit">{kind}</Typography><Typography shuku-edit-id="e-d75b144a-6f51-43ec-9987-74eb2f4f8a41" as="span" variant="bodySmall" tone="muted">[4, {heads * 64}] · {heads} 头</Typography></div>
    <div shuku-edit-id="e-4f9dc2cc-1aaf-45d3-8934-bc3d3af31581" className="mhap-head-bank is-split" style={{ width: heads * 62, gridTemplateColumns: `repeat(${heads}, 1fr)` }}>
      {Array.from({ length: heads }, (_, index) => index + 1).map(head => <div shuku-edit-id="e-8f02485d-5827-4754-b033-b4af69cf8fad" className="mhap-head" key={head}>
        <div shuku-edit-id="e-de926008-a454-448d-af61-f67fd2dd8d02" className="mhap-head-grid" aria-hidden="true">{Array.from({ length: 8 }, (_, cell) => <span shuku-edit-id="e-5b03423d-45b3-4f59-9607-5b28b76a1272" key={cell} />)}</div>
        <Typography shuku-edit-id="e-57330823-18df-4174-8f72-d2b59b378e0c" as="span" variant="bodySmall" tone="inherit" className="mhap-head-label">{head}</Typography>
      </div>)}
    </div>
    {kind === 'Q' && <div shuku-edit-id="e-fe6e9e61-6ab4-424a-a702-a43978550f55" className="mhap-sharing" style={{ gridTemplateColumns: `repeat(${groups}, 1fr)` }} aria-label={`${8 / groups} 个 Q 头共享一组 KV`}>{Array.from({ length: groups }, (_, index) => <span shuku-edit-id="e-1635a260-34ff-4a3d-857f-0b0c09f42a82" key={index} />)}</div>}
  </div>;
}

export function MultiHeadIntroPage() {
  const [step, setStep] = useState(0);
  const lastClick = useRef(0);
  const mode = MODES[step];
  return <section shuku-edit-id="e-0fab8d2a-7cbd-4158-9008-dfd3e7158af7" className="mhap-slide" aria-label="多头注意力：沿用第一页的 QKV 投影框架">
    <header shuku-edit-id="e-a2f57c02-4df8-49be-98dc-a906b4baea61" className="mhap-header">
      <Typography shuku-edit-id="e-18fd5fc0-e2da-483f-99b5-02bd363ed242" as="h1" variant="h1" tone="main">真实情况中往往涉及多个注意力头</Typography>
    </header>
    <div shuku-edit-id="e-e864845a-a359-40eb-ba89-b6d9ecb26e59" className="mhap-diagram">
      <div shuku-edit-id="e-8f20dc26-8188-4d01-b8b4-60742a3a8440" className="mhap-mode" aria-live="polite"><Typography shuku-edit-id="e-d6fd8885-114f-4c43-a070-37fc11a5d5fd" as="strong" variant="h2" tone="main">{mode.name}</Typography><Typography shuku-edit-id="e-f166aca3-6144-4d1f-8dc5-0153004794b8" as="span" variant="body" tone="main">{mode.fullName}</Typography></div>
      <svg shuku-edit-id="e-106ad8df-437e-4c9c-8990-708e6cbfaafd" className="mhap-arrows" viewBox="0 0 1400 598" aria-hidden="true">
        <defs shuku-edit-id="e-5b985bc1-ee8a-4f13-b323-8488a5e24124"><marker shuku-edit-id="e-5f4d9d0d-6899-4d8d-ba9b-22c1f8f2f664" id="mhap-arrow-head" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" orient="auto"><path shuku-edit-id="e-30a608a0-5638-4185-ba96-c6b91cc353ae" d="M1 1 L8 4.5 L1 8" fill="none" stroke="currentColor" strokeWidth="1.5" /></marker></defs>
        {PATHS.map(({ kind, y }) => <path shuku-edit-id="e-29e9bbe7-cd26-4555-a27e-18f4dc6667ce" className={`mhap-arrow--${kind.toLowerCase()}`} d={`M310 312 C390 312, 390 ${y + 75}, 465 ${y + 75}`} key={kind} />)}
      </svg>
      <div shuku-edit-id="e-1e4ca375-e0ec-4886-9f68-5e523d801cef" className="mhap-input-stage">
        <Matrix name="X" shape="[4, 512]" rows={4} columns={4} kind="input" tokens />
      </div>
      {PATHS.map(({ kind, y }) => <div shuku-edit-id="e-c8798b2a-f1af-4f85-a818-7af3f6493ef2" className={`mhap-lane mhap-lane--${kind.toLowerCase()}`} style={{ top: y }} key={kind}>
        <Typography shuku-edit-id="e-3efaef80-c49d-40ac-b293-c38adc60ffb6" as="span" variant="body" tone="inherit" className="mhap-multiply">×</Typography>
        <div shuku-edit-id="e-f28dd20e-7fd1-40ae-b476-21d4a3470c0b" className="mhap-weight"><Matrix name={`W${kind}`} shape={`[512, ${(kind === 'Q' ? 8 : mode.heads) * 64}]`} rows={6} columns={kind === 'Q' ? 8 : mode.heads} kind="weight" /></div>
        <Typography shuku-edit-id="e-d33389ba-784a-4d3b-80e9-a01f2c13fb89" as="span" variant="body" tone="inherit" className="mhap-equals">=</Typography>
        <div shuku-edit-id="e-3f627090-f771-4b64-af1e-eb69f41daa59" className="mhap-result"><Result kind={kind} heads={kind === 'Q' ? 8 : mode.heads} groups={mode.heads} /></div>
      </div>)}
    </div>
    <footer shuku-edit-id="e-356f4609-52cf-4082-bce3-fbaedcd1f3fa" className="mhap-footer">
      <Typography shuku-edit-id="e-03152ba5-c7bd-463f-8540-4398c51251fc" as="p" variant="body" tone="main" aria-live="polite">{mode.caption}</Typography>
      <Button variant="primary" onClick={event => { event.stopPropagation(); const now = Date.now(); if (now - lastClick.current < 900) return; lastClick.current = now; setStep(current => (current + 1) % MODES.length); }}>{step === 2 ? '重播' : `查看 ${MODES[step + 1].name}`} →</Button>
    </footer>
  </section>;
}
