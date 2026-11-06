import { FeatureStatisticsPage } from './pages/FeatureStatisticsPage/FeatureStatisticsPage';
import { GradCamPage } from './pages/GradCamPage/GradCamPage';
import { TripletLossPage } from './pages/TripletLossPage/TripletLossPage';
import { OpenIdentityPage } from './pages/OpenIdentityPage/OpenIdentityPage';
import { DisguiseVerificationPage } from './pages/DisguiseVerificationPage/DisguiseVerificationPage';
import { TrainingFeatureTsnePage } from './pages/TrainingFeatureTsnePage/TrainingFeatureTsnePage';
import { NetworkTrainingPage } from './pages/NetworkTrainingPage/NetworkTrainingPage';
import { GlobalAveragePoolingPage } from './pages/GlobalAveragePoolingPage/GlobalAveragePoolingPage';
import { SceneDeck, type DeckDefinition, type SpeakerNote } from '../shared/react/presentation';
import '../shared/react/styles.css';
import '../shared/react/ui-kit.css';
import '../shared/react/presentation.css';
import './tailwind.css';
import outlines from './outlines.json';
import { DigitRecognitionOpeningPage } from './pages/DigitRecognitionOpeningPage/DigitRecognitionOpeningPage';
import { DigitDifferencesPage } from './pages/DigitDifferencesPage/DigitDifferencesPage';
import { RawPixelVariationPage } from './pages/RawPixelVariationPage/RawPixelVariationPage';
import { FeatureExtractionPage } from './pages/FeatureExtractionPage/FeatureExtractionPage';
import { SimpleFeatureLimitsPage } from './pages/SimpleFeatureLimitsPage/SimpleFeatureLimitsPage';
import { NineGridFeaturePage } from './pages/NineGridFeaturePage/NineGridFeaturePage';
import { ManualFeatureClassifierPage } from './pages/ManualFeatureClassifierPage/ManualFeatureClassifierPage';
import { NineGridInformationLossPage } from './pages/NineGridInformationLossPage/NineGridInformationLossPage';
import { FixedDigitPage } from './pages/FixedDigitPage/FixedDigitPage';
import { TwoStageRecognitionPage } from './pages/TwoStageRecognitionPage/TwoStageRecognitionPage';
import { ConvolutionUnitPage } from './pages/ConvolutionUnitPage/ConvolutionUnitPage';
import { HierarchicalFeaturesPage } from './pages/HierarchicalFeaturesPage/HierarchicalFeaturesPage';
import { FeatureMapsToClassifierPage } from './pages/FeatureMapsToClassifierPage/FeatureMapsToClassifierPage';
import { LearnableKernelPage } from './pages/LearnableKernelPage/LearnableKernelPage';
import { PoolingPage } from './pages/PoolingPage/PoolingPage';
import { ConvolutionBackpropPage } from './pages/ConvolutionBackpropPage/ConvolutionBackpropPage';
import { ConvolutionSharedBackpropPage } from './pages/ConvolutionSharedBackpropPage/ConvolutionSharedBackpropPage';

const opening = outlines.pages.find((page) => page.id === 'digit-recognition-opening')!;
const differences = outlines.pages.find((page) => page.id === 'digit-differences')!;
const rawPixelVariation = outlines.pages.find((page) => page.id === 'raw-pixel-variation')!;
const featureExtraction = outlines.pages.find((page) => page.id === 'feature-extraction')!;
const simpleFeatureLimits = outlines.pages.find((page) => page.id === 'manual-feature-capacity')!;
const nineGridFeature = outlines.pages.find((page) => page.id === 'manual-nine-grid')!;
const manualFeatureClassifier = outlines.pages.find((page) => page.id === 'manual-feature-classifier')!;
const nineGridInformationLoss = outlines.pages.find((page) => page.id === 'manual-feature-information-loss')!;
const fixedDigit = outlines.pages.find((page) => page.id === 'fixed-digit-classification')!;
const twoStageRecognition = outlines.pages.find((page) => page.id === 'two-stage-recognition')!;
const convolutionUnit = outlines.pages.find((page) => page.id === 'convolution-network-unit')!;
const hierarchicalFeatures = outlines.pages.find((page) => page.id === 'hierarchical-features')!;
const featureMapsToClassifier = outlines.pages.find((page) => page.id === 'feature-maps-to-classifier')!;
const learnableKernel = outlines.pages.find((page) => page.id === 'learnable-kernel')!;
const pooling = outlines.pages.find((page) => page.id === 'pooling')!;
const optimizeKernel = outlines.pages.find((page) => page.id === 'optimize-kernel')!;
const sharedKernel = outlines.pages.find((page) => page.id === 'optimize-kernel-shared')!;

const featureStatistics = outlines.pages.find((page) => page.id === 'simple-feature-statistics')!;
const globalAveragePooling = outlines.pages.find((page) => page.id === 'global-average-pooling')!;
const networkTraining = outlines.pages.find((page) => page.id === 'assemble-train-digit-network')!;
const trainingFeatureTsne = outlines.pages.find((page) => page.id === 'training-feature-tsne')!;
const openIdentity = outlines.pages.find((page) => page.id === 'digits-to-faces')!;
const tripletLoss = outlines.pages.find((page) => page.id === 'triplet-loss')!;
const gradCam = outlines.pages.find((page) => page.id === 'training-objective-gradcam')!;
const disguiseVerification = outlines.pages.find((page) => page.id === 'disguise-verification')!;

