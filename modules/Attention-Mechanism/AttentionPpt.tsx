import { useLayoutEffect, useState } from 'react';
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
  const [ready, setReady] = useState(false);
  useLayoutEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('slide') === 'C27') {
      url.searchParams.set('slide', 'C26');
      window.history.replaceState(null, '', url);
    }
    if (url.searchParams.get('slide') === 'C09') {
      url.searchParams.set('slide', 'C05');
      window.history.replaceState(null, '', url);
    }
    if (url.searchParams.get('slide') === 'C22' || url.searchParams.get('slide') === 'C23') {
      url.searchParams.set('slide', 'C21');
      window.history.replaceState(null, '', url);
    }
    if (['C31'].includes(url.searchParams.get('slide') ?? '')) {
      url.searchParams.set('slide', 'C32');
      window.history.replaceState(null, '', url);
    }
    if (url.searchParams.get('slide') === 'C29') { url.searchParams.set('slide', 'C28'); window.history.replaceState(null, '', url); }
    setReady(true);
  }, []);
  if (!ready) return null;
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
