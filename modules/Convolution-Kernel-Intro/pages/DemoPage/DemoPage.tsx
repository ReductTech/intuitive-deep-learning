import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, ContentBlock, Typography } from '../../../shared/react';
import { GomokuBoard } from '../../components/GomokuBoard';
import {
  BOARD_SIZE,
  EMPTY,
  HUMAN,
  applyMove,
  computeAiDecision,
  createGame,
  demoWinGame,
  playAiMove,
  playerName,
  undoPair,
  type Cell,
  type GomokuGame,
} from '../../model/gomokuEngine';
import {
  KERNEL_SIZE,
  boardActivation,
  bestBoardActivation,
  directionForWinLine,
  directionLabel,
  kernelForDirection,
  type KernelDirection,
} from '../../model/kernelLab';
import { DemoMatrix } from './DemoMatrix';
import { DirectionPicker } from './DirectionPicker';
import '../ck-pages.css';
import './DemoPage.css';

/** 扫完棋盘上所有窗口位置的时长；按时间推进，慢机器上也不会越扫越久。 */
const SCAN_DURATION_MS = 2400;
/** 换一个方向只是把同一盘棋再看一遍，可以快一些。 */
const RESCAN_DURATION_MS = 1400;
const TICK_MS = 60;
/** 扫完停一拍，再让窗口落到匹配得最好的那一块。 */
const REVEAL_DELAY_MS = 420;
/** AI 落子前故意停一拍，让「思考」这一步看得见。 */
const AI_DELAY_MS = 420;
/** 还没有棋子时，窗口先停在棋盘中央。 */
const CENTER_WINDOW: Cell = {
  row: (BOARD_SIZE - KERNEL_SIZE) / 2,
  col: (BOARD_SIZE - KERNEL_SIZE) / 2,
};
/** 开局先摆横算子；四个方向随时可以换，选定哪个就用哪个去匹配。 */
const DEFAULT_DIRECTION: KernelDirection = 'horizontal';

export interface DemoPageProps {
  /** 看完这场演示后通知课程流程，把学习者带到下一页。 */
  onComplete: () => void;
}

/**
 * 开场演示：左边是真能落子的棋盘，右边是同一盘棋在计算机眼里的样子 ——
 * 你的棋子写成 1，其余写成 0，一块 5 × 5 的小窗口在上面挨个位置试，找五个 1 排成的线。
 * 打开页面时左边先摆好一盘已经下完的棋，右边立刻能看到「找到哪一块」；想自己下就点重新开局。
 */
