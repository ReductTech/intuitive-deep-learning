import {LocalCoursePage} from '../shuku/LocalAgent';
import {AdminPage} from '../shuku/Admin';
import {ProfilePage} from '../shuku/Profile';
import {BuiltinLearning} from '../shuku/BuiltinLearning';
import {MessagesPage} from '../shuku/Messages';
import {LearningPage} from '../shuku/LearningPage';
import { SceneDeck, type DeckDefinition } from '../../modules/shared/react/presentation';
import { UiKitPage } from '../../modules/shared/react/routing/UiKitPage';
import { activeModules } from './modules';
import { type AppRoute } from './Router';
import { HomePage } from './HomePage';
import { CourseHub } from '../shuku/CourseHub';
import { ManagedEditor } from '../shuku/ManagedEditor';
import { PreviewPage, ReviewPage } from '../shuku/PreviewPage';
import { CreatorWorkspace } from '../creator/CreatorWorkspace';
import {CourseDetails} from '../shuku/CourseDetails';
import { isLocalPreview } from './runtimeMode';


const pptModules = activeModules.filter((module) => module.pptDeck);
const pptCatalog = pptModules.map((module) => module.pptDeck) as [DeckDefinition, ...DeckDefinition[]];

export function SceneDeckPage() {
  if (!pptCatalog.length) return <p>Page not found.</p>;
  if (!isLocalPreview && new URLSearchParams(window.location.search).get('scenedeckCapture') !== '1') return <CreatorWorkspace />;
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
  { path: '/course', element: <CourseDetails /> },
  { path: '/data', element: <AdminPage /> },
  { path: '/profile', element: <ProfilePage /> },
  { path: '/messages', element: <MessagesPage /> },
  { path: '/study', element: <BuiltinLearning /> },
  { path: '/learn', element: <LearningPage /> },
  { path: '/my-courses', element: <CourseHub /> },
  { path: '/course-creation', element: <CourseHub /> },
  { path: '/my-courses/editor', element: <ManagedEditor /> },
  { path: '/my-courses/local', element: <LocalCoursePage /> },
  { path: '/my-courses/preview', element: <PreviewPage /> },
  { path: '/my-courses/review', element: <ReviewPage /> },
  { path: '/edit-deck/legacy', element: <CreatorWorkspace /> },
  { path: '/edit-deck', element: <CreatorWorkspace /> },
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
