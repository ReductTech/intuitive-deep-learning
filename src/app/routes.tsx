import { ContentBlock, ModuleShell } from '../../modules/shared/react';
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
import { UiKitPage } from '../../modules/shared/react/routing/UiKitPage';
import { BlockPreview } from './BlockPreview';
import { activeModules } from './modules';
import { AppLink, type AppRoute } from './Router';

const blockPreviews = [
  { id: 'linear-regression-galton-opening', moduleId: 'linear-regression-loss', title: '高尔顿的身高数据', description: '从父母与孩子身高的散点关系提出预测问题。', path: '/dev/blocks/linear-regression-loss/galton-opening' },
  { id: 'linear-regression-fit', moduleId: 'linear-regression-loss', title: '拟合一条趋势线', description: '调整斜率和截距，让直线捕捉数据趋势。', path: '/dev/blocks/linear-regression-loss/fit' },
  { id: 'linear-regression-loss-function', moduleId: 'linear-regression-loss', title: '损失函数', description: '观察残差如何汇总成平方损失和绝对损失。', path: '/dev/blocks/linear-regression-loss/loss' },
  { id: 'linear-regression-completion', moduleId: 'linear-regression-loss', title: '从数据到损失', description: '回顾预测、残差、损失与参数调整的关系。', path: '/dev/blocks/linear-regression-loss/completion' },
  { id: 'linear-regression-resources', moduleId: 'linear-regression-loss', title: '继续探索', description: '进入损失函数与梯度下降的后续课程。', path: '/dev/blocks/linear-regression-loss/resources' },
  { id: 'neuron-nematode-response', moduleId: 'neuron-guide', title: '秀丽隐杆线虫的刺激反应', description: '从 302 个神经元支持的丰富行为建立课程问题。', path: '/dev/blocks/neuron-guide/nematode-response' },
  { id: 'neuron-biological-structure', moduleId: 'neuron-guide', title: '生物神经元怎样被写成数学模型', description: '从树突、突触、细胞体和轴突提取可计算关系。', path: '/dev/blocks/neuron-guide/biological-structure' },
  { id: 'neuron-decision-bridge', moduleId: 'neuron-guide', title: '神经元究竟在做什么', description: '观察简单的二值状态怎样组合成复杂判断。', path: '/dev/blocks/neuron-guide/decision-bridge' },
  { id: 'neuron-signal-discovery', moduleId: 'neuron-guide', title: '让神经元帮你做一次判断', description: '从一个现实决定中发现共同参与判断的输入信号。', path: '/dev/blocks/neuron-guide/signal-discovery' },
  { id: 'neuron-weighted-sum', moduleId: 'neuron-guide', title: '把现实因素翻译成数值输入', description: '量化一个输入并观察权重怎样改变它的贡献。', path: '/dev/blocks/neuron-guide/weighted-sum' },
  { id: 'neuron-extra-inputs', moduleId: 'neuron-guide', title: '从一个因素扩展到三个因素', description: '补充多个输入并形成完整的加权总分。', path: '/dev/blocks/neuron-guide/extra-inputs' },
  { id: 'neuron-weighted-contribution', moduleId: 'neuron-guide', title: '从加权求和到矩阵表示', description: '把权重和输入写成向量与矩阵乘法。', path: '/dev/blocks/neuron-guide/weighted-contribution' },
  { id: 'neuron-bias-theory', moduleId: 'neuron-guide', title: '判断门槛与偏置', description: '将判断门槛移入公式并统一与零比较。', path: '/dev/blocks/neuron-guide/bias-theory' },
  { id: 'neuron-linear-shallow', moduleId: 'neuron-guide', title: '多个线性神经元的叠加', description: '观察增加线性神经元为何仍然只能得到直线。', path: '/dev/blocks/neuron-guide/linear-shallow' },
  { id: 'neuron-linear-deep', moduleId: 'neuron-guide', title: '线性关系从直线扩展为平面', description: '增加网络深度并观察纯线性网络的表达边界。', path: '/dev/blocks/neuron-guide/linear-deep' },
  { id: 'neuron-relu-intro', moduleId: 'neuron-guide', title: '从线性计算到非线性响应', description: '引入 ReLU，让神经元产生第一个折点。', path: '/dev/blocks/neuron-guide/relu-intro' },
  { id: 'neuron-relu-explanation', moduleId: 'neuron-guide', title: '认识线性整流单元', description: '理解 ReLU 的分段规则、参数和响应位置。', path: '/dev/blocks/neuron-guide/relu-explanation' },
  { id: 'neuron-relu-network', moduleId: 'neuron-guide', title: '组合多个 ReLU 神经元', description: '让多个折点共同形成更丰富的分段线性曲线。', path: '/dev/blocks/neuron-guide/relu-network' },
  { id: 'neuron-relu-approximation', moduleId: 'neuron-guide', title: '用 ReLU 网络逼近任意曲线', description: '亲手绘制目标曲线并训练一个小型网络。', path: '/dev/blocks/neuron-guide/relu-approximation' },
  { id: 'neuron-activation-catalog', moduleId: 'neuron-guide', title: '常见激活函数', description: '比较 ReLU、GELU、Sigmoid、Tanh 等函数。', path: '/dev/blocks/neuron-guide/activation-catalog' },
  { id: 'neuron-completion', moduleId: 'neuron-guide', title: '人工神经元课程总结', description: '回顾输入、权重、求和、偏置与非线性。', path: '/dev/blocks/neuron-guide/completion' },
  { id: 'neuron-resources', moduleId: 'neuron-guide', title: '推荐资源', description: '查看延伸视频和课程导航。', path: '/dev/blocks/neuron-guide/resources' },
];

