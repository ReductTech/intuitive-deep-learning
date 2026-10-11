import { useEffect, useRef, useState } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import './GaussianDestinationPage.css';

type Component = { mean: number; deviation: number; weight: number };

const startingDistributions: Record<string, { label: string; components: Component[] }> = {
  double: {
    label: '双峰',
    components: [
      { mean: -1.9, deviation: .27, weight: .43 },
      { mean: 1.1, deviation: .32, weight: .57 },
    ],
  },
  skewed: {
    label: '偏斜',
    components: [
      { mean: -1.25, deviation: .43, weight: .72 },
      { mean: .5, deviation: .62, weight: .2 },
      { mean: 2.45, deviation: .3, weight: .08 },
    ],
  },
  triple: {
    label: '三峰',
    components: [
      { mean: -2.2, deviation: .26, weight: .25 },
      { mean: -.1, deviation: .34, weight: .4 },
      { mean: 2.05, deviation: .3, weight: .35 },
    ],
  },
};

const moments = [
  { time: 't = 0', alpha: 1, caption: '原始数据分布', color: 'blue' },
  { time: 't ≈ 20', alpha: .86, caption: '两侧开始变宽', color: 'coral' },
  { time: 't ≈ 140', alpha: .34, caption: '峰逐渐靠近', color: 'coral' },
  { time: '140 < t < T', alpha: .06, caption: '逐渐成为单峰', color: 'coral' },
  { time: 't = T', alpha: 0, caption: '接近标准正态', color: 'blue' },
] as const;

const X_MIN = -4;
const X_MAX = 4;
const PLOT_LEFT = 20;
const PLOT_RIGHT = 244;
const PLOT_TOP = 24;
const PLOT_BOTTOM = 177;
const DENSITY_MAX = .72;

function gaussian(x: number, mean: number, deviation: number) {
  const z = (x - mean) / deviation;
  return Math.exp(-.5 * z * z) / (deviation * Math.sqrt(2 * Math.PI));
}

function densityAt(x: number, alpha: number, components: Component[]) {
  return components.reduce((sum, component) => {
    const mean = Math.sqrt(alpha) * component.mean;
    const deviation = Math.sqrt(alpha * component.deviation ** 2 + 1 - alpha);
    return sum + component.weight * gaussian(x, mean, deviation);
  }, 0);
}

function curvePath(alpha: number, components: Component[]) {
  return Array.from({ length: 181 }, (_, index) => {
    const x = X_MIN + (X_MAX - X_MIN) * index / 180;
    const px = PLOT_LEFT + (PLOT_RIGHT - PLOT_LEFT) * index / 180;
    const py = PLOT_BOTTOM - Math.min(densityAt(x, alpha, components) / DENSITY_MAX, 1) * (PLOT_BOTTOM - PLOT_TOP);
    return `${index === 0 ? 'M' : 'L'}${px.toFixed(2)} ${py.toFixed(2)}`;
  }).join(' ');
}

