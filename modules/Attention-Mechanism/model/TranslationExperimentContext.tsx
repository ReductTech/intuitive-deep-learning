import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  TRANSLATION_CHECKPOINT_EPOCHS, TRANSLATION_MAX_EPOCHS,
  TRANSLATION_TRAINING_SET, TRANSLATION_VALIDATION_SET,
  createTranslationCheckpoint, createTranslationTrainingState, restoreTranslationCheckpoint, trainTranslationEpoch,
  type TranslationBatchExample, type TranslationCheckpoint, type TranslationTrainingState,
} from './attentionTranslationExperiment';

export type TranslationExperimentView = 'B1' | 'V1' | 'V2' | 'V3' | 'V4' | 'V5' | 'V6';
export const TRANSLATION_EXPERIMENT_VIEWS: ReadonlyArray<{
  id: TranslationExperimentView; label: string; example: TranslationBatchExample;
}> = [
  { id: 'B1', label: '训练 B1', example: TRANSLATION_TRAINING_SET[0] },
  { id: 'V1', label: '验证 V1', example: TRANSLATION_VALIDATION_SET[0] },
  { id: 'V2', label: '验证 V2', example: TRANSLATION_VALIDATION_SET[1] },
  { id: 'V3', label: '验证 V3', example: TRANSLATION_VALIDATION_SET[2] },
  { id: 'V4', label: '验证 V4', example: TRANSLATION_VALIDATION_SET[3] },
  { id: 'V5', label: '验证 V5', example: TRANSLATION_VALIDATION_SET[4] },
  { id: 'V6', label: '验证 V6', example: TRANSLATION_VALIDATION_SET[5] },
];

const STORAGE_KEY = 'attention-mechanism:translation-experiment-v66';
const checkpointEpochs: readonly number[] = TRANSLATION_CHECKPOINT_EPOCHS;

interface ExperimentSession {
  state: TranslationTrainingState;
  snapshots: ReadonlyMap<number, TranslationTrainingState>;
  view: TranslationExperimentView;
  row: number;
  reviewEpoch: number | null;
  selectedCheckpoint: boolean;
  selectedRow: boolean;
}

interface PersistedExperiment {
  version: 1;
  latest: TranslationCheckpoint;
  checkpoints: TranslationCheckpoint[];
  view: TranslationExperimentView;
  row: number;
  reviewEpoch: number | null;
  selectedCheckpoint: boolean;
  selectedRow: boolean;
}

export interface TranslationExperimentContextValue {
  state: TranslationTrainingState;
  initialState: TranslationTrainingState;
  reviewState: TranslationTrainingState | null;
  displayState: TranslationTrainingState;
  view: TranslationExperimentView;
  example: TranslationBatchExample;
  row: number;
  running: boolean;
  error: string | null;
  checkpoints: ReadonlyArray<{ epoch: number; available: boolean }>;
  selectedCheckpoint: boolean;
  selectedRow: boolean;
  trainTo: (targetEpoch: number) => Promise<void>;
  review: (epoch: number) => void;
  showCurrent: () => void;
  selectExample: (id: TranslationExperimentView) => void;
  selectRow: (row: number) => void;
  reset: () => void;
}

// Lazy and read-only by convention: all training steps return new state arrays.
// StrictMode and PPT thumbnails share this initial forward evaluation, never a training loop.
let initialModel: TranslationTrainingState | undefined;
let restoreCache: { raw: string | null; session: ExperimentSession } | undefined;
function getInitialModel() {
  initialModel ??= createTranslationTrainingState();
  return initialModel;
}

function isView(value: unknown): value is TranslationExperimentView {
  return TRANSLATION_EXPERIMENT_VIEWS.some(({ id }) => id === value);
}

function exampleFor(view: TranslationExperimentView) {
  return TRANSLATION_EXPERIMENT_VIEWS.find(({ id }) => id === view)!.example;
}

function freshSession(): ExperimentSession {
  const state = getInitialModel();
  return { state, snapshots: new Map([[0, state]]), view: 'B1', row: 1,
    reviewEpoch: null, selectedCheckpoint: false, selectedRow: false };
}

