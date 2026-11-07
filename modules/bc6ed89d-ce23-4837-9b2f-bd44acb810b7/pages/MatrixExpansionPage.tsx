import { useRef, useState } from 'react';
import { Button, MathFormulaStatic, Typography } from '../../shared/react';
import './MatrixExpansionPage.css';

function ExpansionProcess() {
  return <main className="mxe-process" aria-label="潜在向量分别经过 K 和 V 的上投影，得到内容 K、V，再参与注意力计算">
      <svg className="mxe-arrows" viewBox="0 0 1488 560" aria-hidden="true">
        <defs><marker id="mxe-arrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M1 1 L8 4.5 L1 8" fill="none" stroke="currentColor" strokeWidth="1.5" /></marker></defs>
        <path d="M250 280 C335 280 330 155 430 155" />
        <path d="M250 280 C335 280 330 405 430 405" />
        <path d="M1055 155 C1155 155 1135 280 1215 280" />
        <path d="M1055 405 C1155 405 1135 280 1215 280" />
      </svg>
      <div className="mxe-source">
        <Typography as="p" variant="display" tone="inherit"><MathFormulaStatic latex={'c_t^{KV}'} /></Typography>
        <Typography as="p" variant="h3" tone="muted">潜在向量</Typography>
      </div>
      <div className="mxe-route mxe-route--k">
        <Typography as="p" variant="display" tone="inherit"><MathFormulaStatic latex={'c_t^{KV} W^{UK} = k_t'} /></Typography>
      </div>
      <div className="mxe-route mxe-route--v">
        <Typography as="p" variant="display" tone="inherit"><MathFormulaStatic latex={'c_t^{KV} W^{UV} = v_t'} /></Typography>
      </div>
      <Typography as="p" variant="h2" align="center" className="mxe-attention">注意力计算</Typography>
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
  return <div className="mxe-derivation">
    <div className="mxe-sequence-context">
      <Typography as="p" variant="h3"><MathFormulaStatic latex={BLUE_C} />：潜在向量矩阵</Typography>
      <Typography as="p" variant="h2" align="center">{current.phase}</Typography>
      <Typography as="p" variant="bodySmall" tone="muted" align="end">单头示意 · 暂不加入 RoPE</Typography>
    </div>
    <main className="mxe-sequence" aria-label={`矩阵吸收推导第 ${step + 1} 步`}>
      {step > 0 && <svg className="mxe-step-arrow" viewBox="0 0 40 60" aria-hidden="true"><path d="M20 5 V50 M10 40 L20 50 L30 40" /></svg>}
      {STEPS.map((item: DerivationStep, index) => index <= step && index >= step - 2 && <div key={index}
        aria-hidden={index === step - 2}
        className={`mxe-sequence-row ${index === step ? 'is-current' : index === step - 1 ? 'is-previous' : 'is-exiting'} ${index >= 7 ? 'mxe-sequence-row--output' : ''}`}>
        <div className="mxe-sequence-hint">{item.hint && <Typography as="p" variant="h3" align="center" tone="muted"><MathFormulaStatic latex={item.hint} /></Typography>}</div>
        <div className="mxe-formula-with-note">
        <Typography as="p" variant="display" tone="inherit" align="center" className="mxe-sequence-formula">
          {item.target ? <><MathFormulaStatic latex={item.prefix ?? ''} /><span className={`mxe-absorption-target ${item.absorbed ? 'is-absorbed' : ''}`}><MathFormulaStatic latex={item.target} /></span>{item.suffix && <MathFormulaStatic latex={item.suffix} />}</> : <MathFormulaStatic latex={item.formula} />}
        </Typography>
        {index === 10 && <aside className="mxe-output-note" aria-label="输出投影公式说明">
          <Typography as="p" variant="body"><MathFormulaStatic latex={'W^O'} />：输出投影矩阵</Typography>
          <Typography as="p" variant="body"><MathFormulaStatic latex={'U'} />：投影后的注意力输出</Typography>
          <Typography as="p" variant="body" tone="muted">多头：先横向拼接各头输出，再投影</Typography>
        </aside>}
        </div>
      </div>)}
    </main>
  </div>;
}

