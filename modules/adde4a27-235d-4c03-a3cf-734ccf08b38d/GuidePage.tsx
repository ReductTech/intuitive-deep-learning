import { LossChoicePage } from './pages/LossChoicePage/LossChoicePage';
import { OptimizationIntroPage } from './pages/OptimizationIntroPage/OptimizationIntroPage';
import { ConvexMsePage } from './pages/ConvexMsePage/ConvexMsePage';
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
import { ModuleShell } from "@shuku/course-style/react";
import "@shuku/course-style/react/styles.css";
import "@shuku/course-style/react/presentation.css";
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
    <div shuku-edit-id="e-6a058fc9-7494-41e6-a83e-950bd5733e46" className="lesson-canvas-frame" ref={ref} style={{ height: 900 * scale }}><div shuku-edit-id="e-e0a0d20a-bdb0-4ebd-9b81-5e5d008b7997" className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><CaoChongPage /></div></div>
    <div shuku-edit-id="e-bdae2876-fe88-425f-afff-228b35ce12b4" className="lesson-canvas-frame" style={{ height: 900 * scale, marginTop: 24 }}><div shuku-edit-id="e-38503e84-ff3e-49cf-b0da-e20eec81a986" className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><EstimateWeightPage /></div></div>
    <div shuku-edit-id="e-8f762365-678b-4147-b69d-b59ad7f45a95" className="lesson-canvas-frame" style={{ height: 900 * scale, marginTop: 24 }}><div shuku-edit-id="e-b3ae44fc-10ae-44de-b5d1-b66a7350a4b5" className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><PredictionErrorPage /></div></div>
    <div shuku-edit-id="e-20c56fc1-0130-4e5e-88d3-b6d4b2c030e9" className="lesson-canvas-frame" style={{ height: 900 * scale, marginTop: 24 }}><div shuku-edit-id="e-c7a50983-4820-4a17-bcbc-a57d3bbc2bc3" className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><ResidualCancellationPage /></div></div>
    <div shuku-edit-id="e-a3bd2044-4a27-44cd-a405-aa8174e06d7a" className="lesson-canvas-frame" style={{ height: 900 * scale, marginTop: 24 }}><div shuku-edit-id="e-fe278928-4770-4394-80b0-bf0aab0a7903" className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><MaePage /></div></div>
    <div shuku-edit-id="e-1b0a654e-c037-46fd-b571-cd01bec49419" className="lesson-canvas-frame" style={{ height: 900 * scale, marginTop: 24 }}><div shuku-edit-id="e-6a35ed66-a295-4a23-84a7-1fc3447075ae" className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><MsePage /></div></div>
    <div shuku-edit-id="e-61975011-9f5a-4956-8d70-2bad50cd7967" className="lesson-canvas-frame" style={{ height: 900 * scale, marginTop: 24 }}><div shuku-edit-id="e-73c4d70e-1cf9-4ed1-846d-6b3cb5de2274" className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><LossChoicePage /></div></div>
    <div shuku-edit-id="e-5d1c7e08-7981-4f2d-be51-0d826580586e" className="lesson-canvas-frame" style={{ height: 900 * scale, marginTop: 24 }}><div shuku-edit-id="e-828bff75-469b-4764-8061-88f917c62803" className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><EstimateWeightPage showLoss /></div></div>
    <div shuku-edit-id="e-2b36f255-c329-4115-beae-2de10b64e647" className="lesson-canvas-frame" style={{ height: 900 * scale, marginTop: 24 }}><div shuku-edit-id="e-38d5703f-9611-4fce-afea-58d8daa500fd" className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><AutomaticSearchPage /></div></div>
    <div shuku-edit-id="e-a089633d-7366-4620-a11b-d4ec0d98d371" className="lesson-canvas-frame" style={{ height: 900 * scale, marginTop: 24 }}><div shuku-edit-id="e-11987777-2741-48ed-81a2-28eecdce304c" className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><SearchLimitsPage /></div></div>
    <div shuku-edit-id="e-398b3b60-cdbe-4dca-ab6f-23710c2d2af9" className="lesson-canvas-frame" style={{ height: 900 * scale, marginTop: 24 }}><div shuku-edit-id="e-fec88844-32d3-4e66-89e9-2a5075bbd780" className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><LinearRegressionPage /></div></div>
    <div shuku-edit-id="e-dc91fc3c-f4ae-4c2a-8102-242280ea77a4" className="lesson-canvas-frame" style={{ height: 900 * scale, marginTop: 24 }}><div shuku-edit-id="e-f1367e13-1af6-4df1-8feb-a8575983fc4d" className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><LeastSquaresPage /></div></div>
    <div shuku-edit-id="e-affa449c-f03d-424d-8845-b91f8472b9eb" className="lesson-canvas-frame" style={{ height: 900 * scale, marginTop: 24 }}><div shuku-edit-id="e-17de695b-7266-4b2d-a0ab-5cf0d32f2ec1" className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><OptimalInterceptPage /></div></div>
    <div shuku-edit-id="e-cd0c73ec-656b-4713-9684-c4ee661348f0" className="lesson-canvas-frame" style={{ height: 900 * scale, marginTop: 24 }}><div shuku-edit-id="e-21b43ef5-1e2a-4d0c-b029-86ae03f88575" className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><OptimalSlopePage /></div></div>
    <div shuku-edit-id="e-51752d4e-2093-46f4-91ab-b94d9b653b45" className="lesson-canvas-frame" style={{ height: 900 * scale, marginTop: 24 }}><div shuku-edit-id="e-1645f4fe-d533-4f4b-9043-f6d78dd44731" className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><OptimalLinePage /></div></div>
    <div shuku-edit-id="e-a61bbec2-3c31-4926-a807-2947cebc2aaf" className="lesson-canvas-frame" style={{ height: 900 * scale, marginTop: 24 }}><div shuku-edit-id="e-5cf29033-ef5e-4632-8ad4-83f922b789a7" className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><MatrixModelPage /></div></div>
    <div shuku-edit-id="e-f199c637-fc3f-438b-9c0c-760172f14eac" className="lesson-canvas-frame" style={{ height: 900 * scale, marginTop: 24 }}><div shuku-edit-id="e-decf9751-105c-4de9-a7c6-33aa40488c03" className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><ConvexMsePage /></div></div>
    <div shuku-edit-id="e-dbaffbbb-59de-43a4-adcb-a4f1d79e58e5" className="lesson-canvas-frame" style={{ height: 900 * scale, marginTop: 24 }}><div shuku-edit-id="e-abe1b64c-e3f7-4489-8477-c0f15d1dffe7" className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><OptimizationIntroPage /></div></div>
  </ModuleShell>;
}





