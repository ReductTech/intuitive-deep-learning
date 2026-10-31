import { moduleIdentity } from './outlines.json';
import { SceneDeck, type DeckDefinition, type SceneDefinition } from '../shared/react/presentation';
import { naiveRnnCourse } from './course';
import { notesForScene } from './speakerNotes';

const scenes: SceneDefinition[] = naiveRnnCourse.map(({ id, title, section, component }) => ({
  id,
  title,
  section,
  render: component,
}));

export const deck: DeckDefinition = {
  id: 'naive-rnn',
  title: '朴素 RNN',
  subtitle: `循环神经网络基础 · ${scenes.length} 页`,
  scenes,
};

export const getPptNotes = notesForScene;

const catalog: [DeckDefinition, ...DeckDefinition[]] = [deck];

export function NaiveRnnPpt() {
  return <SceneDeck catalog={catalog} moduleId="naive-rnn" assetId={moduleIdentity.id} progressKey="lesson-flow:naive-rnn-v1" getNotes={notesForScene} />;
}
