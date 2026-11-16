import { useEffect, useRef, useState } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
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
  return <svg shuku-edit-id="e-ca23f456-db1a-4498-8c5b-1f437f6b20fb" className="vg-gaussian-page__plot" viewBox="0 0 264 200" role="img" aria-label={label}>
    <path shuku-edit-id="e-49684a37-63e7-4903-8f51-ce02c9a9716f" d="M20 177 H248 M244 173 L249 177 L244 181 M132 183 V20 M128 25 L132 19 L136 25" fill="none" stroke="#52657d" strokeWidth="1.5" />
    <path shuku-edit-id="e-cc5994d7-cdb7-429c-bb72-1c386e0f90a5" d={curvePath(alpha, components)} pathLength="1" fill="none" stroke={color === 'blue' ? '#2472cd' : '#f16a55'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="vg-gaussian-page__curve" />
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

  return <ContentBlock shuku-edit-id="e-f7b11278-d26d-4468-bcd7-b798ae47a910" headingLevel={1} className="vg-shared-page vg-gaussian-page" bodyClassName="vg-gaussian-page__body"
    title="Diffusion 的前向加噪如何走向正态分布？"
    subtitle="从不同形状的数据分布出发，观察噪声如何抹平原有结构。">
    <section shuku-edit-id="e-8d7dce00-ea9d-4e7a-8262-406a7584fe87" className="vg-gaussian-page__theory" aria-label="加噪目标与闭式公式">
      <div shuku-edit-id="e-5f1ed9f5-3d91-4640-a812-26e6dbe04cb7" className="vg-gaussian-page__theory-row">
        <Typography shuku-edit-id="e-9093f42a-b65b-47fd-9a57-c0a1fbb59427" as="strong" variant="bodySmall" tone="accent">目标</Typography>
        <Formula latex="q(x_t\mid x_0)\xrightarrow[t\to T]{}\mathcal N(0,I)" label="给定原图时，充分加噪后的分布接近标准正态" />
        <Typography shuku-edit-id="e-9c32c61a-6804-4189-89d0-cbbbf5ef0740" variant="bodySmall" tone="muted">时间越靠后，原图的信息越少。</Typography>
      </div>
      <div shuku-edit-id="e-b1a9e782-249c-496e-b6ce-c1e4d8d0a2b9" className="vg-gaussian-page__theory-row">
        <Typography shuku-edit-id="e-667eff83-06cc-4258-832b-262fa4c8ec21" as="strong" variant="bodySmall" tone="accent">加噪过程</Typography>
        <Typography shuku-edit-id="e-1cf42dd3-3fbd-4993-8018-93faa218acbc" variant="body" tone="main">每一步都保留一部分已有信号，再加入一份新的高斯噪声；重复后，原始形状被逐渐抹平。</Typography>
      </div>
      <div shuku-edit-id="e-b3737aa4-c356-4263-b394-2065d8d2f8dd" className="vg-gaussian-page__theory-row">
        <Typography shuku-edit-id="e-2f2cb216-1322-4b3f-9ca2-29e2ed27cdcf" as="strong" variant="bodySmall" tone="accent">前向闭式</Typography>
        <Formula latex="x_t=\sqrt{\bar\alpha_t}x_0+\sqrt{1-\bar\alpha_t}\,\epsilon" label="第 t 步由原图与标准高斯噪声相加得到" />
        <Typography shuku-edit-id="e-42cbff00-8ec5-4aaf-b870-dfbb800a193c" variant="bodySmall" tone="muted">当 ᾱₜ → 0，原图项消失，噪声项占主导。</Typography>
      </div>
    </section>

    <div shuku-edit-id="e-81a139b1-b288-47b4-9753-5db48724548d" className="vg-gaussian-page__section-head">
      <div shuku-edit-id="e-5d37950c-33ea-46d4-8d34-cd2644b7ca89">
        <Typography shuku-edit-id="e-4c3953bd-8646-46a1-aae6-836fa80339c2" as="h2" variant="h3" tone="main">不同时刻的数据分布</Typography>
        <Typography shuku-edit-id="e-e98a85d9-5ec1-4161-8d3c-b8e70197ff26" variant="bodySmall" tone="muted">选择不同的起点，再沿时间线查看变化。</Typography>
      </div>
      <div shuku-edit-id="e-12862732-85fb-48fa-a3a1-a1b6dffb49ef" className="vg-gaussian-page__choices" role="group" aria-label="选择初始分布">
        {Object.entries(startingDistributions).map(([key, value]) => <Button key={key}
          variant={distribution === key ? 'primary' : 'default'}
          aria-pressed={distribution === key}
          onClick={() => setDistribution(key)}>{value.label}</Button>)}
      </div>
    </div>

    <div shuku-edit-id="e-f4919f3a-82d1-4aa5-8ab5-93bec8773037" className="vg-gaussian-page__sequence" aria-label="随时间逐渐接近标准正态的分布曲线">
      {moments.map((moment, index) => <div shuku-edit-id="e-8efdc809-a3dd-4f38-9560-0af3f735a3ff" className="vg-gaussian-page__slot" key={moment.time}>
        {index <= stage && <div shuku-edit-id="e-7344724a-64f2-410b-a441-0be9feac56c4" className="vg-gaussian-page__snapshot" key={`${distribution}-${index}`}>
          <Typography shuku-edit-id="e-b17a0d24-1f66-4b16-a31f-07742ad1bb7d" as="strong" variant="bodySmall" tone={moment.color === 'blue' ? 'accent' : 'warning'}>{moment.time}</Typography>
          <DistributionPlot alpha={moment.alpha} components={components} color={moment.color} label={`${startingDistributions[distribution].label}分布在${moment.time}时的曲线：${moment.caption}`} />
          <Typography shuku-edit-id="e-e982db81-563d-485b-95bb-356c94431b48" as="span" variant="bodySmall" tone="muted">{moment.caption}</Typography>
          <Typography shuku-edit-id="e-978d656b-6668-4ed9-b350-a7aa9fb52d7a" as="span" variant="bodySmall" tone="accent">{index === 0 ? 'p_data(x₀)' : index === 4 ? 'q(xₜ) ≈ 𝒩(0, I)' : 'q(xₜ)'}</Typography>
        </div>}
        {index < moments.length - 1 && index < stage && <span shuku-edit-id="e-0a6266d5-e7c6-49fe-9a1a-677baab70d8a" className="vg-gaussian-page__arrow" aria-hidden="true">→</span>}
      </div>)}
    </div>

    <footer shuku-edit-id="e-37e9e9f9-0a48-492f-8c9c-2a5a0c01aeb2" className="vg-gaussian-page__footer">
      <div shuku-edit-id="e-261e58c6-092a-4b01-9ac1-4ca74a66f9e4" className="vg-gaussian-page__time-control">
        <Typography shuku-edit-id="e-5bf51c08-c87c-43a4-9b03-414bc0e6db57" as="label" variant="bodySmall" tone="muted" htmlFor="vg-gaussian-time">前向加噪 · 时间 t 增大</Typography>
        <input shuku-edit-id="e-e7af25f1-6977-42dd-9cc5-0c994714a2d5" id="vg-gaussian-time" type="range" min="0" max="4" step="1" value={stage}
          aria-label="选择加噪时间" onChange={(event) => setStage(Number(event.target.value))} />
        <Typography shuku-edit-id="e-eac819f5-7b2b-450f-985c-abe47c2c8286" as="span" variant="bodySmall" tone="accent">{stage + 1} / 5</Typography>
      </div>
      <div shuku-edit-id="e-adf1b92d-6fe0-43d8-bbd9-fce6cdc4cc76" className="vg-gaussian-page__actions">
        <Button disabled={stage === 0} onClick={() => setStage((current) => current - 1)}>← 上一步</Button>
        <Button variant="primary" onClick={() => setStage((current) => current === 4 ? 0 : current + 1)}>{stage === 4 ? '重新观察' : '继续加噪 →'}</Button>
      </div>
    </footer>
  </ContentBlock>;
}
