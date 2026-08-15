import { ContentBlock, ModuleShell } from '../../modules/shared/react';
import { ActivationCatalogBlock } from '../../modules/Activation-Func-Module-React/blocks/ActivationCatalogBlock';
import { ApproximationBlock } from '../../modules/Activation-Func-Module-React/blocks/ApproximationBlock';
import { DeepLinearBlock } from '../../modules/Activation-Func-Module-React/blocks/DeepLinearBlock';
import { LinearConclusionBlock } from '../../modules/Activation-Func-Module-React/blocks/LinearConclusionBlock';
import { Linear2DChoiceBlock, Linear3DChoiceBlock } from '../../modules/Activation-Func-Module-React/blocks/LinearChoiceBlocks';
import { ReluIntroBlock } from '../../modules/Activation-Func-Module-React/blocks/ReluIntroBlock';
import { ReluNetworkBlock } from '../../modules/Activation-Func-Module-React/blocks/ReluNetworkBlock';
import { ShallowLinearBlock } from '../../modules/Activation-Func-Module-React/blocks/ShallowLinearBlock';
import { AutoUpdateBlock } from '../../modules/Gradient-Descent-Module-React/blocks/AutoUpdateBlock';
import { FullNetworkTrainingBlock } from '../../modules/Gradient-Descent-Module-React/blocks/FullNetworkTrainingBlock';
import { ManualTuningBlock } from '../../modules/Gradient-Descent-Module-React/blocks/ManualTuningBlock';
import { ResourcesBlock as GradientResourcesBlock } from '../../modules/Gradient-Descent-Module-React/blocks/ResourcesBlock';
import { AdvancedBlock as LossAdvancedBlock } from '../../modules/Loss-Guide-React/blocks/AdvancedBlock';
import { CrossEntropyBlock } from '../../modules/Loss-Guide-React/blocks/CrossEntropyBlock';
import { AdvancedBlock as GradientAdvancedBlock } from '../../modules/Gradient-Descent-Module-React/blocks/AdvancedBlock';
import { GradientBlock } from '../../modules/Loss-Guide-React/blocks/GradientBlock';
import { LossCalculationBlock } from '../../modules/Loss-Guide-React/blocks/LossCalculationBlock';
import { NumberLineBlock } from '../../modules/Loss-Guide-React/blocks/NumberLineBlock';
import { ResourcesBlock } from '../../modules/Loss-Guide-React/blocks/ResourcesBlock';
import { DatasetLessonFooter } from '../../modules/Dataset-Split-Module/blocks/DatasetLessonFooter';
import { DatasetSplitProcessBlock } from '../../modules/Dataset-Split-Module/blocks/DatasetSplitProcessBlock';
import { ImageMatrixLabBlock } from '../../modules/Digital-Image-Module-React/blocks/ImageMatrixLabBlock';
import { ObservationBlock } from '../../modules/Digital-Image-Module-React/blocks/ObservationBlock';
import { ResourcesBlock as DigitalImageResourcesBlock } from '../../modules/Digital-Image-Module-React/blocks/ResourcesBlock';
import { RgbColorLabBlock } from '../../modules/Digital-Image-Module-React/blocks/RgbColorLabBlock';
import { ManualCountBlock } from '../../modules/Manual-Feature-Classification-React/blocks/ManualCountBlock';
import { DistributionBlock as ManualDistributionBlock } from '../../modules/Manual-Feature-Classification-React/blocks/DistributionBlock';
import { MlpTrainingBlock as ManualMlpTrainingBlock } from '../../modules/Manual-Feature-Classification-React/blocks/MlpTrainingBlock';
import { ResourcesBlock as ManualFeatureResourcesBlock } from '../../modules/Manual-Feature-Classification-React/blocks/ResourcesBlock';
import { GomokuGameBlock } from '../../modules/Convolution-Kernel-Intro-React/blocks/GomokuGameBlock';
import { KernelOperatorBlock } from '../../modules/Convolution-Kernel-Intro-React/blocks/KernelOperatorBlock';
import { MnistConvolutionBlock } from '../../modules/Convolution-Kernel-Intro-React/blocks/MnistConvolutionBlock';
import { ResourcesBlock as ConvolutionResourcesBlock } from '../../modules/Convolution-Kernel-Intro-React/blocks/ResourcesBlock';
import { DetectionSearchBlock } from '../../modules/LeNet5-CNN-Lab-React/blocks/DetectionSearchBlock';
import { FixedKernelClassifierBlock } from '../../modules/LeNet5-CNN-Lab-React/blocks/FixedKernelClassifierBlock';
import { ResourcesBlock as LeNetResourcesBlock } from '../../modules/LeNet5-CNN-Lab-React/blocks/ResourcesBlock';
import { SequenceRecognitionBlock } from '../../modules/LeNet5-CNN-Lab-React/blocks/SequenceRecognitionBlock';
import { LenetPreviewClassifierGate } from '../../modules/LeNet5-CNN-Lab-React/components/LenetPreviewClassifierGate';
import { CnnQuizBlock as FaceCnnQuizBlock } from '../../modules/Face-Recog-Lab-React/blocks/CnnQuizBlock';
import { DisguiseGameBlock as FaceDisguiseGameBlock } from '../../modules/Face-Recog-Lab-React/blocks/DisguiseGameBlock';
import { FixedKernelFaceBlock } from '../../modules/Face-Recog-Lab-React/blocks/FixedKernelFaceBlock';
import { LearnableCnnBlock as FaceLearnableCnnBlock } from '../../modules/Face-Recog-Lab-React/blocks/LearnableCnnBlock';
import { ResourcesBlock as FaceResourcesBlock } from '../../modules/Face-Recog-Lab-React/blocks/ResourcesBlock';
import { FaceRuntimeBoundary } from '../../modules/Face-Recog-Lab-React/FaceRecogLabPage';
import { HyperparameterOverviewBlock } from '../../modules/Hyperparameter-Module/blocks/HyperparameterOverviewBlock';
import { HyperparameterLessonFooter } from '../../modules/Hyperparameter-Module/blocks/HyperparameterLessonFooter';
import { GridSearchSimulationBlock } from '../../modules/Hyperparameter-Module/blocks/GridSearchSimulationBlock';
import { RandomSearchSimulationBlock } from '../../modules/Hyperparameter-Module/blocks/RandomSearchSimulationBlock';
import { BatchStepEpochBlock } from '../../modules/MISC_Module/blocks/BatchStepEpochBlock';
import { MlpLabBlock } from '../../modules/MLP_playground-React/blocks/MlpLabBlock';
import { MlpTransitionBlock } from '../../modules/MLP_playground-React/blocks/MlpTransitionBlock';
import {
  PersistedBoundaryChallengeBlock,
  PersistedScenarioIntroBlock,
} from '../../modules/MLP_playground-React/blocks/PersistedGuideBlocks';
import { ResourcesBlock as MlpResourcesBlock } from '../../modules/MLP_playground-React/blocks/ResourcesBlock';
import { DropoutBlock } from '../../modules/Fitting_Module/blocks/DropoutBlock';
import { FittingDiagnosisBlock } from '../../modules/Fitting_Module/blocks/FittingDiagnosisBlock';
import { FittingLessonFooter } from '../../modules/Fitting_Module/blocks/FittingLessonFooter';
import { WeightRegularizationBlock } from '../../modules/Fitting_Module/blocks/WeightRegularizationBlock';
import { WhyOptimizerBlock } from '../../modules/Adaptive-Learning-Rate-Module/blocks/WhyOptimizerBlock';
import { SgdBlock } from '../../modules/Adaptive-Learning-Rate-Module/blocks/SgdBlock';
import { MomentumBlock } from '../../modules/Adaptive-Learning-Rate-Module/blocks/MomentumBlock';
import { AdaGradBlock } from '../../modules/Adaptive-Learning-Rate-Module/blocks/AdaGradBlock';
import { AdamBlock } from '../../modules/Adaptive-Learning-Rate-Module/blocks/AdamBlock';
import { AdaptiveLearningRateLessonFooter } from '../../modules/Adaptive-Learning-Rate-Module/blocks/AdaptiveLearningRateLessonFooter';
import { LinearRecognitionBlock } from '../../modules/base_math/blocks/LinearRecognitionBlock';
import { BiasThresholdTheoryBlock } from '../../modules/Neuron-Guide-React/blocks/BiasThresholdTheoryBlock';
import { BiologicalNeuronBlock } from '../../modules/Neuron-Guide-React/blocks/BiologicalNeuronBlock';
import { ExtraInputsBlock } from '../../modules/Neuron-Guide-React/blocks/ExtraInputsBlock';
import { DecisionBridgeBlock } from '../../modules/Neuron-Guide-React/blocks/DecisionBridgeBlock';
import { NematodeResponseBlock } from '../../modules/Neuron-Guide-React/blocks/NematodeResponseBlock';
import { NeuronLessonFooter } from '../../modules/Neuron-Guide-React/blocks/NeuronLessonFooter';
import { SignalDiscoveryBlock } from '../../modules/Neuron-Guide-React/blocks/SignalDiscoveryBlock';
import { WeightedSumBlock } from '../../modules/Neuron-Guide-React/blocks/WeightedSumBlock';
import { WeightedContributionTheoryBlock } from '../../modules/Neuron-Guide-React/blocks/WeightedContributionTheoryBlock';
import { NeuronLessonProvider } from '../../modules/Neuron-Guide-React/model/NeuronLessonContext';
import { NeuronPptSlidePage } from '../../modules/Neuron-Guide-React/NeuronPptSlidePage';
import { BinaryCrossEntropyBlock } from '../../modules/Loss-Guide-2-React/blocks/BinaryCrossEntropyBlock';
import { BinarySigmoidBlock } from '../../modules/Loss-Guide-2-React/blocks/BinarySigmoidBlock';
import { CategoricalCrossEntropyBlock } from '../../modules/Loss-Guide-2-React/blocks/CategoricalCrossEntropyBlock';
import { MulticlassSoftmaxBlock } from '../../modules/Loss-Guide-2-React/blocks/MulticlassSoftmaxBlock';
import { OutputHeadPairingBlock } from '../../modules/Loss-Guide-2-React/blocks/OutputHeadPairingBlock';
import { ResourcesBlock as LossGuide2ResourcesBlock } from '../../modules/Loss-Guide-2-React/blocks/ResourcesBlock';
import { BlockPreview } from './BlockPreview';
import { UiKitPage } from '../../modules/shared/react/routing/UiKitPage';
import { AppLink, type AppRoute } from './Router';
import { migratedModules } from './modules';

