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
  return <div shuku-edit-id="e-3c9ddb06-8dee-4f03-a5b1-0350ac868103" className={`cg-copy-ck-weighted__matrix cg-copy-ck-weighted__matrix--${kind}`} role="img" aria-label={label}>
    {values.flatMap((row, rowIndex) => row.map((value, colIndex) => <div shuku-edit-id="e-9160fb85-a3ab-4308-85bd-5c94dc2d2d51" key={`${rowIndex}-${colIndex}`} className={`cg-copy-ck-weighted__cell ${kind === 'input' ? value > 5 ? 'is-bright' : value < 5 ? 'is-dark' : 'is-neutral' : value < 0 ? 'is-negative' : 'is-positive'}`}><MathFormulaStatic latex={String(value)} /></div>))}
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

  return <ContentBlock shuku-edit-id="e-9cb3e9e4-4cfd-4495-a047-d4aa8fe75058" headingLevel={1} className="cg-copy-ck-weighted" title="权重决定局部响应" subtitle="每个位置的输入按对应权重参与求和；符号、大小和排列共同决定输出。">
    <div shuku-edit-id="e-37159618-d969-440d-9b51-c214202c1713" className="cg-copy-ck-weighted__body">
      <section shuku-edit-id="e-2d484510-aa10-4efb-9a88-d556ee6ab59b" className="cg-copy-ck-weighted__concepts" aria-label="权重的三个作用">
        <div shuku-edit-id="e-9fe814e6-9cd8-4983-8c7d-464970cb159e" className="cg-copy-ck-weighted__concept"><span shuku-edit-id="e-56a17f60-4a0a-40da-aa5c-ad899fe2584a" className="cg-copy-ck-weighted__concept-icon" aria-hidden="true">±</span><div shuku-edit-id="e-401f34c6-c14a-4830-a8d0-20dff86ba949"><Typography shuku-edit-id="e-b83398f6-80cd-49a5-a763-fb872c0baa4c" as="h2" variant="h3" tone="accent">符号</Typography><Typography shuku-edit-id="e-d0781937-08a3-401e-baf9-cbb6acd70979" variant="bodySmall" tone="muted">w &gt; 0 加入，w &lt; 0 减去，w = 0 忽略</Typography></div></div>
        <div shuku-edit-id="e-f8d291fd-a62e-421e-84b9-025f648e1a75" className="cg-copy-ck-weighted__concept"><span shuku-edit-id="e-8585c768-3811-48a1-97c4-48207fa4df58" className="cg-copy-ck-weighted__concept-icon" aria-hidden="true">▂▅▇</span><div shuku-edit-id="e-76cfa266-075d-4666-a227-54ac77bf222b"><Typography shuku-edit-id="e-a398faec-c09e-454f-9586-0a55102afdf3" as="h2" variant="h3" tone="accent">大小</Typography><Typography shuku-edit-id="e-8e163fc9-9a0a-4a45-b753-a3f3c93f25b0" variant="bodySmall" tone="muted">|w| 越大，影响越强</Typography></div></div>
        <div shuku-edit-id="e-1874770d-385f-4850-85d8-10dd42eab6b7" className="cg-copy-ck-weighted__concept"><span shuku-edit-id="e-4ab6406d-8422-4904-8d01-dc153e2fc1c1" className="cg-copy-ck-weighted__concept-icon" aria-hidden="true">▦</span><div shuku-edit-id="e-37e76fe4-4a4f-43b8-bcef-99821b74fe16"><Typography shuku-edit-id="e-013bdecc-04a5-4647-9601-b5125014f562" as="h2" variant="h3" tone="accent">排列</Typography><Typography shuku-edit-id="e-90ceb4dc-7615-449e-8ffb-980c47b99547" variant="bodySmall" tone="muted">决定要比较哪种局部结构</Typography></div></div>
      </section>

      <div shuku-edit-id="e-5f6e33f7-32b6-4667-ba14-a0124b265a7f" className="cg-copy-ck-weighted__flow">
        <section shuku-edit-id="e-9051f5f7-9399-4145-97e0-b4573ff79b1b" className="cg-copy-ck-weighted__panel" aria-label="选择输入区域">
          <header shuku-edit-id="e-390517ea-160f-4d35-9c9b-d6c07e4c0c78"><Typography shuku-edit-id="e-e4f6b068-9218-4909-8565-a1d8db9a1ee3" as="h2" variant="h3" tone="accent">输入区域 <MathFormulaStatic latex="x" /></Typography></header>
          <Matrix values={pattern.values} kind="input" label={`输入区域：${pattern.label}`} />
          <Typography shuku-edit-id="e-b4d8ba06-0f1b-40c5-a3a0-22cb00cc648d" variant="body" tone="accent">{pattern.label}</Typography>
          <div shuku-edit-id="e-608c9e3e-cfd6-4017-825c-39d71f956a64" className="cg-copy-ck-weighted__patterns" role="group" aria-label="选择输入明暗模式">
            {PATTERNS.map((item) => <button shuku-edit-id="e-72dcf596-6188-402b-9958-8f3a3c0d1143" key={item.id} type="button" className={patternId === item.id ? 'is-selected' : ''} aria-pressed={patternId === item.id} onClick={() => setPatternId(item.id)}><Typography shuku-edit-id="e-6c463a5d-f7d4-47cf-b9f1-5818f28fa92e" as="span" variant="bodySmall" tone="inherit">{item.label}</Typography></button>)}
          </div>
        </section>
        <span shuku-edit-id="e-36fd0779-cf06-4013-a5b7-bc176e2dfec4" className="cg-copy-ck-weighted__arrow" aria-hidden="true">→</span>
        <section shuku-edit-id="e-a8e20158-be28-4b0c-a1f5-2ca84a13e93f" className="cg-copy-ck-weighted__panel cg-copy-ck-weighted__panel--kernel" aria-label="卷积核及当前比较">
          <header shuku-edit-id="e-5436f764-37d3-4ac0-8aa0-936ecd6c86ae"><Typography shuku-edit-id="e-ca4323dd-69de-4e94-9a8a-8e41078c71c0" as="h2" variant="h3" tone="accent">卷积核 <MathFormulaStatic latex="w" /></Typography></header>
          <Matrix values={KERNEL} kind="kernel" label="卷积核：左列为正一，右列为负一" />
          <div shuku-edit-id="e-ace3fe61-9070-4926-befc-ea72707bb9eb" className="cg-copy-ck-weighted__question"><Typography shuku-edit-id="e-c34b940e-6689-4866-b65f-b6542bab51f2" variant="body" tone="accent">这个核在比较：左边是否比右边更亮？</Typography></div>
        </section>
        <span shuku-edit-id="e-694b3bdb-eb7c-4dfc-812f-fa6e780aa23a" className="cg-copy-ck-weighted__arrow" aria-hidden="true">→</span>
        <section shuku-edit-id="e-2e6c84c4-ebc2-4c47-8a70-f1205520841c" className="cg-copy-ck-weighted__panel cg-copy-ck-weighted__panel--response" aria-label="局部响应与符号含义">
          <header shuku-edit-id="e-813bb50a-fe3a-45e3-ac61-84c29934c10e"><Typography shuku-edit-id="e-4955871e-5744-4c12-8423-d7898862654f" as="h2" variant="h3" tone="accent">局部响应 <MathFormulaStatic latex="y" /></Typography></header>
          <div shuku-edit-id="e-87eb56d9-a066-4020-b3ce-8267a83b9604" className={`cg-copy-ck-weighted__result ${output < 0 ? 'is-negative' : output === 0 ? 'is-zero' : ''}`}><MathFormulaStatic latex={`y=${output > 0 ? '+' : ''}${output}`} /></div>
          <div shuku-edit-id="e-8c2316e6-b3c2-4905-8ef5-bf53ee4384c1" className="cg-copy-ck-weighted__scale" aria-label={`当前局部响应 ${output}`}>
            <div shuku-edit-id="e-9c54b365-4fc3-40f4-9a2b-0c5a64cd751b" className="cg-copy-ck-weighted__scale-bar"><span shuku-edit-id="e-4c81eebf-0e79-48ab-bc2d-9a45748f83e3" className={`cg-copy-ck-weighted__marker ${output < 0 ? 'is-negative' : output === 0 ? 'is-zero' : ''}`} style={markerStyle}>{output > 0 ? '+' : ''}{output}</span></div>
            <div shuku-edit-id="e-4201beb0-db63-4d46-abe8-325673c83b92" className="cg-copy-ck-weighted__scale-labels">
              {['右边更亮', '左右相同', '左边更亮'].map((label, index) => <div shuku-edit-id="e-639114ba-4673-4dec-8d16-6f2dd9b0682c" key={label} className={activeIndex === index ? 'is-active' : ''}><MathFormulaStatic latex={index === 0 ? 'y<0' : index === 1 ? 'y=0' : 'y>0'} /><Typography shuku-edit-id="e-6fdaa88d-cadc-49e4-8656-23f8442bc5ca" variant="body" tone="inherit">{label}</Typography></div>)}
            </div>
          </div>
          <div shuku-edit-id="e-e98270fb-c071-478d-ac09-6c8dd7e2e9a4" className="cg-copy-ck-weighted__reading"><Typography shuku-edit-id="e-bc24ad2c-b3e5-4e71-87a5-9a177b521404" variant="body" tone="accent">{interpretation}</Typography></div>
        </section>
      </div>

      <footer shuku-edit-id="e-467c3b4f-0b27-48c8-b235-80c15c3b95a6" className="cg-copy-ck-weighted__summary"><Typography shuku-edit-id="e-477e2fed-980e-489a-92d6-16653f9d9f78" variant="h3" tone="accent">这个卷积核回答的问题：左边是否比右边更亮？</Typography></footer>
    </div>
  </ContentBlock>;
}
