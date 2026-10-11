import { useLecturePlayback } from '../../components/LecturePlayback';
import { useEffect, useRef } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import x0 from '../../assets/forward-derivation/x0.png';
import x1 from '../../assets/forward-derivation/x1.png';
import xt from '../../assets/forward-derivation/xt.png';
import noise from '../../assets/two-processes/xt.jpg';
import './ReverseInferencePage.css';

const steps = [
  '生成从第 T 步的纯噪声开始。',
  '同一个去噪器，先让随机噪声出现图像轮廓。',
  '重复去噪，得到越来越清晰的同一张人脸。',
  '继续重复，最终生成清晰图像 x₀。',
  '现在放大其中一步：xₜ 怎样走向 xₜ₋₁？',
  '先看当前状态 xₜ：它包含图像分量与噪声分量。',
  '往回一步，图像分量增加，噪声分量减少。',
  '第一步：从 xₜ 中减去模型预测的噪声。',
  '第二步：把得到的图像分量缩放到前一时刻。',
  '第三步：加入前一时刻的噪声分量，得到 xₜ₋₁（确定性单步示意）。',
] as const;

const reverseUpdateLines = [
  String.raw`x_{t-1}=\sqrt{\bar\alpha_{t-1}}\left(\frac{x_t-\sqrt{1-\bar\alpha_t}\,\epsilon_\theta(x_t,t)}{\sqrt{\bar\alpha_t}}\right)`,
  String.raw`+\sqrt{1-\bar\alpha_{t-1}}\,\epsilon_\theta(x_t,t)`,
] as const;
const scaledSignalLines = [
  String.raw`\sqrt{\bar\alpha_{t-1}}\,\hat x_0=\frac{\sqrt{\bar\alpha_{t-1}}}{\sqrt{\bar\alpha_t}}\,\sqrt{\bar\alpha_t}\,\hat x_0`,
  String.raw`=\frac{\sqrt{\bar\alpha_{t-1}}}{\sqrt{\bar\alpha_t}}\left(x_t-\sqrt{1-\bar\alpha_t}\,\hat\epsilon\right)`,
] as const;

const frames = [
  { src: x0, symbol: 'x₀', label: '生成图像', alt: '生成的清晰人脸', reveal: 3 },
  { src: x1, symbol: 'x₁', label: '更清晰', alt: '轻微噪声的同一张人脸', reveal: 2 },
  { src: xt, symbol: 'xₜ', label: '出现轮廓', alt: '带噪声的同一张人脸', reveal: 1 },
  { src: noise, symbol: 'x_T', label: '纯噪声', alt: '生成起点的纯噪声', reveal: 0 },
] as const;

function Formula({ latex, label }: { latex: string; label: string }) {
  return <MathFormulaBlock ariaLabel={label} className="vg-inference__formula"><MathFormulaStatic latex={latex} /></MathFormulaBlock>;
}

function StackedFormula({ lines, label }: { lines: readonly string[]; label: string }) {
  return <div className="vg-inference__formula-lines" aria-label={label}>
    {lines.map((latex, index) => <Formula key={latex} latex={latex} label={`${label}，第 ${index + 1} 行`} />)}
  </div>;
}

export interface ReverseInferencePageProps { onComplete?: () => void; }