function HomePage() {
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

      <ContentBlock className="app-developer-tools" title="开发工具" subtitle="共享组件检查与 Web PPT 播放入口。">
        <div className="app-developer-tools__grid">
          <AppLink className="app-ui-kit-card" to="/shared/ui-kit">
            <span className="edu-badge">设计系统</span>
            <strong>Shared UI Kit</strong>
            <span>检查共享组件、流程控制和题型。</span>
            <em>打开 →</em>
          </AppLink>
          <a className="app-ui-kit-card" href="/web_ppt/">
            <span className="edu-badge">演示入口</span>
            <strong>Web PPT</strong>
            <span>播放 React 课件或本地 PPT。</span>
            <em>打开 →</em>
          </a>
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
}

function NeuronReluIntroPreview() {
  return <BlockPreview title="从线性计算到非线性响应" contentClassName="ng-guide-shell">{({ complete }) => <NeuronLessonProvider><ReluIntroBlock onComplete={complete} /></NeuronLessonProvider>}</BlockPreview>;
}

function NeuronReluExplanationPreview() {
  return <BlockPreview title="认识线性整流单元" contentClassName="ng-guide-shell">{() => <NeuronLessonProvider><ReluExplanationBlock /></NeuronLessonProvider>}</BlockPreview>;
}

function NeuronReluNetworkPreview() {
  return <BlockPreview title="组合多个 ReLU 神经元" contentClassName="ng-guide-shell">{({ complete }) => <NeuronLessonProvider><ReluNetworkBlock onComplete={complete} /></NeuronLessonProvider>}</BlockPreview>;
}

function NeuronReluApproximationPreview() {
  return <BlockPreview title="用 ReLU 网络逼近任意曲线" contentClassName="ng-guide-shell">{({ complete }) => <NeuronLessonProvider><ReluApproximationLabBlock onComplete={complete} /></NeuronLessonProvider>}</BlockPreview>;
}

function NeuronActivationCatalogPreview() {
  return <BlockPreview title="常见激活函数" contentClassName="ng-guide-shell">{() => <NeuronLessonProvider><ActivationCatalogBlock /></NeuronLessonProvider>}</BlockPreview>;
}

function NeuronCompletionPreview() {
  return <BlockPreview title="人工神经元课程总结" contentClassName="ng-guide-shell">{() => <NeuronLessonProvider><NeuronCompletionBlock /></NeuronLessonProvider>}</BlockPreview>;
}

function NeuronResourcesPreview() {
  return <BlockPreview title="课程结尾" contentClassName="ng-guide-shell">{() => <NeuronLessonFooter />}</BlockPreview>;
}

function LinearRegressionGaltonPreview() {
  return <BlockPreview title="高尔顿的身高数据" contentClassName="lr-guide-shell">{({ complete }) => <LinearRegressionProvider><GaltonOpeningBlock onComplete={complete} /></LinearRegressionProvider>}</BlockPreview>;
}