export const deck: DeckDefinition = {
  id: 'visual-feature-learning',
  title: '视觉特征学习',
  subtitle: '从固定特征到可学习特征',
  scenes: [{
    id: opening.id,
    title: opening.title,
    section: '数字识别',
    render: () => <DigitRecognitionOpeningPage />,
  }, {
    id: differences.id,
    title: differences.title,
    section: '观察数字',
    render: () => <DigitDifferencesPage />,
  }, {
    id: rawPixelVariation.id,
    title: rawPixelVariation.title,
    section: '像素比较',
    render: () => <RawPixelVariationPage />,
  }, {
    id: featureExtraction.id,
    title: featureExtraction.title,
    section: '认识特征',
    render: () => <FeatureExtractionPage />,
  }, {
    id: simpleFeatureLimits.id,
    title: simpleFeatureLimits.title,
    section: '特征的边界',
    render: () => <SimpleFeatureLimitsPage />,
  }, {
    id: featureStatistics.id,
    title: featureStatistics.title,
    section: '特征的边界',
    render: () => <FeatureStatisticsPage />,
  }, {
    id: nineGridFeature.id,
    title: nineGridFeature.title,
    section: '人工特征',
    render: () => <NineGridFeaturePage />,
  }, {
    id: manualFeatureClassifier.id,
    title: manualFeatureClassifier.title,
    section: '人工特征',
    render: () => <ManualFeatureClassifierPage />,
  }, {
    id: nineGridInformationLoss.id,
    title: nineGridInformationLoss.title,
    section: '人工特征',
    render: () => <NineGridInformationLossPage />,
  }, {
    id: fixedDigit.id,
    title: fixedDigit.title,
    section: '固定特征',
    render: () => <FixedDigitPage />,
  }, {
    id: twoStageRecognition.id,
    title: twoStageRecognition.title,
    section: '人工特征',
    render: () => <TwoStageRecognitionPage />,
  }, {
    id: learnableKernel.id,
    title: learnableKernel.title,
    section: '可学习特征',
    render: () => <LearnableKernelPage />,

  }, {
    id: optimizeKernel.id,
    title: optimizeKernel.title,
    section: '卷积网络',
    render: () => <ConvolutionBackpropPage />,
  }, {
    id: sharedKernel.id,
    title: sharedKernel.title,
    section: '卷积网络',
    render: () => <ConvolutionSharedBackpropPage />,
  }, {
    id: pooling.id,
    title: pooling.title,
    section: '卷积网络',
    render: () => <PoolingPage />,
  }, {
    id: convolutionUnit.id,
    title: convolutionUnit.title,
    section: '卷积网络',
    render: () => <ConvolutionUnitPage />,
  }, {
    id: hierarchicalFeatures.id,
    title: hierarchicalFeatures.title,
    section: '卷积网络',
    render: () => <HierarchicalFeaturesPage />,
  }, {
    id: featureMapsToClassifier.id,
    title: featureMapsToClassifier.title,
    section: '卷积网络',
    render: () => <FeatureMapsToClassifierPage />,
  }, {
    id: globalAveragePooling.id,
    title: globalAveragePooling.title,
    section: "卷积网络",
    render: () => <GlobalAveragePoolingPage />,
  }, {
    id: networkTraining.id,
    title: networkTraining.title,
    section: "卷积网络",
    render: () => <NetworkTrainingPage />,
  }, {
    id: trainingFeatureTsne.id,
    title: trainingFeatureTsne.title,
    section: "卷积网络",
    render: () => <TrainingFeatureTsnePage />,
  }, {
    id: openIdentity.id,
    title: openIdentity.title,
    section: "人脸识别",
    render: () => <OpenIdentityPage />,
  }, {
    id: tripletLoss.id,
    title: tripletLoss.title,
    section: "人脸识别",
    render: () => <TripletLossPage />,
  }, {
    id: gradCam.id,
    title: gradCam.title,
    section: "人脸识别",
    render: () => <GradCamPage />,
  }, {
    id: disguiseVerification.id,
    title: disguiseVerification.title,
    section: "人脸识别",
    render: ({ complete, reset }) => <DisguiseVerificationPage onComplete={complete} onReset={reset} />,
  }],
};

export function getPptNotes(sceneId: string): SpeakerNote[] {
  const page = outlines.pages.find((item) => item.id === sceneId);
  return page?.snippet ? [{ text: page.snippet, selectors: sceneId === opening.id ? ['.vfl-check-opening'] : sceneId === differences.id ? ['.vfl-diff'] : sceneId === rawPixelVariation.id ? ['.vfl-pixel'] : sceneId === featureExtraction.id ? ['.vfl-feature'] : sceneId === simpleFeatureLimits.id ? ['.vfl-simple-limit'] : ['.edu-content-block'] }] : [];
}

export function VisualFeatureLearningPpt() {
  return <SceneDeck
    catalog={[deck]}
    moduleId="visual-feature-learning"
    assetId="80396753-7fc8-4f55-9188-bddbdb828169"
    progressKey="lesson-flow:visual-feature-learning-v1"
    getNotes={getPptNotes}
  />;
}
