import { Typography } from "@shuku/course-style/react";
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
  return <div shuku-edit-id="e-ebec82a2-0010-4c45-b730-eace1d463423" className={`kvc-diagram-matrix kvc-diagram-matrix--${kind}`}>
    <Typography shuku-edit-id="e-f1efd1bf-ad08-47c2-b388-e1e588dbacbb" as="strong" variant="h3" tone="inherit" className="kvc-diagram-name">{name.startsWith('W') ? <>W<sub shuku-edit-id="e-0dda3412-1ded-461f-b483-1511eb8991f4">{name.slice(1)}</sub></> : name}</Typography>
    <div shuku-edit-id="e-0da2b17e-8fa7-44ad-8648-1177c75cb879" className="kvc-diagram-matrix-body">
      {tokens && <div shuku-edit-id="e-e95234f8-f9ee-4b73-a4b1-db59e08c4ff5" className="kvc-diagram-token-labels">{TOKENS.map((token) => <Typography shuku-edit-id="e-60e0da23-7330-48eb-9453-0e1c3b1dfd1d" as="span" variant="body" tone="inherit" key={token}>{token}</Typography>)}</div>}
      <div shuku-edit-id="e-7f28ef5e-4ebc-4576-bce0-a72dcb48e26c" className="kvc-diagram-grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }} aria-hidden="true">
        {Array.from({ length: rows * columns }, (_, index) => <span shuku-edit-id="e-31ad1c01-0945-4c18-9f13-2b7e6818b609" key={index} />)}
      </div>
      <Typography shuku-edit-id="e-fd4740aa-8f28-48e0-b06a-1307168a8a8b" as="span" variant="bodySmall" tone="inherit" className="kvc-diagram-dots">…</Typography>
    </div>
    <Typography shuku-edit-id="e-a95fc378-f692-47cd-a331-9d8831c4ee4a" as="span" variant="bodySmall" tone="muted" className="kvc-diagram-shape">{shape}</Typography>
  </div>;
}

function Arrows() {
  return <svg shuku-edit-id="e-5f553cd3-151d-4304-86a4-a44f72dfe421" className="kvc-diagram-arrows" viewBox="0 0 1160 598" aria-hidden="true">
    <defs shuku-edit-id="e-5e379587-6ca2-41bd-bc65-446e5df9589c"><marker shuku-edit-id="e-d47a7376-5e42-4237-b7a2-b727f9c4874b" id="kvc-arrow-head" markerWidth="9" markerHeight="9" refX="7.5" refY="4.5" orient="auto"><path shuku-edit-id="e-4dde6ccd-016c-4611-ab1c-5dd06a76b6d1" d="M1 1 L8 4.5 L1 8" fill="none" stroke="currentColor" strokeWidth="1.5" /></marker></defs>
    {paths.map(({ id, y }) => <g shuku-edit-id="e-f7a3fd8c-9318-49b7-bebd-457ee277aefd" className={`kvc-arrow-path kvc-arrow-path--${id}`} key={id}>
      <path shuku-edit-id="e-2aa07d43-2005-4c95-a559-396360f540b0" d={`M 330 312 C 390 312, 390 ${y + 75}, 450 ${y + 75}`} />
    </g>)}
  </svg>;
}

export function PrefillPage() {
  return <section shuku-edit-id="e-8f8023d4-77d2-465a-b6d0-4fed856232cc" className="kvc-prefill-slide" aria-label="KV Cache 第一页：一个代表性头的 QKV 投影">
    <div shuku-edit-id="e-37f3db72-61e1-48ad-860f-6cc87fd3d8da" className="kvc-prefill-header">
      <Typography shuku-edit-id="e-ade0db25-a705-43c0-85f6-0cb260b133d1" as="h1" variant="h1" tone="main">四个 token，怎样变成 Q、K、V？</Typography>
      <Typography shuku-edit-id="e-0b47e209-9151-4501-9c99-8966b6e7d2f6" as="p" variant="bodySmall" tone="muted">聚焦一个代表性注意力头，暂不展开多头结构。</Typography>
    </div>

    <div shuku-edit-id="e-dd410cd9-d9c8-4982-af2b-a7b1bda0928d" className="kvc-diagram">
      <Arrows />
      <div shuku-edit-id="e-f940d018-3b27-4e94-942f-412208d75a14" className="kvc-input-stage">
        <Typography shuku-edit-id="e-cb9ac0c4-9243-43c9-9a7d-fdc73eac31d5" as="strong" variant="h3" tone="main" className="kvc-input-phrase">我爱学习</Typography>
        <Matrix name="X" shape="[4, 512]" rows={4} columns={4} kind="input" tokens />
      </div>

      {paths.map((path) => <div shuku-edit-id="e-3fab0812-111a-42c6-aaa9-d4c033b045a5" className={`kvc-path-lane kvc-path-lane--${path.id}`} style={{ top: path.y }} key={path.id}>
        <Typography shuku-edit-id="e-20a40a27-7f61-4c59-a5a0-b086e0cd184a" as="span" variant="body" tone="inherit" className="kvc-path-symbol kvc-path-symbol--multiply">×</Typography>
        <div shuku-edit-id="e-5636023e-70e4-4750-928b-d9075153bfee" className="kvc-path-weight">
          <Matrix name={path.weight} shape={path.weightShape} rows={7} columns={3} kind={`weight-${path.id}`} />
        </div>
        <Typography shuku-edit-id="e-def649a6-94d8-4a40-99e9-087628de2113" as="span" variant="body" tone="inherit" className="kvc-path-symbol kvc-path-symbol--equals">=</Typography>
        <div shuku-edit-id="e-39696b9a-302b-4ea3-9836-2ab0d7446d3f" className="kvc-path-result">
          <Matrix name={path.result} shape={path.resultShape} rows={4} columns={5} kind={path.id} />
        </div>
      </div>)}

    </div>

    <div shuku-edit-id="e-75816bc4-4838-46a8-b339-3e1d4df1f280" className="kvc-prefill-footer">
      <Typography shuku-edit-id="e-b0f0a522-3c5f-4480-b34d-f299ae08fac4" as="p" variant="body" tone="main" align="center">同一个 X 经过三组不同的线性投影，得到 Q、K、V。</Typography>
    </div>
  </section>;
}
