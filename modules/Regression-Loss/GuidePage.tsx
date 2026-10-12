import { ConvexMsePage } from './pages/ConvexMsePage/ConvexMsePage';
import { LeastSquaresGeometryPage } from './pages/LeastSquaresGeometryPage/LeastSquaresGeometryPage';
import { MatrixModelPage } from './pages/MatrixModelPage/MatrixModelPage';
import { OptimalLinePage } from './pages/OptimalLinePage/OptimalLinePage';
import { OptimalSlopePage } from './pages/OptimalSlopePage/OptimalSlopePage';
import { OptimalInterceptPage } from './pages/OptimalInterceptPage/OptimalInterceptPage';
import { LeastSquaresPage } from './pages/LeastSquaresPage/LeastSquaresPage';
import { AutomaticSearchPage, SearchLimitsPage } from './pages/AutomaticSearchPage/AutomaticSearchPage';
import { MsePage } from './pages/MsePage/MsePage';
import { MaePage } from './pages/MaePage/MaePage';
import { useLayoutEffect, useRef, useState } from 'react';
import { PredictionErrorPage } from './pages/PredictionErrorPage/PredictionErrorPage';
import { ResidualCancellationPage } from './pages/ResidualCancellationPage/ResidualCancellationPage';
import { ModuleShell } from '../shared/react';
import '../shared/react/styles.css';
import '../shared/react/presentation.css';
import { CaoChongPage } from './pages/CaoChongPage/CaoChongPage';
import { LinearRegressionPage } from './pages/LinearRegressionPage/LinearRegressionPage';
import { EstimateWeightPage } from './pages/EstimateWeightPage/EstimateWeightPage';

export function GuidePage() {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const host = ref.current;
    if (!host) return;
    const update = () => setScale(Math.min(1, host.clientWidth / 1600));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);
  return <ModuleShell title="回归与损失：模型怎样变准" subtitle="从曹冲称象出发，学习根据数据预测一个数。" shellClassName="course-shell course-blog-shell">
    <div className="lesson-canvas-frame" ref={ref} style={{ height: 900 * scale }}><div className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><CaoChongPage /></div></div>
    <div className="lesson-canvas-frame" style={{ height: 900 * scale, marginTop: 24 }}><div className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><EstimateWeightPage /></div></div>
    <div className="lesson-canvas-frame" style={{ height: 900 * scale, marginTop: 24 }}><div className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><PredictionErrorPage /></div></div>
    <div className="lesson-canvas-frame" style={{ height: 900 * scale, marginTop: 24 }}><div className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><ResidualCancellationPage /></div></div>
    <div className="lesson-canvas-frame" style={{ height: 900 * scale, marginTop: 24 }}><div className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><MaePage /></div></div>
    <div className="lesson-canvas-frame" style={{ height: 900 * scale, marginTop: 24 }}><div className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><MsePage /></div></div>
    <div className="lesson-canvas-frame" style={{ height: 900 * scale, marginTop: 24 }}><div className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><EstimateWeightPage showLoss /></div></div>
    <div className="lesson-canvas-frame" style={{ height: 900 * scale, marginTop: 24 }}><div className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><AutomaticSearchPage /></div></div>
    <div className="lesson-canvas-frame" style={{ height: 900 * scale, marginTop: 24 }}><div className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><SearchLimitsPage /></div></div>
    <div className="lesson-canvas-frame" style={{ height: 900 * scale, marginTop: 24 }}><div className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><LinearRegressionPage /></div></div>
    <div className="lesson-canvas-frame" style={{ height: 900 * scale, marginTop: 24 }}><div className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><LeastSquaresPage /></div></div>
    <div className="lesson-canvas-frame" style={{ height: 900 * scale, marginTop: 24 }}><div className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><OptimalInterceptPage /></div></div>
    <div className="lesson-canvas-frame" style={{ height: 900 * scale, marginTop: 24 }}><div className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><OptimalSlopePage /></div></div>
    <div className="lesson-canvas-frame" style={{ height: 900 * scale, marginTop: 24 }}><div className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><OptimalLinePage /></div></div>
    <div className="lesson-canvas-frame" style={{ height: 900 * scale, marginTop: 24 }}><div className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><MatrixModelPage /></div></div>
    <div className="lesson-canvas-frame" style={{ height: 900 * scale, marginTop: 24 }}><div className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><LeastSquaresGeometryPage /></div></div>
    <div className="lesson-canvas-frame" style={{ height: 900 * scale, marginTop: 24 }}><div className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><ConvexMsePage /></div></div>
  </ModuleShell>;
}





