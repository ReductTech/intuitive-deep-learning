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
    { id: outline.pages[7].id, title: outline.pages[7].title, section: '像素值操作', render: () => <PointOperationsPage /> }],
};
export const getPptNotes = (sceneId: string) => (outline.pages.find(page => page.id === sceneId)?.snippet
  ? [{ text: outline.pages.find(page => page.id === sceneId)!.snippet, selectors: [] }]
  : []);
export function DigitalImagePpt() {
  return <SceneDeck catalog={[deck]} moduleId={outline.id} assetId={outline.moduleIdentity.id} progressKey="lesson-flow:digital-image-intro-v1" getNotes={getPptNotes} />;
}

