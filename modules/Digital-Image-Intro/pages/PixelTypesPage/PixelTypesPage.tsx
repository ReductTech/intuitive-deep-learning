import { useEffect, useRef, useState } from 'react';
import { ContentBlock, Typography } from '../../../shared/react';
import './PixelTypesPage.css';

const cutout = new URL('../../assets/digital-image-cat-cutout.png', import.meta.url).href;
const SIDE = 320;
const types = ['二值图', '灰度图', 'RGB 彩色图', 'RGBA 图像'];
const descriptions = ['只有两个取值', '一个数表示明暗', '三个数表示颜色', '颜色加上不透明度'];
type Pixels = { foreground: Uint8ClampedArray; scene: Uint8ClampedArray };
function PixelCanvas({ pixels, mode, opacity }: { pixels?: Pixels; mode: number; opacity: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const context = ref.current?.getContext('2d');
    if (!context || !pixels) return;
    const output = context.createImageData(SIDE, SIDE);
    output.data.set(mode === 3 ? pixels.foreground : pixels.scene);
    for (let i = 0; i < output.data.length; i += 4) {
      if (mode === 3) { output.data[i + 3] = Math.round(output.data[i + 3] * opacity); continue; }
      const gray = Math.round(.299 * output.data[i] + .587 * output.data[i + 1] + .114 * output.data[i + 2]);
      if (mode < 2) { const value = mode === 0 ? (gray >= 128 ? 255 : 0) : gray; output.data.set([value, value, value], i); }
    }
    context.putImageData(output, 0, 0);
  }, [pixels, mode, opacity]);
  return <canvas ref={ref} width={SIDE} height={SIDE} role="img" aria-label={types[mode]} />;
}
export function PixelTypesPage() {
  const [pixels, setPixels] = useState<Pixels>();
  const [selected, setSelected] = useState({ x: 190, y: 151 });
  const [opacity, setOpacity] = useState(.5);
  const [background, setBackground] = useState('checker');
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    const image = new Image();
    image.onload = () => {
      if (!active) return;
      const foregroundCanvas = document.createElement('canvas'); foregroundCanvas.width = foregroundCanvas.height = SIDE;
      const foreground = foregroundCanvas.getContext('2d')!;
      const width = SIDE * image.width / image.height;
      foreground.drawImage(image, (SIDE - width) / 2, 0, width, SIDE);
      const foregroundImage = foreground.getImageData(0, 0, SIDE, SIDE);
      // The generated cutout encodes solid fur at 252–253; make the interior opaque.
      for (let i = 3; i < foregroundImage.data.length; i += 4) if (foregroundImage.data[i] >= 250) foregroundImage.data[i] = 255;
      foreground.putImageData(foregroundImage, 0, 0);
      const sceneCanvas = document.createElement('canvas'); sceneCanvas.width = sceneCanvas.height = SIDE;
      const scene = sceneCanvas.getContext('2d')!;
      const gradient = scene.createLinearGradient(0, 0, SIDE, SIDE); gradient.addColorStop(0, '#f9f4ec'); gradient.addColorStop(1, '#e3edf5');
      scene.fillStyle = gradient; scene.fillRect(0, 0, SIDE, SIDE); scene.drawImage(foregroundCanvas, 0, 0);
      const foregroundData = foreground.getImageData(0, 0, SIDE, SIDE).data;
      setPixels({ foreground: foregroundData, scene: scene.getImageData(0, 0, SIDE, SIDE).data });
      // Start on an opaque fur pixel so RGB and RGBA share identical color values.
      let found = false;
      for (let radius = 0; radius <= 24 && !found; radius++) for (let y = 151 - radius; y <= 151 + radius && !found; y++) for (let x = 190 - radius; x <= 190 + radius; x++) {
        if (foregroundData[(y * SIDE + x) * 4 + 3] === 255) { setSelected({ x, y }); found = true; break; }
      }
    };
    image.onerror = () => { if (active) setFailed(true); }; image.src = cutout;
    return () => { active = false; };
  }, []);
  const offset = (selected.y * SIDE + selected.x) * 4;
  const rgb = pixels ? Array.from(pixels.foreground.slice(offset, offset + 3)) : [];
  const sceneRgb = pixels ? Array.from(pixels.scene.slice(offset, offset + 3)) : [];
  const gray = sceneRgb.length ? Math.round(.299 * sceneRgb[0] + .587 * sceneRgb[1] + .114 * sceneRgb[2]) : 0;
  const alpha = pixels ? pixels.foreground[offset + 3] / 255 * opacity : 0;
  const values = pixels ? [gray >= 128 ? '1' : '0', String(gray), `[${sceneRgb.join(', ')}]`, `[${rgb.join(', ')}, ${Number(alpha.toFixed(2))}]`] : ['—', '—', '—', '—'];
  const choose = (x: number, y: number) => setSelected({ x: Math.max(0, Math.min(SIDE - 1, x)), y: Math.max(0, Math.min(SIDE - 1, y)) });
  return <ContentBlock className="di-types" title="二值、灰度、彩色与 Alpha" subtitle="一个像素里，究竟记录什么？" headingLevel={1}><div className="di-types__body"><div className="di-types__columns">{types.map((title, mode) => <section className="di-types__column" key={title}>
    <Typography as="h2" variant="h3" tone="accent" align="center">{title}</Typography>
    <div className={`di-types__image ${mode === 3 ? `di-types__image--${background}` : ''}`}><PixelCanvas pixels={pixels} mode={mode} opacity={opacity} /><button className="di-types__picker" type="button" aria-label={`${title}，点击或使用方向键选择像素`} onPointerDown={event => { const b = event.currentTarget.getBoundingClientRect(); choose(Math.floor((event.clientX - b.left) / b.width * SIDE), Math.floor((event.clientY - b.top) / b.height * SIDE)); }} onKeyDown={event => { const deltas: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }; if (deltas[event.key]) { event.preventDefault(); choose(selected.x + deltas[event.key][0], selected.y + deltas[event.key][1]); } }}><i style={{ left: `${selected.x / SIDE * 100}%`, top: `${selected.y / SIDE * 100}%` }} /></button>
    {mode === 3 && <><div className="di-types__backgrounds" role="group" aria-label="RGBA 背景">{[['checker', '棋盘格'], ['white', '白色'], ['blue', '蓝色']].map(([id, label]) => <button type="button" key={id} aria-pressed={background === id} className={background === id ? 'is-selected' : ''} onClick={() => setBackground(id)}><Typography as="span" variant="bodySmall" tone="inherit">{label}</Typography></button>)}</div><label className="di-types__alpha"><Typography as="span" variant="bodySmall" tone="accent">Alpha</Typography><input type="range" min="0" max="1" step="0.01" value={opacity} onChange={event => setOpacity(Number(event.target.value))} aria-label="Alpha 不透明度" /><Typography as="span" variant="bodySmall" tone="accent">{opacity.toFixed(2)}</Typography></label></>}
    </div>
    <Typography className="di-types__description" variant="bodySmall" tone="accent" align="center">{descriptions[mode]}</Typography>
    <Typography className="di-types__record-label" variant="bodySmall" tone="muted" align="center">同一位置的像素记录</Typography>
    <div className="di-types__value" aria-live="polite"><Typography variant={mode < 2 ? 'h3' : 'bodySmall'} tone="accent">{values[mode]}</Typography></div>
  </section>)}</div><footer className="di-types__takeaway"><svg viewBox="0 0 80 100" aria-hidden="true"><circle cx="40" cy="38" r="28" fill="#ffd777" /><path d="M23 35c0-11 7-19 18-19M33 76V53l7 7 7-7v23" fill="none" stroke="#fff8dc" strokeWidth="4" strokeLinecap="round" /><path d="M30 77h20v12H30z" fill="#3977ad" /><path d="M34 91h12" stroke="#244a73" strokeWidth="5" strokeLinecap="round" /></svg><div><Typography as="h2" variant="h3" tone="accent">一个像素可以记录明暗、颜色，还可以记录不透明度。</Typography><Typography variant="bodySmall" tone="muted">先看懂每个数的含义，再理解整幅图像怎样组织。</Typography></div></footer>{failed && <Typography variant="bodySmall" tone="danger" role="alert">猫咪素材加载失败，请刷新重试。</Typography>}</div></ContentBlock>;
}
