import { useId, useRef, useState, type CSSProperties } from 'react';
import { Button, MathFormulaStatic, Typography } from "@shuku/course-style/react";
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
  return <svg shuku-edit-id="e-27723c69-7edf-467a-b8b7-44ac2ccabee7" className="drp-arrow" viewBox="0 0 80 40" aria-hidden="true"><path shuku-edit-id="e-d651a3af-2bae-49fd-aa5b-19ce8ac2aa9c" d="M4 20 H72 M61 9 L72 20 L61 31" /></svg>;
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
  return <div shuku-edit-id="e-2bf5c3ff-a92e-482f-8a21-6cda15df2ab8" className="drp-number-matrix">
    <Typography shuku-edit-id="e-8e8c36ad-f818-4849-b8bf-d20120c07805" as="p" variant="h2" align="center">{output ? '旋转后的 Q' : '原始 Q'}</Typography>
    <Typography shuku-edit-id="e-db4260ee-9677-4d24-ad34-c755f2627a85" as="p" variant="bodySmall" align="center" tone="muted">8 个 token × 8 维</Typography>
    <div shuku-edit-id="e-b1373a83-745b-46c2-bdd9-1e2d62414681" className="drp-number-grid">
      <Typography shuku-edit-id="e-80d9eab2-3fe7-4d30-8a09-ad5cc636a326" as="p" variant="bodySmall" align="center">位置</Typography>
      {Array.from({length: 8}, (_, col) => <Typography shuku-edit-id="e-c07e97c4-a093-4d7e-9528-385b76cf5e82" key={`col${col}`} as="p" variant="bodySmall" align="center" tone="muted">{col + 1}</Typography>)}
      {Q_EXAMPLE.flatMap((row, r) => [
        <Typography shuku-edit-id="e-71f5e0e5-2277-4873-818c-47d8e2bc4f7c" key={`row${r}`} as="p" variant="bodySmall" align="center" className={r === selectedRow ? 'drp-selected-position' : ''}>{r}</Typography>,
        ...row.map((value, col) => {
          const visible = !output || phase === 9 || (r < phase && col < 2);
          const active = r === selectedRow && col < 2;
          const transformed = rotatePair(row[col - col % 2], row[col - col % 2 + 1], r * 30)[col % 2];
          return <div shuku-edit-id="e-51a83689-b4eb-4cb0-b446-0f1cfa28b7e0" key={`${r}-${col}`} className={`drp-number-cell ${r === selectedRow ? 'is-row' : ''} ${active ? 'is-pair' : ''} ${output && visible ? 'is-filled' : ''} ${output && active && phase > 0 && phase < 9 ? 'is-writing' : ''}`}>
            <Typography shuku-edit-id="e-71784120-7a65-46ca-b090-a8c4155b3647" as="p" variant="bodySmall" align="center">{visible ? output ? numberLabel(transformed) : value : '·'}</Typography>
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
  return <div shuku-edit-id="e-42d827a7-e1d3-41d2-a999-ae7a79029fe3" className={`drp-rotation-circle ${rotated ? 'is-rotating' : ''}`} style={{ '--drp-turn-angle': `${-degrees}deg` } as CSSProperties} aria-label={`坐标 (${x},${y}) 逆时针旋转${degrees}度，得到 (${numberLabel(rx)},${numberLabel(ry)})`}>
    <svg shuku-edit-id="e-437c050f-d8ea-4d19-ac54-912d966d2ed4" viewBox="0 0 320 220" aria-hidden="true">
      <defs shuku-edit-id="e-c021df50-ea78-438b-9cd9-b3cfbcfa2a60"><marker shuku-edit-id="e-7138f264-c9d2-4fc9-bce7-518e8a018a59" id={`${marker}-blue`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path shuku-edit-id="e-aef72b92-a5b9-4223-b6dc-335fbf4ecc55" d="M0 0L7 3.5L0 7Z" fill="#3565c8" /></marker><marker shuku-edit-id="e-1a109c68-ba59-4663-9923-0c33873e62a9" id={`${marker}-purple`} markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path shuku-edit-id="e-1fbbe68e-1952-4b7b-a4e5-f0d3ed91422c" d="M0 0L7 3.5L0 7Z" fill="#8966b4" /></marker></defs>
      <path shuku-edit-id="e-e5d00b9e-1bbd-4e76-9f5b-d782c22974d1" className="drp-coordinate-axis" d="M24 110H296 M160 208V12 M288 105L296 110L288 115 M155 20L160 12L165 20" />
      {[-2,-1,1,2].map(t => <path shuku-edit-id="e-8d489f6c-cd3a-4436-aca2-05aa8aabe132" className="drp-coordinate-axis" key={t} d={`M${160+t*scale} 106V114 M156 ${110-t*scale}H164`} />)}
      <circle shuku-edit-id="e-cce8e2a9-fbad-4498-86b5-9d597a35f235" className="drp-orbit" cx="160" cy="110" r={Math.hypot(x,y)*scale} />
      <line shuku-edit-id="e-23a4d0aa-c995-48c6-bc13-5b9966247b4f" className="drp-original-ray" x1="160" y1="110" x2={a.x} y2={a.y} markerEnd={`url(#${marker}-blue)`} />
      <circle shuku-edit-id="e-0f37de11-d162-4654-9162-2b0da8f5a3e5" cx={a.x} cy={a.y} r="4" fill="#3565c8" />
      {rotated && <>{degrees > 0 && <path shuku-edit-id="e-ffe88354-0846-49ba-b6a3-8f63ca4a8898" className="drp-angle-arc" d={`M${arcStart[0]} ${arcStart[1]}A${arcRadius} ${arcRadius} 0 ${degrees > 180 ? 1 : 0} 0 ${arcEnd[0]} ${arcEnd[1]}`} />}<g shuku-edit-id="e-c93c69b3-086a-4b2c-9fdc-244fdcbe033e" className="drp-turning-ray"><line shuku-edit-id="e-f1f67015-e170-4c94-8a30-ededbc721a9c" x1="160" y1="110" x2={a.x} y2={a.y} markerEnd={`url(#${marker}-purple)`} /><circle shuku-edit-id="e-24b20d3a-1a4b-438f-b40a-5e0047512ee4" cx={a.x} cy={a.y} r="4" /></g></>}
    </svg>
    <Typography shuku-edit-id="e-275f2abb-597c-45ac-99ed-e3b9da57287b" as="p" variant="bodySmall" style={endpointLabel(true)} className="drp-coordinate-label drp-coordinate-label--old">原 ({x}, {y})</Typography>
    {rotated && <Typography shuku-edit-id="e-8339a1dd-88e8-4d8b-aee8-732c099915d0" as="p" variant="bodySmall" style={endpointLabel(false)} className="drp-coordinate-label drp-coordinate-label--new">新 ({numberLabel(rx)}, {numberLabel(ry)})</Typography>}
    <Typography shuku-edit-id="e-e8fb22f6-185e-4dff-b7c6-319ff1e7dd9d" as="p" variant="bodySmall" className="drp-axis-x">x</Typography>
    <Typography shuku-edit-id="e-dca8130b-d1e4-469f-9667-75f3a0702543" as="p" variant="bodySmall" className="drp-axis-y">y</Typography>
    <Typography shuku-edit-id="e-29f3dad7-780c-485a-af51-4553a012cc21" as="p" variant="bodySmall" className="drp-axis-origin">0</Typography>
  </div>;
}
function RopeIntroduction({ phase }: { phase: number }) {
  const selectedRow = Math.max(0, Math.min(7, phase - 1));
  const [x, y] = Q_EXAMPLE[selectedRow];
  const degrees = selectedRow * 30;
  return <main shuku-edit-id="e-d57ad014-5118-49ab-986f-f66d62c9bd0b" className="drp-numeric-intro" aria-label="逐对取出 Q 的坐标，代入旋转公式，再放回新矩阵">
    <div shuku-edit-id="e-a4b396ed-a04f-4d8a-812d-44cb95101c30" className="drp-numeric-layout">
      <NumericMatrix output={false} phase={phase} selectedRow={selectedRow} />
      <div shuku-edit-id="e-12cdb48a-2959-452f-9aa2-9d156e794dfa" className="drp-pair-process" key={phase}>
        <Typography shuku-edit-id="e-5b9bc0cd-0678-4002-9859-1a810a9aba93" as="p" variant="body" align="center">位置 {selectedRow} · 第 1、2 维</Typography>
        <Typography shuku-edit-id="e-9ccecbdf-bdc2-4e30-aff9-f1fdee3ade62" as="p" variant="h2" align="center"><MathFormulaStatic latex={`\\alpha=p\\,\\theta_i=${selectedRow}\\times30^\\circ=${degrees}^\\circ`} /></Typography>
        <Typography shuku-edit-id="e-f7de1031-2484-4ddd-bc26-13fa6ed7441a" as="p" variant="bodySmall" align="center">p：token 位置　θᵢ：第 i 对坐标的旋转步长</Typography>
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
  return <div shuku-edit-id="e-bfca81d4-74bc-4cd8-81ac-34493c4baffd" className={`drp-block drp-block--${color}`}>
    <Typography shuku-edit-id="e-3262f6fe-362e-4f37-a526-57570e1d98db" as="p" variant="h2" align="center"><MathFormulaStatic latex={latex} /></Typography>
    <div shuku-edit-id="e-af6c4864-49a6-4cb5-87f3-e58872e1e749" className={`drp-block-grid ${vector ? 'is-vector' : ''} ${short ? 'is-short' : ''} ${transpose ? 'is-column' : ''} ${rotated ? 'is-row-rotated' : ''}`} style={{gridTemplateColumns:`repeat(${cols},minmax(0,1fr))`}} aria-hidden="true">
      {Array.from({length: rows * cols}, (_, i) => <span shuku-edit-id="e-8e3f8688-ef79-4dbe-b002-0abf1b280fa9" key={i} style={rotated ? {'--drp-row-delay':`${.45 + Math.floor(i / cols) * .04}s`} as CSSProperties : undefined} />)}
      {selectedRow !== undefined && <i shuku-edit-id="e-ba5256f2-d0a9-4b67-be66-5d92b4fa8835" className="drp-matrix-row-focus" style={{top:`calc((100% + 3px) * ${selectedRow / rows})`,height:`calc((100% - ${(rows - 1) * 3}px) / ${rows})`}} />}
    </div>
    {label && <Typography shuku-edit-id="e-31359c9b-74d1-46cd-90a5-2fb9e2d4f34a" as="p" variant={compact ? 'bodySmall' : 'body'} align="center">{label}</Typography>}
  </div>;
}

function AbsorptionConflict({ phase }: { phase: number }) {
  const rope = phase >= 2;
  return <main shuku-edit-id="e-2817b2cf-0547-417d-9bf3-4ab01e781c36" className="drp-absorption-lesson">
    <div shuku-edit-id="e-d7a440e4-c1b8-4e5f-a973-20de4ae906b1" className="drp-absorption-chain">
      <MatrixBlock latex={rope ? 'h_t' : 'H'} label={rope ? '查询 token 的输入行' : '完整输入矩阵'} color="latent" tall={!rope} vector={rope} compact />
      <Typography shuku-edit-id="e-fe4f8a38-61ed-47f1-a783-a90a0bcded95" as="p" variant="h2" align="center">×</Typography>
      <div shuku-edit-id="e-0ecdb5b5-7e1d-405e-8058-ff6cf3a3fa3a" className={`drp-absorb-zone ${rope ? 'has-rotation' : ''}`}>
        {phase === 1 ? <div shuku-edit-id="e-dbebd230-707f-4c04-a8ad-5cd693dddf77" className="drp-absorb-merged"><MatrixBlock latex="\widetilde W^Q" label="合并后的固定投影" color="merged" short tall /><Typography shuku-edit-id="e-54e5e15d-2939-4adb-bf97-07051515bdbe" as="p" variant="h3" align="center" tone="danger">提前合并一次</Typography></div> : <>
          <MatrixBlock latex="W^Q" label="固定 Q 投影" color="q" tall />
          <Typography shuku-edit-id="e-16e00443-fdc7-43e0-a45a-31dc3dbdeac9" as="p" variant="h2" align="center">×</Typography>
          {rope && <><div shuku-edit-id="e-fdc54528-0029-4c85-8327-1c5688ae37d9" className="drp-inserted-rotation"><MatrixBlock latex={String.raw`R_tR_j^\top`} color="position" tall compact /><div shuku-edit-id="e-a8c6319f-d7d1-4cca-9b47-74d26e4b75fb" className="drp-rotation-hint"><svg shuku-edit-id="e-80ab6f89-4d72-47ca-b686-5ecf18506c45" viewBox="0 0 36 36" aria-hidden="true"><g shuku-edit-id="e-6371a9af-0131-453c-bbda-9dd5620329fa"><path shuku-edit-id="e-6187235e-f339-48de-bc88-bd6a27fe43b7" d="M27 11A12 12 0 1 0 30 22 M21 10L28 10L28 3" /></g></svg><Typography shuku-edit-id="e-163e7594-727c-4d5b-82ae-12277e740091" as="p" variant="bodySmall">随位置变化</Typography></div></div><Typography shuku-edit-id="e-d3aa5fb0-7778-457c-801e-042208c74bed" as="p" variant="h2" align="center">×</Typography></>}
          <MatrixBlock latex="(W^{UK})^\top" label="固定 K 上投影" color="k" short tall />
        </>}
      </div>
      <Typography shuku-edit-id="e-44e2997b-7b80-483c-8233-379864aba720" as="p" variant="h2" align="center">×</Typography>
      <MatrixBlock latex={rope ? String.raw`(c_j^{KV})^\top` : String.raw`(C^{KV})^\top`} label={rope ? '历史 token 的潜在向量' : '潜在 KV 矩阵的转置'} color="latent" vector={rope} transpose={rope} compact />
    </div>
    {!rope && <><Typography shuku-edit-id="e-fa4c2d66-53a7-42d0-9b2b-b564614caef0" as="p" variant="h2" align="center">{phase === 1 ? '位置 1、2、3……都复用同一个投影' : '红框内都是固定矩阵，可以直接合并'}</Typography>
    <Typography shuku-edit-id="e-41abd908-de92-4b76-b01a-ad7c5b58efed" as="p" variant="h3" align="center"><MathFormulaStatic latex={phase === 1 ? String.raw`S=H\,\widetilde W^Q\,(C^{KV})^\top` : String.raw`S=H\,\underbrace{W^Q(W^{UK})^\top}_{\text{固定投影}}\,(C^{KV})^\top`} /></Typography></>}
  </main>;
}

function MatrixRotations() {
  return <div shuku-edit-id="e-c015d001-1a76-4f27-aab2-3f4e886eaa35" className="drp-matrix-rotations">
    <Typography shuku-edit-id="e-bb138931-a617-47c4-b36a-7cbbeb6bf943" as="p" variant="h2" align="center">RoPE</Typography>
    {[0, 1].map(p => <div shuku-edit-id="e-6a440dfd-b334-48de-8ce4-3f76f883876a" className="drp-row-rotation" key={p}>
      <Typography shuku-edit-id="e-1182bc99-245f-4d63-b3af-4591f7e068a1" as="p" variant="bodySmall">位置 {p}</Typography>
      <svg shuku-edit-id="e-e6c2297e-33cc-483c-a14c-a7e6be0857db" viewBox="0 0 50 50" aria-hidden="true" style={{'--drp-row-angle':`${-p * 30}deg`} as CSSProperties}>
        <circle shuku-edit-id="e-7cf1d03e-1641-47d1-ac77-11bd3b1bb851" cx="25" cy="25" r="21" />
        <path shuku-edit-id="e-5096c073-a2f5-456b-bf7f-b2a482fcaecd" className="drp-row-before" d="M25 25H42" />
        <path shuku-edit-id="e-318d04f5-6b5a-4911-8905-4f8bddc8b9d5" className="drp-row-after" d="M25 25H42 M37 21L42 25L37 29" />
      </svg>
    </div>)}
    <Typography shuku-edit-id="e-f4732244-42ae-44f8-a39e-817d5147fc98" as="p" variant="bodySmall" align="center">逐行按位置旋转</Typography>
  </div>;
}

function GenerationRow({ kind }: { kind: 'Q' | 'K' }) {
  const q = kind === 'Q';
  // Q's effective position projection combines W^DQ and W^QR in the
  // row-vector convention. Hide this factorization in the teaching diagram.
  return <div shuku-edit-id="e-9ea2dcdb-3e8a-4f6f-b48a-3bedfb2b7046" className="drp-simple-position-flow" key={kind}>
    <MatrixBlock latex="H" label="输入矩阵 · 8 个 token" color="latent" tall compact />
    <Typography shuku-edit-id="e-06eb6934-6340-4109-9e46-88b04f456e65" as="p" variant="h2" align="center">×</Typography>
    <MatrixBlock latex={q ? 'W^Q' : 'W^K'} label="维度较小 · 位置分支" color="position" short tall compact />
    <Typography shuku-edit-id="e-dc858968-8246-407a-a623-2f1b6217ef1e" as="p" variant="h2" align="center">＝</Typography>
      <MatrixBlock latex={String.raw`\text{短矩阵}`} label="尚未按位置旋转" color="position" short tall compact />
      <Arrow />
      <MatrixRotations />
      <Arrow />
      <MatrixBlock latex={q ? 'Q^R' : 'K^R'} label={q ? '位置 Q 矩阵' : '位置 K 矩阵'} color="position" short tall compact rotated />
  </div>;
}

function ComponentGeneration({ phase }: { phase: number }) {
  const position = phase >= 2;
  return <main shuku-edit-id="e-c0bb856f-c2d9-4cf6-949b-85705a7f5063" className={`drp-generation drp-simple-generation ${position ? 'has-position-rows' : ''}`}>
    {position ? <div shuku-edit-id="e-31a3bb43-d485-41e6-b9d6-02d805d0fadd" className="drp-content-strip">
      <Typography shuku-edit-id="e-bb850ebb-ce5a-4227-8a12-1ab8e9695a2e" as="p" variant="h3">内容分量 · 不做 RoPE</Typography>
      <Typography shuku-edit-id="e-438de81a-6e48-4678-980b-d08fd9b5c343" as="p" variant="h2"><MathFormulaStatic latex="Q^C" /></Typography><div shuku-edit-id="e-36e9ceff-8c52-411f-8662-8d967693e927" className="drp-content-mini drp-content-mini--q" aria-hidden="true">{Array.from({length:64},(_,i)=><span shuku-edit-id="e-4a49d364-50b0-4d02-8143-b043e175a17a" key={i}/>)}</div>
      <Typography shuku-edit-id="e-cf6335ff-a4b2-4819-a5c8-38099033a69f" as="p" variant="h2"><MathFormulaStatic latex="K^C" /></Typography><div shuku-edit-id="e-fea275b9-e290-42e7-8328-6076373d12ff" className="drp-content-mini drp-content-mini--k" aria-hidden="true">{Array.from({length:64},(_,i)=><span shuku-edit-id="e-7cb5baa4-fa08-43cd-9fff-07f7b6c73374" key={i}/>)}</div>
    </div> : <div shuku-edit-id="e-b6429b6f-3342-4794-b717-f7b28ed91e8c" className="drp-content-overview">
      <MatrixBlock latex={phase === 0 ? 'Q' : 'Q^C'} label={phase === 0 ? '原来的 Q · 旋转前' : '内容 Q · 不做 RoPE'} color="q" tall />
      <MatrixBlock latex={phase === 0 ? 'K' : 'K^C'} label={phase === 0 ? '原来的 K · 旋转前' : '内容 K · 不做 RoPE'} color="k" tall />
    </div>}
    {position && <GenerationRow kind={phase === 2 ? 'Q' : 'K'} />}
  </main>;
}

function MatchingResult({ normalize }: { normalize: boolean }) {
  return <main shuku-edit-id="e-1180a857-3cfc-442d-85dd-e6aec3883695" className="drp-match-lesson">
    <div shuku-edit-id="e-25fc6c71-a274-40b5-9a7c-024f9df55849" className="drp-match-rows">
      <div shuku-edit-id="e-10f070cd-fcc8-413f-a730-4aeb44796306" className="drp-match-row"><MatrixBlock latex="Q^C" label="内容 Q" color="q" tall compact /><Typography shuku-edit-id="e-fa5c51cc-5601-4449-935e-91a6ac72a38f" as="p" variant="h2" align="center">×</Typography><MatrixBlock latex={String.raw`(K^C)^\top`} label="内容 K 的转置" color="k" tall compact /><Typography shuku-edit-id="e-f0afe432-3735-4d22-94b2-fe1cbcca7aa9" as="p" variant="h2" align="center">＝</Typography><MatrixBlock latex="S_C" label="内容匹配分数矩阵" color="q" tall compact /></div>
      <div shuku-edit-id="e-1a600db2-d580-41ec-af79-871b88300e7a" className="drp-match-row"><MatrixBlock latex="Q^R" label="位置 Q" color="position" short tall compact /><Typography shuku-edit-id="e-2b8adf50-b10a-4194-8db6-6d277e3995b6" as="p" variant="h2" align="center">×</Typography><MatrixBlock latex={String.raw`(K^R)^\top`} label="位置 K 的转置" color="position" compact /><Typography shuku-edit-id="e-f9d149a5-761f-4aeb-97f5-337a922d51e1" as="p" variant="h2" align="center">＝</Typography><MatrixBlock latex="S_R" label="位置匹配分数矩阵" color="position" tall compact /></div>
    </div>
    <div shuku-edit-id="e-f7ca9157-1a76-48ac-856e-7ebc4900201d" className="drp-score-combination"><Typography shuku-edit-id="e-3a7db9d2-4470-4790-a4f0-b22c5930eb9f" as="p" variant="h1" align="center"><MathFormulaStatic latex="S=S_C+S_R" /></Typography><Arrow /><Typography shuku-edit-id="e-befba83e-e74f-434e-8a3d-62f2105cd9ad" as="p" variant="h2" align="center">{normalize ? '缩放 → 遮罩 → Softmax' : '相加，得到分数矩阵'}</Typography></div>
  </main>;
}

function CacheResult() {
  return <main shuku-edit-id="e-911b778a-8e72-4e5f-a8e2-14affa3028da" className="drp-cache-result">
    <div shuku-edit-id="e-7cdcbfb6-3d2c-4e1e-83c4-46462c350e65" className="drp-cache-comparison">
      <div shuku-edit-id="e-31f48d25-6c60-4501-b238-f86b39908801" className="drp-cache-item"><MatrixBlock latex="C^{KV}" color="latent" short tall /><Typography shuku-edit-id="e-df8a0eeb-9c4d-4fc2-a927-7e5dbf44e5c5" as="p" variant="h2" align="center">潜在 KV 矩阵</Typography><Typography shuku-edit-id="e-26a712bb-a513-4f4b-8292-fc753d8f7029" as="p" variant="h3" align="center" tone="muted">每行缓存一个 token 的潜在向量</Typography></div>
      <Typography shuku-edit-id="e-5b97884a-2f1c-4e9e-a92b-9a2c5e225b2e" as="p" variant="display" align="center">＋</Typography>
      <div shuku-edit-id="e-eb19b808-625b-4aac-8528-65187df06910" className="drp-cache-item"><MatrixBlock latex="K^R" color="position" short tall /><Typography shuku-edit-id="e-f2af938d-095b-4992-8daa-910503c8681f" as="p" variant="h2" align="center">较窄的位置 K 矩阵</Typography><Typography shuku-edit-id="e-ba6623d6-b31a-42f6-957c-0222254dc42e" as="p" variant="h3" align="center" tone="muted">已应用 RoPE · 各头共享</Typography></div>
    </div>
    <Typography shuku-edit-id="e-10420451-bd44-481e-950d-e6ee581663d3" as="p" variant="h2" align="center">内容保持低维缓存，位置信息也没有丢失</Typography>
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
  return <section shuku-edit-id="e-d50ba13a-5c30-40c2-aad5-279fbb82891b" className="drp-slide" aria-label={introduction ? 'RoPE：按位置旋转 Q、K' : '解耦 RoPE：矩阵吸收与内容位置分量'} data-rope-step={step}>
    <header shuku-edit-id="e-19fc8648-cbcc-4d73-9fd5-5a2c421c5e3f" className="drp-header"><Typography shuku-edit-id="e-c081ecce-8618-40da-ae34-dea0f40389a3" as="h1" variant="h1" align="center">{state.title}</Typography>{state.explanation && <Typography shuku-edit-id="e-bd044f04-fe98-4102-8bc1-8cfbd23be4c3" as="p" variant="h3" align="center">{state.explanation}</Typography>}</header>
    <div shuku-edit-id="e-d56b85df-a2ae-4525-9dce-696c2c4513d9" className="drp-stage">{introduction ? <RopeIntroduction phase={step} /> : contentStep < 14 ? <AbsorptionConflict phase={contentStep - 10} /> : contentStep < 18 ? <ComponentGeneration phase={contentStep - 14} /> : contentStep < 20 ? <MatchingResult normalize={contentStep === 19} /> : <CacheResult />}</div>
    <footer shuku-edit-id="e-3411a5a9-19b6-487f-aa29-084589b232eb" className="drp-footer">
      <Button className="drp-back" disabled={step === 0} onClick={event => {event.stopPropagation();navigate(-1);}}>← 播放上一步</Button>
      <Typography shuku-edit-id="e-6aa2554d-3271-4775-8413-c5812ba6a0d6" as="p" variant="h2" align="center" aria-live="polite">{state.caption}</Typography>
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
