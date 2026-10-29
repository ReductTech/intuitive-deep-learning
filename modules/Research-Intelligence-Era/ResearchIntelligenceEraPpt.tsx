import { SceneDeck, type DeckDefinition, type SpeakerNote } from '../shared/react/presentation';
import { CoverPage } from './pages/CoverPage/CoverPage';
import { ImplementationBarrierPage } from './pages/ImplementationBarrierPage/ImplementationBarrierPage';
import { ConventionalResearchPage } from './pages/ConventionalResearchPage/ConventionalResearchPage';
import { WishfulResearchPage } from './pages/WishfulResearchPage/WishfulResearchPage';
import { WishfulBenefitsPage } from './pages/WishfulBenefitsPage/WishfulBenefitsPage';
import outline from './outlines.json';

// Only implemented pages enter playback; the full outline remains the authoring plan.
export const deck: DeckDefinition = {
  id: outline.id,
  title: outline.title,
  subtitle: outline.description,
  scenes: [
    { id: 'cover', title: outline.pages[0].title, section: '开场', render: () => <CoverPage /> },
    { id: 'implementation-barrier', title: outline.pages[1].title, section: '研究想法的实现', render: () => <ImplementationBarrierPage /> },
    { id: 'conventional-research', title: outline.pages[2].title, section: '研究想法的实现', render: () => <ConventionalResearchPage /> },
    { id: 'wishful-research', title: outline.pages[3].title, section: '研究想法的实现', render: () => <WishfulResearchPage /> },
    { id: 'wishful-benefits', title: outline.pages[4].title, section: '研究想法的实现', render: () => <WishfulBenefitsPage /> },
  ],
};

export function getPptNotes(sceneId: string): SpeakerNote[] {
  if (sceneId === 'cover') return [{ text: outline.pages[0].snippet, selectors: ['.rie-cover'] }];
  if (sceneId === 'implementation-barrier') return [{ text: outline.pages[1].snippet, selectors: ['.rie-bridge-scene'] }];
  if (sceneId === 'conventional-research') return [{ text: outline.pages[2].snippet, selectors: ['.rie-traditional'] }];
  if (sceneId === 'wishful-research') return [{ text: outline.pages[3].snippet, selectors: ['.rie-wishful'] }];
  if (sceneId === 'wishful-benefits') return [{ text: outline.pages[4].snippet, selectors: ['.rie-benefits'] }];
  return [];
}

export function ResearchIntelligenceEraPpt() {
  return <SceneDeck catalog={[deck]} moduleId={outline.id} assetId={outline.moduleIdentity.id} progressKey={`${outline.moduleIdentity.id}:ppt`} getNotes={getPptNotes} />;
}
