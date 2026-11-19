import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
import { recognizeEmnistDigit } from '../../services/emnistDigitRecognizer';
import { recognizedAmountWords } from './amountWords';
import './DigitRecognitionOpeningPage.css';

const ASSET_ID = '80396753-7fc8-4f55-9188-bddbdb828169';
const background = moduleAssetUrl("1980_usa_bg.webp");
const cheque = moduleAssetUrl("cheque.webp");
const scanner = moduleAssetUrl("scanner_logo.webp");
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

  return <main shuku-edit-id="e-f6d243ef-36f6-4cc7-92a3-d861782e05f4" className="vfl-check-opening relative h-[900px] w-[1600px] overflow-hidden bg-[#e6c79e] bg-[length:100%_100%] bg-center text-[#143656]" style={{ backgroundImage: `url(${background})` }}>
    <header shuku-edit-id="e-c47af35e-ac7c-4846-a476-83f9129ad195" className="vfl-check-opening__heading absolute left-[78px] top-[82px] z-[2] w-[1080px]">
      <Typography shuku-edit-id="e-e7f640fc-c945-4951-99a9-e0ccbcd64789" as="h1" variant="display" tone="inherit">计算机如何识别手写数字？</Typography>
      <div shuku-edit-id="e-6eaefc96-49fa-4d32-a5d7-8ce60da061b3" className="vfl-check-opening__rule mt-[15px] h-[10px] w-[890px] -skew-x-[32deg] border-b-[3px] border-t-[5px] border-b-[#b34835] border-t-[#173b60]" aria-hidden="true" />
      <Typography shuku-edit-id="e-c43ec5dd-f4b9-4f3f-8f76-f71686bfa2f8" as="p" variant="body" tone="inherit" className="vfl-check-opening__story">
        <span shuku-edit-id="e-a9ba71ff-6b19-4d79-bce9-45a3715e1601">二战后，美国支票使用量迅速增长，银行每天要处理大量票据。</span>
        <span shuku-edit-id="e-1ee31a13-4347-4999-9c53-06fec41628f6">人工分拣与录入难以跟上业务增长，自动化处理成为迫切需求。</span>
        <span shuku-edit-id="e-4b8206e2-38e1-4bfa-a1b8-8326c52bdd18">而支票上的手写金额，又该怎样交给计算机读取？</span>
      </Typography>
    </header>

    <div shuku-edit-id="e-84171bd2-4f62-4781-a629-30324184a4aa" className="vfl-check-opening__cheque absolute left-[14px] top-[350px] z-[2] aspect-[1635/757] w-[860px]">
      <img shuku-edit-id="e-e6d69c38-af9e-4e2d-8b91-ccbe9b21239d" className="block h-full w-full" src={cheque} alt="一张留有手写金额位置的复古银行支票" draggable={false} />
      <span shuku-edit-id="e-3e1b7e4c-55da-44bb-baca-cba044a1361a" ref={amountTextRef} className="vfl-check-opening__amount-words" aria-live="polite" aria-label={amountWords ? '金额英文：' + amountWords : undefined}><span shuku-edit-id="e-bf9a8660-08a6-4930-b9a0-815870efbb91" aria-hidden="true">{streamedWords}</span><span shuku-edit-id="e-35eecccf-e429-4b50-8d32-1e8c1b0936c0" ref={amountMeasureRef} className="vfl-check-opening__amount-measure" aria-hidden="true">{amountWords}</span></span>
      <div shuku-edit-id="e-266446d5-2598-42a5-91a1-58768382305f" className="vfl-check-opening__amount absolute left-[61.4%] top-[36.8%] grid h-[17.6%] w-[32.6%] grid-cols-4 border-2 border-[#244666]" role="group" aria-label="支票金额，四个可手写的数字格">
        {Array.from({ length: BOX_COUNT }, (_, index) => <div shuku-edit-id="e-905403ce-bd51-4b88-b689-39f3b183bede" className={`vfl-check-opening__digit-cell relative min-h-0 min-w-0 border-r-[1.5px] border-r-[#244666] last:border-r-0${index === nextCell ? ' is-next' : ''}`} key={index}>
          <canvas shuku-edit-id="e-cd35c8cc-bad1-4858-9655-ce0a9c0d2d83"
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

    <div shuku-edit-id="e-e938af78-12e4-4061-bbe9-52ae2911f5ad" className="vfl-check-opening__scan-bridge absolute left-[882px] top-[451px] z-[2] flex h-[210px] items-center gap-[7px]" aria-hidden="true">
      <span shuku-edit-id="e-5e2207ba-f2e1-4f74-801a-ba904edab048" className="vfl-check-opening__arrow">➜</span>
      <img shuku-edit-id="e-a6f4aa7d-85c1-4a94-bf69-7936ddeacb73" className="h-[190px] w-[190px] object-contain" src={scanner} alt="" draggable={false} />
      <span shuku-edit-id="e-62b867ee-a25a-4628-b0af-e3e004bed751" className="vfl-check-opening__arrow">➜</span>
    </div>

    <section shuku-edit-id="e-18125321-5b5d-467a-a808-2d74fbacb192" ref={terminalRef} className="vfl-check-opening__terminal absolute right-[31px] top-[422px] z-[3] h-[247px] w-[354px] rounded-[18px] border-[8px] border-[#bda07f] bg-[#d7b994] p-[10px]" aria-label="手写数字识别结果演示">
      <div shuku-edit-id="e-2371a2c8-49d8-48cc-b7b6-8a83a3adeea3" className="vfl-check-opening__terminal-bar flex h-[31px] items-center gap-[12px] rounded-t-[7px] border-2 border-b-0 border-[#163f66] bg-[#17466d] px-[10px]">
        <div shuku-edit-id="e-e5c5d78e-dd3d-4db8-ad8f-04f3080b3c8f" className="vfl-check-opening__lights">
          <Button className="vfl-check-opening__window-control vfl-check-opening__window-control--red" aria-label="关闭识别窗口并弹回" onClick={() => animateWindow('close')}><i shuku-edit-id="e-167ffa24-53a5-44e5-8051-b7a974d47068" aria-hidden="true" /></Button>
          <Button className="vfl-check-opening__window-control vfl-check-opening__window-control--yellow" aria-label="最小化识别窗口并弹回" onClick={() => animateWindow('minimize')}><i shuku-edit-id="e-b97b005f-8a75-440f-b0ef-ab15fe6b57aa" aria-hidden="true" /></Button>
          <Button className="vfl-check-opening__window-control vfl-check-opening__window-control--green" aria-label="放大识别窗口" onClick={() => animateWindow('maximize')}><i shuku-edit-id="e-7cf09927-6b84-4987-8481-b245113882be" aria-hidden="true" /></Button>
        </div>
      </div>
      <div shuku-edit-id="e-92cf0703-1b67-4787-8f90-82243d0f26b5" className="vfl-check-opening__terminal-screen grid h-[180px] grid-rows-[auto_1fr_auto] rounded-b-[7px] border-2 border-t-0 border-[#163f66] px-[13px] pb-[10px] pt-[12px]">
        <Typography shuku-edit-id="e-f454e7b4-798b-441f-b201-1f65c480d145" as="span" variant="bodySmall" tone="muted">识别结果</Typography>
        <div shuku-edit-id="e-d748c1ce-758b-49f2-bcd4-3dbfa4485ddd" className="vfl-check-opening__readout flex min-w-0 items-center justify-center gap-[2px] overflow-hidden" aria-live="polite" aria-label={`识别结果：${Array.from({ length: BOX_COUNT }, (_, index) => readout(index)).join('，')}`}>
          {Array.from({ length: BOX_COUNT }, (_, index) => <Typography shuku-edit-id="e-e05fded8-f7ad-4f44-9a72-bd3a84804123" as="span" variant="display" tone="inherit" key={index}>{readout(index)}</Typography>)}
          <span shuku-edit-id="e-e757fc2e-4149-4dcf-90b1-477994076bb7" className="vfl-check-opening__caret" aria-hidden="true" />
        </div>
        <div shuku-edit-id="e-d50bcf49-3cb1-489b-9cdd-17108b1310a1" className="vfl-check-opening__terminal-foot flex items-center justify-between gap-[5px]">
          <Typography shuku-edit-id="e-e9b9e6ea-9c4e-4cf3-a129-bd9c61a762b1" as="span" variant="bodySmall" tone="muted">{error ? '识别未完成，请查看下方原因' : reading ? '正在识别手写数字…' : completed === 0 ? '请在支票金额格中手写' : `已书写 ${completed} / ${BOX_COUNT} 格`}</Typography>
          <button shuku-edit-id="e-e528d1db-64e1-4f8c-a381-1dc0f17edd9f" type="button" onClick={clear} disabled={completed === 0} aria-label="清空支票上的手写数字">清空</button>
        </div>
      </div>
    </section>
    {error && <aside shuku-edit-id="e-10fcf155-077a-40a6-82e4-603f0df53758" className="vfl-check-opening__error" role="alert">
      <Typography shuku-edit-id="e-f7adf2b3-c17e-42b8-8770-763f8a3e549e" as="p" variant="bodySmall" tone="inherit">{error}</Typography>
      <Typography shuku-edit-id="e-ea9db9c7-4ec8-4005-a0fa-63748b72c112" as="p" variant="bodySmall" tone="inherit">已保留笔迹，可以重试，无需重新书写。</Typography>
      <Button disabled={reading} onClick={() => {
        written.forEach((value, index) => {
          const canvas = canvases.current[index];
          if (value && predictions[index] === null && canvas) recognize(index, canvas);
        });
      }}>重新识别</Button>
    </aside>}
  </main>;
}
