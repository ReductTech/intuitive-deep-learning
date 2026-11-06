import { useCallback, useEffect, useMemo, useRef } from 'react';
import { PlotlyChart, type PlotlyGraph, type PlotlyLayout, type PlotlyTrace } from './PlotlyChart';

export interface FunctionSeries {
  id: string;
  fn: (x: number) => number;
  label?: string;
  hoverLabel?: string;
  endLabel?: string;
  endLabelPosition?: string;
  endLabelFontSize?: number;
  stroke?: string;
  strokeWidth?: number;
  dash?: string;
  opacity?: number;
}

export interface FunctionGuide {
  id: string;
  x: number;
  label?: string;
  stroke?: string;
  strokeWidth?: number;
  dash?: string;
}

export interface FunctionPlotProps {
  fn?: (x: number) => number;
  series?: FunctionSeries[];
  verticalGuides?: FunctionGuide[];
  className?: string;
  ariaLabel: string;
  minHeight?: number;
  initialCenter?: { x: number; y: number };
  initialScale?: { x: number; y: number };
  stroke?: string;
  xLabel?: string;
  yLabel?: string;
  showLegend?: boolean;
  fontScale?: number;
  axisTitleFontSize?: number;
  tickFontSize?: number;
  highlightSeriesId?: string | null;
}

interface Viewport {
  x: [number, number];
  y: [number, number];
}

const sampleCount = 1001;
const plotWidth = 760;
const plotHeight = 420;
const viewportOverscan = 2;

