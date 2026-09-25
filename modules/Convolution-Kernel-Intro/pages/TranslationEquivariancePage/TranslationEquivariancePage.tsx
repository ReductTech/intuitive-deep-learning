import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { ContentBlock, Typography } from '../../../shared/react';
import dvdLogo from '../../assets/dvd.png';
import './TranslationEquivariancePage.css';

const GRID_WIDTH = 42;
const GRID_HEIGHT = 24;
const LOGO_WIDTH = 9;
const LOGO_HEIGHT = LOGO_WIDTH * 296 / 674;
const kernels = {
  vertical: { label: '竖直边缘', values: [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]] },
  horizontal: { label: '水平边缘', values: [[-1, -1, -1], [0, 0, 0], [1, 1, 1]] },
  block: { label: '亮块', values: [[1, 1, 1], [1, 1, 1], [1, 1, 1]] },
} as const;
type KernelName = keyof typeof kernels;
interface Position { x: number; y: number; vx: number; vy: number; }

function responseMap(input: Float32Array, kernel: readonly (readonly number[])[]): Float32Array {
  const output = new Float32Array(GRID_WIDTH * GRID_HEIGHT);
  let maximum = 0;
  for (let y = 1; y < GRID_HEIGHT - 1; y += 1) {
    for (let x = 1; x < GRID_WIDTH - 1; x += 1) {
      let value = 0;
      for (let ky = 0; ky < 3; ky += 1) {
        for (let kx = 0; kx < 3; kx += 1) {
          value += input[(y + ky - 1) * GRID_WIDTH + x + kx - 1] * kernel[ky][kx];
        }
      }
      const positive = Math.max(0, value);
      output[y * GRID_WIDTH + x] = positive;
      maximum = Math.max(maximum, positive);
    }
  }
  if (maximum > 0) for (let index = 0; index < output.length; index += 1) output[index] /= maximum;
  return output;
}

function heatColor(value: number): string {
  if (value <= 0.035) return 'rgb(16 43 171)';
  if (value < 0.48) {
    const t = value / 0.48;
    return `rgb(${Math.round(10 + 12 * t)} ${Math.round(70 + 170 * t)} ${Math.round(205 - 160 * t)})`;
  }
  const t = (value - 0.48) / 0.52;
  return `rgb(${Math.round(22 + 233 * t)} ${Math.round(240 - 190 * t)} ${Math.round(45 - 35 * t)})`;
}

function Heatmap({ values }: { values: Float32Array }) {
  return (
    <div className="ck-translation__heatmap" role="img" aria-label="当前卷积核在输入图像上的响应热图" style={{ gridTemplateColumns: `repeat(${GRID_WIDTH}, minmax(0, 1fr))` }}>
      {Array.from(values, (value, index) => <span key={index} style={{ backgroundColor: heatColor(value) }} />)}
    </div>
  );
}

