import { useEffect, useRef, useState } from 'react';
import {
  Button,
  Callout,
  ContentBlock,
  Question,
  type QuestionCheckResult,
} from '../../shared/react';
import { GomokuCanvas } from '../components/GomokuCanvas';
import { usePersistedActivity } from '../components/usePersistedActivity';
import {
  AI,
  BOARD_SIZE,
  EMPTY,
  HUMAN,
  computeAiDecision,
  coordinate,
  createBoard,
  createDemoGame,
  placeStone,
  undoLastPair,
  type Board,
  type Cell,
  type Move,
  type Player,
} from '../model/gomokuEngine';
import type { GomokuSessionSnapshot } from '../model/sessionTypes';
import { reviewGomokuAnswer } from '../services/gomokuFeedback';

type Turn = 'human' | 'ai' | 'done';

interface GomokuState {
  board: Board;
  current: Turn;
  gameOver: boolean;
  winner: Player;
  winLine: Cell[];
  lastMove: Move | null;
  moveHistory: Move[];
  drawRequiresReset: boolean;
  answerPassed: boolean;
}

const STRATEGY_TIPS = [
  '越靠近棋盘中心，棋子通常越容易向多个方向延伸。',
  '计算机看到的棋盘，本质上是一张由数字组成的表格。',
  '别只盯着自己的棋，也要看看对手下一步最想下在哪里。',
  '连续三颗棋子已经值得警惕，再不阻止可能就晚了。',
  '程序判断胜负时，会分别检查横向、竖向和两条斜线。',
  '一条很长的棋路，不一定比两条同时发展的棋路更危险。',
  '有时最好的进攻，就是下在对手最需要的位置上。',
  '计算机不需要理解“棋”，它只需要找到连续出现的相同数字。',
  '棋子之间隔着一个空位，也可能隐藏着危险。',
  '同时影响两个方向的位置，往往比普通位置更有价值。',
  '扫描棋盘时，一个小窗口可以逐格移动，寻找特定的排列。',
  '发现对手已经连成四颗时，必须立刻阻止。',
  '边缘位置可以发展的方向较少，开局不要太早走到角落。',
  '胜负往往不取决于最后一步，而取决于几步前漏掉的威胁。',
  '只要检测到五个相同的数字连成一线，程序就能宣布胜负。',
];

function createInitial(): GomokuState {
  return {
    board: createBoard(),
    current: 'human',
    gameOver: false,
    winner: EMPTY,
    winLine: [],
    lastMove: null,
    moveHistory: [],
    drawRequiresReset: false,
    answerPassed: false,
  };
}

function normalizeState(stored: unknown): GomokuState | null {
  if (!stored || typeof stored !== 'object') return null;
  const value = stored as Partial<GomokuState>;
  if (
    !Array.isArray(value.board)
    || value.board.length !== BOARD_SIZE
    || value.board.some((row) => !Array.isArray(row) || row.length !== BOARD_SIZE)
  ) return null;
  const initial = createInitial();
  return {
    ...initial,
    ...value,
    board: value.board.map((row) => row.map((cell) => (
      cell === HUMAN || cell === AI ? cell : EMPTY
    ))),
    current: ['human', 'ai', 'done'].includes(String(value.current))
      ? value.current as Turn
      : 'human',
    winner: value.winner === HUMAN || value.winner === AI ? value.winner : EMPTY,
    winLine: Array.isArray(value.winLine)
      ? value.winLine.filter((cell): cell is Cell => (
        Boolean(cell)
        && Number.isInteger(cell.row)
        && Number.isInteger(cell.col)
      )).map((cell) => ({ row: cell.row, col: cell.col }))
      : [],
    moveHistory: Array.isArray(value.moveHistory)
      ? value.moveHistory.filter((move): move is Move => (
        Boolean(move)
        && Number.isInteger(move.row)
        && Number.isInteger(move.col)
        && (move.player === HUMAN || move.player === AI)
      )).map((move) => ({ ...move }))
      : [],
    lastMove: value.lastMove && Number.isInteger(value.lastMove.row) && Number.isInteger(value.lastMove.col)
      && (value.lastMove.player === HUMAN || value.lastMove.player === AI)
      ? { ...value.lastMove }
      : null,
    gameOver: value.gameOver === true,
    drawRequiresReset: value.drawRequiresReset === true,
    answerPassed: value.answerPassed === true,
  };
}

function sessionFromState(state: GomokuState): GomokuSessionSnapshot {
  return {
    board: state.board.map((row) => row.slice()),
    moveHistory: state.moveHistory.map((move) => ({ ...move })),
    winner: state.winner,
    winLine: state.winLine.map((cell) => ({ ...cell })),
  };
}

