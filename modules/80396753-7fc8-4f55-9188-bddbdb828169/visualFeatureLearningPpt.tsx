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

const opening = outlines.pages.find((page) => page.id === '3c40737f-2756-4473-aa5e-bd0b4241ea48')!;
const differences = outlines.pages.find((page) => page.id === '85044d7f-f642-4dc7-8c4c-9505536aab0b')!;
const rawPixelVariation = outlines.pages.find((page) => page.id === '1e8254cb-83fa-43ac-9e1c-842c19a78ede')!;
const featureExtraction = outlines.pages.find((page) => page.id === '38a93659-4c2c-4595-9e5f-4388d16454da')!;
const simpleFeatureLimits = outlines.pages.find((page) => page.id === '30793383-bd8c-4681-bb4d-f2a63b1b7c4f')!;
const nineGridFeature = outlines.pages.find((page) => page.id === 'e935cba6-b43f-4798-867e-34e918726f1b')!;
const manualFeatureClassifier = outlines.pages.find((page) => page.id === '0504e836-cdab-4f08-a2c6-9a4aa9483389')!;
const nineGridInformationLoss = outlines.pages.find((page) => page.id === 'b3118c6a-f2fb-409a-832c-7371fe287593')!;
const fixedDigit = outlines.pages.find((page) => page.id === '6921af12-7e6f-4e74-b2fb-9849311035b0')!;
const twoStageRecognition = outlines.pages.find((page) => page.id === '274851e9-a3c8-4476-a153-03251fd66133')!;
const convolutionUnit = outlines.pages.find((page) => page.id === '517a9aed-e74a-4395-bede-bc0a9c14cfc4')!;
const hierarchicalFeatures = outlines.pages.find((page) => page.id === '3321d0b9-3f29-476b-b98a-8c79766e3b38')!;
const featureMapsToClassifier = outlines.pages.find((page) => page.id === '28200f4a-53de-4495-b839-db8a5aec1f67')!;
const learnableKernel = outlines.pages.find((page) => page.id === 'f98f7a19-28a3-4e79-b4f9-ebad75526da0')!;
const pooling = outlines.pages.find((page) => page.id === 'db33937a-fd67-4d1d-8aaf-2a8b79eba7a1')!;
const optimizeKernel = outlines.pages.find((page) => page.id === '4f2078f2-d97c-41bb-887e-bbfea2109637')!;
const sharedKernel = outlines.pages.find((page) => page.id === 'cf80f900-16a5-4c80-a516-51a0f91c8143')!;

const featureStatistics = outlines.pages.find((page) => page.id === '78fe6856-ecfe-4bc8-bac0-128e064fae79')!;
const globalAveragePooling = outlines.pages.find((page) => page.id === 'd449aaf3-07ac-4ebb-a007-34bf349b86d0')!;
const networkTraining = outlines.pages.find((page) => page.id === 'd945cb08-e673-4ffd-90df-2dff514f527c')!;
const trainingFeatureTsne = outlines.pages.find((page) => page.id === '5e806147-cf57-4b9e-863d-d62b5a80a75c')!;
const openIdentity = outlines.pages.find((page) => page.id === '3c8ab017-17b5-41ac-8df6-b6261cd52db3')!;
const tripletLoss = outlines.pages.find((page) => page.id === 'cd6bedc0-8f23-4293-9d41-b86d96d9f42a')!;
const gradCam = outlines.pages.find((page) => page.id === 'dc55ca82-a0fc-421e-ad6b-333eb297b7fc')!;
const disguiseVerification = outlines.pages.find((page) => page.id === 'fe196098-d8f8-428b-92d6-357107fda9cd')!;

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
