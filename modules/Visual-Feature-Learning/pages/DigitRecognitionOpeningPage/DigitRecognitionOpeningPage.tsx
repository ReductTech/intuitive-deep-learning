import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { moduleAssetUrl, Typography } from '../../../shared/react';
import './DigitRecognitionOpeningPage.css';

const ASSET_ID = '80396753-7fc8-4f55-9188-bddbdb828169';
const background = moduleAssetUrl(ASSET_ID, '1980_usa_bg.png');
const cheque = moduleAssetUrl(ASSET_ID, 'cheque.png');
const scanner = moduleAssetUrl(ASSET_ID, 'scanner_logo.png');
const DEMO_DIGITS = ['5', '0', '8', '7'] as const;
const BOX_COUNT = DEMO_DIGITS.length;
const CANVAS_SIZE = 180;

type ActiveStroke = { index: number; pointerId: number; x: number; y: number };

/** The handwriting is real canvas ink. The output is a temporary mock until a recognizer is connected. */
export function DigitRecognitionOpeningPage() {
  const canvases = useRef<Array<HTMLCanvasElement | null>>([]);
  const activeStroke = useRef<ActiveStroke | null>(null);
  const [written, setWritten] = useState<boolean[]>(Array(BOX_COUNT).fill(false));
  const completed = written.filter(Boolean).length;

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
  };

  const clear = () => {
    activeStroke.current = null;
    canvases.current.forEach((canvas) => canvas?.getContext('2d')?.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE));
    setWritten(Array(BOX_COUNT).fill(false));
  };

  return <main className="vfl-check-opening" style={{ backgroundImage: `url(${background})` }}>
    <header className="vfl-check-opening__heading">
      <Typography as="h1" variant="display" tone="inherit">计算机如何读懂手写数字？</Typography>
      <div className="vfl-check-opening__rule" aria-hidden="true" />
      <Typography as="p" variant="subtitle" tone="inherit">先把识别器看成一个黑盒，只关注输入与输出。</Typography>
    </header>

    <div className="vfl-check-opening__cheque">
      <img src={cheque} alt="一张留有手写金额位置的复古银行支票" draggable={false} />
      <div className="vfl-check-opening__amount" role="group" aria-label="支票金额，四个可手写的数字格">
        {DEMO_DIGITS.map((_, index) => <div className="vfl-check-opening__digit-cell" key={index}>
          <canvas
            ref={(node) => { canvases.current[index] = node; }}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            aria-label={`在金额第 ${index + 1} 格手写一个数字`}
            onPointerDown={(event) => startStroke(index, event)}
            onPointerMove={(event) => moveStroke(index, event)}
            onPointerUp={endStroke}
            onPointerCancel={endStroke}
          />
        </div>)}
      </div>
    </div>

    <div className="vfl-check-opening__scan-bridge" aria-hidden="true">
      <span className="vfl-check-opening__arrow">➜</span>
      <img src={scanner} alt="" draggable={false} />
      <span className="vfl-check-opening__arrow">➜</span>
    </div>

    <section className="vfl-check-opening__terminal" aria-label="手写数字识别结果演示">
      <div className="vfl-check-opening__terminal-bar">
        <span className="vfl-check-opening__lights" aria-hidden="true"><i /><i /><i /></span>
        <Typography as="span" variant="bodySmall" tone="inherit">DIGIT READER</Typography>
      </div>
      <div className="vfl-check-opening__terminal-screen">
        <Typography as="span" variant="bodySmall" tone="muted">识别结果 · 演示</Typography>
        <div className="vfl-check-opening__readout" aria-live="polite" aria-label={`模拟识别结果：${DEMO_DIGITS.map((digit, index) => written[index] ? digit : '空').join('，')}`}>
          {DEMO_DIGITS.map((digit, index) => <Typography as="span" variant="display" tone="inherit" key={index}>{written[index] ? digit : '·'}</Typography>)}
          <span className="vfl-check-opening__caret" aria-hidden="true" />
        </div>
        <div className="vfl-check-opening__terminal-foot">
          <Typography as="span" variant="bodySmall" tone="muted">{completed === 0 ? '请在支票金额格中手写' : `已读取 ${completed} / ${BOX_COUNT} 格`}</Typography>
          <button type="button" onClick={clear} disabled={completed === 0} aria-label="清空支票上的手写数字">清空</button>
        </div>
      </div>
    </section>
  </main>;
}
