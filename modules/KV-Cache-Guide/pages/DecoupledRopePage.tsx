import { useId, useRef, useState, type CSSProperties } from 'react';
import { Button, MathFormulaStatic, Typography } from '../../shared/react';
import './DecoupledRopePage.css';

const STATES = [
  { title: '注意力既要看内容，也要知道位置', explanation: '根据 token 的位置变换 Q、K，再计算它们的匹配分数。', caption: '不仅比较内容，也考虑 token 的位置。' },
  { title: '注意力既要看内容，也要知道位置', explanation: '同样的内容，位置不同，应用的位置变换也不同。', caption: 'RoPE 变换原有向量，不是在后面追加位置标签。' },
  { title: '没有位置旋转，固定投影可以提前合并', explanation: '先合并固定的 Q 投影与 K 上投影', caption: '固定 Q 投影与 K 上投影，可以提前合并。' },
  { title: '没有位置旋转，固定投影可以提前合并', explanation: '合并后的投影直接与潜在 KV 矩阵计算', caption: '合并一次，所有位置复用同一个固定投影。' },
  { title: '位置旋转，妨碍原来的矩阵吸收', explanation: '', caption: '位置变换不固定，无法提前合成通用投影。' },
  { title: '原来的 Q、K，继续负责内容匹配', explanation: '先保留旋转前的 Q、K，不对它们做 RoPE。', caption: '内容不旋转；位置信息交给另外的分量。' },
  { title: '将不旋转的 Q、K 记为内容矩阵', explanation: '加上 C 表示 Content（内容），不是再做一次矩阵运算。', caption: '沿用原来的内容分支，记作内容 Q、内容 K。' },
  { title: '从输入另外生成短的位置 Q', explanation: '位置分支使用另一组投影权重。', caption: '小投影生成短矩阵，再按 token 位置做 RoPE。' },
  { title: '位置 K 也通过小投影，再做 RoPE', explanation: 'Q、K 的位置分支各用自己的投影权重。', caption: '内容分量不旋转，短位置分量单独旋转。' },
  { title: '内容分数＋位置分数＝最终匹配分数', explanation: '分别计算内容匹配与位置匹配', caption: '内容与内容匹配，位置与位置匹配，两项分数相加。' },
  { title: '内容分数＋位置分数＝最终匹配分数', explanation: '两路分数相加后，共同进行归一化', caption: '两路分数相加，再统一做缩放、因果遮罩和 Softmax。' },
  { title: '缓存潜在 KV，再加一份短位置 K', explanation: '内容部分缓存潜在 KV，位置部分缓存旋转后的 K', caption: '不必缓存展开的内容 K、V，只需缓存潜在 KV 和位置 K。' },
];

function Arrow() {
  return <svg className="drp-arrow" viewBox="0 0 80 40" aria-hidden="true"><path d="M4 20 H72 M61 9 L72 20 L61 31" /></svg>;
}

