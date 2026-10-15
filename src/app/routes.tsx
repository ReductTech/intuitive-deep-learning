import { SceneDeck, type DeckDefinition } from '../../modules/shared/react/presentation';
import { UiKitPage } from '../../modules/shared/react/routing/UiKitPage';
import { activeModules } from './modules';
import { type AppRoute } from './Router';
import { HomePage } from './HomePage';

const pptModules = activeModules.filter((module) => module.pptDeck);
const pptCatalog = pptModules.map((module) => module.pptDeck) as [DeckDefinition, ...DeckDefinition[]];

function SceneDeckPage() {
  if (!pptCatalog.length) return <p>Page not found.</p>;
  return <SceneDeck
    catalog={pptCatalog}
    moduleId={(deckId) => deckId}
    assetId={(deckId) => pptModules.find((module) => module.pptDeck?.id === deckId)?.assetId ?? deckId}
    progressKey={(deckId) => deckId === 'neuron-guide'
      ? 'lesson-flow:neuron-guide-v1'
      : deckId === 'convolution-kernel-intro'
        ? 'lesson-flow:convolution-kernel-intro-guide-v1'
        : `lesson-flow:${deckId}`}
    getNotes={(sceneId, deckId) => pptModules.find((module) => module.pptDeck?.id === deckId)?.getPptNotes?.(sceneId) ?? []}
  />;
}

export const appRoutes: AppRoute[] = [
  { path: '/', element: <HomePage /> },
  { path: '/shared/ui-kit', element: <UiKitPage /> },
  ...activeModules.flatMap((module) => [
    { path: module.path, element: module.element },
  ]),
  ...(pptCatalog.length ? [
    { path: '/scenedeck/', element: <SceneDeckPage /> },
    { path: '/web_ppt/', element: <SceneDeckPage /> },
    { path: '/web_ppt/slide.html', element: <SceneDeckPage /> },
  ] : []),
];

