import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import { KernelFormula } from '../../components/KernelFormula';
import './ConvolutionSharedBackpropPage.css';

const X = [0.2, 0.4, 0.6, 0.8, 1, 0.5, 0.3, 0.7, 0.9];
const WINDOWS = [[0, 1, 3, 4], [1, 2, 4, 5], [3, 4, 6, 7], [4, 5, 7, 8]];
const FC = 0.5; // Frozen classifier: gradients flow through it, but these weights never change.
const RATE = 0.1;
const initial = () => [0.1, 0.1, 0.1, 0.1];
const fmt = (n: number) => (Math.sign(n) * Math.round((Math.abs(n) + Number.EPSILON) * 100) / 100).toFixed(2);
const index = (i: number) => `${Math.floor(i / 2) + 1}${i % 2 + 1}`;
const features = (k: number[]) => WINDOWS.map(w => w.reduce((s, p, j) => s + X[p] * k[j], 0));
const predict = (k: number[]) => features(k).reduce((s, v) => s + FC * v, 0);
const lossOf = (k: number[]) => 0.5 * (predict(k) - 1) ** 2;
const matrixLatex = (v: number[], visible = 4) => { const n = v.map((x, i) => i < visible ? fmt(x) : String.raw`\cdots`); return String.raw`\begin{bmatrix}${n[0]}&${n[1]}\\${n[2]}&${n[3]}\end{bmatrix}`; };
type Stage = 'forward' | 'gradient' | 'focus' | 'updated';
type Hover = { kind: 'window'; i: number } | { kind: 'total' } | null;

function Formula({ latex, className = '', tooltipPlacement }: { latex: string; className?: string; tooltipPlacement?: 'bottom' | 'top' }) {
  return <KernelFormula windowed tooltipPlacement={tooltipPlacement} className={`vfl-shared-formula ${className}`} latex={latex} />;
}

function Grid({ values, columns = 2, label, highlighted = [], visible = values.length, onSelect, changed = false }: {
  values: number[]; columns?: number; label: string; highlighted?: number[]; visible?: number; onSelect?: (i: number | null) => void; changed?: boolean;
}) {
  return <MathFormulaBlock appearance="plain" className="vfl-shared-matrix" ariaLabel={label}>
    <div shuku-edit-id="e-79c0d5ce-9f9e-4dd5-a369-acaa438fd0bb" className="vfl-shared-grid" style={{ '--vfl-shared-columns': columns } as CSSProperties}>
      {values.map((v, i) => <Button key={i} className={`vfl-shared-cell ${highlighted.includes(i) ? 'is-selected' : ''} ${i >= visible ? 'is-pending' : ''} ${changed && i < visible ? 'is-changed' : ''}`}
        aria-label={`${label}，第${Math.floor(i / columns) + 1}行第${i % columns + 1}列，${i < visible ? fmt(v) : '待计算'}`}
        onMouseEnter={() => onSelect?.(i)} onMouseLeave={() => onSelect?.(null)} onFocus={() => onSelect?.(i)} onBlur={() => onSelect?.(null)} onClick={() => onSelect?.(i)}>
        <MathFormulaStatic key={i < visible ? fmt(v) : 'pending'} latex={i < visible ? fmt(v) : String.raw`\cdots`} />
      </Button>)}
    </div>
  </MathFormulaBlock>;
}