export function ReverseInferencePage({ onComplete }: ReverseInferencePageProps) {
  const { stage: step, controls } = useLecturePlayback(steps.length, 1000);
  const completedRef = useRef(false);

  useEffect(() => {
    if (step !== steps.length - 1 || completedRef.current) return;
    completedRef.current = true;
    onComplete?.();
  }, [step, onComplete]);

  const focused = step >= 4;

  return <ContentBlock headingLevel={1} className="vg-inference" bodyClassName="vg-inference__body"
    title="图像生成：反向去噪怎样一步步发生？" subtitle={steps[step]}>
    <div className={`vg-inference__content${focused ? ' is-focused' : ''}`}>
      <section className="vg-inference__chain" aria-label="从纯噪声到图像的反向生成链">
        <div className="vg-inference__chain-heading">
          <Typography as="strong" variant="bodySmall" tone="success">← 反向去噪 · 多次使用同一个去噪器</Typography>
          {focused && <Typography as="span" variant="bodySmall" tone="accent">聚焦一次 xₜ → xₜ₋₁</Typography>}
        </div>
        <div className="vg-inference__frames">
          {frames.map((frame, index) => <div className="vg-inference__frame-slot" key={frame.symbol}>
            <figure className={`vg-inference__frame${step >= frame.reveal ? ' is-visible' : ''}${focused && index === 2 ? ' is-selected' : ''}`}>
              {step >= frame.reveal && <><img src={frame.src} alt={frame.alt} />
                <figcaption><Typography as="strong" variant="bodySmall" tone="main">{frame.symbol === 'x_T' ? <>x<sub>T</sub></> : frame.symbol}</Typography>
                  <Typography as="span" variant="bodySmall" tone="muted">{frame.label}</Typography></figcaption></>}
            </figure>
            {index < frames.length - 1 && step >= frames[index].reveal && <div className="vg-inference__denoiser" aria-label="同一个去噪器">
              <span aria-hidden="true">←</span>
            </div>}
          </div>)}
        </div>
        {!focused && <Typography variant="body" tone="muted" className="vg-inference__chain-note">每次输入当前的带噪图像，预测一个噪声更少的状态；重复这个动作，图像逐渐成形。</Typography>}
      </section>

      {focused && <div className="vg-inference__detail">
        <section className="vg-inference__geometry" aria-label="反向一步的几何系数示意">
          <div className="vg-inference__section-head"><Typography as="h2" variant="h3" tone="main">把一步放到几何图里</Typography>
            <Typography as="span" variant="bodySmall" tone="muted">系数空间示意</Typography></div>
          <svg viewBox="0 0 620 430" role="img" aria-label="图像分量向上、噪声分量向右，反向一步从红色当前点走向绿色前一步">
            <defs>
              <marker id="vg-inference-noise-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L8 4.5 L0 9 Z" fill="#da5245" /></marker>
              <marker id="vg-inference-signal-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L8 4.5 L0 9 Z" fill="#24945d" /></marker>
              <marker id="vg-inference-reverse-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L8 4.5 L0 9 Z" fill="#2675c8" /></marker>
            </defs>
            <path d="M76 354 H531 M76 354 V35" stroke="#27374c" strokeWidth="3" fill="none" />
            <path d="M483 354 A407 303 0 0 0 76 51" stroke="#344257" strokeWidth="2.5" fill="none" />
            <circle cx="76" cy="354" r="5" fill="#27374c" /><circle cx="483" cy="354" r="5" fill="#27374c" /><circle cx="76" cy="51" r="5" fill="#27374c" />
            <text x="64" y="55" textAnchor="end" className="vg-inference__svg-label">x₀</text><text x="500" y="376" className="vg-inference__svg-label">噪声 ε</text>
            {step === 4 && <g className="vg-inference__svg-reveal">
              <path d="M101 52 Q215 50 323 111" fill="none" stroke="#da5245" strokeWidth="4" markerEnd="url(#vg-inference-noise-arrow)" />
              <path d="M425 270 Q409 198 360 150" fill="none" stroke="#2675c8" strokeWidth="4" markerEnd="url(#vg-inference-reverse-arrow)" />
              <text x="176" y="37" className="vg-inference__svg-forward">前向：加噪</text>
              <text x="437" y="213" className="vg-inference__svg-reverse">反向：去噪</text>
            </g>}
            {step >= 5 && <g className="vg-inference__svg-reveal">
              <path d={step >= 7 ? 'M76 354 L347 130 M347 130 V354' : 'M76 354 L347 130 M76 130 H347 M347 130 V354'} fill="none" stroke="#da5245" strokeWidth="2.5" strokeDasharray="7 6" />
              <circle cx="347" cy="130" r="9" fill="#da5245" /><text x="358" y="124" className="vg-inference__svg-current">xₜ</text>
              <text x="212" y="387" className="vg-inference__svg-small">噪声分量</text><text x="5" y="244" className="vg-inference__svg-small">图像分量</text>
            </g>}
            {step >= 6 && <g className="vg-inference__svg-reveal">
              <path d="M76 354 L256 79 M76 79 H256 M256 79 V354" fill="none" stroke="#24945d" strokeWidth="2.5" strokeDasharray="7 6" />
              <circle cx="256" cy="79" r="9" fill="#24945d" /><text x="271" y="67" className="vg-inference__svg-previous">xₜ₋₁</text>
            </g>}
            {step >= 7 && <g className="vg-inference__svg-reveal">
              <path d="M338 130 H91" fill="none" stroke="#da5245" strokeWidth="4" markerEnd="url(#vg-inference-noise-arrow)" />
            </g>}
            {step >= 8 && <g className="vg-inference__svg-reveal">
              <path d="M119 137 L236 94" fill="none" stroke="#24945d" strokeWidth="4" markerEnd="url(#vg-inference-signal-arrow)" />
            </g>}
          </svg>
          <div className="vg-inference__geometry-legend">
            <Typography as="span" variant="bodySmall" tone="warning">● 红色：当前 xₜ</Typography>
            {step >= 6 && <Typography as="span" variant="bodySmall" tone="success">● 绿色：前一步 xₜ₋₁</Typography>}
          </div>
        </section>
        <section className="vg-inference__math" aria-label="参照 SVG 逐步展开的反向更新公式">
          <Typography as="h2" variant="h3" tone="main">反向去噪递推式</Typography>
          {step < 9 && <div className="vg-inference__overview" aria-label="完整反向去噪递推式">
            <StackedFormula lines={reverseUpdateLines} label="由当前状态和预测噪声计算前一时刻的完整递推式" />
          </div>}
          {step === 4 && <div className="vg-inference__math-prompt"><Typography variant="body" tone="accent">圆弧是分量比例的示意。生成时没有真实原图，去噪器要从 xₜ 预测噪声。</Typography></div>}
          {step === 5 && <div className="vg-inference__math-row is-current">
            <Typography as="span" variant="bodySmall" tone="warning">当前点 xₜ · 对照前向分解</Typography>
            <Formula latex="x_t=\sqrt{\bar\alpha_t}x_0+\sqrt{1-\bar\alpha_t}\,\epsilon" label="当前状态的前向分解式" />
          </div>}
          {step === 6 && <div className="vg-inference__math-row is-previous">
            <Typography as="span" variant="bodySmall" tone="success">前一个点 xₜ₋₁ · 同样的分解</Typography>
            <Formula latex="x_{t-1}=\sqrt{\bar\alpha_{t-1}}x_0+\sqrt{1-\bar\alpha_{t-1}}\,\epsilon" label="前一时刻的图像和噪声分量" />
          </div>}
          {step >= 7 && <div className="vg-inference__math-row is-current">
            {step === 7 && <Typography as="span" variant="bodySmall" tone="danger">① 减去预测噪声 ε̂，留下图像分量</Typography>}
            <Formula latex="\sqrt{\bar\alpha_t}\,\hat x_0=x_t-\sqrt{1-\bar\alpha_t}\,\hat\epsilon" label="当前状态减去预测噪声得到图像分量" />
          </div>}
          {step >= 8 && <div className="vg-inference__math-row is-previous is-scaled">
            {step === 8 && <Typography as="span" variant="bodySmall" tone="success">② 将图像分量缩放到 t−1</Typography>}
            <StackedFormula lines={scaledSignalLines} label="先写出缩放比例，再代入减噪后的图像分量" />
          </div>}
          {step >= 9 && <div className="vg-inference__math-result">
            <Typography as="span" variant="bodySmall" tone="accent">③ 加回前一步的噪声分量</Typography>
            <StackedFormula lines={reverseUpdateLines} label="把预测噪声代入后得到完整反向更新式" />
          </div>}
        </section>
      </div>}
    </div>
    <footer className="vg-inference__footer">
      
      <div className="vg-inference__actions">{controls}</div>
    </footer>
  </ContentBlock>;
}
