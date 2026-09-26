import { SceneDeck, type DeckDefinition, type SceneDefinition } from '../shared/react/presentation';
import { LessonProvider } from './LessonContext';
import { lessonContextOptions, neuronCourse } from './course';
import { notesForScene } from './speakerNotes';

const scenes: SceneDefinition[] = neuronCourse
  .filter((item) => item.showInPpt !== false)
  .map(({ id, title, section, component }) => ({
    id,
    title,
    section,
    render: (context) => <LessonProvider {...lessonContextOptions}>{component(context)}</LessonProvider>,
  }));

export const deck: DeckDefinition = { id: 'neuron-guide-tailwind', title: '认识人工神经元 · Tailwind 试验版', subtitle: `神经网络基础 · ${scenes.length} 页 · 全课程 Tailwind 试验`, scenes };
export const getPptNotes = notesForScene;

const catalog: [DeckDefinition, ...DeckDefinition[]] = [deck];

export function NeuronPpt() {
  return <SceneDeck catalog={catalog} moduleId="neuron-guide-tailwind" progressKey="lesson-flow:neuron-guide-tailwind-v1" getNotes={notesForScene} />;
}

