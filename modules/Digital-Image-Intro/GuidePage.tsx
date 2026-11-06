import { VideoFramesPage } from './pages/VideoFramesPage/VideoFramesPage';
import { ColorImageBlurPage } from './pages/ColorImageBlurPage/ColorImageBlurPage';
import { MorphologyOperationsPage } from './pages/MorphologyOperationsPage/MorphologyOperationsPage';
import { FindConnectedComponentPage } from './pages/ConnectedComponentsPage/FindConnectedComponentPage';
import { OtsuThresholdPage } from './pages/OtsuThresholdPage/OtsuThresholdPage';
import { BinarizationPage } from './pages/BinarizationPage/BinarizationPage';
import { ImageInterpolationPage } from './pages/ImageInterpolationPage/ImageInterpolationPage';
import { GeometricTransformsPage } from './pages/GeometricTransformsPage/GeometricTransformsPage';
import { HistogramAdjustmentPage } from './pages/HistogramAdjustmentPage/HistogramAdjustmentPage';
import { ImageHistogramsPage } from './pages/ImageHistogramsPage/ImageHistogramsPage';
import { MasksRoiPage } from './pages/MasksRoiPage/MasksRoiPage';
import { ImageArithmeticPage } from './pages/ImageArithmeticPage/ImageArithmeticPage';
import { IntensityTransformsPage } from './pages/IntensityTransformsPage/IntensityTransformsPage';
import { PointOperationsPage } from './pages/PointOperationsPage/PointOperationsPage';
import { ColorSpacePage } from './pages/ColorSpacePage/ColorSpacePage';
import { ImageMemoryPage } from './pages/ImageMemoryPage/ImageMemoryPage';
import { PixelTypesPage } from './pages/PixelTypesPage/PixelTypesPage';
import { useLayoutEffect, useRef, useState } from 'react';
import { ModuleShell } from '../shared/react';
import '../shared/react/styles.css';
import '../shared/react/ui-kit.css';
import '../shared/react/presentation.css';
import { BeadOpeningPage } from './pages/BeadOpeningPage/BeadOpeningPage';
import { DigitizationPipelinePage } from './pages/DigitizationPipelinePage/DigitizationPipelinePage';
import { SamplingResolutionPage, QuantizationDepthPage } from './pages/SamplingQuantizationPage/SamplingQuantizationPage';

export function GuidePage() {
  const frame = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const element = frame.current;
    if (!element) return;
    const resize = () => setScale(Math.min(1, element.clientWidth / 1600));
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();
    return () => observer.disconnect();
  }, []);
  return <ModuleShell shellClassName="course-shell course-blog-shell">
    <div className="lesson-canvas-frame" ref={frame} style={{ height: scale * 900 }}>
      <div className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><BeadOpeningPage /></div>
    </div>
    <div className="lesson-canvas-frame" style={{ height: scale * 900 }}>
      <div className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><DigitizationPipelinePage /></div>
    </div>
    <div className="lesson-canvas-frame" style={{ height: scale * 900 }}>
      <div className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><SamplingResolutionPage /></div>
    </div>
    <div className="lesson-canvas-frame" style={{ height: scale * 900 }}>
      <div className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><QuantizationDepthPage /></div>
    </div>
    <div className="lesson-canvas-frame" style={{ height: scale * 900 }}>
      <div className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><PixelTypesPage /></div>
    </div>
    <div className="lesson-canvas-frame" style={{ height: scale * 900 }}>
      <div className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><ImageMemoryPage /></div>
    </div>
    <div className="lesson-canvas-frame" style={{ height: scale * 900 }}>
      <div className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><ColorSpacePage /></div>
    </div>
    <div className="lesson-canvas-frame" style={{ height: scale * 900 }}>
      <div className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><PointOperationsPage /></div>
    </div>
    <div className="lesson-canvas-frame" style={{ height: scale * 900 }}>
      <div className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><IntensityTransformsPage /></div>
    </div>
    <div className="lesson-canvas-frame" style={{ height: scale * 900 }}>
      <div className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><ImageArithmeticPage /></div>
    </div>
    <div className="lesson-canvas-frame" style={{ height: scale * 900 }}>
      <div className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><MasksRoiPage /></div>
    </div>
    <div className="lesson-canvas-frame" style={{ height: scale * 900 }}>
      <div className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><ImageHistogramsPage /></div>
    </div>
    <div className="lesson-canvas-frame" style={{ height: scale * 900 }}>
      <div className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><HistogramAdjustmentPage /></div>
    </div>
    <div className="lesson-canvas-frame" style={{ height: scale * 900 }}>
      <div className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><GeometricTransformsPage /></div>
    </div>
    <div className="lesson-canvas-frame" style={{ height: scale * 900 }}>
      <div className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><ImageInterpolationPage /></div>
    </div>
    <div className="lesson-canvas-frame" style={{ height: scale * 900 }}>
      <div className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><BinarizationPage /></div>
    </div>
    <div className="lesson-canvas-frame" style={{ height: scale * 900 }}>
      <div className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><OtsuThresholdPage /></div>
    </div>
    <div className="lesson-canvas-frame" style={{ height: scale * 900 }}>
      <div className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><FindConnectedComponentPage /></div>
    </div>
    <div className="lesson-canvas-frame" style={{ height: scale * 900 }}>
      <div className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><MorphologyOperationsPage /></div>
    </div>
    <div className="lesson-canvas-frame" style={{ height: scale * 900 }}>
      <div className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><ColorImageBlurPage /></div>
    </div>
    <div className="lesson-canvas-frame" style={{ height: scale * 900 }}>
      <div className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><VideoFramesPage /></div>
    </div>
  </ModuleShell>;
}

