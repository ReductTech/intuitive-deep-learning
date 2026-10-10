import { useEffect, useId, useRef, type ReactNode } from 'react';
import { ContentBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import { useLecturePlayback } from '../../components/LecturePlayback';
import noise from '../../assets/gan-training/noise.png';
import realPortrait from '../../assets/gan-training/real-portrait.png';
import generatedPortrait from '../../assets/gan-training/generated-portrait.png';
import './GanTrainingPage.css';

type Mode = 'd' | 'g' | 'cycle';
const lessons = {
  d: { title: '训练判别器 D：真图判真，生成图判假', subtitle: '固定 G，只更新 D。' },
  g: { title: '训练生成器 G：让生成图获得高分', subtitle: '固定 D，只更新 G。' },
  cycle: { title: '交替训练：D 与 G 轮流更新', subtitle: '每次更新一个网络，再用更新后的模型继续下一轮。' },
} as const;
const stageCount = 5;
const cycleDetails = [
  'D 学习区分真假，G 学习生成更逼真的样本。它们有各自的训练目标。',
  '先固定 G，训练 D：真实图判真，生成图判假。',
  '再固定更新后的 D，训练 G：让生成图获得更高的真实评分。',
  '更新后的 G 产生新样本，再交给 D 学习判断；重复这两个动作。',
  '接下来亲手观察：更新 D 改变判断，更新 G 改变生成样本。',
];

function Reveal({ show, className = '', children }: { show: boolean; className?: string; children: ReactNode }) {
  return <div className={`vg-gan-train__reveal ${className}`} data-visible={show} aria-hidden={!show}>{children}</div>;
}
function Network({ kind, fixed, updating = false }: { kind: 'G' | 'D'; fixed: boolean; updating?: boolean }) {
  const color = kind === 'G' ? '#359361' : '#d95a64';
  return <div className={`vg-gan-train__network is-${kind.toLowerCase()}`} data-network={kind} data-fixed={fixed} data-updating={updating}>
    <Typography as="h2" variant="body">{kind === 'G' ? '生成器 G' : '判别器 D'}</Typography>
    <svg viewBox="0 0 140 100" aria-hidden="true">
      {[0, 1, 2, 3].map(i => <g key={i} transform={`translate(${12 + i * 28} ${kind === 'G' ? 28 - i * 6 : 10 + i * 6})`}>
        <path d="M0 8 L8 0 H27 L19 8 Z" fill={color} opacity=".45" />
        <path d={`M19 8 L27 0 V${kind === 'G' ? 42 + i * 8 : 66 - i * 8} L19 ${kind === 'G' ? 50 + i * 8 : 74 - i * 8} Z`} fill={color} opacity=".85" />
        <rect x="0" y="8" width="19" height={kind === 'G' ? 42 + i * 8 : 66 - i * 8} fill={color} opacity=".65" />
      </g>)}
    </svg>
    <Typography variant="bodySmall" tone={fixed ? 'muted' : kind === 'G' ? 'success' : 'danger'}>{fixed ? '参数固定' : updating ? '更新参数' : '本轮训练'}</Typography>
  </div>;
}
function Sample({ image, label, note }: { image: string; label: string; note?: ReactNode }) {
  return <figure className="vg-gan-train__sample"><Typography as="figcaption" variant="bodySmall">{label}</Typography><img src={image} alt={label} />{note && <Typography variant="bodySmall" tone="muted" className="vg-gan-train__sample-note">{note}</Typography>}</figure>;
}

function TrainingDiagram({ mode, stage }: { mode: 'd' | 'g'; stage: number }) {
  const id = useId().replaceAll(':', '');
  const judge = stage >= 1;
  const fakeJudged = stage >= (mode === 'd' ? 2 : 1);
  return <div className={`vg-gan-train__diagram is-${mode}`} role="group" aria-label={mode === 'd' ? '真实与生成两类样本分别进入同一个判别器' : '生成器接收经过固定判别器的梯度反馈'}>
    <svg className="vg-gan-train__wires" viewBox="0 0 1400 350" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <marker id={`${id}-forward`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#66839f" /></marker>
        <marker id={`${id}-feedback`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill={mode === 'd' ? '#d95a64' : '#359361'} /></marker>
      </defs>
      <g fill="none" stroke="#66839f" strokeWidth="3" markerEnd={`url(#${id}-forward)`}>
        <path d={mode === 'd' ? 'M168 215 H280' : 'M168 140 H280'} /><path d={mode === 'd' ? 'M448 215 H560' : 'M448 140 H560'} />
        {mode === 'd' && stage >= 1 && <path d="M728 65 H800 Q820 65 820 90 V125 H896" />}
        {fakeJudged && <path d={mode === 'd' ? 'M728 215 H800 Q820 215 820 185 V175 H896' : 'M728 140 H896'} />}
        {mode === 'd' && stage >= 1 && <path d="M1064 125 H1110 Q1120 125 1120 90 V65 H1190" />}
        {fakeJudged && <path d={mode === 'd' ? 'M1064 175 H1110 Q1120 175 1120 205 V215 H1190' : 'M1064 140 H1190'} />}
      </g>
      <g fill="none" stroke={mode === 'd' ? '#d95a64' : '#359361'} strokeWidth="3" strokeDasharray="9 6" markerEnd={`url(#${id}-feedback)`}>
        {mode === 'd' && stage >= 4 && <path d="M1280 330 H980 V250" />}
        {mode === 'g' && stage >= 3 && <><path d="M1280 250 V280 H1068 V240 H1064" /><path d="M980 284 V330 H364 V284" /></>}
      </g>
    </svg>
    <Reveal show className="vg-gan-train__noise"><Sample image={noise} label="随机噪声 z" note={<>z ∼ p<sub>z</sub>：噪声中取样</>} /></Reveal>
    <Reveal show className="vg-gan-train__g"><Network kind="G" fixed={mode === 'd'} updating={mode === 'g' && stage >= 4} /></Reveal>
    <Reveal show className="vg-gan-train__fake"><Sample image={generatedPortrait} label="生成图 G(z)" /></Reveal>
    {mode === 'd' && <Reveal show={stage >= 1} className="vg-gan-train__real"><Sample image={realPortrait} label="真实图 x" note={<>x ∼ p<sub>data</sub>：真实数据中取图</>} /></Reveal>}
    <Reveal show={judge} className="vg-gan-train__d"><Network kind="D" fixed={mode === 'g'} updating={mode === 'd' && stage >= 4} /></Reveal>
    {mode === 'd' && <Reveal show={stage >= 1} className="vg-gan-train__real-target"><Typography variant="bodySmall">D(x)</Typography><Typography variant="body" tone="success">目标：接近 1</Typography><Typography variant="bodySmall" tone="muted">判真得分，0～1</Typography></Reveal>}
    <Reveal show={fakeJudged} className="vg-gan-train__fake-target"><Typography variant="bodySmall">D(G(z))</Typography><Typography variant="body" tone={mode === 'd' ? 'danger' : 'success'}>目标：接近 {mode === 'd' ? '0' : '1'}</Typography><Typography variant="bodySmall" tone="muted">判真得分，0～1</Typography></Reveal>
    <Reveal show={mode === 'd' ? stage >= 4 : stage >= 3} className="vg-gan-train__feedback-label"><Typography variant="bodySmall" tone={mode === 'd' ? 'danger' : 'success'}>{mode === 'd' ? '根据损失，只更新 D' : '梯度经过 D，传回 G'}</Typography></Reveal>
  </div>;
}

function CycleDiagram({ stage }: { stage: number }) {
  const id = useId().replaceAll(':', '');
  return <div className="vg-gan-train__cycle" data-focus={stage === 1 || stage === 3 ? 'd' : stage === 2 ? 'g' : 'both'}>
    <svg className="vg-gan-train__cycle-wires" viewBox="0 0 1400 350" preserveAspectRatio="none" aria-hidden="true">
      <defs><marker id={`${id}-cycle`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#66839f" /></marker></defs>
      {stage >= 2 && <path d="M625 130 H770" fill="none" stroke="#66839f" strokeWidth="3" markerEnd={`url(#${id}-cycle)`} />}
      {stage >= 3 && <path d="M1100 278 V302 H300 V278" fill="none" stroke="#66839f" strokeWidth="3" markerEnd={`url(#${id}-cycle)`} />}
    </svg>
    <Reveal show={stage >= 1} className="vg-gan-train__cycle-d">
      <Typography as="h2" variant="h3" tone="danger">训练 D，区分真假</Typography>
      <div className="vg-gan-train__cycle-networks"><Network kind="G" fixed /><Typography variant="body" tone="muted">→</Typography><Network kind="D" fixed={false} updating={stage === 1 || stage === 3} /></div>
      <Typography variant="bodySmall">真实图判真，生成图判假。</Typography>
    </Reveal>
    <Reveal show={stage >= 2} className="vg-gan-train__cycle-g">
      <Typography as="h2" variant="h3" tone="success">训练 G，生成更逼真的图</Typography>
      <div className="vg-gan-train__cycle-networks"><Network kind="G" fixed={false} updating={stage === 2} /><Typography variant="body" tone="muted">→</Typography><Network kind="D" fixed /></div>
      <Typography variant="bodySmall">让生成图获得更高的真实评分。</Typography>
    </Reveal>
    {stage >= 2 && <Typography variant="bodySmall" tone="muted" className="vg-gan-train__cycle-next">用更新后的 D</Typography>}
    {stage >= 3 && <Typography variant="bodySmall" tone="muted" className="vg-gan-train__cycle-repeat">用更新后的 G 生成新样本，继续下一轮</Typography>}
    {stage === 0 && <Typography variant="h3" tone="accent" className="vg-gan-train__cycle-intro">两个训练目标，轮流优化</Typography>}
  </div>;
}

function LossExplanation({ mode, stage }: { mode: 'd' | 'g'; stage: number }) {
  if (mode === 'g') return <Reveal show={stage >= 2} className="vg-gan-train__loss-layout is-inline">
    <section className="vg-gan-train__loss" aria-label="生成器损失">
      <Typography as="h2" variant="body" tone="success">Lɢ：生成器损失</Typography>
      <Typography variant="bodySmall" tone="muted">𝔼：取平均；log：对数。</Typography>
    </section>
    <div className="vg-gan-train__equation"><MathFormulaStatic latex={String.raw`L_G=-\mathbb E_{z\sim p_z}[\log D(G(z))]`} /></div>
    <section className="vg-gan-train__loss" aria-label="生成器损失的含义">
      <Typography variant="bodySmall">生成图得分 → 1，损失减小。</Typography>
      <Typography variant="bodySmall" tone="success">D 参数固定，梯度仍传回 G。</Typography>
    </section>
  </Reveal>;

  return <Reveal show={stage >= 3} className="vg-gan-train__loss-layout">
    <section className="vg-gan-train__loss" aria-label="判别器损失及其含义">
      <Typography as="h2" variant="body" tone="danger">Lᴅ：两类判断的损失相加</Typography>
      <Typography variant="bodySmall" tone="muted">𝔼：取平均；log：对数。</Typography>
      <>
        <div className="vg-gan-train__equation"><MathFormulaStatic latex={String.raw`L_D=-\mathbb E_{x\sim p_{\mathrm{data}}}[\log D(x)]`} /><Typography variant="bodySmall">真图得分 → 1，损失减小。</Typography></div>
        <div className="vg-gan-train__equation"><MathFormulaStatic latex={String.raw`\phantom{L_D=}-\mathbb E_{z\sim p_z}[\log(1-D(G(z)))]`} /><Typography variant="bodySmall">生成图得分 → 0，损失减小。</Typography></div>
      </>
    </section>
    {mode === 'd' && <section className="vg-gan-train__loss-goal" aria-label="判别器损失的训练目标">
      <Typography variant="body">训练目标：让判别器对真实图片的评分接近 1，对生成图片的评分接近 0。</Typography>
    </section>}

  </Reveal>;
}

export function GanTrainingLesson({ mode, onComplete }: { mode: Mode; onComplete?: () => void }) {
  const lesson = lessons[mode];
  const { stage, controls } = useLecturePlayback(stageCount, 1000);
  const completed = useRef(false);
  useEffect(() => {
    if (stage !== stageCount - 1 || completed.current) return;
    completed.current = true;
    onComplete?.();
  }, [stage, onComplete]);
  return <ContentBlock headingLevel={1} title={lesson.title} subtitle={lesson.subtitle} className="vg-gan-train" bodyClassName="vg-gan-train__body" data-mode={mode} data-stage={stage}>
    <div className="vg-gan-train__visual">
      {mode === 'cycle' ? <CycleDiagram stage={stage} /> : <TrainingDiagram mode={mode} stage={stage} />}
      {mode === 'cycle' && <div className="vg-gan-train__narration" aria-live="polite" aria-atomic="true"><Typography variant="bodySmall">{cycleDetails[stage]}</Typography></div>}
    </div>
    {mode === 'cycle' ? <Reveal show={stage >= 3} className="vg-gan-train__cycle-summary">
      <Typography as="h2" variant="h3" tone="accent">先练判断，再练生成，反复交替</Typography>
      <div className="vg-gan-train__cycle-goals">
        <Typography variant="body">D 的目标是区分真假；G 的目标是让生成图被判为真。</Typography>
        <Reveal show={stage >= 4}><Typography variant="bodySmall" tone="accent">固定 G 更新 D，再固定 D 更新 G；反复交替。</Typography></Reveal>
      </div>
    </Reveal> : <LossExplanation mode={mode} stage={stage} />}
    <footer className="vg-gan-train__footer">
      {controls}
    </footer>
  </ContentBlock>;
}
