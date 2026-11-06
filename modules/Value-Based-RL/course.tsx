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
  'action-value': ActionValuePage,
  'bellman-decomposition': BellmanPage,
  'q-table': QTablePage,
  'q-learning-update': QUpdatePage,
  'alpha-gamma': AlphaGammaPage,
  'q-learning-loop': QLearningLoopPage,
  'exploration-exploitation': ExplorationPage,
  'epsilon-schedule': EpsilonSchedulePage,
  'tabular-limit': TabularLimitPage,
  'dqn-architecture': DqnArchitecturePage,
  'replay-buffer': ReplayBufferPage,
  'target-network': TargetNetworkPage,
  'dqn-training-loop': DqnTrainingPage,
  'failure-modes': FailureModesPage,
  'value-to-policy': ValuePolicyPage,
  'course-map': CourseMapPage,
  'delivery-task': DeliveryTaskPage, 'state-design': StateDesignPage, 'action-space': ActionSpacePage,
  'transition-loop': TransitionLoopPage, 'return-discount': ReturnDiscountPage, 'state-value': StateValuePage,
};
const valueStart = outlines.pages.findIndex(page => page.id === 'return-discount');
const tableStart = outlines.pages.findIndex(page => page.id === 'q-table');
const deepStart = outlines.pages.findIndex(page => page.id === 'dqn-architecture');
export const scenes: SceneDefinition[] = outlines.pages.map((page, i) => ({
  id: page.id, title: page.title, section: i < valueStart ? '任务起点' : i < tableStart ? '价值函数' : i < deepStart ? '表格学习' : '深度价值学习',
  render: ({ complete }) => { const Page = components[page.id]; return <Page onComplete={complete} />; },
}));
export const getPptNotes = (id: string) => { const page = outlines.pages.find(p => p.id === id); return page ? [{ text: page.snippet, selectors: ['.edu-content-body'] }] : []; };
