import { createContext, useContext, type ReactNode } from 'react';

export type QuestionMode = 'guide' | 'ppt';

const QuestionModeContext = createContext<QuestionMode>('guide');

/** SceneDeck supplies ppt; ordinary Guide pages use the guide default. */
export function QuestionModeProvider({ mode, children }: { mode: QuestionMode; children: ReactNode }) {
  return <QuestionModeContext.Provider value={mode}>{children}</QuestionModeContext.Provider>;
}

export function useQuestionMode(): QuestionMode {
  return useContext(QuestionModeContext);
}
