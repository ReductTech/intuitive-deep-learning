import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import { useCompleteOnce } from '../../hooks/useCompleteOnce';
import { calculateResponse, nextUnwritten, INPUT, INPUT_SIZE, KERNEL, KERNEL_SIZE, OUTPUT_SIZE } from './convolution';
import './ConvolutionFeatureMapPage.css';

type Phase = 'ready' | 'products' | 'written';
const TOTAL = OUTPUT_SIZE ** 2;
const AUTO_WINDOW_MS = 100;
const emptyOutputs = () => Array<number | null>(TOTAL).fill(null);
const displayNumber = (number: number) => number < 0 ? `−${Math.abs(number)}` : String(number);
const displayWeight = (number: number) => number < 0 ? `(${number})` : String(number);

function ControlIcon({ name }: { name: 'reset' | 'play' | 'pause' | 'check' | 'pointer' | 'arrow' }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === 'reset' ? <path d="M4 9a8 8 0 1 1 0 6M4 4v5h5" /> : name === 'pause' ? <path d="M9 5v14M15 5v14" />
      : name === 'check' ? <path d="m5 12 4 4L19 6" />
      : name === 'arrow' ? <path d="M4 12h16m-7-7 7 7-7 7" />
      : name === 'pointer' ? <path d="M9 11V4a2 2 0 0 1 4 0v7m0-3h1a2 2 0 0 1 2 2h1a2 2 0 0 1 2 2v4a6 6 0 0 1-6 6h-1a5 5 0 0 1-4-2l-3-5a2 2 0 0 1 3-2l1 1" />
      : <path d="m9 5 10 7-10 7Z" />}
  </svg>;
}

