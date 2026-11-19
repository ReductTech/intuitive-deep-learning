import moduleAssetOutline from '../../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import { useEffect, useRef, type ReactNode } from 'react';
import { ContentBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import { useLecturePlayback } from '../../components/LecturePlayback';
import './ForwardDerivationPage.css';

const x0 = moduleAssetUrl("images/forward-derivation/x0.webp");
const x1 = moduleAssetUrl("images/forward-derivation/x1.webp");
const x2 = moduleAssetUrl("images/forward-derivation/x2.webp");
const xt = moduleAssetUrl("images/forward-derivation/xt.webp");

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
  return <div shuku-edit-id="e-e015dab9-1dce-45d8-ad59-7b784574ebf4" className={`vg-forward-page__reveal ${className}`} data-reveal={at} data-visible={stage >= at} aria-hidden={stage < at}>{children}</div>;
}
function Formula({ latex, label }: { latex: string; label: string }) {
  return <div shuku-edit-id="e-40a27bb0-08c5-4661-b7ce-24438b438684" className="vg-forward-page__equation"><MathFormulaStatic latex={latex} aria-label={label} /></div>;
}
function Figure({ src, symbol, label }: { src: string; symbol: string; label: string }) {
  return <figure shuku-edit-id="e-e23e54e4-8579-405b-8a07-6c722c56b0a7" className="vg-forward-page__figure"><img shuku-edit-id="e-490a2bd3-44a4-4a07-8ae0-bd2f597a8593" src={src} alt={label} /><Typography shuku-edit-id="e-24ad6f0a-e59b-4013-8f32-b46dcd0372db" as="figcaption" variant="bodySmall">{symbol} · {label}</Typography></figure>;
}
function Arrow({ label }: { label: string }) {
  return <div shuku-edit-id="e-8e893d94-4b6d-4932-9ecb-aab1a75a2139" className="vg-forward-page__arrow"><Typography shuku-edit-id="e-0fa44f50-c71b-450a-bcad-831246bc76f4" variant="bodySmall" tone="accent">{label}</Typography><span shuku-edit-id="e-fc81bbd2-6fe4-45d1-8305-232adc128ae0" aria-hidden="true" /></div>;
}
function Timeline({ mode, stage }: { mode: Mode; stage: number }) {
  if (mode === 'direct') return <div shuku-edit-id="e-319a9e59-db06-4880-851c-dfaccaaa9298" className="vg-forward-page__routes">
    <div shuku-edit-id="e-beef0cff-400a-4248-b581-e05dbe5f1f57" className="vg-forward-page__route"><Typography shuku-edit-id="e-783378bb-3066-44ed-b4ce-3edd90f469d1" variant="bodySmall" tone="muted">逐步加噪</Typography><Figure src={x0} symbol="x₀" label="原图" /><Arrow label="加噪" /><Figure src={x1} symbol="x₁" label="第一步" /><Arrow label="重复加噪" /><Figure src={xt} symbol="xₜ" label="第 t 步" /></div>
    <Reveal at={1} stage={stage} className="vg-forward-page__route"><Typography shuku-edit-id="e-2b787e98-b161-4422-a453-33a434fc3328" variant="bodySmall" tone="accent">直接采样</Typography><Figure src={x0} symbol="x₀" label="原图" /><Arrow label="一次计算" /><Figure src={xt} symbol="xₜ" label="第 t 步示意" /></Reveal>
  </div>;
  return <div shuku-edit-id="e-763599a7-475c-4e2e-b97b-510b56e4d7ca" className={`vg-forward-page__timeline is-${mode}`}>
    <Figure src={x0} symbol="x₀" label="原图" />
    <Reveal at={mode === 'two-step' ? 1 : 0} stage={stage}><Arrow label="加入 ε₁" /></Reveal>
    <Reveal at={mode === 'two-step' ? 1 : 0} stage={stage}><Figure src={x1} symbol="x₁" label="第一次加噪" /></Reveal>
    <Reveal at={mode === 'two-step' ? 3 : 0} stage={stage}><Arrow label="加入 ε₂" /></Reveal><Reveal at={mode === 'two-step' ? 3 : 0} stage={stage}><Figure src={x2} symbol="x₂" label="第二次加噪" /></Reveal>
  </div>;
}
function EquationRow({ stage, at, label, latex, note }: { stage: number; at: number; label: string; latex: string; note?: string }) {
  return <Reveal at={at} stage={stage} className="vg-forward-page__row"><Typography shuku-edit-id="e-dba252bd-0da8-4da7-b066-c0207c8d99fa" variant="bodySmall" tone="accent">{label}</Typography><Formula latex={latex} label={label} />{note && <Typography shuku-edit-id="e-3c1ef892-cc43-41bc-9a49-d87507c0d0b6" variant="bodySmall" tone="muted">{note}</Typography>}</Reveal>;
}
function LessonBody({ mode, stage }: { mode: Mode; stage: number }) {
  if (mode === 'two-step') return <div shuku-edit-id="e-e4a83894-676b-4ced-bbde-b99c920ee825" className="vg-forward-page__combined">
    <Reveal at={1} stage={stage} className="vg-forward-page__annotated">
      <section shuku-edit-id="e-164d2371-c028-48a2-a07a-50a07cc07fea"><Typography shuku-edit-id="e-4f623a11-5195-485f-b23c-76806acb6182" variant="bodySmall" tone="accent">第一步：保留原图，再加入噪声</Typography><Formula latex={first} label="第一次加噪公式" /></section>
      <Reveal at={2} stage={stage} className="vg-forward-page__local-notes">
        <Typography shuku-edit-id="e-3d011c74-d776-4e73-8d44-34d0f0737fe8" variant="bodySmall">√α₁ 缩放原图，√(1 − α₁) 缩放噪声。</Typography>
        <Typography shuku-edit-id="e-1d4c5abb-5f55-4dde-a8a7-00a3f1788ca8" variant="bodySmall" tone="muted">α₁ = 1 − β₁；β₁ 控制本次噪声量。</Typography>
        <Typography shuku-edit-id="e-5f6a9543-cb8b-483e-8bc2-0c5bbd9c9d93" variant="bodySmall" tone="muted">ε₁ ∼ 𝒩(0, I)：标准高斯噪声。</Typography>
      </Reveal>
    </Reveal>
    <Reveal at={3} stage={stage} className="vg-forward-page__annotated">
      <section shuku-edit-id="e-f3607b97-c380-4dcd-a04a-a665ffd93c04"><Typography shuku-edit-id="e-088eb1b0-1a9b-4954-a1c3-da4657e4d48c" variant="bodySmall" tone="accent">第二步：对 x₁ 继续加噪</Typography><Formula latex={second} label="第二次加噪公式" /></section>
      <div shuku-edit-id="e-40b6a36a-55d9-4f13-9ae3-05431840cc1f" className="vg-forward-page__local-notes"><Typography shuku-edit-id="e-df5ce654-7ddc-402d-96e4-883fafcd596f" variant="bodySmall">ε₂ 是新取的标准高斯噪声，与 ε₁ 独立。</Typography><Typography shuku-edit-id="e-0345dcb2-a7e8-4b44-8873-a4de70c437d9" variant="bodySmall" tone="muted">α₂ = 1 − β₂：第二步的保留比例。</Typography></div>
    </Reveal>
    <Reveal at={4} stage={stage} className="vg-forward-page__expanded">
      <Typography shuku-edit-id="e-62862f43-9584-4b55-8c67-478420db020d" variant="bodySmall" tone="accent">将第一步的 x₁ 代入第二步</Typography>
      <div shuku-edit-id="e-026fa5e6-69f8-46d7-8444-941d84518b80" className="vg-forward-page__term-equation" role="group" aria-label="两次加噪展开：一项原图加两项噪声">
        <Formula latex="x_2=" label="第二次加噪结果" />
        <section shuku-edit-id="e-ba66fb67-3714-451a-917b-aa331375847b" className="vg-forward-page__term"><Formula latex={String.raw`\textcolor{#3468ce}{\sqrt{\alpha_1\alpha_2}x_0}`} label="原图项" /><Reveal at={5} stage={stage}><Typography shuku-edit-id="e-93ed1ae3-b30f-4e37-a6c5-1811f130faf3" variant="bodySmall" tone="accent">原图：保留比例相乘</Typography></Reveal></section>
        <Formula latex="+" label="加" />
        <section shuku-edit-id="e-6301a54a-7044-435a-8d49-95197f55d766" className="vg-forward-page__term"><Formula latex={String.raw`\textcolor{#31966a}{\sqrt{\alpha_2(1-\alpha_1)}\,\epsilon_1}`} label="第一份噪声项" /><Reveal at={5} stage={stage}><Typography shuku-edit-id="e-54f31e03-ea09-401e-906f-5cf5d294eb3c" variant="bodySmall" tone="success">第一份噪声：再次缩放</Typography></Reveal></section>
        <Formula latex="+" label="加" />
        <section shuku-edit-id="e-ba412362-6a2c-46c9-b377-402b631cb9f2" className="vg-forward-page__term"><Formula latex={String.raw`\textcolor{#bf7934}{\sqrt{1-\alpha_2}\,\epsilon_2}`} label="第二份噪声项" /><Reveal at={5} stage={stage}><Typography shuku-edit-id="e-9703727a-6c90-4c8c-91a3-496705fb451a" variant="bodySmall" tone="warning">第二份噪声：新加入</Typography></Reveal></section>
      </div>
    </Reveal>
  </div>;
  if (mode === 'merge') return <div shuku-edit-id="e-aa501674-2f77-4972-8fc8-3dc77e161a6e" className="vg-forward-page__merge-layout">
    <EquationRow stage={stage} at={0} label="两次加噪后的展开式" latex={expanded} />
    <div shuku-edit-id="e-de0cad99-dce9-4377-a8a7-f6f2adcb9075" className="vg-forward-page__merge-columns">
      <EquationRow stage={stage} at={1} label="两份独立噪声的方差相加" latex={String.raw`\alpha_2(1-\alpha_1)+(1-\alpha_2)`} note="ε₁、ε₂ 均为标准高斯噪声；缩放后的方差等于系数的平方。" />
      <EquationRow stage={stage} at={2} label="化简累计噪声的方差" latex={String.raw`\alpha_2(1-\alpha_1)+(1-\alpha_2)=1-\alpha_1\alpha_2`} />
    </div>
    <Reveal at={3} stage={stage} className="vg-forward-page__merge-result">
      <section shuku-edit-id="e-3f87f728-f66e-49f3-8039-414bdc964d1c"><Typography shuku-edit-id="e-5af13eac-9ab9-4ca2-86ce-ca38d30e26e7" variant="bodySmall" tone="accent">合并成一份标准高斯噪声</Typography><Formula latex={merged} label="合并后的两次加噪公式" /></section>
      <section shuku-edit-id="e-403a914b-e194-4d48-926f-158044a22be8"><Typography shuku-edit-id="e-a3e62127-ae9c-43fd-a2ff-dd24b54e148c" variant="bodySmall">ε ∼ 𝒩(0, I)：用一份标准高斯噪声表示。</Typography><Typography shuku-edit-id="e-e31701c5-7d14-43a7-b610-e133f9e384b1" variant="bodySmall" tone="muted">合并前后分布相同，具体噪声样本不必相同。</Typography></section>
    </Reveal>
  </div>;
  return <div shuku-edit-id="e-f8feab3f-015e-46b0-83f5-362e2eda0cc1" className="vg-forward-page__direct">
    <EquationRow stage={stage} at={0} label="ᾱₜ：经过 t 步后的累计保留比例" latex={String.raw`\bar\alpha_t=\alpha_1\alpha_2\cdots\alpha_t`} />
    <div shuku-edit-id="e-f3129602-6cdc-4eb0-ab00-c58e28e902d6" className="vg-forward-page__direct-columns">
      <Reveal at={1} stage={stage} className="vg-forward-page__direct-block"><Typography shuku-edit-id="e-dca10b54-42fb-458a-b89c-4b95d4061ba0" variant="body" tone="accent">直接生成带噪图</Typography><Formula latex={direct} label="第 t 步直接采样公式" /><Reveal at={3} stage={stage}><Typography shuku-edit-id="e-24231ec2-9ab5-4999-8d74-55caa38d2cae" variant="bodySmall">x₀：原图；ε ∼ 𝒩(0, I)：标准高斯噪声。</Typography><Typography shuku-edit-id="e-bcfe3757-1e03-46ea-8a62-1d6d0258540a" variant="bodySmall">√ᾱₜ 保留原图，√(1 − ᾱₜ) 缩放噪声。</Typography></Reveal></Reveal>
      <Reveal at={2} stage={stage} className="vg-forward-page__direct-block"><Typography shuku-edit-id="e-bb1ad6f2-a321-4ddc-9500-8cce8920658d" variant="body" tone="accent">对应的条件分布</Typography><Formula latex={String.raw`q(x_t\mid x_0)=\mathcal N(\sqrt{\bar\alpha_t}x_0,(1-\bar\alpha_t)I)`} label="给定原图时第 t 步的分布" /><Reveal at={3} stage={stage}><Typography shuku-edit-id="e-65d3ab19-f4eb-45b6-b739-8f49ca53bd2b" variant="bodySmall">q(xₜ | x₀)：已知原图时，带噪图的分布。</Typography><Typography shuku-edit-id="e-8bc85599-b162-4247-aea3-abf2311c8c71" variant="bodySmall">均值：√ᾱₜ x₀；方差：(1 − ᾱₜ) I。</Typography><Typography shuku-edit-id="e-80a4dcc6-b6a3-47cf-8a27-0b1031b9cd97" variant="bodySmall" tone="muted">I：单位矩阵，各像素的噪声独立。</Typography></Reveal></Reveal>
    </div>
    <Reveal at={4} stage={stage}><Typography shuku-edit-id="e-1cec1208-628e-45cb-b297-3445cc4990f7" variant="bodySmall" tone="accent">无需计算中间步骤，直接采样同一分布；两种路径的具体图像不必相同。</Typography></Reveal>
  </div>;
}
function ForwardLesson({ mode, onComplete }: ForwardDerivationPageProps & { mode: Mode }) {
  const lesson = config[mode];
  const { stage, controls } = useLecturePlayback(lesson.count, 1000);
  const completed = useRef(false);
  useEffect(() => { if (stage === lesson.count - 1 && !completed.current) { completed.current = true; onComplete?.(); } }, [stage, lesson.count, onComplete]);
  return <ContentBlock shuku-edit-id="e-1982e15c-ed2f-4856-a719-336fc88a7ea5" headingLevel={1} title={lesson.title} subtitle={lesson.subtitle} className="vg-shared-page vg-forward-page" bodyClassName="vg-forward-page__body" data-mode={mode} data-stage={stage}>
    <Timeline mode={mode} stage={stage} />
    <LessonBody mode={mode} stage={stage} />
    <footer shuku-edit-id="e-e2cb2496-0859-4718-87f1-ef263b1b2e2a" className="vg-forward-page__footer">{controls}</footer>
  </ContentBlock>;
}
export function ForwardDerivationPage(props: ForwardDerivationPageProps) { return <ForwardLesson mode="two-step" {...props} />; }
export function ForwardNoiseMergePage(props: ForwardDerivationPageProps) { return <ForwardLesson mode="merge" {...props} />; }
export function ForwardDirectSamplingPage(props: ForwardDerivationPageProps) { return <ForwardLesson mode="direct" {...props} />; }
