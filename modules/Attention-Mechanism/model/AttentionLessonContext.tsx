import { TranslationExperimentProvider } from './TranslationExperimentContext';
import { AttentionMathRuntime } from '../components/AttentionMathRuntime';
import { createContext, useContext, useEffect, useReducer, useState, type ReactNode } from 'react';
import { createQueryExploration, normalizeQueryExploration, queryReducer, type QueryExplorationState, type QueryTask } from './queryExploration';
import { createQkvRole, normalizeQkvRole, qkvRoleReducer, type QkvRoleState, type QkvRoleAction } from './qkvRole';
import { createDotProduct, normalizeDotProduct, dotProductReducer, type DotProductState, type DotProductAction } from './dotProduct';
import { createAdditiveScoring, normalizeAdditiveScoring, additiveScoringReducer, type AdditiveScoringState, type AdditiveScoringAction } from './additiveScoring';
export type { QueryExplorationState, QueryTask } from './queryExploration';
export { hasCompletedQueryExploration } from './queryExploration';

export type ObservationPhase = 'first-observe' | 'first-recall' | 'second-brief' | 'second-observe' | 'second-recall' | 'complete';
export interface ObservationState {
  version: 1;
  attempt: string;
  phase: ObservationPhase;
  firstAnswer: number | null;
  secondAnswer: number | null;
}
export type ObservationAction =
  | { type: 'hide' }
  | { type: 'answer'; value: number }
  | { type: 'next-round' }
  | { type: 'show-second' }
  | { type: 'retry'; attempt: string };
const storageKey = 'attention-mechanism:observation-v20';

function freshObservation(attempt: string): ObservationState {
  return { version: 1, attempt, phase: 'first-observe', firstAnswer: null, secondAnswer: null };
}

export function isObservationState(value: unknown): value is ObservationState {
  if (!value || typeof value !== 'object') return false;
  const s = value as Partial<ObservationState>;
  if (s.version !== 1 || typeof s.attempt !== 'string' || !s.attempt || s.attempt.length > 100) return false;
  const firstValid = s.firstAnswer !== undefined && s.firstAnswer !== null && [1, 2, 3].includes(s.firstAnswer);
  const secondValid = s.secondAnswer !== undefined && s.secondAnswer !== null && [2, 3, 4].includes(s.secondAnswer);
  if (s.phase === 'first-observe') return s.firstAnswer === null && s.secondAnswer === null;
  if (s.phase === 'first-recall') return (s.firstAnswer === null || firstValid) && s.secondAnswer === null;
  if (s.phase === 'second-brief' || s.phase === 'second-observe' || s.phase === 'second-recall') return firstValid && s.secondAnswer === null;
  return s.phase === 'complete' && firstValid && secondValid;
}

export function observationReducer(state: ObservationState, action: ObservationAction): ObservationState {
  if (action.type === 'retry') return freshObservation(action.attempt);
  if (action.type === 'hide' && state.phase === 'first-observe') return { ...state, phase: 'first-recall' };
  if (action.type === 'hide' && state.phase === 'second-observe') return { ...state, phase: 'second-recall' };
  if (action.type === 'next-round' && state.phase === 'first-recall' && state.firstAnswer !== null) return { ...state, phase: 'second-brief' };
  if (action.type === 'show-second' && state.phase === 'second-brief') return { ...state, phase: 'second-observe' };
  if (action.type === 'answer' && state.phase === 'first-recall' && state.firstAnswer === null && [1, 2, 3].includes(action.value)) return { ...state, firstAnswer: action.value };
  if (action.type === 'answer' && state.phase === 'second-recall' && [2, 3, 4].includes(action.value)) return { ...state, secondAnswer: action.value, phase: 'complete' };
  return state;
}

function restoreObservation(): ObservationState {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
    if (isObservationState(saved)) return saved;
  } catch { /* Storage may be unavailable; the activity still works in memory. */ }
  return freshObservation(crypto.randomUUID());
}

const queryStorageKey = 'attention-mechanism:query-v20';

function restoreQuery(): QueryExplorationState {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(queryStorageKey) ?? 'null');
    const restored = normalizeQueryExploration(saved);
    if (restored) return restored;
  } catch { /* Storage may be unavailable; the activity still works in memory. */ }
  return createQueryExploration();
}

const qkvStorageKey = 'attention-mechanism:qkv-role-v20';