const blockPreviews = [
  { id: 'neuron-nematode-response', group: '认识人工神经元', title: '秀丽隐杆线虫的刺激反应', description: '从 302 个神经元怎样形成刺激反应建立课程问题。', path: '/dev/blocks/neuron-guide-react/nematode-response' },
  { id: 'neuron-biological-structure', group: '认识人工神经元', title: '生物神经元结构', description: '使用 3D 模型与结构图追踪典型信号方向。', path: '/dev/blocks/neuron-guide-react/biological-structure' },
  { id: 'neuron-decision-bridge', group: '认识人工神经元', title: '决策案例过渡', description: '说明为什么多因素决定适合展示多输入汇总。', path: '/dev/blocks/neuron-guide-react/decision-bridge' },
  { id: 'neuron-signal-discovery', group: '认识人工神经元', title: '发现多个输入信号', description: '从一个日常决定中辨认需要同时汇总的多个信号。', path: '/dev/blocks/neuron-guide-react/signal-discovery' },
  { id: 'neuron-weighted-sum', group: '认识人工神经元', title: '权重与加权和', description: '固定输入并改变权重，观察单项贡献和总分。', path: '/dev/blocks/neuron-guide-react/weighted-sum' },
  { id: 'neuron-extra-inputs', group: '认识人工神经元', title: '补充其他输入', description: '为同一个决定填写另外两个输入信号。', path: '/dev/blocks/neuron-guide-react/extra-inputs' },
  { id: 'neuron-weighted-contribution', group: '认识人工神经元', title: '单项加权贡献', description: '定义输入、权重与单项贡献的数学关系。', path: '/dev/blocks/neuron-guide-react/weighted-contribution' },
  { id: 'neuron-bias-theory', group: '认识人工神经元', title: '判断门槛与偏置', description: '将判断门槛移入加权和，并统一与 0 比较。', path: '/dev/blocks/neuron-guide-react/bias-theory' },
  { id: 'base-math-linear-recognition', group: '基础数学', title: '认识线性', description: '通过二维直线与三维平面建立线性直觉。', path: '/dev/blocks/base-math/linear-recognition' },
  { id: 'neuron-ending', group: '认识人工神经元', title: '课程结尾', description: '总结人工神经元的输入、权重、求和与偏置。', path: '/dev/blocks/neuron-guide-react/ending' },
  { id: 'adaptive-lr-why', group: '优化器如何调整步伐', title: '为什么需要优化器', description: '比较过大与过小的固定学习率，观察震荡和缓慢收敛。', path: '/dev/blocks/adaptive-learning-rate/why-optimizer' },
  { id: 'adaptive-lr-sgd', group: '优化器如何调整步伐', title: 'SGD', description: '对比 Full Batch 的平滑路线与 SGD 的蛇形路线。', path: '/dev/blocks/adaptive-learning-rate/sgd' },
  { id: 'adaptive-lr-momentum', group: '优化器如何调整步伐', title: 'Momentum', description: '观察方向记忆如何减少随机梯度带来的左右摇摆。', path: '/dev/blocks/adaptive-learning-rate/momentum' },
  { id: 'adaptive-lr-adagrad', group: '优化器如何调整步伐', title: 'AdaGrad', description: '观察频繁参数与稀疏参数如何获得不同学习率。', path: '/dev/blocks/adaptive-learning-rate/adagrad' },
  { id: 'adaptive-lr-adam', group: '优化器如何调整步伐', title: 'Adam', description: '组合方向记忆与自适应步长，并完成优化器总结。', path: '/dev/blocks/adaptive-learning-rate/adam' },
  { id: 'adaptive-lr-ending', group: '优化器如何调整步伐', title: '课程结尾', description: '回顾 SGD、Momentum、AdaGrad 与 Adam。', path: '/dev/blocks/adaptive-learning-rate/ending' },
  { id: 'fitting-diagnosis', group: '拟合与泛化', title: '辨别欠拟合与过拟合', description: '观察训练与验证曲线，标记过拟合开始位置。', path: '/dev/blocks/fitting/diagnosis' },
  { id: 'fitting-weight-regularization', group: '拟合与泛化', title: '权重正则化', description: '理解小权重为何更稳定，以及正则项如何缓解过拟合。', path: '/dev/blocks/fitting/weight-regularization' },
  { id: 'fitting-dropout', group: '拟合与泛化', title: 'Dropout', description: '观察每次训练如何用新的随机 Mask 屏蔽部分激活。', path: '/dev/blocks/fitting/dropout' },
  { id: 'fitting-ending', group: '拟合与泛化', title: '课程结尾', description: '拟合与泛化课程完成状态及延伸视频。', path: '/dev/blocks/fitting/ending' },
  { id: 'misc-batch-step-epoch', group: '基础概念', title: 'Batch、Step 与 Epoch', description: '理解批次、参数更新次数与完整训练轮次。', path: '/dev/blocks/misc/batch-step-epoch' },
  { id: 'hyperparameter-overview', group: '超参数与超参数搜索', title: '超参数', description: '参数与超参数、常见超参数滑杆及单选题。', path: '/dev/blocks/hyperparameter/overview' },
  { id: 'hyperparameter-grid-search', group: '超参数与超参数搜索', title: '网格搜索', description: '运行学习率与权重衰减的二维网格搜索。', path: '/dev/blocks/hyperparameter/grid-search' },
  { id: 'hyperparameter-random-search', group: '超参数与超参数搜索', title: '随机搜索', description: '使用固定预算从连续分布中随机采样超参数。', path: '/dev/blocks/hyperparameter/random-search' },
  { id: 'hyperparameter-ending', group: '超参数与超参数搜索', title: '课程结尾', description: '超参数课程完成状态。', path: '/dev/blocks/hyperparameter/ending' },
  { id: 'dataset-process', group: '数据集划分', title: '数据集划分与训练流程', description: '数据比例划分、训练验证循环与最终测试。', path: '/dev/blocks/dataset-split/process' },
  { id: 'dataset-ending', group: '数据集划分', title: '课程结尾', description: '数据集课程完成状态。', path: '/dev/blocks/dataset-split/ending' },
  { id: 'loss-number-line', group: '损失函数导览', title: '数轴距离', description: '通过数轴理解预测与真实值之间的距离。', path: '/dev/blocks/loss-guide-react/number-line' },
  { id: 'loss-calculation', group: '损失函数导览', title: '损失计算', description: '独立调试损失计算教学块。', path: '/dev/blocks/loss-guide-react/calculation' },
  { id: 'loss-gradient', group: '损失函数导览', title: 'L1 与 L2 梯度', description: '独立调试梯度比较教学块。', path: '/dev/blocks/loss-guide-react/gradient' },
  { id: 'loss-cross-entropy', group: '损失函数导览', title: '分类与交叉熵', description: '独立调试交叉熵教学块。', path: '/dev/blocks/loss-guide-react/cross-entropy' },
  { id: 'loss-advanced', group: '损失函数导览', title: '延伸拓展', description: '独立调试延伸拓展内容块。', path: '/dev/blocks/loss-guide-react/advanced' },
  { id: 'loss-resources', group: '损失函数导览', title: '推荐资源', description: '独立调试课程结尾与推荐资源。', path: '/dev/blocks/loss-guide-react/resources' },
  { id: 'loss-2-sigmoid', group: '输出层与分类损失', title: 'Sigmoid 与单类别概率', description: '独立调试天气信号、Sigmoid 曲线和观察题。', path: '/dev/blocks/loss-guide-2-react/sigmoid' },
  { id: 'loss-2-bce', group: '输出层与分类损失', title: '二分类交叉熵', description: '独立调试损失设计、曲线和 BCE 推导。', path: '/dev/blocks/loss-guide-2-react/bce' },
  { id: 'loss-2-softmax', group: '输出层与分类损失', title: 'Softmax 类别竞争', description: '独立调试多个 Sigmoid 与 Softmax 的差异。', path: '/dev/blocks/loss-guide-2-react/softmax' },
  { id: 'loss-2-ce', group: '输出层与分类损失', title: '多分类交叉熵', description: '独立调试天气预报选择与交叉熵负号解释。', path: '/dev/blocks/loss-guide-2-react/cross-entropy' },
  { id: 'loss-2-pairing', group: '输出层与分类损失', title: '输出头配对', description: '独立调试三种任务与输出层、损失函数的搭配。', path: '/dev/blocks/loss-guide-2-react/output-pairing' },
  { id: 'loss-2-resources', group: '输出层与分类损失', title: '课程结尾', description: '独立调试推荐视频和课程导航。', path: '/dev/blocks/loss-guide-2-react/resources' },
  { id: 'digital-image-observation', group: '数字图像与 RGB', title: '屏幕像素观察', description: '独立调试观察画布、RGB 子像素放大镜和真实简答评阅。', path: '/dev/blocks/digital-image-module-react/observation' },
  { id: 'digital-image-rgb', group: '数字图像与 RGB', title: 'RGB 调色', description: '独立调试 RGB 滑杆、0–1/0–255 向量和纯绿色完成条件。', path: '/dev/blocks/digital-image-module-react/rgb' },
  { id: 'digital-image-matrix', group: '数字图像与 RGB', title: '图片通道与矩阵', description: '独立调试本地图片、RGB 通道、拖动选区和 3×3 矩阵。', path: '/dev/blocks/digital-image-module-react/image-matrix' },
  { id: 'digital-image-resources', group: '数字图像与 RGB', title: '课程结尾', description: '独立调试数字图像课程总结、视频和导航。', path: '/dev/blocks/digital-image-module-react/resources' },
  { id: 'manual-feature-count', group: '人工特征的分类', title: '九宫格计数与向量顺序', description: '独立调试真实 MNIST 自动扫描、手动计数、路径预览和顺序评语。', path: '/dev/blocks/manual-feature-classification-react/count' },
  { id: 'manual-feature-distribution', group: '人工特征的分类', title: '九宫格分布热力图', description: '独立调试 160 张真实 MNIST 图片的平均特征和识别小游戏。', path: '/dev/blocks/manual-feature-classification-react/distribution' },
  { id: 'manual-feature-mlp', group: '人工特征的分类', title: '双层 MLP 训练', description: '独立调试 900 轮真实训练、自动样本轮播和手写测试。', path: '/dev/blocks/manual-feature-classification-react/mlp' },
  { id: 'manual-feature-resources', group: '人工特征的分类', title: '课程结尾', description: '独立调试人工特征总结、推荐视频和课程导航。', path: '/dev/blocks/manual-feature-classification-react/resources' },
  { id: 'convolution-gomoku', group: '卷积核入门', title: '五子棋与胜负判断', description: '独立调试五子棋 AI、胜局展示与真实简答评阅。', path: '/dev/blocks/convolution-kernel-intro-react/gomoku' },
  { id: 'convolution-operator', group: '卷积核入门', title: '二值棋盘与 5×5 算子', description: '独立调试窗口扫描、算子设计、变换和激活计算。', path: '/dev/blocks/convolution-kernel-intro-react/operator' },
  { id: 'convolution-mnist', group: '卷积核入门', title: 'MNIST 卷积扫描', description: '独立调试真实 MNIST、卷积核切换、自定义核和特征图。', path: '/dev/blocks/convolution-kernel-intro-react/mnist' },
  { id: 'convolution-resources', group: '卷积核入门', title: '课程结尾', description: '独立调试卷积课程推荐视频和课程导航。', path: '/dev/blocks/convolution-kernel-intro-react/resources' },
  { id: 'lenet-fixed-kernel', group: '从人工卷积核到 LeNet-5', title: '固定核分类器', description: '独立调试固定卷积核、真实训练、特征图与手写识别。', path: '/dev/blocks/lenet5-cnn-lab-react/fixed-kernel' },
  { id: 'lenet-sequence', group: '从人工卷积核到 LeNet-5', title: '序列数字识别', description: '使用真实分类器独立调试五位数字滑窗识别和 CTC 合并。', path: '/dev/blocks/lenet5-cnn-lab-react/sequence' },
  { id: 'lenet-detection', group: '从人工卷积核到 LeNet-5', title: '寻找老六', description: '使用真实分类器独立调试 400 个窗口的数字位置检测。', path: '/dev/blocks/lenet5-cnn-lab-react/detection' },
  { id: 'lenet-resources', group: '从人工卷积核到 LeNet-5', title: '课程结尾', description: '独立调试 LeNet 原有四个推荐视频和课程导航。', path: '/dev/blocks/lenet5-cnn-lab-react/resources' },
  { id: 'face-fixed-kernel', group: '人脸识别', title: '固定卷积核人脸分类', description: '独立调试 LFW 样本、固定卷积核特征图和真实 MLP 训练。', path: '/dev/blocks/face-recog-lab-react/fixed-kernel' },
  { id: 'face-learnable-cnn', group: '人脸识别', title: '可学习 CNN', description: '独立调试 CNN 结构编辑、Three.js 网络与真实异步训练。', path: '/dev/blocks/face-recog-lab-react/learnable-cnn' },
  { id: 'face-cnn-understanding', group: '人脸识别', title: 'CNN 理解练习', description: '独立调试卷积深度、通道、泛化和人脸验证连续练习。', path: '/dev/blocks/face-recog-lab-react/cnn-understanding' },
  { id: 'face-disguise-game', group: '人脸识别', title: '雨花弄：变脸', description: '独立调试与完整课程相同的 Phaser 乔装挑战。', path: '/dev/blocks/face-recog-lab-react/disguise-game' },
  { id: 'face-resources', group: '人脸识别', title: '课程结尾', description: '独立调试原有四个推荐视频和最终课程目录入口。', path: '/dev/blocks/face-recog-lab-react/resources' },
];

