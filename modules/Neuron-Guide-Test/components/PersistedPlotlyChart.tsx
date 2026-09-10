import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import {
  currentModuleId,
  PlotlyChart,
  type PlotlyChartProps,
  type PlotlyGraph,
  type PlotlyLayout,
} from '../../shared/react';
import { usePersistedActivity } from './usePersistedActivity';

export interface PersistedPlotViewState {
  version: 1;
  patch: Record<string, unknown>;
}

export interface PersistedPlotlyChartProps
  extends Omit<PlotlyChartProps, 'layout' | 'onGraphReady'> {
  persistenceKey: string;
  moduleId?: string;
  layout?: PlotlyLayout;
  debounceMs?: number;
  onGraphReady?: (graph: PlotlyGraph, host: HTMLDivElement) => void;
}

const axisViewPattern = /^(?:(?:scene\d*\.)?[xyz]axis\d*)\.(?:range(?:\[[01]\])?|autorange)$/;
const cameraViewPattern = /^scene\d*\.camera(?:\.[a-z0-9_.-]+)?$/i;

function initialPlotView(): PersistedPlotViewState {
  return { version: 1, patch: {} };
}

function cloneSerializable(value: unknown): unknown {
  if (
    value === null
    || typeof value === 'string'
    || typeof value === 'number'
    || typeof value === 'boolean'
  ) {
    return value;
  }
  if (Array.isArray(value)) return value.map(cloneSerializable);
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined && typeof entry !== 'function')
        .map(([key, entry]) => [key, cloneSerializable(entry)]),
    );
  }
  return null;
}

function isPersistableViewKey(key: string) {
  return axisViewPattern.test(key) || cameraViewPattern.test(key);
}

function normalizePlotView(stored: unknown): PersistedPlotViewState | null {
  if (!stored || typeof stored !== 'object') return null;
  const patchValue = (stored as Partial<PersistedPlotViewState>).patch;
  if (!patchValue || typeof patchValue !== 'object' || Array.isArray(patchValue)) {
    return null;
  }
  const patch = Object.fromEntries(
    Object.entries(patchValue)
      .filter(([key]) => isPersistableViewKey(key))
      .map(([key, value]) => [key, cloneSerializable(value)]),
  );
  return { version: 1, patch };
}

function eventViewPatch(event: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(event)
      .filter(([key]) => isPersistableViewKey(key))
      .map(([key, value]) => [key, cloneSerializable(value)]),
  );
}

function axisPrefix(key: string) {
  const match = key.match(/^(.+)\.(?:range(?:\[[01]\])?|autorange)$/);
  return match?.[1] ?? null;
}

function mergeViewPatch(
  current: Record<string, unknown>,
  update: Record<string, unknown>,
) {
  const merged = { ...current };
  for (const [key, value] of Object.entries(update)) {
    const prefix = axisPrefix(key);
    if (prefix) {
      if (key.endsWith('.autorange')) {
        delete merged[`${prefix}.range`];
        delete merged[`${prefix}.range[0]`];
        delete merged[`${prefix}.range[1]`];
      } else {
        delete merged[`${prefix}.autorange`];
      }
    }
    if (cameraViewPattern.test(key) && key.split('.').length === 2) {
      for (const existing of Object.keys(merged)) {
        if (existing.startsWith(`${key}.`)) delete merged[existing];
      }
    }
    merged[key] = value;
  }
  return merged;
}

function pathParts(path: string): Array<string | number> {
  return path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter(Boolean)
    .map((part) => /^\d+$/.test(part) ? Number(part) : part);
}

type MutableViewContainer = Record<string, unknown> | unknown[];

function readContainer(
  container: MutableViewContainer,
  key: string | number,
): unknown {
  if (Array.isArray(container) && typeof key === 'number') {
    return container[key];
  }
  return (container as Record<string, unknown>)[String(key)];
}

function writeContainer(
  container: MutableViewContainer,
  key: string | number,
  value: unknown,
) {
  if (Array.isArray(container) && typeof key === 'number') {
    container[key] = value;
    return;
  }
  (container as Record<string, unknown>)[String(key)] = value;
}

function applyPath(target: Record<string, unknown>, path: string, value: unknown) {
  const parts = pathParts(path);
  let cursor: MutableViewContainer = target;
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    const final = index === parts.length - 1;
    if (final) {
      writeContainer(cursor, part, value);
      return;
    }
    const nextPart = parts[index + 1];
    const existing = readContainer(cursor, part);
    const next = Array.isArray(existing)
      ? [...existing]
      : existing && typeof existing === 'object'
        ? { ...(existing as Record<string, unknown>) }
        : typeof nextPart === 'number'
          ? []
          : {};
    writeContainer(cursor, part, next);
    cursor = next;
  }
}

function layoutWithView(
  layout: PlotlyLayout | undefined,
  patch: Record<string, unknown>,
): PlotlyLayout | undefined {
  if (Object.keys(patch).length === 0) return layout;
  const restored: PlotlyLayout = { ...(layout ?? {}) };
  for (const [path, value] of Object.entries(patch)) {
    applyPath(restored, path, value);
  }
  return restored;
}

/**
 * Shared Plotly chart with a module-private persisted viewport adapter.
 * Restore happens before `newPlot`; resize/autosize relayout events are filtered,
 * while user camera/range changes are debounced into one semantic event.
 */