export function ConvolutionFeatureMapPage({ onComplete }: { onComplete?: () => void }) {
  const [position, setPosition] = useState(0);
  const [phase, setPhase] = useState<Phase>('ready');
  const [outputs, setOutputs] = useState<(number | null)[]>(emptyOutputs);
  const [scanPlan, setScanPlan] = useState<number[] | null>(null);
  const automatic = scanPlan !== null;
  const [pair, setPair] = useState<number | null>(null);
  const calculationRef = useRef<HTMLDivElement>(null);
  const outputRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const response = calculateResponse(position);
  const count = outputs.filter(value => value !== null).length;
  const complete = count === TOTAL;
  const next = nextUnwritten(outputs, position);
  const activeStep = automatic || complete ? -1 : phase === 'ready' ? 0 : phase === 'products' ? 1 : 2;
  useCompleteOnce(complete, onComplete);

  const revealProducts = () => {
    if (automatic || phase !== 'ready' || complete) return;
    setPair(null);
    setPhase('products');
    requestAnimationFrame(() => calculationRef.current?.querySelector<HTMLButtonElement>('[data-action="write"]')?.focus());
  };
  const writeResponse = () => {
    if (automatic || phase !== 'products') return;
    const updated = [...outputs];
    updated[position] = calculateResponse(position).sum;
    setOutputs(updated);
    setPhase('written');
    setPair(null);
    const following = nextUnwritten(updated, position);
    requestAnimationFrame(() => {
      if (following >= 0) calculationRef.current?.querySelector<HTMLButtonElement>('[data-action="next"]')?.focus();
      else outputRefs.current[position]?.focus();
    });
  };

  useEffect(() => {
    if (!scanPlan) return;
    const startedAt = performance.now();
    let written = 0;
    let frame: number;
    const scan = (now: number) => {
      const due = Math.min(scanPlan.length, Math.floor((now - startedAt) / AUTO_WINDOW_MS));
      if (due > written) {
        const positions = scanPlan.slice(written, due);
        setOutputs(previous => {
          const updated = [...previous];
          positions.forEach(index => { updated[index] = calculateResponse(index).sum; });
          return updated;
        });
        setPosition(scanPlan[due - 1]);
        setPhase('written');
        setPair(null);
        written = due;
      }
      if (written === scanPlan.length) { setScanPlan(null); return; }
      frame = window.requestAnimationFrame(scan);
    };
    frame = window.requestAnimationFrame(scan);
    return () => window.cancelAnimationFrame(frame);
  }, [scanPlan]);

  const selectPosition = (index: number, focusKernel = false) => {
    if (index === position && !automatic) return;
    setScanPlan(null);
    setPair(null);
    setPosition(index);
    setPhase(outputs[index] === null ? 'ready' : 'written');
    if (focusKernel && outputs[index] === null) requestAnimationFrame(() => calculationRef.current?.querySelector<HTMLButtonElement>('[data-action="multiply"]')?.focus());
  };
  const moveWindow = () => {
    if (activeStep !== 2 || next < 0) return;
    selectPosition(next, true);
  };
  const selectWithKeyboard = (event: KeyboardEvent<HTMLButtonElement>) => {
    const movement: Record<string, [number, number]> = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] };
    if (!(event.key in movement)) return;
    event.preventDefault();
    event.stopPropagation();
    const [dr, dc] = movement[event.key];
    const focused = Number(event.currentTarget.dataset.output);
    const row = Math.max(0, Math.min(OUTPUT_SIZE - 1, Math.floor(focused / OUTPUT_SIZE) + dr));
    const column = Math.max(0, Math.min(OUTPUT_SIZE - 1, focused % OUTPUT_SIZE + dc));
    const index = row * OUTPUT_SIZE + column;
    selectPosition(index);
    event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`[data-output="${index}"]`)?.focus();
  };
  const toggleAutomatic = () => {
    if (automatic) { setScanPlan(null); return; }
    if (complete) return;
    setPosition(outputs.findIndex(value => value === null));
    setPhase('ready');
    setPair(null);
    setScanPlan(outputs.flatMap((value, index) => value === null ? [index] : []));
  };
  const reset = () => {
    setScanPlan(null);
    setPair(null);
    setPosition(0);
    setPhase('ready');
    setOutputs(emptyOutputs());
  };
  const insight = complete ? '一个核得到一张特征图；多个核可提取不同线索。'
    : automatic ? '同一组权重滑过所有窗口，逐格形成特征图。'
    : phase === 'products' ? '九个乘积相加，得到当前窗口的一个响应。'
    : phase === 'written' ? (response.sum === 0 ? '左右贡献相抵，当前响应为 0。' : '窗口跨过亮暗边界，当前响应为 27。')
    : '先点中央卷积核，计算橙框中的窗口。';
  const resultVisible = phase === 'written';
  const actionLabel = complete ? '特征图已完成' : automatic ? '正在自动扫描'
    : phase === 'products' ? '求和并写入' : '移动到下一窗口';
  const handleProductKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const movements: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -KERNEL_SIZE, ArrowDown: KERNEL_SIZE };
    if (!(event.key in movements)) return;
    event.preventDefault();
    event.stopPropagation();
    const index = Number(event.currentTarget.dataset.product);
    const row = Math.floor(index / KERNEL_SIZE), column = index % KERNEL_SIZE;
    const nextRow = Math.max(0, Math.min(KERNEL_SIZE - 1, row + (event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0)));
    const nextColumn = Math.max(0, Math.min(KERNEL_SIZE - 1, column + (event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0)));
    calculationRef.current?.querySelector<HTMLElement>(`[data-product="${nextRow * KERNEL_SIZE + nextColumn}"]`)?.focus();
  };

  return <ContentBlock className="rtg-convolution" headingLevel={1}
    onKeyDown={event => { if ((event.key === ' ' || event.key === 'Enter') && event.target instanceof Element && event.target.closest('button, [data-product]')) event.stopPropagation(); }}
    title="特征表示怎样算出来？特征图怎样形成？"
    subtitle="一个小窗口反复滑动：对应相乘、相加，把每次得到的数字按位置排好。">
    <section className="rtg-convolution__lab" data-phase={phase} data-automatic={automatic} aria-label="单通道人工核的滑动窗口计算实验">
      <div className="rtg-convolution__toolbar">
      <ol className="rtg-convolution__steps" aria-label={automatic ? '正在自动扫描' : complete ? '特征图已完成' : '手动计算步骤'}>
        {['对应相乘', '求和写入', '移动窗口'].map((label, index) => <li key={label}
          className={(activeStep === index ? 'is-current' : complete || activeStep > index ? 'is-complete' : '')}
          aria-current={activeStep === index ? 'step' : undefined}>
          <span className="rtg-convolution__step-content">
            <Typography as="span" className="rtg-convolution__step-number" variant="bodySmall" tone="inherit">{complete || activeStep > index ? <ControlIcon name="check" /> : `0${index + 1}`}</Typography>
            <Typography as="span" variant="bodySmall" tone="inherit" wrap="nowrap">{label}</Typography>
          </span>
        </li>)}
      </ol>
        <div className="rtg-convolution__tools">
          <Button className="rtg-convolution__tool" data-action="auto" disabled={complete} aria-pressed={automatic} onClick={toggleAutomatic}>
            <ControlIcon name={complete ? 'check' : automatic ? 'pause' : 'play'} />
            <Typography as="span" variant="bodySmall" tone="inherit">{complete ? '已完成' : automatic ? '暂停' : '自动扫描'}</Typography>
          </Button>
          <Button className="rtg-convolution__tool" data-action="reset" onClick={reset} aria-label="重新开始计算特征图">
            <ControlIcon name="reset" /><Typography as="span" variant="bodySmall" tone="inherit">重来</Typography>
          </Button>
        </div>
      </div>
      <div className="rtg-convolution__workspace">
      <figure className="rtg-convolution__figure">
        <figcaption className="rtg-convolution__figure-head">
          <Typography as="span" variant="body" tone="accent">输入</Typography>
          <MathFormulaBlock appearance="plain" className="rtg-convolution__dimensions" ariaLabel="输入尺寸7乘7"><MathFormulaStatic latex={`${INPUT_SIZE}\\times${INPUT_SIZE}`} /></MathFormulaBlock>
        </figcaption>
        <div className="rtg-convolution__matrix-stage"><div className="rtg-convolution__matrix rtg-convolution__input" aria-label="单通道教学输入，左边三列是9，右边四列是0">
          {INPUT.map((value, index) => {
            const row = Math.floor(index / INPUT_SIZE), column = index % INPUT_SIZE;
            const paired = pair !== null && row === response.row + Math.floor(pair / KERNEL_SIZE) && column === response.column + pair % KERNEL_SIZE;
            return <span key={index} className={`rtg-convolution__cell ${value === 9 ? 'is-light' : 'is-dark'}${paired ? ' is-paired' : ''}`}
              style={{ gridRow: row + 1, gridColumn: column + 1 }}>
              <Typography as="span" variant="bodySmall" tone="inherit">{value}</Typography>
            </span>;
          })}
          <span className="rtg-convolution__window" aria-hidden="true" style={{ gridRow: `${response.row + 1} / span 3`, gridColumn: `${response.column + 1} / span 3` }} />
        </div></div>
        <div className="rtg-convolution__figure-note">
          <Typography variant="bodySmall" tone="accent">第 {response.row + 1} 行 · 第 {response.column + 1} 列的窗口</Typography>
          <div className="rtg-convolution__legend"><Typography as="span" variant="bodySmall" tone="muted"><i className="is-light" />9 亮</Typography><Typography as="span" variant="bodySmall" tone="muted"><i className="is-dark" />0 暗</Typography></div>
        </div>
      </figure>
      <div className="rtg-convolution__operator" aria-hidden="true"><ControlIcon name="arrow" /></div>
      <div ref={calculationRef} className="rtg-convolution__calculation" aria-label="当前窗口的计算">
        <div className="rtg-convolution__figure-head">
          <Typography variant="body" tone="accent">{phase === 'ready' ? '卷积核' : '对应相乘'}</Typography>
          <MathFormulaBlock appearance="plain" className="rtg-convolution__dimensions" ariaLabel="核尺寸3乘3"><MathFormulaStatic latex={`${KERNEL_SIZE}\\times${KERNEL_SIZE}`} /></MathFormulaBlock>
        </div>
        {phase === 'ready' ? <Button data-action="multiply" className="rtg-convolution__kernel-control"
          disabled={automatic || complete} onClick={revealProducts} aria-label="对应相乘：计算当前窗口的九个乘积" aria-describedby="rtg-convolution-instruction">
          <span className="rtg-convolution__kernel-grid">
            {KERNEL.map((value, index) => <span className="rtg-convolution__weight" key={index}>
              <Typography as="span" variant="h3" tone="inherit">{displayNumber(value)}</Typography>
            </span>)}
          </span>
          <span className="rtg-convolution__primary-label"><ControlIcon name="pointer" /><Typography as="span" variant="body" tone="inherit">对应相乘</Typography><ControlIcon name="arrow" /></span>
        </Button> : <>
          <div className="rtg-convolution__products" role="group" aria-label="按三行三列排列的九项对应乘积；聚焦或指向一项可查看输入位置">
            {response.values.map((value, index) => <div key={index} data-product={index} tabIndex={automatic ? -1 : 0}
              className={'rtg-convolution__product' + (pair === index ? ' is-paired' : '')}
              onMouseEnter={() => { if (!automatic) setPair(index); }} onMouseLeave={() => setPair(null)} onFocus={() => setPair(index)} onBlur={() => setPair(null)} onKeyDown={handleProductKeyDown}
              aria-label={`第 ${Math.floor(index / KERNEL_SIZE) + 1} 行，第 ${index % KERNEL_SIZE + 1} 列：${value} 乘以 ${KERNEL[index]} 等于 ${response.products[index]}`}>
              <MathFormulaBlock appearance="plain" aria-hidden="true"><MathFormulaStatic latex={`\\begin{gathered}${value}\\times${displayWeight(KERNEL[index])}\\\\=\\mathbf{${response.products[index]}}\\end{gathered}`} /></MathFormulaBlock>
            </div>)}
          </div>
          <div className="rtg-convolution__action-row">
            <div className={'rtg-convolution__response' + (resultVisible ? ' is-written' : '')} aria-label={resultVisible ? `九项乘积之和为${response.sum}` : '将九项乘积相加'}>
              <Typography variant="bodySmall" tone="inherit">九项之和</Typography>
              <Typography as="span" variant="h2" tone="inherit">{resultVisible ? response.sum : '?'}</Typography>
            </div>
            <Button data-action={phase === 'products' ? 'write' : 'next'}
              disabled={automatic || complete} onClick={phase === 'products' ? writeResponse : moveWindow}
              className={'rtg-convolution__primary-action' + (complete ? ' is-complete' : '')} aria-describedby="rtg-convolution-instruction"
              aria-label={phase === 'products' ? '将九个乘积求和并写入当前输出格' : complete ? '特征图已完成' : `移动到下一窗口：第 ${Math.floor(next / OUTPUT_SIZE) + 1} 行、第 ${next % OUTPUT_SIZE + 1} 列`}>
              <Typography as="span" variant="bodySmall" tone="inherit">{actionLabel}</Typography><ControlIcon name={complete ? 'check' : automatic ? 'pause' : 'arrow'} />
            </Button>
          </div>
        </>}
        <Typography className="rtg-convolution__calculation-note" variant="bodySmall" tone="muted">{phase === 'ready' ? '同一组权重，在各窗口共享' : '逐项相乘，再把 9 个乘积相加'}</Typography>
      </div>
      <div className={'rtg-convolution__operator rtg-convolution__write-arrow' + (resultVisible ? ' is-written' : '')} aria-hidden="true"><ControlIcon name="arrow" /></div>
      <figure className="rtg-convolution__figure">
        <figcaption className="rtg-convolution__figure-head">
          <Typography as="span" variant="body" tone="accent">特征图</Typography>
          <MathFormulaBlock appearance="plain" className="rtg-convolution__dimensions" ariaLabel="输出尺寸5乘5"><MathFormulaStatic latex={`${OUTPUT_SIZE}\\times${OUTPUT_SIZE}`} /></MathFormulaBlock>
        </figcaption>
        <div className="rtg-convolution__matrix-stage"><div className="rtg-convolution__matrix rtg-convolution__output" role="group" aria-label="点击输出格子检查对应输入窗口；方向键移动选择">
          {outputs.map((value, index) => <button type="button" key={index} data-output={index}
            ref={element => { outputRefs.current[index] = element; }}
            className={`rtg-convolution__cell${index === position ? ' is-current' : ''}${value === null ? ' is-empty' : value === 0 ? ' is-zero' : ' is-strong'}${activeStep === 1 && index === position ? ' is-awaiting' : ''}${activeStep === 2 && index === next ? ' is-next' : ''}`}
            aria-label={`输出第 ${Math.floor(index / 5) + 1} 行、第 ${index % 5 + 1} 列，${value === null ? '尚未计算' : `响应 ${value}`}${activeStep === 1 && index === position ? '，点击求和写入' : activeStep === 2 && index === next ? '，下一窗口，点击移动' : ''}`}
            aria-pressed={index === position} onClick={event => {
              if (activeStep === 1 && index === position) writeResponse();
              else selectPosition(index, event.detail === 0);
            }} onKeyDown={selectWithKeyboard}>
            {value === null && activeStep === 2 && index === next ? <ControlIcon name="arrow" />
              : <Typography as="span" variant="bodySmall" tone="inherit">{value === null ? (activeStep === 1 && index === position ? '?' : '·') : value}</Typography>}
          </button>)}
        </div></div>
        <div className="rtg-convolution__figure-note">
          <Typography variant="bodySmall" tone={complete ? 'success' : 'accent'}>{complete ? '一张特征图，保留各位置的响应' : phase === 'products' ? '问号处是当前写入位置' : '点格子，可查看对应窗口'}</Typography>
          <div className="rtg-convolution__legend"><Typography as="span" variant="bodySmall" tone="muted"><i className="is-zero" />零响应</Typography><Typography as="span" variant="bodySmall" tone="muted"><i className="is-strong" />强响应</Typography></div>
        </div>
      </figure>
      </div>
      <div className="rtg-convolution__insight" data-complete={complete}>
        <span className="rtg-convolution__insight-marker" aria-hidden="true"><ControlIcon name={resultVisible ? 'check' : 'pointer'} /></span>
        <Typography id="rtg-convolution-instruction" variant="bodySmall" tone="inherit" role="status">{insight}</Typography>
      </div>
    </section>

  </ContentBlock>;
}
