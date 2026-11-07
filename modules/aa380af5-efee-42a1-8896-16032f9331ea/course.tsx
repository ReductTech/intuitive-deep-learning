import type { ComponentType } from 'react';
import type { SceneDefinition } from '../shared/react/presentation';
import outlines from './outlines.json';
import { DeliveryTaskPage } from './pages/DeliveryTaskPage/DeliveryTaskPage';
import { StateDesignPage } from './pages/StateDesignPage/StateDesignPage';
import { ActionSpacePage } from './pages/ActionSpacePage/ActionSpacePage';
import { TransitionLoopPage } from './pages/TransitionLoopPage/TransitionLoopPage';
import { ReturnDiscountPage } from './pages/ReturnDiscountPage/ReturnDiscountPage';
import { StateValuePage } from './pages/StateValuePage/StateValuePage';
import { ActionValuePage } from './pages/ActionValuePage/ActionValuePage';
import { BellmanPage } from './pages/BellmanPage/BellmanPage';
import { QTablePage } from './pages/QTablePage/QTablePage';
import { QUpdatePage } from './pages/QUpdatePage/QUpdatePage';
import { AlphaGammaPage } from './pages/AlphaGammaPage/AlphaGammaPage';
import { QLearningLoopPage } from './pages/QLearningLoopPage/QLearningLoopPage';
import { ExplorationPage } from './pages/ExplorationPage/ExplorationPage';
import { EpsilonSchedulePage } from './pages/EpsilonSchedulePage/EpsilonSchedulePage';
import { TabularLimitPage } from './pages/TabularLimitPage/TabularLimitPage';
import { DqnArchitecturePage } from './pages/DqnArchitecturePage/DqnArchitecturePage';
import { ReplayBufferPage } from './pages/ReplayBufferPage/ReplayBufferPage';
import { TargetNetworkPage } from './pages/TargetNetworkPage/TargetNetworkPage';
import { DqnTrainingPage } from './pages/DqnTrainingPage/DqnTrainingPage';
import { FailureModesPage } from './pages/FailureModesPage/FailureModesPage';
import { ValuePolicyPage } from './pages/ValuePolicyPage/ValuePolicyPage';
import { CourseMapPage } from './pages/CourseMapPage/CourseMapPage';
const components: Record<string, ComponentType<{ onComplete?: () => void }>> = {
  'c516e17b-855f-475d-9ade-5a191c3e0ffd': ActionValuePage,
  '294aa79b-9511-4ba7-b923-0209eff46e9e': BellmanPage,
  'd46e53da-3d63-40b0-8fdd-ed557bcd5f77': QTablePage,
  'e401aac9-f0de-46e8-b5fa-ef4f06e42710': QUpdatePage,
  'a8545858-df1f-40ea-b928-97e28a24e726': AlphaGammaPage,
  'd618ab72-7603-425f-871a-3854d9fd0583': QLearningLoopPage,
  '2479a2b1-0015-436e-92c6-94fcd669d32b': ExplorationPage,
  '585a52a0-1ec9-4f6b-b506-019e479885ba': EpsilonSchedulePage,
  '0e693378-20ac-4514-891c-6fef3231c70a': TabularLimitPage,
  '3a2de3d1-938e-49f0-845e-232bdc922202': DqnArchitecturePage,
  '10842ee3-ad38-4bdf-9816-e24a5f2f658a': ReplayBufferPage,
  'b6c8a1f2-190a-4446-8eeb-89dedb00ea9a': TargetNetworkPage,
  '8534859f-f819-4df7-934c-7f3eb562093a': DqnTrainingPage,
  '3fb2edf9-c32b-47be-a3c8-c742c6a0aa7d': FailureModesPage,
  '87b8f748-16f7-4b21-b784-afd31f5c75a9': ValuePolicyPage,
  '277cc40d-246d-42c1-9409-e1238bd5b952': CourseMapPage,
  '6c7cbfb6-ea90-4796-9822-e6c1036f5c05': DeliveryTaskPage, '3bf80ba6-d51a-4a5b-84ee-a6de04d0c99f': StateDesignPage, 'a4ec52ff-cc8e-4ce7-850f-c1d4e97cd15f': ActionSpacePage,
  'd4c52373-87b2-4afe-8880-f62771424187': TransitionLoopPage, 'e5021b70-e244-4400-8fe4-6edecdcf8cb7': ReturnDiscountPage, '9d5707c1-91ae-4821-aad9-0f952d455dab': StateValuePage,
};
const valueStart = outlines.pages.findIndex(page => page.id === 'e5021b70-e244-4400-8fe4-6edecdcf8cb7');
const tableStart = outlines.pages.findIndex(page => page.id === 'd46e53da-3d63-40b0-8fdd-ed557bcd5f77');
const deepStart = outlines.pages.findIndex(page => page.id === '3a2de3d1-938e-49f0-845e-232bdc922202');
export const scenes: SceneDefinition[] = outlines.pages.map((page, i) => ({
  id: page.id, title: page.title, section: i < valueStart ? '任务起点' : i < tableStart ? '价值函数' : i < deepStart ? '表格学习' : '深度价值学习',
  render: ({ complete }) => { const Page = components[page.id]; return <Page onComplete={complete} />; },
}));
export const getPptNotes = (id: string) => { const page = outlines.pages.find(p => p.id === id); return page ? [{ text: page.snippet, selectors: ['.edu-content-body'] }] : []; };
