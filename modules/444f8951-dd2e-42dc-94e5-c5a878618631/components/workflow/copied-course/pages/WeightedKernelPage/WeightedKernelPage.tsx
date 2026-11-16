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
  return <div shuku-edit-id="e-68aca9ba-5002-4a93-a02d-1489be4dd8fb" className={`cg-copy-ck-weighted__matrix cg-copy-ck-weighted__matrix--${kind}`} role="img" aria-label={label}>
    {values.flatMap((row, rowIndex) => row.map((value, colIndex) => <div shuku-edit-id="e-d692014b-43dd-423c-91b8-6235ed81b93f" key={`${rowIndex}-${colIndex}`} className={`cg-copy-ck-weighted__cell ${kind === 'input' ? value > 5 ? 'is-bright' : value < 5 ? 'is-dark' : 'is-neutral' : value < 0 ? 'is-negative' : 'is-positive'}`}><MathFormulaStatic latex={String(value)} /></div>))}
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

  return <ContentBlock shuku-edit-id="e-69e28203-c1fe-46d2-a3ce-4289bf5de3c1" headingLevel={1} className="cg-copy-ck-weighted" title="权重决定局部响应" subtitle="每个位置的输入按对应权重参与求和；符号、大小和排列共同决定输出。">
    <div shuku-edit-id="e-b787d9d4-0135-43ca-96d8-30696a67c02b" className="cg-copy-ck-weighted__body">
      <section shuku-edit-id="e-ada7e479-4dc2-4637-9cc4-27698d2a74dd" className="cg-copy-ck-weighted__concepts" aria-label="权重的三个作用">
        <div shuku-edit-id="e-83c85ea7-6198-4a20-94d6-95ff47303204" className="cg-copy-ck-weighted__concept"><span shuku-edit-id="e-372175be-3373-48dc-b782-ee398e89238c" className="cg-copy-ck-weighted__concept-icon" aria-hidden="true">±</span><div shuku-edit-id="e-4b61b503-c704-46af-91f4-3aee8bccbfbc"><Typography shuku-edit-id="e-04521405-448b-4135-8363-8f45aa4668ea" as="h2" variant="h3" tone="accent">符号</Typography><Typography shuku-edit-id="e-90ae91fe-7d6f-4377-a695-207f3918ad34" variant="bodySmall" tone="muted">w &gt; 0 加入，w &lt; 0 减去，w = 0 忽略</Typography></div></div>
        <div shuku-edit-id="e-8115c7de-db3d-4e8f-a88f-76e2dffe4a60" className="cg-copy-ck-weighted__concept"><span shuku-edit-id="e-d90b1ee9-b098-498a-aec2-e870ee8a3029" className="cg-copy-ck-weighted__concept-icon" aria-hidden="true">▂▅▇</span><div shuku-edit-id="e-b5c36e21-b6f4-49cf-86dd-89cc44325ab1"><Typography shuku-edit-id="e-4747f12c-e4f6-4870-bb0d-629e89df5058" as="h2" variant="h3" tone="accent">大小</Typography><Typography shuku-edit-id="e-9c38ccc6-9d40-4620-a697-b09eff02e141" variant="bodySmall" tone="muted">|w| 越大，影响越强</Typography></div></div>
        <div shuku-edit-id="e-1039f4d0-c3e0-4d35-91db-7f90868d1183" className="cg-copy-ck-weighted__concept"><span shuku-edit-id="e-63e5e4c1-e747-46d0-a1e7-77d610be6a55" className="cg-copy-ck-weighted__concept-icon" aria-hidden="true">▦</span><div shuku-edit-id="e-166d8bf1-f931-458a-bbc3-026ef88c8b93"><Typography shuku-edit-id="e-04f35c87-b8d4-4f53-b5c1-9d417b487cd5" as="h2" variant="h3" tone="accent">排列</Typography><Typography shuku-edit-id="e-418a20cd-7e8c-4b6a-b98d-ef6ea323c26b" variant="bodySmall" tone="muted">决定要比较哪种局部结构</Typography></div></div>
      </section>

      <div shuku-edit-id="e-e474d16c-d1a8-49c9-937a-6c2290894bc4" className="cg-copy-ck-weighted__flow">
        <section shuku-edit-id="e-439d25b6-0c91-4f37-ad08-5dcf1a09f5fc" className="cg-copy-ck-weighted__panel" aria-label="选择输入区域">
          <header shuku-edit-id="e-dc646e69-bc77-4860-8fa4-16bf0e34a47a"><Typography shuku-edit-id="e-3aa2303f-232c-43b1-848c-58a4a9654f19" as="h2" variant="h3" tone="accent">输入区域 <MathFormulaStatic latex="x" /></Typography></header>
          <Matrix values={pattern.values} kind="input" label={`输入区域：${pattern.label}`} />
          <Typography shuku-edit-id="e-7bfe8ef8-2d9f-460f-aed8-7db43a01bd1c" variant="body" tone="accent">{pattern.label}</Typography>
          <div shuku-edit-id="e-0d1083da-4320-47b3-9b83-ff87c819f818" className="cg-copy-ck-weighted__patterns" role="group" aria-label="选择输入明暗模式">
            {PATTERNS.map((item) => <button shuku-edit-id="e-af4f88d6-1672-496f-933d-845c73b000cf" key={item.id} type="button" className={patternId === item.id ? 'is-selected' : ''} aria-pressed={patternId === item.id} onClick={() => setPatternId(item.id)}><Typography shuku-edit-id="e-2b4bc8bf-9b66-42ff-993d-5cdbaba9c308" as="span" variant="bodySmall" tone="inherit">{item.label}</Typography></button>)}
          </div>
        </section>
        <span shuku-edit-id="e-863b20dc-9dd2-4178-8847-6211cc15c565" className="cg-copy-ck-weighted__arrow" aria-hidden="true">→</span>
        <section shuku-edit-id="e-faadaac0-3028-4127-8d7c-a088f209c493" className="cg-copy-ck-weighted__panel cg-copy-ck-weighted__panel--kernel" aria-label="卷积核及当前比较">
          <header shuku-edit-id="e-1a5b64bf-9665-4e0b-a19c-db39d7ffbe41"><Typography shuku-edit-id="e-383d17ef-e1e9-4b4d-b012-1e09541e571a" as="h2" variant="h3" tone="accent">卷积核 <MathFormulaStatic latex="w" /></Typography></header>
          <Matrix values={KERNEL} kind="kernel" label="卷积核：左列为正一，右列为负一" />
          <div shuku-edit-id="e-31a52d3e-9a7a-40a4-8c26-4e3f2252d5a4" className="cg-copy-ck-weighted__question"><Typography shuku-edit-id="e-675c6bad-5b6c-4c29-8e00-10fadefe0ffe" variant="body" tone="accent">这个核在比较：左边是否比右边更亮？</Typography></div>
        </section>
        <span shuku-edit-id="e-97e6eb03-e038-4610-a228-42f315a224d6" className="cg-copy-ck-weighted__arrow" aria-hidden="true">→</span>
        <section shuku-edit-id="e-52a4e0bb-4e3e-429a-8e30-b5df09295f22" className="cg-copy-ck-weighted__panel cg-copy-ck-weighted__panel--response" aria-label="局部响应与符号含义">
          <header shuku-edit-id="e-8bc4a36b-5756-44f1-8b55-3bc07f5a7405"><Typography shuku-edit-id="e-068cffe8-7332-4004-8c0f-e757461ae1ff" as="h2" variant="h3" tone="accent">局部响应 <MathFormulaStatic latex="y" /></Typography></header>
          <div shuku-edit-id="e-27a024be-3d42-4b8e-8a78-fd7e54aabbc6" className={`cg-copy-ck-weighted__result ${output < 0 ? 'is-negative' : output === 0 ? 'is-zero' : ''}`}><MathFormulaStatic latex={`y=${output > 0 ? '+' : ''}${output}`} /></div>
          <div shuku-edit-id="e-d40f2d93-4968-42e7-ad2a-67efd0d0187a" className="cg-copy-ck-weighted__scale" aria-label={`当前局部响应 ${output}`}>
            <div shuku-edit-id="e-a329825c-8de7-438b-a95f-446fedc25482" className="cg-copy-ck-weighted__scale-bar"><span shuku-edit-id="e-179b68c0-ac10-4df7-b17c-2151b3792687" className={`cg-copy-ck-weighted__marker ${output < 0 ? 'is-negative' : output === 0 ? 'is-zero' : ''}`} style={markerStyle}>{output > 0 ? '+' : ''}{output}</span></div>
            <div shuku-edit-id="e-58f7a327-e82d-4722-8bef-a57ef68fd369" className="cg-copy-ck-weighted__scale-labels">
              {['右边更亮', '左右相同', '左边更亮'].map((label, index) => <div shuku-edit-id="e-67b478a9-39e3-4089-b5ca-8019ed2155ce" key={label} className={activeIndex === index ? 'is-active' : ''}><MathFormulaStatic latex={index === 0 ? 'y<0' : index === 1 ? 'y=0' : 'y>0'} /><Typography shuku-edit-id="e-90b28b59-56b2-4e4a-b7fa-9b18de10cc0d" variant="body" tone="inherit">{label}</Typography></div>)}
            </div>
          </div>
          <div shuku-edit-id="e-d263a9c3-7efe-4dde-8d16-758dab0216cd" className="cg-copy-ck-weighted__reading"><Typography shuku-edit-id="e-ff953cbe-ca4f-4e12-a615-11f988982954" variant="body" tone="accent">{interpretation}</Typography></div>
        </section>
      </div>

      <footer shuku-edit-id="e-bc26f782-76e9-4b0d-ba65-8705aec048ab" className="cg-copy-ck-weighted__summary"><Typography shuku-edit-id="e-adb666e8-e2ad-4d8b-8732-4ff5cf6dad1e" variant="h3" tone="accent">这个卷积核回答的问题：左边是否比右边更亮？</Typography></footer>
    </div>
  </ContentBlock>;
}
