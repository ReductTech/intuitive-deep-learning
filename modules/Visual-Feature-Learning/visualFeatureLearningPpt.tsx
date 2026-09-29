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
import { FeatureVectorPage } from './pages/FeatureVectorPage/FeatureVectorPage';
import { ManualFeatureClassifierPage } from './pages/ManualFeatureClassifierPage/ManualFeatureClassifierPage';
import { NineGridInformationLossPage } from './pages/NineGridInformationLossPage/NineGridInformationLossPage';
import { FixedDigitPage } from './pages/FixedDigitPage/FixedDigitPage';
import { TwoStageRecognitionPage } from './pages/TwoStageRecognitionPage/TwoStageRecognitionPage';
import { SingleToSequencePage } from './pages/SingleToSequencePage/SingleToSequencePage';

const opening = outlines.pages.find((page) => page.id === 'digit-recognition-opening')!;
const differences = outlines.pages.find((page) => page.id === 'digit-differences')!;
const rawPixelVariation = outlines.pages.find((page) => page.id === 'raw-pixel-variation')!;
const featureExtraction = outlines.pages.find((page) => page.id === 'feature-extraction')!;
const simpleFeatureLimits = outlines.pages.find((page) => page.id === 'manual-feature-capacity')!;
const nineGridFeature = outlines.pages.find((page) => page.id === 'manual-nine-grid')!;
const featureVector = outlines.pages.find((page) => page.id === 'manual-feature-vector')!;
const manualFeatureClassifier = outlines.pages.find((page) => page.id === 'manual-feature-classifier')!;
const nineGridInformationLoss = outlines.pages.find((page) => page.id === 'manual-feature-information-loss')!;
const fixedDigit = outlines.pages.find((page) => page.id === 'fixed-digit-classification')!;
const twoStageRecognition = outlines.pages.find((page) => page.id === 'two-stage-recognition')!;
const singleToSequence = outlines.pages.find((page) => page.id === 'single-to-sequence')!;

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
    id: nineGridFeature.id,
    title: nineGridFeature.title,
    section: '人工特征',
    render: () => <NineGridFeaturePage />,
  }, {
    id: featureVector.id,
    title: featureVector.title,
    section: '人工特征',
    render: () => <FeatureVectorPage />,
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
    section: '两阶段结构',
    render: () => <TwoStageRecognitionPage />,
  }, {
    id: singleToSequence.id,
    title: singleToSequence.title,
    section: '数字序列',
    render: () => <SingleToSequencePage />,
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
