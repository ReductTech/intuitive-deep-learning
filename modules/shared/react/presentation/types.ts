import type { ReactNode } from 'react';

export interface SpeakerNote {
  text: string;
  selectors: string[];
}

/** Runtime contract for a reusable lesson/presentation deck. */
export type LessonContext = { complete: () => void; reset: () => void; isComplete: boolean };

export interface SceneDefinition {
  id: string;
  title: string;
  section: string;
  render: (context: LessonContext) => ReactNode;
}

export interface DeckDefinition {
  id: string;
  title: string;
  subtitle: string;
  scenes: SceneDefinition[];
}

export interface SceneDeckProps {
  /** At least one deck is required so the player always has an initial scene. */
  catalog: readonly [DeckDefinition, ...DeckDefinition[]];
  moduleId: string;
  progressKey: string;
  /** Optional presenter notes; decks without notes render without the inspector content. */
  getNotes?: (sceneId: string) => SpeakerNote[];
}
