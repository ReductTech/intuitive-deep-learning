import { useLayoutEffect, useState, type ReactNode } from 'react';
import { LinearRegressionProvider } from './model/LinearRegressionContext';
import { GaltonOpeningBlock } from './blocks/GaltonOpeningBlock';
import { LinearFitBlock } from './blocks/LinearFitBlock';
import { LossFunctionBlock } from './blocks/LossFunctionBlock';
import { LinearRegressionCompletionBlock } from './blocks/LinearRegressionCompletionBlock';
import { LinearRegressionFooter } from './blocks/LinearRegressionFooter';
import './linear-regression-loss.css';
const slides: Array<{ id: string; render: (complete: () => void) => ReactNode }> = [
  { id: 'galton-opening', render: (complete) => <GaltonOpeningBlock onComplete={complete} /> },
  { id: 'linear-fit', render: (complete) => <LinearFitBlock onComplete={complete} /> },
  { id: 'loss-function', render: (complete) => <LossFunctionBlock onComplete={complete} /> },
  { id: 'completion', render: (complete) => <LinearRegressionCompletionBlock onComplete={complete} /> },
  { id: 'resources', render: () => <LinearRegressionFooter /> },
];
export function LinearRegressionLossPptSlidePage() { const id = new URLSearchParams(window.location.search).get('slide') ?? slides[0].id; const slide = slides.find((item) => item.id === id) ?? slides[0]; const [scale, setScale] = useState(1); useLayoutEffect(() => { const update = () => setScale(Math.min(window.innerWidth / 1600, window.innerHeight / 900)); update(); window.addEventListener('resize', update); return () => window.removeEventListener('resize', update); }, []); return <div className="lr-ppt-root"><main className="lr-ppt-canvas" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}><div className="lr-ppt-slide-surface"><LinearRegressionProvider>{slide.render(() => undefined)}</LinearRegressionProvider></div></main></div>; }
