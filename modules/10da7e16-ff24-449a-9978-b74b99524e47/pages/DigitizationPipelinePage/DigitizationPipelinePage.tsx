import moduleAssetOutline from '../../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import './DigitizationPipelinePage.css';

const SIDE = 20;
const photo = moduleAssetUrl('images/digital-image-cat-scene.jpg');
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
    const image = new Image(); image.crossOrigin = 'anonymous';
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
  return <ContentBlock shuku-edit-id="e-886ec31e-cece-4001-a835-312a2a4b5afe" className="di-map" headingLevel={1} title="现实世界如何变成数字图像" subtitle="跟着同一幅图像，从场景中的光走到像素与数字。">
    <div shuku-edit-id="e-a7fde725-17cc-4fc0-b71d-03e49b4e12a3" className="di-map__body">
      <div shuku-edit-id="e-d686a45c-7fcb-4544-869f-8104d0a96bb3" className="di-map__flow" ref={flow}>
        <svg shuku-edit-id="e-1e79a72f-25d4-44fa-9a32-9a2e755ef439" className="di-map__connections" width="100%" height="100%" aria-hidden="true"><defs shuku-edit-id="e-b24c7be9-f57b-4bec-b9d7-f9439ee8df73"><marker shuku-edit-id="e-305ede94-9592-4865-8182-7984560223ed" id="di-map-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path shuku-edit-id="e-f277283b-dc74-4383-b627-ace336036122" d="M0 0L10 5L0 10Z" fill="#3276ba" /></marker></defs>{links.map((d, i) => <path shuku-edit-id="e-b5ce08a4-2fc2-4f2c-986b-472079bb5884" key={i} d={d} fill="none" stroke={i === 4 ? '#3276ba' : '#799fbe'} strokeWidth={i === 4 ? 2 : 1.5} strokeDasharray={i === 4 ? undefined : '6 5'} markerEnd={i === 4 ? 'url(#di-map-arrow)' : undefined} />)}</svg>
        <figure shuku-edit-id="e-74a59bda-bb10-44df-a33f-fdc83d6688a9" className="di-map__step di-map__world">
          <div shuku-edit-id="e-8d2916e7-2be3-4613-8156-b4451f4148d4" className="di-map__visual di-map__photo"><img shuku-edit-id="e-7e08fd72-2be3-4e3d-8f2b-2eeb5bcf58a7" src={photo} alt="暖光下坐在桌面的猫咪，作为现实场景示意" /><div shuku-edit-id="e-e668a9df-270b-4d46-b22e-4d7197507140" className="di-map__crop" style={{ left: `${crop.left * 100}%`, top: `${crop.top * 100}%`, width: `${crop.width * 100}%`, height: `${crop.height * 100}%` }} aria-hidden="true" /><span shuku-edit-id="e-f84eb79d-2830-4ee2-b78e-15654a9029d5" className="di-map__flow-arrow" aria-hidden="true">→</span></div>
          <figcaption shuku-edit-id="e-9567b7f7-dab7-4485-9a38-78e8cc96f84c"><Typography shuku-edit-id="e-95a2a3ec-ef8e-481a-92c8-e1e5830a719e" as="h2" variant="h3" tone="accent">现实世界的图像</Typography><Typography shuku-edit-id="e-0a618c67-9dd9-44d6-a1a8-aee7f2112df9" variant="bodySmall" tone="muted">连续的光和颜色</Typography></figcaption>
        </figure>
        <figure shuku-edit-id="e-6c7b7e9b-3e34-469b-b6fd-009e333eb61d" className="di-map__step di-map__pixels">
          <div shuku-edit-id="e-369c05bf-3949-492c-85fe-89c175a63e9f" className="di-map__visual di-map__zoom"><div shuku-edit-id="e-f1601860-e861-4fa4-9bfd-848ec222c981" className="di-map__pixel-frame"><canvas shuku-edit-id="e-2b36d446-1865-4f47-9d98-45905bc771d2" ref={canvas} width={SIDE} height={SIDE} role="img" aria-label="照片局部的 20×20 彩色像素网格" /><div shuku-edit-id="e-81476817-91ff-4160-b73e-334c81fd0002" className="di-map__grid-lines" aria-hidden="true" /><button shuku-edit-id="e-0605d151-faad-43ed-bba6-503f8b31ee51" type="button" className="di-map__pixel-picker" aria-label={`像素网格，当前选中行 ${row}、列 ${column}。点击选择，方向键移动。`} onPointerDown={event => { const b = event.currentTarget.getBoundingClientRect(); choose(Math.floor((event.clientY - b.top) / b.height * SIDE), Math.floor((event.clientX - b.left) / b.width * SIDE)); }} onKeyDown={event => { const keys: Record<string, [number, number]> = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }; const delta = keys[event.key]; if (delta) { event.preventDefault(); choose(row + delta[0], column + delta[1]); } }}><i shuku-edit-id="e-4cafda83-9462-490d-b68b-21bf251bb3a8" style={{ left: `${column * 5}%`, top: `${row * 5}%` }} /></button></div><span shuku-edit-id="e-b8ca00a4-3dd7-4231-b155-b2220f1b5820" className="di-map__flow-arrow" aria-hidden="true">→</span></div>
          <figcaption shuku-edit-id="e-e1ffa4b2-df20-4d6e-8dae-dca23e6d6ee9"><Typography shuku-edit-id="e-6e5b6e92-389b-4024-8623-4d5e79649cf7" as="h2" variant="h3" tone="accent">像素网格</Typography><Typography shuku-edit-id="e-d901e4ba-7482-47de-a510-98248eff9916" variant="bodySmall" tone="muted">把画面划分为许多小方格<br shuku-edit-id="e-7f78e091-c8c3-452d-a45c-0972ecc1c654" />每个小方格就是一个像素</Typography></figcaption>
        </figure>
        <figure shuku-edit-id="e-9f5a1982-67e8-44ef-9a6e-595efb6a340b" className="di-map__step di-map__channels">
          <div shuku-edit-id="e-cba44699-de77-4830-bcd3-3cfefceae7eb" className="di-map__visual di-map__rgb-panel"><div shuku-edit-id="e-1398b58d-07d0-49f1-9558-c6a95b5eb52b" className="di-map__swatch" style={{ background: color ? `rgb(${color.join(',')})` : '#dbe5ef' }} aria-label={color ? `当前像素颜色 ${tuple(color)}` : '正在读取像素'} /><div shuku-edit-id="e-b15214c4-de9a-452d-93c4-614422f8e33e" className="di-map__rgb-list" aria-live="polite">{['R', 'G', 'B'].map((name, i) => <div shuku-edit-id="e-4e0a3703-4992-494e-969f-90d8f5e7194e" className={`di-map__channel di-map__channel--${name}`} key={name}><Typography shuku-edit-id="e-f52481b0-6be2-4d76-99f6-8287824f2b09" as="span" variant="body" tone="light">{name}</Typography><Typography shuku-edit-id="e-2f0196a0-3e86-44e1-9dbe-6900f9913ed5" as="span" variant="body" tone="accent">{color?.[i] ?? '—'}</Typography></div>)}</div><span shuku-edit-id="e-f21fe84b-cfc0-44f0-bd65-d03a967b3ab1" className="di-map__flow-arrow" aria-hidden="true">→</span></div>
          <figcaption shuku-edit-id="e-9ce418da-f9bc-4672-9394-19bdbe6c230b"><Typography shuku-edit-id="e-5c967928-dade-4a2a-be5c-1af2b28ef50c" as="h2" variant="h3" tone="accent">每个像素用数字记录</Typography><Typography shuku-edit-id="e-30bda6a5-30ec-4bcf-95d8-4140ae78f67d" variant="bodySmall" tone="muted">颜色用一组数值表示<br shuku-edit-id="e-6b9daf1e-87f6-44ab-b2fe-4ce657639583" />例如 RGB 三个数</Typography></figcaption>
        </figure>
        <figure shuku-edit-id="e-1c867cee-5623-4781-bc36-269a5cb2fac2" className="di-map__step di-map__data">
          <div shuku-edit-id="e-b9d31ba8-d164-4165-802e-52c639e0470a" className="di-map__visual di-map__table-panel"><div shuku-edit-id="e-c1ee84ef-6476-4651-a107-d4ff40f31166" className="di-map__matrix" role="group" aria-label="图像数字表的局部，显示选中像素及其邻居">{Array.from({ length: 3 }, (_, r) => Array.from({ length: 3 }, (_, c) => { const index = (startRow + r) * SIDE + startColumn + c; return <button shuku-edit-id="e-8ee3c1e7-8e72-4ceb-967d-ce2500ba4a33" type="button" key={index} className={selected === index ? 'is-selected' : ''} aria-pressed={selected === index} aria-label={`行 ${startRow + r}，列 ${startColumn + c}，RGB ${pixels[index] ? tuple(pixels[index]) : '正在读取'}`} onClick={() => setSelected(index)}><Typography shuku-edit-id="e-1dc7b8ee-2512-4093-a23e-e096ecc4724f" as="span" variant="bodySmall" tone={selected === index ? 'accent' : 'muted'}>{pixels[index] ? tuple(pixels[index]) : '…'}</Typography></button>; }))}<div shuku-edit-id="e-f18101e7-06da-43b0-b5c2-160876d26def" aria-hidden="true"><Typography shuku-edit-id="e-93f4722c-6a5d-47f9-80f5-aee0f669db85" variant="bodySmall" tone="muted">…</Typography></div><div shuku-edit-id="e-4330ebb8-cf9b-4520-9997-3e52a8c9ce5b" aria-hidden="true"><Typography shuku-edit-id="e-ff9000c9-f835-4355-8b64-08a3d986112f" variant="bodySmall" tone="muted">…</Typography></div><div shuku-edit-id="e-c262c31c-9fcc-4098-adf8-9e0015bc4a15" aria-hidden="true"><Typography shuku-edit-id="e-04ac12bb-b36b-4705-914d-01181feb9c22" variant="bodySmall" tone="muted">…</Typography></div></div><Typography shuku-edit-id="e-db6eda10-e9c3-405f-ad54-8232b1172ab7" className="di-map__coordinates" variant="bodySmall" tone="muted">局部数字表 · 选中行 {row}，列 {column}</Typography></div>
          <figcaption shuku-edit-id="e-6a72d93d-31de-47e3-948f-eed551a8a38e"><Typography shuku-edit-id="e-df001f3b-6e24-4b87-8d57-d36aea49d693" as="h2" variant="h3" tone="accent">整幅图像是一张数字表</Typography><Typography shuku-edit-id="e-cd57de02-816f-435b-a4a4-545b656a28ae" variant="bodySmall" tone="muted">所有像素按位置排列<br shuku-edit-id="e-583b2e83-d6f1-4cca-81b8-c145ac3b8cd7" />就得到一个巨大的数字矩阵</Typography></figcaption>
        </figure>
      </div>
      <footer shuku-edit-id="e-bf138682-263e-4f43-a62e-41ba7a6c5bb3" className="di-map__takeaway"><svg shuku-edit-id="e-3bdecf5e-8868-493d-9ffc-6c10d4f70e14" className="di-map__bulb" viewBox="0 0 80 100" aria-hidden="true"><circle shuku-edit-id="e-d6163aa0-2ed7-4615-b755-447fc4d18247" cx="40" cy="38" r="29" fill="#ffd777" /><path shuku-edit-id="e-fa2ebcd1-7121-4f2e-a7a1-2e2d56b7b344" d="M22 36c0-13 8-20 19-20" fill="none" stroke="#fff9df" strokeWidth="5" strokeLinecap="round" /><path shuku-edit-id="e-151b0d53-fb70-4f7b-97c2-fa31bc91d43d" d="M27 61l6 17h14l6-17M34 77V52l6 6 6-6v25" fill="none" stroke="#fff5cb" strokeWidth="3" /><path shuku-edit-id="e-ec896529-4085-4a53-8613-c435591ba0bb" d="M30 78h20v10H30z" fill="#3977ad" /><path shuku-edit-id="e-f8f7a9b7-b3e3-4c9f-a805-4e38687c96ff" d="M34 90h12" stroke="#244a73" strokeWidth="6" strokeLinecap="round" /></svg><div shuku-edit-id="e-555408ff-6438-4ace-a1ac-0bbc7eafdc00"><Typography shuku-edit-id="e-23c8f645-ce7c-4a9a-9bae-a6a75f014509" as="h2" variant="h2" tone="accent">数字图像，本质上就是一张有位置的数字表。</Typography><Typography shuku-edit-id="e-ff28fe82-357a-444e-80be-b36135f09980" variant="body" tone="muted">连续画面被采样成像素，再用数字记录每个像素的颜色。</Typography></div></footer>
      {failed && <Typography shuku-edit-id="e-b94d2998-ba3e-44bf-a196-ea17f00b5ba8" variant="bodySmall" tone="danger" role="alert">场景照片加载失败，请刷新重试。</Typography>}
    </div>
  </ContentBlock>;
}