function LinearRegressionFitPreview() {
  return <BlockPreview title="拟合一条趋势线" contentClassName="lr-guide-shell">{({ complete }) => <LinearRegressionProvider><LinearFitBlock onComplete={complete} /></LinearRegressionProvider>}</BlockPreview>;
}

function LinearRegressionLossPreview() {
  return <BlockPreview title="损失函数" contentClassName="lr-guide-shell">{({ complete }) => <LinearRegressionProvider><LossFunctionBlock onComplete={complete} /></LinearRegressionProvider>}</BlockPreview>;
}

function LinearRegressionCompletionPreview() {
  return <BlockPreview title="从数据到损失" contentClassName="lr-guide-shell">{() => <LinearRegressionProvider><LinearRegressionCompletionBlock /></LinearRegressionProvider>}</BlockPreview>;
}

function LinearRegressionResourcesPreview() {
  return <BlockPreview title="继续探索" contentClassName="lr-guide-shell">{() => <LinearRegressionFooter />}</BlockPreview>;
}

export const appRoutes: AppRoute[] = [
  { path: '/', element: <HomePage /> },
  { path: '/shared/ui-kit', element: <UiKitPage /> },
  { path: '/web-ppt/neuron', element: <NeuronPptSlidePage /> },
  { path: '/web-ppt/linear-regression-loss', element: <LinearRegressionLossPptSlidePage /> },
  { path: '/web_ppt/slide.html', element: <NeuronPptSlidePage /> },
  ...activeModules.map(({ path, element }) => ({ path, element })),
  { path: '/dev/blocks/neuron-guide/nematode-response', element: <NeuronNematodeResponsePreview /> },
  { path: '/dev/blocks/neuron-guide/biological-structure', element: <NeuronBiologicalStructurePreview /> },
  { path: '/dev/blocks/neuron-guide/decision-bridge', element: <NeuronDecisionBridgePreview /> },
  { path: '/dev/blocks/neuron-guide/signal-discovery', element: <NeuronSignalDiscoveryPreview /> },
  { path: '/dev/blocks/neuron-guide/weighted-sum', element: <NeuronWeightedSumPreview /> },
  { path: '/dev/blocks/neuron-guide/extra-inputs', element: <NeuronExtraInputsPreview /> },
  { path: '/dev/blocks/neuron-guide/weighted-contribution', element: <NeuronWeightedContributionPreview /> },
  { path: '/dev/blocks/neuron-guide/bias-theory', element: <NeuronBiasTheoryPreview /> },
  { path: '/dev/blocks/neuron-guide/linear-shallow', element: <NeuronShallowLinearPreview /> },
  { path: '/dev/blocks/neuron-guide/linear-deep', element: <NeuronDeepLinearPreview /> },
  { path: '/dev/blocks/neuron-guide/relu-intro', element: <NeuronReluIntroPreview /> },
  { path: '/dev/blocks/neuron-guide/relu-explanation', element: <NeuronReluExplanationPreview /> },
  { path: '/dev/blocks/neuron-guide/relu-network', element: <NeuronReluNetworkPreview /> },
  { path: '/dev/blocks/neuron-guide/relu-approximation', element: <NeuronReluApproximationPreview /> },
  { path: '/dev/blocks/neuron-guide/activation-catalog', element: <NeuronActivationCatalogPreview /> },
  { path: '/dev/blocks/neuron-guide/completion', element: <NeuronCompletionPreview /> },
  { path: '/dev/blocks/neuron-guide/resources', element: <NeuronResourcesPreview /> },
  { path: '/dev/blocks/linear-regression-loss/galton-opening', element: <LinearRegressionGaltonPreview /> },
  { path: '/dev/blocks/linear-regression-loss/fit', element: <LinearRegressionFitPreview /> },
  { path: '/dev/blocks/linear-regression-loss/loss', element: <LinearRegressionLossPreview /> },
  { path: '/dev/blocks/linear-regression-loss/completion', element: <LinearRegressionCompletionPreview /> },
  { path: '/dev/blocks/linear-regression-loss/resources', element: <LinearRegressionResourcesPreview /> },
];
