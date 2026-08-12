import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import { currentModuleId, emitTelemetry, type TelemetryStateEntry } from '../../shared/react';

export type PersistedActivityUpdater<T> = T | ((current: T) => T);

export interface PersistedActivityOptions<T> {
  stateKey: string;
  createInitial: () => T;
  moduleId?: string;
  normalizeState?: (
    stored: unknown,
    entry?: TelemetryStateEntry<unknown> | null,
  ) => T | null;
  serializeState?: (state: T) => unknown;
  getElement?: () => Element | null;
}

export interface PersistedActivityResult<T> {
  state: T | null;
  stateRef: MutableRefObject<T | null>;
  hydrated: boolean;
  persistenceAvailable: boolean | null;
  setDraft: (next: PersistedActivityUpdater<T>) => T | null;
  commit: (
    eventName: string,
    next: PersistedActivityUpdater<T>,
    properties?: Record<string, unknown>,
  ) => T | null;
  persistObservation: (
    eventName: string,
    next: PersistedActivityUpdater<T>,
    properties?: Record<string, unknown>,
  ) => T | null;
}

async function load<T>(stateKey: string, moduleId: string) {
  const telemetry = window.__DL_TELEMETRY__;
  if (!telemetry?.getModuleState) return { ok: false as const };
  try {
    const document = await telemetry.getModuleState(moduleId);
    if (!document || document.ok !== true) return { ok: false as const };
    return {
      ok: true as const,
      entry: (document.states?.[stateKey] as TelemetryStateEntry<T> | undefined) ?? null,
    };
  } catch {
    return { ok: false as const };
  }
}

function resolve<T>(current: T | null, update: PersistedActivityUpdater<T>) {
  if (current === null) return null;
  return typeof update === 'function' ? (update as (value: T) => T)(current) : update;
}

interface LenetTelemetryApi {
  flush?: () => Promise<boolean> | boolean;
}

let pendingFlushTimer: number | null = null;

/**
 * Flush after the current interaction has finished so shared Question events and
 * the module-private state event travel in the same, bounded batch.
 */
export function flushLenetTelemetrySoon() {
  if (pendingFlushTimer !== null) return;
  pendingFlushTimer = window.setTimeout(() => {
    pendingFlushTimer = null;
    const telemetry = window.__DL_TELEMETRY__ as (typeof window.__DL_TELEMETRY__ & LenetTelemetryApi);
    try {
      void Promise.resolve(telemetry?.flush?.()).catch(() => undefined);
    } catch {
      // Telemetry is optional during visual-only local development.
    }
  }, 0);
}

/** SQLite telemetry adapter with a non-blocking in-memory fallback. */
export function usePersistedActivity<T>({
  stateKey,
  createInitial,
  moduleId = currentModuleId(),
  normalizeState,
  serializeState,
  getElement,
}: PersistedActivityOptions<T>): PersistedActivityResult<T> {
  const [state, setState] = useState<T | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [persistenceAvailable, setPersistenceAvailable] = useState<boolean | null>(null);
  const stateRef = useRef<T | null>(null);
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
    setHydrated(false);
    void load<unknown>(stateKey, moduleId).then((result) => {
      if (!active) return;
      if (!result.ok) {
        const next = createRef.current();
        stateRef.current = next;
        setState(next);
        setHydrated(true);
        setPersistenceAvailable(false);
        return;
      }
      let restored: T | null = null;
      if (result.entry) {
        try {
          restored = normalizeRef.current
            ? normalizeRef.current(result.entry.state, result.entry)
            : result.entry.state as T;
        } catch {
          restored = null;
        }
      }
      const next = restored ?? createRef.current();
      stateRef.current = next;
      setState(next);
      setHydrated(true);
      setPersistenceAvailable(true);
    });
    return () => { active = false; };
  }, [moduleId, stateKey]);

  const setDraft = useCallback((update: PersistedActivityUpdater<T>) => {
    if (!hydrated) return null;
    const next = resolve(stateRef.current, update);
    if (next === null) return null;
    stateRef.current = next;
    setState(next);
    return next;
  }, [hydrated]);

  const commit = useCallback((
    eventName: string,
    update: PersistedActivityUpdater<T>,
    properties: Record<string, unknown> = {},
  ) => {
    if (!hydrated) return null;
    const next = resolve(stateRef.current, update);
    if (next === null) return null;
    stateRef.current = next;
    setState(next);
    if (window.__DL_TELEMETRY__?.emit) {
      let persistedState: unknown;
      try {
        persistedState = serializeRef.current ? serializeRef.current(next) : next;
      } catch {
        setPersistenceAvailable(false);
        return next;
      }
      emitTelemetry(eventName, elementRef.current?.() ?? null, {
        ...properties,
        state_key: stateKey,
        state: persistedState,
      });
      flushLenetTelemetrySoon();
    }
    return next;
  }, [hydrated, stateKey]);

  /** Persist service/system state without representing it as a user interaction. */
  const persistObservation = useCallback((
    eventName: string,
    update: PersistedActivityUpdater<T>,
    properties: Record<string, unknown> = {},
  ) => {
    if (!hydrated) return null;
    const next = resolve(stateRef.current, update);
    if (next === null) return null;
    stateRef.current = next;
    setState(next);
    if (window.__DL_TELEMETRY__?.emit) {
      let persistedState: unknown;
      try {
        persistedState = serializeRef.current ? serializeRef.current(next) : next;
      } catch {
        setPersistenceAvailable(false);
        return next;
      }
      emitTelemetry(eventName, elementRef.current?.() ?? null, {
        ...properties,
        event_kind: 'observation',
        user_initiated: false,
        state_key: stateKey,
        state: persistedState,
      });
      flushLenetTelemetrySoon();
    }
    return next;
  }, [hydrated, stateKey]);

  return {
    state,
    stateRef,
    hydrated,
    persistenceAvailable,
    setDraft,
    commit,
    persistObservation,
  };
}