function HomePage() {
  return (
    <ModuleShell title="Intuitive Deep Learning" subtitle="完整课程、子模块与共享 UI 的统一开发入口">
      <ContentBlock title="完整教学模块" subtitle="以完整 LessonFlow 运行课程，检查模块之间的渐进式披露。">
        <div className="app-module-catalog">
          {migratedModules.map((module) => <AppLink key={module.id} className="app-module-card" to={module.path}>
            <span className="edu-badge">{module.badge}</span>
            <strong>{module.title}</strong>
            <span>{module.description}</span>
            <em>进入模块 →</em>
          </AppLink>)}
        </div>
      </ContentBlock>
      <ContentBlock title="子模块调试" subtitle="绕过完整课程流程，单独进入、重置和调试每一个内容块。">
        <div className="app-block-catalog">
          {blockPreviews.map((block) => <AppLink key={block.id} className="app-block-card" to={block.path}>
            <span>{block.group}</span><strong>{block.title}</strong><p>{block.description}</p><em>单独调试 →</em>
          </AppLink>)}
        </div>
      </ContentBlock>
      <ContentBlock title="Shared UI Kit" subtitle="检查所有共享组件、流程控制、题型和课程结尾样式。">
        <AppLink className="app-ui-kit-card" to="/shared/ui-kit"><span className="edu-badge">设计系统</span><strong>打开 Shared UI Kit</strong><span>统一查看基础展示、控件、提示、流程控制、考试题型和课程结尾。</span><em>进入 UI Kit →</em></AppLink>
      </ContentBlock>
      <ContentBlock title="Web PPT" subtitle="在独立播放器中加载并播放 React 课件或本地 PPT 网页。">
        <a className="app-ui-kit-card" href="/web_ppt/"><span className="edu-badge">演示入口</span><strong>打开 Web PPT</strong><span>进入空白播放器后，自行选择内置课件或本地课件文件夹。</span><em>进入播放器 →</em></a>
      </ContentBlock>
    </ModuleShell>
  );
}

