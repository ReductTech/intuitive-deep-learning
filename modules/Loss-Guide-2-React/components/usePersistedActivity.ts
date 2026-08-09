import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from 'react';
import {
  currentModuleId,
  emitTelemetry,
  type TelemetryStateEntry,
} from '../../shared/react';

export type PersistedActivityUpdater<T> = T | ((current: T) => T);

export interface PersistedActivityOptions<T> {
  stateKey: string;
  createInitial: () => T;
  moduleId?: string;
  normalizeState?: (stored: unknown) => T | null;
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
}

type ActivityStateLoad<T> =
  | { ok: true; entry: TelemetryStateEntry<T> | null }
  | { ok: false };

async function loadActivityState<T>(
  stateKey: string,
  moduleId: string,
): Promise<ActivityStateLoad<T>> {
  const telemetry = window.__DL_TELEMETRY__;
  if (!telemetry?.getModuleState) return { ok: false };

  try {
    const document = await telemetry.getModuleState(moduleId);
    if (!document || document.ok !== true) return { ok: false };
    return {
      ok: true,
      entry: (
        document.states?.[stateKey] as TelemetryStateEntry<T> | undefined
      ) ?? null,
    };
  } catch {
    return { ok: false };
  }
}

function resolveUpdate<T>(
  current: T | null,
  update: PersistedActivityUpdater<T>,
): T | null {
  if (current === null) return null;
  return typeof update === 'function'
    ? (update as (value: T) => T)(current)
    : update;
}

/**
 * Loss-Guide-2 private SQLite-backed activity adapter.
 *
 * Hydration is read-only and never emits an initialization event. One user
 * operation should call `commit` once with its semantic event name; the whole
 * state snapshot is stored under `stateKey`. If Telemetry cannot be read, the
 * activity continues from a fresh in-memory state. In that mode commits remain
 * local and a refresh starts over. No localStorage fallback is used.
 */
export function usePersistedActivity<T>({
  stateKey,
  createInitial,
  moduleId = currentModuleId(),
  normalizeState,
  getElement,
}: PersistedActivityOptions<T>): PersistedActivityResult<T> {
  const [state, setState] = useState<T | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [persistenceAvailable, setPersistenceAvailable] = useState<
    boolean | null
  >(null);
  const stateRef = useRef<T | null>(null);
  const generationRef = useRef(0);

  const createInitialRef = useRef(createInitial);
  const normalizeStateRef = useRef(normalizeState);
  const getElementRef = useRef(getElement);
  createInitialRef.current = createInitial;
  normalizeStateRef.current = normalizeState;
  getElementRef.current = getElement;

  useEffect(() => {
    let active = true;
    const generation = ++generationRef.current;
    stateRef.current = null;
    setState(null);
    setHydrated(false);
    setPersistenceAvailable(null);

    void loadActivityState<unknown>(stateKey, moduleId).then((result) => {
      if (!active || generation !== generationRef.current) return;

      if (!result.ok) {
        const next = createInitialRef.current();
        stateRef.current = next;
        setState(next);
        setHydrated(true);
        setPersistenceAvailable(false);
        return;
      }

      let restored: T | null = null;
      let normalizationFailed = false;
      const { entry } = result;
      if (entry !== null) {
        try {
          restored = normalizeStateRef.current
            ? normalizeStateRef.current(entry.state)
            : (entry.state as T);
          normalizationFailed = restored === null;
        } catch {
          normalizationFailed = true;
        }
      }

      if (normalizationFailed) {
        const next = createInitialRef.current();
        stateRef.current = next;
        setState(next);
        setHydrated(true);
        // Do not overwrite an incompatible historical snapshot.
        setPersistenceAvailable(false);
        return;
      }

      const next = restored ?? createInitialRef.current();
      stateRef.current = next;
      setState(next);
      setHydrated(true);
      setPersistenceAvailable(true);
    });

    return () => {
      active = false;
    };
  }, [moduleId, stateKey]);

  const setDraft = useCallback((
    update: PersistedActivityUpdater<T>,
  ): T | null => {
    if (!hydrated) return null;
    const next = resolveUpdate(stateRef.current, update);
    if (next === null) return null;
    stateRef.current = next;
    setState(next);
    return next;
  }, [hydrated]);

  const commit = useCallback((
    eventName: string,
    update: PersistedActivityUpdater<T>,
    properties: Record<string, unknown> = {},
  ): T | null => {
    if (!hydrated) return null;
    const next = resolveUpdate(stateRef.current, update);
    if (next === null) return null;
    stateRef.current = next;
    setState(next);

    if (persistenceAvailable === true) {
      emitTelemetry(eventName, getElementRef.current?.() ?? null, {
        ...properties,
        state_key: stateKey,
        state: next,
      });
    }
    return next;
  }, [hydrated, persistenceAvailable, stateKey]);

  return {
    state,
    stateRef,
    hydrated,
    persistenceAvailable,
    setDraft,
    commit,
  };
}
