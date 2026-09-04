import { useLayoutEffect, useState, type ReactNode } from 'react';
import { LinearRegressionProvider } from './model/LinearRegressionContext';
import { GaltonOpeningBlock } from './blocks/GaltonOpeningBlock';
import { LinearFitBlock } from './blocks/LinearFitBlock';
import { LossFunctionBlock } from './blocks/LossFunctionBlock';
import { LinearRegressionCompletionBlock } from './blocks/LinearRegressionCompletionBlock';
import { LinearRegressionFooter } from './blocks/LinearRegressionFooter';
import './linear-regression-loss.css';

const slides: Array<{ id: string; title: string; render: (complete: () => void) => ReactNode }> = [
  { id: 'galton-opening', title: '高尔顿的问题：父母身高，能预测孩子吗？', render: (complete) => <GaltonOpeningBlock onComplete={complete} /> },
  { id: 'linear-fit', title: '把趋势写成一条直线', render: (complete) => <LinearFitBlock onComplete={complete} /> },
  { id: 'loss-function', title: '损失函数：把差距变成数字', render: (complete) => <LossFunctionBlock onComplete={complete} /> },
  { id: 'completion', title: '从数据到损失', render: (complete) => <LinearRegressionCompletionBlock onComplete={complete} /> },
  { id: 'resources', title: '继续探索', render: () => <LinearRegressionFooter /> },
];

export function LinearRegressionLossPptSlidePage() {
  const id = new URLSearchParams(window.location.search).get('slide') ?? slides[0].id;
  const slide = slides.find((item) => item.id === id) ?? slides[0];
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => { const update = () => setScale(Math.min(window.innerWidth / 1600, window.innerHeight / 900)); update(); window.addEventListener('resize', update); return () => window.removeEventListener('resize', update); }, []);
  return <div className="lr-ppt-root"><main className="lr-ppt-canvas" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}><div className="lr-ppt-slide-surface"><LinearRegressionProvider>{slide.render(() => undefined)}</LinearRegressionProvider></div></main></div>;
}
