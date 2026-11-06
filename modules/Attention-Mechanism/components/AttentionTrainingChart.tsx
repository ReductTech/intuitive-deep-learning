import { useEffect, useLayoutEffect, useRef } from 'react';
import { EChartsChart, type EChartsChartProps, type EChartsOption } from '../../shared/react';

interface ExistingChart {
  setOption(option: EChartsOption): void;
  isDisposed?: () => boolean;
}
interface EChartsLookup {
  getInstanceByDom(element: HTMLElement): ExistingChart | undefined;
}
const READY_WAIT_MS = 5000;

function currentChart(host: HTMLElement | null): ExistingChart | undefined {
  if (!host) return undefined;
  // getInstanceByDom is exported by the bundled ECharts 5.6.0 runtime.
  const library = window.echarts as (typeof window.echarts & Partial<EChartsLookup>);
  const chart = library?.getInstanceByDom?.(host);
  return chart && !chart.isDisposed?.() ? chart : undefined;
}

/**
 * Keeps Shared's loader, ResizeObserver and disposal intact while reusing its
 * chart instance for live training data. This component never initializes or
 * disposes a chart and never starts model training.
 */
export function AttentionTrainingChart({ option, ...props }: EChartsChartProps) {
  const root = useRef<HTMLDivElement>(null);
  const latestOption = useRef(option);
  // Own only this top-level copy; never mutate the caller's option or data.
  // Its stable identity prevents Shared's [option] effect from recreating canvas.
  const initialOption = useRef<EChartsOption>({ ...option });

  useLayoutEffect(() => {
    latestOption.current = option;
    // If Shared's asynchronous loader finishes later, it still sees the newest
    // complete option through its captured reference, even after polling stops.
    for (const key of Object.keys(initialOption.current)) {
      if (!Object.prototype.hasOwnProperty.call(option, key)) delete initialOption.current[key];
    }
    Object.assign(initialOption.current, option);
    const host = root.current?.querySelector<HTMLElement>('.shared-echarts') ?? null;
    currentChart(host)?.setOption(option);
  }, [option]);

  useEffect(() => {
    let cancelled = false;
    let frame: number | undefined;
    const deadline = performance.now() + READY_WAIT_MS;
    const synchronizeWhenReady = () => {
      frame = undefined;
      if (cancelled) return;
      const host = root.current?.querySelector<HTMLElement>('.shared-echarts') ?? null;
      const chart = currentChart(host);
      if (chart) {
        chart.setOption(latestOption.current);
        return;
      }
      if (!host?.isConnected || host.dataset.chartError === 'true' || performance.now() >= deadline) return;
      frame = requestAnimationFrame(synchronizeWhenReady);
    };
    synchronizeWhenReady();
    return () => {
      cancelled = true;
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={root} style={{ width: '100%', height: '100%', minWidth: 0, minHeight: 0 }}>
    <EChartsChart {...props} option={initialOption.current}/>
  </div>;
}
