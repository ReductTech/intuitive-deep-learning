import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from 'react';
import { currentModuleId, emitTelemetry, type TelemetryStateEntry } from '../../shared/react';
import {
  FACE_ACTIVITY_EVENTS,
  FACE_RUNTIME_STATE_KEY,
  completeFaceRuntimeSnapshot,
  createInitialFaceRuntimeSnapshot,
  isFaceRuntimeComplete,
  normalizeFaceRuntimeSnapshot,
  type FaceRuntimeSnapshot,
} from '../model/faceState';

export type FaceActivityUpdater =
  | FaceRuntimeSnapshot
  | ((current: FaceRuntimeSnapshot) => FaceRuntimeSnapshot);

export interface PersistedFaceActivityOptions {
  stateKey?: string;
  moduleId?: string;
  createInitial?: () => FaceRuntimeSnapshot;
  normalizeState?: (
    stored: unknown,
    entry?: TelemetryStateEntry<unknown> | null,
  ) => FaceRuntimeSnapshot | null;
  serializeState?: (state: FaceRuntimeSnapshot) => unknown;
  getElement?: () => Element | null;
}

export interface PersistedFaceActivityResult {
  state: FaceRuntimeSnapshot | null;
  stateRef: MutableRefObject<FaceRuntimeSnapshot | null>;
  hydrated: boolean;
  persistenceAvailable: boolean | null;
  setDraft: (next: FaceActivityUpdater) => FaceRuntimeSnapshot | null;
  commit: (
    eventName: string,
    next: FaceActivityUpdater,
    properties?: Record<string, unknown>,
  ) => FaceRuntimeSnapshot | null;
  persistObservation: (
    eventName: string,
    next: FaceActivityUpdater,
    properties?: Record<string, unknown>,
  ) => FaceRuntimeSnapshot | null;
  complete: (
    eventName?: string,
    properties?: Record<string, unknown>,
  ) => FaceRuntimeSnapshot | null;
}

interface FaceTelemetryApiWithFlush {
  flush?: () => Promise<boolean> | boolean;
}

function waitForFaceTelemetry(delayMs: number) {
  return new Promise<null>((resolve) => window.setTimeout(() => resolve(null), delayMs));
}

async function loadFaceActivity(stateKey: string, moduleId: string) {
  const telemetry = window.__DL_TELEMETRY__;
  if (!telemetry?.getModuleState) return { ok: false as const };
  try {
    const document = await Promise.race([
      telemetry.getModuleState(moduleId),
      waitForFaceTelemetry(2500),
    ]);
    if (!document || document.ok !== true) return { ok: false as const };
    return {
      ok: true as const,
      entry: (document.states?.[stateKey] as TelemetryStateEntry<unknown> | undefined) ?? null,
    };
  } catch {
    return { ok: false as const };
  }
}

function resolveFaceUpdate(
  current: FaceRuntimeSnapshot | null,
  update: FaceActivityUpdater,
): FaceRuntimeSnapshot | null {
  if (current === null) return null;
  return typeof update === 'function' ? update(current) : update;
}

let pendingFlushTimer: number | null = null;

/** Flushes the SQLite event batch after the current semantic interaction. */
export function flushFaceTelemetrySoon() {
  if (pendingFlushTimer !== null) return;
  pendingFlushTimer = window.setTimeout(() => {
    pendingFlushTimer = null;
    const telemetry = window.__DL_TELEMETRY__ as (
      typeof window.__DL_TELEMETRY__ & FaceTelemetryApiWithFlush
    );
    try {
      void Promise.resolve(telemetry?.flush?.()).catch(() => undefined);
    } catch {
      // Local visual review is allowed to run without the Telemetry process.
    }
  }, 0);
}

/**
 * Face module-private SQLite adapter.
 *
 * A failed hydration immediately falls back to the initial in-memory snapshot,
 * so the lesson stays usable. That fallback is deliberately non-persistent and
 * never writes localStorage. Restoring a snapshot only updates React state and
 * never emits a user event.
 */
