import { SceneDeck, type DeckDefinition, type SceneDefinition, type SpeakerNote } from '../shared/react/presentation';
import { AttentionLessonProvider } from './model/AttentionLessonContext';
import { ATTENTION_MODULE_ID, ATTENTION_PROGRESS_ID, attentionCourse } from './course';
import outlines from './outlines.json';

// The recipient can add the officially signed identity in outlines.json;
// both this adapter and the framework catalog then use the same asset UUID.
const assetId = (outlines as { moduleIdentity?: { id: string } }).moduleIdentity?.id ?? outlines.id;

const scenes: SceneDefinition[] = attentionCourse.map(({ id, title, section, component }) => ({
  id,
  title,
  section,
  render: (context) => <AttentionLessonProvider>{component(context)}</AttentionLessonProvider>,
}));

export const deck: DeckDefinition = {
    id: ATTENTION_MODULE_ID,
    title: '注意力机制',
    subtitle: `${scenes.length} 页`,
    scenes,
};
const catalog: [DeckDefinition, ...DeckDefinition[]] = [deck];

export function getPptNotes(sceneId: string): SpeakerNote[] {
  const page = outlines.pages.find(page => page.id === sceneId);
  return page?.snippet ? [{ text: page.snippet, selectors: [] }] : [];
}

export function AttentionPpt() {
  return (
      <SceneDeck
        catalog={catalog}
        moduleId={ATTENTION_MODULE_ID}
        assetId={assetId}
        progressKey={`lesson-flow:${ATTENTION_PROGRESS_ID}`}
        getNotes={getPptNotes}
      />
  );
}
