import { SceneDeck, type DeckDefinition, type SpeakerNote } from '../shared/react/presentation';
import '../shared/react/styles.css';
import '../shared/react/ui-kit.css';
import '../shared/react/presentation.css';
import outlines from './outlines.json';
import { DigitRecognitionOpeningPage } from './pages/DigitRecognitionOpeningPage/DigitRecognitionOpeningPage';
import { FixedDigitPage } from './pages/FixedDigitPage/FixedDigitPage';

const [opening, fixedDigit] = outlines.pages;

export const deck: DeckDefinition = {
  id: 'visual-feature-learning',
  title: '视觉特征学习',
  subtitle: '从固定特征到可学习特征',
  scenes: [{
    id: opening.id,
    title: opening.title,
    section: '人工特征',
    render: () => <DigitRecognitionOpeningPage />,
  }, {
    id: fixedDigit.id,
    title: fixedDigit.title,
    section: '固定特征',
    render: () => <FixedDigitPage />,
  }],
};

export function getPptNotes(sceneId: string): SpeakerNote[] {
  const page = outlines.pages.find((item) => item.id === sceneId);
  return page?.snippet ? [{ text: page.snippet, selectors: ['.edu-content-block'] }] : [];
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