export function TranslationEquivariancePage() {
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<HTMLImageElement | null>(null);
  const pointerDrag = useRef<{ x: number; y: number; logoX: number; logoY: number } | null>(null);
  const positionRef = useRef<Position>({ x: 13, y: 6, vx: 0.105, vy: 0.072 });
  const [position, setPosition] = useState(positionRef.current);
  const [kernelName, setKernelName] = useState<KernelName>('vertical');
  const [playing, setPlaying] = useState(true);
  const kernel = kernels[kernelName];

  useEffect(() => {
    if (!playing) return undefined;
    let frameId = 0;
    let lastUpdate = 0;
    const tick = (time: number) => {
      if (time - lastUpdate > 28) {
        const current = positionRef.current;
        const field = fieldRef.current;
        const logo = logoRef.current;
        if (field && logo) {
          const maxX = Math.max(0, field.clientWidth - logo.offsetWidth);
          const maxY = Math.max(0, field.clientHeight - logo.offsetHeight);
          let x = current.x + current.vx * (time - (lastUpdate || time - 28));
          let y = current.y + current.vy * (time - (lastUpdate || time - 28));
          let vx = current.vx;
          let vy = current.vy;
          if (x < 0 || x > maxX) { vx *= -1; x = Math.max(0, Math.min(maxX, x)); }
          if (y < 0 || y > maxY) { vy *= -1; y = Math.max(0, Math.min(maxY, y)); }
          positionRef.current = { x, y, vx, vy };
          setPosition(positionRef.current);
        }
        lastUpdate = time;
      }
      frameId = window.requestAnimationFrame(tick);
    };
    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [playing]);

  const responses = useMemo(() => {
    const field = fieldRef.current;
    const logo = logoRef.current;
    if (!field || !logo || !logo.complete) return new Float32Array(GRID_WIDTH * GRID_HEIGHT);
    const canvas = document.createElement('canvas');
    canvas.width = GRID_WIDTH;
    canvas.height = GRID_HEIGHT;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return new Float32Array(GRID_WIDTH * GRID_HEIGHT);
    const x = position.x / Math.max(1, field.clientWidth) * GRID_WIDTH;
    const y = position.y / Math.max(1, field.clientHeight) * GRID_HEIGHT;
    const width = LOGO_WIDTH / 100 * GRID_WIDTH;
    const height = LOGO_HEIGHT / 100 * GRID_HEIGHT;
    context.drawImage(logo, x, y, width, height);
    const data = context.getImageData(0, 0, GRID_WIDTH, GRID_HEIGHT).data;
    const input = new Float32Array(GRID_WIDTH * GRID_HEIGHT);
    for (let index = 0; index < input.length; index += 1) input[index] = data[index * 4 + 3] / 255;
    return responseMap(input, kernel.values);
  }, [kernel, position]);

  const logoStyle: CSSProperties = { left: `${position.x}px`, top: `${position.y}px`, width: `${LOGO_WIDTH}%` };

  const moveLogo = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = pointerDrag.current;
    const field = fieldRef.current;
    const logo = logoRef.current;
    if (!drag || !field || !logo) return;
    const bounds = field.getBoundingClientRect();
    const maxX = Math.max(0, bounds.width - logo.offsetWidth);
    const maxY = Math.max(0, bounds.height - logo.offsetHeight);
    const next = {
      ...positionRef.current,
      x: Math.max(0, Math.min(maxX, drag.logoX + event.clientX - drag.x)),
      y: Math.max(0, Math.min(maxY, drag.logoY + event.clientY - drag.y)),
    };
    positionRef.current = next;
    setPosition(next);
  };

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const target = event.target;
    if (!(target instanceof HTMLImageElement)) return;
    pointerDrag.current = { x: event.clientX, y: event.clientY, logoX: positionRef.current.x, logoY: positionRef.current.y };
    event.currentTarget.setPointerCapture(event.pointerId);
    setPlaying(false);
  };

  const stopDrag = () => { pointerDrag.current = null; };

  return (
    <ContentBlock headingLevel={1} className="ck-translation" title="平移等变性" subtitle="当输入发生平移，卷积产生的特征图也会随之平移。">
      <div className="ck-translation__workspace">
        <article className="ck-translation__panel">
          <header className="ck-translation__step-header"><span className="ck-translation__step-number"><Typography as="span" variant="h3" tone="light">1</Typography></span><Typography as="h2" variant="h3" tone="accent">输入图像</Typography></header>
          <div ref={fieldRef} className="ck-translation__input-field" onPointerDown={startDrag} onPointerMove={moveLogo} onPointerUp={stopDrag} onPointerCancel={stopDrag}>
            {Array.from({ length: 12 }, (_, index) => <span className="ck-translation__grid-line ck-translation__grid-line--vertical" key={`v${index}`} style={{ left: `${(index + 1) * 100 / 13}%` }} />)}
            {Array.from({ length: 7 }, (_, index) => <span className="ck-translation__grid-line ck-translation__grid-line--horizontal" key={`h${index}`} style={{ top: `${(index + 1) * 100 / 8}%` }} />)}
            <img ref={logoRef} className="ck-translation__dvd" src={dvdLogo} alt="DVD 标志，正在输入区域中平移" draggable="false" style={logoStyle} />
          </div>
          <div className="ck-translation__play-row"><button type="button" className="ck-translation__play-toggle" onClick={() => setPlaying((value) => !value)} aria-pressed={playing}><span aria-hidden="true">{playing ? 'Ⅱ' : '▶'}</span><Typography as="span" variant="bodySmall" tone="inherit">{playing ? '暂停平移' : '自动平移'}</Typography></button><Typography variant="bodySmall" tone="muted">也可拖动标志</Typography></div>
        </article>

        <div className="ck-translation__arrow" aria-hidden="true"><Typography as="span" variant="h1" tone="accent">→</Typography></div>

        <article className="ck-translation__panel ck-translation__panel--kernel">
          <header className="ck-translation__step-header"><span className="ck-translation__step-number"><Typography as="span" variant="h3" tone="light">2</Typography></span><Typography as="h2" variant="h3" tone="accent">同一个卷积核</Typography></header>
          <div className="ck-translation__kernel-options" role="group" aria-label="选择卷积核">
            {(Object.keys(kernels) as KernelName[]).map((name) => <button key={name} type="button" className={kernelName === name ? 'is-selected' : ''} aria-pressed={kernelName === name} onClick={() => setKernelName(name)}><Typography as="span" variant="bodySmall" tone="inherit">{kernels[name].label}</Typography></button>)}
          </div>
          <div className="ck-translation__kernel" role="img" aria-label={`${kernel.label}卷积核`}>{kernel.values.flatMap((row, rowIndex) => row.map((value, colIndex) => <span className={value < 0 ? 'is-negative' : value > 0 ? 'is-positive' : ''} key={`${rowIndex}-${colIndex}`}><Typography as="span" variant="body" tone="inherit">{value}</Typography></span>))}</div>
          <div className="ck-translation__kernel-note"><Typography variant="bodySmall" tone="accent">卷积核保持不变</Typography><Typography variant="bodySmall" tone="muted">移动的是输入图像</Typography></div>
        </article>

        <div className="ck-translation__arrow" aria-hidden="true"><Typography as="span" variant="h1" tone="accent">→</Typography></div>

        <article className="ck-translation__panel ck-translation__panel--output">
          <header className="ck-translation__step-header"><span className="ck-translation__step-number"><Typography as="span" variant="h3" tone="light">3</Typography></span><Typography as="h2" variant="h3" tone="accent">输出特征图</Typography></header>
          <Heatmap values={responses} />
          <div className="ck-translation__heatmap-key"><Typography variant="bodySmall" tone="muted">低响应</Typography><span /><Typography variant="bodySmall" tone="accent">高响应</Typography></div>
        </article>
      </div>

      <footer className="ck-translation__summary">
        <span className="ck-translation__summary-icon" aria-hidden="true">↔</span>
        <Typography as="span" variant="h3" tone="accent">结论：</Typography>
        <Typography variant="h2" tone="accent">输入平移 <span aria-hidden="true">→</span> 响应平移</Typography>
        <span className="ck-translation__summary-divider" />
        <Typography variant="body">卷积保持平移等变性。</Typography>
      </footer>
    </ContentBlock>
  );
}
