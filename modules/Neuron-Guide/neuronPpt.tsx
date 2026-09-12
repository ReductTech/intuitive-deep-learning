import { SceneDeck, type DeckDefinition, type SceneDefinition } from '../shared/react/presentation';
import { NeuronLessonProvider } from './model/NeuronLessonContext';
import { neuronCourse } from './course';
import { notesForScene } from './speakerNotes';

const scenes: SceneDefinition[] = neuronCourse
  .filter((item) => item.showInPpt !== false)
  .map(({ id, title, section, component }) => ({
    id,
    title,
    section,
    render: (context) => <NeuronLessonProvider>{component(context)}</NeuronLessonProvider>,
  }));

const catalog: [DeckDefinition, ...DeckDefinition[]] = [
  { id: 'neuron-guide', title: '认识人工神经元', subtitle: `神经网络基础 · ${scenes.length} 页`, scenes },
];

export function NeuronPpt() {
  return <SceneDeck catalog={catalog} moduleId="neuron-guide" progressKey="lesson-flow:neuron-guide-expanded-v6" getNotes={notesForScene} />;
}
