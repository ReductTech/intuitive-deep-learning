import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ContentBlock, Typography } from '../../../shared/react';
import './DigitizationPipelinePage.css';

const SIDE = 20;
const photo = new URL('../../assets/digital-image-cat-scene.png', import.meta.url).href;
type RGB = [number, number, number];
const tuple = (rgb: RGB) => `[${rgb.join(',')}]`;

export function DigitizationPipelinePage() {
  const [pixels, setPixels] = useState<RGB[]>([]);
  const [selected, setSelected] = useState(10 * SIDE + 6);
  const [failed, setFailed] = useState(false);
  const [crop, setCrop] = useState({ left: .4, top: .25, width: .32, height: .25 });
  const canvas = useRef<HTMLCanvasElement>(null);
  const flow = useRef<HTMLDivElement>(null);
  const [links, setLinks] = useState<string[]>([]);
  useLayoutEffect(() => {
    const container = flow.current;
    if (!container) return;
    const update = () => {
      const b = container.getBoundingClientRect();
      if (!b.width || !b.height) return;
      const scaleX = container.clientWidth / b.width, scaleY = container.clientHeight / b.height;
      const rect = (selector: string) => {
        const element = container.querySelector(selector);
        if (!element) return null;
        const r = element.getBoundingClientRect();
        return { left: (r.left - b.left) * scaleX, right: (r.right - b.left) * scaleX, top: (r.top - b.top) * scaleY, bottom: (r.bottom - b.top) * scaleY };
      };
      const c = rect('.di-map__crop'), z = rect('.di-map__pixel-frame'), swatch = rect('.di-map__swatch');
      const pick = rect('.di-map__pixel-picker i'), target = rect('.di-map__matrix button.is-selected'), blue = rect('.di-map__channel--R');
      if (!c || !z || !swatch || !pick || !target || !blue) return;
      setLinks([
        `M${c.right} ${c.top}L${z.left} ${z.top}`,
        `M${c.right} ${c.bottom}L${z.left} ${z.bottom}`,
        `M${pick.right} ${pick.top}L${swatch.left} ${swatch.top}`,
        `M${pick.right} ${pick.bottom}L${swatch.left} ${swatch.bottom}`,
        `M${blue.right} ${(blue.top + blue.bottom) / 2}L${target.left} ${(target.top + target.bottom) / 2}`,
      ]);
    };
    update(); const observer = new ResizeObserver(update); observer.observe(container);
    return () => observer.disconnect();
  }, [selected, pixels, crop]);
  useEffect(() => {
    let active = true;
    const image = new Image();
    image.onload = () => {
      if (!active) return;
      const source = document.createElement('canvas'); source.width = source.height = SIDE;
      const context = source.getContext('2d');
      if (!context) { setFailed(true); return; }
      const side = image.naturalWidth * .32;
      const x = image.naturalWidth * .43, y = image.naturalHeight * .25;
      context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'high';
      context.drawImage(image, x, y, side, side, 0, 0, SIDE, SIDE);
      const rgba = context.getImageData(0, 0, SIDE, SIDE).data;
      setCrop({ left: x / image.naturalWidth, top: y / image.naturalHeight, width: side / image.naturalWidth, height: side / image.naturalHeight });
      setPixels(Array.from({ length: SIDE * SIDE }, (_, i) => [rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]] as RGB));
    };
    image.onerror = () => { if (active) setFailed(true); };
    image.src = photo;
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const context = canvas.current?.getContext('2d');
    if (!context || !pixels.length) return;
    const data = context.createImageData(SIDE, SIDE);
    pixels.forEach((rgb, i) => data.data.set([...rgb, 255], i * 4));
    context.putImageData(data, 0, 0);
  }, [pixels]);
  const row = Math.floor(selected / SIDE), column = selected % SIDE;
  const color = pixels[selected];
  const startRow = Math.max(0, Math.min(SIDE - 3, row - 1));
  const startColumn = Math.max(0, Math.min(SIDE - 3, column - 1));
  const choose = (nextRow: number, nextColumn: number) => setSelected(Math.max(0, Math.min(SIDE - 1, nextRow)) * SIDE + Math.max(0, Math.min(SIDE - 1, nextColumn)));
  return <ContentBlock className="di-map" headingLevel={1} title="现实世界如何变成数字图像" subtitle="跟着同一幅图像，从场景中的光走到像素与数字。">
    <div className="di-map__body">
      <div className="di-map__flow" ref={flow}>
        <svg className="di-map__connections" width="100%" height="100%" aria-hidden="true"><defs><marker id="di-map-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#3276ba" /></marker></defs>{links.map((d, i) => <path key={i} d={d} fill="none" stroke={i === 4 ? '#3276ba' : '#799fbe'} strokeWidth={i === 4 ? 2 : 1.5} strokeDasharray={i === 4 ? undefined : '6 5'} markerEnd={i === 4 ? 'url(#di-map-arrow)' : undefined} />)}</svg>
        <figure className="di-map__step di-map__world">
          <div className="di-map__visual di-map__photo"><img src={photo} alt="暖光下坐在桌面的猫咪，作为现实场景示意" /><div className="di-map__crop" style={{ left: `${crop.left * 100}%`, top: `${crop.top * 100}%`, width: `${crop.width * 100}%`, height: `${crop.height * 100}%` }} aria-hidden="true" /><span className="di-map__flow-arrow" aria-hidden="true">→</span></div>
          <figcaption><Typography as="h2" variant="h3" tone="accent">现实世界的图像</Typography><Typography variant="bodySmall" tone="muted">连续的光和颜色</Typography></figcaption>
        </figure>
        <figure className="di-map__step di-map__pixels">
          <div className="di-map__visual di-map__zoom"><div className="di-map__pixel-frame"><canvas ref={canvas} width={SIDE} height={SIDE} role="img" aria-label="照片局部的 20×20 彩色像素网格" /><div className="di-map__grid-lines" aria-hidden="true" /><button type="button" className="di-map__pixel-picker" aria-label={`像素网格，当前选中行 ${row}、列 ${column}。点击选择，方向键移动。`} onPointerDown={event => { const b = event.currentTarget.getBoundingClientRect(); choose(Math.floor((event.clientY - b.top) / b.height * SIDE), Math.floor((event.clientX - b.left) / b.width * SIDE)); }} onKeyDown={event => { const keys: Record<string, [number, number]> = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }; const delta = keys[event.key]; if (delta) { event.preventDefault(); choose(row + delta[0], column + delta[1]); } }}><i style={{ left: `${column * 5}%`, top: `${row * 5}%` }} /></button></div><span className="di-map__flow-arrow" aria-hidden="true">→</span></div>
          <figcaption><Typography as="h2" variant="h3" tone="accent">像素网格</Typography><Typography variant="bodySmall" tone="muted">把画面划分为许多小方格<br />每个小方格就是一个像素</Typography></figcaption>
        </figure>
        <figure className="di-map__step di-map__channels">
          <div className="di-map__visual di-map__rgb-panel"><div className="di-map__swatch" style={{ background: color ? `rgb(${color.join(',')})` : '#dbe5ef' }} aria-label={color ? `当前像素颜色 ${tuple(color)}` : '正在读取像素'} /><div className="di-map__rgb-list" aria-live="polite">{['R', 'G', 'B'].map((name, i) => <div className={`di-map__channel di-map__channel--${name}`} key={name}><Typography as="span" variant="body" tone="light">{name}</Typography><Typography as="span" variant="body" tone="accent">{color?.[i] ?? '—'}</Typography></div>)}</div><span className="di-map__flow-arrow" aria-hidden="true">→</span></div>
          <figcaption><Typography as="h2" variant="h3" tone="accent">每个像素用数字记录</Typography><Typography variant="bodySmall" tone="muted">颜色用一组数值表示<br />例如 RGB 三个数</Typography></figcaption>
        </figure>
        <figure className="di-map__step di-map__data">
          <div className="di-map__visual di-map__table-panel"><div className="di-map__matrix" role="group" aria-label="图像数字表的局部，显示选中像素及其邻居">{Array.from({ length: 3 }, (_, r) => Array.from({ length: 3 }, (_, c) => { const index = (startRow + r) * SIDE + startColumn + c; return <button type="button" key={index} className={selected === index ? 'is-selected' : ''} aria-pressed={selected === index} aria-label={`行 ${startRow + r}，列 ${startColumn + c}，RGB ${pixels[index] ? tuple(pixels[index]) : '正在读取'}`} onClick={() => setSelected(index)}><Typography as="span" variant="bodySmall" tone={selected === index ? 'accent' : 'muted'}>{pixels[index] ? tuple(pixels[index]) : '…'}</Typography></button>; }))}<div aria-hidden="true"><Typography variant="bodySmall" tone="muted">…</Typography></div><div aria-hidden="true"><Typography variant="bodySmall" tone="muted">…</Typography></div><div aria-hidden="true"><Typography variant="bodySmall" tone="muted">…</Typography></div></div><Typography className="di-map__coordinates" variant="bodySmall" tone="muted">局部数字表 · 选中行 {row}，列 {column}</Typography></div>
          <figcaption><Typography as="h2" variant="h3" tone="accent">整幅图像是一张数字表</Typography><Typography variant="bodySmall" tone="muted">所有像素按位置排列<br />就得到一个巨大的数字矩阵</Typography></figcaption>
        </figure>
      </div>
      <footer className="di-map__takeaway"><svg className="di-map__bulb" viewBox="0 0 80 100" aria-hidden="true"><circle cx="40" cy="38" r="29" fill="#ffd777" /><path d="M22 36c0-13 8-20 19-20" fill="none" stroke="#fff9df" strokeWidth="5" strokeLinecap="round" /><path d="M27 61l6 17h14l6-17M34 77V52l6 6 6-6v25" fill="none" stroke="#fff5cb" strokeWidth="3" /><path d="M30 78h20v10H30z" fill="#3977ad" /><path d="M34 90h12" stroke="#244a73" strokeWidth="6" strokeLinecap="round" /></svg><div><Typography as="h2" variant="h2" tone="accent">数字图像，本质上就是一张有位置的数字表。</Typography><Typography variant="body" tone="muted">连续画面被采样成像素，再用数字记录每个像素的颜色。</Typography></div></footer>
      {failed && <Typography variant="bodySmall" tone="danger" role="alert">场景照片加载失败，请刷新重试。</Typography>}
    </div>
  </ContentBlock>;
}
