import { SceneDeck, type DeckDefinition, type SceneDefinition, type SpeakerNote } from '../shared/react/presentation';
import { LessonSlide } from './pages/LessonSlide/LessonSlide';
import outline from './outlines.json';

const scenes: SceneDefinition[] = outline.pages.map((page, index) => ({
  id: page.id,
  title: page.title,
  section: page.section,
  render: () => <LessonSlide index={index} />,
}));

export const deck: DeckDefinition = {
  id: outline.id,
  title: outline.title,
  subtitle: 'ReAct、多智能体与工作流 · Vibe coding',
  scenes,
};

export function getPptNotes(sceneId: string): SpeakerNote[] {
  const page = outline.pages.find((item) => item.id === sceneId);
  return page ? [{ text: `${page.snippet}\n教学目标：${page.goal}\n交互：${page.interaction}`, selectors: [] }] : [];
}

export function AgentPpt() {
  return <SceneDeck catalog={[deck]} moduleId={outline.id} assetId={outline.moduleIdentity.id} progressKey="lesson-flow:agent-complex-tasks-v1" getNotes={getPptNotes} />;
}
