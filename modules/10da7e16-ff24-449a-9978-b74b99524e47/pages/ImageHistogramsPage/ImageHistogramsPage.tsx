import moduleAssetOutline from '../../outlines.json';
import { moduleAssetUrl } from "@shuku/course-runtime/react/assets";
import { useEffect, useRef, useState } from 'react';
import { ContentBlock, Typography } from "@shuku/course-style/react";
import './ImageHistogramsPage.css';
const photo = moduleAssetUrl("images/digital-image-cat-scene.webp");
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
  const text = (x: number, y: number, width: number, value: string, align: 'start' | 'center' | 'end' = 'center') => <foreignObject shuku-edit-id="e-5fd4a411-7346-48b3-9800-f5f702cd0466" x={x} y={y} width={width} height={45}><Typography shuku-edit-id="e-85e9f1b5-7627-42ca-afe1-7ac6d9eca1d1" variant="bodySmall" tone="muted" align={align}>{value}</Typography></foreignObject>;
  return <ContentBlock shuku-edit-id="e-3627f971-7678-4773-b31a-ecd815cb84f5" className="di-histogram" title="直方图" subtitle="把每个像素按灰度值归到一起，就得到整幅图的灰度分布。" headingLevel={1}>
    <div shuku-edit-id="e-5d86b7ac-94b5-43ee-aaf0-28c3feff9f93" className="di-histogram__body" data-ready={!!source} data-phase={phase} data-sent={progress.sent} data-arrived={progress.arrived}>
      <div shuku-edit-id="e-1035176a-78fa-4af4-857b-86923e19c4ee" className="di-histogram__headings"><Typography shuku-edit-id="e-1f823a70-cd9b-4338-9255-699b74c61055" as="h2" variant="h3" tone="accent">灰度图像</Typography><Typography shuku-edit-id="e-3fe14398-ed74-4541-bbc7-bc3c53602f17" as="h2" variant="h3" tone="accent">灰度直方图</Typography></div>
      <div shuku-edit-id="e-577330ad-7814-4214-b384-e66b2bc11529" className="di-histogram__stage">
        <svg shuku-edit-id="e-a39371cb-62ff-4cb6-bdf8-a99b66e5f360" preserveAspectRatio="none" viewBox={`0 0 ${STAGE_W} ${STAGE_H}`} aria-label={`灰度直方图，横轴灰度值，纵轴像素个数，已计数 ${progress.arrived} 个像素`} role="img">
          <defs shuku-edit-id="e-e13c9bde-4aff-4df7-977c-e6e1148fdbe5"><marker shuku-edit-id="e-f2d54daf-0f0c-4789-9ec2-8620bd3cf99a" id="di-histogram-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path shuku-edit-id="e-5e6729a8-b811-4850-8b8f-5b28aa932da8" d="M0 0L10 5L0 10Z" fill="#53708f" /></marker></defs>
          {[.25, .5, .75, 1].map(f => <path shuku-edit-id="e-407458c3-c2fc-46d9-85fd-3e7d7b9791c4" key={f} d={`M${PLOT.x} ${PLOT.y + PLOT.height * (1 - f)}H${PLOT.x + PLOT.width}`} stroke="#e2ebf5" strokeDasharray="4 5" />)}
          {counts.map((count, gray) => <rect shuku-edit-id="e-0c4b756b-14d8-4cbb-9b4b-43bac95b46da" key={gray} className="di-histogram__bar" data-gray={gray} data-count={count} x={PLOT.x + gray / 256 * PLOT.width} y={PLOT.y + PLOT.height - count / ymax * PLOT.height} width={PLOT.width / 256 - .25} height={count / ymax * PLOT.height} fill="#3f83c8" />)}
          <path shuku-edit-id="e-4ce68cbf-48e8-438d-8f87-9150f0490230" d={`M${PLOT.x} ${PLOT.y + PLOT.height}V${PLOT.y - 10}M${PLOT.x} ${PLOT.y + PLOT.height}H${PLOT.x + PLOT.width + 10}`} fill="none" stroke="#53708f" strokeWidth="2" markerEnd="url(#di-histogram-arrow)" /><path shuku-edit-id="e-0c087ada-9f27-418a-9fc1-1c95ea3cb5d1" d={`M${PLOT.x} ${PLOT.y + 5}V${PLOT.y - 10}`} stroke="#53708f" strokeWidth="2" markerEnd="url(#di-histogram-arrow)" />
          {text(PLOT.x - 75, 0, 165, '像素个数')}{text(PLOT.x - 69, PLOT.y - 20, 59, String(ymax), 'end')}{text(PLOT.x - 69, PLOT.y + PLOT.height / 2 - 20, 59, String(ymax / 2), 'end')}{text(PLOT.x - 52, PLOT.y + PLOT.height - 20, 42, '0', 'end')}
          {[0, 64, 128, 192, 255].map(gray => <g shuku-edit-id="e-b50357b1-a6ff-43bc-88a7-2df2ec4f929f" key={gray}><path shuku-edit-id="e-488dfbb8-7892-48e4-b7db-cf27d00a720a" d={`M${PLOT.x + (gray + .5) / 256 * PLOT.width} ${PLOT.y + PLOT.height}v6`} stroke="#53708f" />{text(PLOT.x + (gray + .5) / 256 * PLOT.width - 30, PLOT.y + PLOT.height + 7, 60, String(gray))}</g>)}
          {text(PLOT.x + PLOT.width / 2 - 75, PLOT.y + PLOT.height + 43, 150, '灰度值')}
        </svg>
        <canvas shuku-edit-id="e-00344110-a388-400e-90ed-c3fbddbbf3ce" ref={canvas} width={STAGE_W} height={STAGE_H} aria-label="像素从灰度图快速移动到对应直方图位置的动画" />
      </div>
      <div shuku-edit-id="e-0bb35764-667f-4960-b941-00fd59bfd574" className="di-histogram__controls"><button shuku-edit-id="e-04da45b2-4dc2-4232-89c6-489bfb61ae50" type="button" className="di-histogram__convert" disabled={!source} onClick={convert}><Typography shuku-edit-id="e-f70a1331-ea3b-455a-b8ef-f39007948051" variant="bodySmall" tone="inherit">{phase === 'running' ? '暂停' : phase === 'paused' || phase === 'stepping' ? '继续全部' : phase === 'complete' ? '重新转换全部' : '转换全部'}</Typography></button><button shuku-edit-id="e-af2b4db3-4320-4a27-8682-9f2e33cbfd22" type="button" disabled={!source || phase === 'running' || phase === 'complete'} onClick={convertOne}><Typography shuku-edit-id="e-41c4da0c-ddfb-409e-ab95-775cc43ddfae" variant="bodySmall" tone="accent">转换一个</Typography></button><button shuku-edit-id="e-bbc05216-247d-47db-b4bf-7a78c2be9211" type="button" disabled={!source} onClick={reset}><Typography shuku-edit-id="e-198fd126-054c-4dff-a68e-8b6d65e6a0e3" variant="bodySmall" tone="accent">重置</Typography></button><Typography shuku-edit-id="e-4d8dd410-0f25-49b5-a61a-cf40d67697e4" variant="bodySmall" tone="muted" aria-live={phase === 'running' ? 'off' : 'polite'}>{phase === 'complete' ? `转换完成 · ${TOTAL.toLocaleString()} 个像素` : `已计数 ${progress.arrived.toLocaleString()} / ${TOTAL.toLocaleString()}`}</Typography></div>
      <footer shuku-edit-id="e-ef08b54c-9e6f-4181-a728-2f023415d213" className="di-histogram__takeaway"><Typography shuku-edit-id="e-f9952c2f-af40-41c7-b7f3-8f95b8d018cf" variant="body" tone="accent">{failed ? '图像加载失败，请刷新重试。' : phase === 'complete' ? '像素的位置消失了，灰度值的分布留下来了。' : '灰度值相同的像素，会累积到同一个柱子里。'}</Typography></footer>
    </div>
  </ContentBlock>;
}
