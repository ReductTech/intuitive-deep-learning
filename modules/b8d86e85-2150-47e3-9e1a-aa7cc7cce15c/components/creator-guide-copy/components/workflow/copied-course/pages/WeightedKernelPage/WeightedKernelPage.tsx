import { useState, type CSSProperties } from 'react';
import { ContentBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import './WeightedKernelPage.css';

const KERNEL = [[1, -1], [1, -1]];
const PATTERNS = [
  { id: 'left-bright', label: '左亮右暗', values: [[8, 2], [8, 2]] },
  { id: 'right-bright', label: '左暗右亮', values: [[2, 8], [2, 8]] },
  { id: 'equal', label: '左右相等', values: [[5, 5], [5, 5]] },
] as const;

function Matrix({ values, kind, label }: { values: readonly (readonly number[])[]; kind: 'input' | 'kernel'; label: string }) {
  return <div shuku-edit-id="e-7c8209c2-6c57-43e6-b8e3-684a9897caf4" className={`aipe-replay-cg-copy-ck-weighted__matrix aipe-replay-cg-copy-ck-weighted__matrix--${kind}`} role="img" aria-label={label}>
    {values.flatMap((row, rowIndex) => row.map((value, colIndex) => <div shuku-edit-id="e-9c74377f-e1ee-422d-b3e8-61a7fa1053cb" key={`${rowIndex}-${colIndex}`} className={`aipe-replay-cg-copy-ck-weighted__cell ${kind === 'input' ? value > 5 ? 'is-bright' : value < 5 ? 'is-dark' : 'is-neutral' : value < 0 ? 'is-negative' : 'is-positive'}`}><MathFormulaStatic latex={String(value)} /></div>))}
  </div>;
}

export function WeightedKernelPage() {
  const [patternId, setPatternId] = useState<(typeof PATTERNS)[number]['id']>('left-bright');
  const pattern = PATTERNS.find((item) => item.id === patternId) ?? PATTERNS[0];
  const [[topLeft, topRight], [bottomLeft, bottomRight]] = pattern.values;
  const output = (topLeft - topRight) + (bottomLeft - bottomRight);
  const activeIndex = output < 0 ? 0 : output > 0 ? 2 : 1;
  const interpretation = output < 0 ? '右边比左边更亮。' : output > 0 ? '左边比右边更亮。' : '左右亮度相同。';
  const markerStyle = { left: `${50 + Math.max(-12, Math.min(12, output)) / 12 * 43}%` } as CSSProperties;

  return <ContentBlock shuku-edit-id="e-37564565-1292-4f56-8154-5498703f0277" headingLevel={1} className="aipe-replay-cg-copy-ck-weighted" title="权重决定局部响应" subtitle="每个位置的输入按对应权重参与求和；符号、大小和排列共同决定输出。">
    <div shuku-edit-id="e-54d42f5a-9ee8-4155-9572-ee3c658ff60d" className="aipe-replay-cg-copy-ck-weighted__body">
      <section shuku-edit-id="e-6671281e-0d41-41e3-a77f-1766ca5c66a9" className="aipe-replay-cg-copy-ck-weighted__concepts" aria-label="权重的三个作用">
        <div shuku-edit-id="e-865378c6-a689-42d1-a141-1c22b35711ad" className="aipe-replay-cg-copy-ck-weighted__concept"><span shuku-edit-id="e-42b0b2c9-5f98-41e0-9f9b-5dae0635a0b5" className="aipe-replay-cg-copy-ck-weighted__concept-icon" aria-hidden="true">±</span><div shuku-edit-id="e-bee6ffdf-5830-4f07-88c7-5511bd96ccf5"><Typography shuku-edit-id="e-027f67d1-a2f4-4922-9195-abeca7d70ec5" as="h2" variant="h3" tone="accent">符号</Typography><Typography shuku-edit-id="e-b650409f-a7f5-435b-9232-8c985f4c2706" variant="bodySmall" tone="muted">w &gt; 0 加入，w &lt; 0 减去，w = 0 忽略</Typography></div></div>
        <div shuku-edit-id="e-95b9e502-ae5e-48f2-893b-4b5567348957" className="aipe-replay-cg-copy-ck-weighted__concept"><span shuku-edit-id="e-895d8d90-fe40-4890-83bc-36fca8837154" className="aipe-replay-cg-copy-ck-weighted__concept-icon" aria-hidden="true">▂▅▇</span><div shuku-edit-id="e-b02ceb03-62ce-4279-bcba-b9ae7ced205b"><Typography shuku-edit-id="e-b2d18385-f9d3-48b0-ba11-1a7d770edb02" as="h2" variant="h3" tone="accent">大小</Typography><Typography shuku-edit-id="e-a7cb478a-a5be-41ab-ac10-4f885154d7bb" variant="bodySmall" tone="muted">|w| 越大，影响越强</Typography></div></div>
        <div shuku-edit-id="e-c0d4c354-df8d-49b0-bda1-fd54b12e8773" className="aipe-replay-cg-copy-ck-weighted__concept"><span shuku-edit-id="e-6d924d6d-2357-4ead-a51c-27d1684a0c34" className="aipe-replay-cg-copy-ck-weighted__concept-icon" aria-hidden="true">▦</span><div shuku-edit-id="e-df3a637b-5700-418a-890e-1eec8586a19b"><Typography shuku-edit-id="e-981272c6-5ab1-4a6c-9061-58e5cf444e6e" as="h2" variant="h3" tone="accent">排列</Typography><Typography shuku-edit-id="e-d229e7e2-0ed7-4da2-b4a9-631b452d3c02" variant="bodySmall" tone="muted">决定要比较哪种局部结构</Typography></div></div>
      </section>

      <div shuku-edit-id="e-c4a7b8d1-f237-469a-a22f-1e0cbbb347c4" className="aipe-replay-cg-copy-ck-weighted__flow">
        <section shuku-edit-id="e-04e26a5b-8b56-4e5a-84e7-d375b9a1c443" className="aipe-replay-cg-copy-ck-weighted__panel" aria-label="选择输入区域">
          <header shuku-edit-id="e-7c48c7ca-e3d9-4536-8988-2e53167bce63"><Typography shuku-edit-id="e-1d4ba09e-f883-4139-9856-96056b4e8968" as="h2" variant="h3" tone="accent">输入区域 <MathFormulaStatic latex="x" /></Typography></header>
          <Matrix values={pattern.values} kind="input" label={`输入区域：${pattern.label}`} />
          <Typography shuku-edit-id="e-abce92a6-b0a5-45b5-b864-164d39ac40b9" variant="body" tone="accent">{pattern.label}</Typography>
          <div shuku-edit-id="e-b4390059-7377-4012-86fa-dafb4ebf8b08" className="aipe-replay-cg-copy-ck-weighted__patterns" role="group" aria-label="选择输入明暗模式">
            {PATTERNS.map((item) => <button shuku-edit-id="e-9eff8b1d-5cee-4358-b3cf-8487d6a9dfff" key={item.id} type="button" className={patternId === item.id ? 'is-selected' : ''} aria-pressed={patternId === item.id} onClick={() => setPatternId(item.id)}><Typography shuku-edit-id="e-a0af1335-de96-4c57-9fb4-1ab24e3a32c1" as="span" variant="bodySmall" tone="inherit">{item.label}</Typography></button>)}
          </div>
        </section>
        <span shuku-edit-id="e-5e2684b9-a762-49a4-9c4d-1954f46b79ab" className="aipe-replay-cg-copy-ck-weighted__arrow" aria-hidden="true">→</span>
        <section shuku-edit-id="e-14ad676a-35bb-4e11-94f4-25d457b461f7" className="aipe-replay-cg-copy-ck-weighted__panel aipe-replay-cg-copy-ck-weighted__panel--kernel" aria-label="卷积核及当前比较">
          <header shuku-edit-id="e-029d3afe-b8f6-45ad-98f2-e17bb2b7f387"><Typography shuku-edit-id="e-bed762bf-ea90-4c65-a355-a23a14101766" as="h2" variant="h3" tone="accent">卷积核 <MathFormulaStatic latex="w" /></Typography></header>
          <Matrix values={KERNEL} kind="kernel" label="卷积核：左列为正一，右列为负一" />
          <div shuku-edit-id="e-707231a4-1ba2-4583-abba-4b8bf902f547" className="aipe-replay-cg-copy-ck-weighted__question"><Typography shuku-edit-id="e-134fdc47-cc58-4342-894b-d5b1cd5856c9" variant="body" tone="accent">这个核在比较：左边是否比右边更亮？</Typography></div>
        </section>
        <span shuku-edit-id="e-babe1b58-11ee-47a8-bd54-73b520cc60b0" className="aipe-replay-cg-copy-ck-weighted__arrow" aria-hidden="true">→</span>
        <section shuku-edit-id="e-16497e51-3af7-4ae6-a21a-bcf49ce11eb5" className="aipe-replay-cg-copy-ck-weighted__panel aipe-replay-cg-copy-ck-weighted__panel--response" aria-label="局部响应与符号含义">
          <header shuku-edit-id="e-eeff6ab9-abbb-47de-8b9b-40688f068c7f"><Typography shuku-edit-id="e-2e84b8fc-bf63-468b-ba0b-06efd25db1fe" as="h2" variant="h3" tone="accent">局部响应 <MathFormulaStatic latex="y" /></Typography></header>
          <div shuku-edit-id="e-a914a6c5-4ca5-40bd-b65d-b81438f1aa3c" className={`aipe-replay-cg-copy-ck-weighted__result ${output < 0 ? 'is-negative' : output === 0 ? 'is-zero' : ''}`}><MathFormulaStatic latex={`y=${output > 0 ? '+' : ''}${output}`} /></div>
          <div shuku-edit-id="e-547fcc63-46e6-489c-8a7d-b0cbbadf9c86" className="aipe-replay-cg-copy-ck-weighted__scale" aria-label={`当前局部响应 ${output}`}>
            <div shuku-edit-id="e-7d7e7625-5c5b-4f87-a203-8cdbb94008b0" className="aipe-replay-cg-copy-ck-weighted__scale-bar"><span shuku-edit-id="e-d6844739-a091-48db-9a29-6a00fcfb31fb" className={`aipe-replay-cg-copy-ck-weighted__marker ${output < 0 ? 'is-negative' : output === 0 ? 'is-zero' : ''}`} style={markerStyle}>{output > 0 ? '+' : ''}{output}</span></div>
            <div shuku-edit-id="e-3460b792-d6bc-4217-a748-70bc08b01173" className="aipe-replay-cg-copy-ck-weighted__scale-labels">
              {['右边更亮', '左右相同', '左边更亮'].map((label, index) => <div shuku-edit-id="e-d64c91f4-c123-4249-af34-62843a8de68b" key={label} className={activeIndex === index ? 'is-active' : ''}><MathFormulaStatic latex={index === 0 ? 'y<0' : index === 1 ? 'y=0' : 'y>0'} /><Typography shuku-edit-id="e-987a7697-1223-4d6e-b3e5-59c376d65633" variant="body" tone="inherit">{label}</Typography></div>)}
            </div>
          </div>
          <div shuku-edit-id="e-67b81748-5b1f-4956-95ab-336cf728e879" className="aipe-replay-cg-copy-ck-weighted__reading"><Typography shuku-edit-id="e-98a61452-7c94-43dd-9178-7db2fa6b2da7" variant="body" tone="accent">{interpretation}</Typography></div>
        </section>
      </div>

      <footer shuku-edit-id="e-ae28d2d3-8c6d-4eec-9563-90912a974cbd" className="aipe-replay-cg-copy-ck-weighted__summary"><Typography shuku-edit-id="e-7fc2294e-bf37-4ebf-a215-684b4bcca3d6" variant="h3" tone="accent">这个卷积核回答的问题：左边是否比右边更亮？</Typography></footer>
    </div>
  </ContentBlock>;
}
