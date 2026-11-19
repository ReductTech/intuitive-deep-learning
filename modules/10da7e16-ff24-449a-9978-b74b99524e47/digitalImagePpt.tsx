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
import { SceneDeck, type DeckDefinition } from "@shuku/course-style/react/presentation";
import { BeadOpeningPage } from './pages/BeadOpeningPage/BeadOpeningPage';
import { DigitizationPipelinePage } from './pages/DigitizationPipelinePage/DigitizationPipelinePage';
import { SamplingResolutionPage, QuantizationDepthPage } from './pages/SamplingQuantizationPage/SamplingQuantizationPage';
import outline from './outlines.json';
import { HistogramDistributionPage, NeighborhoodContextPage, ResamplingAliasingPage } from './pages/ImageStructurePages/ImageStructurePages';

export const deck: DeckDefinition = {
  id: outline.id,
  title: outline.title,
  subtitle: '从世界到图像 · 数字化',
  scenes: [{ id: outline.pages.find(page => page.id === 'ecfde4c9-fe8d-46fb-9aa7-eb863b2984a6')!.id, title: outline.pages.find(page => page.id === 'ecfde4c9-fe8d-46fb-9aa7-eb863b2984a6')!.title, section: '从世界到图像', render: () => <BeadOpeningPage /> },
    { id: outline.pages.find(page => page.id === '06c7498f-a25d-449c-a996-516fa922c2a5')!.id, title: outline.pages.find(page => page.id === '06c7498f-a25d-449c-a996-516fa922c2a5')!.title, section: '数字化', render: () => <DigitizationPipelinePage /> },
    { id: outline.pages.find(page => page.id === '7b0db25e-0872-4ec2-9506-6e2697253595')!.id, title: outline.pages.find(page => page.id === '7b0db25e-0872-4ec2-9506-6e2697253595')!.title, section: '数字化', render: () => <SamplingResolutionPage /> },
    { id: outline.pages.find(page => page.id === 'fd666f2e-31cd-46c2-b39d-73a594b2c42f')!.id, title: outline.pages.find(page => page.id === 'fd666f2e-31cd-46c2-b39d-73a594b2c42f')!.title, section: '数字化', render: () => <QuantizationDepthPage /> },
    { id: outline.pages.find(page => page.id === '85925820-200e-49e0-a7a2-c7d3af308cb1')!.id, title: outline.pages.find(page => page.id === '85925820-200e-49e0-a7a2-c7d3af308cb1')!.title, section: '数字化', render: () => <PixelTypesPage /> },
    { id: outline.pages.find(page => page.id === '2fc67230-39e4-40a0-a970-d4ff14f9720d')!.id, title: outline.pages.find(page => page.id === '2fc67230-39e4-40a0-a970-d4ff14f9720d')!.title, section: '数字化', render: () => <ImageMemoryPage /> },
    { id: outline.pages.find(page => page.id === 'c07daaa0-1c75-4c28-85b6-2989f741caef')!.id, title: outline.pages.find(page => page.id === 'c07daaa0-1c75-4c28-85b6-2989f741caef')!.title, section: '数字化', render: () => <ColorSpacePage /> },
    { id: outline.pages.find(page => page.id === '62e8cc4c-2b64-4632-9bc4-2424e7ac85ba')!.id, title: outline.pages.find(page => page.id === '62e8cc4c-2b64-4632-9bc4-2424e7ac85ba')!.title, section: '像素值操作', render: () => <PointOperationsPage /> },
    { id: outline.pages.find(page => page.id === '41de7a1a-90df-4135-a945-34d9d0709744')!.id, title: outline.pages.find(page => page.id === '41de7a1a-90df-4135-a945-34d9d0709744')!.title, section: '像素值操作', render: () => <IntensityTransformsPage /> },
    { id: outline.pages.find(page => page.id === '1372ab1f-af09-4f0f-a58c-3ead9b49b581')!.id, title: outline.pages.find(page => page.id === '1372ab1f-af09-4f0f-a58c-3ead9b49b581')!.title, section: '像素值操作', render: () => <ImageArithmeticPage /> },
    { id: outline.pages.find(page => page.id === '97e1d141-7c53-492b-8472-000363ba5694')!.id, title: outline.pages.find(page => page.id === '97e1d141-7c53-492b-8472-000363ba5694')!.title, section: '像素值操作', render: () => <MasksRoiPage /> },
    { id: outline.pages.find(page => page.id === 'ee7813f7-138d-491f-9c6d-677405c1054e')!.id, title: outline.pages.find(page => page.id === 'ee7813f7-138d-491f-9c6d-677405c1054e')!.title, section: '像素值操作', render: () => <ImageHistogramsPage /> },
    { id: outline.pages.find(page => page.id === '7dbd5f55-00a1-49d5-8e0c-dece7eb3add4')!.id, title: outline.pages.find(page => page.id === '7dbd5f55-00a1-49d5-8e0c-dece7eb3add4')!.title, section: '像素值操作', render: () => <HistogramAdjustmentPage /> },
    { id: outline.pages.find(page => page.id === 'c4d6b684-1d03-4874-a587-b2713496eca6')!.id, title: outline.pages.find(page => page.id === 'c4d6b684-1d03-4874-a587-b2713496eca6')!.title, section: '空间关系', render: () => <GeometricTransformsPage /> },
    { id: outline.pages.find(page => page.id === '2e40047e-8b31-44b5-81d7-2c4a4ecb0bbf')!.id, title: outline.pages.find(page => page.id === '2e40047e-8b31-44b5-81d7-2c4a4ecb0bbf')!.title, section: '空间关系', render: () => <ImageInterpolationPage /> },
    { id: outline.pages.find(page => page.id === 'a1d11a7d-773b-499a-afe9-31b10c11f4cc')!.id, title: outline.pages.find(page => page.id === 'a1d11a7d-773b-499a-afe9-31b10c11f4cc')!.title, section: '空间关系', render: () => <BinarizationPage /> },
    { id: outline.pages.find(page => page.id === 'a52c984d-72be-4913-9f83-8e56731f5dd7')!.id, title: outline.pages.find(page => page.id === 'a52c984d-72be-4913-9f83-8e56731f5dd7')!.title, section: '空间关系', render: () => <OtsuThresholdPage /> },
    { id: outline.pages.find(page => page.id === 'fa698f10-7940-4209-b2c7-66fbb9d6ef00')!.id, title: outline.pages.find(page => page.id === 'fa698f10-7940-4209-b2c7-66fbb9d6ef00')!.title, section: '空间关系', render: () => <FindConnectedComponentPage /> },
    { id: outline.pages.find(page => page.id === 'c0d29c7c-868b-4c17-bd76-ff434a849b5e')!.id, title: outline.pages.find(page => page.id === 'c0d29c7c-868b-4c17-bd76-ff434a849b5e')!.title, section: '空间关系', render: () => <MorphologyOperationsPage /> },
    { id: outline.pages.find(page => page.id === 'f2c1e12e-3952-4c08-afe0-09c3365399b6')!.id, title: outline.pages.find(page => page.id === 'f2c1e12e-3952-4c08-afe0-09c3365399b6')!.title, section: '空间关系', render: () => <ColorImageBlurPage /> },
    { id: outline.pages.find(page => page.id === '772fe3b9-26b2-4bbb-9716-adf45a4f5f36')!.id, title: outline.pages.find(page => page.id === '772fe3b9-26b2-4bbb-9716-adf45a4f5f36')!.title, section: '视频与数字图像', render: () => <VideoFramesPage /> },
    { id: 'f25337c1-ae0c-4e51-b616-d9d178d68a93', title: outline.pages.find(page => page.id === 'f25337c1-ae0c-4e51-b616-d9d178d68a93')!.title, section: '像素值操作', render: () => <HistogramDistributionPage /> },
    { id: '564ac947-6134-4ee3-9e2f-f31fc9782d0c', title: outline.pages.find(page => page.id === '564ac947-6134-4ee3-9e2f-f31fc9782d0c')!.title, section: '空间关系', render: () => <NeighborhoodContextPage /> },
    { id: '1da1b0a3-db77-4354-9a64-89fe2eda77cc', title: outline.pages.find(page => page.id === '1da1b0a3-db77-4354-9a64-89fe2eda77cc')!.title, section: '空间关系', render: () => <ResamplingAliasingPage /> },
  ],
};
export const getPptNotes = (sceneId: string) => (outline.pages.find(page => page.id === sceneId)?.snippet
  ? [{ text: outline.pages.find(page => page.id === sceneId)!.snippet, selectors: [] }]
  : []);
export function DigitalImagePpt() {
  return <SceneDeck catalog={[deck]} moduleId={outline.id} assetId={outline.moduleIdentity.id} progressKey="lesson-flow:digital-image-intro-v1" getNotes={getPptNotes} />;
}

