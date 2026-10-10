import { useEffect, useRef, type ReactNode } from 'react';
import { ContentBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import { useLecturePlayback } from '../../components/LecturePlayback';
import x0 from '../../assets/forward-derivation/x0.png';
import x1 from '../../assets/forward-derivation/x1.png';
import x2 from '../../assets/forward-derivation/x2.png';
import xt from '../../assets/forward-derivation/xt.png';
import './ForwardDerivationPage.css';

type Mode = 'two-step' | 'merge' | 'direct';
export interface ForwardDerivationPageProps { onComplete?: () => void; }
const config = {
  'two-step': { title: '前向加噪：从一次加噪到连续两次', subtitle: '保留图像、加入噪声，再把第一步代入第二步。', count: 6 },
  merge: { title: '合并噪声：为什么两份可以变成一份？', subtitle: '独立高斯噪声相加，方差相加。', count: 4 },
  direct: { title: '直接采样：从原图得到第 t 步', subtitle: '累计保留比例，决定原图与噪声各占多少。', count: 5 },
};
const first = String.raw`x_1=\sqrt{\alpha_1}x_0+\sqrt{1-\alpha_1}\,\epsilon_1`;
const second = String.raw`x_2=\sqrt{\alpha_2}x_1+\sqrt{1-\alpha_2}\,\epsilon_2`;
const expanded = String.raw`x_2=\textcolor{#3468ce}{\sqrt{\alpha_1\alpha_2}x_0}+\textcolor{#31966a}{\sqrt{\alpha_2(1-\alpha_1)}\,\epsilon_1}+\textcolor{#bf7934}{\sqrt{1-\alpha_2}\,\epsilon_2}`;
const merged = String.raw`x_2=\sqrt{\alpha_1\alpha_2}x_0+\sqrt{1-\alpha_1\alpha_2}\,\epsilon`;
const direct = String.raw`x_t=\sqrt{\bar\alpha_t}x_0+\sqrt{1-\bar\alpha_t}\,\epsilon`;
function Reveal({ at, stage, children, className = '' }: { at: number; stage: number; children: ReactNode; className?: string }) {
  return <div className={`vg-forward-page__reveal ${className}`} data-reveal={at} data-visible={stage >= at} aria-hidden={stage < at}>{children}</div>;
}
function Formula({ latex, label }: { latex: string; label: string }) {
  return <div className="vg-forward-page__equation"><MathFormulaStatic latex={latex} aria-label={label} /></div>;
}
function Figure({ src, symbol, label }: { src: string; symbol: string; label: string }) {
  return <figure className="vg-forward-page__figure"><img src={src} alt={label} /><Typography as="figcaption" variant="bodySmall">{symbol} · {label}</Typography></figure>;
}
function Arrow({ label }: { label: string }) {
  return <div className="vg-forward-page__arrow"><Typography variant="bodySmall" tone="accent">{label}</Typography><span aria-hidden="true" /></div>;
}
function Timeline({ mode, stage }: { mode: Mode; stage: number }) {
  if (mode === 'direct') return <div className="vg-forward-page__routes">
    <div className="vg-forward-page__route"><Typography variant="bodySmall" tone="muted">逐步加噪</Typography><Figure src={x0} symbol="x₀" label="原图" /><Arrow label="加噪" /><Figure src={x1} symbol="x₁" label="第一步" /><Arrow label="重复加噪" /><Figure src={xt} symbol="xₜ" label="第 t 步" /></div>
    <Reveal at={1} stage={stage} className="vg-forward-page__route"><Typography variant="bodySmall" tone="accent">直接采样</Typography><Figure src={x0} symbol="x₀" label="原图" /><Arrow label="一次计算" /><Figure src={xt} symbol="xₜ" label="第 t 步示意" /></Reveal>
  </div>;
  return <div className={`vg-forward-page__timeline is-${mode}`}>
    <Figure src={x0} symbol="x₀" label="原图" />
    <Reveal at={mode === 'two-step' ? 1 : 0} stage={stage}><Arrow label="加入 ε₁" /></Reveal>
    <Reveal at={mode === 'two-step' ? 1 : 0} stage={stage}><Figure src={x1} symbol="x₁" label="第一次加噪" /></Reveal>
    <Reveal at={mode === 'two-step' ? 3 : 0} stage={stage}><Arrow label="加入 ε₂" /></Reveal><Reveal at={mode === 'two-step' ? 3 : 0} stage={stage}><Figure src={x2} symbol="x₂" label="第二次加噪" /></Reveal>
  </div>;
}
function EquationRow({ stage, at, label, latex, note }: { stage: number; at: number; label: string; latex: string; note?: string }) {
  return <Reveal at={at} stage={stage} className="vg-forward-page__row"><Typography variant="bodySmall" tone="accent">{label}</Typography><Formula latex={latex} label={label} />{note && <Typography variant="bodySmall" tone="muted">{note}</Typography>}</Reveal>;
}
function LessonBody({ mode, stage }: { mode: Mode; stage: number }) {
  if (mode === 'two-step') return <div className="vg-forward-page__combined">
    <Reveal at={1} stage={stage} className="vg-forward-page__annotated">
      <section><Typography variant="bodySmall" tone="accent">第一步：保留原图，再加入噪声</Typography><Formula latex={first} label="第一次加噪公式" /></section>
      <Reveal at={2} stage={stage} className="vg-forward-page__local-notes">
        <Typography variant="bodySmall">√α₁ 缩放原图，√(1 − α₁) 缩放噪声。</Typography>
        <Typography variant="bodySmall" tone="muted">α₁ = 1 − β₁；β₁ 控制本次噪声量。</Typography>
        <Typography variant="bodySmall" tone="muted">ε₁ ∼ 𝒩(0, I)：标准高斯噪声。</Typography>
      </Reveal>
    </Reveal>
    <Reveal at={3} stage={stage} className="vg-forward-page__annotated">
      <section><Typography variant="bodySmall" tone="accent">第二步：对 x₁ 继续加噪</Typography><Formula latex={second} label="第二次加噪公式" /></section>
      <div className="vg-forward-page__local-notes"><Typography variant="bodySmall">ε₂ 是新取的标准高斯噪声，与 ε₁ 独立。</Typography><Typography variant="bodySmall" tone="muted">α₂ = 1 − β₂：第二步的保留比例。</Typography></div>
    </Reveal>
    <Reveal at={4} stage={stage} className="vg-forward-page__expanded">
      <Typography variant="bodySmall" tone="accent">将第一步的 x₁ 代入第二步</Typography>
      <div className="vg-forward-page__term-equation" role="group" aria-label="两次加噪展开：一项原图加两项噪声">
        <Formula latex="x_2=" label="第二次加噪结果" />
        <section className="vg-forward-page__term"><Formula latex={String.raw`\textcolor{#3468ce}{\sqrt{\alpha_1\alpha_2}x_0}`} label="原图项" /><Reveal at={5} stage={stage}><Typography variant="bodySmall" tone="accent">原图：保留比例相乘</Typography></Reveal></section>
        <Formula latex="+" label="加" />
        <section className="vg-forward-page__term"><Formula latex={String.raw`\textcolor{#31966a}{\sqrt{\alpha_2(1-\alpha_1)}\,\epsilon_1}`} label="第一份噪声项" /><Reveal at={5} stage={stage}><Typography variant="bodySmall" tone="success">第一份噪声：再次缩放</Typography></Reveal></section>
        <Formula latex="+" label="加" />
        <section className="vg-forward-page__term"><Formula latex={String.raw`\textcolor{#bf7934}{\sqrt{1-\alpha_2}\,\epsilon_2}`} label="第二份噪声项" /><Reveal at={5} stage={stage}><Typography variant="bodySmall" tone="warning">第二份噪声：新加入</Typography></Reveal></section>
      </div>
    </Reveal>
  </div>;
  if (mode === 'merge') return <div className="vg-forward-page__merge-layout">
    <EquationRow stage={stage} at={0} label="两次加噪后的展开式" latex={expanded} />
    <div className="vg-forward-page__merge-columns">
      <EquationRow stage={stage} at={1} label="两份独立噪声的方差相加" latex={String.raw`\alpha_2(1-\alpha_1)+(1-\alpha_2)`} note="ε₁、ε₂ 均为标准高斯噪声；缩放后的方差等于系数的平方。" />
      <EquationRow stage={stage} at={2} label="化简累计噪声的方差" latex={String.raw`\alpha_2(1-\alpha_1)+(1-\alpha_2)=1-\alpha_1\alpha_2`} />
    </div>
    <Reveal at={3} stage={stage} className="vg-forward-page__merge-result">
      <section><Typography variant="bodySmall" tone="accent">合并成一份标准高斯噪声</Typography><Formula latex={merged} label="合并后的两次加噪公式" /></section>
      <section><Typography variant="bodySmall">ε ∼ 𝒩(0, I)：用一份标准高斯噪声表示。</Typography><Typography variant="bodySmall" tone="muted">合并前后分布相同，具体噪声样本不必相同。</Typography></section>
    </Reveal>
  </div>;
  return <div className="vg-forward-page__direct">
    <EquationRow stage={stage} at={0} label="ᾱₜ：经过 t 步后的累计保留比例" latex={String.raw`\bar\alpha_t=\alpha_1\alpha_2\cdots\alpha_t`} />
    <div className="vg-forward-page__direct-columns">
      <Reveal at={1} stage={stage} className="vg-forward-page__direct-block"><Typography variant="body" tone="accent">直接生成带噪图</Typography><Formula latex={direct} label="第 t 步直接采样公式" /><Reveal at={3} stage={stage}><Typography variant="bodySmall">x₀：原图；ε ∼ 𝒩(0, I)：标准高斯噪声。</Typography><Typography variant="bodySmall">√ᾱₜ 保留原图，√(1 − ᾱₜ) 缩放噪声。</Typography></Reveal></Reveal>
      <Reveal at={2} stage={stage} className="vg-forward-page__direct-block"><Typography variant="body" tone="accent">对应的条件分布</Typography><Formula latex={String.raw`q(x_t\mid x_0)=\mathcal N(\sqrt{\bar\alpha_t}x_0,(1-\bar\alpha_t)I)`} label="给定原图时第 t 步的分布" /><Reveal at={3} stage={stage}><Typography variant="bodySmall">q(xₜ | x₀)：已知原图时，带噪图的分布。</Typography><Typography variant="bodySmall">均值：√ᾱₜ x₀；方差：(1 − ᾱₜ) I。</Typography><Typography variant="bodySmall" tone="muted">I：单位矩阵，各像素的噪声独立。</Typography></Reveal></Reveal>
    </div>
    <Reveal at={4} stage={stage}><Typography variant="bodySmall" tone="accent">无需计算中间步骤，直接采样同一分布；两种路径的具体图像不必相同。</Typography></Reveal>
  </div>;
}
function ForwardLesson({ mode, onComplete }: ForwardDerivationPageProps & { mode: Mode }) {
  const lesson = config[mode];
  const { stage, controls } = useLecturePlayback(lesson.count, 1000);
  const completed = useRef(false);
  useEffect(() => { if (stage === lesson.count - 1 && !completed.current) { completed.current = true; onComplete?.(); } }, [stage, lesson.count, onComplete]);
  return <ContentBlock headingLevel={1} title={lesson.title} subtitle={lesson.subtitle} className="vg-forward-page" bodyClassName="vg-forward-page__body" data-mode={mode} data-stage={stage}>
    <Timeline mode={mode} stage={stage} />
    <LessonBody mode={mode} stage={stage} />
    <footer className="vg-forward-page__footer">{controls}</footer>
  </ContentBlock>;
}
export function ForwardDerivationPage(props: ForwardDerivationPageProps) { return <ForwardLesson mode="two-step" {...props} />; }
export function ForwardNoiseMergePage(props: ForwardDerivationPageProps) { return <ForwardLesson mode="merge" {...props} />; }
export function ForwardDirectSamplingPage(props: ForwardDerivationPageProps) { return <ForwardLesson mode="direct" {...props} />; }
