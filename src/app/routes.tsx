import { ContentBlock, ModuleShell } from '../../modules/shared/react';
import { LossGuidePage } from '../../modules/Loss-Guide-React/LossGuidePage';
import { GradientBlock } from '../../modules/Loss-Guide-React/blocks/GradientBlock';
import { LossCalculationBlock } from '../../modules/Loss-Guide-React/blocks/LossCalculationBlock';
import { NumberLineBlock } from '../../modules/Loss-Guide-React/blocks/NumberLineBlock';
import { ResourcesBlock } from '../../modules/Loss-Guide-React/blocks/ResourcesBlock';
import { BlockPreview } from './BlockPreview';
import { UiKitPage } from '../../modules/shared/react/routing/UiKitPage';
import { AppLink, type AppRoute } from './Router';

function HomePage() {
  return (
    <ModuleShell title="Intuitive Deep Learning" subtitle="教学模块共享 React 基础层">
      <ContentBlock title="Shared UI Kit" subtitle="可复用的教学组件已经准备好，可以供正式模块组合使用。">
        <p className="edu-body"><AppLink to="/shared/ui-kit">打开 Shared UI Kit</AppLink></p>
      </ContentBlock>
    </ModuleShell>
  );
}

function NumberLinePreview() {
  return <BlockPreview title="数轴距离">{({ complete }) => <NumberLineBlock onComplete={complete} />}</BlockPreview>;
}

function CalculationPreview() {
  return <BlockPreview title="损失计算">{({ complete }) => <LossCalculationBlock onComplete={complete} />}</BlockPreview>;
}

function GradientPreview() {
  return <BlockPreview title="L1 与 L2 梯度">{({ complete }) => <GradientBlock onComplete={complete} />}</BlockPreview>;
}

function ResourcesPreview() {
  return <BlockPreview title="推荐资源">{() => <ResourcesBlock />}</BlockPreview>;
}

export const appRoutes: AppRoute[] = [
  { path: '/', element: <HomePage /> },
  { path: '/shared/ui-kit', element: <UiKitPage /> },
  { path: '/modules/loss-guide-react', element: <LossGuidePage /> },
  { path: '/dev/blocks/loss-guide-react/number-line', element: <NumberLinePreview /> },
  { path: '/dev/blocks/loss-guide-react/calculation', element: <CalculationPreview /> },
  { path: '/dev/blocks/loss-guide-react/gradient', element: <GradientPreview /> },
  { path: '/dev/blocks/loss-guide-react/resources', element: <ResourcesPreview /> },
];
