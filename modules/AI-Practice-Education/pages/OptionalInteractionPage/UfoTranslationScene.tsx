// Scene assets, compositing, pointer control and idle trajectory copied from the original module.
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { moduleAssetUrl, Typography } from '../../../shared/react';
import { DesignComparisonArrow } from '../../components/DesignComparisonHeader';
import outline from '../../outlines.json';
import { MAP_WIDTH, MAP_HEIGHT, loadImage, renderResponse, type Position, type SceneImages } from './laplacianResponse';
const moduleAssetId = outline.moduleIdentity.id;
const backgroundUrl = moduleAssetUrl(moduleAssetId, 'images/translation-example/bg.jpg');
const ufoUrl = moduleAssetUrl(moduleAssetId, 'images/translation-example/ufo.png');
const pillarUrl = moduleAssetUrl(moduleAssetId, 'images/translation-example/pillar.png');
const foliageUrl = moduleAssetUrl(moduleAssetId, 'images/translation-example/dark_foliage.png');

export function UfoTranslationScene() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const heatmapRef = useRef<HTMLCanvasElement>(null);
  const sourceRef = useRef<HTMLCanvasElement | null>(null);
  const imagesRef = useRef<SceneImages | null>(null);
  const [position, setPosition] = useState<Position>({ x: .57, y: .52 });
  const positionRef = useRef<Position>({ x: .57, y: .52 });
  const pointerInsideRef = useRef(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let frame = 0;
    let lastUpdate = 0;
    const startedAt = performance.now();
    const animate = (now: number) => {
      if (!pointerInsideRef.current && now - lastUpdate >= 33) {
        const angle = (now - startedAt) * .00075;
        const target = { x: .57 + .23 * Math.cos(angle), y: .43 + .12 * Math.sin(angle) };
        const current = positionRef.current;
        const next = { x: current.x + (target.x - current.x) * .075, y: current.y + (target.y - current.y) * .075 };
        positionRef.current = next;
        setPosition(next);
        lastUpdate = now;
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([loadImage(backgroundUrl), loadImage(ufoUrl), loadImage(pillarUrl), loadImage(foliageUrl)]).then(([background, ufo, pillar, foliage]) => {
      if (!active) return;
      imagesRef.current = { background, ufo, pillar, foliage };
      const source = document.createElement('canvas');
      source.width = MAP_WIDTH;
      source.height = MAP_HEIGHT;
      sourceRef.current = source;
      setReady(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (ready && heatmapRef.current && sourceRef.current && imagesRef.current) renderResponse(heatmapRef.current, sourceRef.current, imagesRef.current, position);
  }, [position, ready]);

  const moveUfo = (event: PointerEvent<HTMLDivElement>) => {
    const scene = sceneRef.current;
    if (!scene) return;
    const rect = scene.getBoundingClientRect();
    const next = { x: Math.max(.07, Math.min(.93, (event.clientX - rect.left) / rect.width)), y: Math.max(.08, Math.min(.92, (event.clientY - rect.top) / rect.height)) };
    positionRef.current = next;
    setPosition(next);
  };
  const ufoStyle = { left: `${position.x * 100}%`, top: `${position.y * 100}%` } as CSSProperties;

  return <div className="aipe-translation-pair" aria-busy={!ready}>
    <figure><Typography variant="bodySmall" tone="muted">输入场景</Typography>
      <div className="aipe-translation-scene" ref={sceneRef} onPointerEnter={(event) => { pointerInsideRef.current = true; moveUfo(event); }} onPointerMove={moveUfo} onPointerLeave={() => { pointerInsideRef.current = false; }} aria-label="移动鼠标控制 UFO，离开后自动飞行；柱子与树叶可遮挡目标">
        <img className="aipe-translation-background" src={backgroundUrl} alt="夜晚的城堡和桥梁背景" draggable="false" />
        <img className="aipe-translation-ufo" src={ufoUrl} alt="可随鼠标平移的 UFO" style={ufoStyle} draggable="false" />
        <img className="aipe-translation-pillar" src={pillarUrl} alt="前景柱子" draggable="false" />
        <img className="aipe-translation-foliage" src={foliageUrl} alt="前景树叶" draggable="false" />
      </div>
    </figure>
    <DesignComparisonArrow />
    <figure><Typography variant="bodySmall" tone="muted">边缘响应</Typography><canvas ref={heatmapRef} width={MAP_WIDTH} height={MAP_HEIGHT} role="img" aria-label="当前可见场景经拉普拉斯算子计算的实时边缘响应" /></figure>
  </div>;
}
