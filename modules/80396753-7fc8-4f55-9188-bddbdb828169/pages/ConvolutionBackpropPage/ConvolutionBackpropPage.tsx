import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import { KernelFormula } from '../../components/KernelFormula';
import './ConvolutionBackpropPage.css';

const INPUT = [0.2, 0.4, 0.8, 1];
const TARGET = 1;
const RATE = 0.1;
const initialWeights = () => [0.1, 0.1, 0.1, 0.1];
const f = (n: number) => Number(n.toFixed(2)).toFixed(2);
const predict = (weights: number[]) => weights.reduce((sum, w, i) => sum + w * INPUT[i], 0);
const lossOf = (y: number) => 0.5 * (y - TARGET) ** 2;
type Stage = 'forward' | 'gradient' | 'focus' | 'updated';
type Motion = 'idle' | 'gradient' | 'zoom' | 'apply' | 'return';
const subscript = (i: number) => `${Math.floor(i / 2) + 1}${i % 2 + 1}`;

function Formula({ latex, className = '' }: { latex: string; className?: string }) {
  return <KernelFormula className={`vfl-update-formula ${className}`} latex={latex} />;
}

// This grid belongs to the convolution demonstration: its four cells retain their spatial identity throughout the animation.
function Matrix({ values, label, selected, visible = 4, onTrace, onLeave, updating = false }: {
  values: number[]; label: string; selected: number | null; visible?: number;
  onTrace: (i: number) => void; onLeave: () => void; updating?: boolean;
}) {
  return <MathFormulaBlock appearance="plain" className="vfl-update-matrix" ariaLabel={label}>
    <div shuku-edit-id="e-52efcc8d-eb5c-4e8e-830e-eeeea48df478" className="vfl-update-matrix__grid">
      {values.map((n, i) => <Button key={i} className={`vfl-update-cell ${selected === i ? 'is-selected' : ''} ${i < visible ? 'is-revealed' : 'is-pending'} ${updating && i < visible ? 'is-changed' : ''}`}
        aria-label={`${label}，第 ${Math.floor(i / 2) + 1} 行第 ${i % 2 + 1} 列${i < visible ? `，${f(n)}` : '，待计算'}`}
        onMouseEnter={() => onTrace(i)} onMouseLeave={onLeave} onFocus={() => onTrace(i)} onBlur={onLeave} onClick={() => onTrace(i)}>
        <span shuku-edit-id="e-65b16264-e7e3-4b66-a290-90361366d4d9" className="vfl-update-cell__value" key={i < visible ? f(n) : 'pending'}><MathFormulaStatic latex={i < visible ? f(n) : String.raw`\cdots`} /></span>
      </Button>)}
    </div>
  </MathFormulaBlock>;
}

