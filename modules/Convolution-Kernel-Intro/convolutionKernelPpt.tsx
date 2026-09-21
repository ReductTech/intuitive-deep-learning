import { SceneDeck, type DeckDefinition, type SceneDefinition } from '../shared/react/presentation';
import { convolutionCourse } from './course';
import { GomokuLessonProvider } from './LessonContext';

const scenes: SceneDefinition[] = convolutionCourse
  .filter((item) => item.showInPpt !== false)
  .map(({ id, title, section, component }) => ({
    id,
    title,
    section,
    render: (context) => <GomokuLessonProvider>{component(context)}</GomokuLessonProvider>,
  }));

export const deck: DeckDefinition = {
  id: 'convolution-kernel-intro',
  title: '卷积核入门',
  subtitle: `从五子棋棋形到图像卷积 · ${scenes.length} 页`,
  scenes,
};

const catalog: [DeckDefinition, ...DeckDefinition[]] = [deck];

export function ConvolutionKernelPpt() {
  return (
    <SceneDeck
      catalog={catalog}
      moduleId="convolution-kernel-intro"
      progressKey="lesson-flow:convolution-kernel-intro-guide-v1"
    />
  );
}
