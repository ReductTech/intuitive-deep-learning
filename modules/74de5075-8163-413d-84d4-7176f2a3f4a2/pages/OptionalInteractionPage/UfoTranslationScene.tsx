import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
// Scene assets, compositing, pointer control and idle trajectory copied from the original module.
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { Typography } from "@shuku/course-style/react";
import { DesignComparisonArrow } from '../../components/DesignComparisonHeader';
import outline from '../../outlines.json';
import { MAP_WIDTH, MAP_HEIGHT, loadImage, renderResponse, type Position, type SceneImages } from './laplacianResponse';
const moduleAssetId = outline.moduleIdentity.id;
const backgroundUrl = moduleAssetUrl('images/translation-example/bg.jpg');
const ufoUrl = moduleAssetUrl('images/translation-example/ufo.png');
const pillarUrl = moduleAssetUrl('images/translation-example/pillar.png');
const foliageUrl = moduleAssetUrl('images/translation-example/dark_foliage.png');

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

  return <div shuku-edit-id="e-2ddb72cf-aef3-40c6-8cb2-e54331230ea6" className="aipe-translation-pair" aria-busy={!ready}>
    <figure shuku-edit-id="e-b9f905a4-4735-41f6-80b5-adc5ac1518e1"><Typography shuku-edit-id="e-543c2caa-1b98-4ec2-b3cc-1fcae7d23258" variant="bodySmall" tone="muted">输入场景</Typography>
      <div shuku-edit-id="e-ea4c765d-a179-48c3-a52f-715000529aad" className="aipe-translation-scene" ref={sceneRef} onPointerEnter={(event) => { pointerInsideRef.current = true; moveUfo(event); }} onPointerMove={moveUfo} onPointerLeave={() => { pointerInsideRef.current = false; }} aria-label="移动鼠标控制 UFO，离开后自动飞行；柱子与树叶可遮挡目标">
        <img shuku-edit-id="e-67bb504a-ac05-44c6-9520-0e25ced1be59" className="aipe-translation-background" src={backgroundUrl} alt="夜晚的城堡和桥梁背景" draggable="false" />
        <img shuku-edit-id="e-584a4818-22a7-4074-a913-e19c37b6f015" className="aipe-translation-ufo" src={ufoUrl} alt="可随鼠标平移的 UFO" style={ufoStyle} draggable="false" />
        <img shuku-edit-id="e-4f091ce9-3a32-4a17-8871-93f7d0e5e0f3" className="aipe-translation-pillar" src={pillarUrl} alt="前景柱子" draggable="false" />
        <img shuku-edit-id="e-af63055e-2b98-41d1-b120-fe585836b5c4" className="aipe-translation-foliage" src={foliageUrl} alt="前景树叶" draggable="false" />
      </div>
    </figure>
    <DesignComparisonArrow />
    <figure shuku-edit-id="e-9a4f35d1-b137-477b-a3a0-6570530cc841"><Typography shuku-edit-id="e-fa77be7b-2072-4d21-bfae-29eca18b99d2" variant="bodySmall" tone="muted">边缘响应</Typography><canvas shuku-edit-id="e-f7c61963-c139-42ff-9da2-a8d24826cfc8" ref={heatmapRef} width={MAP_WIDTH} height={MAP_HEIGHT} role="img" aria-label="当前可见场景经拉普拉斯算子计算的实时边缘响应" /></figure>
  </div>;
}