export function PersistedPlotlyChart({
  persistenceKey,
  moduleId = currentModuleId(),
  layout,
  debounceMs = 180,
  onGraphReady,
  className,
  style,
  minHeight = 260,
  ...chartProps
}: PersistedPlotlyChartProps) {
  const stateKey = persistenceKey.startsWith('view:')
    ? persistenceKey
    : `view:${persistenceKey}`;
  const hostRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const readyFramesRef = useRef<number[]>([]);
  const acceptRelayoutRef = useRef(false);
  const userInteractionUntilRef = useRef(0);
  const interactionCleanupRef = useRef<(() => void) | null>(null);
  const latestViewRef = useRef<PersistedPlotViewState | null>(null);
  const activeStateKeyRef = useRef(stateKey);
  const externalReadyRef = useRef(onGraphReady);
  externalReadyRef.current = onGraphReady;

  if (activeStateKeyRef.current !== stateKey) {
    activeStateKeyRef.current = stateKey;
    latestViewRef.current = null;
  }

  const activity = usePersistedActivity<PersistedPlotViewState>({
    stateKey,
    moduleId,
    createInitial: initialPlotView,
    normalizeState: normalizePlotView,
    getElement: () => hostRef.current,
  });

  if (activity.hydrated && latestViewRef.current === null && activity.state) {
    latestViewRef.current = activity.state;
  }

  const restoredLayout = useMemo(
    () => layoutWithView(layout, latestViewRef.current?.patch ?? {}),
    // Hydration changes from false to true exactly once for this state key. The
    // live patch is held in a ref so committing a view does not rebuild Plotly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activity.hydrated, layout, stateKey],
  );

  const handleGraphReady = useCallback((
    graph: PlotlyGraph,
    host: HTMLDivElement,
  ) => {
    hostRef.current = host;
    acceptRelayoutRef.current = false;
    userInteractionUntilRef.current = 0;
    interactionCleanupRef.current?.();
    let pointerActive = false;
    const markUserInteraction = () => {
      userInteractionUntilRef.current = window.performance.now() + 1200;
    };
    const handlePointerDown = () => {
      pointerActive = true;
      markUserInteraction();
    };
    const handlePointerMove = () => {
      if (pointerActive) markUserInteraction();
    };
    const handlePointerEnd = () => {
      pointerActive = false;
      markUserInteraction();
    };
    host.addEventListener('pointerdown', handlePointerDown);
    host.addEventListener('pointermove', handlePointerMove);
    host.addEventListener('pointerup', handlePointerEnd);
    host.addEventListener('pointercancel', handlePointerEnd);
    host.addEventListener('wheel', markUserInteraction, { passive: true });
    host.addEventListener('dblclick', markUserInteraction);
    interactionCleanupRef.current = () => {
      host.removeEventListener('pointerdown', handlePointerDown);
      host.removeEventListener('pointermove', handlePointerMove);
      host.removeEventListener('pointerup', handlePointerEnd);
      host.removeEventListener('pointercancel', handlePointerEnd);
      host.removeEventListener('wheel', markUserInteraction);
      host.removeEventListener('dblclick', markUserInteraction);
    };
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    readyFramesRef.current.forEach((frame) => window.cancelAnimationFrame(frame));
    readyFramesRef.current = [];

    graph.on?.('plotly_relayout', (event) => {
      if (!acceptRelayoutRef.current) return;
      if (window.performance.now() > userInteractionUntilRef.current) return;
      const update = eventViewPatch(event);
      if (Object.keys(update).length === 0) return;
      const current = latestViewRef.current ?? initialPlotView();
      const next: PersistedPlotViewState = {
        version: 1,
        patch: mergeViewPatch(current.patch, update),
      };
      latestViewRef.current = next;
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        activity.commit('activation_plot_view_commit', next, {
          plot_id: persistenceKey,
          changed_view_keys: Object.keys(update),
        });
        timerRef.current = null;
      }, Math.max(0, debounceMs));
    });

    const first = window.requestAnimationFrame(() => {
      const second = window.requestAnimationFrame(() => {
        acceptRelayoutRef.current = true;
        readyFramesRef.current = [];
      });
      readyFramesRef.current.push(second);
    });
    readyFramesRef.current.push(first);
    externalReadyRef.current?.(graph, host);
  }, [activity.commit, debounceMs, persistenceKey]);

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    readyFramesRef.current.forEach((frame) => window.cancelAnimationFrame(frame));
    interactionCleanupRef.current?.();
    interactionCleanupRef.current = null;
    timerRef.current = null;
    readyFramesRef.current = [];
    acceptRelayoutRef.current = false;
    userInteractionUntilRef.current = 0;
    hostRef.current = null;
  }, []);

  if (!activity.hydrated) {
    return (
      <div
        ref={hostRef}
        className={['shared-plotly', className].filter(Boolean).join(' ')}
        style={{ minHeight, ...style }}
        data-state-key={stateKey}
        data-telemetry-manual
        aria-busy="true"
        aria-label={chartProps['aria-label']}
      />
    );
  }

  // The chart is teaching content, so a temporary viewport-state outage must
  // not hide it. In fallback mode the adapter keeps view changes in memory
  // without emitting Telemetry events.
  return (
    <PlotlyChart
      {...chartProps}
      className={className}
      style={style}
      minHeight={minHeight}
      layout={restoredLayout}
      onGraphReady={handleGraphReady}
      data-state-key={stateKey}
      data-telemetry-manual
    />
  );
}
