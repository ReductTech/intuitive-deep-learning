import { SceneDeck, type DeckDefinition, type SpeakerNote } from "@shuku/course-style/react/presentation";
import { COURSE_TOPICS } from './pages/CourseCoverPage';
import { courseScenes } from './course';
import outline from './outlines.json';

export const deck: DeckDefinition = {
  id: outline.id,
  title: outline.title,
  subtitle: COURSE_TOPICS,
  scenes: courseScenes,
};

export function getPptNotes(sceneId: string): SpeakerNote[] {
  const page = outline.pages.find(page => page.id === sceneId);
  return page?.snippet ? [{ text: page.snippet, selectors: [] }] : [];
}

export function KvCachePpt() {
  return <SceneDeck catalog={[deck]} moduleId={outline.id} assetId={outline.moduleIdentity.id} progressKey="lesson-flow:kv-cache-guide" getNotes={getPptNotes} />;
}
