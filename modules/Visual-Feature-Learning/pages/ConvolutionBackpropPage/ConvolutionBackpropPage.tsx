import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
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
    <div className="vfl-update-matrix__grid">
      {values.map((n, i) => <Button key={i} className={`vfl-update-cell ${selected === i ? 'is-selected' : ''} ${i < visible ? 'is-revealed' : 'is-pending'} ${updating && i < visible ? 'is-changed' : ''}`}
        aria-label={`${label}，第 ${Math.floor(i / 2) + 1} 行第 ${i % 2 + 1} 列${i < visible ? `，${f(n)}` : '，待计算'}`}
        onMouseEnter={() => onTrace(i)} onMouseLeave={onLeave} onFocus={() => onTrace(i)} onBlur={onLeave} onClick={() => onTrace(i)}>
        <span className="vfl-update-cell__value" key={i < visible ? f(n) : 'pending'}><MathFormulaStatic latex={i < visible ? f(n) : String.raw`\cdots`} /></span>
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

  return <ContentBlock className="vfl-update-page" bodyClassName="vfl-update-body" title="损失怎样更新卷积核？" subtitle="一个窗口，算出梯度，再更新卷积核。">
    <div className="vfl-update-controls" aria-live="polite">
      <div className={`vfl-update-loss ${stage === 'updated' ? 'is-improved' : ''}`}>
        <Typography variant="body" tone="muted">平方误差损失</Typography>
        <Formula latex={f(loss)} />
        {stage === 'updated' && previousLoss !== null && <Formula className="vfl-update-loss__previous" latex={String.raw`\leftarrow${f(previousLoss)}`} />}
      </div>
      <div className="vfl-update-detail">
        {detail ? <Formula latex={detail} /> : <Formula latex={String.raw`L=\frac12(y-\mathrm{GT})^2`} />}
      </div>
      <div className="vfl-update-controls__buttons">
        <Button variant="primary" disabled={busy || (stage === 'updated' && Math.abs(output - TARGET) < 0.005)} onClick={() => { void advance(); }}><Typography as="span" variant="body" tone="inherit">{buttonLabel}</Typography></Button>
        <Button onClick={reset} aria-label="重置演示"><Typography as="span" variant="body" tone="inherit">重置</Typography></Button>
      </div>
    </div>
    <div className={`vfl-update-scene is-${stage} motion-${motion}`} aria-busy={busy} data-stage={stage} data-round={round}>
      <svg className="vfl-update-paths" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <marker id={markerId} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M1 1 L6 4 L1 7" fill="none" stroke="currentColor" strokeWidth="1.4" /></marker>
          <marker id={`${markerId}-reverse`} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto" style={{ color: 'var(--ui-accent-alt)' }}><path d="M1 1 L6 4 L1 7" fill="none" stroke="currentColor" strokeWidth="1.4" /></marker>
        </defs>
        <g className="vfl-update-paths__forward"><path d="M520 324 H582" markerEnd={`url(#${markerId})`} /><path d="M773 324 H812" markerEnd={`url(#${markerId})`} /><path d="M812 324 H773" markerEnd={`url(#${markerId})`} /></g>
        <g className="vfl-update-paths__reverse"><path d="M680 158 V180 Q680 193 699 193 H772 Q790 193 790 205" /><path d="M900 158 V180 Q900 193 881 193 H808 Q790 193 790 205" /><path d="M790 267 V302" markerEnd={`url(#${markerId}-reverse)`} /></g>
      </svg>
      <section className="vfl-update-object vfl-update-input">
        <Typography variant="body" tone="accent" align="center">输入 X</Typography>
        <Matrix values={INPUT} label="输入图像" selected={selected} onTrace={trace} onLeave={leave} />
      </section>
      <div className="vfl-update-convolution"><Formula latex={String.raw`\ast`} /></div>
      <section className={`vfl-update-object vfl-update-kernel ${stage === 'updated' ? 'is-updated' : ''}`}>
        <Typography variant="body" tone="accent" align="center">{focus ? '新卷积核' : stage === 'updated' ? '新卷积核' : '卷积核 K'}</Typography>
        <Matrix values={focus ? nextWeights : weights} visible={focus ? updateCount : 4} label={focus ? '新卷积核' : '卷积核'} selected={selected} onTrace={trace} onLeave={leave} updating={focus || stage === 'updated'} />
      </section>
      <section className="vfl-update-object vfl-update-output">
        <Typography variant="body" tone="accent" align="center">{stage === 'updated' ? '新输出 y' : '输出 y'}</Typography>
        <Formula className="vfl-update-scalar" latex={f(output)} />
      </section>
      <section className="vfl-update-object vfl-update-target">
        <Typography variant="body" tone="accent" align="center">GT</Typography>
        <Formula className="vfl-update-scalar" latex="1.00" />
      </section>
      <div className="vfl-update-error"><Formula latex={String.raw`\frac{\partial L}{\partial y}=${f(oldOutput)}-1.00\approx${f(error)}`} /><Formula latex={String.raw`\times X`} /></div>
      <section className="vfl-update-object vfl-update-gradient">
        <Typography variant="body" tone="accent" align="center">梯度 G</Typography>
        <Matrix values={gradients} visible={gradientCount} label="梯度矩阵" selected={selected} onTrace={trace} onLeave={leave} />
      </section>
      <section className="vfl-update-object vfl-update-original">
        <Typography variant="body" tone="accent" align="center">原卷积核</Typography>
        <Matrix values={snapshot} label="原卷积核" selected={selected} onTrace={trace} onLeave={leave} />
      </section>
      <div className="vfl-update-equals"><Formula latex={String.raw`\approx`} /></div>
      <div className="vfl-update-subtract"><Formula latex={String.raw`-0.10\times`} /></div>
      {focus && <div className={`vfl-update-transfer ${motion === 'apply' ? 'is-travelling' : ''}`} key={selected} style={{ '--vfl-transfer-start': `calc(86% + ${selected !== null && selected % 2 === 0 ? -66 : 66}px)`, '--vfl-transfer-end': `calc(14% + ${selected !== null && selected % 2 === 0 ? -72 : 72}px)`, '--vfl-transfer-y': `calc(54% + ${selected !== null && selected < 2 ? -36 : 102}px)` } as CSSProperties}><Formula latex={selected === null ? '' : f(-RATE * gradients[selected])} /></div>}
    </div>
  </ContentBlock>;
}