export function usePersistedFaceActivity({
  stateKey = FACE_RUNTIME_STATE_KEY,
  moduleId = currentModuleId(),
  createInitial = createInitialFaceRuntimeSnapshot,
  normalizeState = normalizeFaceRuntimeSnapshot,
  serializeState,
  getElement,
}: PersistedFaceActivityOptions = {}): PersistedFaceActivityResult {
  const [state, setState] = useState<FaceRuntimeSnapshot | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [persistenceAvailable, setPersistenceAvailable] = useState<boolean | null>(null);
  const stateRef = useRef<FaceRuntimeSnapshot | null>(null);
  const createRef = useRef(createInitial);
  const normalizeRef = useRef(normalizeState);
  const serializeRef = useRef(serializeState);
  const elementRef = useRef(getElement);
  createRef.current = createInitial;
  normalizeRef.current = normalizeState;
  serializeRef.current = serializeState;
  elementRef.current = getElement;

  useEffect(() => {
    let active = true;
    stateRef.current = null;
    setState(null);
    setHydrated(false);
    setPersistenceAvailable(null);

    void loadFaceActivity(stateKey, moduleId).then((result) => {
      if (!active) return;
      if (!result.ok) {
        const initial = createRef.current();
        stateRef.current = initial;
        setState(initial);
        setPersistenceAvailable(false);
        setHydrated(true);
        return;
      }

      let restored: FaceRuntimeSnapshot | null = null;
      if (result.entry) {
        try {
          restored = normalizeRef.current(result.entry.state, result.entry);
        } catch {
          restored = null;
        }
      }
      const next = restored ?? createRef.current();
      stateRef.current = next;
      setState(next);
      setPersistenceAvailable(true);
      setHydrated(true);
    });

    return () => {
      active = false;
    };
  }, [moduleId, stateKey]);

  const setDraft = useCallback((update: FaceActivityUpdater) => {
    if (!hydrated) return null;
    const next = resolveFaceUpdate(stateRef.current, update);
    if (next === null) return null;
    stateRef.current = next;
    setState(next);
    return next;
  }, [hydrated]);

  const persist = useCallback((
    eventName: string,
    update: FaceActivityUpdater,
    properties: Record<string, unknown>,
    observation: boolean,
  ) => {
    if (!hydrated) return null;
    const next = resolveFaceUpdate(stateRef.current, update);
    if (next === null) return null;
    stateRef.current = next;
    setState(next);

    // Hydration failure means this session is intentionally in-memory only.
    if (persistenceAvailable !== true || !window.__DL_TELEMETRY__?.emit) return next;

    let persistedState: unknown;
    try {
      persistedState = serializeRef.current ? serializeRef.current(next) : next;
      emitTelemetry(eventName, elementRef.current?.() ?? null, {
        ...properties,
        ...(observation ? { event_kind: 'observation', user_initiated: false } : {}),
        state_key: stateKey,
        state: persistedState,
      });
      flushFaceTelemetrySoon();
    } catch {
      setPersistenceAvailable(false);
    }
    return next;
  }, [hydrated, persistenceAvailable, stateKey]);

  const commit = useCallback((
    eventName: string,
    update: FaceActivityUpdater,
    properties: Record<string, unknown> = {},
  ) => persist(eventName, update, properties, false), [persist]);

  const persistObservation = useCallback((
    eventName: string,
    update: FaceActivityUpdater,
    properties: Record<string, unknown> = {},
  ) => persist(eventName, update, properties, true), [persist]);

  const complete = useCallback((
    eventName: string = FACE_ACTIVITY_EVENTS.moduleCompleted,
    properties: Record<string, unknown> = {},
  ) => {
    const current = stateRef.current;
    if (!hydrated || current === null) return null;
    if (isFaceRuntimeComplete(current)) return current;
    return persist(
      eventName,
      completeFaceRuntimeSnapshot(current),
      properties,
      false,
    );
  }, [hydrated, persist]);

  return {
    state,
    stateRef,
    hydrated,
    persistenceAvailable,
    setDraft,
    commit,
    persistObservation,
    complete,
  };
}