export function GomokuGameBlock({
  onComplete,
  lessonStepComplete = false,
  onSessionChange,
}: {
  onComplete: () => void;
  lessonStepComplete?: boolean;
  onSessionChange?: (snapshot: GomokuSessionSnapshot) => void;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const aiTimerRef = useRef<number | null>(null);
  const previousGameOverRef = useRef<boolean | null>(null);
  const [thinking, setThinking] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const { state, stateRef, hydrated, setDraft, commit } = usePersistedActivity<GomokuState>({
    stateKey: 'activity:convolution-kernel-gomoku',
    createInitial,
    normalizeState,
    getElement: () => rootRef.current,
  });

  useEffect(() => {
    const timer = window.setInterval(
      () => setTipIndex((index) => (index + 1) % STRATEGY_TIPS.length),
      4200,
    );
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => () => {
    if (aiTimerRef.current !== null) window.clearTimeout(aiTimerRef.current);
  }, []);

  useEffect(() => {
    if (!state?.gameOver || state.winner === EMPTY) return;
    onSessionChange?.(sessionFromState(state));
  }, [onSessionChange, state?.gameOver, state?.winner, state?.moveHistory.length]);

  useEffect(() => {
    const wasGameOver = previousGameOverRef.current;
    previousGameOverRef.current = state?.gameOver ?? null;
    if (!hydrated || wasGameOver !== false || !state?.gameOver || state.winner === EMPTY) return;
    const timer = window.setTimeout(() => {
      rootRef.current?.querySelector<HTMLElement>('.ck-reflection-panel')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 340);
    return () => window.clearTimeout(timer);
  }, [hydrated, state?.gameOver, state?.winner]);

  useEffect(() => {
    if (!hydrated || !state?.answerPassed || lessonStepComplete) return;
    onComplete();
  }, [hydrated, lessonStepComplete, onComplete, state?.answerPassed]);

  if (!hydrated || !state) {
    return (
      <ContentBlock title="你执黑先手，AI 执白后手">
        正在恢复棋局状态…
      </ContentBlock>
    );
  }

  const turnLabel = state.gameOver ? '本局结束' : thinking ? 'AI 思考' : '轮到你';
  const gameResult = state.gameOver
    ? state.winner === EMPTY ? '平局，请重新开局' : `${state.winner === HUMAN ? '你' : 'AI'}连成五子`
    : thinking ? 'AI 正在落子' : state.moveHistory.length ? '继续对弈' : '先落下一颗黑子';

  function clearAiTimer() {
    if (aiTimerRef.current !== null) {
      window.clearTimeout(aiTimerRef.current);
      aiTimerRef.current = null;
    }
    setThinking(false);
  }

  function reset() {
    clearAiTimer();
    commit('gomoku_game_reset', createInitial());
  }

  function undo() {
    const current = stateRef.current;
    if (!current || thinking || current.drawRequiresReset || !current.moveHistory.length) return;
    clearAiTimer();
    const undone = undoLastPair(current.board, current.moveHistory);
    commit('gomoku_pair_undone', {
      ...createInitial(),
      board: undone.board,
      moveHistory: undone.moveHistory,
      lastMove: undone.lastMove,
    }, { removed_count: current.moveHistory.length - undone.moveHistory.length });
  }

  function demo() {
    clearAiTimer();
    const game = createDemoGame();
    const next: GomokuState = {
      ...createInitial(),
      board: game.board,
      current: 'done',
      gameOver: true,
      winner: game.winner,
      winLine: game.winLine,
      lastMove: game.lastMove,
      moveHistory: game.moveHistory,
    };
    commit('gomoku_demo_loaded', next, { winner: 'human' });
  }

  function playHuman(row: number, col: number) {
    const current = stateRef.current;
    if (!current || thinking || current.gameOver || current.current !== 'human') return;
    const placed = placeStone(current.board, row, col, HUMAN);
    if (!placed) return;
    const humanHistory = [...current.moveHistory, placed.move];
    const afterHuman: GomokuState = {
      ...current,
      board: placed.board,
      moveHistory: humanHistory,
      lastMove: placed.move,
      winner: placed.winner,
      winLine: placed.winLine,
      gameOver: placed.winner !== EMPTY || placed.isDraw,
      drawRequiresReset: placed.isDraw,
      current: placed.winner !== EMPTY || placed.isDraw ? 'done' : 'ai',
      answerPassed: false,
    };
    if (afterHuman.gameOver) {
      commit('gomoku_round_played', afterHuman, {
        human_row: row,
        human_col: col,
        ai_moved: false,
        game_over: true,
      });
      return;
    }
    setDraft(afterHuman);
    setThinking(true);
    aiTimerRef.current = window.setTimeout(() => {
      aiTimerRef.current = null;
      const latest = stateRef.current;
      if (!latest || latest.gameOver || latest.current !== 'ai') {
        setThinking(false);
        return;
      }
      const decision = computeAiDecision(latest.board, latest.moveHistory);
      if (!decision) {
        setThinking(false);
        return;
      }
      const aiPlaced = placeStone(
        latest.board,
        decision.choice.row,
        decision.choice.col,
        AI,
      );
      if (!aiPlaced) {
        setThinking(false);
        return;
      }
      const next: GomokuState = {
        ...latest,
        board: aiPlaced.board,
        moveHistory: [...latest.moveHistory, aiPlaced.move],
        lastMove: aiPlaced.move,
        winner: aiPlaced.winner,
        winLine: aiPlaced.winLine,
        gameOver: aiPlaced.winner !== EMPTY || aiPlaced.isDraw,
        drawRequiresReset: aiPlaced.isDraw,
        current: aiPlaced.winner !== EMPTY || aiPlaced.isDraw ? 'done' : 'human',
        answerPassed: false,
      };
      setThinking(false);
      commit('gomoku_round_played', next, {
        human_row: row,
        human_col: col,
        ai_row: aiPlaced.move.row,
        ai_col: aiPlaced.move.col,
        ai_moved: true,
        game_over: next.gameOver,
      });
    }, 420);
  }

  function handleQuestion(result: QuestionCheckResult) {
    if (!result.ok || !stateRef.current?.gameOver || stateRef.current.winner === EMPTY) return;
    if (stateRef.current.answerPassed) return;
    setDraft((current) => ({ ...current, answerPassed: true }));
  }

  const reviewGame = sessionFromState(state);

  return (
    <div ref={rootRef}>
      <ContentBlock
        className="edu-stage edu-stage--featured ck-game-stage"
        title="你执黑先手，AI 执白后手"
        subtitle="这一幕只保留一件事：把棋局下到结束。结束后，请你解释计算机如何判断五子棋胜负。"
      >
      <div className="ck-game-layout">
        <section className="edu-card ck-board-panel" aria-label="五子棋棋盘">
          <div className="edu-metrics ck-scorebar" aria-live="polite">
            <div className="edu-metric ck-score-item"><span>回合</span><strong>{turnLabel}</strong></div>
            <div className="edu-metric ck-score-item"><span>步数</span><strong>{state.moveHistory.length}</strong></div>
            <div className="edu-metric ck-score-item ck-score-item--wide"><span>局面</span><strong>{gameResult}</strong></div>
          </div>
          <div className={`edu-canvas-frame ck-board-wrap ${thinking ? 'is-waiting' : ''}`}>
            <GomokuCanvas
              board={state.board}
              winLine={state.winLine}
              lastMove={state.lastMove}
              disabled={thinking || state.gameOver}
              onCell={playHuman}
            />
          </div>
          <div className="edu-toolbar-actions ck-board-actions">
            <Button variant="primary" hint={state.drawRequiresReset} onClick={reset}>重新开局</Button>
            <Button disabled={thinking || state.drawRequiresReset || !state.moveHistory.length} onClick={undo}>悔一步</Button>
            <Button disabled={thinking || state.drawRequiresReset} onClick={demo}>示例棋局</Button>
          </div>

        </section>
        <div className="ck-game-side">
          <aside className="edu-card ck-strategy-panel" aria-labelledby="strategyTitle">
            <div className="ck-strategy-head"><h3 className="edu-panel-title" id="strategyTitle">五子棋攻略</h3></div>
            <Callout tone="blue" label="观察提示" text={STRATEGY_TIPS[tipIndex]} className="ck-strategy-tip" />
          </aside>
          {state.gameOver && state.winner !== EMPTY && (
            <aside className="edu-card ck-reflection-panel" aria-labelledby="reflectionTitle">
              <h3 className="edu-panel-title" id="reflectionTitle">这局已经结束。计算机刚才是怎么判断胜负的？</h3>
              <p className="edu-panel-description">重点想一想：棋盘怎样表示、要扫描哪些方向，以及怎样确认连续同色棋子。</p>
              <Callout
                tone="green"
                text={state.winner === HUMAN ? '恭喜！您获胜了。' : '这局惜败，别灰心，再试一次！'}
                className="ck-win-summary"
              />
              <div id="winQuestionMount">
                <Question
                  type="short"
                  typeLabel="简答题"
                  title="请用自己的话解释计算机判断五子棋胜负的过程。"
                  rows={3}
                  submitText="提交评估"
                  persistenceKey="convolution-kernel-gomoku-win"
                  review={(answers) => reviewGomokuAnswer(answers, reviewGame)}
                  onCheck={handleQuestion}
                />
              </div>
            </aside>
          )}
          {state.gameOver && state.winner === EMPTY && (
            <Callout tone="orange" label="平局" text="棋盘已经下满，请重新开局再试一次。" />
          )}
        </div>
      </div>
      </ContentBlock>
    </div>
  );
}
