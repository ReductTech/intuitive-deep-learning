import { useEffect, useRef, useState } from 'react';
import { Typography } from '../../../../shared/react';
import { creatorGuideAssetUrl } from '../creatorGuideAssets';
import './NativeStudyPreview.css';

const image = (file: string) => creatorGuideAssetUrl('', `images/multi-format/convolution/${file}`);
const scenes = [
  { id: 'gomoku-play', file: 'gomoku-play.jpg', title: '从五子棋开始认识卷积核', page: 1, duration: 350 },
  { id: 'gomoku-example', file: 'gomoku-play-completed.jpg', title: '示例棋局', page: 1, duration: 650 },
  { id: 'board-as-numbers', file: 'board-as-numbers.jpg', title: '棋盘局部区域的数值表示', page: 2, duration: 1400 },
  { id: 'window-scan', file: 'window-scan.png', title: '棋形的局部匹配', page: 3, duration: 1400 },
  { id: 'kernel-design', file: 'kernel-design.png', title: '根据棋形调整模板', page: 4, duration: 1400 },
] as const;

/** Lightweight playback for the presentation's small self-study preview. */
export function NativeStudyPreview() {
  const root = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const scene = scenes[index];
  useEffect(() => {
    let intersecting = false;
    const update = () => setVisible(intersecting && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { intersecting = entry.isIntersecting; update(); });
    if (root.current) observer.observe(root.current);
    document.addEventListener('visibilitychange', update);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, []);
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setIndex(value => (value + 1) % scenes.length), scene.duration);
    return () => clearTimeout(timer);
  }, [index, visible, scene.duration]);
  return <main ref={root} className="aipe-replay-cg-study-embedded">
    <div className="aipe-replay-cg-study-demo" data-preview-scene={scene.id}>
      <img src={image(scene.file)} alt={scene.title} draggable={false}/>
      {scene.page === 1 && <button className="aipe-replay-cg-study-example" aria-label="示例棋局" onClick={() => setIndex(1)}/>}
    </div>
    <div className="aipe-replay-cg-study-caption"><Typography variant="h3">{scene.title}</Typography><Typography variant="body" tone="muted">{scene.page} / 4</Typography></div>
  </main>;
}
