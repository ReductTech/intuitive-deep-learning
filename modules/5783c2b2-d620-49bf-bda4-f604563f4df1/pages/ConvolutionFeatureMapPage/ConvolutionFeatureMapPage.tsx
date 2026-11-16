import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Button, ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
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
  return <svg shuku-edit-id="e-efc6979c-d7b3-41d9-8b41-852405f7c8b5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {name === 'reset' ? <path shuku-edit-id="e-8a4bdc80-968d-4dfc-8070-ca3018c4adfd" d="M4 9a8 8 0 1 1 0 6M4 4v5h5" /> : name === 'pause' ? <path shuku-edit-id="e-93c7b1db-6794-4158-a675-139f74f2ed08" d="M9 5v14M15 5v14" />
      : name === 'check' ? <path shuku-edit-id="e-d4a6b073-1903-4b9c-b64a-8eb943b99b8f" d="m5 12 4 4L19 6" />
      : name === 'arrow' ? <path shuku-edit-id="e-e3d00fa4-f49c-4af0-85b5-43c9ca0aa43a" d="M4 12h16m-7-7 7 7-7 7" />
      : name === 'pointer' ? <path shuku-edit-id="e-8baa6848-2ca7-4d57-8225-1c49cd4258dd" d="M9 11V4a2 2 0 0 1 4 0v7m0-3h1a2 2 0 0 1 2 2h1a2 2 0 0 1 2 2v4a6 6 0 0 1-6 6h-1a5 5 0 0 1-4-2l-3-5a2 2 0 0 1 3-2l1 1" />
      : <path shuku-edit-id="e-5cddef33-b507-4973-a37b-fe06f4d85c59" d="m9 5 10 7-10 7Z" />}
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

  return <ContentBlock shuku-edit-id="e-fc648cb3-fd69-4182-a748-37464f126896" className="rtg-convolution" headingLevel={1}
    onKeyDown={event => { if ((event.key === ' ' || event.key === 'Enter') && event.target instanceof Element && event.target.closest('button, [data-product]')) event.stopPropagation(); }}
    title="特征表示怎样算出来？特征图怎样形成？"
    subtitle="一个小窗口反复滑动：对应相乘、相加，把每次得到的数字按位置排好。">
    <section shuku-edit-id="e-cad9d6bd-ac93-4f7f-98a6-9de0fac865ea" className="rtg-convolution__lab" data-phase={phase} data-automatic={automatic} aria-label="单通道人工核的滑动窗口计算实验">
      <div shuku-edit-id="e-71329c67-3400-4375-ad0b-9a0cfef708cd" className="rtg-convolution__toolbar">
      <ol shuku-edit-id="e-f11351b6-91d1-4bd5-bb7b-f2fa8743415c" className="rtg-convolution__steps" aria-label={automatic ? '正在自动扫描' : complete ? '特征图已完成' : '手动计算步骤'}>
        {['对应相乘', '求和写入', '移动窗口'].map((label, index) => <li shuku-edit-id="e-f9f2a5ea-f53c-43f3-b1a9-0ae350b3b5cf" key={label}
          className={(activeStep === index ? 'is-current' : complete || activeStep > index ? 'is-complete' : '')}
          aria-current={activeStep === index ? 'step' : undefined}>
          <span shuku-edit-id="e-7bae3ed6-0929-48fd-a88e-85742bb8fab9" className="rtg-convolution__step-content">
            <Typography shuku-edit-id="e-cf2b2a9e-9a26-4ac8-af2c-5ff847cd2258" as="span" className="rtg-convolution__step-number" variant="bodySmall" tone="inherit">{complete || activeStep > index ? <ControlIcon name="check" /> : `0${index + 1}`}</Typography>
            <Typography shuku-edit-id="e-22e9199b-d3b5-44bd-95d2-bfe8da893fa1" as="span" variant="bodySmall" tone="inherit" wrap="nowrap">{label}</Typography>
          </span>
        </li>)}
      </ol>
        <div shuku-edit-id="e-6293bdd1-4582-4898-af19-312dd651e96e" className="rtg-convolution__tools">
          <Button className="rtg-convolution__tool" data-action="auto" disabled={complete} aria-pressed={automatic} onClick={toggleAutomatic}>
            <ControlIcon name={complete ? 'check' : automatic ? 'pause' : 'play'} />
            <Typography shuku-edit-id="e-80d5c905-8e19-4ae6-8315-3f2595806435" as="span" variant="bodySmall" tone="inherit">{complete ? '已完成' : automatic ? '暂停' : '自动扫描'}</Typography>
          </Button>
          <Button className="rtg-convolution__tool" data-action="reset" onClick={reset} aria-label="重新开始计算特征图">
            <ControlIcon name="reset" /><Typography shuku-edit-id="e-f421160c-e671-4c4b-81a5-f6e4b5b5e7ee" as="span" variant="bodySmall" tone="inherit">重来</Typography>
          </Button>
        </div>
      </div>
      <div shuku-edit-id="e-84510086-eab5-47d8-adfd-6f81bf682d2f" className="rtg-convolution__workspace">
      <figure shuku-edit-id="e-d9aa9acb-5835-41a1-a91a-e6b89f780dbf" className="rtg-convolution__figure">
        <figcaption shuku-edit-id="e-1907826a-e1e8-4a87-b741-9c3f8f2e9867" className="rtg-convolution__figure-head">
          <Typography shuku-edit-id="e-01a64fab-6d36-475c-bb2a-12ef71909eb1" as="span" variant="body" tone="accent">输入</Typography>
          <MathFormulaBlock appearance="plain" className="rtg-convolution__dimensions" ariaLabel="输入尺寸7乘7"><MathFormulaStatic latex={`${INPUT_SIZE}\\times${INPUT_SIZE}`} /></MathFormulaBlock>
        </figcaption>
        <div shuku-edit-id="e-99564c4e-dae1-47fb-a8a7-4b7e72382b1c" className="rtg-convolution__matrix-stage"><div shuku-edit-id="e-dfb524bb-c403-4a27-b8b7-9d107a264dff" className="rtg-convolution__matrix rtg-convolution__input" aria-label="单通道教学输入，左边三列是9，右边四列是0">
          {INPUT.map((value, index) => {
            const row = Math.floor(index / INPUT_SIZE), column = index % INPUT_SIZE;
            const paired = pair !== null && row === response.row + Math.floor(pair / KERNEL_SIZE) && column === response.column + pair % KERNEL_SIZE;
            return <span shuku-edit-id="e-c86a43d6-0511-4c83-b9c8-156667f91e2e" key={index} className={`rtg-convolution__cell ${value === 9 ? 'is-light' : 'is-dark'}${paired ? ' is-paired' : ''}`}
              style={{ gridRow: row + 1, gridColumn: column + 1 }}>
              <Typography shuku-edit-id="e-b7e4a1bf-5981-4bba-85a1-dc7dd260271a" as="span" variant="bodySmall" tone="inherit">{value}</Typography>
            </span>;
          })}
          <span shuku-edit-id="e-5c576e37-01ee-4495-8d64-d61ed029862a" className="rtg-convolution__window" aria-hidden="true" style={{ gridRow: `${response.row + 1} / span 3`, gridColumn: `${response.column + 1} / span 3` }} />
        </div></div>
        <div shuku-edit-id="e-5b8d0fc0-6a90-41ab-8711-06234ba46ccb" className="rtg-convolution__figure-note">
          <Typography shuku-edit-id="e-a9d8ffd1-1c98-413c-854b-10c35efbf71a" variant="bodySmall" tone="accent">第 {response.row + 1} 行 · 第 {response.column + 1} 列的窗口</Typography>
          <div shuku-edit-id="e-f7a7b37a-8254-46f8-8b7a-24364dedd446" className="rtg-convolution__legend"><Typography shuku-edit-id="e-fa8b58c0-2fb4-4a66-845b-d4bb990dd236" as="span" variant="bodySmall" tone="muted"><i shuku-edit-id="e-859a30b1-7f44-4f4c-8704-2566d915acdf" className="is-light" />9 亮</Typography><Typography shuku-edit-id="e-6ccb8ab2-2cc2-4060-a1ab-442a19b7cc9b" as="span" variant="bodySmall" tone="muted"><i shuku-edit-id="e-ed951c4a-adba-4a5c-9122-b9d9041b2111" className="is-dark" />0 暗</Typography></div>
        </div>
      </figure>
      <div shuku-edit-id="e-87c52252-c26a-4566-8f03-c888ec868589" className="rtg-convolution__operator" aria-hidden="true"><ControlIcon name="arrow" /></div>
      <div shuku-edit-id="e-a0eb4780-f103-432f-9411-9ea585a25a80" ref={calculationRef} className="rtg-convolution__calculation" aria-label="当前窗口的计算">
        <div shuku-edit-id="e-3b867df2-28a5-4bae-8cc1-9aa25fc67028" className="rtg-convolution__figure-head">
          <Typography shuku-edit-id="e-dc4a6667-c456-4f48-841b-d73e72dc7694" variant="body" tone="accent">{phase === 'ready' ? '卷积核' : '对应相乘'}</Typography>
          <MathFormulaBlock appearance="plain" className="rtg-convolution__dimensions" ariaLabel="核尺寸3乘3"><MathFormulaStatic latex={`${KERNEL_SIZE}\\times${KERNEL_SIZE}`} /></MathFormulaBlock>
        </div>
        {phase === 'ready' ? <Button data-action="multiply" className="rtg-convolution__kernel-control"
          disabled={automatic || complete} onClick={revealProducts} aria-label="对应相乘：计算当前窗口的九个乘积" aria-describedby="rtg-convolution-instruction">
          <span shuku-edit-id="e-13acdc0f-3bf4-4368-8e91-7719d60d7515" className="rtg-convolution__kernel-grid">
            {KERNEL.map((value, index) => <span shuku-edit-id="e-c18834f6-81d2-48b1-9032-c536d2710c75" className="rtg-convolution__weight" key={index}>
              <Typography shuku-edit-id="e-0ca261b8-ea67-4ff7-93bf-40909452d721" as="span" variant="h3" tone="inherit">{displayNumber(value)}</Typography>
            </span>)}
          </span>
          <span shuku-edit-id="e-c9e00799-b495-44d7-b591-9a77c79d7ad8" className="rtg-convolution__primary-label"><ControlIcon name="pointer" /><Typography shuku-edit-id="e-d12bc22b-165b-4718-9a15-faf4184f4de4" as="span" variant="body" tone="inherit">对应相乘</Typography><ControlIcon name="arrow" /></span>
        </Button> : <>
          <div shuku-edit-id="e-f7126c7a-5930-45b3-bc78-9f443460c850" className="rtg-convolution__products" role="group" aria-label="按三行三列排列的九项对应乘积；聚焦或指向一项可查看输入位置">
            {response.values.map((value, index) => <div shuku-edit-id="e-9af4931c-1ae7-40e5-9bc6-5c7408c9196b" key={index} data-product={index} tabIndex={automatic ? -1 : 0}
              className={'rtg-convolution__product' + (pair === index ? ' is-paired' : '')}
              onMouseEnter={() => { if (!automatic) setPair(index); }} onMouseLeave={() => setPair(null)} onFocus={() => setPair(index)} onBlur={() => setPair(null)} onKeyDown={handleProductKeyDown}
              aria-label={`第 ${Math.floor(index / KERNEL_SIZE) + 1} 行，第 ${index % KERNEL_SIZE + 1} 列：${value} 乘以 ${KERNEL[index]} 等于 ${response.products[index]}`}>
              <MathFormulaBlock appearance="plain" aria-hidden="true"><MathFormulaStatic latex={`\\begin{gathered}${value}\\times${displayWeight(KERNEL[index])}\\\\=\\mathbf{${response.products[index]}}\\end{gathered}`} /></MathFormulaBlock>
            </div>)}
          </div>
          <div shuku-edit-id="e-e22a7c5c-660d-40de-806a-206906dec989" className="rtg-convolution__action-row">
            <div shuku-edit-id="e-01f36281-df3f-4c0e-8576-ba0715507782" className={'rtg-convolution__response' + (resultVisible ? ' is-written' : '')} aria-label={resultVisible ? `九项乘积之和为${response.sum}` : '将九项乘积相加'}>
              <Typography shuku-edit-id="e-9f189238-15aa-48e4-8766-ff037093247b" variant="bodySmall" tone="inherit">九项之和</Typography>
              <Typography shuku-edit-id="e-3a8af993-6850-49ab-b5ba-4b5571b0d5a8" as="span" variant="h2" tone="inherit">{resultVisible ? response.sum : '?'}</Typography>
            </div>
            <Button data-action={phase === 'products' ? 'write' : 'next'}
              disabled={automatic || complete} onClick={phase === 'products' ? writeResponse : moveWindow}
              className={'rtg-convolution__primary-action' + (complete ? ' is-complete' : '')} aria-describedby="rtg-convolution-instruction"
              aria-label={phase === 'products' ? '将九个乘积求和并写入当前输出格' : complete ? '特征图已完成' : `移动到下一窗口：第 ${Math.floor(next / OUTPUT_SIZE) + 1} 行、第 ${next % OUTPUT_SIZE + 1} 列`}>
              <Typography shuku-edit-id="e-d915ff95-c798-42bb-b31e-1fe49a687061" as="span" variant="bodySmall" tone="inherit">{actionLabel}</Typography><ControlIcon name={complete ? 'check' : automatic ? 'pause' : 'arrow'} />
            </Button>
          </div>
        </>}
        <Typography shuku-edit-id="e-2619698a-5398-45cd-ae98-d5a1d39eec25" className="rtg-convolution__calculation-note" variant="bodySmall" tone="muted">{phase === 'ready' ? '同一组权重，在各窗口共享' : '逐项相乘，再把 9 个乘积相加'}</Typography>
      </div>
      <div shuku-edit-id="e-c2802d6a-7c44-4db4-975d-0d99d7c7b794" className={'rtg-convolution__operator rtg-convolution__write-arrow' + (resultVisible ? ' is-written' : '')} aria-hidden="true"><ControlIcon name="arrow" /></div>
      <figure shuku-edit-id="e-c4c4a3fb-5146-49e6-a5a2-07409d6aae4b" className="rtg-convolution__figure">
        <figcaption shuku-edit-id="e-819c8605-d65d-4b0e-ba48-752d3fda3f78" className="rtg-convolution__figure-head">
          <Typography shuku-edit-id="e-450a8bc6-1f5f-42e6-a559-2f0f3f2baa25" as="span" variant="body" tone="accent">特征图</Typography>
          <MathFormulaBlock appearance="plain" className="rtg-convolution__dimensions" ariaLabel="输出尺寸5乘5"><MathFormulaStatic latex={`${OUTPUT_SIZE}\\times${OUTPUT_SIZE}`} /></MathFormulaBlock>
        </figcaption>
        <div shuku-edit-id="e-767b1ae0-0f5a-4e37-a0c5-0f174ebc7ae5" className="rtg-convolution__matrix-stage"><div shuku-edit-id="e-661e2ced-1176-4e16-a4dd-b2da30916b49" className="rtg-convolution__matrix rtg-convolution__output" role="group" aria-label="点击输出格子检查对应输入窗口；方向键移动选择">
          {outputs.map((value, index) => <button shuku-edit-id="e-f068b27b-7ebe-47c5-8032-40eccecb004b" type="button" key={index} data-output={index}
            ref={element => { outputRefs.current[index] = element; }}
            className={`rtg-convolution__cell${index === position ? ' is-current' : ''}${value === null ? ' is-empty' : value === 0 ? ' is-zero' : ' is-strong'}${activeStep === 1 && index === position ? ' is-awaiting' : ''}${activeStep === 2 && index === next ? ' is-next' : ''}`}
            aria-label={`输出第 ${Math.floor(index / 5) + 1} 行、第 ${index % 5 + 1} 列，${value === null ? '尚未计算' : `响应 ${value}`}${activeStep === 1 && index === position ? '，点击求和写入' : activeStep === 2 && index === next ? '，下一窗口，点击移动' : ''}`}
            aria-pressed={index === position} onClick={event => {
              if (activeStep === 1 && index === position) writeResponse();
              else selectPosition(index, event.detail === 0);
            }} onKeyDown={selectWithKeyboard}>
            {value === null && activeStep === 2 && index === next ? <ControlIcon name="arrow" />
              : <Typography shuku-edit-id="e-c35c1a09-f002-4fac-8838-a8f3e22db5c3" as="span" variant="bodySmall" tone="inherit">{value === null ? (activeStep === 1 && index === position ? '?' : '·') : value}</Typography>}
          </button>)}
        </div></div>
        <div shuku-edit-id="e-950263ed-467a-4416-9b30-e7b5714ac92f" className="rtg-convolution__figure-note">
          <Typography shuku-edit-id="e-21574054-722d-40b8-a167-94460fec465a" variant="bodySmall" tone={complete ? 'success' : 'accent'}>{complete ? '一张特征图，保留各位置的响应' : phase === 'products' ? '问号处是当前写入位置' : '点格子，可查看对应窗口'}</Typography>
          <div shuku-edit-id="e-9d3c8b9f-a8f7-4a67-bf7b-d729f8a2f46d" className="rtg-convolution__legend"><Typography shuku-edit-id="e-5c67317b-c50a-4fe9-ad7b-105ccc96406f" as="span" variant="bodySmall" tone="muted"><i shuku-edit-id="e-099c6e9b-9e89-40a7-9c2b-645afc431763" className="is-zero" />零响应</Typography><Typography shuku-edit-id="e-a7371dde-01df-4251-af5e-3002eace0f7f" as="span" variant="bodySmall" tone="muted"><i shuku-edit-id="e-172a3fe4-b3ce-40ed-9c3f-d878bea8e2b6" className="is-strong" />强响应</Typography></div>
        </div>
      </figure>
      </div>
      <div shuku-edit-id="e-c2ceeacc-0bdb-4008-9cb9-b1cd9668041a" className="rtg-convolution__insight" data-complete={complete}>
        <span shuku-edit-id="e-b0900eaa-d9be-4d97-b7d8-2a55bf2e1da4" className="rtg-convolution__insight-marker" aria-hidden="true"><ControlIcon name={resultVisible ? 'check' : 'pointer'} /></span>
        <Typography shuku-edit-id="e-fe05cf26-ed97-4c6a-93d4-3ae08e427609" id="rtg-convolution-instruction" variant="bodySmall" tone="inherit" role="status">{insight}</Typography>
      </div>
    </section>

  </ContentBlock>;
}
