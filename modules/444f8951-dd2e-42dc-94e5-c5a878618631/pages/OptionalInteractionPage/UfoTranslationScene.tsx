import bgAsset0 from '../../assets/images/translation-example/bg.jpg';
import ufoAsset1 from '../../assets/images/translation-example/ufo.png';
import pillarAsset2 from '../../assets/images/translation-example/pillar.png';
import dark_foliageAsset3 from '../../assets/images/translation-example/dark_foliage.png';
// Scene assets, compositing, pointer control and idle trajectory copied from the original module.
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { Typography } from "@shuku/course-style/react";
import { DesignComparisonArrow } from '../../components/DesignComparisonHeader';
import { MAP_WIDTH, MAP_HEIGHT, loadImage, renderResponse, type Position, type SceneImages } from './laplacianResponse';
const backgroundUrl = bgAsset0;
const ufoUrl = ufoAsset1;
const pillarUrl = pillarAsset2;
const foliageUrl = dark_foliageAsset3;

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

  return <div shuku-edit-id="e-071c3430-bf5b-413a-a81f-7510c7586c89" className="cg-translation-pair" aria-busy={!ready}>
    <figure shuku-edit-id="e-d191a75f-b478-458c-bb61-5b3734e79443"><Typography shuku-edit-id="e-ade8bd7c-d551-495c-a5e7-aac447de0197" variant="bodySmall" tone="muted">输入场景</Typography>
      <div shuku-edit-id="e-83b638dc-3a0e-4721-b651-936f1bb1cccf" className="cg-translation-scene" ref={sceneRef} onPointerEnter={(event) => { pointerInsideRef.current = true; moveUfo(event); }} onPointerMove={moveUfo} onPointerLeave={() => { pointerInsideRef.current = false; }} aria-label="移动鼠标控制 UFO，离开后自动飞行；柱子与树叶可遮挡目标">
        <img shuku-edit-id="e-ba1daa31-c538-4b11-93f9-0f5d05fe9239" className="cg-translation-background" src={backgroundUrl} alt="夜晚的城堡和桥梁背景" draggable="false" />
        <img shuku-edit-id="e-2a75a676-0de0-4cfa-b0c4-a4a82c437129" className="cg-translation-ufo" src={ufoUrl} alt="可随鼠标平移的 UFO" style={ufoStyle} draggable="false" />
        <img shuku-edit-id="e-3d95168a-0233-4e52-9cc8-8bffe66cf9b0" className="cg-translation-pillar" src={pillarUrl} alt="前景柱子" draggable="false" />
        <img shuku-edit-id="e-8d7d3b6b-979f-4e45-8403-1f6446feff54" className="cg-translation-foliage" src={foliageUrl} alt="前景树叶" draggable="false" />
      </div>
    </figure>
    <DesignComparisonArrow />
    <figure shuku-edit-id="e-c872d4ae-5661-4663-81e9-c08ea2516b91"><Typography shuku-edit-id="e-f1116ea7-9610-47f0-9f09-d5b1af7e2ab3" variant="bodySmall" tone="muted">边缘响应</Typography><canvas shuku-edit-id="e-06e745bf-b1ac-474b-b9f3-8c1cc93749a0" ref={heatmapRef} width={MAP_WIDTH} height={MAP_HEIGHT} role="img" aria-label="当前可见场景经拉普拉斯算子计算的实时边缘响应" /></figure>
  </div>;
}
