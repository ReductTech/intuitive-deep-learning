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
  return <div shuku-edit-id="e-4ad9555f-a589-4a47-bf44-993f463c1dc9" className={`aipe-replay-cg-copy-ck-weighted__matrix aipe-replay-cg-copy-ck-weighted__matrix--${kind}`} role="img" aria-label={label}>
    {values.flatMap((row, rowIndex) => row.map((value, colIndex) => <div shuku-edit-id="e-c6bc08f4-351d-4395-8661-f73de1366a2a" key={`${rowIndex}-${colIndex}`} className={`aipe-replay-cg-copy-ck-weighted__cell ${kind === 'input' ? value > 5 ? 'is-bright' : value < 5 ? 'is-dark' : 'is-neutral' : value < 0 ? 'is-negative' : 'is-positive'}`}><MathFormulaStatic latex={String(value)} /></div>))}
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

  return <ContentBlock shuku-edit-id="e-8b8826ca-c23a-4f1a-860a-6bcf3d47488b" headingLevel={1} className="aipe-replay-cg-copy-ck-weighted" title="权重决定局部响应" subtitle="每个位置的输入按对应权重参与求和；符号、大小和排列共同决定输出。">
    <div shuku-edit-id="e-7d3da2d2-b953-4f18-9e70-9f652cfb1110" className="aipe-replay-cg-copy-ck-weighted__body">
      <section shuku-edit-id="e-22bf3f0c-fa76-4b73-99c0-881dd90360c5" className="aipe-replay-cg-copy-ck-weighted__concepts" aria-label="权重的三个作用">
        <div shuku-edit-id="e-16d27780-92d8-4868-93b8-ca99805bffed" className="aipe-replay-cg-copy-ck-weighted__concept"><span shuku-edit-id="e-56dea0dd-da9d-499b-9577-6d0a865e9668" className="aipe-replay-cg-copy-ck-weighted__concept-icon" aria-hidden="true">±</span><div shuku-edit-id="e-53ed0785-bc86-4941-a447-2d78ec2e4bea"><Typography shuku-edit-id="e-5351b2d1-f2bc-4876-bc76-ca4e25994f0e" as="h2" variant="h3" tone="accent">符号</Typography><Typography shuku-edit-id="e-5de7fad2-8490-4a58-8da1-937be72ac1dc" variant="bodySmall" tone="muted">w &gt; 0 加入，w &lt; 0 减去，w = 0 忽略</Typography></div></div>
        <div shuku-edit-id="e-dc916fef-7a13-405d-8a3f-1f31e234a47e" className="aipe-replay-cg-copy-ck-weighted__concept"><span shuku-edit-id="e-87f5950a-e552-4746-a7a1-fee660595c86" className="aipe-replay-cg-copy-ck-weighted__concept-icon" aria-hidden="true">▂▅▇</span><div shuku-edit-id="e-4f9342e2-0ebd-46e4-9a3d-5caabfba2610"><Typography shuku-edit-id="e-835775dc-d719-4248-822a-7b16e34a5bda" as="h2" variant="h3" tone="accent">大小</Typography><Typography shuku-edit-id="e-814b84f0-9454-4314-be19-7ffcbcc24d5e" variant="bodySmall" tone="muted">|w| 越大，影响越强</Typography></div></div>
        <div shuku-edit-id="e-d768cbf2-fd42-4c8f-90fb-658a1392b098" className="aipe-replay-cg-copy-ck-weighted__concept"><span shuku-edit-id="e-3f9d3fca-1a23-41c6-a75e-82808111124d" className="aipe-replay-cg-copy-ck-weighted__concept-icon" aria-hidden="true">▦</span><div shuku-edit-id="e-7f64b757-d6a8-4e35-9b3c-7024940dac93"><Typography shuku-edit-id="e-740dfbfb-dabe-4ac9-811f-f654106038a8" as="h2" variant="h3" tone="accent">排列</Typography><Typography shuku-edit-id="e-7f149e5c-22e6-4b8f-954c-df13fd040951" variant="bodySmall" tone="muted">决定要比较哪种局部结构</Typography></div></div>
      </section>

      <div shuku-edit-id="e-63dd0c99-8f46-433b-89b9-5a6cd3964c3e" className="aipe-replay-cg-copy-ck-weighted__flow">
        <section shuku-edit-id="e-143cfea9-b525-40ab-b8a3-9013c6ff2b96" className="aipe-replay-cg-copy-ck-weighted__panel" aria-label="选择输入区域">
          <header shuku-edit-id="e-beaf144a-41e6-4eeb-b09d-07f567cd4150"><Typography shuku-edit-id="e-e7a50b1d-8cd2-4382-8de6-3748805583db" as="h2" variant="h3" tone="accent">输入区域 <MathFormulaStatic latex="x" /></Typography></header>
          <Matrix values={pattern.values} kind="input" label={`输入区域：${pattern.label}`} />
          <Typography shuku-edit-id="e-818f2789-2bde-4b40-84de-985563b1e815" variant="body" tone="accent">{pattern.label}</Typography>
          <div shuku-edit-id="e-491fbdd5-0218-4de0-80fc-a640e6aa2b60" className="aipe-replay-cg-copy-ck-weighted__patterns" role="group" aria-label="选择输入明暗模式">
            {PATTERNS.map((item) => <button shuku-edit-id="e-23333c49-9e1d-47e1-9ffc-4e0ffad62ea0" key={item.id} type="button" className={patternId === item.id ? 'is-selected' : ''} aria-pressed={patternId === item.id} onClick={() => setPatternId(item.id)}><Typography shuku-edit-id="e-60f829d2-f60f-41d7-839b-a3dd2f720eb4" as="span" variant="bodySmall" tone="inherit">{item.label}</Typography></button>)}
          </div>
        </section>
        <span shuku-edit-id="e-947c8506-7bc8-4a8b-be96-19d82c0db6f4" className="aipe-replay-cg-copy-ck-weighted__arrow" aria-hidden="true">→</span>
        <section shuku-edit-id="e-8068ab79-4527-4f6a-9449-3e07d3409f25" className="aipe-replay-cg-copy-ck-weighted__panel aipe-replay-cg-copy-ck-weighted__panel--kernel" aria-label="卷积核及当前比较">
          <header shuku-edit-id="e-9805c090-13c3-4b5b-ab15-65ae7409afb1"><Typography shuku-edit-id="e-37896335-9890-40b0-98e3-0fb43ee16135" as="h2" variant="h3" tone="accent">卷积核 <MathFormulaStatic latex="w" /></Typography></header>
          <Matrix values={KERNEL} kind="kernel" label="卷积核：左列为正一，右列为负一" />
          <div shuku-edit-id="e-1ed1e58a-e900-48ae-b664-15564be41ef4" className="aipe-replay-cg-copy-ck-weighted__question"><Typography shuku-edit-id="e-0892e7c1-d212-492e-b05f-7c5122becd0f" variant="body" tone="accent">这个核在比较：左边是否比右边更亮？</Typography></div>
        </section>
        <span shuku-edit-id="e-6afd335a-eb39-4323-ad4c-66ede8c6eb4e" className="aipe-replay-cg-copy-ck-weighted__arrow" aria-hidden="true">→</span>
        <section shuku-edit-id="e-bc699a2e-12fc-41dd-88d6-28d66d5ae096" className="aipe-replay-cg-copy-ck-weighted__panel aipe-replay-cg-copy-ck-weighted__panel--response" aria-label="局部响应与符号含义">
          <header shuku-edit-id="e-7d165ebe-ba9e-43c7-a685-9a3d27a821e5"><Typography shuku-edit-id="e-a338c252-8481-4852-8bac-ab08916827f5" as="h2" variant="h3" tone="accent">局部响应 <MathFormulaStatic latex="y" /></Typography></header>
          <div shuku-edit-id="e-4e6b3959-5fed-45b8-9483-e6a6b572c891" className={`aipe-replay-cg-copy-ck-weighted__result ${output < 0 ? 'is-negative' : output === 0 ? 'is-zero' : ''}`}><MathFormulaStatic latex={`y=${output > 0 ? '+' : ''}${output}`} /></div>
          <div shuku-edit-id="e-7897327d-9355-4762-a01d-3cd087504949" className="aipe-replay-cg-copy-ck-weighted__scale" aria-label={`当前局部响应 ${output}`}>
            <div shuku-edit-id="e-e797063f-2ed6-4188-8654-d9da5467721c" className="aipe-replay-cg-copy-ck-weighted__scale-bar"><span shuku-edit-id="e-d4392121-28e0-4c9a-b36d-5e586a7ea36e" className={`aipe-replay-cg-copy-ck-weighted__marker ${output < 0 ? 'is-negative' : output === 0 ? 'is-zero' : ''}`} style={markerStyle}>{output > 0 ? '+' : ''}{output}</span></div>
            <div shuku-edit-id="e-ea67373f-0499-4e5e-9b53-6cef1d10e776" className="aipe-replay-cg-copy-ck-weighted__scale-labels">
              {['右边更亮', '左右相同', '左边更亮'].map((label, index) => <div shuku-edit-id="e-b6be8e74-e2af-4f99-86ac-53ca67afa66d" key={label} className={activeIndex === index ? 'is-active' : ''}><MathFormulaStatic latex={index === 0 ? 'y<0' : index === 1 ? 'y=0' : 'y>0'} /><Typography shuku-edit-id="e-ab506b1a-b5eb-491a-b3ab-ba5d68a2d528" variant="body" tone="inherit">{label}</Typography></div>)}
            </div>
          </div>
          <div shuku-edit-id="e-405fdc9d-ae35-4814-9e37-47216f9acccc" className="aipe-replay-cg-copy-ck-weighted__reading"><Typography shuku-edit-id="e-9c5f960e-6994-42ea-97c3-b37d89d15a84" variant="body" tone="accent">{interpretation}</Typography></div>
        </section>
      </div>

      <footer shuku-edit-id="e-9d40b655-b7a1-4fd8-8056-f7db902c2387" className="aipe-replay-cg-copy-ck-weighted__summary"><Typography shuku-edit-id="e-50965624-3c70-47bc-9cb0-6c7495638b44" variant="h3" tone="accent">这个卷积核回答的问题：左边是否比右边更亮？</Typography></footer>
    </div>
  </ContentBlock>;
}