function AbsorptionSummary() {
  return <main className="mxe-summary" aria-label="两次矩阵吸收并排对照">
    {[{ title: '合并 Q 的投影', before: STEPS[4], after: STEPS[5] }, { title: '合并输出投影', before: STEPS[12], after: STEPS[13] }].map(({ title, before, after }) =>
      <div className="mxe-summary-column" key={title}>
        <Typography as="h2" variant="h2" align="center">{title}</Typography>
        <Typography as="p" variant="h1" align="center" tone="inherit" className="mxe-sequence-formula">
          <MathFormulaStatic latex={before.prefix ?? ''} /><span className="mxe-absorption-target"><MathFormulaStatic latex={before.target ?? ''} /></span>{'suffix' in before && <MathFormulaStatic latex={before.suffix ?? ''} />}
        </Typography>
        <svg className="mxe-summary-arrow" viewBox="0 0 40 60" aria-hidden="true"><path d="M20 5 V50 M10 40 L20 50 L30 40" /></svg>
        <Typography as="p" variant="h3" align="center" tone="muted"><MathFormulaStatic latex={after.hint ?? ''} /></Typography>
        <Typography as="p" variant="h1" align="center" tone="inherit" className="mxe-sequence-formula">
          <MathFormulaStatic latex={after.prefix ?? ''} /><span className="mxe-absorption-target is-absorbed"><MathFormulaStatic latex={after.target ?? ''} /></span>{'suffix' in after && <MathFormulaStatic latex={after.suffix ?? ''} />}
        </Typography>
      </div>)}
  </main>;
}

function ComparisonMatrix({ kind }: { kind: 'C' | 'K' | 'V' }) {
  return <div className={`mxe-comparison-matrix mxe-comparison-matrix--${kind.toLowerCase()}`}>
    <Typography as="p" variant="h2" align="center"><MathFormulaStatic latex={kind === 'C' ? 'C^{KV}' : kind} /></Typography>
    <div className="mxe-comparison-rows" aria-hidden="true">{Array.from({ length: 6 }, (_, index) => <span key={index} />)}</div>
  </div>;
}

function ComparisonArrow() {
  return <svg className="mxe-comparison-arrow" viewBox="0 0 80 40" aria-hidden="true"><path d="M4 20 H72 M61 9 L72 20 L61 31" /></svg>;
}

function AbsorptionBenefit() {
  return <main className="mxe-benefit" aria-label="吸收前需要展开历史 K、V；吸收后直接使用低维缓存，不再展开历史 K、V">
    <div className="mxe-benefit-lane">
      <Typography as="h2" variant="h2">吸收前</Typography>
      <ComparisonMatrix kind="C" />
      <ComparisonArrow />
      <div className="mxe-expansion-area">
        <Typography as="p" variant="h3" align="center">展开历史 K、V</Typography>
        <div className="mxe-expanded-matrices"><ComparisonMatrix kind="K" /><ComparisonMatrix kind="V" /></div>
      </div>
      <ComparisonArrow />
      <Typography as="p" variant="h2" align="center">注意力计算</Typography>
    </div>
    <div className="mxe-benefit-lane">
      <Typography as="h2" variant="h2">吸收后</Typography>
      <ComparisonMatrix kind="C" />
      <ComparisonArrow />
      <div className="mxe-skipped-area">
        <Typography as="p" variant="h1" align="center">省去</Typography>
        <svg viewBox="0 0 580 40" aria-hidden="true"><path d="M10 20 H570" /></svg>
      </div>
      <ComparisonArrow />
      <Typography as="p" variant="h2" align="center">调整后的<br />注意力计算</Typography>
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
  return <section className="mxe-slide" aria-label="从展开 K、V 到矩阵吸收" data-mxe-step={step}>
    <Typography as="h1" variant="h1" align="center">{step === 0 ? '每轮都计算展开历史 KV 会增加计算开销' : step === finalStep ? '矩阵吸收，省去历史 K、V 的展开' : step === summaryStep ? '两次矩阵吸收，避免展开历史 K、V' : '沿着注意力计算，合并固定投影'}</Typography>
    {step === 0 ? <ExpansionProcess /> : step === finalStep ? <AbsorptionBenefit /> : step === summaryStep ? <AbsorptionSummary /> : <AbsorptionDerivation step={step - 1} />}
    <footer className="mxe-footer">
      <Button className="mxe-back" disabled={step === 0} onClick={event => {event.stopPropagation();navigate(-1);}}>← 播放上一步</Button>
      <Typography as="p" variant="h2" align="center" aria-live="polite">{step === 0 ? '现在是通过计算展开 KV 的过程' : step === finalStep ? '缓存保持低维，计算时也不必展开历史 K、V。' : step === summaryStep ? '固定权重提前合并，计算时直接使用潜在向量' : STEPS[step - 1].caption}</Typography>
      <Button className="mxe-forward" variant="primary" onClick={event => {
        event.stopPropagation();
        navigate(1);
      }}>{step === finalStep ? '重新播放 ↺' : '播放下一步 →'}</Button>
    </footer>
  </section>;
}
