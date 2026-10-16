import moduleAssetOutline from '../../outlines.json';
import { moduleAssetUrl } from '../../../shared/react/assets';
import { useEffect, useRef, useState } from 'react';
import { ContentBlock, Typography } from '../../../shared/react';
import './ImageHistogramsPage.css';
const photo = moduleAssetUrl(moduleAssetOutline.moduleIdentity.id, 'images/digital-image-cat-scene.png');
const COLS = 80, ROWS = 64, TOTAL = COLS * ROWS;
const STAGE_W = 1500, STAGE_H = 590;
const IMAGE = { x: 20, y: 40, width: 600, height: 480 };
const PLOT = { x: 830, y: 60, width: 610, height: 440 };
const DISPATCH_MS = 6200, FLIGHT_MS = 170;
type Phase = 'idle' | 'running' | 'paused' | 'stepping' | 'complete';
type Source = { gray: Uint8Array; ranks: Uint16Array; fullCounts: number[]; image: HTMLCanvasElement; ymax: number };
type Flight = { index: number; age: number; duration: number };
type Engine = { dispatchBudget: number; sent: number; arrived: number; counts: number[]; flights: Flight[]; queuedSteps: number };
const fresh = (): Engine => ({ dispatchBudget: 0, sent: 0, arrived: 0, counts: Array(256).fill(0), flights: [], queuedSteps: 0 });
const dispatch = (state: Engine, duration: number) => { if (state.sent < TOTAL) state.flights.push({ index: state.sent++, age: 0, duration }); };
export function ImageHistogramsPage() {
  const [source, setSource] = useState<Source>(), [failed, setFailed] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle'), [progress, setProgress] = useState({ sent: 0, arrived: 0 }), [counts, setCounts] = useState<number[]>(Array(256).fill(0));
  const canvas = useRef<HTMLCanvasElement>(null), engine = useRef<Engine>(fresh());
  useEffect(() => {
    let active = true; const image = new Image(); image.crossOrigin = 'anonymous';
    image.onload = () => {
      if (!active) return;
      const small = document.createElement('canvas'); small.width = COLS; small.height = ROWS;
      const ctx = small.getContext('2d')!;
      ctx.drawImage(image, image.width * .2, image.height * .18, image.width * .6, image.width * .5, 0, 0, COLS, ROWS);
      const data = ctx.getImageData(0, 0, COLS, ROWS), gray = new Uint8Array(TOTAL), ranks = new Uint16Array(TOTAL), fullCounts = Array(256).fill(0);
      for (let i = 0; i < TOTAL; i++) { const offset = i * 4, value = Math.round(.299 * data.data[offset] + .587 * data.data[offset + 1] + .114 * data.data[offset + 2]); gray[i] = value; ranks[i] = ++fullCounts[value]; data.data.set([value, value, value, 255], offset); }
      ctx.putImageData(data, 0, 0);
      const ymax = Math.ceil(Math.max(...fullCounts) / 10) * 10;
      setSource({ gray, ranks, fullCounts, image: small, ymax });
    };
    image.onerror = () => { if (active) setFailed(true); }; image.src = photo;
    return () => { active = false; };
  }, []);
  const paint = (data: Source, state: Engine) => {
    const ctx = canvas.current?.getContext('2d'); if (!ctx) return;
    ctx.clearRect(0, 0, STAGE_W, STAGE_H);
    ctx.fillStyle = '#f7f9fc'; ctx.fillRect(IMAGE.x, IMAGE.y, IMAGE.width, IMAGE.height);
    ctx.imageSmoothingEnabled = false; ctx.globalAlpha = .13;
    ctx.drawImage(data.image, IMAGE.x, IMAGE.y, IMAGE.width, IMAGE.height); ctx.globalAlpha = 1;
    const cellW = IMAGE.width / COLS, cellH = IMAGE.height / ROWS;
    for (let i = state.sent; i < TOTAL; i++) {
      const value = data.gray[i]; ctx.fillStyle = `rgb(${value},${value},${value})`;
      ctx.fillRect(IMAGE.x + (i % COLS) * cellW, IMAGE.y + Math.floor(i / COLS) * cellH, cellW + .15, cellH + .15);
    }
    ctx.strokeStyle = '#d1dfed'; ctx.lineWidth = 1; ctx.strokeRect(IMAGE.x, IMAGE.y, IMAGE.width, IMAGE.height);
    for (const flight of state.flights) {
      const i = flight.index, t = Math.max(0, Math.min(1, flight.age / flight.duration));
      const value = data.gray[i], startX = IMAGE.x + (i % COLS + .5) * cellW, startY = IMAGE.y + (Math.floor(i / COLS) + .5) * cellH;
      const endX = PLOT.x + (value + .5) / 256 * PLOT.width, endY = PLOT.y + PLOT.height - data.ranks[i] / data.ymax * PLOT.height;
      const eased = 1 - (1 - t) ** 2, x = startX + (endX - startX) * eased, y = startY + (endY - startY) * eased - Math.sin(Math.PI * t) * 45;
      const size = 6 * (1 - t) + 2 * t;
      ctx.fillStyle = `rgb(${value},${value},${value})`; ctx.fillRect(x - size / 2, y - size / 2, size, size);
      ctx.strokeStyle = '#2787f8'; ctx.lineWidth = .7; ctx.strokeRect(x - size / 2, y - size / 2, size, size);
    }
  };
  useEffect(() => { if (source) paint(source, engine.current); }, [source]);
  useEffect(() => {
    if (!source || (phase !== 'running' && phase !== 'stepping')) return;
    let frame = 0, previous: number | undefined;
    const tick = (now: number) => {
      const current = engine.current, dt = previous === undefined ? 0 : Math.min(100, now - previous);
      previous = now;
      if (phase === 'running') {
        current.flights.forEach(flight => { flight.age += dt; });
        current.dispatchBudget += dt / DISPATCH_MS * TOTAL;
        const send = Math.floor(current.dispatchBudget); current.dispatchBudget -= send;
        for (let i = 0; i < send && current.sent < TOTAL; i++) dispatch(current, FLIGHT_MS);
      } else {
        // Only the oldest pixel advances; every other in-flight pixel remains paused.
        if (!current.flights.length && current.queuedSteps > 0) dispatch(current, 450);
        if (current.flights[0]) current.flights[0].age += dt;
      }
      while (current.flights[0] && current.flights[0].age >= current.flights[0].duration) {
        const flight = current.flights.shift()!;
        current.counts[source.gray[flight.index]]++; current.arrived++;
        if (phase === 'stepping') { current.queuedSteps--; break; }
      }
      paint(source, current); setCounts([...current.counts]); setProgress({ sent: current.sent, arrived: current.arrived });
      if (current.arrived === TOTAL) setPhase('complete');
      else if (phase === 'stepping' && current.queuedSteps === 0) setPhase('paused');
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame);
  }, [source, phase]);
  const reset = () => { engine.current = fresh(); setCounts(Array(256).fill(0)); setProgress({ sent: 0, arrived: 0 }); setPhase('idle'); if (source) paint(source, engine.current); };
  const convert = () => {
    if (!source) return;
    if (phase === 'running') setPhase('paused');
    else {
      if (phase === 'complete') { engine.current = fresh(); setCounts(Array(256).fill(0)); setProgress({ sent: 0, arrived: 0 }); }
      engine.current.queuedSteps = 0; setPhase('running');
    }
  };
  const convertOne = () => {
    if (!source || phase === 'running' || phase === 'complete') return;
    const current = engine.current;
    // Rapid repeated clicks are queued rather than dropped, one arrival per click.
    if (current.queuedSteps >= TOTAL - current.arrived) return;
    current.queuedSteps++;
    if (!current.flights.length) dispatch(current, 450);
    paint(source, current); setProgress({ sent: current.sent, arrived: current.arrived }); setPhase('stepping');
  };
  const ymax = source?.ymax ?? 100;
  const text = (x: number, y: number, width: number, value: string, align: 'start' | 'center' | 'end' = 'center') => <foreignObject x={x} y={y} width={width} height={45}><Typography variant="bodySmall" tone="muted" align={align}>{value}</Typography></foreignObject>;
  return <ContentBlock className="di-histogram" title="直方图" subtitle="把每个像素按灰度值归到一起，就得到整幅图的灰度分布。" headingLevel={1}>
    <div className="di-histogram__body" data-ready={!!source} data-phase={phase} data-sent={progress.sent} data-arrived={progress.arrived}>
      <div className="di-histogram__headings"><Typography as="h2" variant="h3" tone="accent">灰度图像</Typography><Typography as="h2" variant="h3" tone="accent">灰度直方图</Typography></div>
      <div className="di-histogram__stage">
        <svg preserveAspectRatio="none" viewBox={`0 0 ${STAGE_W} ${STAGE_H}`} aria-label={`灰度直方图，横轴灰度值，纵轴像素个数，已计数 ${progress.arrived} 个像素`} role="img">
          <defs><marker id="di-histogram-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#53708f" /></marker></defs>
          {[.25, .5, .75, 1].map(f => <path key={f} d={`M${PLOT.x} ${PLOT.y + PLOT.height * (1 - f)}H${PLOT.x + PLOT.width}`} stroke="#e2ebf5" strokeDasharray="4 5" />)}
          {counts.map((count, gray) => <rect key={gray} className="di-histogram__bar" data-gray={gray} data-count={count} x={PLOT.x + gray / 256 * PLOT.width} y={PLOT.y + PLOT.height - count / ymax * PLOT.height} width={PLOT.width / 256 - .25} height={count / ymax * PLOT.height} fill="#3f83c8" />)}
          <path d={`M${PLOT.x} ${PLOT.y + PLOT.height}V${PLOT.y - 10}M${PLOT.x} ${PLOT.y + PLOT.height}H${PLOT.x + PLOT.width + 10}`} fill="none" stroke="#53708f" strokeWidth="2" markerEnd="url(#di-histogram-arrow)" /><path d={`M${PLOT.x} ${PLOT.y + 5}V${PLOT.y - 10}`} stroke="#53708f" strokeWidth="2" markerEnd="url(#di-histogram-arrow)" />
          {text(PLOT.x - 75, 0, 165, '像素个数')}{text(PLOT.x - 69, PLOT.y - 20, 59, String(ymax), 'end')}{text(PLOT.x - 69, PLOT.y + PLOT.height / 2 - 20, 59, String(ymax / 2), 'end')}{text(PLOT.x - 52, PLOT.y + PLOT.height - 20, 42, '0', 'end')}
          {[0, 64, 128, 192, 255].map(gray => <g key={gray}><path d={`M${PLOT.x + (gray + .5) / 256 * PLOT.width} ${PLOT.y + PLOT.height}v6`} stroke="#53708f" />{text(PLOT.x + (gray + .5) / 256 * PLOT.width - 30, PLOT.y + PLOT.height + 7, 60, String(gray))}</g>)}
          {text(PLOT.x + PLOT.width / 2 - 75, PLOT.y + PLOT.height + 43, 150, '灰度值')}
        </svg>
        <canvas ref={canvas} width={STAGE_W} height={STAGE_H} aria-label="像素从灰度图快速移动到对应直方图位置的动画" />
      </div>
      <div className="di-histogram__controls"><button type="button" className="di-histogram__convert" disabled={!source} onClick={convert}><Typography variant="bodySmall" tone="inherit">{phase === 'running' ? '暂停' : phase === 'paused' || phase === 'stepping' ? '继续全部' : phase === 'complete' ? '重新转换全部' : '转换全部'}</Typography></button><button type="button" disabled={!source || phase === 'running' || phase === 'complete'} onClick={convertOne}><Typography variant="bodySmall" tone="accent">转换一个</Typography></button><button type="button" disabled={!source} onClick={reset}><Typography variant="bodySmall" tone="accent">重置</Typography></button><Typography variant="bodySmall" tone="muted" aria-live={phase === 'running' ? 'off' : 'polite'}>{phase === 'complete' ? `转换完成 · ${TOTAL.toLocaleString()} 个像素` : `已计数 ${progress.arrived.toLocaleString()} / ${TOTAL.toLocaleString()}`}</Typography></div>
      <footer className="di-histogram__takeaway"><Typography variant="body" tone="accent">{failed ? '图像加载失败，请刷新重试。' : phase === 'complete' ? '像素的位置消失了，灰度值的分布留下来了。' : '灰度值相同的像素，会累积到同一个柱子里。'}</Typography></footer>
    </div>
  </ContentBlock>;
}
