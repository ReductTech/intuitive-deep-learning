import type { ReactNode } from 'react';
import { Button, Callout } from '../../shared/react';
import { useKernelLesson } from '../LessonContext';
import { demoWinGame, EMPTY, type GomokuGame } from '../model/gomokuEngine';
import './GameReady.css';

export interface GameReadyProps {
  /** 只在棋局已经分出胜负时渲染；平局与未结束都走同一个兜底。 */
  children: (game: GomokuGame) => ReactNode;
}

/**
 * 第二幕之后的每一页都建立在「上一盘棋已经分出胜负」这个前提上。
 * 直接从幻灯片跳进来时没有棋局，这里给一个明确的、可操作的空状态。
 */
export function GameReady({ children }: GameReadyProps) {
  const { game, updateGame } = useKernelLesson();
  if (game.gameOver && game.winner !== EMPTY) return <>{children(game)}</>;
  return <GameBlocked game={game} onLoadDemo={() => updateGame(() => demoWinGame())} />;
}

export interface GameBlockedProps {
  game: GomokuGame;
  onLoadDemo?: () => void;
}

/** 没有可用棋局时的兜底：说清楚为什么进不来，并给一个一键补棋局的入口。 */
export function GameBlocked({ game, onLoadDemo }: GameBlockedProps) {
  const { updateGame } = useKernelLesson();
  const load = onLoadDemo ?? (() => updateGame(() => demoWinGame()));
  return (
    <div className="ck-game-ready">
      <Callout
        tone="orange"
        label={game.gameOver ? '这一局是平局' : '还没有分出胜负'}
        text="接下来的内容需要一盘有胜负的棋局。可以先回到第一页把这盘棋下完，或者直接加载一个已经结束的示例棋局。"
      />
      <Button variant="primary" onClick={load}>加载示例棋局</Button>
    </div>
  );
}
