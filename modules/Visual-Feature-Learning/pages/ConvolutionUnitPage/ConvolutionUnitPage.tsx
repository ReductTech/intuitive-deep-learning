import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography, moduleAssetUrl } from '../../../shared/react';
import './ConvolutionUnitPage.css';

const KERNELS = [
  { name: '竖直变化', weights: [-1, 0, 1, -2, 0, 2, -1, 0, 1] },
  { name: '水平变化', weights: [-1, -2, -1, 0, 0, 0, 1, 2, 1] },
  { name: '斜向变化', weights: [0, 1, 2, -1, 0, 1, -2, -1, 0] },
  { name: '局部墨迹', weights: [0, .125, 0, .125, .5, .125, 0, .125, 0] },
];
const STEPS = ['卷积', '激活', '池化'];
const NOTES = ['同一张输入，四个卷积核，得到四个通道。', 'ReLU 将负响应置零；空间尺寸和通道数不变。', '2×2 最大池化，步长 2；空间尺寸减半，四个通道保留。'];
type Mode = 'input' | 'signed' | 'positive';

function Texture({ values, size, mode, range, onPoint }: { values: number[]; size: number; mode: Mode; range: number; onPoint?: (x: number, y: number) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const context = ref.current?.getContext('2d');
    if (!context) return;
    const data = context.createImageData(size, size);
    values.forEach((value, i) => {
      const amount = Math.min(1, Math.abs(value) / range);
      const color = mode === 'input' ? [value * 255, value * 255, value * 255]
        : mode === 'signed' ? [128 + value / range * 127, 128 + value / range * 127, 128 + value / range * 127]
        : [24 + amount * 216, 43 + amount * 83, 75 - amount * 4];
      color.forEach((v, c) => { data.data[i * 4 + c] = v; });
      data.data[i * 4 + 3] = 255;
    });
    context.putImageData(data, 0, 0);
  }, [values, size, mode, range]);
  return <canvas ref={ref} width={size} height={size} onPointerMove={onPoint ? event => {
    onPoint(Math.min(size - 1, Math.max(0, Math.floor(event.nativeEvent.offsetX / event.currentTarget.clientWidth * size))), Math.min(size - 1, Math.max(0, Math.floor(event.nativeEvent.offsetY / event.currentTarget.clientHeight * size))));
  } : undefined} />;
}

