import { ContentBlock, ModuleShell } from '../../modules/shared/react';
<<<<<<< ours
=======
import { GaltonLinearRegressionPptSlidePage } from '../../modules/Galton-Linear-Regression/GaltonLinearRegressionPptSlidePage';
import { GaltonPresentationSpikePage } from '../../modules/Galton-Linear-Regression/presentation-spike/GaltonPresentationSpikePage';
import { CompareLossBlock, FitLabBlock, GaltonStoryBlock, LossFunctionBlock as GaltonLossFunctionBlock, PredictionModelBlock, ResidualBlock, ScatterObservationBlock, SummaryBlock } from '../../modules/Galton-Linear-Regression/blocks';
import { LinearRegressionLossPptSlidePage } from '../../modules/Linear-Regression-Loss/LinearRegressionLossPptSlidePage';
import { GaltonOpeningBlock } from '../../modules/Linear-Regression-Loss/blocks/GaltonOpeningBlock';
import { LinearFitBlock } from '../../modules/Linear-Regression-Loss/blocks/LinearFitBlock';
import { LossFunctionBlock } from '../../modules/Linear-Regression-Loss/blocks/LossFunctionBlock';
import { LinearRegressionCompletionBlock } from '../../modules/Linear-Regression-Loss/blocks/LinearRegressionCompletionBlock';
import { LinearRegressionFooter } from '../../modules/Linear-Regression-Loss/blocks/LinearRegressionFooter';
import { LinearRegressionProvider } from '../../modules/Linear-Regression-Loss/model/LinearRegressionContext';
import { ActivationCatalogBlock } from '../../modules/Neuron-Guide/blocks/ActivationCatalogBlock';
import { BiasThresholdTheoryBlock } from '../../modules/Neuron-Guide/blocks/BiasThresholdTheoryBlock';
import { BiologicalNeuronBlock } from '../../modules/Neuron-Guide/blocks/BiologicalNeuronBlock';
import { DeepLinearBlock } from '../../modules/Neuron-Guide/blocks/DeepLinearBlock';
import { ExtraInputsBlock } from '../../modules/Neuron-Guide/blocks/ExtraInputsBlock';
import { NematodeResponseBlock } from '../../modules/Neuron-Guide/blocks/NematodeResponseBlock';
import { NeuronDecisionBridgeBlock } from '../../modules/Neuron-Guide/blocks/NeuronDecisionBridgeBlock';
import { NeuronCompletionBlock, NeuronLessonFooter } from '../../modules/Neuron-Guide/blocks/NeuronLessonFooter';
import { ReluApproximationLabBlock } from '../../modules/Neuron-Guide/blocks/ReluApproximationLabBlock';
import { ReluExplanationBlock } from '../../modules/Neuron-Guide/blocks/ReluExplanationBlock';
import { ReluIntroBlock } from '../../modules/Neuron-Guide/blocks/ReluIntroBlock';
import { ReluNetworkBlock } from '../../modules/Neuron-Guide/blocks/ReluNetworkBlock';
import { ShallowLinearBlock } from '../../modules/Neuron-Guide/blocks/ShallowLinearBlock';
import { SignalDiscoveryBlock } from '../../modules/Neuron-Guide/blocks/SignalDiscoveryBlock';
import { WeightedContributionTheoryBlock } from '../../modules/Neuron-Guide/blocks/WeightedContributionTheoryBlock';
import { WeightedSumBlock } from '../../modules/Neuron-Guide/blocks/WeightedSumBlock';
import { NeuronLessonProvider } from '../../modules/Neuron-Guide/model/NeuronLessonContext';
import { NeuronPptSlidePage } from '../../modules/Neuron-Guide/NeuronPptSlidePage';
>>>>>>> theirs
import { UiKitPage } from '../../modules/shared/react/routing/UiKitPage';
import { LinearRegressionLessonPptSlidePage } from '../../modules/Galton-Linear-Regression-Lesson/LinearRegressionLessonPptSlidePage';
import { NeuronPptSlidePage } from '../../modules/Neuron-Guide/NeuronPptSlidePage';
import { activeModules } from './modules';
import { AppLink, type AppRoute } from './Router';

const blockPreviews = [
  { id: 'grl-opening', moduleId: 'galton-linear-regression-lesson', title: '高尔顿的身高问题', description: '从真实历史问题提出“如何预测孩子身高”。', path: '/modules/galton-linear-regression-lesson' },
  { id: 'grl-ppt', moduleId: 'galton-linear-regression-lesson', title: 'Web PPT 课件', description: '按页播放高尔顿、散点、模型、残差与损失。', path: '/web-ppt/linear-regression-lesson' },
];

