import { useEffect, useLayoutEffect, useState } from 'react';
import { regressionSlides } from './LinearRegressionLessonPage';
import './linear-regression-lesson.css';

const WIDTH = 1600;
const HEIGHT = 900;

export function LinearRegressionLessonPptSlidePage() {
  const [scale, setScale] = useState(1);
  const requested = new URLSearchParams(window.location.search).get('slide') ?? regressionSlides[0].id;
  const index = Math.max(0, regressionSlides.findIndex((slide) => slide.id === requested));
  const slide = regressionSlides[index];
  useLayoutEffect(() => { const update = () => setScale(Math.min(window.innerWidth / WIDTH, window.innerHeight / HEIGHT)); update(); window.addEventListener('resize', update); return () => window.removeEventListener('resize', update); }, []);
  useEffect(() => { document.body.classList.add('grl-ppt-body'); document.title = `${index + 1}. ${slide.title}`; return () => document.body.classList.remove('grl-ppt-body'); }, [index, slide.title]);
  return <div className="grl-ppt-root"><main className="grl-ppt-canvas grl-shell" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}><header className="grl-ppt-header"><span>线性回归 · 入门</span><span>{String(index + 1).padStart(2, '0')} / {String(regressionSlides.length).padStart(2, '0')}</span></header><div className="ng-ppt-slide-surface grl-ppt-slide-surface">{slide.content}</div></main></div>;
}
