import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import { currentModuleId, emitTelemetry, type TelemetryStateEntry } from '../../shared/react';

export type PersistedActivityUpdater<T> = T | ((current: T) => T);

interface Options<T> {
  stateKey: string;
  createInitial: () => T;
  moduleId?: string;
  normalizeState?: (stored: unknown) => T | null;
  getElement?: () => Element | null;
}

interface Result<T> {
  state: T | null;
  stateRef: MutableRefObject<T | null>;
  hydrated: boolean;
  persistenceAvailable: boolean | null;
  setDraft: (next: PersistedActivityUpdater<T>) => T | null;
  commit: (eventName: string, next: PersistedActivityUpdater<T>, properties?: Record<string, unknown>) => T | null;
}

async function load<T>(stateKey: string, moduleId: string) {
  const telemetry = window.__DL_TELEMETRY__;
  if (!telemetry?.getModuleState) return { ok: false as const };
  try {
    const document = await telemetry.getModuleState(moduleId);
    if (!document || document.ok !== true) return { ok: false as const };
    return { ok: true as const, entry: (document.states?.[stateKey] as TelemetryStateEntry<T> | undefined) ?? null };
  } catch {
    return { ok: false as const };
  }
}

function resolve<T>(current: T | null, update: PersistedActivityUpdater<T>) {
  if (current === null) return null;
  return typeof update === 'function' ? (update as (value: T) => T)(current) : update;
}

/** Module-private SQLite adapter; Telemetry failure falls back to usable in-memory state. */
export function usePersistedActivity<T>({ stateKey, createInitial, moduleId = currentModuleId(), normalizeState, getElement }: Options<T>): Result<T> {
  const [state, setState] = useState<T | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [persistenceAvailable, setPersistenceAvailable] = useState<boolean | null>(null);
  const stateRef = useRef<T | null>(null);
  const createRef = useRef(createInitial);
  const normalizeRef = useRef(normalizeState);
  const elementRef = useRef(getElement);
  createRef.current = createInitial;
  normalizeRef.current = normalizeState;
  elementRef.current = getElement;

  useEffect(() => {
    let active = true;
    setHydrated(false);
    void load<unknown>(stateKey, moduleId).then((result) => {
      if (!active) return;
      if (!result.ok) {
        const next = createRef.current();
        stateRef.current = next; setState(next); setHydrated(true); setPersistenceAvailable(false);
        return;
      }
      let restored: T | null = null;
      if (result.entry) {
        try { restored = normalizeRef.current ? normalizeRef.current(result.entry.state) : result.entry.state as T; } catch { restored = null; }
      }
      const next = restored ?? createRef.current();
      stateRef.current = next; setState(next); setHydrated(true); setPersistenceAvailable(restored !== null || result.entry === null);
    });
    return () => { active = false; };
  }, [moduleId, stateKey]);

  const setDraft = useCallback((update: PersistedActivityUpdater<T>) => {
    if (!hydrated) return null;
    const next = resolve(stateRef.current, update);
    if (next === null) return null;
    stateRef.current = next; setState(next); return next;
  }, [hydrated]);

  const commit = useCallback((eventName: string, update: PersistedActivityUpdater<T>, properties: Record<string, unknown> = {}) => {
    if (!hydrated) return null;
    const next = resolve(stateRef.current, update);
    if (next === null) return null;
    stateRef.current = next; setState(next);
    if (persistenceAvailable === true) emitTelemetry(eventName, elementRef.current?.() ?? null, { ...properties, state_key: stateKey, state: next });
    return next;
  }, [hydrated, persistenceAvailable, stateKey]);

  return { state, stateRef, hydrated, persistenceAvailable, setDraft, commit };
}