function HomePage() {
<<<<<<< ours
  return <ModuleShell title="Intuitive Deep Learning" subtitle="从真实问题出发，逐步建立可解释的数学模型。" shellClassName="app-home-shell">
    <section className="app-course-directory" aria-labelledby="app-course-directory-title">
      <header className="app-course-directory__head"><div><span className="app-course-directory__kicker">COURSE DIRECTORY</span><h2 id="app-course-directory-title">课程模块</h2></div><p>选择一个课程，进入完整学习流程或 Web PPT。</p></header>
      <div className="app-course-accordion">{activeModules.map((module, moduleIndex) => { const lessons = blockPreviews.filter((block) => block.moduleId === module.id); return <details className="app-course-group" key={module.id} open><summary className="app-course-group__summary"><span className="app-course-group__index">{String(moduleIndex + 1).padStart(2, '0')}</span><span className="app-course-group__copy"><strong>{module.title}</strong><span>{module.description}</span></span><span className="app-course-group__count">{lessons.length} 个入口</span><span className="app-course-group__chevron" aria-hidden="true" /></summary><div className="app-course-group__body"><AppLink className="app-course-launch" to={module.path}><span className="edu-badge">{module.badge}</span><span><strong>进入完整课程</strong><small>按教学顺序连续学习全部内容</small></span><em>开始学习 →</em></AppLink><ol className="app-course-lessons">{lessons.map((lesson, index) => <li key={lesson.id}><AppLink className="app-course-lesson" to={lesson.path}><span className="app-course-lesson__number">{String(index + 1).padStart(2, '0')}</span><span className="app-course-lesson__copy"><strong>{lesson.title}</strong><small>{lesson.description}</small></span><span className="app-course-lesson__arrow" aria-hidden="true">→</span></AppLink></li>)}</ol></div></details>; })}</div>
    </section>
    <ContentBlock className="app-developer-tools" title="开发工具" subtitle="共享组件检查与 Web PPT 播放入口。"><div className="app-developer-tools__grid"><AppLink className="app-ui-kit-card" to="/shared/ui-kit"><span className="edu-badge">设计系统</span><strong>Shared UI Kit</strong><span>检查共享组件、流程控制和题型。</span><em>打开 →</em></AppLink><a className="app-ui-kit-card" href="/web_ppt/"><span className="edu-badge">演示入口</span><strong>Web PPT</strong><span>播放 React 课件或本地 PPT。</span><em>打开 →</em></a></div></ContentBlock>
  </ModuleShell>;
=======
  return (
    <ModuleShell
      title="Intuitive Deep Learning"
      subtitle="按课程聚合浏览完整模块与顺序子模块。点击课程标题展开目录。"
      shellClassName="app-home-shell"
    >
      <section className="app-course-directory" aria-labelledby="app-course-directory-title">
        <header className="app-course-directory__head">
          <div>
            <span className="app-course-directory__kicker">COURSE DIRECTORY</span>
            <h2 id="app-course-directory-title">课程模块</h2>
          </div>
          <p>选择一个课程，展开后可进入完整课程或单独打开任意子模块。</p>
        </header>

        <div className="app-course-accordion">
          {activeModules.map((module, moduleIndex) => {
            const moduleBlocks = blockPreviews.filter((block) => block.moduleId === module.id);
            return (
              <details className="app-course-group" key={module.id}>
                <summary className="app-course-group__summary">
                  <span className="app-course-group__index">{String(moduleIndex + 1).padStart(2, '0')}</span>
                  <span className="app-course-group__copy">
                    <strong>{module.title}</strong>
                    <span>{module.description}</span>
                  </span>
                  <span className="app-course-group__count">{moduleBlocks.length} 个子模块</span>
                  <span className="app-course-group__chevron" aria-hidden="true" />
                </summary>

                <div className="app-course-group__body">
                  <AppLink className="app-course-launch" to={module.path}>
                    <span className="edu-badge">{module.badge}</span>
                    <span>
                      <strong>进入完整课程</strong>
                      <small>按教学顺序连续学习全部内容</small>
                    </span>
                    <em>开始学习 →</em>
                  </AppLink>

                  <ol className="app-course-lessons">
                    {moduleBlocks.map((block, blockIndex) => (
                      <li key={block.id}>
                        <AppLink className="app-course-lesson" to={block.path}>
                          <span className="app-course-lesson__number">{String(blockIndex + 1).padStart(2, '0')}</span>
                          <span className="app-course-lesson__copy">
                            <strong>{block.title}</strong>
                            <small>{block.description}</small>
                          </span>
                          <span className="app-course-lesson__arrow" aria-hidden="true">→</span>
                        </AppLink>
                      </li>
                    ))}
                  </ol>
                </div>
              </details>
            );
          })}
        </div>
      </section>

      <ContentBlock className="app-developer-tools" title="开发工具" subtitle="共享组件检查与多形态展示引擎入口。">
        <div className="app-developer-tools__grid">
          <AppLink className="app-ui-kit-card" to="/shared/ui-kit">
            <span className="edu-badge">设计系统</span>
            <strong>Shared UI Kit</strong>
            <span>检查共享组件、流程控制和题型。</span>
            <em>打开 →</em>
          </AppLink>
          <AppLink className="app-ui-kit-card" to="/presentation-spike">
            <span className="edu-badge">新引擎</span>
            <strong>Presentation Engine</strong>
            <span>编辑、幻灯片、导览页与智能讲解共用同一份内容。</span>
            <em>打开技术纵切 →</em>
          </AppLink>
        </div>
      </ContentBlock>
    </ModuleShell>
  );
}

