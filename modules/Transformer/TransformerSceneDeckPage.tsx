import { moduleIdentity } from './outlines.json';
import { SceneDeck, type DeckDefinition } from '../shared/react/presentation';
import { transformerLessonSteps, transformerStyleSlides } from './course';
import { sectionNames, slideTitles } from './data/slideMetadata';
import './TransformerSceneDeckPage.css';

export const deck: DeckDefinition = {
  id: 'transformer',
  title: 'Transformer 入门',
  subtitle: '从机器翻译理解注意力机制的应用',
  scenes: transformerLessonSteps.map((step, index) => ({
    id: String(index + 1),
    title: slideTitles[index],
    section: sectionNames[index],
    render: (context) => <div className="tr-ppt-content" data-slide={transformerStyleSlides[index]} data-page={index + 1} key={step.id}>
      {step.render(context)}
    </div>,
  })),
};

export function TransformerSceneDeckPage() {
  return <SceneDeck
    catalog={[deck]}
    moduleId="transformer"
    assetId={moduleIdentity.id}
    progressKey="transformer-ppt-completed"
  />;
}