const Q_EXAMPLE = [
  [1, 2, 0, 1, 2, -1, 1, 0], [2, 1, 1, 2, -1, 2, 2, -2],
  [0, 1, 2, 1, 1, -1, -2, 1], [1, -1, 2, 0, 1, 2, 0, -1],
  [2, 0, -1, 1, 0, 2, 1, -2], [-1, 2, 1, 0, 2, 1, -1, 1],
  [1, 1, 0, 2, -2, 1, 2, 0], [0, 2, 1, -1, 1, 0, -1, 2],
];
function rotatePair(x: number, y: number, degrees: number) {
  const angle = degrees * Math.PI / 180;
  return [x * Math.cos(angle) - y * Math.sin(angle), x * Math.sin(angle) + y * Math.cos(angle)];
}
function numberLabel(value: number) {
  const rounded = Math.round(value * 10) / 10;
  return Object.is(rounded, -0) ? '0' : String(rounded);
}
function introCaption(phase: number) {
  if (phase === 0) return '先用 30° 步长演示；真实 RoPE 各坐标对的步长不同。';
  if (phase === 9) return 'RoPE 按位置旋转 Q、K，使匹配分数体现相对位置。';
  const position = phase - 1;
  return position === 0 ? '位置 0：0×30°＝0°，坐标保持不变。' : `位置 ${position}：${position}×30°＝${position * 30}°，写入这一行。`;
}
function NumericMatrix({ output, phase, selectedRow }: { output: boolean; phase: number; selectedRow: number }) {
  return <div className="drp-number-matrix">
    <Typography as="p" variant="h2" align="center">{output ? '旋转后的 Q' : '原始 Q'}</Typography>
    <Typography as="p" variant="bodySmall" align="center" tone="muted">8 个 token × 8 维</Typography>
    <div className="drp-number-grid">
      <Typography as="p" variant="bodySmall" align="center">位置</Typography>
      {Array.from({length: 8}, (_, col) => <Typography key={`col${col}`} as="p" variant="bodySmall" align="center" tone="muted">{col + 1}</Typography>)}
      {Q_EXAMPLE.flatMap((row, r) => [
        <Typography key={`row${r}`} as="p" variant="bodySmall" align="center" className={r === selectedRow ? 'drp-selected-position' : ''}>{r}</Typography>,
        ...row.map((value, col) => {
          const visible = !output || phase === 9 || (r < phase && col < 2);
          const active = r === selectedRow && col < 2;
          const transformed = rotatePair(row[col - col % 2], row[col - col % 2 + 1], r * 30)[col % 2];
          return <div key={`${r}-${col}`} className={`drp-number-cell ${r === selectedRow ? 'is-row' : ''} ${active ? 'is-pair' : ''} ${output && visible ? 'is-filled' : ''} ${output && active && phase > 0 && phase < 9 ? 'is-writing' : ''}`}>
            <Typography as="p" variant="bodySmall" align="center">{visible ? output ? numberLabel(transformed) : value : '·'}</Typography>
          </div>;
        }),
      ])}
    </div>
  </div>;
}
function RotationCircle({ x, y, degrees, rotated }: { x: number; y: number; degrees: number; rotated: boolean }) {
  const marker = useId().replace(/:/g, '');
  const [rx, ry] = rotatePair(x, y, degrees);
  const scale = 40;
  const a = { x:160 + x * scale, y:110 - y * scale };
  const b = { x:160 + rx * scale, y:110 - ry * scale };
  const startAngle = Math.atan2(y, x);
  const arcRadius = 36;
  const arcStart = [160 + arcRadius * Math.cos(startAngle), 110 - arcRadius * Math.sin(startAngle)];
  const angle = degrees * Math.PI / 180;
  const arcEnd = [160 + arcRadius * Math.cos(startAngle + angle), 110 - arcRadius * Math.sin(startAngle + angle)];
  const radius = Math.hypot(x, y) * scale * 350 / 220;
  type LabelBox = { left: number; top: number; width: number; height: number; score: number };
  const labelCandidates = (point: { x: number; y: number }, width: number): LabelBox[] => {
    const endpoint = { x:point.x / 320 * 510, y:15 + point.y / 220 * 350 };
    const candidates: LabelBox[] = [];
    for (let index = 0; index < 72; index++) {
      const direction = index * Math.PI / 36;
      const anchorX = 255 + (radius + 8) * Math.cos(direction);
      const anchorY = 190 - (radius + 8) * Math.sin(direction);
      for (const hx of [0, .5, 1]) for (const hy of [0, .5, 1]) {
        const left = anchorX - hx * width, top = anchorY - hy * 40;
        if (left < 0 || top < 0 || left + width > 510 || top + 40 > 380) continue;
        const nearestX = Math.max(left, Math.min(255, left + width));
        const nearestY = Math.max(top, Math.min(190, top + 40));
        if (Math.hypot(nearestX - 255, nearestY - 190) < radius + 7) continue;
        const distance = Math.hypot(Math.max(left, Math.min(endpoint.x, left + width)) - endpoint.x, Math.max(top, Math.min(endpoint.y, top + 40)) - endpoint.y);
        candidates.push({left, top, width, height:40, score:distance + .05 * Math.hypot(left + width / 2 - endpoint.x, top + 20 - endpoint.y)});
      }
    }
    return candidates.sort((first, second) => first.score - second.score);
  };
  const originalOptions = labelCandidates(a, 125), resultOptions = labelCandidates(b, 170);
  let originalBox = originalOptions[0], resultBox = resultOptions[0], bestScore = Infinity;
  for (const oldBox of originalOptions) for (const newBox of resultOptions) {
    if (oldBox.left < newBox.left + newBox.width + 8 && newBox.left < oldBox.left + oldBox.width + 8 && oldBox.top < newBox.top + newBox.height + 8 && newBox.top < oldBox.top + oldBox.height + 8) continue;
    const score = oldBox.score + newBox.score;
    if (score < bestScore) { originalBox = oldBox; resultBox = newBox; bestScore = score; }
  }
  const endpointLabel = (original: boolean): CSSProperties => {
    const box = original ? originalBox : resultBox;
    return { left:box.left, top:box.top, width:box.width, height:box.height };
  };
  return <div className={`drp-rotation-circle ${rotated ? 'is-rotating' : ''}`} style={{ '--drp-turn-angle': `${-degrees}deg` } as CSSProperties} aria-label={`坐标 (${x},${y}) 逆时针旋转${degrees}度，得到 (${numberLabel(rx)},${numberLabel(ry)})`}>
    <svg viewBox="0 0 320 220" aria-hidden="true">
      <defs><marker id={`${marker}-blue`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#3565c8" /></marker><marker id={`${marker}-purple`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#8966b4" /></marker></defs>
      <path className="drp-coordinate-axis" d="M24 110H296 M160 208V12 M288 105L296 110L288 115 M155 20L160 12L165 20" />
      {[-2,-1,1,2].map(t => <path className="drp-coordinate-axis" key={t} d={`M${160+t*scale} 106V114 M156 ${110-t*scale}H164`} />)}
      <circle className="drp-orbit" cx="160" cy="110" r={Math.hypot(x,y)*scale} />
      <line className="drp-original-ray" x1="160" y1="110" x2={a.x} y2={a.y} markerEnd={`url(#${marker}-blue)`} />
      <circle cx={a.x} cy={a.y} r="4" fill="#3565c8" />
      {rotated && <>{degrees > 0 && <path className="drp-angle-arc" d={`M${arcStart[0]} ${arcStart[1]}A${arcRadius} ${arcRadius} 0 ${degrees > 180 ? 1 : 0} 0 ${arcEnd[0]} ${arcEnd[1]}`} />}<g className="drp-turning-ray"><line x1="160" y1="110" x2={a.x} y2={a.y} markerEnd={`url(#${marker}-purple)`} /><circle cx={a.x} cy={a.y} r="4" /></g></>}
    </svg>
    <Typography as="p" variant="bodySmall" style={endpointLabel(true)} className="drp-coordinate-label drp-coordinate-label--old">原 ({x}, {y})</Typography>
    {rotated && <Typography as="p" variant="bodySmall" style={endpointLabel(false)} className="drp-coordinate-label drp-coordinate-label--new">新 ({numberLabel(rx)}, {numberLabel(ry)})</Typography>}
    <Typography as="p" variant="bodySmall" className="drp-axis-x">x</Typography>
    <Typography as="p" variant="bodySmall" className="drp-axis-y">y</Typography>
    <Typography as="p" variant="bodySmall" className="drp-axis-origin">0</Typography>
  </div>;
}
function RopeIntroduction({ phase }: { phase: number }) {
  const selectedRow = Math.max(0, Math.min(7, phase - 1));
  const [x, y] = Q_EXAMPLE[selectedRow];
  const degrees = selectedRow * 30;
  return <main className="drp-numeric-intro" aria-label="逐对取出 Q 的坐标，代入旋转公式，再放回新矩阵">
    <div className="drp-numeric-layout">
      <NumericMatrix output={false} phase={phase} selectedRow={selectedRow} />
      <div className="drp-pair-process" key={phase}>
        <Typography as="p" variant="body" align="center">位置 {selectedRow} · 第 1、2 维</Typography>
        <Typography as="p" variant="h2" align="center"><MathFormulaStatic latex={`\\alpha=p\\,\\theta_i=${selectedRow}\\times30^\\circ=${degrees}^\\circ`} /></Typography>
        <Typography as="p" variant="bodySmall" align="center">p：token 位置　θᵢ：第 i 对坐标的旋转步长</Typography>
        <RotationCircle x={x} y={y} degrees={degrees} rotated={phase > 0} />
      </div>
      <NumericMatrix output phase={phase} selectedRow={selectedRow} />
    </div>
  </main>;
}

type BlockColor = 'q' | 'k' | 'position' | 'latent' | 'merged';

// The diagrams follow the course's row-vector convention. The cell counts show
// relative shapes only; they do not specify the model's actual dimensions.
function MatrixBlock({ latex, label, color, vector = false, short = false, transpose = false, tall = false, compact = false, rotated = false, selectedRow }: { latex: string; label?: string; color: BlockColor; vector?: boolean; short?: boolean; transpose?: boolean; tall?: boolean; compact?: boolean; rotated?: boolean; selectedRow?: number }) {
  const rows = vector ? transpose ? 4 : 1 : tall ? 8 : 4;
  const cols = vector && transpose ? 1 : short ? 4 : 8;
  return <div className={`drp-block drp-block--${color}`}>
    <Typography as="p" variant="h2" align="center"><MathFormulaStatic latex={latex} /></Typography>
    <div className={`drp-block-grid ${vector ? 'is-vector' : ''} ${short ? 'is-short' : ''} ${transpose ? 'is-column' : ''} ${rotated ? 'is-row-rotated' : ''}`} style={{gridTemplateColumns:`repeat(${cols},minmax(0,1fr))`}} aria-hidden="true">
      {Array.from({length: rows * cols}, (_, i) => <span key={i} style={rotated ? {'--drp-row-delay':`${.45 + Math.floor(i / cols) * .04}s`} as CSSProperties : undefined} />)}
      {selectedRow !== undefined && <i className="drp-matrix-row-focus" style={{top:`calc((100% + 3px) * ${selectedRow / rows})`,height:`calc((100% - ${(rows - 1) * 3}px) / ${rows})`}} />}
    </div>
    {label && <Typography as="p" variant={compact ? 'bodySmall' : 'body'} align="center">{label}</Typography>}
  </div>;
}

function AbsorptionConflict({ phase }: { phase: number }) {
  const rope = phase >= 2;
  return <main className="drp-absorption-lesson">
    <div className="drp-absorption-chain">
      <MatrixBlock latex={rope ? 'h_t' : 'H'} label={rope ? '查询 token 的输入行' : '完整输入矩阵'} color="latent" tall={!rope} vector={rope} compact />
      <Typography as="p" variant="h2" align="center">×</Typography>
      <div className={`drp-absorb-zone ${rope ? 'has-rotation' : ''}`}>
        {phase === 1 ? <div className="drp-absorb-merged"><MatrixBlock latex="\widetilde W^Q" label="合并后的固定投影" color="merged" short tall /><Typography as="p" variant="h3" align="center" tone="danger">提前合并一次</Typography></div> : <>
          <MatrixBlock latex="W^Q" label="固定 Q 投影" color="q" tall />
          <Typography as="p" variant="h2" align="center">×</Typography>
          {rope && <><div className="drp-inserted-rotation"><MatrixBlock latex={String.raw`R_tR_j^\top`} color="position" tall compact /><div className="drp-rotation-hint"><svg viewBox="0 0 36 36" aria-hidden="true"><g><path d="M27 11A12 12 0 1 0 30 22 M21 10L28 10L28 3" /></g></svg><Typography as="p" variant="bodySmall">随位置变化</Typography></div></div><Typography as="p" variant="h2" align="center">×</Typography></>}
          <MatrixBlock latex="(W^{UK})^\top" label="固定 K 上投影" color="k" short tall />
        </>}
      </div>
      <Typography as="p" variant="h2" align="center">×</Typography>
      <MatrixBlock latex={rope ? String.raw`(c_j^{KV})^\top` : String.raw`(C^{KV})^\top`} label={rope ? '历史 token 的潜在向量' : '潜在 KV 矩阵的转置'} color="latent" vector={rope} transpose={rope} compact />
    </div>
    {!rope && <><Typography as="p" variant="h2" align="center">{phase === 1 ? '位置 1、2、3……都复用同一个投影' : '红框内都是固定矩阵，可以直接合并'}</Typography>
    <Typography as="p" variant="h3" align="center"><MathFormulaStatic latex={phase === 1 ? String.raw`S=H\,\widetilde W^Q\,(C^{KV})^\top` : String.raw`S=H\,\underbrace{W^Q(W^{UK})^\top}_{\text{固定投影}}\,(C^{KV})^\top`} /></Typography></>}
  </main>;
}

function MatrixRotations() {
  return <div className="drp-matrix-rotations">
    <Typography as="p" variant="h2" align="center">RoPE</Typography>
    {[0, 1].map(p => <div className="drp-row-rotation" key={p}>
      <Typography as="p" variant="bodySmall">位置 {p}</Typography>
      <svg viewBox="0 0 50 50" aria-hidden="true" style={{'--drp-row-angle':`${-p * 30}deg`} as CSSProperties}>
        <circle cx="25" cy="25" r="21" />
        <path className="drp-row-before" d="M25 25H42" />
        <path className="drp-row-after" d="M25 25H42 M37 21L42 25L37 29" />
      </svg>
    </div>)}
    <Typography as="p" variant="bodySmall" align="center">逐行按位置旋转</Typography>
  </div>;
}

function GenerationRow({ kind }: { kind: 'Q' | 'K' }) {
  const q = kind === 'Q';
  // Q's effective position projection combines W^DQ and W^QR in the
  // row-vector convention. Hide this factorization in the teaching diagram.
  return <div className="drp-simple-position-flow" key={kind}>
    <MatrixBlock latex="H" label="输入矩阵 · 8 个 token" color="latent" tall compact />
    <Typography as="p" variant="h2" align="center">×</Typography>
    <MatrixBlock latex={q ? 'W^Q' : 'W^K'} label="维度较小 · 位置分支" color="position" short tall compact />
    <Typography as="p" variant="h2" align="center">＝</Typography>
      <MatrixBlock latex={String.raw`\text{短矩阵}`} label="尚未按位置旋转" color="position" short tall compact />
      <Arrow />
      <MatrixRotations />
      <Arrow />
      <MatrixBlock latex={q ? 'Q^R' : 'K^R'} label={q ? '位置 Q 矩阵' : '位置 K 矩阵'} color="position" short tall compact rotated />
  </div>;
}

function ComponentGeneration({ phase }: { phase: number }) {
  const position = phase >= 2;
  return <main className={`drp-generation drp-simple-generation ${position ? 'has-position-rows' : ''}`}>
    {position ? <div className="drp-content-strip">
      <Typography as="p" variant="h3">内容分量 · 不做 RoPE</Typography>
      <Typography as="p" variant="h2"><MathFormulaStatic latex="Q^C" /></Typography><div className="drp-content-mini drp-content-mini--q" aria-hidden="true">{Array.from({length:64},(_,i)=><span key={i}/>)}</div>
      <Typography as="p" variant="h2"><MathFormulaStatic latex="K^C" /></Typography><div className="drp-content-mini drp-content-mini--k" aria-hidden="true">{Array.from({length:64},(_,i)=><span key={i}/>)}</div>
    </div> : <div className="drp-content-overview">
      <MatrixBlock latex={phase === 0 ? 'Q' : 'Q^C'} label={phase === 0 ? '原来的 Q · 旋转前' : '内容 Q · 不做 RoPE'} color="q" tall />
      <MatrixBlock latex={phase === 0 ? 'K' : 'K^C'} label={phase === 0 ? '原来的 K · 旋转前' : '内容 K · 不做 RoPE'} color="k" tall />
    </div>}
    {position && <GenerationRow kind={phase === 2 ? 'Q' : 'K'} />}
  </main>;
}

function MatchingResult({ normalize }: { normalize: boolean }) {
  return <main className="drp-match-lesson">
    <div className="drp-match-rows">
      <div className="drp-match-row"><MatrixBlock latex="Q^C" label="内容 Q" color="q" tall compact /><Typography as="p" variant="h2" align="center">×</Typography><MatrixBlock latex={String.raw`(K^C)^\top`} label="内容 K 的转置" color="k" tall compact /><Typography as="p" variant="h2" align="center">＝</Typography><MatrixBlock latex="S_C" label="内容匹配分数矩阵" color="q" tall compact /></div>
      <div className="drp-match-row"><MatrixBlock latex="Q^R" label="位置 Q" color="position" short tall compact /><Typography as="p" variant="h2" align="center">×</Typography><MatrixBlock latex={String.raw`(K^R)^\top`} label="位置 K 的转置" color="position" compact /><Typography as="p" variant="h2" align="center">＝</Typography><MatrixBlock latex="S_R" label="位置匹配分数矩阵" color="position" tall compact /></div>
    </div>
    <div className="drp-score-combination"><Typography as="p" variant="h1" align="center"><MathFormulaStatic latex="S=S_C+S_R" /></Typography><Arrow /><Typography as="p" variant="h2" align="center">{normalize ? '缩放 → 遮罩 → Softmax' : '相加，得到分数矩阵'}</Typography></div>
  </main>;
}

function CacheResult() {
  return <main className="drp-cache-result">
    <div className="drp-cache-comparison">
      <div className="drp-cache-item"><MatrixBlock latex="C^{KV}" color="latent" short tall /><Typography as="p" variant="h2" align="center">潜在 KV 矩阵</Typography><Typography as="p" variant="h3" align="center" tone="muted">每行缓存一个 token 的潜在向量</Typography></div>
      <Typography as="p" variant="display" align="center">＋</Typography>
      <div className="drp-cache-item"><MatrixBlock latex="K^R" color="position" short tall /><Typography as="p" variant="h2" align="center">较窄的位置 K 矩阵</Typography><Typography as="p" variant="h3" align="center" tone="muted">已应用 RoPE · 各头共享</Typography></div>
    </div>
    <Typography as="p" variant="h2" align="center">内容保持低维缓存，位置信息也没有丢失</Typography>
  </main>;
}

function RopeLesson({ introduction }: { introduction: boolean }) {
  const [step, setStep] = useState(0);
  const finalStep = 9;
  const contentStep = introduction ? step : step + 10 + (step >= 3 ? 1 : 0);
  const lastClick = useRef(0);
  const lastDirection = useRef<number | null>(null);
  const navigate = (direction: -1 | 1) => {
    const now = Date.now();
    if (lastDirection.current === direction && now - lastClick.current < 1500) return;
    lastClick.current = now;
    lastDirection.current = direction;
    setStep(value => direction === -1 ? Math.max(0, value - 1) : value === finalStep ? 0 : value + 1);
  };
  const state = introduction ? { title: 'RoPE：按 token 位置旋转 Q、K', explanation: '每行一个 token，维度两两配对，按位置旋转。', caption: introCaption(step) } : STATES[step + 2];
  return <section className="drp-slide" aria-label={introduction ? 'RoPE：按位置旋转 Q、K' : '解耦 RoPE：矩阵吸收与内容位置分量'} data-rope-step={step}>
    <header className="drp-header"><Typography as="h1" variant="h1" align="center">{state.title}</Typography>{state.explanation && <Typography as="p" variant="h3" align="center">{state.explanation}</Typography>}</header>
    <div className="drp-stage">{introduction ? <RopeIntroduction phase={step} /> : contentStep < 14 ? <AbsorptionConflict phase={contentStep - 10} /> : contentStep < 18 ? <ComponentGeneration phase={contentStep - 14} /> : contentStep < 20 ? <MatchingResult normalize={contentStep === 19} /> : <CacheResult />}</div>
    <footer className="drp-footer">
      <Button className="drp-back" disabled={step === 0} onClick={event => {event.stopPropagation();navigate(-1);}}>← 播放上一步</Button>
      <Typography as="p" variant="h2" align="center" aria-live="polite">{state.caption}</Typography>
      <Button className="drp-forward" variant="primary" onClick={event => {event.stopPropagation();navigate(1);}}>{step === finalStep ? '重新播放 ↺' : '播放下一步 →'}</Button>
    </footer>
  </section>;
}

export function RopeIntroductionPage() {
  return <RopeLesson introduction />;
}

export function DecoupledRopePage() {
  return <RopeLesson introduction={false} />;
}
