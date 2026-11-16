import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import { measureMnistImage, MNIST_INK_THRESHOLD } from '../../services/mnistFeatures';
import './RawPixelVariationPage.css';

const ASSET_ID = '80396753-7fc8-4f55-9188-bddbdb828169';
const samples = ['mnist/3/60030.jpg', 'mnist/3/60032.jpg'];
type Highlight = 'shared' | 'single' | 'background' | 'a' | 'b';
type PixelCache = { images: ImageData[]; a: boolean[]; b: boolean[]; width: number; height: number };
type Comparison = { same: number; foreground: number };
function loadSample(file: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('无法加载 MNIST 样本'));
    image.src = moduleAssetUrl(file);
  });
}
export function RawPixelVariationPage() {
  const leftRef = useRef<HTMLCanvasElement>(null);
  const rightRef = useRef<HTMLCanvasElement>(null);
  const mapRef = useRef<HTMLCanvasElement>(null);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [failed, setFailed] = useState(false);
  const cacheRef = useRef<PixelCache | null>(null);
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const [hoveredPixel, setHoveredPixel] = useState<number | null>(null);
  const clearHighlight = () => { setHighlight(null); setHoveredPixel(null); };
  const highlightGroup = (group: Highlight) => { setHighlight(group); setHoveredPixel(null); };
  const hoverPixel = (event: PointerEvent<HTMLCanvasElement>) => {
    const cache = cacheRef.current;
    if (!cache) return;
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    // Bounding rect includes the scaled border; hit-test only the bitmap content.
    const scaleX = rect.width / canvas.offsetWidth;
    const scaleY = rect.height / canvas.offsetHeight;
    const localX = event.clientX - rect.left - canvas.clientLeft * scaleX;
    const localY = event.clientY - rect.top - canvas.clientTop * scaleY;
    const x = Math.floor(localX / (canvas.clientWidth * scaleX) * cache.width);
    const y = Math.floor(localY / (canvas.clientHeight * scaleY) * cache.height);
    if (x < 0 || y < 0 || x >= cache.width || y >= cache.height) { clearHighlight(); return; }
    const index = y * cache.width + x;
    setHoveredPixel(index);
    setHighlight(cache.a[index] && cache.b[index] ? 'shared' : cache.a[index] || cache.b[index] ? 'single' : 'background');
  };
  useEffect(() => {
    let active = true;
    Promise.all(samples.map(loadSample)).then(([left, right]) => {
      if (!active) return;
      const a = measureMnistImage(left);
      const b = measureMnistImage(right);
      if (!a || !b) throw new Error('样本没有墨迹');
      // Smallest shared box in original coordinates; no resizing or extra background.
      const x = Math.min(a.minX, b.minX), y = Math.min(a.minY, b.minY);
      const width = Math.max(a.maxX, b.maxX) - x + 1;
      const height = Math.max(a.maxY, b.maxY) - y + 1;
      const contexts = [leftRef.current, rightRef.current, mapRef.current].map((canvas) => {
        if (!canvas) throw new Error('画布不可用');
        canvas.width = width; canvas.height = height;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) throw new Error('画布不可用');
        return context;
      });
      [left, right].forEach((image, index) => contexts[index].drawImage(image, x, y, width, height, 0, 0, width, height));
      const pixels = contexts.slice(0, 2).map((context) => context.getImageData(0, 0, width, height).data);
      const map = contexts[2].createImageData(width, height);
      const masks = pixels.map((data) => Array.from({ length: width * height }, (_, index) => {
        const offset = index * 4;
        return (data[offset] + data[offset + 1] + data[offset + 2]) / 3 >= MNIST_INK_THRESHOLD;
      }));
      let same = 0;
      let foreground = 0;
      for (let index = 0; index < width * height; index += 1) {
        const offset = index * 4;
        const ink = pixels.map((data) => (data[offset] + data[offset + 1] + data[offset + 2]) / 3 >= MNIST_INK_THRESHOLD);
        const sharedInk = ink[0] && ink[1];
        const anyInk = ink[0] || ink[1];
        if (sharedInk) same += 1;
        if (anyInk) foreground += 1;
        const color = sharedInk ? [244, 246, 249] : anyInk ? [245, 112, 78] : [0, 0, 0];
        map.data.set([...color, 255], offset);
      }
      contexts[2].putImageData(map, 0, 0);
      cacheRef.current = { images: [contexts[0].getImageData(0, 0, width, height), contexts[1].getImageData(0, 0, width, height), map], a: masks[0], b: masks[1], width, height };
      setComparison({ same, foreground });
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const cache = cacheRef.current;
    if (!cache) return;
    [leftRef.current, rightRef.current, mapRef.current].forEach((canvas, imageIndex) => {
      const context = canvas?.getContext('2d');
      if (!context) return;
      const source = cache.images[imageIndex];
      const output = new ImageData(new Uint8ClampedArray(source.data), cache.width, cache.height);
      if (highlight) {
        for (let index = 0; index < cache.width * cache.height; index += 1) {
          const a = cache.a[index], b = cache.b[index];
          const selected = highlight === 'a' ? a : highlight === 'b' ? b : highlight === 'shared' ? a && b : highlight === 'single' ? a !== b : !a && !b;
          if (!selected) {
            for (let channel = 0; channel < 3; channel += 1) output.data[index * 4 + channel] *= 0.18;
          } else if (highlight === 'background') {
            output.data.set([75, 90, 111, 255], index * 4);
          }
        }
      }
      context.putImageData(output, 0, 0);
      if (hoveredPixel !== null) {
        const x = hoveredPixel % cache.width, y = Math.floor(hoveredPixel / cache.width);
        context.fillStyle = 'rgba(114, 185, 255, .4)';
        context.fillRect(x, y, 1, 1);
        context.strokeStyle = '#72b9ff';
        context.lineWidth = 0.16;
        context.strokeRect(x + 0.08, y + 0.08, 0.84, 0.84);
      }
    });
  }, [comparison, highlight, hoveredPixel]);
  return <ContentBlock shuku-edit-id="e-2d480f20-57b8-45f5-a014-0939fcf4053d" className="vfl-pixel" headingLevel={1}
    title="同类数字的像素差异" subtitle="在最小外接矩形内比较前景像素，分析逐像素匹配的局限。">
    <section shuku-edit-id="e-65dd4803-9c29-45bc-876c-9d3083877f30" className="vfl-pixel__comparison" aria-label="共同最小外接框内的像素比较">
      <figure shuku-edit-id="e-a0841524-9163-47a5-89d5-df9f32a1ddc2" className="vfl-pixel__sample" onMouseEnter={() => highlightGroup('a')} onMouseLeave={clearHighlight}>
        <Typography shuku-edit-id="e-a9a0371a-5844-4d15-b4e3-5301bbd7ae10" as="h2" variant="h3" tone="accent">样本 A</Typography>
        <div shuku-edit-id="e-2d4bda45-d63a-4df6-b523-046d6fdde351" className="vfl-pixel__image-frame"><canvas shuku-edit-id="e-8c6788fa-b852-41d5-b536-21e96816e5f5" ref={leftRef} onPointerMove={hoverPixel} onPointerLeave={clearHighlight} role="img" aria-label="最小共同外接框内的样本 A" /></div>
      </figure>
      <svg shuku-edit-id="e-2994781f-dab1-4b1a-b33b-26812eda88b8" className="vfl-pixel__arrow" viewBox="0 0 64 48" aria-hidden="true"><path shuku-edit-id="e-1906ce5a-9515-4644-9f1b-d83c86c13f37" d="M0 13H34V0L64 24 34 48V35H0Z" /></svg>
      <div shuku-edit-id="e-ba4913e6-1ea5-4a7f-ad44-5348102fb415" className="vfl-pixel__difference">
        <Typography shuku-edit-id="e-6d5dcbb7-b965-4d14-843c-5144f6104f7c" as="h2" variant="h3" tone="accent">前景像素对比</Typography>
        <div shuku-edit-id="e-2c0c2560-8160-4a6b-943d-8bcfe43208d3" className="vfl-pixel__legend">
          <span shuku-edit-id="e-61ae10dc-98f5-44b1-a7c8-b64dc8b9b84c" className="vfl-pixel__legend-target" tabIndex={0} data-active={highlight === 'shared'} onMouseEnter={() => highlightGroup('shared')} onMouseLeave={clearHighlight} onFocus={() => highlightGroup('shared')} onBlur={clearHighlight}><Typography shuku-edit-id="e-b2b2fd1e-cf0b-4404-a6b1-eaf3bee90d34" as="span" variant="bodySmall" tone="muted"><i shuku-edit-id="e-499f0026-2682-4e82-a914-71ad51146245" className="vfl-pixel__swatch vfl-pixel__swatch--shared" aria-hidden="true" />重合前景</Typography></span>
          <span shuku-edit-id="e-d5c0c10c-865e-44a8-9066-f08931a241f0" className="vfl-pixel__legend-target" tabIndex={0} data-active={highlight === 'single'} onMouseEnter={() => highlightGroup('single')} onMouseLeave={clearHighlight} onFocus={() => highlightGroup('single')} onBlur={clearHighlight}><Typography shuku-edit-id="e-bcdc28bb-7857-40b0-9744-a9745a37586f" as="span" variant="bodySmall" tone="muted"><i shuku-edit-id="e-ab22bb02-f0e4-4b8d-a24a-f64853cb629d" className="vfl-pixel__swatch vfl-pixel__swatch--single" aria-hidden="true" />非重合前景</Typography></span>
          <span shuku-edit-id="e-6f0fffa5-7251-4736-9ae9-62e57241b1e1" className="vfl-pixel__legend-target" tabIndex={0} data-active={highlight === 'background'} onMouseEnter={() => highlightGroup('background')} onMouseLeave={clearHighlight} onFocus={() => highlightGroup('background')} onBlur={clearHighlight}><Typography shuku-edit-id="e-66acf829-58c0-4d66-9160-9f37272280e4" as="span" variant="bodySmall" tone="muted"><i shuku-edit-id="e-008ef6ff-e534-4e60-8ac3-73d481cc08ce" className="vfl-pixel__swatch vfl-pixel__swatch--background" aria-hidden="true" />背景</Typography></span>
        </div>
        <div shuku-edit-id="e-b1a998ed-e843-4423-9346-88566d1cb10e" className="vfl-pixel__image-frame"><canvas shuku-edit-id="e-dfc512cf-8cca-4b4e-aa96-e9884aab8ba7" ref={mapRef} onPointerMove={hoverPixel} onPointerLeave={clearHighlight} role="img" aria-label="白色为重合前景，橙色为非重合前景，黑色为背景" /></div>
        <div shuku-edit-id="e-c3ebe2b1-28c2-4d48-a125-78ce6f0935da" className="vfl-pixel__result" aria-live="polite">
          <Typography shuku-edit-id="e-6c472fbf-40f3-47fe-8942-f64704caa8ca" as="p" variant="h3" tone="accent" className="vfl-pixel__percent">{comparison ? (comparison.same / comparison.foreground * 100).toFixed(1) + '% 前景像素相同' : failed ? '样本加载失败，请刷新重试' : '正在计算…'}</Typography>
        </div>
      </div>
      <svg shuku-edit-id="e-d5876926-c342-4fbd-9300-188427421fcd" className="vfl-pixel__arrow vfl-pixel__arrow--left" viewBox="0 0 64 48" aria-hidden="true"><path shuku-edit-id="e-67120642-8b61-4b9f-adb2-b3a030d50119" d="M0 13H34V0L64 24 34 48V35H0Z" /></svg>
      <figure shuku-edit-id="e-cfabda5b-4ee6-4a84-b2e1-92b6567831bf" className="vfl-pixel__sample" onMouseEnter={() => highlightGroup('b')} onMouseLeave={clearHighlight}>
        <Typography shuku-edit-id="e-0b92a333-5ac9-4788-83d5-2be13fa7ea40" as="h2" variant="h3" tone="accent">样本 B</Typography>
        <div shuku-edit-id="e-02f32c20-9bf2-45aa-ad1d-3235fe0fc9e5" className="vfl-pixel__image-frame"><canvas shuku-edit-id="e-e35af9b8-9021-48d2-ae80-456b52ca8e64" ref={rightRef} onPointerMove={hoverPixel} onPointerLeave={clearHighlight} role="img" aria-label="最小共同外接框内的样本 B" /></div>
      </figure>
    </section>
    <div shuku-edit-id="e-802ca8a5-6987-496e-bcf8-6d93b90d76ce" className="vfl-pixel__takeaway"><span shuku-edit-id="e-0215f3bd-0e2d-43ec-a2c0-49efe47b243a" className="vfl-pixel__notice" aria-hidden="true"><svg shuku-edit-id="e-922b3b8d-4db5-4d65-90a4-fd7630f3e8de" viewBox="0 0 32 32"><path shuku-edit-id="e-5464ffa7-a6b5-439f-977b-f8e03c23c9e9" d="M16 6v13" /><circle shuku-edit-id="e-1cefc61d-5c4d-4ba2-b519-51f825c6d427" cx="16" cy="25" r="2" /></svg></span><Typography shuku-edit-id="e-996886be-a452-457e-8e05-f7be0149d4d4" as="p" variant="h3" tone="accent">同一类别的数字，前景像素仍可能存在较大差异。</Typography></div>
  </ContentBlock>;
}

