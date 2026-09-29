import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ModuleShell } from '../shared/react';
import '../shared/react/styles.css';
import '../shared/react/ui-kit.css';
import '../shared/react/presentation.css';
import './tailwind.css';
import { DigitRecognitionOpeningPage } from './pages/DigitRecognitionOpeningPage/DigitRecognitionOpeningPage';
import { DigitDifferencesPage } from './pages/DigitDifferencesPage/DigitDifferencesPage';
import { RawPixelVariationPage } from './pages/RawPixelVariationPage/RawPixelVariationPage';
import { FeatureExtractionPage } from './pages/FeatureExtractionPage/FeatureExtractionPage';
import { SimpleFeatureLimitsPage } from './pages/SimpleFeatureLimitsPage/SimpleFeatureLimitsPage';
import { NineGridFeaturePage } from './pages/NineGridFeaturePage/NineGridFeaturePage';
import { FeatureVectorPage } from './pages/FeatureVectorPage/FeatureVectorPage';
import { ManualFeatureClassifierPage } from './pages/ManualFeatureClassifierPage/ManualFeatureClassifierPage';
import { NineGridInformationLossPage } from './pages/NineGridInformationLossPage/NineGridInformationLossPage';
import { FixedDigitPage } from './pages/FixedDigitPage/FixedDigitPage';
import { TwoStageRecognitionPage } from './pages/TwoStageRecognitionPage/TwoStageRecognitionPage';
import { SingleToSequencePage } from './pages/SingleToSequencePage/SingleToSequencePage';

function LessonCanvas({ children }: { children: ReactNode }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;
    const update = () => setScale(Math.min(1, (frame.clientWidth || 1600) / 1600));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  return <div className="lesson-canvas-frame" ref={frameRef} style={{ height: 900 * scale }}>
    <div className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}>{children}</div>
  </div>;
}

export function GuidePage() {
  return <ModuleShell
    title="视觉特征学习"
    subtitle="从支票上的手写金额出发，探索计算机如何学习视觉特征。"
    shellClassName="course-shell course-blog-shell"
  >
    <LessonCanvas><DigitRecognitionOpeningPage /></LessonCanvas>
    <LessonCanvas><DigitDifferencesPage /></LessonCanvas>
    <LessonCanvas><RawPixelVariationPage /></LessonCanvas>
    <LessonCanvas><FeatureExtractionPage /></LessonCanvas>
    <LessonCanvas><SimpleFeatureLimitsPage /></LessonCanvas>
    <LessonCanvas><NineGridFeaturePage /></LessonCanvas>
    <LessonCanvas><FeatureVectorPage /></LessonCanvas>
    <LessonCanvas><ManualFeatureClassifierPage /></LessonCanvas>
    <LessonCanvas><NineGridInformationLossPage /></LessonCanvas>
    <LessonCanvas><FixedDigitPage /></LessonCanvas>
    <LessonCanvas><TwoStageRecognitionPage /></LessonCanvas>
    <LessonCanvas><SingleToSequencePage /></LessonCanvas>
  </ModuleShell>;
}