function NumberLinePreview() {
  return <BlockPreview title="数轴距离">{({ complete }) => <NumberLineBlock onComplete={complete} />}</BlockPreview>;
}

function NeuronSignalDiscoveryPreview() {
  return <BlockPreview title="发现多个输入信号" contentClassName="ng-react-shell">{({ complete }) => <NeuronLessonProvider><SignalDiscoveryBlock onComplete={complete} /></NeuronLessonProvider>}</BlockPreview>;
}

function NeuronNematodeResponsePreview() {
  return <BlockPreview title="秀丽隐杆线虫的刺激反应" contentClassName="ng-react-shell">{() => <NeuronLessonProvider><NematodeResponseBlock /></NeuronLessonProvider>}</BlockPreview>;
}

function NeuronBiologicalStructurePreview() {
  return <BlockPreview title="生物神经元结构" contentClassName="ng-react-shell">{() => <NeuronLessonProvider><BiologicalNeuronBlock /></NeuronLessonProvider>}</BlockPreview>;
}


function NeuronDecisionBridgePreview() {
  return <BlockPreview title="决策案例过渡" contentClassName="ng-react-shell">{() => <NeuronLessonProvider><DecisionBridgeBlock /></NeuronLessonProvider>}</BlockPreview>;
}

function NeuronBiasTheoryPreview() {
  return <BlockPreview title="判断门槛与偏置" contentClassName="ng-react-shell">{({ complete }) => <NeuronLessonProvider><BiasThresholdTheoryBlock onComplete={complete} /></NeuronLessonProvider>}</BlockPreview>;
}

