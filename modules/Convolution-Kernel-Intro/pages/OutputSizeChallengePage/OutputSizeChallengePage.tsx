import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import './OutputSizeChallengePage.css';

type Challenge = { id: string; label: string; input: number; target: number; hint: string; solutions: string[] };
const challenges: Challenge[] = [
  { id: 'shrink', label: '边缘被舍去', input: 7, target: 5, hint: '不补零、每次移动一格，会得到什么尺寸？', solutions: ['3-0-1'] },
  { id: 'same', label: '尺寸保持不变', input: 7, target: 7, hint: '让 3×3 卷积核访问边缘，同时保持输出大小。', solutions: ['3-1-1', '5-2-1', '7-3-1'] },
  { id: 'jump', label: '大步跳跃', input: 8, target: 2, hint: '固定 3×3 卷积核，不补零，每次跳得更远。', solutions: ['3-0-3'] },
];
const kernelOptions = [3, 5, 7];
const paddingOptions = [0, 1, 2, 3];
const strideOptions = [1, 2, 3];

function outputSize(input: number, kernel: number, padding: number, stride: number) {
  return Math.floor((input + 2 * padding - kernel) / stride) + 1;
}

function MiniGrid({ size, target, active = false }: { size: number; target?: number; active?: boolean }) {
  const count = Math.min(size, 12);
  return <div className={`ck-challenge__mini-grid ${active ? 'is-active' : ''}`} style={{ '--mini-size': count } as CSSProperties}>{Array.from({ length: count * count }, (_, index) => <span key={index} className={index < (target ? Math.max(1, Math.floor(count * count / (size * size) * target * target)) : 0) ? 'is-marked' : ''} />)}</div>;
}

export function OutputSizeChallengePage() {
  const [challengeId, setChallengeId] = useState(challenges[0].id);
  const [kernel, setKernel] = useState(3);
  const [padding, setPadding] = useState(0);
  const [stride, setStride] = useState(1);
  const [checked, setChecked] = useState(false);
  const challenge = challenges.find((item) => item.id === challengeId) ?? challenges[0];
  const result = outputSize(challenge.input, kernel, padding, stride);
  const key = `${kernel}-${padding}-${stride}`;
  const matches = result === challenge.target;
  const exact = challenge.solutions.includes(key);
  const formula = useMemo(() => `${challenge.input} + 2×${padding} − ${kernel}`, [challenge, kernel, padding]);
  const selectChallenge = (id: string) => { setChallengeId(id); setChecked(false); };
  return <ContentBlock headingLevel={1} className="ck-challenge" title="输出尺寸侦探：找到一组参数" subtitle="输入和输出已经确定。请选择卷积核大小、Padding 与 Stride，让公式成立。">
    <div className="ck-challenge__story"><span className="ck-challenge__story-mark">01</span><Typography variant="body" tone="accent">每一关都有一张输入图像和一张目标特征图。你的任务，是找出能把左边变成右边的参数组合。</Typography><Typography variant="bodySmall" tone="muted">有些关卡不止一个答案。</Typography></div>
    <div className="ck-challenge__body">
      <aside className="ck-challenge__chapters"><Typography variant="bodySmall" tone="muted">选择关卡</Typography>{challenges.map((item, index) => <button type="button" key={item.id} className={challenge.id === item.id ? 'is-selected' : ''} onClick={() => selectChallenge(item.id)}><span>{String(index + 1).padStart(2, '0')}</span><Typography as="span" variant="bodySmall" tone="inherit">{item.label}</Typography></button>)}</aside>
      <section className="ck-challenge__work"><div className="ck-challenge__dimension-row"><div><Typography variant="bodySmall" tone="muted">输入图像</Typography><Typography as="strong" variant="h2" tone="accent">{challenge.input}×{challenge.input}</Typography><MiniGrid size={challenge.input} target={challenge.input} /></div><Typography as="span" variant="h2" tone="accent" aria-hidden="true">→</Typography><div><Typography variant="bodySmall" tone="muted">目标输出</Typography><Typography as="strong" variant="h2" tone="accent">{challenge.target}×{challenge.target}</Typography><MiniGrid size={challenge.target} target={challenge.target} active /></div></div><div className="ck-challenge__controls"><label><Typography variant="bodySmall" tone="muted">Kernel size K</Typography><select value={kernel} onChange={(event) => { setKernel(Number(event.target.value)); setChecked(false); }}>{kernelOptions.map((value) => <option key={value} value={value}>{value}×{value}</option>)}</select></label><label><Typography variant="bodySmall" tone="muted">Padding P</Typography><select value={padding} onChange={(event) => { setPadding(Number(event.target.value)); setChecked(false); }}>{paddingOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label><Typography variant="bodySmall" tone="muted">Stride S</Typography><select value={stride} onChange={(event) => { setStride(Number(event.target.value)); setChecked(false); }}>{strideOptions.map((value) => <option key={value} value={value}>{value}</option>)}</select></label><button type="button" className="ck-challenge__check" onClick={() => setChecked(true)}>检查答案</button></div><div className="ck-challenge__formula"><Typography variant="bodySmall" tone="muted">当前计算</Typography><MathFormulaBlock ariaLabel="当前输出尺寸计算"><MathFormulaStatic latex={String.raw`H_{out}=\left\lfloor\frac{${formula}}{${stride}}\right\rfloor+1=${result}`} /></MathFormulaBlock></div><div className={`ck-challenge__feedback ${checked ? (matches && exact ? 'is-correct' : matches ? 'is-alternative' : 'is-wrong') : ''}`} aria-live="polite"><Typography variant="body" tone="inherit">{!checked ? challenge.hint : matches && exact ? '匹配！这组参数正好得到目标尺寸。' : matches ? '输出尺寸匹配，还有其他可行组合，可以继续探索。' : `还差一点：当前输出为 ${result}×${result}，目标是 ${challenge.target}×${challenge.target}。`}</Typography></div></section>
    </div>
    <footer className="ck-challenge__footer"><Typography as="span" variant="bodySmall" tone="muted">统一公式</Typography><MathFormulaBlock ariaLabel="卷积输出尺寸统一公式"><MathFormulaStatic latex={String.raw`H_{out}=\left\lfloor\frac{H_{in}+2P-K}{S}\right\rfloor+1`} /></MathFormulaBlock><Typography variant="bodySmall" tone="muted">下一页：把三类参数放在同一张尺寸地图里。</Typography></footer>
  </ContentBlock>;
}