export function ConvolutionBackpropPage() {
  const [weights, setWeights] = useState(initialWeights);
  const [snapshot, setSnapshot] = useState(initialWeights);
  const [stage, setStage] = useState<Stage>('forward');
  const [motion, setMotion] = useState<Motion>('idle');
  const [gradientCount, setGradientCount] = useState(0);
  const [updateCount, setUpdateCount] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const [previousLoss, setPreviousLoss] = useState<number | null>(null);
  const timers = useRef(new Map<ReturnType<typeof setTimeout>, () => void>());
  const run = useRef(0);
  const locked = useRef(false);
  const markerId = `vfl-update-${useId().replace(/:/g, '')}`;
  const busy = motion !== 'idle';
  const focus = stage === 'focus';
  const backward = stage === 'gradient';
  const output = predict(weights);
  const oldOutput = predict(snapshot);
  const error = oldOutput - TARGET;
  const gradients = INPUT.map(x => error * x);
  const nextWeights = snapshot.map((w, i) => w - RATE * gradients[i]);
  const loss = lossOf(output);

  const cancel = () => {
    run.current += 1;
    timers.current.forEach((resolve, timer) => { clearTimeout(timer); resolve(); });
    timers.current.clear();
    locked.current = false;
  };
  useEffect(() => () => {
    run.current += 1;
    timers.current.forEach((resolve, timer) => { clearTimeout(timer); resolve(); });
    timers.current.clear();
  }, []);
  const pause = (ms: number) => new Promise<void>(resolve => {
    const timer = setTimeout(() => { timers.current.delete(timer); resolve(); }, ms);
    timers.current.set(timer, resolve);
  });
  const reset = () => {
    cancel(); setWeights(initialWeights()); setSnapshot(initialWeights()); setStage('forward'); setMotion('idle');
    setGradientCount(0); setUpdateCount(0); setSelected(null); setHovered(null); setRound(0); setPreviousLoss(null);
  };
  const trace = (i: number) => { if (!locked.current) { setSelected(i); setHovered(i); } };
  const leave = () => { if (!locked.current) setHovered(null); };
  const advance = async () => {
    if (locked.current) return;
    locked.current = true;
    const token = ++run.current;
    const active = () => run.current === token;
    setHovered(null); setSelected(null);
    if (stage === 'forward' || stage === 'updated') {
      setSnapshot([...weights]); setGradientCount(0); setUpdateCount(0);
      setStage('gradient'); setMotion('gradient');
      await pause(850); if (!active()) return;
      for (let i = 0; i < 4; i++) {
        setSelected(i); setGradientCount(i + 1);
        await pause(550); if (!active()) return;
      }
    } else if (stage === 'gradient') {
      setStage('focus'); setMotion('zoom');
      await pause(950); if (!active()) return;
    } else {
      setMotion('apply');
      for (let i = 0; i < 4; i++) {
        setSelected(i);
        await pause(520); if (!active()) return;
        setUpdateCount(i + 1);
        await pause(260); if (!active()) return;
      }
      await pause(350); if (!active()) return;
      setPreviousLoss(loss); setWeights(nextWeights); setRound(n => n + 1);
      setStage('updated'); setMotion('return');
      await pause(1050); if (!active()) return;
    }
    setMotion('idle'); setSelected(null); locked.current = false;
  };

  const detailIndex = hovered ?? (busy && selected !== null ? selected : null);
  let detail = '';
  if (detailIndex !== null) {
    const i = detailIndex;
    detail = focus || stage === 'updated'
      ? String.raw`K_{${subscript(i)}}:\ ${f(snapshot[i])}-0.10\times(${f(gradients[i])})\approx${f(nextWeights[i])}`
      : backward
        ? String.raw`g_{${subscript(i)}}=\frac{\partial L}{\partial y}\cdot X_{${subscript(i)}}\approx${f(error)}\times${f(INPUT[i])}\approx${f(gradients[i])}`
        : String.raw`X_{${subscript(i)}}K_{${subscript(i)}}=${f(INPUT[i])}\times${f(weights[i])}\approx${f(INPUT[i] * weights[i])}`;
  }
  const buttonLabel = motion === 'gradient' ? '正在计算梯度' : motion === 'zoom' ? '进入更新过程' : motion === 'apply' ? '正在更新权重' : motion === 'return' ? '重新计算输出'
    : backward ? '查看更新' : focus ? '应用更新' : stage === 'updated' ? '再次计算梯度' : '计算梯度';

  return <ContentBlock shuku-edit-id="e-9b0dc134-ac1e-4f55-9da4-efa4f67e2311" className="vfl-update-page" bodyClassName="vfl-update-body" title="损失怎样更新卷积核？" subtitle="一个窗口，算出梯度，再更新卷积核。">
    <div shuku-edit-id="e-3887e320-bb70-419e-a887-939ed506c9a9" className="vfl-update-controls" aria-live="polite">
      <div shuku-edit-id="e-8db23ba7-9d1c-48ca-a48f-8196abc82d61" className={`vfl-update-loss ${stage === 'updated' ? 'is-improved' : ''}`}>
        <Typography shuku-edit-id="e-ed45d1d2-1c4b-4468-9077-0af096181aec" variant="body" tone="muted">平方误差损失</Typography>
        <Formula latex={f(loss)} />
        {stage === 'updated' && previousLoss !== null && <Formula className="vfl-update-loss__previous" latex={String.raw`\leftarrow${f(previousLoss)}`} />}
      </div>
      <div shuku-edit-id="e-1aeb6918-f206-421d-bcce-422f01c7a2f3" className="vfl-update-detail">
        {detail ? <Formula latex={detail} /> : <Formula latex={String.raw`L=\frac12(y-\mathrm{GT})^2`} />}
      </div>
      <div shuku-edit-id="e-6951c89d-1723-47b3-a65b-74d1274c3355" className="vfl-update-controls__buttons">
        <Button variant="primary" disabled={busy || (stage === 'updated' && Math.abs(output - TARGET) < 0.005)} onClick={() => { void advance(); }}><Typography shuku-edit-id="e-d2c22d76-271a-4df2-8417-896cacfc8913" as="span" variant="body" tone="inherit">{buttonLabel}</Typography></Button>
        <Button onClick={reset} aria-label="重置演示"><Typography shuku-edit-id="e-1797e991-cb57-4e62-a947-fcbf6e084015" as="span" variant="body" tone="inherit">重置</Typography></Button>
      </div>
    </div>
    <div shuku-edit-id="e-0da004db-ee4d-4f74-a65c-9bef7d6d0300" className={`vfl-update-scene is-${stage} motion-${motion}`} aria-busy={busy} data-stage={stage} data-round={round}>
      <svg shuku-edit-id="e-63c7fbb8-5564-4fbb-ad2e-0423600a5034" className="vfl-update-paths" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true">
        <defs shuku-edit-id="e-6750bca3-945c-4fe5-8a43-fbfa04be370f">
          <marker shuku-edit-id="e-557c18fe-e3d3-4d3b-b4c3-d222451da184" id={markerId} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path shuku-edit-id="e-5fc8ca84-dc68-49b4-9a6e-a61b566c7580" d="M1 1 L6 4 L1 7" fill="none" stroke="currentColor" strokeWidth="1.4" /></marker>
          <marker shuku-edit-id="e-6d6f8161-2f01-4d49-a523-b022faf76068" id={`${markerId}-reverse`} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto" style={{ color: 'var(--ui-accent-alt)' }}><path shuku-edit-id="e-38a61e18-a517-4947-a939-8dfc3ab421ea" d="M1 1 L6 4 L1 7" fill="none" stroke="currentColor" strokeWidth="1.4" /></marker>
        </defs>
        <g shuku-edit-id="e-06ff3cf0-24f4-45ca-a553-b9867c14e1aa" className="vfl-update-paths__forward"><path shuku-edit-id="e-48d90c59-f4fa-4a7c-bbcf-ea3a3d1cc44b" d="M520 324 H582" markerEnd={`url(#${markerId})`} /><path shuku-edit-id="e-c2855525-6cd4-4f74-85a7-24977b86086f" d="M773 324 H812" markerEnd={`url(#${markerId})`} /><path shuku-edit-id="e-ae6c4959-1c77-4927-91d0-a6746209264b" d="M812 324 H773" markerEnd={`url(#${markerId})`} /></g>
        <g shuku-edit-id="e-098bb4ab-8cbd-4180-9033-b27f7d13db1c" className="vfl-update-paths__reverse"><path shuku-edit-id="e-3ba0f5e9-a183-4255-a593-72182f382ce7" d="M680 158 V180 Q680 193 699 193 H772 Q790 193 790 205" /><path shuku-edit-id="e-f4ca1d5c-c581-478e-a007-74eb5e500f7a" d="M900 158 V180 Q900 193 881 193 H808 Q790 193 790 205" /><path shuku-edit-id="e-128d5ad5-b54f-497c-90f7-dc02208db96a" d="M790 267 V302" markerEnd={`url(#${markerId}-reverse)`} /></g>
      </svg>
      <section shuku-edit-id="e-9302bac5-a7bc-4bcd-9dd3-0136c3a073ae" className="vfl-update-object vfl-update-input">
        <Typography shuku-edit-id="e-a739ad38-7c00-423d-b771-77a4cd0ab026" variant="body" tone="accent" align="center">输入 X</Typography>
        <Matrix values={INPUT} label="输入图像" selected={selected} onTrace={trace} onLeave={leave} />
      </section>
      <div shuku-edit-id="e-269d1124-d8aa-46e5-a593-6b17594e000d" className="vfl-update-convolution"><Formula latex={String.raw`\ast`} /></div>
      <section shuku-edit-id="e-13f060b8-17e7-4573-bdd6-9a4b0cbe7b7f" className={`vfl-update-object vfl-update-kernel ${stage === 'updated' ? 'is-updated' : ''}`}>
        <Typography shuku-edit-id="e-a9d579a4-01f6-4d12-982b-8e53da5350e1" variant="body" tone="accent" align="center">{focus ? '新卷积核' : stage === 'updated' ? '新卷积核' : '卷积核 K'}</Typography>
        <Matrix values={focus ? nextWeights : weights} visible={focus ? updateCount : 4} label={focus ? '新卷积核' : '卷积核'} selected={selected} onTrace={trace} onLeave={leave} updating={focus || stage === 'updated'} />
      </section>
      <section shuku-edit-id="e-92f2f496-de38-4500-abf6-f79d9fed9f4e" className="vfl-update-object vfl-update-output">
        <Typography shuku-edit-id="e-89508bb3-6a94-46f0-a6d2-68f69853aed1" variant="body" tone="accent" align="center">{stage === 'updated' ? '新输出 y' : '输出 y'}</Typography>
        <Formula className="vfl-update-scalar" latex={f(output)} />
      </section>
      <section shuku-edit-id="e-7f8be288-2122-42b5-8b53-1b4aaf7dd42a" className="vfl-update-object vfl-update-target">
        <Typography shuku-edit-id="e-ee13214c-7ad2-42bb-88cf-3b50eb32b4bd" variant="body" tone="accent" align="center">GT</Typography>
        <Formula className="vfl-update-scalar" latex="1.00" />
      </section>
      <div shuku-edit-id="e-fa0257c3-06cd-425f-b089-bbbec2aeb856" className="vfl-update-error"><Formula latex={String.raw`\frac{\partial L}{\partial y}=${f(oldOutput)}-1.00\approx${f(error)}`} /><Formula latex={String.raw`\times X`} /></div>
      <section shuku-edit-id="e-e415c2d8-6e9f-4a2d-a897-1d129eac0790" className="vfl-update-object vfl-update-gradient">
        <Typography shuku-edit-id="e-ff2832fc-d56c-42bf-994d-89a64ec5ad0c" variant="body" tone="accent" align="center">梯度 G</Typography>
        <Matrix values={gradients} visible={gradientCount} label="梯度矩阵" selected={selected} onTrace={trace} onLeave={leave} />
      </section>
      <section shuku-edit-id="e-bb4a31e3-52db-4f64-8e66-039b3692288f" className="vfl-update-object vfl-update-original">
        <Typography shuku-edit-id="e-380af4e5-1bd5-4dc9-acc9-37365c7ff0b2" variant="body" tone="accent" align="center">原卷积核</Typography>
        <Matrix values={snapshot} label="原卷积核" selected={selected} onTrace={trace} onLeave={leave} />
      </section>
      <div shuku-edit-id="e-78e3c600-1ab2-40c6-9163-cff8b0aade36" className="vfl-update-equals"><Formula latex={String.raw`\approx`} /></div>
      <div shuku-edit-id="e-3cb5189a-64bd-400f-b874-543b9a06ddfd" className="vfl-update-subtract"><Formula latex={String.raw`-0.10\times`} /></div>
      {focus && <div shuku-edit-id="e-ebc17478-3664-4148-82d3-cb3fa4abdfa2" className={`vfl-update-transfer ${motion === 'apply' ? 'is-travelling' : ''}`} key={selected} style={{ '--vfl-transfer-start': `calc(86% + ${selected !== null && selected % 2 === 0 ? -66 : 66}px)`, '--vfl-transfer-end': `calc(14% + ${selected !== null && selected % 2 === 0 ? -72 : 72}px)`, '--vfl-transfer-y': `calc(54% + ${selected !== null && selected < 2 ? -36 : 102}px)` } as CSSProperties}><Formula latex={selected === null ? '' : f(-RATE * gradients[selected])} /></div>}
    </div>
  </ContentBlock>;
}



