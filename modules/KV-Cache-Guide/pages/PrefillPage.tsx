import { Typography } from '../../shared/react';
import './PrefillPage.css';

const TOKENS = ['我', '爱', '学', '习'] as const;
type Path = 'q' | 'k' | 'v';

const paths: { id: Path; y: number; weight: string; weightShape: string; result: string; resultShape: string }[] = [
  { id: 'q', y: 20, weight: 'WQ', weightShape: '[512, 64]', result: 'Q', resultShape: '[4, 64]' },
  { id: 'k', y: 208, weight: 'WK', weightShape: '[512, 64]', result: 'K', resultShape: '[4, 64]' },
  { id: 'v', y: 396, weight: 'WV', weightShape: '[512, 64]', result: 'V', resultShape: '[4, 64]' },
];

function Matrix({ name, shape, rows, columns, kind, tokens = false }: {
  name: string; shape: string; rows: number; columns: number; kind: string; tokens?: boolean;
}) {
  return <div className={`kvc-diagram-matrix kvc-diagram-matrix--${kind}`}>
    <Typography as="strong" variant="h3" tone="inherit" className="kvc-diagram-name">{name.startsWith('W') ? <>W<sub>{name.slice(1)}</sub></> : name}</Typography>
    <div className="kvc-diagram-matrix-body">
      {tokens && <div className="kvc-diagram-token-labels">{TOKENS.map((token) => <Typography as="span" variant="body" tone="inherit" key={token}>{token}</Typography>)}</div>}
      <div className="kvc-diagram-grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }} aria-hidden="true">
        {Array.from({ length: rows * columns }, (_, index) => <span key={index} />)}
      </div>
      <Typography as="span" variant="bodySmall" tone="inherit" className="kvc-diagram-dots">…</Typography>
    </div>
    <Typography as="span" variant="bodySmall" tone="muted" className="kvc-diagram-shape">{shape}</Typography>
  </div>;
}

function Arrows() {
  return <svg className="kvc-diagram-arrows" viewBox="0 0 1160 598" aria-hidden="true">
    <defs><marker id="kvc-arrow-head" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" orient="auto"><path d="M1 1 L8 4.5 L1 8" fill="none" stroke="currentColor" strokeWidth="1.5" /></marker></defs>
    {paths.map(({ id, y }) => <g className={`kvc-arrow-path kvc-arrow-path--${id}`} key={id}>
      <path d={`M 330 312 C 390 312, 390 ${y + 75}, 450 ${y + 75}`} />
    </g>)}
  </svg>;
}

export function PrefillPage() {
  return <section className="kvc-prefill-slide" aria-label="KV Cache 第一页：一个代表性头的 QKV 投影">
    <div className="kvc-prefill-header">
      <Typography as="h1" variant="h1" tone="main">四个 token，怎样变成 Q、K、V？</Typography>
      <Typography as="p" variant="bodySmall" tone="muted">聚焦一个代表性注意力头，暂不展开多头结构。</Typography>
    </div>

    <div className="kvc-diagram">
      <Arrows />
      <div className="kvc-input-stage">
        <Typography as="strong" variant="h3" tone="main" className="kvc-input-phrase">我爱学习</Typography>
        <Matrix name="X" shape="[4, 512]" rows={4} columns={4} kind="input" tokens />
      </div>

      {paths.map((path) => <div className={`kvc-path-lane kvc-path-lane--${path.id}`} style={{ top: path.y }} key={path.id}>
        <Typography as="span" variant="body" tone="inherit" className="kvc-path-symbol kvc-path-symbol--multiply">×</Typography>
        <div className="kvc-path-weight">
          <Matrix name={path.weight} shape={path.weightShape} rows={7} columns={3} kind={`weight-${path.id}`} />
        </div>
        <Typography as="span" variant="body" tone="inherit" className="kvc-path-symbol kvc-path-symbol--equals">=</Typography>
        <div className="kvc-path-result">
          <Matrix name={path.result} shape={path.resultShape} rows={4} columns={5} kind={path.id} />
        </div>
      </div>)}

    </div>

    <div className="kvc-prefill-footer">
      <Typography as="p" variant="body" tone="main" align="center">同一个 X 经过三组不同的线性投影，得到 Q、K、V。</Typography>
    </div>
  </section>;
}
