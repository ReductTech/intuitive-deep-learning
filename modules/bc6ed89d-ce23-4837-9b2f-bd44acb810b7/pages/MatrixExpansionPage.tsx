import { useRef, useState } from 'react';
import { Button, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import './MatrixExpansionPage.css';

function ExpansionProcess() {
  return <main shuku-edit-id="e-70b55acd-076b-4be6-9a97-d607e75d79d9" className="mxe-process" aria-label="潜在向量分别经过 K 和 V 的上投影，得到内容 K、V，再参与注意力计算">
      <svg shuku-edit-id="e-e430b036-5049-4ed8-a73d-b68b6ed4ebdb" className="mxe-arrows" viewBox="0 0 1488 560" aria-hidden="true">
        <defs shuku-edit-id="e-3d7ddc42-2ec5-46df-908b-547503c0c9fd"><marker shuku-edit-id="e-d02d4b5e-750d-4f83-964d-974743af360b" id="mxe-arrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path shuku-edit-id="e-76c2508d-e801-49bf-b2c4-c620f7c4e658" d="M1 1 L8 4.5 L1 8" fill="none" stroke="currentColor" strokeWidth="1.5" /></marker></defs>
        <path shuku-edit-id="e-61a4e6aa-9dda-4c4e-8808-f7c154d60ee5" d="M250 280 C335 280 330 155 430 155" />
        <path shuku-edit-id="e-bd09460f-5ca1-4512-a407-b30ed2b301cf" d="M250 280 C335 280 330 405 430 405" />
        <path shuku-edit-id="e-c20260ca-6f7b-4bda-936f-d05748cda44e" d="M1055 155 C1155 155 1135 280 1215 280" />
        <path shuku-edit-id="e-0ca94d32-adee-48ea-aa46-7d82c754f801" d="M1055 405 C1155 405 1135 280 1215 280" />
      </svg>
      <div shuku-edit-id="e-d22c75d4-1b94-4b92-b0c5-b887c6f8e8c1" className="mxe-source">
        <Typography shuku-edit-id="e-3078f66e-6831-49d6-927e-bae8a54b4afb" as="p" variant="display" tone="inherit"><MathFormulaStatic latex={'c_t^{KV}'} /></Typography>
        <Typography shuku-edit-id="e-f7db4ba8-9521-40b0-8f32-10aeffd7790c" as="p" variant="h3" tone="muted">潜在向量</Typography>
      </div>
      <div shuku-edit-id="e-34bb30de-8ca4-4044-b0b7-db92eb631891" className="mxe-route mxe-route--k">
        <Typography shuku-edit-id="e-3a508877-1e73-4872-8a07-fa8502ba16b0" as="p" variant="display" tone="inherit"><MathFormulaStatic latex={'c_t^{KV} W^{UK} = k_t'} /></Typography>
      </div>
      <div shuku-edit-id="e-d643de32-ebe1-40a6-b228-0540904df0fa" className="mxe-route mxe-route--v">
        <Typography shuku-edit-id="e-1cba1f19-7ba7-449e-ae4d-c831e88268b5" as="p" variant="display" tone="inherit"><MathFormulaStatic latex={'c_t^{KV} W^{UV} = v_t'} /></Typography>
      </div>
      <Typography shuku-edit-id="e-1df251c1-af4a-4a2c-8470-f79453330b0b" as="p" variant="h2" align="center" className="mxe-attention">注意力计算</Typography>
    </main>;
}

const BLUE_C = String.raw`\textcolor{#3565c8}{C}`;
type DerivationStep = { phase: string; formula: string; caption: string; hint?: string; prefix?: string; target?: string; suffix?: string; absorbed?: boolean };
const STEPS = [
  { phase: '计算注意力分数', formula: 'S=QK^\\top', caption: '先看原来的注意力分数计算' },
  { phase: '计算注意力分数', formula: `S=Q(${BLUE_C}W^{UK})^\\top`, hint: `K=${BLUE_C}W^{UK}`, caption: '代入 K 的展开公式' },
  { phase: '计算注意力分数', formula: `S=Q(W^{UK})^\\top ${BLUE_C}^\\top`, caption: '乘积转置：顺序反转，各自转置' },
  { phase: '计算注意力分数', formula: `S=[Q(W^{UK})^\\top]${BLUE_C}^\\top`, caption: '依据结合律，先变换 Q，不再展开历史 K' },
  { phase: '第一次矩阵吸收', formula: '', prefix: 'S=X', target: '[W^Q(W^{UK})^\\top]', suffix: `${BLUE_C}^\\top`, hint: 'Q=XW^Q', caption: '圈出的两个固定投影，可以提前合并' },
  { phase: '第一次矩阵吸收', formula: '', prefix: 'S=(X', target: '\\widetilde W^Q', suffix: `)${BLUE_C}^\\top`, hint: '\\widetilde W^Q=W^Q(W^{UK})^\\top', absorbed: true, caption: '矩阵吸收：两个固定权重合并为一个投影' },
  { phase: '得到注意力权重', formula: 'S \\xrightarrow{\\text{缩放、遮罩、Softmax}} P', caption: '分数不变，注意力权重也不变' },
  { phase: '加权求和', formula: 'O=PV', caption: '接着用注意力权重，对 V 加权求和' },
  { phase: '加权求和', formula: `O=P(${BLUE_C}W^{UV})`, hint: `V=${BLUE_C}W^{UV}`, caption: '代入 V 的展开公式' },
  { phase: '加权求和', formula: `O=(P${BLUE_C})W^{UV}`, caption: '依据结合律，先加权潜在向量，再进行投影' },
  { phase: '输出投影', formula: 'U=OW^O', caption: 'O 经过输出投影，得到注意力输出 U' },
  { phase: '输出投影', formula: `U=[(P${BLUE_C})W^{UV}]W^O`, caption: '将刚才得到的 O 代入输出投影' },
  { phase: '第二次矩阵吸收', formula: '', prefix: `U=(P${BLUE_C})`, target: '[W^{UV}W^O]', caption: '依据结合律，将两个固定投影放在一起' },
  { phase: '第二次矩阵吸收', formula: '', prefix: `U=(P${BLUE_C})`, target: '\\widetilde W^O', hint: '\\widetilde W^O=W^{UV}W^O', absorbed: true, caption: '合并上投影与输出投影，不再展开历史 V' },
] satisfies DerivationStep[];

function AbsorptionDerivation({ step }: { step: number }) {
  const current: DerivationStep = STEPS[step];
  return <div shuku-edit-id="e-507f0e9b-aaaa-46dd-9ef9-ba57c7b031c6" className="mxe-derivation">
    <div shuku-edit-id="e-0e5b5f51-702b-417c-834d-26e49bc2406b" className="mxe-sequence-context">
      <Typography shuku-edit-id="e-1ee06e5c-7752-4251-8616-2cd418843e3e" as="p" variant="h3"><MathFormulaStatic latex={BLUE_C} />：潜在向量矩阵</Typography>
      <Typography shuku-edit-id="e-7b0a820f-8ff7-4809-b0f0-42be1cacc30b" as="p" variant="h2" align="center">{current.phase}</Typography>
      <Typography shuku-edit-id="e-ca9316d2-0828-4d5f-a6c6-48af7fd865d5" as="p" variant="bodySmall" tone="muted" align="end">单头示意 · 暂不加入 RoPE</Typography>
    </div>
    <main shuku-edit-id="e-53e521cd-12e4-4b70-892b-042ed04ff82a" className="mxe-sequence" aria-label={`矩阵吸收推导第 ${step + 1} 步`}>
      {step > 0 && <svg shuku-edit-id="e-6ee26ee6-94fa-473b-a352-23b44687475e" className="mxe-step-arrow" viewBox="0 0 40 60" aria-hidden="true"><path shuku-edit-id="e-5ebce0a3-0bfb-4dd1-9473-2072ee50a64c" d="M20 5 V50 M10 40 L20 50 L30 40" /></svg>}
      {STEPS.map((item: DerivationStep, index) => index <= step && index >= step - 2 && <div shuku-edit-id="e-0b38f5e1-7abf-4a66-a396-a97318754c08" key={index}
        aria-hidden={index === step - 2}
        className={`mxe-sequence-row ${index === step ? 'is-current' : index === step - 1 ? 'is-previous' : 'is-exiting'} ${index >= 7 ? 'mxe-sequence-row--output' : ''}`}>
        <div shuku-edit-id="e-1bbc0d55-dac9-4858-92fe-df7ed8ba448c" className="mxe-sequence-hint">{item.hint && <Typography shuku-edit-id="e-9eb9d75b-ac2d-49ea-ae0a-5e94766bf6d1" as="p" variant="h3" align="center" tone="muted"><MathFormulaStatic latex={item.hint} /></Typography>}</div>
        <div shuku-edit-id="e-bd978434-8a49-4283-9128-fdd979987e2a" className="mxe-formula-with-note">
        <Typography shuku-edit-id="e-c338e4f2-9089-4fcb-875c-ad192416ab59" as="p" variant="display" tone="inherit" align="center" className="mxe-sequence-formula">
          {item.target ? <><MathFormulaStatic latex={item.prefix ?? ''} /><span shuku-edit-id="e-aa7c58b0-f63e-4eeb-b1b0-17170817fff4" className={`mxe-absorption-target ${item.absorbed ? 'is-absorbed' : ''}`}><MathFormulaStatic latex={item.target} /></span>{item.suffix && <MathFormulaStatic latex={item.suffix} />}</> : <MathFormulaStatic latex={item.formula} />}
        </Typography>
        {index === 10 && <aside shuku-edit-id="e-570afa24-7103-4fa3-825d-1b93db0305e2" className="mxe-output-note" aria-label="输出投影公式说明">
          <Typography shuku-edit-id="e-3546cfad-7d70-4957-8b30-7762518b8dc9" as="p" variant="body"><MathFormulaStatic latex={'W^O'} />：输出投影矩阵</Typography>
          <Typography shuku-edit-id="e-0e6a95cf-503e-4976-b68a-dd75d43dac14" as="p" variant="body"><MathFormulaStatic latex={'U'} />：投影后的注意力输出</Typography>
          <Typography shuku-edit-id="e-cb0dd29c-503d-43cc-9cf9-d8b5f8cb794e" as="p" variant="body" tone="muted">多头：先横向拼接各头输出，再投影</Typography>
        </aside>}
        </div>
      </div>)}
    </main>
  </div>;
}

function AbsorptionSummary() {
  return <main shuku-edit-id="e-5c1e0ea6-f685-47a4-b8ee-867f18903b72" className="mxe-summary" aria-label="两次矩阵吸收并排对照">
    {[{ title: '合并 Q 的投影', before: STEPS[4], after: STEPS[5] }, { title: '合并输出投影', before: STEPS[12], after: STEPS[13] }].map(({ title, before, after }) =>
      <div shuku-edit-id="e-0e6d9191-a1ea-4991-b37e-535860b7774d" className="mxe-summary-column" key={title}>
        <Typography shuku-edit-id="e-6cbcc9d3-cb90-49a2-91b9-5ae88df3dc14" as="h2" variant="h2" align="center">{title}</Typography>
        <Typography shuku-edit-id="e-76d132e5-c6dd-41dd-bfa5-20e06c2ecdba" as="p" variant="h1" align="center" tone="inherit" className="mxe-sequence-formula">
          <MathFormulaStatic latex={before.prefix ?? ''} /><span shuku-edit-id="e-982f261a-84a6-4780-bac5-5e0d6d4cc07e" className="mxe-absorption-target"><MathFormulaStatic latex={before.target ?? ''} /></span>{'suffix' in before && <MathFormulaStatic latex={before.suffix ?? ''} />}
        </Typography>
        <svg shuku-edit-id="e-8c79df81-712a-415d-afdc-439488df85ea" className="mxe-summary-arrow" viewBox="0 0 40 60" aria-hidden="true"><path shuku-edit-id="e-478cb793-bed1-400d-80a1-00508aa9d1d2" d="M20 5 V50 M10 40 L20 50 L30 40" /></svg>
        <Typography shuku-edit-id="e-7881dcb4-26cb-42f4-b9bb-3447b5119f55" as="p" variant="h3" align="center" tone="muted"><MathFormulaStatic latex={after.hint ?? ''} /></Typography>
        <Typography shuku-edit-id="e-a1a58438-d65e-4cdb-a9cd-c392c07ba76e" as="p" variant="h1" align="center" tone="inherit" className="mxe-sequence-formula">
          <MathFormulaStatic latex={after.prefix ?? ''} /><span shuku-edit-id="e-a05a90b5-e378-4397-af1f-fc720e767856" className="mxe-absorption-target is-absorbed"><MathFormulaStatic latex={after.target ?? ''} /></span>{'suffix' in after && <MathFormulaStatic latex={after.suffix ?? ''} />}
        </Typography>
      </div>)}
  </main>;
}

function ComparisonMatrix({ kind }: { kind: 'C' | 'K' | 'V' }) {
  return <div shuku-edit-id="e-d9498da4-f8c0-4667-94b2-5ae3df6b7662" className={`mxe-comparison-matrix mxe-comparison-matrix--${kind.toLowerCase()}`}>
    <Typography shuku-edit-id="e-0d137ee2-3a94-4b58-b354-56fd53aef2c4" as="p" variant="h2" align="center"><MathFormulaStatic latex={kind === 'C' ? 'C^{KV}' : kind} /></Typography>
    <div shuku-edit-id="e-2fbeaae1-064c-4fc0-8639-ea192582b589" className="mxe-comparison-rows" aria-hidden="true">{Array.from({ length: 6 }, (_, index) => <span shuku-edit-id="e-209dac62-fac0-433b-a28d-b46fb730ad79" key={index} />)}</div>
  </div>;
}

function ComparisonArrow() {
  return <svg shuku-edit-id="e-3e806e43-26a3-45e4-96db-33b102548b38" className="mxe-comparison-arrow" viewBox="0 0 80 40" aria-hidden="true"><path shuku-edit-id="e-f40b070e-ad12-406a-b41d-ac7d4e535017" d="M4 20 H72 M61 9 L72 20 L61 31" /></svg>;
}

function AbsorptionBenefit() {
  return <main shuku-edit-id="e-e2372a8c-3c22-4b42-97d5-9aaf9668fc29" className="mxe-benefit" aria-label="吸收前需要展开历史 K、V；吸收后直接使用低维缓存，不再展开历史 K、V">
    <div shuku-edit-id="e-063da12f-b157-401c-894b-9cacf254380d" className="mxe-benefit-lane">
      <Typography shuku-edit-id="e-5a8fe335-291a-4916-9d1f-07757856f286" as="h2" variant="h2">吸收前</Typography>
      <ComparisonMatrix kind="C" />
      <ComparisonArrow />
      <div shuku-edit-id="e-5bab0d1d-0431-4e45-bf35-350262db699d" className="mxe-expansion-area">
        <Typography shuku-edit-id="e-cfc675d3-7627-4432-8e94-d2db8090f42a" as="p" variant="h3" align="center">展开历史 K、V</Typography>
        <div shuku-edit-id="e-aed62117-835f-4e9d-9223-8f40e6ad8b96" className="mxe-expanded-matrices"><ComparisonMatrix kind="K" /><ComparisonMatrix kind="V" /></div>
      </div>
      <ComparisonArrow />
      <Typography shuku-edit-id="e-87361949-32ed-4700-9e37-ee395127b257" as="p" variant="h2" align="center">注意力计算</Typography>
    </div>
    <div shuku-edit-id="e-adbb5a3c-cb6e-4179-8235-0e9e0fee504b" className="mxe-benefit-lane">
      <Typography shuku-edit-id="e-64e4c325-614b-42cd-bb0e-056ffe606259" as="h2" variant="h2">吸收后</Typography>
      <ComparisonMatrix kind="C" />
      <ComparisonArrow />
      <div shuku-edit-id="e-fd95a6c5-1271-4633-865d-ebd306d5b8bb" className="mxe-skipped-area">
        <Typography shuku-edit-id="e-f3275e11-46a2-4b0b-9321-b2bb76d7959d" as="p" variant="h1" align="center">省去</Typography>
        <svg shuku-edit-id="e-cd8468d8-b190-45bb-a971-b94ae481de06" viewBox="0 0 580 40" aria-hidden="true"><path shuku-edit-id="e-68599fb8-0e65-4a65-bf91-4631571b1a1e" d="M10 20 H570" /></svg>
      </div>
      <ComparisonArrow />
      <Typography shuku-edit-id="e-aba7f477-6733-4af1-8a93-78ed58db0699" as="p" variant="h2" align="center">调整后的<br shuku-edit-id="e-5b727e5a-b03d-4e65-b268-0e9a2d650ce0" />注意力计算</Typography>
    </div>
  </main>;
}

export function MatrixExpansionPage() {
  const [step, setStep] = useState(0);
  const lastClick = useRef(0);
  const lastDirection = useRef<number | null>(null);
  const summaryStep = STEPS.length + 1;
  const finalStep = summaryStep + 1;
  const navigate = (direction: -1 | 1) => {
    const now = Date.now();
    if (lastDirection.current === direction && now - lastClick.current < 700) return;
    lastClick.current = now;
    lastDirection.current = direction;
    setStep(value => direction === -1 ? Math.max(0, value - 1) : value === finalStep ? 0 : value + 1);
  };
  return <section shuku-edit-id="e-a14f173a-c997-4093-8187-febe95ae16db" className="mxe-slide" aria-label="从展开 K、V 到矩阵吸收" data-mxe-step={step}>
    <Typography shuku-edit-id="e-d32f3370-05d6-42ab-90a9-db4316cebab0" as="h1" variant="h1" align="center">{step === 0 ? '每轮都计算展开历史 KV 会增加计算开销' : step === finalStep ? '矩阵吸收，省去历史 K、V 的展开' : step === summaryStep ? '两次矩阵吸收，避免展开历史 K、V' : '沿着注意力计算，合并固定投影'}</Typography>
    {step === 0 ? <ExpansionProcess /> : step === finalStep ? <AbsorptionBenefit /> : step === summaryStep ? <AbsorptionSummary /> : <AbsorptionDerivation step={step - 1} />}
    <footer shuku-edit-id="e-9d088bdf-3e4c-4b87-aa6b-e6c2b687be02" className="mxe-footer">
      <Button className="mxe-back" disabled={step === 0} onClick={event => {event.stopPropagation();navigate(-1);}}>← 播放上一步</Button>
      <Typography shuku-edit-id="e-4895bb28-e701-4a94-97b0-5190b81e807c" as="p" variant="h2" align="center" aria-live="polite">{step === 0 ? '现在是通过计算展开 KV 的过程' : step === finalStep ? '缓存保持低维，计算时也不必展开历史 K、V。' : step === summaryStep ? '固定权重提前合并，计算时直接使用潜在向量' : STEPS[step - 1].caption}</Typography>
      <Button className="mxe-forward" variant="primary" onClick={event => {
        event.stopPropagation();
        navigate(1);
      }}>{step === finalStep ? '重新播放 ↺' : '播放下一步 →'}</Button>
    </footer>
  </section>;
}
