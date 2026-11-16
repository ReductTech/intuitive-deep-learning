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
import { ModuleShell } from "@shuku/course-style/react";
import "@shuku/course-style/react/styles.css";
import "@shuku/course-style/react/ui-kit.css";
import "@shuku/course-style/react/presentation.css";
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
    <div shuku-edit-id="e-de2fe2ab-029f-44fd-81e5-12d63bf82790" className="lesson-canvas-frame" ref={frame} style={{ height: scale * 900 }}>
      <div shuku-edit-id="e-0cfa9116-e6be-4c89-9fc5-7e2380e33a58" className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><BeadOpeningPage /></div>
    </div>
    <div shuku-edit-id="e-c87ffc60-63a8-488b-910e-83d6fc4fd986" className="lesson-canvas-frame" style={{ height: scale * 900 }}>
      <div shuku-edit-id="e-32552e77-5268-4dee-8b7e-3e01158b610b" className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><DigitizationPipelinePage /></div>
    </div>
    <div shuku-edit-id="e-1d3fd9f4-183b-4aa8-86d9-c3639d299b96" className="lesson-canvas-frame" style={{ height: scale * 900 }}>
      <div shuku-edit-id="e-6ab676a0-b1ee-4f03-8c9a-27f66745afc9" className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><SamplingResolutionPage /></div>
    </div>
    <div shuku-edit-id="e-0d7efd72-705f-4902-baab-19dae0658be6" className="lesson-canvas-frame" style={{ height: scale * 900 }}>
      <div shuku-edit-id="e-62562a5b-1918-42b0-acf0-ff3271c8a572" className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><QuantizationDepthPage /></div>
    </div>
    <div shuku-edit-id="e-f825b33a-b3df-452c-a23e-bbd2ad0f1980" className="lesson-canvas-frame" style={{ height: scale * 900 }}>
      <div shuku-edit-id="e-c0806ced-2f15-4b5a-9d58-ee89ee7108ac" className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><PixelTypesPage /></div>
    </div>
    <div shuku-edit-id="e-05eec341-3f94-435e-8f85-6786ab8ccaa6" className="lesson-canvas-frame" style={{ height: scale * 900 }}>
      <div shuku-edit-id="e-085b71f9-c169-410d-9c23-8fa3708df2ed" className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><ImageMemoryPage /></div>
    </div>
    <div shuku-edit-id="e-c4d2bfc7-0107-407d-883d-bbc253a4357c" className="lesson-canvas-frame" style={{ height: scale * 900 }}>
      <div shuku-edit-id="e-890a57cc-efae-44c2-86a1-ff0f729714f7" className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><ColorSpacePage /></div>
    </div>
    <div shuku-edit-id="e-d3f69cc2-31f6-4d77-a954-12d89e894d22" className="lesson-canvas-frame" style={{ height: scale * 900 }}>
      <div shuku-edit-id="e-4856a914-2015-46f2-a09c-6d5c00c13a0b" className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><PointOperationsPage /></div>
    </div>
    <div shuku-edit-id="e-2c645239-7b15-40a6-aad0-707b145a9221" className="lesson-canvas-frame" style={{ height: scale * 900 }}>
      <div shuku-edit-id="e-7157f149-2489-4c10-bb01-67e2bf2a1724" className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><IntensityTransformsPage /></div>
    </div>
    <div shuku-edit-id="e-2b33b8ee-751a-4091-a449-4c0ae73a4d1a" className="lesson-canvas-frame" style={{ height: scale * 900 }}>
      <div shuku-edit-id="e-7a32c107-dc95-4f14-a428-d198e845b4ca" className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><ImageArithmeticPage /></div>
    </div>
    <div shuku-edit-id="e-d1227942-fc3d-48d0-995c-12dec9483e01" className="lesson-canvas-frame" style={{ height: scale * 900 }}>
      <div shuku-edit-id="e-983179d8-e679-4e16-836b-2050673d8b10" className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><MasksRoiPage /></div>
    </div>
    <div shuku-edit-id="e-d3f64f10-8548-4a55-a9f1-298cbbf88ea8" className="lesson-canvas-frame" style={{ height: scale * 900 }}>
      <div shuku-edit-id="e-9cebff15-181d-4ed9-871e-807ecbbe45fd" className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><ImageHistogramsPage /></div>
    </div>
    <div shuku-edit-id="e-ff9cb546-18f2-43f0-b94f-8bc0516728b8" className="lesson-canvas-frame" style={{ height: scale * 900 }}>
      <div shuku-edit-id="e-01924dd3-7ed8-4cb7-b2c2-10836883ff6e" className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><HistogramAdjustmentPage /></div>
    </div>
    <div shuku-edit-id="e-3546546b-ad0b-4c90-a765-dce2548a8095" className="lesson-canvas-frame" style={{ height: scale * 900 }}>
      <div shuku-edit-id="e-8815d84a-a08c-4303-a7f0-93046d941344" className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><GeometricTransformsPage /></div>
    </div>
    <div shuku-edit-id="e-77ee98ea-4991-4959-8f48-07b095a6624b" className="lesson-canvas-frame" style={{ height: scale * 900 }}>
      <div shuku-edit-id="e-0e276c68-fdbc-49d3-9e60-501f63661ede" className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><ImageInterpolationPage /></div>
    </div>
    <div shuku-edit-id="e-534dfa0a-b353-4e80-9833-ab6363296f52" className="lesson-canvas-frame" style={{ height: scale * 900 }}>
      <div shuku-edit-id="e-3a8f7fbc-fc9a-45c5-8223-bc2739a55d9e" className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><BinarizationPage /></div>
    </div>
    <div shuku-edit-id="e-46c98f8d-e6d4-4b2e-90eb-fafa9f111ac5" className="lesson-canvas-frame" style={{ height: scale * 900 }}>
      <div shuku-edit-id="e-93a44f04-8ed8-4296-9075-78b031020f0c" className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><OtsuThresholdPage /></div>
    </div>
    <div shuku-edit-id="e-838afa8c-f9bd-46eb-ba9f-7815bec31b32" className="lesson-canvas-frame" style={{ height: scale * 900 }}>
      <div shuku-edit-id="e-8bd07489-81fa-4380-b47b-50abf856d4b5" className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><FindConnectedComponentPage /></div>
    </div>
    <div shuku-edit-id="e-ecb696cc-7ee0-4bee-9abb-7bafcd4e7d36" className="lesson-canvas-frame" style={{ height: scale * 900 }}>
      <div shuku-edit-id="e-17a6dbe1-18b8-47b9-a527-04b0193922a8" className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><MorphologyOperationsPage /></div>
    </div>
    <div shuku-edit-id="e-6ca18925-9558-41e5-9608-96ce7033efc6" className="lesson-canvas-frame" style={{ height: scale * 900 }}>
      <div shuku-edit-id="e-5fa918bf-f031-4228-8263-df3e8c2003cb" className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><ColorImageBlurPage /></div>
    </div>
    <div shuku-edit-id="e-73d07d7e-7ecf-4902-b246-fa210de99420" className="lesson-canvas-frame" style={{ height: scale * 900 }}>
      <div shuku-edit-id="e-c72ba9a3-a139-435a-ac0e-3b6a3bbbaec2" className="course-page-surface course-shell" style={{ transform: `scale(${scale})` }}><VideoFramesPage /></div>
    </div>
  </ModuleShell>;
}