function serializeSession(session: ExperimentSession): string {
  const saved: PersistedExperiment = {
    version: 1,
    latest: createTranslationCheckpoint(session.state),
    checkpoints: [...session.snapshots.values()]
      .filter(({ epoch }) => checkpointEpochs.includes(epoch) && epoch <= session.state.epoch)
      .map(createTranslationCheckpoint),
    view: session.view, row: session.row, reviewEpoch: session.reviewEpoch,
    selectedCheckpoint: session.selectedCheckpoint, selectedRow: session.selectedRow,
  };
  return JSON.stringify(saved);
}

function restoreSession(raw: string | null): ExperimentSession {
  if (raw === null) return freshSession();
  try {
    const saved: unknown = JSON.parse(raw);
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return freshSession();
    const value = saved as Partial<PersistedExperiment>;
    if (value.version !== 1) return freshSession();
    const state = restoreTranslationCheckpoint(value.latest);
    if (!state) return freshSession();
    const snapshots = new Map<number, TranslationTrainingState>([[0, getInitialModel()]]);
    if (Array.isArray(value.checkpoints)) {
      // Only saved, already-trained epochs may be reviewed. Never replay missing training.
      for (const item of value.checkpoints.slice(0, checkpointEpochs.length)) {
        if (!item || !checkpointEpochs.includes(item.epoch) || item.epoch <= 0 || item.epoch > state.epoch) continue;
        const restored = item.epoch === state.epoch ? state : restoreTranslationCheckpoint(item);
        if (restored) snapshots.set(restored.epoch, restored);
      }
    }
    if (checkpointEpochs.includes(state.epoch)) snapshots.set(state.epoch, state);
    // Keep the learner-facing experiment on the course's one recurring message.
    const view: TranslationExperimentView = 'B1';
    const row = typeof value.row === 'number' && Number.isInteger(value.row)
      && value.row >= 0 && value.row < exampleFor(view).target.length ? value.row : 1;
    const reviewEpoch = typeof value.reviewEpoch === 'number'
      && value.reviewEpoch <= state.epoch && snapshots.has(value.reviewEpoch) ? value.reviewEpoch : null;
    return { state, snapshots, view, row, reviewEpoch,
      selectedCheckpoint: value.selectedCheckpoint === true, selectedRow: value.selectedRow === true };
  } catch { return freshSession(); }
}

function loadSession(): ExperimentSession {
  let raw: string | null = null;
  try { raw = window.localStorage.getItem(STORAGE_KEY); } catch { /* Storage is optional. */ }
  if (restoreCache?.raw === raw) return restoreCache.session;
  const session = restoreSession(raw);
  restoreCache = { raw, session };
  return session;
}

function persistSession(session: ExperimentSession) {
  try {
    const raw = serializeSession(session);
    window.localStorage.setItem(STORAGE_KEY, raw);
    restoreCache = { raw, session };
  } catch { /* The current experiment remains usable in memory. */ }
}

const TranslationExperimentContext = createContext<TranslationExperimentContextValue | null>(null);

