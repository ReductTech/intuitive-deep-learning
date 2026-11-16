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
  return <div shuku-edit-id="e-3cb566fe-2676-4d24-8429-9798b667095f" className={`ck-weighted__matrix ck-weighted__matrix--${kind}`} role="img" aria-label={label}>
    {values.flatMap((row, rowIndex) => row.map((value, colIndex) => <div shuku-edit-id="e-c9280b31-4817-458e-870c-4b534a86391e" key={`${rowIndex}-${colIndex}`} className={`ck-weighted__cell ${kind === 'input' ? value > 5 ? 'is-bright' : value < 5 ? 'is-dark' : 'is-neutral' : value < 0 ? 'is-negative' : 'is-positive'}`}><MathFormulaStatic latex={String(value)} /></div>))}
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

  return <ContentBlock shuku-edit-id="e-3c3c315f-ff49-4824-9ada-0b0fb8b55f34" headingLevel={1} className="ck-weighted" title="权重决定局部响应" subtitle="每个位置的输入按对应权重参与求和；符号、大小和排列共同决定输出。">
    <div shuku-edit-id="e-3d6f181d-6b28-49d9-8fa3-8fd486aa5b10" className="ck-weighted__body">
      <section shuku-edit-id="e-796301c0-59d3-40e5-8a62-202d11b6e410" className="ck-weighted__concepts" aria-label="权重的三个作用">
        <div shuku-edit-id="e-39d196d4-2fcd-4797-9eaf-ca042d97c093" className="ck-weighted__concept"><span shuku-edit-id="e-0fc08010-d8c4-4ecb-bcba-9181f1917821" className="ck-weighted__concept-icon" aria-hidden="true">±</span><div shuku-edit-id="e-acb9916f-8a40-4ade-b570-7bc38ebde41b"><Typography shuku-edit-id="e-972c5ca2-01a1-4e5f-b496-aa21dfac8393" as="h2" variant="h3" tone="accent">符号</Typography><Typography shuku-edit-id="e-8c86a8d0-74eb-4822-862f-b224d3fadf3e" variant="bodySmall" tone="muted">w &gt; 0 加入，w &lt; 0 减去，w = 0 忽略</Typography></div></div>
        <div shuku-edit-id="e-988645c5-5ffa-4314-8f13-2f2ca73e1377" className="ck-weighted__concept"><span shuku-edit-id="e-b92e79b7-139f-42f8-b443-50e0fbd5af7a" className="ck-weighted__concept-icon" aria-hidden="true">▂▅▇</span><div shuku-edit-id="e-814b1fbb-9b46-4ab9-9fed-71903ace12e1"><Typography shuku-edit-id="e-4b9057e9-61d7-40f0-abfc-9fb5ef2235c3" as="h2" variant="h3" tone="accent">大小</Typography><Typography shuku-edit-id="e-2041f50f-6e53-40fd-a31a-8b033e5908ea" variant="bodySmall" tone="muted">|w| 越大，影响越强</Typography></div></div>
        <div shuku-edit-id="e-15e4db20-eab1-4679-a351-1887eee108be" className="ck-weighted__concept"><span shuku-edit-id="e-689dbc3f-dbd8-4c3b-8446-36611622e2f7" className="ck-weighted__concept-icon" aria-hidden="true">▦</span><div shuku-edit-id="e-3db4c5c2-03b0-4a66-bc91-7385c2f522aa"><Typography shuku-edit-id="e-7b071330-c9e0-45a7-b775-7f35a8ebc867" as="h2" variant="h3" tone="accent">排列</Typography><Typography shuku-edit-id="e-df2623be-c336-424a-8436-436642b2268c" variant="bodySmall" tone="muted">决定要比较哪种局部结构</Typography></div></div>
      </section>

      <div shuku-edit-id="e-8dda4d20-bbca-4ec5-a90a-103958326163" className="ck-weighted__flow">
        <section shuku-edit-id="e-695e1a9d-11dc-4ed3-8b79-8cf67261e1a1" className="ck-weighted__panel" aria-label="选择输入区域">
          <header shuku-edit-id="e-cb48c8cb-d702-4542-8a72-eda461dc779f"><Typography shuku-edit-id="e-099013f5-bc35-4ad3-882d-3e8cfcd7ea2e" as="h2" variant="h3" tone="accent">输入区域 <MathFormulaStatic latex="x" /></Typography></header>
          <Matrix values={pattern.values} kind="input" label={`输入区域：${pattern.label}`} />
          <Typography shuku-edit-id="e-5692d716-e93e-4aec-a9b6-39db5fed00b0" variant="body" tone="accent">{pattern.label}</Typography>
          <div shuku-edit-id="e-94641f66-8b97-4f70-b3ea-9f75b7182be8" className="ck-weighted__patterns" role="group" aria-label="选择输入明暗模式">
            {PATTERNS.map((item) => <button shuku-edit-id="e-f3c9da9e-a6ed-47ea-bfc4-78ff8f44200d" key={item.id} type="button" className={patternId === item.id ? 'is-selected' : ''} aria-pressed={patternId === item.id} onClick={() => setPatternId(item.id)}><Typography shuku-edit-id="e-1486de9d-f4f8-4374-b54b-580aa4f86500" as="span" variant="bodySmall" tone="inherit">{item.label}</Typography></button>)}
          </div>
        </section>
        <span shuku-edit-id="e-adb46b43-7ca6-49c1-a12f-3d3e41c42182" className="ck-weighted__arrow" aria-hidden="true">→</span>
        <section shuku-edit-id="e-a31bec6f-cdf7-4b35-8207-0d1234f5d0d5" className="ck-weighted__panel ck-weighted__panel--kernel" aria-label="卷积核及当前比较">
          <header shuku-edit-id="e-d7fbbdc8-537b-4520-bc54-49944b0c41dd"><Typography shuku-edit-id="e-64be6db5-a1e4-478e-8e85-6eba7b847661" as="h2" variant="h3" tone="accent">卷积核 <MathFormulaStatic latex="w" /></Typography></header>
          <Matrix values={KERNEL} kind="kernel" label="卷积核：左列为正一，右列为负一" />
          <div shuku-edit-id="e-cd93ebe9-3af9-48d8-8102-7407068e563e" className="ck-weighted__question"><Typography shuku-edit-id="e-9bd4b761-ee4f-422b-94ca-37b505db84da" variant="body" tone="accent">这个核在比较：左边是否比右边更亮？</Typography></div>
        </section>
        <span shuku-edit-id="e-7ec0134a-06b3-4fbe-b4a8-a523ff83e64f" className="ck-weighted__arrow" aria-hidden="true">→</span>
        <section shuku-edit-id="e-89ab02ac-4b1c-4e31-a405-a7a8bdb97df8" className="ck-weighted__panel ck-weighted__panel--response" aria-label="局部响应与符号含义">
          <header shuku-edit-id="e-2593becd-1000-43f4-9356-9cfebdf38c94"><Typography shuku-edit-id="e-73480f6b-2f08-47e8-83df-dc1ca3f40f5b" as="h2" variant="h3" tone="accent">局部响应 <MathFormulaStatic latex="y" /></Typography></header>
          <div shuku-edit-id="e-f1932f95-49cc-467a-b7e2-c670e3f1ad6c" className={`ck-weighted__result ${output < 0 ? 'is-negative' : output === 0 ? 'is-zero' : ''}`}><MathFormulaStatic latex={`y=${output > 0 ? '+' : ''}${output}`} /></div>
          <div shuku-edit-id="e-a59d4685-0589-47e5-80b8-38fd70a1e58a" className="ck-weighted__scale" aria-label={`当前局部响应 ${output}`}>
            <div shuku-edit-id="e-5c9e4545-3632-47cd-84b2-c9c92b1a859d" className="ck-weighted__scale-bar"><span shuku-edit-id="e-769b8965-b371-43bb-bfd6-0be8c07df019" className={`ck-weighted__marker ${output < 0 ? 'is-negative' : output === 0 ? 'is-zero' : ''}`} style={markerStyle}>{output > 0 ? '+' : ''}{output}</span></div>
            <div shuku-edit-id="e-6a5d2fe6-dc1d-44b6-8e1d-37623b81922f" className="ck-weighted__scale-labels">
              {['右边更亮', '左右相同', '左边更亮'].map((label, index) => <div shuku-edit-id="e-2b1dbf43-6716-4aaf-9497-817e4aee03da" key={label} className={activeIndex === index ? 'is-active' : ''}><MathFormulaStatic latex={index === 0 ? 'y<0' : index === 1 ? 'y=0' : 'y>0'} /><Typography shuku-edit-id="e-812c899d-3f71-47a8-a9d0-a7e1582285fa" variant="body" tone="inherit">{label}</Typography></div>)}
            </div>
          </div>
          <div shuku-edit-id="e-eba1e893-4960-4779-9f6b-0456672b6883" className="ck-weighted__reading"><Typography shuku-edit-id="e-a359366b-b813-452d-a27a-27b1da31776d" variant="body" tone="accent">{interpretation}</Typography></div>
        </section>
      </div>

      <footer shuku-edit-id="e-8fbfe3fd-41df-4c9f-af74-099b814fa249" className="ck-weighted__summary"><Typography shuku-edit-id="e-56170b91-5833-4866-9114-08ecf7181e3e" variant="h3" tone="accent">这个卷积核回答的问题：左边是否比右边更亮？</Typography></footer>
    </div>
  </ContentBlock>;
}
