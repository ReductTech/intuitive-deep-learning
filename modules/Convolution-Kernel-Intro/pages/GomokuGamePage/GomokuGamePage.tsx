import { useEffect, useRef, useState } from 'react';
import { Button, Callout, ContentBlock, Typography, ValueTile } from '../../../shared/react';
import { GomokuBoard } from '../../components/GomokuBoard';
import { KernelGrid } from '../../components/KernelGrid';
import { useKernelLesson } from '../../LessonContext';
import { horizontalKernel } from '../../model/kernelLab';
import {
  EMPTY,
  HUMAN,
  STRATEGY_TIPS,
  applyMove,
  computeAiDecision,
  demoWinGame,
  gameStatus,
  playAiMove,
  playerName,
  undoPair,
  type GomokuGame,
} from '../../model/gomokuEngine';
import './GomokuGamePage.css';

const AI_DELAY_MS = 420;
const REVEAL_DELAY_MS = 340;
const TIP_INTERVAL_MS = 4200;
const TIP_FADE_MS = 140;

/** 第一页的伏笔：后面用来扫描棋盘的那个 5 × 5 算子，先在这里露一次面。 */
const TEASER_KERNEL = horizontalKernel();

export interface GomokuGamePageProps {
  /** 棋局结束时通知课程流程，把学习者带到解释胜负判断的下一页。 */
  onComplete: () => void;
}

