import { SceneDeck, type DeckDefinition, type SceneDefinition } from '../shared/react/presentation';
import { UncertaintyOpeningPage } from './pages/UncertaintyOpeningPage/UncertaintyOpeningPage';

const scenes: SceneDefinition[] = [
  {
    id: 'uncertainty-opening',
    title: '有些规律像定律，有些规律只表现为趋势',
    section: '世界的两种规律',
    render: () => <UncertaintyOpeningPage />,
  },
];

export const deck: DeckDefinition = {
  id: 'linear-regression-loss',
  title: '从身高遗传到线性回归',
  subtitle: '模型、误差与损失函数 · 1 页',
  scenes,
};

const catalog: [DeckDefinition, ...DeckDefinition[]] = [deck];

export function LinearRegressionPpt() {
  return <SceneDeck catalog={catalog} moduleId="linear-regression-loss" progressKey="lesson-flow:linear-regression-loss" />;
}
