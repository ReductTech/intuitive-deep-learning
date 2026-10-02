import { useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Button, moduleAssetUrl, Typography } from '../../../shared/react';
import { recognizeEmnistDigit } from '../../services/emnistDigitRecognizer';
import { recognizedAmountWords } from './amountWords';
import './DigitRecognitionOpeningPage.css';

const ASSET_ID = '80396753-7fc8-4f55-9188-bddbdb828169';
const background = moduleAssetUrl(ASSET_ID, '1980_usa_bg.png');
const cheque = moduleAssetUrl(ASSET_ID, 'cheque.png');
const scanner = moduleAssetUrl(ASSET_ID, 'scanner_logo.png');
const BOX_COUNT = 4;
const CANVAS_SIZE = 180;

type ActiveStroke = { index: number; pointerId: number; x: number; y: number };

export function DigitRecognitionOpeningPage() {
  const terminalRef = useRef<HTMLElement | null>(null);
  const windowAnimation = useRef<Animation | null>(null);
  const animateWindow = (action: 'close' | 'minimize' | 'maximize') => {
    const terminal = terminalRef.current;
    if (!terminal) return;
    windowAnimation.current?.cancel();
    const frames = action === 'close' ? [
      { transform: 'scale(1)', opacity: 1, offset: 0 },
      { transform: 'scale(.03)', opacity: 0, offset: .32 },
      { transform: 'scale(.03)', opacity: 0, offset: .45 },
      { transform: 'scale(1.04)', opacity: 1, offset: .8 },
      { transform: 'scale(1)', opacity: 1, offset: 1 },
    ] : action === 'minimize' ? [
      { transform: 'translateY(0) scale(1)', opacity: 1, offset: 0 },
      { transform: 'translateY(160px) scale(.08)', opacity: .15, offset: .38 },
      { transform: 'translateY(160px) scale(.08)', opacity: .15, offset: .5 },
      { transform: 'translateY(-6px) scale(1.02)', opacity: 1, offset: .82 },
      { transform: 'translateY(0) scale(1)', opacity: 1, offset: 1 },
    ] : [
      { transform: 'scale(1)', offset: 0 },
      { transform: 'scale(.25)', offset: .18 },
      { transform: 'scale(1.05)', offset: .65 },
      { transform: 'scale(.98)', offset: .85 },
      { transform: 'scale(1)', offset: 1 },
    ];
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    windowAnimation.current = terminal.animate(reducedMotion ? [{ opacity: .6 }, { opacity: 1 }] : frames,
      { duration: reducedMotion ? 180 : 850, easing: 'cubic-bezier(.22,.65,.3,1)' });
  };
  const canvases = useRef<Array<HTMLCanvasElement | null>>([]);
  const activeStroke = useRef<ActiveStroke | null>(null);
  const requestIds = useRef<number[]>(Array(BOX_COUNT).fill(0));
  const recognitionQueue = useRef<Promise<void>>(Promise.resolve());
  const [written, setWritten] = useState<boolean[]>(Array(BOX_COUNT).fill(false));
  const [predictions, setPredictions] = useState<Array<string | null>>(Array(BOX_COUNT).fill(null));
  const [pending, setPending] = useState<boolean[]>(Array(BOX_COUNT).fill(false));
  const [error, setError] = useState<string | null>(null);
  const completed = written.filter(Boolean).length;
  const nextCell = written.findIndex((value) => !value);
  const reading = pending.some(Boolean);

  const amountTextRef = useRef<HTMLSpanElement | null>(null);
  const amountMeasureRef = useRef<HTMLSpanElement | null>(null);
  const streamedRef = useRef('');
  const [streamedWords, setStreamedWords] = useState('');
  const amountWords = recognizedAmountWords(predictions);
  useLayoutEffect(() => {
    const previous = streamedRef.current;
    let length = 0;
    while (length < previous.length && previous[length] === amountWords[length]) length += 1;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) length = amountWords.length;
    streamedRef.current = amountWords.slice(0, length);
    setStreamedWords(streamedRef.current);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const typeNext = () => {
      length += 1;
      streamedRef.current = amountWords.slice(0, length);
      setStreamedWords(streamedRef.current);
      if (length < amountWords.length) {
        timer = setTimeout(typeNext, amountWords[length] === ' ' ? 25 : 48);
      }
    };
    if (length < amountWords.length) timer = setTimeout(typeNext, 70);
    return () => { if (timer !== undefined) clearTimeout(timer); };
  }, [amountWords]);
  useLayoutEffect(() => {
    const element = amountTextRef.current;
    const measure = amountMeasureRef.current;
    if (!element || !measure) return;
    let size = 36;
    element.style.fontSize = size + 'px';
    while (measure.scrollWidth > element.clientWidth - 6 && size > 12) {
      size -= 0.5;
      element.style.fontSize = size + 'px';
    }
  }, [amountWords]);

  const readout = (index: number) => predictions[index] ?? (pending[index] ? '…' : written[index] ? '?' : '·');

  const recognize = (index: number, canvas: HTMLCanvasElement) => {
    const requestId = ++requestIds.current[index];
    const image = canvas.toDataURL('image/png');
    setPending((previous) => previous.map((value, cell) => cell === index ? true : value));
    setError(null);
    recognitionQueue.current = recognitionQueue.current.then(async () => {
      if (requestIds.current[index] !== requestId) return;
      try {
        const prediction = await recognizeEmnistDigit(image);
        if (requestIds.current[index] !== requestId) return;
        setPredictions((previous) => previous.map((value, cell) => cell === index ? prediction.digit : value));
      } catch (reason) {
        if (requestIds.current[index] !== requestId) return;
        setError(reason instanceof Error ? reason.message : '手写识别失败。');
      } finally {
        if (requestIds.current[index] === requestId) {
          setPending((previous) => previous.map((value, cell) => cell === index ? false : value));
        }
      }
    });
  };

  const point = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * CANVAS_SIZE / rect.width,
      y: (event.clientY - rect.top) * CANVAS_SIZE / rect.height,
    };
  };

  const startStroke = (index: number, event: ReactPointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const canvas = event.currentTarget;
    const context = canvas.getContext('2d');
    if (!context) return;
    requestIds.current[index] += 1;
    setPredictions((previous) => previous.map((value, cell) => cell === index ? null : value));
    setPending((previous) => previous.map((value, cell) => cell === index ? false : value));
    setError(null);
    canvas.setPointerCapture(event.pointerId);
    const current = point(event);
    context.fillStyle = '#143b66';
    context.beginPath();
    context.arc(current.x, current.y, 5.5, 0, Math.PI * 2);
    context.fill();
    activeStroke.current = { index, pointerId: event.pointerId, ...current };
  };

  const moveStroke = (index: number, event: ReactPointerEvent<HTMLCanvasElement>) => {
    const previous = activeStroke.current;
    if (!previous || previous.index !== index || previous.pointerId !== event.pointerId) return;
    event.preventDefault();
    const context = event.currentTarget.getContext('2d');
    if (!context) return;
    const current = point(event);
    context.strokeStyle = '#143b66';
    context.lineWidth = 11;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.beginPath();
    context.moveTo(previous.x, previous.y);
    context.lineTo(current.x, current.y);
    context.stroke();
    activeStroke.current = { index, pointerId: event.pointerId, ...current };
  };

  const endStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const stroke = activeStroke.current;
    if (stroke?.pointerId !== event.pointerId) return;
    activeStroke.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setWritten((previous) => previous.map((value, cell) => cell === stroke.index ? true : value));
    recognize(stroke.index, event.currentTarget);
  };

  const clear = () => {
    activeStroke.current = null;
    requestIds.current = requestIds.current.map((value) => value + 1);
    canvases.current.forEach((canvas) => canvas?.getContext('2d')?.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE));
    setWritten(Array(BOX_COUNT).fill(false));
    setPredictions(Array(BOX_COUNT).fill(null));
    setPending(Array(BOX_COUNT).fill(false));
    setError(null);
  };

  return <main className="vfl-check-opening relative h-[900px] w-[1600px] overflow-hidden bg-[#e6c79e] bg-[length:100%_100%] bg-center text-[#143656]" style={{ backgroundImage: `url(${background})` }}>
    <header className="vfl-check-opening__heading absolute left-[78px] top-[82px] z-[2] w-[1080px]">
      <Typography as="h1" variant="display" tone="inherit">计算机如何识别手写数字？</Typography>
      <div className="vfl-check-opening__rule mt-[15px] h-[10px] w-[890px] -skew-x-[32deg] border-b-[3px] border-t-[5px] border-b-[#b34835] border-t-[#173b60]" aria-hidden="true" />
      <Typography as="p" variant="body" tone="inherit" className="vfl-check-opening__story">
        <span>二战后，美国支票使用量迅速增长，银行每天要处理大量票据。</span>
        <span>人工分拣与录入难以跟上业务增长，自动化处理成为迫切需求。</span>
        <span>而支票上的手写金额，又该怎样交给计算机读取？</span>
      </Typography>
    </header>

    <div className="vfl-check-opening__cheque absolute left-[14px] top-[350px] z-[2] aspect-[1635/757] w-[860px]">
      <img className="block h-full w-full" src={cheque} alt="一张留有手写金额位置的复古银行支票" draggable={false} />
      <span ref={amountTextRef} className="vfl-check-opening__amount-words" aria-live="polite" aria-label={amountWords ? '金额英文：' + amountWords : undefined}><span aria-hidden="true">{streamedWords}</span><span ref={amountMeasureRef} className="vfl-check-opening__amount-measure" aria-hidden="true">{amountWords}</span></span>
      <div className="vfl-check-opening__amount absolute left-[61.4%] top-[36.8%] grid h-[17.6%] w-[32.6%] grid-cols-4 border-2 border-[#244666]" role="group" aria-label="支票金额，四个可手写的数字格">
        {Array.from({ length: BOX_COUNT }, (_, index) => <div className={`vfl-check-opening__digit-cell relative min-h-0 min-w-0 border-r-[1.5px] border-r-[#244666] last:border-r-0${index === nextCell ? ' is-next' : ''}`} key={index}>
          <canvas
            ref={(node) => { canvases.current[index] = node; }}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="block h-full w-full touch-none"
            aria-label={`在金额第 ${index + 1} 格手写一个数字`}
            onPointerDown={(event) => startStroke(index, event)}
            onPointerMove={(event) => moveStroke(index, event)}
            onPointerUp={endStroke}
            onPointerCancel={endStroke}
          />
        </div>)}
      </div>
    </div>

    <div className="vfl-check-opening__scan-bridge absolute left-[882px] top-[451px] z-[2] flex h-[210px] items-center gap-[7px]" aria-hidden="true">
      <span className="vfl-check-opening__arrow">➜</span>
      <img className="h-[190px] w-[190px] object-contain" src={scanner} alt="" draggable={false} />
      <span className="vfl-check-opening__arrow">➜</span>
    </div>

    <section ref={terminalRef} className="vfl-check-opening__terminal absolute right-[31px] top-[422px] z-[3] h-[247px] w-[354px] rounded-[18px] border-[8px] border-[#bda07f] bg-[#d7b994] p-[10px]" aria-label="手写数字识别结果演示">
      <div className="vfl-check-opening__terminal-bar flex h-[31px] items-center gap-[12px] rounded-t-[7px] border-2 border-b-0 border-[#163f66] bg-[#17466d] px-[10px]">
        <div className="vfl-check-opening__lights">
          <Button className="vfl-check-opening__window-control vfl-check-opening__window-control--red" aria-label="关闭识别窗口并弹回" onClick={() => animateWindow('close')}><i aria-hidden="true" /></Button>
          <Button className="vfl-check-opening__window-control vfl-check-opening__window-control--yellow" aria-label="最小化识别窗口并弹回" onClick={() => animateWindow('minimize')}><i aria-hidden="true" /></Button>
          <Button className="vfl-check-opening__window-control vfl-check-opening__window-control--green" aria-label="放大识别窗口" onClick={() => animateWindow('maximize')}><i aria-hidden="true" /></Button>
        </div>
      </div>
      <div className="vfl-check-opening__terminal-screen grid h-[180px] grid-rows-[auto_1fr_auto] rounded-b-[7px] border-2 border-t-0 border-[#163f66] px-[13px] pb-[10px] pt-[12px]">
        <Typography as="span" variant="bodySmall" tone="muted">识别结果</Typography>
        <div className="vfl-check-opening__readout flex min-w-0 items-center justify-center gap-[2px] overflow-hidden" aria-live="polite" aria-label={`识别结果：${Array.from({ length: BOX_COUNT }, (_, index) => readout(index)).join('，')}`}>
          {Array.from({ length: BOX_COUNT }, (_, index) => <Typography as="span" variant="display" tone="inherit" key={index}>{readout(index)}</Typography>)}
          <span className="vfl-check-opening__caret" aria-hidden="true" />
        </div>
        <div className="vfl-check-opening__terminal-foot flex items-center justify-between gap-[5px]">
          <Typography as="span" variant="bodySmall" tone="muted" title={error ?? undefined}>{error ? '识别失败：连接异常' : reading ? '正在识别手写数字…' : completed === 0 ? '请在支票金额格中手写' : `已书写 ${completed} / ${BOX_COUNT} 格`}</Typography>
          <button type="button" onClick={clear} disabled={completed === 0} aria-label="清空支票上的手写数字">清空</button>
        </div>
      </div>
    </section>
  </main>;
}