function restoreQkv(): QkvRoleState {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(qkvStorageKey) ?? 'null');
    const restored = normalizeQkvRole(saved);
    if (restored) return restored;
  } catch { /* The role activity remains usable without storage. */ }
  return createQkvRole(crypto.randomUUID());
}

const dotProductStorageKey = 'attention-mechanism:dot-product-v20';

function restoreDotProduct(): DotProductState {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(dotProductStorageKey) ?? 'null');
    const restored = normalizeDotProduct(saved);
    if (restored) return restored;
  } catch { /* The geometry experiment remains usable without storage. */ }
  return createDotProduct();
}

const additiveStorageKey = 'attention-mechanism:additive-scoring-v20';

function restoreAdditive(): AdditiveScoringState {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(additiveStorageKey) ?? 'null');
    const restored = normalizeAdditiveScoring(saved);
    if (restored) return restored;
  } catch { /* The projection experiment remains usable without storage. */ }
  return createAdditiveScoring();
}

export const KEY_VALUE_DRINKS = { water: '冰水', juice: '果汁' } as const;
export type KeyValueDrink = keyof typeof KEY_VALUE_DRINKS;

const AttentionLessonContext = createContext<{
  exampleDrink: KeyValueDrink;
  setExampleDrink: React.Dispatch<React.SetStateAction<KeyValueDrink>>;
  additive: AdditiveScoringState;
  dispatchAdditive: React.Dispatch<AdditiveScoringAction>;
  observation: ObservationState;
  dispatchObservation: React.Dispatch<ObservationAction>;
  query: QueryExplorationState;
  selectQuery: (task: QueryTask) => void;
  qkv: QkvRoleState;
  dispatchQkv: React.Dispatch<QkvRoleAction>;
  dotProduct: DotProductState;
  dispatchDotProduct: React.Dispatch<DotProductAction>;
} | null>(null);

export function AttentionLessonProvider({ children }: { children: ReactNode }) {
  const [exampleDrink, setExampleDrink] = useState<KeyValueDrink>(() => {
    try { const value: unknown = JSON.parse(localStorage.getItem('attention-mechanism:C26-drink-v20') ?? 'null'); if (value === 'water' || value === 'juice') return value; } catch { /* Use the original story. */ }
    return 'water';
  });
  useEffect(() => {
    try { localStorage.setItem('attention-mechanism:C26-drink-v20', JSON.stringify(exampleDrink)); } catch { /* Keep the shared example usable in memory. */ }
  }, [exampleDrink]);
  const [additive, dispatchAdditive] = useReducer(additiveScoringReducer, undefined, restoreAdditive);
  const [dotProduct, dispatchDotProduct] = useReducer(dotProductReducer, undefined, restoreDotProduct);
  const [observation, dispatchObservation] = useReducer(observationReducer, undefined, restoreObservation);
  const [qkv, dispatchQkv] = useReducer(qkvRoleReducer, undefined, restoreQkv);
  const [query, selectQuery] = useReducer(queryReducer, undefined, restoreQuery);
  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(observation)); } catch { /* Keep the in-memory experience usable. */ }
  }, [observation]);
  useEffect(() => {
    try { localStorage.setItem(queryStorageKey, JSON.stringify(query)); } catch { /* Keep the in-memory experience usable. */ }
  }, [query]);
  useEffect(() => {
    try { localStorage.setItem(qkvStorageKey, JSON.stringify(qkv)); } catch { /* Keep the in-memory experience usable. */ }
  }, [qkv]);
  useEffect(() => {
    try { localStorage.setItem(dotProductStorageKey, JSON.stringify(dotProduct)); } catch { /* Keep the in-memory experience usable. */ }
  }, [dotProduct]);
  useEffect(() => {
    try { localStorage.setItem(additiveStorageKey, JSON.stringify(additive)); } catch { /* Keep the in-memory experience usable. */ }
  }, [additive]);
  return <TranslationExperimentProvider><AttentionLessonContext.Provider value={{ exampleDrink, setExampleDrink, additive, dispatchAdditive, observation, dispatchObservation, query, selectQuery, qkv, dispatchQkv, dotProduct, dispatchDotProduct }}><AttentionMathRuntime />{children}</AttentionLessonContext.Provider></TranslationExperimentProvider>;
}

export function useAttentionLesson() {
  const context = useContext(AttentionLessonContext);
  if (!context) throw new Error('Attention pages require AttentionLessonProvider.');
  return context;
}