/** Mount once above the shared C24/C25 page instances, including presentation previews. */
export function TranslationExperimentProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(loadSession);
  const sessionRef = useRef(session);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(false);
  const runActive = useRef(false);
  const generation = useRef(0);
  const pendingYield = useRef<{ timer: ReturnType<typeof setTimeout>; resolve: () => void } | null>(null);

  const cancelRun = useCallback(() => {
    generation.current += 1;
    runActive.current = false;
    const pending = pendingYield.current;
    pendingYield.current = null;
    if (pending) { clearTimeout(pending.timer); pending.resolve(); }
  }, []);

  useEffect(() => {
    mounted.current = true;
    setRunning(false);
    persistSession(sessionRef.current);
    return () => { mounted.current = false; cancelRun(); };
  }, [cancelRun]);

  const commit = useCallback((next: ExperimentSession) => {
    if (!mounted.current) return;
    sessionRef.current = next;
    setSession(next);
    persistSession(next);
  }, []);

  const trainTo = useCallback(async (requestedEpoch: number) => {
    if (!mounted.current || runActive.current || !Number.isInteger(requestedEpoch)) return;
    const targetEpoch = Math.min(TRANSLATION_MAX_EPOCHS, requestedEpoch);
    if (targetEpoch <= sessionRef.current.state.epoch) return;
    runActive.current = true;
    const run = ++generation.current;
    setRunning(true);
    setError(null);
    commit({ ...sessionRef.current, reviewEpoch: null });
    try {
      while (sessionRef.current.state.epoch < targetEpoch) {
        // Each full-batch epoch is a separate task; paint and input run between epochs.
        await new Promise<void>((resolve) => {
          const timer = setTimeout(() => { pendingYield.current = null; resolve(); }, 0);
          pendingYield.current = { timer, resolve };
        });
        if (!mounted.current || generation.current !== run) return;
        const state = trainTranslationEpoch(sessionRef.current.state);
        if (!mounted.current || generation.current !== run) return;
        const previous = sessionRef.current;
        let snapshots = previous.snapshots;
        if (checkpointEpochs.includes(state.epoch)) {
          snapshots = new Map(previous.snapshots);
          (snapshots as Map<number, TranslationTrainingState>).set(state.epoch, state);
        }
        commit({ ...previous, state, snapshots, reviewEpoch: null });
      }
    } catch (cause) {
      if (mounted.current && generation.current === run) {
        setError(cause instanceof Error ? cause.message : '训练未完成，请重试。');
      }
    } finally {
      if (generation.current === run) {
        runActive.current = false;
        if (mounted.current) setRunning(false);
      }
    }
  }, [commit]);

  const review = useCallback((epoch: number) => {
    const current = sessionRef.current;
    if (!mounted.current || runActive.current || !Number.isInteger(epoch)
      || epoch > current.state.epoch || !checkpointEpochs.includes(epoch) || !current.snapshots.has(epoch)) return;
    commit({ ...current, reviewEpoch: epoch, selectedCheckpoint: true });
  }, [commit]);

  const showCurrent = useCallback(() => {
    if (sessionRef.current.reviewEpoch !== null) commit({ ...sessionRef.current, reviewEpoch: null });
  }, [commit]);

  const selectExample = useCallback((id: TranslationExperimentView) => {
    const current = sessionRef.current;
    if (!isView(id) || id === current.view) return;
    commit({ ...current, view: id, row: 1 });
  }, [commit]);

  const selectRow = useCallback((row: number) => {
    const current = sessionRef.current;
    if (!Number.isInteger(row) || row < 0 || row >= exampleFor(current.view).target.length) return;
    commit({ ...current, row, selectedRow: true });
  }, [commit]);

  const reset = useCallback(() => {
    if (!mounted.current) return;
    cancelRun();
    setRunning(false);
    setError(null);
    // Replaces the persisted session, clearing checkpoints, review, and interaction markers.
    commit(freshSession());
  }, [cancelRun, commit]);

  const value = useMemo<TranslationExperimentContextValue>(() => {
    const reviewState = session.reviewEpoch === null ? null : session.snapshots.get(session.reviewEpoch) ?? null;
    return {
      state: session.state, initialState: getInitialModel(), reviewState,
      displayState: reviewState ?? session.state,
      view: session.view, example: exampleFor(session.view), row: session.row, running, error,
      checkpoints: checkpointEpochs.map((epoch) => ({ epoch, available: epoch <= session.state.epoch && session.snapshots.has(epoch) })),
      selectedCheckpoint: session.selectedCheckpoint, selectedRow: session.selectedRow,
      trainTo, review, showCurrent, selectExample, selectRow, reset,
    };
  }, [session, running, error, trainTo, review, showCurrent, selectExample, selectRow, reset]);

  return <TranslationExperimentContext.Provider value={value}>{children}</TranslationExperimentContext.Provider>;
}

export function useTranslationExperiment(): TranslationExperimentContextValue {
  const context = useContext(TranslationExperimentContext);
  if (!context) throw new Error('Translation pages require TranslationExperimentProvider.');
  return context;
}
