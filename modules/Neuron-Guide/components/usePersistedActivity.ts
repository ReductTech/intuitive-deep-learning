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
  initEvent?: string;
  initProperties?: Record<string, unknown> | ((state: T) => Record<string, unknown>);
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

const initializationEvents = new Set<string>();

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
 * Module-private SQLite-backed state adapter.
 *
 * Hydration never emits telemetry. A UI operation should call `commit` once with
 * its semantic event name; the emitted event always carries the complete state
 * snapshot under the stable `stateKey`. If the saved state cannot be read or
 * normalized, the activity uses a fresh in-memory state and `commit` remains
 * local until the page is refreshed.
 */
export function usePersistedActivity<T>({
  stateKey,
  createInitial,
  moduleId = currentModuleId(),
  initEvent,
  initProperties,
  normalizeState,
  getElement,
}: PersistedActivityOptions<T>): PersistedActivityResult<T> {
  const [state, setState] = useState<T | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [persistenceAvailable, setPersistenceAvailable] = useState<boolean | null>(null);
  const stateRef = useRef<T | null>(null);
  const generationRef = useRef(0);

  const createInitialRef = useRef(createInitial);
  const initPropertiesRef = useRef(initProperties);
  const normalizeStateRef = useRef(normalizeState);
  const getElementRef = useRef(getElement);
  createInitialRef.current = createInitial;
  initPropertiesRef.current = initProperties;
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
        setPersistenceAvailable(false);
        return;
      }

      const next = restored ?? createInitialRef.current();
      stateRef.current = next;
      setState(next);
      setHydrated(true);
      setPersistenceAvailable(true);

      if (entry !== null || !initEvent) return;
      const initializationKey = `${moduleId}:${stateKey}:${initEvent}`;
      if (initializationEvents.has(initializationKey)) return;
      initializationEvents.add(initializationKey);
      const additional = typeof initPropertiesRef.current === 'function'
        ? initPropertiesRef.current(next)
        : initPropertiesRef.current;
      emitTelemetry(initEvent, getElementRef.current?.() ?? null, {
        ...additional,
        state_key: stateKey,
        state: next,
      });
    });

    return () => {
      active = false;
    };
  }, [initEvent, moduleId, stateKey]);

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
