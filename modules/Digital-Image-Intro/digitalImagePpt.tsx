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
import { SceneDeck, type DeckDefinition } from '../shared/react/presentation';
import { BeadOpeningPage } from './pages/BeadOpeningPage/BeadOpeningPage';
import { DigitizationPipelinePage } from './pages/DigitizationPipelinePage/DigitizationPipelinePage';
import { SamplingResolutionPage, QuantizationDepthPage } from './pages/SamplingQuantizationPage/SamplingQuantizationPage';
import outline from './outlines.json';

export const deck: DeckDefinition = {
  id: outline.id,
  title: outline.title,
  subtitle: '从世界到图像 · 数字化',
  scenes: [{ id: outline.pages[0].id, title: outline.pages[0].title, section: '从世界到图像', render: () => <BeadOpeningPage /> },
    { id: outline.pages[1].id, title: outline.pages[1].title, section: '数字化', render: () => <DigitizationPipelinePage /> },
    { id: outline.pages[2].id, title: outline.pages[2].title, section: '数字化', render: () => <SamplingResolutionPage /> },
    { id: outline.pages[3].id, title: outline.pages[3].title, section: '数字化', render: () => <QuantizationDepthPage /> },
    { id: outline.pages[4].id, title: outline.pages[4].title, section: '数字化', render: () => <PixelTypesPage /> },
    { id: outline.pages[5].id, title: outline.pages[5].title, section: '数字化', render: () => <ImageMemoryPage /> },
    { id: outline.pages[6].id, title: outline.pages[6].title, section: '数字化', render: () => <ColorSpacePage /> },
    { id: outline.pages[7].id, title: outline.pages[7].title, section: '像素值操作', render: () => <PointOperationsPage /> },
    { id: outline.pages[8].id, title: outline.pages[8].title, section: '像素值操作', render: () => <IntensityTransformsPage /> },
    { id: outline.pages[9].id, title: outline.pages[9].title, section: '像素值操作', render: () => <ImageArithmeticPage /> },
    { id: outline.pages[10].id, title: outline.pages[10].title, section: '像素值操作', render: () => <MasksRoiPage /> },
    { id: outline.pages[11].id, title: outline.pages[11].title, section: '像素值操作', render: () => <ImageHistogramsPage /> },
    { id: outline.pages[12].id, title: outline.pages[12].title, section: '像素值操作', render: () => <HistogramAdjustmentPage /> },
    { id: outline.pages[13].id, title: outline.pages[13].title, section: '空间关系', render: () => <GeometricTransformsPage /> },
    { id: outline.pages[14].id, title: outline.pages[14].title, section: '空间关系', render: () => <ImageInterpolationPage /> },
    { id: outline.pages[15].id, title: outline.pages[15].title, section: '空间关系', render: () => <BinarizationPage /> },
    { id: outline.pages[16].id, title: outline.pages[16].title, section: '空间关系', render: () => <OtsuThresholdPage /> },
    { id: outline.pages[17].id, title: outline.pages[17].title, section: '空间关系', render: () => <FindConnectedComponentPage /> },
    { id: outline.pages[18].id, title: outline.pages[18].title, section: '空间关系', render: () => <MorphologyOperationsPage /> },
    { id: outline.pages[19].id, title: outline.pages[19].title, section: '空间关系', render: () => <ColorImageBlurPage /> },
    { id: outline.pages[20].id, title: outline.pages[20].title, section: '视频与数字图像', render: () => <VideoFramesPage /> },
  ],
};
export const getPptNotes = (sceneId: string) => (outline.pages.find(page => page.id === sceneId)?.snippet
  ? [{ text: outline.pages.find(page => page.id === sceneId)!.snippet, selectors: [] }]
  : []);
export function DigitalImagePpt() {
  return <SceneDeck catalog={[deck]} moduleId={outline.id} assetId={outline.moduleIdentity.id} progressKey="lesson-flow:digital-image-intro-v1" getNotes={getPptNotes} />;
}