export function DemoPage({ onComplete }: DemoPageProps) {
  const [game, setGame] = useState<GomokuGame>(demoWinGame);
  const [direction, setDirection] = useState<KernelDirection>(DEFAULT_DIRECTION);
  const [runId, setRunId] = useState(0);
  const [duration, setDuration] = useState(SCAN_DURATION_MS);
  const [progress, setProgress] = useState(0);
  const [revealed, setRevealed] = useState(false);
  /** 已经扫过的那一局，避免同一盘棋被反复重扫。 */
  const scannedRef = useRef<string | null>(null);

  // 窗口可以停的每一个位置（棋盘内部 11 × 11 个），按行优先排好，动画在这条线上往前走。
  const positions = useMemo(() => {
    const max = BOARD_SIZE - KERNEL_SIZE;
    const list: Cell[] = [];
    for (let row = 0; row <= max; row += 1) {
      for (let col = 0; col <= max; col += 1) list.push({ row, col });
    }
    return list;
  }, []);
  const total = positions.length;

  const finished = game.gameOver && game.winner !== EMPTY;
  const winner = finished ? directionForWinLine(game.winLine) : null;
  /** 棋局进行中看的是黑子（你）的 1；分出胜负以后看的是获胜方的 1。 */
  const player = finished ? game.winner : HUMAN;
  const kernel = useMemo(() => kernelForDirection(direction), [direction]);
  const best = useMemo(
    () => bestBoardActivation(game.board, player, kernel),
    [game.board, kernel, player],
  );
  /** 不在扫描时，窗口自己停在匹配得最好的位置；还没有棋子就停在正中。 */
  const restSpot = best.value > 0 ? best.positions[0] : CENTER_WINDOW;

  const sweeping = runId > 0 && !revealed;
  const spot = sweeping
    ? positions[Math.max(0, Math.min(total - 1, Math.ceil(progress) - 1))]
    : restSpot;
  const hits = boardActivation(game.board, player, spot.row, spot.col, kernel);
  const found = hits === KERNEL_SIZE;

  const startScan = useCallback((nextDuration: number) => {
    setDuration(nextDuration);
    setProgress(0);
    setRevealed(false);
    setRunId((value) => value + 1);
  }, []);

  // 扫描按时间推进：窗口从左上角出发，一路走到右下角。
  useEffect(() => {
    if (!runId) return undefined;
    const anchor = window.performance.now();
    const timer = window.setInterval(() => {
      const next = Math.min(total, ((window.performance.now() - anchor) / duration) * total);
      setProgress(next);
      if (next >= total) window.clearInterval(timer);
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [duration, runId, total]);

  // 扫完停一拍，再把窗口交给匹配得最好的那一块。
  useEffect(() => {
    if (!runId || progress < total) return undefined;
    const timer = window.setTimeout(() => setRevealed(true), REVEAL_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [progress, runId, total]);

  // 一方连成五子：自动换成获胜方向，并把整盘棋扫一遍。
  const winKey = finished
    ? game.winner + ':' + game.winLine.map((cell) => cell.row + ':' + cell.col).join('|')
    : '';
  useEffect(() => {
    if (!winKey || scannedRef.current === winKey) return;
    scannedRef.current = winKey;
    setDirection(directionForWinLine(game.winLine));
    startScan(SCAN_DURATION_MS);
  }, [game.winLine, startScan, winKey]);

  // AI 落子：人类落子后故意延迟一拍，让「AI 思考」这一步可见。
  useEffect(() => {
    if (game.current !== 'ai' || game.gameOver) return undefined;
    const decision = computeAiDecision(game.board, game.moveHistory);
    const timer = window.setTimeout(() => {
      setGame((current) => (
        current.current === 'ai' && !current.gameOver ? playAiMove(current, decision) : current
      ));
    }, AI_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [game]);

  /** 换方向：重新扫一遍，看看这个方向能在棋盘上找到什么。 */
  const pickDirection = (next: KernelDirection) => {
    setDirection(next);
    startScan(RESCAN_DURATION_MS);
  };

  /** 只在扫过之后才需要清空扫描状态；对局中的实时跟随不受影响。 */
  const clearScan = () => {
    scannedRef.current = null;
    setProgress(0);
    setRevealed(false);
    setRunId(0);
  };

  const placeStone = (row: number, col: number) => {
    setGame((current) => {
      if (current.gameOver || current.thinking || current.current !== 'human') return current;
      const placed = applyMove(current, row, col, HUMAN);
      if (!placed) return current;
      return placed.gameOver ? placed : { ...placed, current: 'ai', thinking: true };
    });
  };

  const restart = () => {
    clearScan();
    setDirection(DEFAULT_DIRECTION);
    setGame(createGame());
  };

  const loadDemo = () => {
    clearScan();
    setGame(demoWinGame());
  };

  const undoLastPair = () => {
    if (game.gameOver) clearScan();
    setGame((current) => (current.thinking || !current.moveHistory.length ? current : undoPair(current)));
  };

  const turnText = game.gameOver
    ? (game.winner === EMPTY ? '棋盘已下满，这一局是平局' : playerName(game.winner) + '连成五子，本局结束')
    : game.thinking ? 'AI 正在思考…' : '轮到你落子';
  const matchText = !game.gameOver
    ? '1 = 你的棋子'
    : !finished
      ? '平局'
      : sweeping
        ? '扫描中…'
        : found
          ? KERNEL_SIZE + ' / ' + KERNEL_SIZE + '，找到了'
          : '只对上 ' + hits + ' 个 1';
  const status = !game.gameOver
    ? '自己下一局：谁先连成五个，右边就能看到计算机是怎么把那五个 1 找出来的。'
    : !finished
      ? '棋盘已经下满，这一局是平局：点「重新开局」再试一次。'
      : sweeping
        ? '小窗口正从左上到右下挨个位置试过去，看哪一块最像它要找的形状。'
        : found
          ? '找到了：这一块里有五个 1 排成' + directionLabel(direction) + '，计算机据此判' + playerName(game.winner) + '赢。'
          : '这个方向只找到 ' + hits + ' 个 1，凑不成五个：算子只认自己那一种排列。';

  return (
    <ContentBlock
      headingLevel={1}
      className="ck-page ck-page--demo"
      title="卷积核，本质上是在识别局部模式"
      subtitle="计算机不会看棋：它把你的棋子写成一张 0 / 1 表，再用一块 5 × 5 的小窗口，去找五个 1 排成的那条线。"
    >
      <div className="ck-demo-stage">
        <figure className="ck-demo-card">
          <figcaption className="ck-demo-card-head">
            <span className="ck-demo-card-mark" aria-hidden="true" />
            <Typography as="span" variant="h3" tone="accent">人眼看到的棋盘</Typography>
            <Typography as="span" variant="bodySmall" tone="muted" className="ck-demo-turn" aria-live="polite">
              {turnText}
            </Typography>
          </figcaption>
          <div className="ck-demo-card-body">
            <div className="ck-square-frame">
              <GomokuBoard
                board={game.board}
                winLine={game.winLine}
                lastMove={game.lastMove}
                interactive={!game.gameOver && !game.thinking && game.current === 'human'}
                waiting={game.thinking}
                onPlace={placeStone}
              />
            </div>
          </div>
          <div className="ck-demo-card-foot">
            <Button variant="primary" onClick={restart}>重新开局，自己下一局</Button>
            <Button disabled={game.thinking || !game.moveHistory.length} onClick={undoLastPair}>悔一步</Button>
            <Button onClick={loadDemo}>看示例棋局</Button>
          </div>
        </figure>

        <div className="ck-demo-bridge">
          <Typography variant="body" tone="muted" align="center">同一盘棋</Typography>
          <svg className="ck-demo-arrow" viewBox="0 0 120 24" role="presentation">
            <path d="M0 9h86v-9l34 12-34 12v-9h-86z" />
          </svg>
          <Typography variant="body" tone="muted" align="center">写成 0 / 1</Typography>
        </div>

        <figure className="ck-demo-card ck-demo-card--plain">
          <figcaption className="ck-demo-card-head">
            <span className="ck-demo-card-mark" aria-hidden="true" />
            <Typography as="span" variant="h3" tone="accent">计算机看到的 0 / 1 表</Typography>
            <Typography
              as="span"
              variant="bodySmall"
              tone={found && !sweeping ? 'success' : 'muted'}
              className="ck-demo-turn"
              aria-live="polite"
            >
              {matchText}
            </Typography>
          </figcaption>
          <div className="ck-demo-card-body ck-demo-card-body--stack">
            <DirectionPicker value={direction} onChange={pickDirection} winDirection={winner} />
            <div className="ck-square-frame">
              <DemoMatrix
                board={game.board}
                player={player}
                kernel={kernel}
                windowTop={spot.row}
                windowLeft={spot.col}
                label="计算机眼中的棋盘：选定一方的棋子写成 1，其余写成 0；橙色方框是正在试的 5 × 5 窗口，绿色格子是窗口里对上的 1。"
              />
            </div>
          </div>
        </figure>
      </div>

      <div className="ck-demo-foot">
        <Typography
          variant="subtitle"
          tone={found && !sweeping && game.gameOver ? 'success' : 'main'}
          align="center"
          className="ck-demo-line"
        >
          {status}
        </Typography>
        <span className="ck-demo-line-mark" aria-hidden="true" />
        <div className="ck-demo-actions">
          <Button onClick={() => startScan(RESCAN_DURATION_MS)}>再看一遍</Button>
          <Button variant="primary" disabled={!game.gameOver} onClick={onComplete}>继续</Button>
        </div>
      </div>
    </ContentBlock>
  );
}