export function ConvolutionSharedBackpropPage() {
  const [weights, setWeights] = useState(initial);
  const [snapshot, setSnapshot] = useState(initial);
  const [stage, setStage] = useState<Stage>('forward');
  const [busy, setBusy] = useState(false);
  const [count, setCount] = useState(0);
  const [updatedCount, setUpdatedCount] = useState(0);
  const [windowIndex, setWindowIndex] = useState<number | null>(null);
  const [cell, setCell] = useState<number | null>(null);
  const [hover, setHover] = useState<Hover>(null);
  const [previousLoss, setPreviousLoss] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const sceneRef = useRef<HTMLDivElement>(null);
  const [connections, setConnections] = useState<{ width: number; height: number; x: number; y: number; sources: { x: number; y: number }[] } | null>(null);
  useLayoutEffect(() => {
    const scene = sceneRef.current;
    if (!scene || stage === 'gradient' || stage === 'focus') return;
    const vector = scene.querySelector('.vfl-shared-vector');
    const output = scene.querySelector('.vfl-shared-output');
    if (!vector || !output) return;
    const measure = () => {
      const bounds = scene.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const sx = scene.clientWidth / bounds.width;
      const sy = scene.clientHeight / bounds.height;
      const target = output.getBoundingClientRect();
      const sources = Array.from(vector.querySelectorAll('.vfl-shared-cell')).map(element => {
        const rect = element.getBoundingClientRect();
        return { x: (rect.right - bounds.left) * sx, y: (rect.top + rect.height / 2 - bounds.top) * sy };
      });
      setConnections({ width: scene.clientWidth, height: scene.clientHeight, x: (target.left - bounds.left) * sx, y: (target.top + target.height / 2 - bounds.top) * sy, sources });
    };
    const observer = new ResizeObserver(measure);
    [scene, vector, output].forEach(element => observer.observe(element));
    // Follow the objects while they move back from the gradient view.
    let frame = 0;
    const until = performance.now() + 1050;
    const follow = () => { measure(); if (performance.now() < until) frame = requestAnimationFrame(follow); };
    follow();
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [stage]);
  const run = useRef(0);
  const locked = useRef(false);
  const popupHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timers = useRef(new Map<ReturnType<typeof setTimeout>, () => void>());
  const focus = stage === 'focus';
  const backward = stage === 'gradient';
  const oldY = predict(snapshot);
  const error = oldY - 1;
  const delta = error * FC;
  const contributions = WINDOWS.map(w => w.map(p => delta * X[p]));
  const total = [0, 1, 2, 3].map(j => contributions.reduce((s, g) => s + g[j], 0));
  const next = snapshot.map((v, j) => v - RATE * total[j]);
  const y = predict(weights);
  const outputs = features(weights);
  const loss = lossOf(weights);
  const selectedWindow = hover?.kind === 'window' ? hover.i : windowIndex;
  const cancel = () => {
    if (popupHideTimer.current !== null) clearTimeout(popupHideTimer.current);
    run.current += 1;
    timers.current.forEach((resolve, timer) => { clearTimeout(timer); resolve(); });
    timers.current.clear(); locked.current = false;
  };
  useEffect(() => () => {
    if (popupHideTimer.current !== null) clearTimeout(popupHideTimer.current);
    run.current += 1;
    timers.current.forEach((resolve, timer) => { clearTimeout(timer); resolve(); });
    timers.current.clear();
  }, []);
  const pause = (ms: number) => new Promise<void>(resolve => {
    const timer = setTimeout(() => { timers.current.delete(timer); resolve(); }, ms);
    timers.current.set(timer, resolve);
  });
  const reset = () => {
    cancel(); setWeights(initial()); setSnapshot(initial()); setStage('forward'); setBusy(false);
    setCount(0); setUpdatedCount(0); setWindowIndex(null); setCell(null); setHover(null); setPreviousLoss(null); setRound(0);
  };
  const advance = async () => {
    if (locked.current) return;
    locked.current = true; setBusy(true); setHover(null);
    if (popupHideTimer.current !== null) clearTimeout(popupHideTimer.current);
    const token = ++run.current;
    const active = () => token === run.current;
    if (stage === 'forward' || stage === 'updated') {
      setSnapshot([...weights]); setCount(0); setUpdatedCount(0); setStage('gradient');
      await pause(900); if (!active()) return;
      for (let i = 0; i < 4; i++) {
        setWindowIndex(i); setCell(null);
        await pause(450); if (!active()) return;
        setCount(i + 1);
        for (let j = 0; j < 4; j++) {
          setCell(j); await pause(260); if (!active()) return;
        }
      }
    } else if (backward) {
      setStage('focus'); setCell(null); setWindowIndex(null);
      await pause(1000); if (!active()) return;
    } else {
      for (let j = 0; j < 4; j++) {
        setCell(j);
        for (let i = 0; i < 4; i++) {
          setWindowIndex(i); await pause(260); if (!active()) return;
        }
        setWindowIndex(null); await pause(300); if (!active()) return;
        setUpdatedCount(j + 1); await pause(350); if (!active()) return;
      }
      setPreviousLoss(loss); setWeights(next); setStage('updated'); setRound(v => v + 1);
      await pause(1000); if (!active()) return;
    }
    setBusy(false); setWindowIndex(null); setCell(null); locked.current = false;
  };
  const traceCell = (j: number | null) => { if (!locked.current) setCell(j); };
  const traceWindow = (i: number | null) => { if (!locked.current) setWindowIndex(i); };
  const detail = focus
    ? String.raw`K_{\mathrm{new}}=K-\eta(G_{11}+G_{12}+G_{21}+G_{22})`
    : backward
      ? String.raw`G_{ij}=\frac{\partial L}{\partial z_{ij}}X_{ij}=(y-\mathrm{GT})a_{ij}X_{ij}`
      : String.raw`y=\sum_{i,j}a_{ij}z_{ij},\quad L=\frac12(y-\mathrm{GT})^2`;
  const popupWindow = hover?.kind === 'window' ? hover.i : backward && busy && count > 0 ? windowIndex : null;
  const popup = popupWindow !== null ? contributions[popupWindow] : hover?.kind === 'total' ? total : null;
  const keepPopup = () => { if (popupHideTimer.current !== null) { clearTimeout(popupHideTimer.current); popupHideTimer.current = null; } };
  const showPopup = (value: Hover) => {
    if (locked.current) return;
    keepPopup();
    if (value) setHover(value);
    else popupHideTimer.current = setTimeout(() => { setHover(null); popupHideTimer.current = null; }, 180);
  };
  const buttonLabel = busy ? focus ? '正在汇总更新' : backward ? '正在计算梯度' : '重新计算输出' : backward ? '查看更新' : focus ? '应用更新' : stage === 'updated' ? '再次计算梯度' : '计算梯度';
  return <ContentBlock shuku-edit-id="e-9aee2a09-aabc-4113-97f1-63c60eb9d5c9" className="vfl-shared-page" bodyClassName="vfl-shared-body" title="多个窗口，怎样更新同一个卷积核？" subtitle="四个窗口贡献梯度，全连接权重固定，只更新卷积核。">
    <div shuku-edit-id="e-63cac328-290b-497e-9476-2704cb4316ce" className="vfl-shared-controls">
      <div shuku-edit-id="e-8caf5f1e-58e2-4796-b903-cb12aeb97084" className={`vfl-shared-loss ${stage === 'updated' ? 'is-improved' : ''}`}><Typography shuku-edit-id="e-9e20ec28-d50f-4113-8416-2975b64d08c3" variant="body" tone="muted">平方误差损失</Typography><Formula latex={fmt(loss)} />{previousLoss !== null && stage === 'updated' && <Formula className="vfl-shared-previous" latex={String.raw`\leftarrow${fmt(previousLoss)}`} />}</div>
      <div shuku-edit-id="e-f78e22e4-c901-4dea-8136-4e83cf0ed08b" className="vfl-shared-detail" aria-live="polite"><Formula latex={detail} /></div>
      <div shuku-edit-id="e-b287308b-6136-40a3-a6b4-f4b1597046f2" className="vfl-shared-actions"><Button variant="primary" disabled={busy || Math.abs(y - 1) < 0.005} onClick={() => { void advance(); }}><Typography shuku-edit-id="e-540df7c6-eba8-4c0c-9a61-620c213719fa" as="span" variant="body" tone="inherit">{buttonLabel}</Typography></Button><Button onClick={reset}><Typography shuku-edit-id="e-a4afd18a-fa90-41d4-82ee-f7481170014c" as="span" variant="body" tone="inherit">重置</Typography></Button></div>
    </div>
    <div shuku-edit-id="e-aa33bd7b-f0eb-4be0-bbbe-d2cb2396c487" ref={sceneRef} className={`vfl-shared-scene is-${stage} ${busy ? 'is-playing' : ''}`} data-stage={stage} data-round={round} aria-busy={busy}>
      <section shuku-edit-id="e-bd019860-6da1-4a4a-8a93-473e98ae7461" className="vfl-shared-object vfl-shared-input"><Typography shuku-edit-id="e-c2615f22-fb3d-4ed4-9174-33fefc43e8d4" variant="body" tone="accent">输入图像</Typography><Grid values={X} columns={3} label="输入图像" highlighted={selectedWindow === null ? [] : WINDOWS[selectedWindow]} /></section>
      <div shuku-edit-id="e-0cd9827f-f4b8-4d86-b2e5-522139126d59" className="vfl-shared-op vfl-shared-conv"><Formula latex={String.raw`\ast`} /></div>
      <section shuku-edit-id="e-55cf60f8-8d2e-4325-891b-663019fe4038" className={`vfl-shared-object vfl-shared-kernel ${stage === 'updated' ? 'is-changed' : ''}`}><Typography shuku-edit-id="e-4057a41c-ed08-4c26-b23f-8376af979ec2" variant="body" tone="accent">{focus || stage === 'updated' ? '新卷积核' : '卷积核'}</Typography><Grid values={focus ? next : weights} label="卷积核" visible={focus ? updatedCount : 4} highlighted={cell === null ? [] : [cell]} onSelect={traceCell} changed={focus || stage === 'updated'} /></section>
      <div shuku-edit-id="e-6ae6f95b-3b1e-4441-95f2-5d51bf9c8c33" className="vfl-shared-op vfl-shared-arrow-a"><Formula latex={String.raw`\longrightarrow`} /></div>
      <section shuku-edit-id="e-7108b5a2-d8fc-4860-8456-f2e2490e6618" className="vfl-shared-object vfl-shared-features"><Typography shuku-edit-id="e-00c73d78-e721-4615-99fd-6dba8aa3ee6a" variant="body" tone="accent">特征图</Typography><Grid values={outputs} label="特征图" highlighted={selectedWindow === null ? [] : [selectedWindow]} onSelect={traceWindow} changed={stage === 'updated'} /></section>
      <div shuku-edit-id="e-541f92ef-1ff4-4657-8a19-ba814c49f70b" className="vfl-shared-op vfl-shared-flatten"><Formula latex={String.raw`\longrightarrow`} /></div>
      <section shuku-edit-id="e-07d2bd40-2e80-436d-90de-31120b8799c6" className="vfl-shared-object vfl-shared-vector"><Grid values={outputs} columns={1} label="四项向量" highlighted={selectedWindow === null ? [] : [selectedWindow]} onSelect={traceWindow} changed={stage === 'updated'} /><Typography shuku-edit-id="e-1e4003ae-c36f-41bb-85b6-ad528610de27" variant="body" tone="accent">展开</Typography></section>
      <div shuku-edit-id="e-895b4e95-cbf0-4986-afb7-cbc309b8cafe" className="vfl-shared-fc"><Typography shuku-edit-id="e-d54403f1-0aa2-4422-8216-6134e7abaaaf" variant="bodySmall" tone="muted">固定权重</Typography></div>
      {connections && <div shuku-edit-id="e-7530da50-a01f-495c-a99a-427f84beaf5d" className="vfl-shared-connections" aria-label="四个特征值分别乘固定权重 0.50，相加得到输出">
        <svg shuku-edit-id="e-9f4069f5-6d85-462d-a224-bbdee88f2a52" viewBox={`0 0 ${connections.width} ${connections.height}`} preserveAspectRatio="none" aria-hidden="true">
          {connections.sources.map((source, i) => <line shuku-edit-id="e-eaff1343-0781-4f1b-841e-d5e9ffec8973" key={i} x1={source.x} y1={source.y} x2={connections.x} y2={connections.y} className={selectedWindow === i ? 'is-selected' : ''} />)}
        </svg>
        {connections.sources.map((source, i) => <MathFormulaBlock key={i} appearance="plain" className={`vfl-shared-edge-weight${selectedWindow === i ? ' is-selected' : ''}`} style={{ left: source.x + (connections.x - source.x) * 0.35, top: source.y + (connections.y - source.y) * 0.35 }} ariaLabel={`第 ${i + 1} 项的固定权重 0.50`}><MathFormulaStatic latex="0.50" /></MathFormulaBlock>)}
      </div>}
      <section shuku-edit-id="e-827d5a9d-234a-404b-b4ef-3fb814ad5407" className="vfl-shared-object vfl-shared-output"><Typography shuku-edit-id="e-07ccc872-cc27-48f8-9d7e-9bf1f8524ebb" variant="body" tone="accent">输出 y</Typography><Formula className="vfl-shared-scalar" latex={fmt(y)} /></section>
      <div shuku-edit-id="e-b82cec28-7981-4b3a-96ca-6daae4a3eb23" className="vfl-shared-op vfl-shared-compare"><Formula latex={String.raw`\leftrightarrow`} /></div>
      <section shuku-edit-id="e-ebd41857-449b-4dfb-bbe5-e70ac6240a9e" className="vfl-shared-object vfl-shared-target"><Typography shuku-edit-id="e-22abfd25-fbc4-4dc1-91ac-7e1ce19c13f7" variant="body" tone="accent">GT</Typography><Formula className="vfl-shared-scalar" latex="1.00" /></section>
      <div shuku-edit-id="e-d6342621-ffdc-44b4-9c7f-e8af09c08899" className="vfl-shared-comparison-summary"><Formula latex={String.raw`y=${fmt(oldY)}\qquad\mathrm{GT}=1.00`} /></div>
      <div shuku-edit-id="e-1e94aa1c-bdda-4228-a9de-0036ce18a9b6" className="vfl-shared-reverse"><Formula latex={String.raw`\frac{\partial L}{\partial y}=${fmt(error)}\quad\xrightarrow{\times0.50}\quad\frac{\partial L}{\partial z_{ij}}=${fmt(delta)}`} /></div>
      <div shuku-edit-id="e-2a1733cf-ad41-4b86-9ca9-2a8c72ceaa06" className="vfl-shared-contributions">
        <Formula className="vfl-shared-parenthesis open" latex="(" />
        {contributions.map((_, i) => <div shuku-edit-id="e-c934295b-20c9-41a2-8131-53603e8d642a" className="vfl-shared-contribution-wrap" key={i}>
          <Button className={`vfl-shared-contribution ${selectedWindow === i ? 'is-selected' : ''} ${count > i ? 'is-ready' : 'is-pending'}`} aria-label={`窗口${index(i)}的梯度贡献`} aria-expanded={hover?.kind === 'window' && hover.i === i} disabled={count <= i}
            onMouseEnter={() => showPopup({ kind: 'window', i })} onMouseLeave={() => showPopup(null)} onFocus={() => showPopup({ kind: 'window', i })} onBlur={() => showPopup(null)} onClick={() => showPopup({ kind: 'window', i })}>
            <Formula latex={count > i ? `G_{${index(i)}}` : String.raw`\cdots`} /><Typography shuku-edit-id="e-9fb268a1-2806-4029-a331-510cb5b81372" as="span" variant="body" tone="muted">窗口 {index(i)}</Typography>
          </Button>
          {i < 3 && <Formula className="vfl-shared-plus" latex="+" />}
        </div>)}
        <Formula className="vfl-shared-parenthesis close" latex=")" />
      </div>
      <section shuku-edit-id="e-682289b9-89bf-4233-8f50-54cf1824f3ca" className="vfl-shared-object vfl-shared-old"><Typography shuku-edit-id="e-bf631d1b-39d4-4ebf-9923-7ec99dd11d77" variant="body" tone="accent">原卷积核</Typography><Grid values={snapshot} label="原卷积核" highlighted={cell === null ? [] : [cell]} onSelect={traceCell} /></section>
      <div shuku-edit-id="e-3894d6bb-cf5a-4153-abc0-0b6df95cbece" className="vfl-shared-op vfl-shared-equals"><Formula latex={String.raw`\approx`} /></div>
      <div shuku-edit-id="e-b6ab4b43-b9d1-4416-8221-0b92438d8b97" className="vfl-shared-op vfl-shared-minus"><Formula latex={String.raw`-0.10\times`} /></div>
      <div shuku-edit-id="e-bea40bda-1349-4377-a124-161e1b33e634" className="vfl-shared-total-anchor"><Button className="vfl-shared-total" aria-label="查看总梯度矩阵" onMouseEnter={() => showPopup({ kind: 'total' })} onMouseLeave={() => showPopup(null)} onFocus={() => showPopup({ kind: 'total' })} onBlur={() => showPopup(null)} onClick={() => showPopup({ kind: 'total' })}><Typography shuku-edit-id="e-f675a0b3-7854-4512-8cf3-936b0cedd89f" as="span" variant="body" tone="accent">总梯度 G</Typography></Button></div>
      {popup && <div shuku-edit-id="e-71f61cf0-492d-49c2-861c-09e0010eaa39" className={`vfl-shared-popup ${focus ? 'in-focus' : ''}`} role="tooltip" onMouseEnter={keepPopup} onMouseLeave={() => showPopup(null)} onFocusCapture={keepPopup} onBlurCapture={() => showPopup(null)}>
        <Typography shuku-edit-id="e-67e64432-f24b-462b-bb82-af9bac339eff" variant="body" tone="accent">{popupWindow !== null ? `窗口 ${index(popupWindow)} 的梯度贡献` : '四个窗口逐格相加'}</Typography>
        <Formula tooltipPlacement="top" latex={popupWindow !== null ? String.raw`G_{${index(popupWindow)}}=${fmt(delta)}\times${matrixLatex(WINDOWS[popupWindow].map(p => X[p]))}\approx${matrixLatex(popup, backward && busy ? (cell ?? -1) + 1 : 4)}` : String.raw`G=G_{11}+G_{12}+G_{21}+G_{22}\approx${matrixLatex(total)}`} />
        {cell !== null && <Formula tooltipPlacement="top" latex={popupWindow !== null ? String.raw`g^{(${index(popupWindow)})}_{${index(cell)}}=${fmt(delta)}\times${fmt(X[WINDOWS[popupWindow][cell]])}\approx${fmt(popup[cell])}` : `${contributions.map(g => `(${fmt(g[cell])})`).join('+')}\\approx${fmt(total[cell])}`} />}
      </div>}
    </div>
  </ContentBlock>;
}