function BaseMathLinearRecognitionPreview() {
  return <BlockPreview title="认识线性" contentClassName="base-math-shell">{({ complete }) => <LinearRecognitionBlock onComplete={complete} />}</BlockPreview>;
}

function NeuronWeightedSumPreview() {
  return <BlockPreview title="权重与加权和" contentClassName="ng-react-shell">{({ complete }) => <NeuronLessonProvider><WeightedSumBlock onComplete={complete} /></NeuronLessonProvider>}</BlockPreview>;
}

function NeuronExtraInputsPreview() {
  return <BlockPreview title="补充其他输入" contentClassName="ng-react-shell">{({ complete }) => <NeuronLessonProvider><ExtraInputsBlock onComplete={complete} /></NeuronLessonProvider>}</BlockPreview>;
}

function NeuronWeightedContributionPreview() {
  return <BlockPreview title="多个输入的加权求和" contentClassName="ng-react-shell">{() => <NeuronLessonProvider><WeightedContributionTheoryBlock /></NeuronLessonProvider>}</BlockPreview>;
}

function NeuronEndingPreview() {
  return <BlockPreview title="课程结尾" contentClassName="ng-react-shell">{() => <NeuronLessonFooter />}</BlockPreview>;
}

function CalculationPreview() {
  return <BlockPreview title="损失计算">{({ complete }) => <LossCalculationBlock onComplete={complete} />}</BlockPreview>;
}

function GradientPreview() {
  return <BlockPreview title="L1 与 L2 梯度">{({ complete }) => <GradientBlock onComplete={complete} />}</BlockPreview>;
}

function CrossEntropyPreview() {
  return <BlockPreview title="分类与交叉熵">{({ complete }) => <CrossEntropyBlock onComplete={complete} />}</BlockPreview>;
}

function AdvancedPreview() {
  return <BlockPreview title="延伸拓展">{() => <LossAdvancedBlock />}</BlockPreview>;
}

function GradientAdvancedPreview() {
  return <BlockPreview title="延伸拓展">{() => <GradientAdvancedBlock />}</BlockPreview>;
}

function ResourcesPreview() {
  return <BlockPreview title="推荐资源">{() => <ResourcesBlock />}</BlockPreview>;
}

function DatasetHyperparametersPreview() {
  return <BlockPreview title="超参数">{({ complete }) => <HyperparameterOverviewBlock onComplete={complete} />}</BlockPreview>;
}

function HyperparameterEndingPreview() {
  return <BlockPreview title="课程结尾">{() => <HyperparameterLessonFooter />}</BlockPreview>;
}

function HyperparameterGridSearchPreview() {
  return <BlockPreview title="网格搜索">{({ complete }) => <GridSearchSimulationBlock onComplete={complete} />}</BlockPreview>;
}

function HyperparameterRandomSearchPreview() {
  return <BlockPreview title="随机搜索">{({ complete }) => <RandomSearchSimulationBlock onComplete={complete} />}</BlockPreview>;
}

function DatasetProcessPreview() {
  return <BlockPreview title="数据集划分与训练流程">{({ complete }) => <DatasetSplitProcessBlock onComplete={complete} />}</BlockPreview>;
}

function DatasetEndingPreview() {
  return <BlockPreview title="课程结尾">{() => <DatasetLessonFooter />}</BlockPreview>;
}

function BatchStepEpochPreview() {
  return <BlockPreview title="Batch、Step 与 Epoch">{({ complete }) => <BatchStepEpochBlock onComplete={complete} />}</BlockPreview>;
}

function GradientManualPreview() {
  return <BlockPreview title="手动调整输出层权重">{({ complete }) => <ManualTuningBlock onComplete={complete} />}</BlockPreview>;
}

function GradientAutoUpdatePreview() {
  return <BlockPreview title="推导并执行梯度更新">{({ complete }) => <AutoUpdateBlock onComplete={complete} />}</BlockPreview>;
}

function GradientFullNetworkPreview() {
  return <BlockPreview title="让完整网络一起学习">{({ complete }) => <FullNetworkTrainingBlock onComplete={complete} />}</BlockPreview>;
}

function GradientResourcesPreview() {
  return <BlockPreview title="梯度下降推荐资源">{() => <GradientResourcesBlock />}</BlockPreview>;
}

function ActivationLinear2DPreview() {
  return <BlockPreview title="线性定义与二维判断">{({ complete }) => <Linear2DChoiceBlock onComplete={complete} />}</BlockPreview>;
}

function ActivationLinear3DPreview() {
  return <BlockPreview title="三维线性判断">{({ complete }) => <Linear3DChoiceBlock onComplete={complete} />}</BlockPreview>;
}

function ActivationShallowPreview() {
  return <BlockPreview title="浅层线性网络">{({ complete }) => <ShallowLinearBlock onComplete={complete} />}</BlockPreview>;
}

