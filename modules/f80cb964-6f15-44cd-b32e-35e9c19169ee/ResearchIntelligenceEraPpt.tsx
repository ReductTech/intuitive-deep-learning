import { SceneDeck, type DeckDefinition, type SpeakerNote } from '../shared/react/presentation';
import { CoverPage } from './pages/CoverPage/CoverPage';
import { ImplementationBarrierPage } from './pages/ImplementationBarrierPage/ImplementationBarrierPage';
import { ConventionalResearchPage } from './pages/ConventionalResearchPage/ConventionalResearchPage';
import { WishfulResearchPage } from './pages/WishfulResearchPage/WishfulResearchPage';
import { WishfulBenefitsPage } from './pages/WishfulBenefitsPage/WishfulBenefitsPage';
import { PublicationGrowthPage } from './pages/PublicationGrowthPage/PublicationGrowthPage';
import outline from './outlines.json';

// Only implemented pages enter playback; the full outline remains the authoring plan.
export const deck: DeckDefinition = {
  id: outline.id,
  title: outline.title,
  subtitle: outline.description,
  scenes: [
    { id: '4deacf4d-782d-4f55-814e-322aa1f38422', title: outline.pages.find(page => page.id === '4deacf4d-782d-4f55-814e-322aa1f38422')!.title, section: '开场', render: () => <CoverPage /> },
    { id: 'e0595adb-7c6e-466b-ab08-4129d9a2b04c', title: outline.pages.find(page => page.id === 'e0595adb-7c6e-466b-ab08-4129d9a2b04c')!.title, section: '研究想法的实现', render: () => <ImplementationBarrierPage /> },
    { id: '366440f3-29d5-4c7a-aed1-c1f3baf9d0f4', title: outline.pages.find(page => page.id === '366440f3-29d5-4c7a-aed1-c1f3baf9d0f4')!.title, section: '研究想法的实现', render: () => <ConventionalResearchPage /> },
    { id: 'd98982d4-186a-4307-93c4-d5a1e2be2625', title: outline.pages.find(page => page.id === 'd98982d4-186a-4307-93c4-d5a1e2be2625')!.title, section: '研究想法的实现', render: () => <WishfulResearchPage /> },
    { id: '4ad63653-03eb-4d05-b32d-2841a8b23d04', title: outline.pages.find(page => page.id === '4ad63653-03eb-4d05-b32d-2841a8b23d04')!.title, section: '研究想法的实现', render: () => <WishfulBenefitsPage /> },
    { id: 'de5f1df7-6945-48e4-b174-2a4b43e63f5f', title: outline.pages.find(page => page.id === 'de5f1df7-6945-48e4-b174-2a4b43e63f5f')!.title, section: '论文阅读与判断', render: () => <PublicationGrowthPage /> },
  ],
};

export function getPptNotes(sceneId: string): SpeakerNote[] {
  if (sceneId === '4deacf4d-782d-4f55-814e-322aa1f38422') return [{ text: outline.pages.find(page => page.id === '4deacf4d-782d-4f55-814e-322aa1f38422')!.snippet, selectors: ['.rie-cover'] }];
  if (sceneId === 'e0595adb-7c6e-466b-ab08-4129d9a2b04c') return [{ text: outline.pages.find(page => page.id === 'e0595adb-7c6e-466b-ab08-4129d9a2b04c')!.snippet, selectors: ['.rie-bridge-scene'] }];
  if (sceneId === '366440f3-29d5-4c7a-aed1-c1f3baf9d0f4') return [{ text: outline.pages.find(page => page.id === '366440f3-29d5-4c7a-aed1-c1f3baf9d0f4')!.snippet, selectors: ['.rie-traditional'] }];
  if (sceneId === 'd98982d4-186a-4307-93c4-d5a1e2be2625') return [{ text: outline.pages.find(page => page.id === 'd98982d4-186a-4307-93c4-d5a1e2be2625')!.snippet, selectors: ['.rie-wishful'] }];
  if (sceneId === '4ad63653-03eb-4d05-b32d-2841a8b23d04') return [{ text: outline.pages.find(page => page.id === '4ad63653-03eb-4d05-b32d-2841a8b23d04')!.snippet, selectors: ['.rie-benefits'] }];
  if (sceneId === 'de5f1df7-6945-48e4-b174-2a4b43e63f5f') return [{ text: outline.pages.find(page => page.id === 'de5f1df7-6945-48e4-b174-2a4b43e63f5f')!.snippet, selectors: ['.rie-iclr-page'] }];
  return [];
}

export function ResearchIntelligenceEraPpt() {
  return <SceneDeck catalog={[deck]} moduleId={outline.id} assetId={outline.moduleIdentity.id} progressKey={`${outline.moduleIdentity.id}:ppt`} getNotes={getPptNotes} />;
}
