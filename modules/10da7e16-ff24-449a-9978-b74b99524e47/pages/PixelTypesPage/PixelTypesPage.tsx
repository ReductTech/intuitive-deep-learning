import moduleAssetOutline from '../../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import { useEffect, useRef, useState } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import './PixelTypesPage.css';

const cutout = moduleAssetUrl('images/digital-image-cat-cutout.png');
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
  return <canvas shuku-edit-id="e-cabae488-dfcf-4898-8d12-cf85323dde80" ref={ref} width={SIDE} height={SIDE} role="img" aria-label={types[mode]} />;
}
export function PixelTypesPage() {
  const [pixels, setPixels] = useState<Pixels>();
  const [selected, setSelected] = useState({ x: 190, y: 151 });
  const [opacity, setOpacity] = useState(.5);
  const [background, setBackground] = useState('checker');
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    const image = new Image(); image.crossOrigin = 'anonymous';
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
  return <ContentBlock shuku-edit-id="e-2d46b4ce-9bfe-4708-991e-cab74294d586" className="di-types" title="二值、灰度、彩色与 Alpha" subtitle="一个像素里，究竟记录什么？" headingLevel={1}><div shuku-edit-id="e-0e00b285-8e72-4c06-9021-c0399b80f0ff" className="di-types__body"><div shuku-edit-id="e-364cacb7-4f9d-4c35-ac7f-6e86910c47df" className="di-types__columns">{types.map((title, mode) => <section shuku-edit-id="e-3b8b1b8f-7edd-4d9e-8b8a-20dd94c75326" className="di-types__column" key={title}>
    <Typography shuku-edit-id="e-ff702f99-da13-4dc1-8c48-99d72e879c34" as="h2" variant="h3" tone="accent" align="center">{title}</Typography>
    <div shuku-edit-id="e-5748b1d3-3211-45dc-b5af-bc5d5bb3bd4e" className={`di-types__image ${mode === 3 ? `di-types__image--${background}` : ''}`}><PixelCanvas pixels={pixels} mode={mode} opacity={opacity} /><button shuku-edit-id="e-74c38567-4a74-4e52-bcaa-8ff0b5afe5ba" className="di-types__picker" type="button" aria-label={`${title}，点击或使用方向键选择像素`} onPointerDown={event => { const b = event.currentTarget.getBoundingClientRect(); choose(Math.floor((event.clientX - b.left) / b.width * SIDE), Math.floor((event.clientY - b.top) / b.height * SIDE)); }} onKeyDown={event => { const deltas: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }; if (deltas[event.key]) { event.preventDefault(); choose(selected.x + deltas[event.key][0], selected.y + deltas[event.key][1]); } }}><i shuku-edit-id="e-1819690f-6c55-4354-ac5a-53aa2933c5c8" style={{ left: `${selected.x / SIDE * 100}%`, top: `${selected.y / SIDE * 100}%` }} /></button>
    {mode === 3 && <><div shuku-edit-id="e-5dfc9ce6-1430-4cb0-82bf-af4f11baad0b" className="di-types__backgrounds" role="group" aria-label="RGBA 背景">{[['checker', '棋盘格'], ['white', '白色'], ['blue', '蓝色']].map(([id, label]) => <button shuku-edit-id="e-19190735-c7bf-4c51-a51f-b1119fc12aaa" type="button" key={id} aria-pressed={background === id} className={background === id ? 'is-selected' : ''} onClick={() => setBackground(id)}><Typography shuku-edit-id="e-d2afa6e1-6109-4dc0-9d76-ab990e0cb29a" as="span" variant="bodySmall" tone="inherit">{label}</Typography></button>)}</div><label shuku-edit-id="e-be0e8f40-3934-4aa5-a82b-6ef33dbb873a" className="di-types__alpha"><Typography shuku-edit-id="e-d00e36c2-0cf2-44fc-a4a7-22a431d3cafa" as="span" variant="bodySmall" tone="accent">Alpha</Typography><input shuku-edit-id="e-7a45b483-45c6-47f6-ae7f-3374c1780e12" type="range" min="0" max="1" step="0.01" value={opacity} onChange={event => setOpacity(Number(event.target.value))} aria-label="Alpha 不透明度" /><Typography shuku-edit-id="e-0a4e8661-43c3-4f60-8cd9-1d315d3caf5a" as="span" variant="bodySmall" tone="accent">{opacity.toFixed(2)}</Typography></label></>}
    </div>
    <Typography shuku-edit-id="e-73a69031-15ea-4621-af2f-62290b479e6e" className="di-types__description" variant="bodySmall" tone="accent" align="center">{descriptions[mode]}</Typography>
    <Typography shuku-edit-id="e-be20689b-a416-4310-8d0a-de6a7c2edf1b" className="di-types__record-label" variant="bodySmall" tone="muted" align="center">同一位置的像素记录</Typography>
    <div shuku-edit-id="e-e2667bb3-06db-4977-8da8-badaa0a566db" className="di-types__value" aria-live="polite"><Typography shuku-edit-id="e-5f7f14ce-b0b8-4493-8f98-4b92bd7b11db" variant={mode < 2 ? 'h3' : 'bodySmall'} tone="accent">{values[mode]}</Typography></div>
  </section>)}</div><footer shuku-edit-id="e-3eda1f14-25dc-4bfc-9b81-7a038b9ce169" className="di-types__takeaway"><svg shuku-edit-id="e-316269c3-747d-4cd1-815d-55027a05f35d" viewBox="0 0 80 100" aria-hidden="true"><circle shuku-edit-id="e-850f5cb1-8a95-4264-be72-1c20712e2d4d" cx="40" cy="38" r="28" fill="#ffd777" /><path shuku-edit-id="e-c66b7f9b-b4bd-4b80-8c0e-5e0d6035abc0" d="M23 35c0-11 7-19 18-19M33 76V53l7 7 7-7v23" fill="none" stroke="#fff8dc" strokeWidth="4" strokeLinecap="round" /><path shuku-edit-id="e-eaa5d3e0-e73b-4795-8568-33774c9f168b" d="M30 77h20v12H30z" fill="#3977ad" /><path shuku-edit-id="e-1cf0e2d8-969e-4f6e-a6ad-c8d9d8ec67b4" d="M34 91h12" stroke="#244a73" strokeWidth="5" strokeLinecap="round" /></svg><div shuku-edit-id="e-e0854231-7bba-4821-a1ed-c6a39693f637"><Typography shuku-edit-id="e-c38b7fcc-1d9d-4582-9018-96805525d506" as="h2" variant="h3" tone="accent">一个像素可以记录明暗、颜色，还可以记录不透明度。</Typography><Typography shuku-edit-id="e-428191e5-9a5c-40d0-9939-679cc85611be" variant="bodySmall" tone="muted">先看懂每个数的含义，再理解整幅图像怎样组织。</Typography></div></footer>{failed && <Typography shuku-edit-id="e-6984fea8-eca4-4a8e-9d3d-e2f9d10beb50" variant="bodySmall" tone="danger" role="alert">猫咪素材加载失败，请刷新重试。</Typography>}</div></ContentBlock>;
}