function numeric(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function eventRange(event: Record<string, unknown>, axis: 'xaxis' | 'yaxis', fallback: [number, number]): [number, number] {
  const direct = event[`${axis}.range`];
  if (Array.isArray(direct) && direct.length === 2) {
    const start = numeric(direct[0]);
    const end = numeric(direct[1]);
    if (start !== null && end !== null) return [start, end];
  }
  return [numeric(event[`${axis}.range[0]`]) ?? fallback[0], numeric(event[`${axis}.range[1]`]) ?? fallback[1]];
}

function plottedRange(host: HTMLElement, axis: 'xaxis' | 'yaxis', fallback: [number, number]): [number, number] {
  const fullLayout = (host as HTMLElement & { _fullLayout?: Record<string, { range?: unknown }> })._fullLayout;
  const range = fullLayout?.[axis]?.range;
  if (Array.isArray(range) && range.length === 2) {
    const start = numeric(range[0]);
    const end = numeric(range[1]);
    if (start !== null && end !== null) return [start, end];
  }
  return fallback;
}

function samplesFor([min, max]: [number, number]) {
  // Plotly translates the existing trace while the pointer is moving and only
  // emits the final viewport afterwards. Keep two extra viewports on either
  // side so an unbounded function never reveals a fake endpoint mid-pan; the
  // relayout handler then resamples around the new viewport.
  const padding = (max - min) * viewportOverscan;
  const start = min - padding;
  const end = max + padding;
  return Array.from({ length: sampleCount }, (_, index) => start + (end - start) * index / (sampleCount - 1));
}

function tracesFor(
  curves: FunctionSeries[],
  guides: FunctionGuide[],
  viewport: Viewport,
  fallbackStroke: string,
): PlotlyTrace[] {
  const x = samplesFor(viewport.x);
  const curveTraces = curves.map((curve) => ({
    type: 'scatter',
    mode: 'lines',
    name: curve.label,
    x,
    y: x.map(curve.fn),
    line: {
      color: curve.stroke ?? fallbackStroke,
      width: curve.strokeWidth ?? 4,
      dash: curve.dash,
    },
    opacity: curve.opacity ?? 1,
    hovertemplate: `${curve.hoverLabel ?? curve.label ?? ''}${curve.hoverLabel || curve.label ? '<br>' : ''}x = %{x:.4g}<br>y = %{y:.4g}<extra></extra>`,
  }));
  const y = samplesFor(viewport.y);
  const guideTraces = guides.map((guide) => ({
    type: 'scatter',
    mode: 'lines',
    name: guide.label,
    showlegend: false,
    x: [guide.x, guide.x],
    y: [y[0], y[y.length - 1]],
    line: {
      color: guide.stroke ?? 'rgba(196, 63, 82, 0.52)',
      width: guide.strokeWidth ?? 1.6,
      dash: guide.dash ?? 'dash',
    },
    hovertemplate: `${guide.label ? `${guide.label}<br>` : ''}x = %{x:.4g}<extra></extra>`,
  }));
  const labelX = viewport.x[0] + (viewport.x[1] - viewport.x[0]) * 0.96;
  const labelTraces = curves.flatMap((curve) => curve.endLabel ? [{
    type: 'scatter',
    mode: 'text',
    name: `${curve.id}-label`,
    showlegend: false,
    hoverinfo: 'skip',
    x: [labelX],
    y: [curve.fn(labelX)],
    text: [curve.endLabel],
    textposition: curve.endLabelPosition ?? 'middle left',
    textfont: {
      color: curve.stroke ?? fallbackStroke,
      size: curve.endLabelFontSize ?? 18,
    },
    opacity: curve.opacity ?? 1,
  }] : []);
  return [...curveTraces, ...guideTraces, ...labelTraces];
}

/** Plotly-backed function graph. Single and multi-function views share hover, pan, zoom and resampling behavior. */
export function FunctionPlot({
  fn,
  series,
  verticalGuides,
  className,
  ariaLabel,
  minHeight = 300,
  initialCenter = { x: 0, y: .5 },
  initialScale = { x: .025, y: .004 },
  stroke = '#f07e47',
  xLabel = 'x',
  yLabel = 'y',
  showLegend = false,
  fontScale = 1,
  axisTitleFontSize,
  tickFontSize,
  highlightSeriesId = null,
}: FunctionPlotProps) {
  const initialViewport = useMemo<Viewport>(() => ({
    x: [initialCenter.x - plotWidth * initialScale.x / 2, initialCenter.x + plotWidth * initialScale.x / 2],
    y: [initialCenter.y - plotHeight * initialScale.y / 2, initialCenter.y + plotHeight * initialScale.y / 2],
  }), [initialCenter.x, initialCenter.y, initialScale.x, initialScale.y]);
  const resampleTimerRef = useRef<number | null>(null);
  const viewportRef = useRef(initialViewport);
  const curves = useMemo<FunctionSeries[]>(() => series?.length ? series : fn ? [{ id: 'function', fn, stroke }] : [], [fn, series, stroke]);
  const guides = useMemo<FunctionGuide[]>(() => verticalGuides ?? [], [verticalGuides]);
  const curvesRef = useRef(curves);
  const guidesRef = useRef(guides);
  const strokeRef = useRef(stroke);
  const graphHostRef = useRef<HTMLElement | null>(null);
  const highlightSeriesIdRef = useRef(highlightSeriesId);
  const resolvedLegendFontSize = 11 * fontScale;
  const resolvedAxisTitleFontSize = axisTitleFontSize ?? 13 * fontScale;
  const resolvedTickFontSize = tickFontSize ?? 11 * fontScale;
  useEffect(() => { curvesRef.current = curves; }, [curves]);
  useEffect(() => { guidesRef.current = guides; }, [guides]);
  useEffect(() => { strokeRef.current = stroke; }, [stroke]);
  highlightSeriesIdRef.current = highlightSeriesId;
  const data = useMemo<PlotlyTrace[]>(() => tracesFor(curves, guides, initialViewport, stroke), [curves, guides, initialViewport, stroke]);
  const layout = useMemo<PlotlyLayout>(() => ({
    paper_bgcolor: '#fbfdff',
    plot_bgcolor: '#fbfdff',
    margin: {
      l: Math.max(58, resolvedTickFontSize * 2.1 + resolvedAxisTitleFontSize + 10),
      r: 22,
      t: 18,
      b: showLegend
        ? Math.max(72, resolvedTickFontSize + resolvedAxisTitleFontSize + resolvedLegendFontSize + 38)
        : Math.max(56, resolvedTickFontSize + resolvedAxisTitleFontSize + 22),
    },
    font: { family: 'Inter, Segoe UI, sans-serif', color: '#27446e', size: 12 * fontScale },
    hovermode: 'closest',
    dragmode: 'pan',
    showlegend: showLegend,
    legend: showLegend ? { orientation: 'h', y: -0.24, font: { size: resolvedLegendFontSize } } : undefined,
    xaxis: { title: { text: xLabel, font: { size: resolvedAxisTitleFontSize } }, tickfont: { size: resolvedTickFontSize }, range: initialViewport.x, gridcolor: '#dfe6f1', zerolinecolor: '#68778f', linecolor: '#9fb0c8' },
    yaxis: { title: { text: yLabel, font: { size: resolvedAxisTitleFontSize } }, tickfont: { size: resolvedTickFontSize }, range: initialViewport.y, gridcolor: '#dfe6f1', zerolinecolor: '#68778f', linecolor: '#9fb0c8' },
  }), [fontScale, initialViewport, resolvedAxisTitleFontSize, resolvedLegendFontSize, resolvedTickFontSize, showLegend, xLabel, yLabel]);
  const applySeriesHighlight = useCallback((host: HTMLElement) => {
    const currentCurves = curvesRef.current;
    const currentGuides = guidesRef.current;
    const highlightedId = highlightSeriesIdRef.current;
    const curveIndices = currentCurves.map((_, index) => index);
    const curveOpacity = currentCurves.map((curve) => (
      highlightedId === null || curve.id === highlightedId ? curve.opacity ?? 1 : .18
    ));
    void window.Plotly?.restyle?.(host, { opacity: curveOpacity }, curveIndices);

    let labelOffset = 0;
    const labelIndices: number[] = [];
    const labelOpacity: number[] = [];
    currentCurves.forEach((curve) => {
      if (!curve.endLabel) return;
      labelIndices.push(currentCurves.length + currentGuides.length + labelOffset);
      labelOpacity.push(highlightedId === null || curve.id === highlightedId ? curve.opacity ?? 1 : .18);
      labelOffset += 1;
    });
    if (labelIndices.length) void window.Plotly?.restyle?.(host, { opacity: labelOpacity }, labelIndices);
  }, []);

  useEffect(() => {
    if (graphHostRef.current) applySeriesHighlight(graphHostRef.current);
  }, [applySeriesHighlight, highlightSeriesId]);

  const handleGraphReady = useCallback((graph: PlotlyGraph, host: HTMLElement) => {
    graphHostRef.current = host;
    applySeriesHighlight(host);
    graph.on?.('plotly_relayout', (event) => {
      const eventSnapshot = { ...event };
      const current = viewportRef.current;
      const x = plottedRange(host, 'xaxis', eventRange(eventSnapshot, 'xaxis', current.x));
      const y = plottedRange(host, 'yaxis', eventRange(eventSnapshot, 'yaxis', current.y));
      if (resampleTimerRef.current !== null) window.clearTimeout(resampleTimerRef.current);
      resampleTimerRef.current = window.setTimeout(() => {
        viewportRef.current = { x, y };
        const traces = tracesFor(curvesRef.current, guidesRef.current, { x, y }, strokeRef.current);
        window.Plotly?.restyle?.(host, {
          x: traces.map((trace) => trace.x),
          y: traces.map((trace) => trace.y),
        });
        resampleTimerRef.current = null;
      }, 140);
    });
  }, [applySeriesHighlight]);

  useEffect(() => () => {
    if (resampleTimerRef.current !== null) window.clearTimeout(resampleTimerRef.current);
    graphHostRef.current = null;
  }, []);

  return <PlotlyChart className={className} data={data} layout={layout} minHeight={minHeight} aria-label={ariaLabel} onGraphReady={handleGraphReady} />;
}
