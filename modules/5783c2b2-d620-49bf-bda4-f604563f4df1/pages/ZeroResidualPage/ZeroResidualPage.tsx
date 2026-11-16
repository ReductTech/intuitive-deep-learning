import { useState, type KeyboardEvent } from 'react';
import { ContentBlock, RangeControl, Typography, type QuestionCheckResult } from "@shuku/course-style/react";
import { RtgQuestion } from '../../components/RtgQuestion/RtgQuestion';
import { useCompleteOnce } from '../../hooks/useCompleteOnce';
import './ZeroResidualPage.css';

const input = [2, 1, 0, 0, 2, 1, 1, 0, 2];
const residual = [-1, 2, 0, 1, -3, 2, 0, 1, -4];
const format = (value: number) => String(Math.round(value * 10) / 10);
const signed = (value: number) => value < 0 ? `(${format(value)})` : format(value);

function Matrix({ id, title, values, selected, onSelect, matched }: { id: string; title: string; values: number[]; selected: number; onSelect: (index: number) => void; matched: boolean }) {
  function navigate(event: KeyboardEvent<HTMLDivElement>) {
    const button = (event.target as Element).closest<HTMLButtonElement>('[data-cell]');
    if (!button || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault(); event.stopPropagation();
    const index = Number(button.dataset.cell);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? 8 : (index + ({ ArrowLeft: 8, ArrowRight: 1, ArrowUp: 6, ArrowDown: 3 }[event.key] ?? 0)) % 9;
    onSelect(next); event.currentTarget.querySelector<HTMLButtonElement>(`[data-cell="${next}"]`)?.focus({ preventScroll: true });
  }
  return <article shuku-edit-id="e-532f1628-d0dc-4a46-b9da-1635b02ed029" className={`rtg-zero-residual__matrix-block is-${id}${matched ? ' is-matched' : ''}`} data-matrix={id}>
    <Typography shuku-edit-id="e-4d5b083e-8e72-40ab-9fe4-29331095bb99" as="h2" variant="bodySmall" tone={id === 'residual' ? 'warning' : 'accent'}>{title}</Typography>
    <div shuku-edit-id="e-e2d44f8f-da6d-427e-8163-ef059d2ea80a" className="rtg-zero-residual__matrix-viewport"><div shuku-edit-id="e-e048862b-4c46-44c9-8550-f77f1f122f24" className="rtg-zero-residual__matrix" role="group" aria-label={title} onKeyDown={navigate}>
      {values.map((value, index) => <button shuku-edit-id="e-619b9f7f-7b36-4279-afed-634767f8cbb5" type="button" key={index} data-cell={index} data-number={format(value)} className={selected === index ? 'is-selected' : ''} aria-pressed={selected === index}
        aria-label={`${title}，第${Math.floor(index / 3) + 1}行第${index % 3 + 1}列，${format(value)}`} onClick={() => onSelect(index)} onPointerEnter={() => onSelect(index)} onFocus={() => onSelect(index)}><Typography shuku-edit-id="e-4b1f0d49-ad2f-4d80-877e-2fa009e34e67" as="span" variant="body" tone="inherit">{format(value)}</Typography></button>)}
    </div></div>
  </article>;
}

export interface ZeroResidualPageProps { onComplete?: () => void; }
export function ZeroResidualPage({ onComplete }: ZeroResidualPageProps) {
  const [strength, setStrength] = useState(100);
  const [selected, setSelected] = useState(4);
  const [visitedZero, setVisitedZero] = useState(false);
  const [result, setResult] = useState<QuestionCheckResult | null>(null);
  const [attempt, setAttempt] = useState(0);
  const scaled = residual.map(value => value * strength / 100);
  const output = input.map((value, index) => value + scaled[index]);
  const atZero = strength === 0;
  const complete = visitedZero && Boolean(result?.ok);
  useCompleteOnce(complete, onComplete);
  function change(value: number) { setStrength(value); if (value === 0) setVisitedZero(true); }
  function restart() { setStrength(100); setSelected(4); setVisitedZero(false); setResult(null); setAttempt(value => value + 1); }

  return <ContentBlock shuku-edit-id="e-69ecb9bf-3728-4fd7-badc-84556cd7f90f" headingLevel={1} className="rtg-zero-residual" data-strength={strength} data-selected={selected} data-complete={complete} data-visited-zero={visitedZero}
    title="当残差分支输出为 0，信息会消失吗？" subtitle="固定快捷路径，让修正逐渐归零；观察输入与相加结果能否逐项重合。"
    onKeyDown={event => {
      if ((event.key === ' ' || event.key === 'Enter') && (event.target as Element).closest('button')) { event.stopPropagation(); if (event.repeat) event.preventDefault(); }
      if ((event.target as Element).matches('input[type="range"]')) event.stopPropagation();
    }}>
    <div shuku-edit-id="e-b00a4cfc-c4f8-493c-b149-e64e6fa940d7" className="rtg-zero-residual__toolbar"><Typography shuku-edit-id="e-14595eb8-0912-4e85-bd0f-2bea69e7ff04" variant="bodySmall" tone="accent">恒等映射验证台 · 只调整中间的修正</Typography><div shuku-edit-id="e-4040078e-ad51-4f96-8f38-cd7cf45485a4" className="rtg-zero-residual__presets" role="group" aria-label="修正强度预设">{[100, 50, 0].map(value => <button shuku-edit-id="e-ba4a2f3a-0865-4d20-83fd-bd8723ee7405" key={value} type="button" data-strength-preset={value} aria-pressed={strength === value} onClick={() => change(value)}><Typography shuku-edit-id="e-9ae2ad2c-81a2-4d9e-b603-668cde76561a" as="span" variant="bodySmall" tone="inherit">{value}%</Typography></button>)}</div><button shuku-edit-id="e-e3a11610-efe7-4be0-af68-21f84f2d4d61" type="button" className="rtg-zero-residual__reset" onClick={restart}><Typography shuku-edit-id="e-98d24cdd-65cf-4e25-a7c2-2286692c83a5" as="span" variant="bodySmall" tone="inherit">↶ 重新验证</Typography></button></div>
    <section shuku-edit-id="e-60c2e587-2aeb-49c1-82d8-2e9e9bdeb5a7" className={`rtg-zero-residual__lab${atZero ? ' is-zero' : ''}`} aria-label="输入加上残差修正，得到相加结果">
      <div shuku-edit-id="e-9fb2a702-b305-4228-857c-a092b0165ba4" className="rtg-zero-residual__matrices">
        <Matrix id="input" title="输入 x" values={input} selected={selected} onSelect={setSelected} matched={atZero} />
        <Typography shuku-edit-id="e-b27b8dc1-1204-4404-92fb-67483605a243" as="span" variant="h2" tone="muted" className="rtg-zero-residual__operator">+</Typography>
        <Matrix id="residual" title="修正 λF(x)" values={scaled} selected={selected} onSelect={setSelected} matched={false} />
        <Typography shuku-edit-id="e-b877f8cc-d1bf-4b2e-b590-08135aba0907" as="span" variant="h2" tone="muted" className="rtg-zero-residual__operator">=</Typography>
        <Matrix id="output" title="相加结果 H(x)" values={output} selected={selected} onSelect={setSelected} matched={atZero} />
      </div>
      <div shuku-edit-id="e-3d417ad6-daeb-42bf-9673-bf1369de0c03" className="rtg-zero-residual__controls">
        <Typography shuku-edit-id="e-9fe7b467-6b31-4df9-89cc-607a63c1a1b6" as="code" variant="bodySmall" tone="accent">x 的系数始终为 1</Typography>
        <RangeControl label="修正强度 λ" min={0} max={100} step={10} value={strength} suffix="%" aria-label="修正强度" onChange={event => change(Number(event.currentTarget.value))} />
        <Typography shuku-edit-id="e-c4c8a47d-aed3-40fa-bd96-06ba7752d186" as="code" variant="bodySmall" tone={atZero ? 'success' : 'accent'}>{atZero ? 'x + 0 = x' : 'H(x) = x + λF(x)'}</Typography>
      </div>
    </section>
    <div shuku-edit-id="e-a03b88e4-302f-4a96-afbe-13a893b3abcd" className="rtg-zero-residual__checkpoint">
      {complete ? <div shuku-edit-id="e-66c04f34-6601-4387-82bb-febc7bc6abd1" className="rtg-zero-residual__insight is-complete"><Typography shuku-edit-id="e-412ce541-7386-41d5-a6c2-36e0904b5f01" as="h2" variant="body" tone="success">已验证：修正为 0 时，原信息仍然保留</Typography><Typography shuku-edit-id="e-7d9f3adc-e90c-472c-8622-4b421c807fd7" variant="bodySmall" tone="muted">归零的是残差分支的贡献，快捷路径仍将输入送到相加节点。可以继续拖动滑杆对照。</Typography></div>
      : visitedZero ? <RtgQuestion key={attempt} pageId="c7c016d8-8eb6-4880-8631-da52f831ff3f" questionId={`zero-result-attempt-${attempt}`} className="rtg-zero-residual__question" type="choice" typeLabel="理解检查" title="修正为 0 时，为什么输入没有消失？" answer="shortcut" options={[
        { key: <Typography shuku-edit-id="e-87591c97-44df-4f73-bd9c-58273f98513a" as="span" variant="bodySmall" tone="inherit" className="rtg-zero-residual__letter">A</Typography>, value: 'shortcut', label: '快捷路径仍将 x 送到相加节点' },
        { key: <Typography shuku-edit-id="e-55c399df-81ab-4ebe-9060-84230fc464f6" as="span" variant="bodySmall" tone="inherit" className="rtg-zero-residual__letter">B</Typography>, value: 'guess', label: '残差分支重新猜测了输入 x' },
        { key: <Typography shuku-edit-id="e-3b593168-163d-42bf-b36d-6acd3f60b7d3" as="span" variant="bodySmall" tone="inherit" className="rtg-zero-residual__letter">C</Typography>, value: 'label', label: '训练标签直接补回了输入 x' },
      ]} showFeedback={result?.ok === false} feedback={{ wrong: '请回看快捷路径：修正为 0，并不会切断输入 x 的传递。' }} onCheck={setResult} />
      : <div shuku-edit-id="e-b4950234-574b-4943-9188-5d753f6e7ce0" className="rtg-zero-residual__insight"><Typography shuku-edit-id="e-1d012aca-df8a-4867-957b-d5ac0b5d984f" as="h2" variant="body" tone="accent">同一位置：{format(input[selected])} + {signed(scaled[selected])} = {format(output[selected])}</Typography><Typography shuku-edit-id="e-122bc845-8a12-4b22-9186-9329e3b148fd" variant="bodySmall" tone="muted">点击任意格，联动检查同一位置。把中间的修正强度拖到 0%，观察左右矩阵。</Typography></div>}
    </div>
  </ContentBlock>;
}