export function ConvolutionUnitPage() {
  const [pixels, setPixels] = useState<number[] | null>(null);
  const [error, setError] = useState(false);
  const [channel, setChannel] = useState(0);
  const [step, setStep] = useState(2);
  const [replaying, setReplaying] = useState(false);
  const [point, setPoint] = useState({ x: 12, y: 12 });
  useEffect(() => {
    let active = true;
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 28;
      const context = canvas.getContext('2d');
      if (!context) { if (active) setError(true); return; }
      context.drawImage(image, 0, 0);
      const rgba = context.getImageData(0, 0, 28, 28).data;
      if (active) setPixels(Array.from({ length: 784 }, (_, i) => rgba[i * 4] / 255));
    };
    image.onerror = () => { if (active) setError(true); };
    image.src = moduleAssetUrl('80396753-7fc8-4f55-9188-bddbdb828169', 'mnist/5/60008.png');
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!replaying) return;
    const timer = window.setTimeout(() => { if (step < 2) setStep(step + 1); else setReplaying(false); }, 1400);
    return () => window.clearTimeout(timer);
  }, [step, replaying]);
  const maps = useMemo(() => pixels ? KERNELS.map(kernel => {
    const raw = Array.from({ length: 676 }, (_, i) => kernel.weights.reduce((sum, w, k) => sum + w * pixels[(Math.floor(i / 26) + Math.floor(k / 3)) * 28 + i % 26 + k % 3], 0));
    const activated = raw.map(v => Math.max(0, v));
    const pooled = Array.from({ length: 169 }, (_, i) => {
      const top = Math.floor(i / 13) * 52 + i % 13 * 2;
      return Math.max(activated[top], activated[top + 1], activated[top + 26], activated[top + 27]);
    });
    return { raw, activated, pooled, range: Math.max(.001, ...raw.map(Math.abs)) };
  }) : [], [pixels]);
  function selectStep(index: number) { setStep(index); setReplaying(false); }
  return <ContentBlock className="vfl-unit-page" headingLevel={1} title="卷积网络中的一层" subtitle="将卷积、激活与池化连接起来，把输入图像变成新的特征图。">
    <div className="vfl-unit-scene" aria-label="卷积、ReLU 与最大池化组成的悬浮处理单元">
      <svg className="vfl-unit-links" viewBox="0 0 1500 590" aria-hidden="true">
        <defs><marker id="vfl-unit-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6" fill="none" stroke="currentColor" /></marker></defs>
        {KERNELS.map((_, c) => <g key={c} className={channel === c ? 'is-selected' : ''}>
          <path d={`M 190 350 Q 270 ${210 + c * 72} 326 ${178 + c * 76}`} />
          <path d={`M 398 ${178 + c * 76} Q 450 ${235 + c * 30} ${520 + c * 34} ${325 - c * 23}`} />
          <path d={`M ${675 + c * 34} ${385 - c * 23} Q 810 ${295 - c * 23} ${880 + c * 34} ${245 - c * 23}`} />
          <path d={`M ${1035 + c * 34} ${305 - c * 23} Q 1180 ${225 - c * 23} ${1235 + c * 30} ${155 - c * 23}`} />
        </g>)}
      </svg>
      <div className="vfl-unit-input">
        <div className="vfl-unit-plane vfl-unit-input-plane">
          {pixels && <Texture values={pixels} size={28} mode="input" range={1} />}
          {pixels && <span className="vfl-unit-window" style={{ left: `${point.x / 28 * 100}%`, top: `${point.y / 28 * 100}%` }} />}
        </div>
        <div className="vfl-unit-input-label"><Typography variant="h3" tone="accent">输入</Typography><MathFormulaBlock><MathFormulaStatic latex={'28\\times28\\times1'} /></MathFormulaBlock></div>
      </div>
      <div className="vfl-unit-kernels" role="group" aria-label="选择卷积核">
        {KERNELS.map((kernel, c) => <Button key={kernel.name} variant="default" active={channel === c} aria-pressed={channel === c} aria-label={`选择通道 ${c + 1}：${kernel.name}`} onClick={() => setChannel(c)} className={`vfl-unit-kernel ${channel === c ? 'is-selected' : ''}`}>
          <MathFormulaBlock ariaLabel={`${kernel.name}卷积核`}><MathFormulaStatic latex={`\\begin{smallmatrix}${[0, 3, 6].map(start => kernel.weights.slice(start, start + 3).map(w => w === .125 ? '\\frac18' : w === .5 ? '\\frac12' : w).join('&')).join('\\\\')}\\end{smallmatrix}`} /></MathFormulaBlock>
        </Button>)}
      </div>
      {STEPS.map((name, index) => <section key={name} className={`vfl-unit-stage vfl-unit-stage-${index} ${step < index ? 'is-pending' : ''}`} aria-label={`${name}输出的四个通道`}>
        <div className="vfl-unit-stage-label"><Typography variant="h3" tone="accent">{name}</Typography><MathFormulaBlock><MathFormulaStatic latex={index === 2 ? '13\\times13\\times4' : '26\\times26\\times4'} /></MathFormulaBlock></div>
        <div className="vfl-unit-fan">
          {maps.map((map, c) => <Button key={c} variant="default" aria-pressed={channel === c} aria-label={`${name}特征图，通道 ${c + 1}`} onClick={() => setChannel(c)} className={`vfl-unit-plane vfl-unit-map ${channel === c ? 'is-selected' : ''}`} style={{ '--channel': c } as CSSProperties}>
            <Texture values={index === 0 ? map.raw : index === 1 ? map.activated : map.pooled} size={index === 2 ? 13 : 26} mode={index === 0 ? 'signed' : 'positive'} range={map.range} onPoint={channel === c ? (x, y) => setPoint({ x: index === 2 ? x * 2 : x, y: index === 2 ? y * 2 : y }) : undefined} />
          </Button>)}
        </div>
      </section>)}
      {!pixels && <Typography className="vfl-unit-loading" tone={error ? 'danger' : 'muted'}>{error ? 'MNIST 样本加载失败，请刷新页面重试。' : '正在读取 MNIST 样本…'}</Typography>}
      <Typography className="vfl-unit-channel-note" variant="bodySmall" tone="muted">通道 {channel + 1} · {KERNELS[channel].name} · 点击薄片追踪对应卷积核</Typography>
    </div>
    <div className="vfl-unit-footer">
      <Typography as="p" tone="accent" className="vfl-unit-explanation" role="status">{NOTES[step]}</Typography>
      <div className="vfl-unit-controls" role="group" aria-label="查看处理步骤">
        {STEPS.map((name, index) => <Button key={name} variant="default" active={step === index} aria-pressed={step === index} onClick={() => selectStep(index)}><Typography tone={step === index ? 'warning' : 'muted'}>{name}</Typography></Button>)}
        <Button variant="default" onClick={() => { setStep(0); setReplaying(true); }}><Typography tone="accent">↻ 重播</Typography></Button>
      </div>
    </div>
  </ContentBlock>;
}
