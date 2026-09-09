import { useCallback, useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import { FitLabBlock, GaltonStoryBlock, LossFunctionBlock, PredictionModelBlock, ResidualBlock, SummaryBlock, CompareLossBlock, ScatterObservationBlock } from './blocks';
import './galton-linear-regression.css';

const PPT_WIDTH = 1600;
const PPT_HEIGHT = 900;

interface Slide { id: string; title: string; render: (complete: () => void) => ReactNode; }

export const galtonLinearRegressionSlides: Slide[] = [
  { id: 'story', title: '1886 年：一个关于身高的奇怪问题', render: (complete) => <GaltonStoryBlock onComplete={complete} /> },
  { id: 'scatter', title: '第一眼：点并不整齐，但它们有方向', render: (complete) => <ScatterObservationBlock onComplete={complete} /> },
  { id: 'model', title: '把趋势写成一条直线', render: (complete) => <PredictionModelBlock onComplete={complete} /> },
  { id: 'residual', title: '每个点都在问：我离直线有多远？', render: (complete) => <ResidualBlock onComplete={complete} /> },
  { id: 'loss', title: '损失函数：给一条直线打分', render: (complete) => <LossFunctionBlock onComplete={complete} /> },
  { id: 'compare', title: '为什么平方会改变“在意什么”？', render: (complete) => <CompareLossBlock onComplete={complete} /> },
  { id: 'lab', title: '小实验：让损失变小', render: (complete) => <FitLabBlock onComplete={complete} /> },
  { id: 'summary', title: '从点云，到训练模型的第一步', render: () => <SummaryBlock /> },
];

function useCanvasScale() {
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const update = () => setScale(Math.min(window.innerWidth / PPT_WIDTH, window.innerHeight / PPT_HEIGHT));
    update(); window.addEventListener('resize', update); return () => window.removeEventListener('resize', update);
  }, []);
  return scale;
}

export function GaltonLinearRegressionPptSlidePage() {
  const slideId = new URLSearchParams(window.location.search).get('slide') ?? galtonLinearRegressionSlides[0].id;
  const index = Math.max(0, galtonLinearRegressionSlides.findIndex((slide) => slide.id === slideId));
  const slide = galtonLinearRegressionSlides[index];
  const scale = useCanvasScale();
  const complete = useCallback(() => undefined, []);
  useEffect(() => { document.body.classList.add('glr-ppt-body'); document.title = `${index + 1}. ${slide.title}`; return () => document.body.classList.remove('glr-ppt-body'); }, [index, slide.title]);
  return <div className="glr-ppt-root"><main className="glr-ppt-canvas" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}><header className="glr-ppt-header"><span>线性回归 · 从证据到评分</span><span>{String(index + 1).padStart(2, '0')} / {String(galtonLinearRegressionSlides.length).padStart(2, '0')}</span></header><div className="glr-ppt-viewport"><div className="glr-ppt-surface">{slide.render(complete)}</div></div></main></div>;
}