function DistributionPlot({ alpha, components, color, label }: {
  alpha: number;
  components: Component[];
  color: 'blue' | 'coral';
  label: string;
}) {
  return <svg className="vg-gaussian-page__plot" viewBox="0 0 264 200" role="img" aria-label={label}>
    <path d="M20 177 H248 M244 173 L249 177 L244 181 M132 183 V20 M128 25 L132 19 L136 25" fill="none" stroke="#52657d" strokeWidth="1.5" />
    <path d={curvePath(alpha, components)} pathLength="1" fill="none" stroke={color === 'blue' ? '#2472cd' : '#f16a55'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="vg-gaussian-page__curve" />
  </svg>;
}

function Formula({ latex, label }: { latex: string; label: string }) {
  return <MathFormulaBlock ariaLabel={label} className="vg-gaussian-page__formula"><MathFormulaStatic latex={latex} /></MathFormulaBlock>;
}

export interface GaussianDestinationPageProps { onComplete?: () => void; }

export function GaussianDestinationPage({ onComplete }: GaussianDestinationPageProps) {
  const [stage, setStage] = useState(0);
  const [distribution, setDistribution] = useState<keyof typeof startingDistributions>('double');
  const completedRef = useRef(false);
  const components = startingDistributions[distribution].components;

  useEffect(() => {
    if (stage < moments.length - 1 || completedRef.current) return;
    completedRef.current = true;
    onComplete?.();
  }, [stage, onComplete]);

  return <ContentBlock headingLevel={1} className="vg-gaussian-page" bodyClassName="vg-gaussian-page__body"
    title="Diffusion 的前向加噪如何走向正态分布？"
    subtitle="从不同形状的数据分布出发，观察噪声如何抹平原有结构。">
    <section className="vg-gaussian-page__theory" aria-label="加噪目标与闭式公式">
      <div className="vg-gaussian-page__theory-row">
        <Typography as="strong" variant="bodySmall" tone="accent">目标</Typography>
        <Formula latex="q(x_t\mid x_0)\xrightarrow[t\to T]{}\mathcal N(0,I)" label="给定原图时，充分加噪后的分布接近标准正态" />
        <Typography variant="bodySmall" tone="muted">时间越靠后，原图的信息越少。</Typography>
      </div>
      <div className="vg-gaussian-page__theory-row">
        <Typography as="strong" variant="bodySmall" tone="accent">加噪过程</Typography>
        <Typography variant="body" tone="main">每一步都保留一部分已有信号，再加入一份新的高斯噪声；重复后，原始形状被逐渐抹平。</Typography>
      </div>
      <div className="vg-gaussian-page__theory-row">
        <Typography as="strong" variant="bodySmall" tone="accent">前向闭式</Typography>
        <Formula latex="x_t=\sqrt{\bar\alpha_t}x_0+\sqrt{1-\bar\alpha_t}\,\epsilon" label="第 t 步由原图与标准高斯噪声相加得到" />
        <Typography variant="bodySmall" tone="muted">当 ᾱₜ → 0，原图项消失，噪声项占主导。</Typography>
      </div>
    </section>

    <div className="vg-gaussian-page__section-head">
      <div>
        <Typography as="h2" variant="h3" tone="main">不同时刻的数据分布</Typography>
        <Typography variant="bodySmall" tone="muted">选择不同的起点，再沿时间线查看变化。</Typography>
      </div>
      <div className="vg-gaussian-page__choices" role="group" aria-label="选择初始分布">
        {Object.entries(startingDistributions).map(([key, value]) => <Button key={key}
          variant={distribution === key ? 'primary' : 'default'}
          aria-pressed={distribution === key}
          onClick={() => setDistribution(key)}>{value.label}</Button>)}
      </div>
    </div>

    <div className="vg-gaussian-page__sequence" aria-label="随时间逐渐接近标准正态的分布曲线">
      {moments.map((moment, index) => <div className="vg-gaussian-page__slot" key={moment.time}>
        {index <= stage && <div className="vg-gaussian-page__snapshot" key={`${distribution}-${index}`}>
          <Typography as="strong" variant="bodySmall" tone={moment.color === 'blue' ? 'accent' : 'warning'}>{moment.time}</Typography>
          <DistributionPlot alpha={moment.alpha} components={components} color={moment.color} label={`${startingDistributions[distribution].label}分布在${moment.time}时的曲线：${moment.caption}`} />
          <Typography as="span" variant="bodySmall" tone="muted">{moment.caption}</Typography>
          <Typography as="span" variant="bodySmall" tone="accent">{index === 0 ? 'p_data(x₀)' : index === 4 ? 'q(xₜ) ≈ 𝒩(0, I)' : 'q(xₜ)'}</Typography>
        </div>}
        {index < moments.length - 1 && index < stage && <span className="vg-gaussian-page__arrow" aria-hidden="true">→</span>}
      </div>)}
    </div>

    <footer className="vg-gaussian-page__footer">
      <div className="vg-gaussian-page__time-control">
        <Typography as="label" variant="bodySmall" tone="muted" htmlFor="vg-gaussian-time">前向加噪 · 时间 t 增大</Typography>
        <input id="vg-gaussian-time" type="range" min="0" max="4" step="1" value={stage}
          aria-label="选择加噪时间" onChange={(event) => setStage(Number(event.target.value))} />
        <Typography as="span" variant="bodySmall" tone="accent">{stage + 1} / 5</Typography>
      </div>
      <div className="vg-gaussian-page__actions">
        <Button disabled={stage === 0} onClick={() => setStage((current) => current - 1)}>← 上一步</Button>
        <Button variant="primary" onClick={() => setStage((current) => current === 4 ? 0 : current + 1)}>{stage === 4 ? '重新观察' : '继续加噪 →'}</Button>
      </div>
    </footer>
  </ContentBlock>;
}