export function GomokuGamePage({ onComplete }: GomokuGamePageProps) {
  const { game, updateGame, resetGame } = useKernelLesson();
  const [tipIndex, setTipIndex] = useState(0);
  const [tipChanging, setTipChanging] = useState(false);
  const fadeTimerRef = useRef(0);
  const completeRef = useRef(onComplete);
  const reportedRef = useRef(false);

  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  // AI 落子：人类落子后故意延迟一拍，让「AI 思考」这一步可见。
  useEffect(() => {
    if (game.current !== 'ai' || game.gameOver) return undefined;
    const decision = computeAiDecision(game.board, game.moveHistory);
    const timer = window.setTimeout(() => {
      updateGame((current) => (
        current.current === 'ai' && !current.gameOver ? playAiMove(current, decision) : current
      ));
    }, AI_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [game, updateGame]);

  // 观察提示轮播：先淡出，再换下一句；棋局结束后这一栏让位给本局结果。
  useEffect(() => {
    if (game.gameOver) return undefined;
    const interval = window.setInterval(() => {
      setTipChanging(true);
      fadeTimerRef.current = window.setTimeout(() => {
        setTipIndex((index) => (index + 1) % STRATEGY_TIPS.length);
        setTipChanging(false);
      }, TIP_FADE_MS);
    }, TIP_INTERVAL_MS);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(fadeTimerRef.current);
    };
  }, [game.gameOver]);

  // 分出胜负后稍作停顿，再进入下一页。
  useEffect(() => {
    if (!game.gameOver || reportedRef.current) return undefined;
    const timer = window.setTimeout(() => {
      reportedRef.current = true;
      completeRef.current();
    }, REVEAL_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [game.gameOver, game.winner]);

  const placeHumanStone = (row: number, col: number) => {
    updateGame((current) => {
      if (current.gameOver || current.thinking || current.current !== 'human') return current;
      const placed = applyMove(current, row, col, HUMAN);
      if (!placed) return current;
      return placed.gameOver ? placed : { ...placed, current: 'ai', thinking: true };
    });
  };

  const undoLastPair = () => updateGame((current) => (
    current.thinking || current.drawRequiresReset ? current : undoPair(current)
  ));
  const loadDemoGame = () => updateGame(() => demoWinGame());

  const status = gameStatus(game);
  const finished = game.gameOver;
  const resultTone = game.winner === HUMAN ? 'green' : game.winner === EMPTY ? 'blue' : 'orange';

  return (
    <ContentBlock
      headingLevel={1}
      className="ck-page ck-page--gomoku"
      title="你执黑先手，AI 执白后手"
      subtitle="先把这盘棋下完。棋局结束以后，我们再回头看：计算机究竟是怎样判断胜负的。"
    >
      <div className="ck-gomoku-layout">
        <section className="ck-gomoku-board-column" aria-label="五子棋对局">
          <div className="ck-gomoku-board-area">
            <GomokuBoard
              board={game.board}
              winLine={game.winLine}
              lastMove={game.lastMove}
              interactive={!finished && !game.thinking && game.current === 'human'}
              waiting={game.thinking}
              onPlace={placeHumanStone}
            />
          </div>
          <div className="ck-gomoku-actions">
            <Button variant="primary" hint={game.drawRequiresReset} onClick={resetGame}>重新开局</Button>
            <Button disabled={game.thinking || game.drawRequiresReset} onClick={undoLastPair}>悔一步</Button>
            <Button disabled={game.drawRequiresReset} onClick={loadDemoGame}>示例棋局</Button>
          </div>
        </section>

        <aside className="ck-gomoku-side">
          <div className="ck-gomoku-hud" aria-live="polite">
            <ValueTile label="回合" value={status.turn} tone="blue" />
            <ValueTile label="步数" value={game.moveHistory.length} />
            <ValueTile label="局面" value={status.position} tone={finished ? 'success' : 'orange'} />
          </div>

          {finished
            ? <Callout tone={resultTone} label="本局结果" text={resultSummaryText(game)} />
            : (
              <Callout
                tone="blue"
                label="观察提示"
                text={STRATEGY_TIPS[tipIndex]}
                className={tipChanging ? 'ck-tip is-changing' : 'ck-tip'}
              />
            )}

          <ol className="ck-gomoku-steps" aria-label="这一幕的任务">
            <li className={finished ? 'is-done' : 'is-active'}>
              <Typography as="span" variant="bodySmall" tone="inherit" className="ck-gomoku-step-index">1</Typography>
              <Typography as="span" variant="bodySmall" tone="inherit">下完这盘棋</Typography>
              <Typography as="span" variant="bodySmall" tone="inherit" className="ck-gomoku-step-state">{finished ? '已完成' : '进行中'}</Typography>
            </li>
            <li className={finished ? 'is-active' : 'is-pending'}>
              <Typography as="span" variant="bodySmall" tone="inherit" className="ck-gomoku-step-index">2</Typography>
              <Typography as="span" variant="bodySmall" tone="inherit">解释怎么判断胜负</Typography>
              <Typography as="span" variant="bodySmall" tone="inherit" className="ck-gomoku-step-state">{finished ? '下一页' : '待解锁'}</Typography>
            </li>
          </ol>

          <section className="ck-gomoku-teaser" aria-label="五连的形状">
            <div className="ck-gomoku-teaser-plate">
              <KernelGrid
                matrix={TEASER_KERNEL}
                className="ck-gomoku-teaser-kernel"
                label="5 × 5 的格子，中间一排是五个 1"
              />
              <Typography as="span" variant="bodySmall" tone="muted" align="center" className="ck-gomoku-teaser-caption">
                中间一排是五个 1
              </Typography>
            </div>
            <div className="ck-gomoku-teaser-copy">
              <Typography as="span" variant="bodySmall" tone="inherit" className="ck-gomoku-teaser-eyebrow">小笔记</Typography>
              <Typography as="h2" variant="h3" tone="inherit" className="ck-gomoku-teaser-title">五连就是这五个位置</Typography>
              <Typography variant="bodySmall" tone="inherit" className="ck-gomoku-teaser-body">
                横、竖、斜都算数，棋盘上凑齐这五个位置就赢了。
              </Typography>
            </div>
          </section>

          <Typography variant="bodySmall" tone="muted" className="ck-gomoku-help">
            点击交叉点落子；「悔一步」会同时退回你和 AI 的最近一手；「示例棋局」直接给出一个已经结束的局面。
          </Typography>
        </aside>
      </div>
    </ContentBlock>
  );
}

function resultSummaryText(game: GomokuGame): string {
  if (game.winner === HUMAN) return '你连成五子，赢下了这一局。';
  if (game.winner === EMPTY) return '棋盘已经下满，这一局是平局。';
  return playerName(game.winner) + '连成五子，这一局是你输了。';
}