function ActivationDeepPreview() {
  return <BlockPreview title="深层线性网络">{({ complete }) => <DeepLinearBlock onComplete={complete} />}</BlockPreview>;
}

function ActivationLinearConclusionPreview() {
  return <BlockPreview title="线性结论">{({ complete }) => <LinearConclusionBlock onComplete={complete} />}</BlockPreview>;
}

function ActivationReluIntroPreview() {
  return <BlockPreview title="单神经元 ReLU">{({ complete }) => <ReluIntroBlock onComplete={complete} />}</BlockPreview>;
}

function ActivationReluNetworkPreview() {
  return <BlockPreview title="多神经元 ReLU 网络">{({ complete }) => <ReluNetworkBlock onComplete={complete} />}</BlockPreview>;
}

function ActivationApproximationPreview() {
  return <BlockPreview title="曲线逼近">{({ complete }) => <ApproximationBlock onComplete={complete} />}</BlockPreview>;
}

function ActivationCatalogPreview() {
  return <BlockPreview title="激活函数与推荐资源">{() => <ActivationCatalogBlock />}</BlockPreview>;
}

function MlpScenarioPreview() {
  return <BlockPreview title="个性化分类情境">{({ complete }) => <PersistedScenarioIntroBlock onComplete={complete} />}</BlockPreview>;
}

function MlpBoundaryPreview() {
  return <BlockPreview title="三关手绘分类边界">{({ complete }) => <PersistedBoundaryChallengeBlock onComplete={complete} />}</BlockPreview>;
}

function MlpTransitionPreview() {
  return <BlockPreview title="MLP 实验过渡">{({ complete }) => <MlpTransitionBlock onComplete={complete} />}</BlockPreview>;
}

function MlpOneDimensionalPreview() {
  return <BlockPreview title="1D MLP 实验">{({ complete }) => <MlpLabBlock dimension={1} onComplete={complete} />}</BlockPreview>;
}

function MlpTwoDimensionalPreview() {
  return <BlockPreview title="2D MLP 实验">{({ complete }) => <MlpLabBlock dimension={2} onComplete={complete} />}</BlockPreview>;
}

function MlpThreeDimensionalPreview() {
  return <BlockPreview title="3D MLP 实验">{({ complete }) => <MlpLabBlock dimension={3} onComplete={complete} />}</BlockPreview>;
}

function MlpResourcesPreview() {
  return <BlockPreview title="MLP 推荐资源">{() => <MlpResourcesBlock />}</BlockPreview>;
}

function FittingDiagnosisPreview() {
  return <BlockPreview title="辨别欠拟合与过拟合">{({ complete }) => <FittingDiagnosisBlock onComplete={complete} />}</BlockPreview>;
}

function WeightRegularizationPreview() {
  return <BlockPreview title="权重正则化">{({ complete }) => <WeightRegularizationBlock onComplete={complete} />}</BlockPreview>;
}

function DropoutPreview() {
  return <BlockPreview title="Dropout">{({ complete }) => <DropoutBlock onComplete={complete} />}</BlockPreview>;
}

function FittingEndingPreview() {
  return <BlockPreview title="课程结尾">{() => <FittingLessonFooter />}</BlockPreview>;
}

function WhyOptimizerPreview() {
  return <BlockPreview title="为什么需要优化器">{({ complete }) => <WhyOptimizerBlock onComplete={complete} />}</BlockPreview>;
}

function SgdPreview() {
  return <BlockPreview title="SGD">{({ complete }) => <SgdBlock onComplete={complete} />}</BlockPreview>;
}

function MomentumPreview() {
  return <BlockPreview title="Momentum">{({ complete }) => <MomentumBlock onComplete={complete} />}</BlockPreview>;
}

function AdaGradPreview() {
  return <BlockPreview title="AdaGrad">{({ complete }) => <AdaGradBlock onComplete={complete} />}</BlockPreview>;
}

function AdamPreview() {
  return <BlockPreview title="Adam">{({ complete }) => <AdamBlock onComplete={complete} />}</BlockPreview>;
}

function AdaptiveLearningRateEndingPreview() {
  return <BlockPreview title="课程结尾">{() => <AdaptiveLearningRateLessonFooter />}</BlockPreview>;
}

function LossGuide2SigmoidPreview() {
  return <BlockPreview title="Sigmoid 与单类别概率">{({ complete }) => <BinarySigmoidBlock onComplete={complete} />}</BlockPreview>;
}

function LossGuide2BcePreview() {
  return <BlockPreview title="二分类交叉熵">{({ complete }) => <BinaryCrossEntropyBlock onComplete={complete} />}</BlockPreview>;
}

function LossGuide2SoftmaxPreview() {
  return <BlockPreview title="Softmax 类别竞争">{({ complete }) => <MulticlassSoftmaxBlock onComplete={complete} />}</BlockPreview>;
}

function LossGuide2CrossEntropyPreview() {
  return <BlockPreview title="多分类交叉熵">{({ complete }) => <CategoricalCrossEntropyBlock onComplete={complete} />}</BlockPreview>;
}

function LossGuide2PairingPreview() {
  return <BlockPreview title="输出头配对">{({ complete }) => <OutputHeadPairingBlock onComplete={complete} />}</BlockPreview>;
}

function LossGuide2ResourcesPreview() {
  return <BlockPreview title="输出层与分类损失课程结尾">{() => <LossGuide2ResourcesBlock />}</BlockPreview>;
}

function DigitalImageObservationPreview() {
  return <BlockPreview title="屏幕像素观察">{({ complete }) => <ObservationBlock onComplete={complete} />}</BlockPreview>;
}

function DigitalImageRgbPreview() {
  return <BlockPreview title="RGB 调色">{({ complete }) => <RgbColorLabBlock onComplete={complete} />}</BlockPreview>;
}

function DigitalImageMatrixPreview() {
  return <BlockPreview title="图片通道与矩阵">{({ complete }) => <ImageMatrixLabBlock onComplete={complete} />}</BlockPreview>;
}

function DigitalImageResourcesPreview() {
  return <BlockPreview title="数字图像课程结尾">{() => <DigitalImageResourcesBlock />}</BlockPreview>;
}

function ManualFeatureCountPreview() {
  return <BlockPreview title="九宫格计数与向量顺序">{({ complete }) => <ManualCountBlock onComplete={complete} />}</BlockPreview>;
}

function ManualFeatureDistributionPreview() {
  return <BlockPreview title="九宫格分布热力图">{({ complete }) => <ManualDistributionBlock onComplete={complete} />}</BlockPreview>;
}

