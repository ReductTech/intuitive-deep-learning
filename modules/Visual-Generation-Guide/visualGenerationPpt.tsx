import { SceneDeck, type DeckDefinition, type SceneDefinition } from '../shared/react/presentation';
import { visualGenerationCourse } from './course';

const scenes: SceneDefinition[] = visualGenerationCourse
  .filter((item) => item.showInPpt !== false)
  .map(({ id, title, section, component }) => ({ id, title, section, render: component }));

export const deck: DeckDefinition = {
  id: 'visual-generation-guide',
  title: '视觉生成：从噪声到图像',
  subtitle: `GAN 与 Diffusion · ${scenes.length} 页`,
  scenes,
};

const catalog: [DeckDefinition, ...DeckDefinition[]] = [deck];

export function VisualGenerationPpt() {
  return <SceneDeck catalog={catalog} moduleId="visual-generation-guide" assetId="visual-generation-guide" progressKey="lesson-flow:visual-generation-guide-v4" />;
}
