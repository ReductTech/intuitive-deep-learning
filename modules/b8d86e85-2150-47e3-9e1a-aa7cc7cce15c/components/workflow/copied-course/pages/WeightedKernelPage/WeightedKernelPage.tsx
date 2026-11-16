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
  return <div shuku-edit-id="e-598aac0c-8b21-46d3-8d3e-24723f8e5158" className={`cg-copy-ck-weighted__matrix cg-copy-ck-weighted__matrix--${kind}`} role="img" aria-label={label}>
    {values.flatMap((row, rowIndex) => row.map((value, colIndex) => <div shuku-edit-id="e-8d2c4782-ba1b-439c-bc7f-58d4babd5dca" key={`${rowIndex}-${colIndex}`} className={`cg-copy-ck-weighted__cell ${kind === 'input' ? value > 5 ? 'is-bright' : value < 5 ? 'is-dark' : 'is-neutral' : value < 0 ? 'is-negative' : 'is-positive'}`}><MathFormulaStatic latex={String(value)} /></div>))}
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

  return <ContentBlock shuku-edit-id="e-89e7e51d-5344-4578-8756-4c89ea856a07" headingLevel={1} className="cg-copy-ck-weighted" title="权重决定局部响应" subtitle="每个位置的输入按对应权重参与求和；符号、大小和排列共同决定输出。">
    <div shuku-edit-id="e-f87896e7-5895-4d6f-83e3-6472edc7361b" className="cg-copy-ck-weighted__body">
      <section shuku-edit-id="e-0f7e420e-f9ee-4620-91dd-fbc460234834" className="cg-copy-ck-weighted__concepts" aria-label="权重的三个作用">
        <div shuku-edit-id="e-a37de3a4-89ea-40a1-81e9-516427d876e0" className="cg-copy-ck-weighted__concept"><span shuku-edit-id="e-0b30cc4f-6f4f-4998-a46e-84d0a01497e8" className="cg-copy-ck-weighted__concept-icon" aria-hidden="true">±</span><div shuku-edit-id="e-54dfe534-ff55-4403-8e01-922fca50a981"><Typography shuku-edit-id="e-c4fcfe52-1dcf-47d1-93af-ce24fe6ed9d8" as="h2" variant="h3" tone="accent">符号</Typography><Typography shuku-edit-id="e-c59f54c9-c88d-4772-af96-0f971ae22082" variant="bodySmall" tone="muted">w &gt; 0 加入，w &lt; 0 减去，w = 0 忽略</Typography></div></div>
        <div shuku-edit-id="e-1311c17d-cbe5-4136-b4ad-1bc49c4582bb" className="cg-copy-ck-weighted__concept"><span shuku-edit-id="e-ad63df2b-e7f8-4726-9701-98dac159a0b3" className="cg-copy-ck-weighted__concept-icon" aria-hidden="true">▂▅▇</span><div shuku-edit-id="e-63786081-0d37-423f-9947-faca2c0a70e3"><Typography shuku-edit-id="e-80ddf902-89b0-459b-b0d7-b0932e169b6a" as="h2" variant="h3" tone="accent">大小</Typography><Typography shuku-edit-id="e-911fc3bc-1709-4aca-95f3-155801c1b466" variant="bodySmall" tone="muted">|w| 越大，影响越强</Typography></div></div>
        <div shuku-edit-id="e-c2a99e23-5b1e-4fe8-9541-180c8e4dc584" className="cg-copy-ck-weighted__concept"><span shuku-edit-id="e-d394b706-ec11-4115-bb4b-50c2314cd074" className="cg-copy-ck-weighted__concept-icon" aria-hidden="true">▦</span><div shuku-edit-id="e-7cb11b1e-0b92-4d1f-a973-1ea06a8cdcf3"><Typography shuku-edit-id="e-d87f960a-4769-47eb-abaa-43041a7a80ca" as="h2" variant="h3" tone="accent">排列</Typography><Typography shuku-edit-id="e-9ad57aef-288b-4890-ba27-470405b6db73" variant="bodySmall" tone="muted">决定要比较哪种局部结构</Typography></div></div>
      </section>

      <div shuku-edit-id="e-8a3c7740-f62e-468c-ac0e-421a074e1153" className="cg-copy-ck-weighted__flow">
        <section shuku-edit-id="e-276e4da6-004d-438a-9544-93ad68c0a1c2" className="cg-copy-ck-weighted__panel" aria-label="选择输入区域">
          <header shuku-edit-id="e-3a3fad99-f6a8-43d6-8f26-a39f1594cb41"><Typography shuku-edit-id="e-40645049-d04c-4f57-b639-febe1fdffcb9" as="h2" variant="h3" tone="accent">输入区域 <MathFormulaStatic latex="x" /></Typography></header>
          <Matrix values={pattern.values} kind="input" label={`输入区域：${pattern.label}`} />
          <Typography shuku-edit-id="e-1a8015a5-d18f-42a4-9573-f251ce6aff02" variant="body" tone="accent">{pattern.label}</Typography>
          <div shuku-edit-id="e-7a9fd50d-2066-4a72-8aa5-80aac0381cd3" className="cg-copy-ck-weighted__patterns" role="group" aria-label="选择输入明暗模式">
            {PATTERNS.map((item) => <button shuku-edit-id="e-33b3fa3f-0565-44d9-bb0e-a6c02b891c24" key={item.id} type="button" className={patternId === item.id ? 'is-selected' : ''} aria-pressed={patternId === item.id} onClick={() => setPatternId(item.id)}><Typography shuku-edit-id="e-20400921-7757-40e3-a462-e4d8a904d2dc" as="span" variant="bodySmall" tone="inherit">{item.label}</Typography></button>)}
          </div>
        </section>
        <span shuku-edit-id="e-555f2002-0d3f-4308-be63-32f586f047c5" className="cg-copy-ck-weighted__arrow" aria-hidden="true">→</span>
        <section shuku-edit-id="e-e4daa63a-f18e-40c4-90ba-fc0d58b98db0" className="cg-copy-ck-weighted__panel cg-copy-ck-weighted__panel--kernel" aria-label="卷积核及当前比较">
          <header shuku-edit-id="e-dc89a2e9-53ab-4fd7-ba0e-28035e6c5bc4"><Typography shuku-edit-id="e-24ecd8d0-a6a0-4ac1-b63b-1e5fdff81eb6" as="h2" variant="h3" tone="accent">卷积核 <MathFormulaStatic latex="w" /></Typography></header>
          <Matrix values={KERNEL} kind="kernel" label="卷积核：左列为正一，右列为负一" />
          <div shuku-edit-id="e-998680a4-8f11-4fa0-96b3-476e939b1e06" className="cg-copy-ck-weighted__question"><Typography shuku-edit-id="e-077ca542-522a-4811-af2d-879d4832b5d9" variant="body" tone="accent">这个核在比较：左边是否比右边更亮？</Typography></div>
        </section>
        <span shuku-edit-id="e-d7000fd7-3ee3-4df7-94e4-630c99ac5ed5" className="cg-copy-ck-weighted__arrow" aria-hidden="true">→</span>
        <section shuku-edit-id="e-bf7c6a40-c6b6-4845-ad7c-59bd1eb5153b" className="cg-copy-ck-weighted__panel cg-copy-ck-weighted__panel--response" aria-label="局部响应与符号含义">
          <header shuku-edit-id="e-0f3a9fbe-6d74-486b-a825-0296ab01125d"><Typography shuku-edit-id="e-2e81651c-6a70-471f-92e6-d437b3eb44bb" as="h2" variant="h3" tone="accent">局部响应 <MathFormulaStatic latex="y" /></Typography></header>
          <div shuku-edit-id="e-f63bac84-967c-479c-ace6-b7c1d2d24611" className={`cg-copy-ck-weighted__result ${output < 0 ? 'is-negative' : output === 0 ? 'is-zero' : ''}`}><MathFormulaStatic latex={`y=${output > 0 ? '+' : ''}${output}`} /></div>
          <div shuku-edit-id="e-8585a967-bb7e-44d2-81b9-1f4ac5ab9fb9" className="cg-copy-ck-weighted__scale" aria-label={`当前局部响应 ${output}`}>
            <div shuku-edit-id="e-4d4ff299-a6e7-448f-893a-2b3442d25914" className="cg-copy-ck-weighted__scale-bar"><span shuku-edit-id="e-62e2527b-dfe6-4745-91e9-2557e5844d2f" className={`cg-copy-ck-weighted__marker ${output < 0 ? 'is-negative' : output === 0 ? 'is-zero' : ''}`} style={markerStyle}>{output > 0 ? '+' : ''}{output}</span></div>
            <div shuku-edit-id="e-ed0f04a4-9ba1-4529-a2ec-5ebcec3e62aa" className="cg-copy-ck-weighted__scale-labels">
              {['右边更亮', '左右相同', '左边更亮'].map((label, index) => <div shuku-edit-id="e-b2d9c14c-ac61-4763-805c-9403878fabfa" key={label} className={activeIndex === index ? 'is-active' : ''}><MathFormulaStatic latex={index === 0 ? 'y<0' : index === 1 ? 'y=0' : 'y>0'} /><Typography shuku-edit-id="e-0ba97204-6a22-4ee5-8197-93f12aa1b087" variant="body" tone="inherit">{label}</Typography></div>)}
            </div>
          </div>
          <div shuku-edit-id="e-2ff47f9f-c0a7-488e-9c79-1d301060a195" className="cg-copy-ck-weighted__reading"><Typography shuku-edit-id="e-7575b9dc-aa18-4963-8092-c11d44be626d" variant="body" tone="accent">{interpretation}</Typography></div>
        </section>
      </div>

      <footer shuku-edit-id="e-61bc30a3-fa49-4458-a16c-b4ca46ae19d7" className="cg-copy-ck-weighted__summary"><Typography shuku-edit-id="e-54b1f8e3-51c8-477e-9605-1185f201da31" variant="h3" tone="accent">这个卷积核回答的问题：左边是否比右边更亮？</Typography></footer>
    </div>
  </ContentBlock>;
}