function ManualFeatureMlpPreview() {
  return <BlockPreview title="双层 MLP 训练">{({ complete }) => <ManualMlpTrainingBlock onComplete={complete} />}</BlockPreview>;
}

function ManualFeatureResourcesPreview() {
  return <BlockPreview title="人工特征课程结尾">{() => <ManualFeatureResourcesBlock />}</BlockPreview>;
}

function ConvolutionGomokuPreview() {
  return <BlockPreview title="五子棋与胜负判断">{({ complete }) => <GomokuGameBlock onComplete={complete} />}</BlockPreview>;
}

function ConvolutionOperatorPreview() {
  return <BlockPreview title="二值棋盘与 5×5 算子">{({ complete }) => <KernelOperatorBlock onComplete={complete} />}</BlockPreview>;
}

function ConvolutionMnistPreview() {
  return <BlockPreview title="MNIST 卷积扫描">{({ complete }) => <MnistConvolutionBlock onComplete={complete} />}</BlockPreview>;
}

function ConvolutionResourcesPreview() {
  return <BlockPreview title="卷积核课程结尾">{() => <ConvolutionResourcesBlock />}</BlockPreview>;
}

function LeNetFixedKernelPreview() {
  return <BlockPreview title="固定核分类器">{({ complete }) => <FixedKernelClassifierBlock onComplete={complete} onSessionChange={() => undefined} />}</BlockPreview>;
}

function LeNetSequencePreview() {
  return <BlockPreview title="序列数字识别">{({ complete }) => <LenetPreviewClassifierGate>{(classifierSession) => <SequenceRecognitionBlock classifierSession={classifierSession} onComplete={complete} />}</LenetPreviewClassifierGate>}</BlockPreview>;
}

function LeNetDetectionPreview() {
  return <BlockPreview title="寻找老六">{({ complete }) => <LenetPreviewClassifierGate>{(classifierSession) => <DetectionSearchBlock classifierSession={classifierSession} onComplete={complete} />}</LenetPreviewClassifierGate>}</BlockPreview>;
}

function LeNetResourcesPreview() {
  return <BlockPreview title="LeNet-5 课程结尾">{() => <LeNetResourcesBlock />}</BlockPreview>;
}
function FaceFixedKernelPreview() {
  return <BlockPreview title="固定卷积核人脸分类">{({ complete }) => <FaceRuntimeBoundary><FixedKernelFaceBlock onComplete={complete} /></FaceRuntimeBoundary>}</BlockPreview>;
}

function FaceLearnableCnnPreview() {
  return <BlockPreview title="可学习 CNN">{({ complete }) => <FaceRuntimeBoundary><FaceLearnableCnnBlock onComplete={complete} /></FaceRuntimeBoundary>}</BlockPreview>;
}

function FaceCnnUnderstandingPreview() {
  return <BlockPreview title="CNN 理解练习">{({ complete }) => <FaceRuntimeBoundary><FaceCnnQuizBlock onComplete={complete} /></FaceRuntimeBoundary>}</BlockPreview>;
}

function FaceDisguiseGamePreview() {
  return <BlockPreview title="雨花弄：变脸">{({ complete }) => <FaceRuntimeBoundary><FaceDisguiseGameBlock onComplete={complete} /></FaceRuntimeBoundary>}</BlockPreview>;
}

function FaceResourcesPreview() {
  return <BlockPreview title="人脸识别课程结尾">{() => <FaceResourcesBlock />}</BlockPreview>;
}