function NeuronNematodeResponsePreview() {
  return <BlockPreview title="秀丽隐杆线虫的刺激反应" contentClassName="ng-guide-shell">{() => <NeuronLessonProvider><NematodeResponseBlock /></NeuronLessonProvider>}</BlockPreview>;
}

function NeuronBiologicalStructurePreview() {
  return <BlockPreview title="生物神经元结构" contentClassName="ng-guide-shell">{() => <NeuronLessonProvider><BiologicalNeuronBlock /></NeuronLessonProvider>}</BlockPreview>;
}

function NeuronDecisionBridgePreview() {
  return <BlockPreview title="神经元究竟在做什么" contentClassName="ng-guide-shell">{() => <NeuronLessonProvider><NeuronDecisionBridgeBlock /></NeuronLessonProvider>}</BlockPreview>;
}

function NeuronSignalDiscoveryPreview() {
  return <BlockPreview title="发现多个输入信号" contentClassName="ng-guide-shell">{({ complete }) => <NeuronLessonProvider><SignalDiscoveryBlock onComplete={complete} /></NeuronLessonProvider>}</BlockPreview>;
}

function NeuronWeightedSumPreview() {
  return <BlockPreview title="权重与加权和" contentClassName="ng-guide-shell">{({ complete }) => <NeuronLessonProvider><WeightedSumBlock onComplete={complete} /></NeuronLessonProvider>}</BlockPreview>;
}

function NeuronExtraInputsPreview() {
  return <BlockPreview title="补充其他输入" contentClassName="ng-guide-shell">{({ complete }) => <NeuronLessonProvider><ExtraInputsBlock onComplete={complete} /></NeuronLessonProvider>}</BlockPreview>;
}

function NeuronWeightedContributionPreview() {
  return <BlockPreview title="多个输入的加权求和" contentClassName="ng-guide-shell">{() => <NeuronLessonProvider><WeightedContributionTheoryBlock /></NeuronLessonProvider>}</BlockPreview>;
}

function NeuronBiasTheoryPreview() {
  return <BlockPreview title="判断门槛与偏置" contentClassName="ng-guide-shell">{({ complete }) => <NeuronLessonProvider><BiasThresholdTheoryBlock onComplete={complete} /></NeuronLessonProvider>}</BlockPreview>;
}

function NeuronShallowLinearPreview() {
  return <BlockPreview title="多个线性神经元的叠加" contentClassName="ng-guide-shell">{({ complete }) => <NeuronLessonProvider><ShallowLinearBlock onComplete={complete} /></NeuronLessonProvider>}</BlockPreview>;
}

function NeuronDeepLinearPreview() {
  return <BlockPreview title="线性关系从直线扩展为平面" contentClassName="ng-guide-shell">{({ complete }) => <NeuronLessonProvider><DeepLinearBlock onComplete={complete} /></NeuronLessonProvider>}</BlockPreview>;
>>>>>>> theirs
}

export const appRoutes: AppRoute[] = [
  { path: '/', element: <HomePage /> },
  { path: '/presentation-spike', element: <GaltonPresentationSpikePage /> },
  { path: '/shared/ui-kit', element: <UiKitPage /> },
  { path: '/web-ppt/neuron', element: <NeuronPptSlidePage /> },
  { path: '/web-ppt/linear-regression-lesson', element: <LinearRegressionLessonPptSlidePage /> },
  { path: '/web_ppt/', element: <LinearRegressionLessonPptSlidePage /> },
  { path: '/web_ppt/slide.html', element: <LinearRegressionLessonPptSlidePage /> },
  ...activeModules.map(({ path, element }) => ({ path, element })),
];
