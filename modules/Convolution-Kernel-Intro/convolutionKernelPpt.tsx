import { SceneDeck, type DeckDefinition, type SceneDefinition, type SpeakerNote } from '../shared/react/presentation';
import './tailwind.css';
import '../shared/react/styles.css';
import '../shared/react/ui-kit.css';
import '../shared/react/presentation.css';
import { convolutionCourse } from './course';
import { GomokuLessonProvider } from './LessonContext';
import outlines from './outlines.json';

/** 智能讲稿：逐页取 outlines.json 里的 snippet，页面本身不引用这份文案。 */
export function getPptNotes(sceneId: string): SpeakerNote[] {
  const page = outlines.pages.find((item) => item.id === sceneId);
  if (!page?.snippet) return [];
  return [{ text: page.snippet, selectors: ['.edu-content-block'] }];
}

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
      assetId="38cd1c79-d8b7-462a-b208-a567c5cd89c4"
      progressKey="lesson-flow:convolution-kernel-intro-guide-v1"
      getNotes={getPptNotes}
    />
  );
}
