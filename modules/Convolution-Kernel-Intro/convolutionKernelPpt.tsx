import { SceneDeck, type DeckDefinition, type SceneDefinition } from '../shared/react/presentation';
import { KernelLessonProvider } from './LessonContext';
import { kernelCourse } from './course';

const scenes: SceneDefinition[] = kernelCourse
  .filter((item) => item.showInPpt !== false)
  .map(({ id, title, section, component }) => ({
    id,
    title,
    section,
    render: (context) => component(context),
  }));

export const deck: DeckDefinition = {
  id: 'convolution-kernel-intro',
  title: '卷积核入门',
  subtitle: '从五子棋到卷积 · ' + scenes.length + ' 页',
  scenes,
};

const catalog: [DeckDefinition, ...DeckDefinition[]] = [deck];

export function ConvolutionKernelPpt() {
  return (
    <KernelLessonProvider>
      <SceneDeck
        catalog={catalog}
        moduleId="convolution-kernel-intro"
        progressKey="lesson-flow:convolution-kernel-intro-v1"
      />
    </KernelLessonProvider>
  );
}
