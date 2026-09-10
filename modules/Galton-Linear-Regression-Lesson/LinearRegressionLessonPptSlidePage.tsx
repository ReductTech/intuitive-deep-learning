import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import { GaltonLossBlock, GaltonModelBlock, GaltonOpeningBlock, GaltonScatterBlock, GaltonSummaryBlock } from './blocks/GaltonRegressionBlocks';
import './linear-regression-lesson.css';

const slides: { id: string; title: string; render: () => ReactNode }[] = [
  { id: 'opening', title: '高尔顿的身高问题', render: () => <GaltonOpeningBlock /> },
  { id: 'scatter', title: '先看见点云的方向', render: () => <GaltonScatterBlock /> },
  { id: 'model', title: '用一条直线做预测', render: () => <GaltonModelBlock interactive={false} /> },
  { id: 'loss', title: '残差如何变成损失', render: () => <GaltonLossBlock interactive={false} /> },
  { id: 'summary', title: '从数据到训练目标', render: () => <GaltonSummaryBlock /> },
];

function useScale() { const [scale, setScale] = useState(1); useLayoutEffect(() => { const update = () => setScale(Math.min(window.innerWidth / 1600, window.innerHeight / 900)); update(); window.addEventListener('resize', update); return () => window.removeEventListener('resize', update); }, []); return scale; }

export function LinearRegressionLessonPptSlidePage() {
  const id = new URLSearchParams(window.location.search).get('slide') ?? slides[0].id;
  const slide = slides.find((item) => item.id === id) ?? slides[0];
  const scale = useScale();
  useEffect(() => { document.body.classList.add('grl-ppt-body'); document.title = slide.title; return () => document.body.classList.remove('grl-ppt-body'); }, [slide.title]);
  return <div className="grl-ppt-root"><main className="grl-ppt-canvas" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}><div className="grl-ppt-surface">{slide.render()}</div></main></div>;
}
