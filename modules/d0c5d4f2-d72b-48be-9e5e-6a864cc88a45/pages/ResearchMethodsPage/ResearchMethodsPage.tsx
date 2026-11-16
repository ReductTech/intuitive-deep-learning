import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Typography } from "@shuku/course-style/react";
import outline from '../../outlines.json';
import sourcePapers from './papers.json';
import './ResearchMethodsPage.css';

const order = ['tempsamp', 'realign', 'tokens', 'gmm', 'res2net', 'attention', 'segnext', 'smeasure', 'emeasure', 'mstcn', 'maecil', 'cascadeclip'];
const papers = order.map(id => sourcePapers.find(paper => paper.id === id)!);
// The opening paper keeps its identity and its place as the camera pulls back.
const positions = [5, 6, 9, 10, 0, 3, 4, 7, 1, 2, 8, 11];
const END = 9500, ZOOM_START = 1300, ZOOM_DURATION = 6300;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const ease = (value: number) => { const t = clamp(value); return t * t * t * (t * (t * 6 - 15) + 10); };

function PaperImage({ paper }: { paper: typeof papers[number] }) {
  return paper.id === 'tokens'
    ? <div shuku-edit-id="e-1579510b-7c45-4f6f-b18f-e81aa389fa56" className="rf-research-specimen"><Typography shuku-edit-id="e-73d0d278-55f1-48cc-946c-7c26f73fcd31" variant="bodySmall">International Journal of Computer Vision</Typography><Typography shuku-edit-id="e-bbb400f0-37b8-49f2-91ff-89d9f346308e" variant="h2">{paper.title}</Typography><Typography shuku-edit-id="e-4b15f839-6af0-48ef-90f0-cbbdce463d88" variant="bodySmall">2026 · 持续学习</Typography></div>
    : <img shuku-edit-id="e-bfe93520-d9e9-42ad-8960-975918bfa861" draggable={false} src={moduleAssetUrl(`research-papers/${paper.id}.jpg`)} alt={`${paper.name} 论文原稿首页`} />;
}

export function ResearchMethodsPage() {
  const root = useRef<HTMLElement>(null), elapsed = useRef(0);
  const [time, setTime] = useState(0), [available, setAvailable] = useState(false);
  const [ready, setReady] = useState(false), [reduced, setReduced] = useState(false);
  const progress = ease((time - ZOOM_START) / ZOOM_DURATION);
  const cameraScale = reduced ? 1 : 3 - 2 * progress;
  const cameraX = reduced ? 0 : 567 * (1 - progress);
  const stage = reduced || time >= END ? 'wall' : time < ZOOM_START ? 'focus' : 'reveal';

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let intersecting = false, cancelled = false;
    const visible = () => setAvailable(intersecting && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { intersecting = entry.isIntersecting; visible(); });
    observer.observe(element);
    document.addEventListener('visibilitychange', visible);
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const motion = () => setReduced(media.matches);
    motion(); media.addEventListener('change', motion);
    Promise.all([document.fonts.ready, ...Array.from(element.querySelectorAll('img')).map(img => img.decode().catch(() => undefined))])
      .then(() => { if (!cancelled) setReady(true); });
    return () => {
      cancelled = true; observer.disconnect();
      document.removeEventListener('visibilitychange', visible); media.removeEventListener('change', motion);
    };
  }, []);

  useEffect(() => {
    if (!available || !ready || reduced || elapsed.current >= END) return;
    let frame = 0, last = performance.now();
    const tick = (now: number) => {
      elapsed.current = Math.min(END, elapsed.current + Math.max(0, Math.min(now - last, 100)));
      setTime(elapsed.current); last = now;
      if (elapsed.current < END) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [available, ready, reduced]);

  return <section shuku-edit-id="e-f7b0bc6b-621d-4f73-939b-4f56db6eed58" ref={root} className="rf-page rf-research" aria-label="连续研究积累" data-stage={stage} data-time={Math.round(time)} data-camera-scale={cameraScale.toFixed(4)} data-capture-ready={ready} data-playing={available && ready && !reduced && time < END}>
    <header shuku-edit-id="e-720c5e4c-4a65-4acb-a0ee-412ead4e205c" className="rf-research-heading">
      <Typography shuku-edit-id="e-fff45e7d-01c4-4aa2-83c0-1bf870abb6ae" as="h1" variant="h1">连续研究积累</Typography>
      <Typography shuku-edit-id="e-a91627a5-3b37-4dd9-864e-cf7c30614493" variant="bodySmall" className="rf-research-summary">近五年，团队在相关方向发表 <strong shuku-edit-id="e-37f47fec-99e9-4b2f-8ed1-96e5dda41269">CCF A 类论文 10 篇以上</strong></Typography>
    </header>
    <div shuku-edit-id="e-03ece21e-1f47-4fc2-9313-53d4342c64a3" className="rf-research-viewport" data-ppt-viewport="论文固定排版的镜头拉远视口；开场聚焦一篇，最终完整展示12篇" aria-label="从代表论文拉远至完整研究成果">
      <div shuku-edit-id="e-085578ce-eecd-45d5-aa46-81def2c486a2" className="rf-research-camera" style={{ transform: `translateX(${cameraX}px) scale(${cameraScale})` }}>
        {papers.map((paper, index) => {
          const slot = positions[index];
          const opacity = reduced || index === 0 ? 1 : ease((time - (1650 + (index - 1) * 350)) / 1500);
          const style: CSSProperties = {
            left: 752 + (slot % 4 - 1.5) * 376 - 179,
            top: 358 + (Math.floor(slot / 4) - 1) * 224 - 104,
            opacity,
            transform: `translateY(${reduced ? 0 : 12 * (1 - opacity)}px)`,
          };
          return <article shuku-edit-id="e-c73cbd64-d978-4fd1-ba4e-85106e7a9eb5" key={paper.id} className="rf-research-paper" style={style} aria-hidden={opacity < .05} data-paper={paper.id}>
            <figure shuku-edit-id="e-06f18405-a8eb-4530-94a7-8fe386af8e6c" className="rf-research-image"><PaperImage paper={paper} /></figure>
            <div shuku-edit-id="e-5b84cbff-93e9-40b0-92ca-02ec390eb897" className="rf-research-copy">
              <Typography shuku-edit-id="e-60f986e9-2c17-4097-88a4-b699dac0eaee" as="h2" variant="h2" className="rf-research-title">{paper.title}</Typography>
              <Typography shuku-edit-id="e-7decf7e0-ac74-45a1-8961-88895b7ffa4f" variant="bodySmall" className="rf-research-publication">{paper.venue} <span shuku-edit-id="e-c83667e7-bfb6-441a-8c18-5e1d54b1cab7">· {paper.year}</span></Typography>
            </div>
          </article>;
        })}
      </div>
    </div>
  </section>;
}
