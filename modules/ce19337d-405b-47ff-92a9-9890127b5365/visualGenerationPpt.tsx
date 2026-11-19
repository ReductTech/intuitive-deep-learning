import outline from './outlines.json';
import { SceneDeck, type DeckDefinition, type SceneDefinition } from "@shuku/course-style/react/presentation";
import { visualGenerationCourse } from './course';

const scenes: SceneDefinition[] = visualGenerationCourse
  .filter((item) => item.showInPpt !== false)
  .map(({ id, title, section, component }) => ({ id, title, section, render: component }));

export const deck: DeckDefinition = {
  id: outline.id,
  title: '视觉生成：从噪声到图像',
  subtitle: `GAN 与 Diffusion · ${scenes.length} 页`,
  scenes,
};

const catalog: [DeckDefinition, ...DeckDefinition[]] = [deck];

export function VisualGenerationPpt() {
  return <SceneDeck catalog={catalog} moduleId={outline.id} assetId={outline.moduleIdentity.id} progressKey="lesson-flow:visual-generation-guide-v4" />;
}