export const appRoutes: AppRoute[] = [
  { path: '/', element: <HomePage /> },
  { path: '/shared/ui-kit', element: <UiKitPage /> },
  { path: '/web-ppt/neuron', element: <NeuronPptSlidePage /> },
  { path: '/web_ppt/slide.html', element: <NeuronPptSlidePage /> },
  ...migratedModules.map(({ path, element }) => ({ path, element })),
  { path: '/dev/blocks/neuron-guide-react/nematode-response', element: <NeuronNematodeResponsePreview /> },
  { path: '/dev/blocks/neuron-guide-react/biological-structure', element: <NeuronBiologicalStructurePreview /> },
  { path: '/dev/blocks/neuron-guide-react/decision-bridge', element: <NeuronDecisionBridgePreview /> },
  { path: '/dev/blocks/neuron-guide-react/signal-discovery', element: <NeuronSignalDiscoveryPreview /> },
  { path: '/dev/blocks/neuron-guide-react/weighted-sum', element: <NeuronWeightedSumPreview /> },
  { path: '/dev/blocks/neuron-guide-react/extra-inputs', element: <NeuronExtraInputsPreview /> },
  { path: '/dev/blocks/neuron-guide-react/weighted-contribution', element: <NeuronWeightedContributionPreview /> },
  { path: '/dev/blocks/neuron-guide-react/bias-theory', element: <NeuronBiasTheoryPreview /> },
  { path: '/dev/blocks/base-math/linear-recognition', element: <BaseMathLinearRecognitionPreview /> },
  { path: '/dev/blocks/neuron-guide-react/ending', element: <NeuronEndingPreview /> },
  { path: '/dev/blocks/adaptive-learning-rate/why-optimizer', element: <WhyOptimizerPreview /> },
  { path: '/dev/blocks/adaptive-learning-rate/sgd', element: <SgdPreview /> },
  { path: '/dev/blocks/adaptive-learning-rate/momentum', element: <MomentumPreview /> },
  { path: '/dev/blocks/adaptive-learning-rate/adagrad', element: <AdaGradPreview /> },
  { path: '/dev/blocks/adaptive-learning-rate/adam', element: <AdamPreview /> },
  { path: '/dev/blocks/adaptive-learning-rate/ending', element: <AdaptiveLearningRateEndingPreview /> },
  { path: '/dev/blocks/fitting/diagnosis', element: <FittingDiagnosisPreview /> },
  { path: '/dev/blocks/fitting/weight-regularization', element: <WeightRegularizationPreview /> },
  { path: '/dev/blocks/fitting/dropout', element: <DropoutPreview /> },
  { path: '/dev/blocks/fitting/ending', element: <FittingEndingPreview /> },
  { path: '/dev/blocks/misc/batch-step-epoch', element: <BatchStepEpochPreview /> },
  { path: '/dev/blocks/hyperparameter/overview', element: <DatasetHyperparametersPreview /> },
  { path: '/dev/blocks/hyperparameter/grid-search', element: <HyperparameterGridSearchPreview /> },
  { path: '/dev/blocks/hyperparameter/random-search', element: <HyperparameterRandomSearchPreview /> },
  { path: '/dev/blocks/hyperparameter/ending', element: <HyperparameterEndingPreview /> },
  { path: '/dev/blocks/dataset-split/process', element: <DatasetProcessPreview /> },
  { path: '/dev/blocks/dataset-split/ending', element: <DatasetEndingPreview /> },
  { path: '/dev/blocks/loss-guide-react/number-line', element: <NumberLinePreview /> },
  { path: '/dev/blocks/loss-guide-react/calculation', element: <CalculationPreview /> },
  { path: '/dev/blocks/loss-guide-react/gradient', element: <GradientPreview /> },
  { path: '/dev/blocks/loss-guide-react/cross-entropy', element: <CrossEntropyPreview /> },
  { path: '/dev/blocks/loss-guide-react/advanced', element: <AdvancedPreview /> },
  { path: '/dev/blocks/loss-guide-react/resources', element: <ResourcesPreview /> },
  { path: '/dev/blocks/gradient-descent-module-react/manual-tuning', element: <GradientManualPreview /> },
  { path: '/dev/blocks/gradient-descent-module-react/auto-update', element: <GradientAutoUpdatePreview /> },
  { path: '/dev/blocks/gradient-descent-module-react/full-network', element: <GradientFullNetworkPreview /> },
  { path: '/dev/blocks/gradient-descent-module-react/advanced', element: <GradientAdvancedPreview /> },
  { path: '/dev/blocks/gradient-descent-module-react/resources', element: <GradientResourcesPreview /> },
  { path: '/dev/blocks/activation-func-module-react/linear-2d', element: <ActivationLinear2DPreview /> },
  { path: '/dev/blocks/activation-func-module-react/linear-3d', element: <ActivationLinear3DPreview /> },
  { path: '/dev/blocks/activation-func-module-react/linear-shallow', element: <ActivationShallowPreview /> },
  { path: '/dev/blocks/activation-func-module-react/linear-deep', element: <ActivationDeepPreview /> },
  { path: '/dev/blocks/activation-func-module-react/linear-conclusion', element: <ActivationLinearConclusionPreview /> },
  { path: '/dev/blocks/activation-func-module-react/relu-intro', element: <ActivationReluIntroPreview /> },
  { path: '/dev/blocks/activation-func-module-react/relu-network', element: <ActivationReluNetworkPreview /> },
  { path: '/dev/blocks/activation-func-module-react/approximation', element: <ActivationApproximationPreview /> },
  { path: '/dev/blocks/activation-func-module-react/activation-catalog', element: <ActivationCatalogPreview /> },
  { path: '/dev/blocks/mlp-playground-react/scenario-intro', element: <MlpScenarioPreview /> },
  { path: '/dev/blocks/mlp-playground-react/boundary-challenge', element: <MlpBoundaryPreview /> },
  { path: '/dev/blocks/mlp-playground-react/mlp-transition', element: <MlpTransitionPreview /> },
  { path: '/dev/blocks/mlp-playground-react/mlp-1d', element: <MlpOneDimensionalPreview /> },
  { path: '/dev/blocks/mlp-playground-react/mlp-2d', element: <MlpTwoDimensionalPreview /> },
  { path: '/dev/blocks/mlp-playground-react/mlp-3d', element: <MlpThreeDimensionalPreview /> },
  { path: '/dev/blocks/mlp-playground-react/resources', element: <MlpResourcesPreview /> },
  { path: '/dev/blocks/loss-guide-2-react/sigmoid', element: <LossGuide2SigmoidPreview /> },
  { path: '/dev/blocks/loss-guide-2-react/bce', element: <LossGuide2BcePreview /> },
  { path: '/dev/blocks/loss-guide-2-react/softmax', element: <LossGuide2SoftmaxPreview /> },
  { path: '/dev/blocks/loss-guide-2-react/cross-entropy', element: <LossGuide2CrossEntropyPreview /> },
  { path: '/dev/blocks/loss-guide-2-react/output-pairing', element: <LossGuide2PairingPreview /> },
  { path: '/dev/blocks/loss-guide-2-react/resources', element: <LossGuide2ResourcesPreview /> },
  { path: '/dev/blocks/digital-image-module-react/observation', element: <DigitalImageObservationPreview /> },
  { path: '/dev/blocks/digital-image-module-react/rgb', element: <DigitalImageRgbPreview /> },
  { path: '/dev/blocks/digital-image-module-react/image-matrix', element: <DigitalImageMatrixPreview /> },
  { path: '/dev/blocks/digital-image-module-react/resources', element: <DigitalImageResourcesPreview /> },
  { path: '/dev/blocks/manual-feature-classification-react/count', element: <ManualFeatureCountPreview /> },
  { path: '/dev/blocks/manual-feature-classification-react/distribution', element: <ManualFeatureDistributionPreview /> },
  { path: '/dev/blocks/manual-feature-classification-react/mlp', element: <ManualFeatureMlpPreview /> },
  { path: '/dev/blocks/manual-feature-classification-react/resources', element: <ManualFeatureResourcesPreview /> },
  { path: '/dev/blocks/convolution-kernel-intro-react/gomoku', element: <ConvolutionGomokuPreview /> },
  { path: '/dev/blocks/convolution-kernel-intro-react/operator', element: <ConvolutionOperatorPreview /> },
  { path: '/dev/blocks/convolution-kernel-intro-react/mnist', element: <ConvolutionMnistPreview /> },
  { path: '/dev/blocks/convolution-kernel-intro-react/resources', element: <ConvolutionResourcesPreview /> },
  { path: '/dev/blocks/lenet5-cnn-lab-react/fixed-kernel', element: <LeNetFixedKernelPreview /> },
  { path: '/dev/blocks/lenet5-cnn-lab-react/sequence', element: <LeNetSequencePreview /> },
  { path: '/dev/blocks/lenet5-cnn-lab-react/detection', element: <LeNetDetectionPreview /> },
  { path: '/dev/blocks/lenet5-cnn-lab-react/resources', element: <LeNetResourcesPreview /> },
  { path: '/dev/blocks/face-recog-lab-react/fixed-kernel', element: <FaceFixedKernelPreview /> },
  { path: '/dev/blocks/face-recog-lab-react/learnable-cnn', element: <FaceLearnableCnnPreview /> },
  { path: '/dev/blocks/face-recog-lab-react/cnn-understanding', element: <FaceCnnUnderstandingPreview /> },
  { path: '/dev/blocks/face-recog-lab-react/disguise-game', element: <FaceDisguiseGamePreview /> },
  { path: '/dev/blocks/face-recog-lab-react/resources', element: <FaceResourcesPreview /> },
];
