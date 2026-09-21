import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  ContentBlock,
  Question,
  Typography,
  type QuestionCheckResult,
  type ShortAnswerReview,
} from '../../../shared/react';
import { useGomokuOutcome } from '../../LessonContext';
import { reviewGomokuWinAnswer } from '../../services/gomokuWinFeedback';
import { BLACK, BOARD_SIZE, EMPTY, winDirectionLabel, type Board, type Cell } from '../../model/gomokuEngine';
import './GomokuExplainPage.css';

/** 扫描演示每一步之间的间隔。 */
const SCAN_STEP_MS = 620;
/** 进页面到第一格之间的停顿。 */
const SCAN_LEAD_IN_MS = 900;
/** 上一页放大看过的窗口，这一页只借它来定底色分层的中心。 */
const WINDOW_SIZE = 9;
/** 底色从中心往外一共分五层，再远都并到最外那一层。 */
const RING_MAX = 4;
/** 整盘 15 × 15 的行列索引，以及跟着棋盘的 A–O / 1–15。 */
const ROWS = Array.from({ length: BOARD_SIZE }, (_, index) => index);
const COLUMN_LABELS = ROWS.map((index) => String.fromCharCode(65 + index));
const ROW_LABELS = ROWS.map((index) => String(index + 1));

function cellKey(row: number, col: number): string {
  return `${row}:${col}`;
}

/** 棋盘的数字版本：赢方的子记 1，对手的子记 -1，空点记 0。 */
function toNumberGrid(board: Board, winner: number): number[][] {
  return board.map((row) => row.map((stone) => {
    if (stone === EMPTY) return 0;
    return stone === winner ? 1 : -1;
  }));
}

/** 以棋形的最小外接矩形为中心取一个 size × size 的窗口，返回窗口正中的那一格。 */
function windowCentre(line: Cell[], size: number): Cell {
  const lineRows = line.map((cell) => cell.row);
  const lineCols = line.map((cell) => cell.col);
  const middle = Math.floor((BOARD_SIZE - 1) / 2);
  const midRow = lineRows.length ? Math.round((Math.min(...lineRows) + Math.max(...lineRows)) / 2) : middle;
  const midCol = lineCols.length ? Math.round((Math.min(...lineCols) + Math.max(...lineCols)) / 2) : middle;
  const half = Math.floor((size - 1) / 2);
  const limit = Math.max(0, BOARD_SIZE - size);
  return {
    row: Math.min(Math.max(midRow - half, 0), limit) + half,
    col: Math.min(Math.max(midCol - half, 0), limit) + half,
  };
}

/**
 * 连线的几何。格子是正方形，一格横向纵向都正好是 1 / 15 个百分比，
 * 于是把一条绝对定位的横条摆到两格中心的中点上、再转个角度就够了。
 */
function connectorStyle(line: readonly Cell[]): CSSProperties | null {
  if (line.length < 2) return null;
  const first = line[0];
  const last = line[line.length - 1];
  const unit = 100 / BOARD_SIZE;
  const stepX = (last.col - first.col) * unit;
  const stepY = (last.row - first.row) * unit;
  return {
    left: `${((first.col + last.col) / 2 + 0.5) * unit}%`,
    top: `${((first.row + last.row) / 2 + 0.5) * unit}%`,
    width: `${Math.hypot(stepX, stepY)}%`,
    transform: `translate(-50%, -50%) rotate(${(Math.atan2(stepY, stepX) * 180) / Math.PI}deg)`,
  };
}

export interface GomokuExplainPageProps {
  onComplete: () => void;
}

export function GomokuExplainPage({ onComplete }: GomokuExplainPageProps) {
  const { outcome } = useGomokuOutcome();
  const [scanned, setScanned] = useState(0);
  const [passed, setPassed] = useState(false);

  const line = outcome.winLine;
  const winnerLabel = outcome.winner === BLACK ? '黑' : '白';
  const grid = useMemo(() => toNumberGrid(outcome.board, outcome.winner), [outcome.board, outcome.winner]);
  const centre = useMemo(() => windowCentre(line, WINDOW_SIZE), [line]);
  const direction = useMemo(() => winDirectionLabel(line), [line]);
  const markedKeys = useMemo(
    () => new Set(line.slice(0, scanned).map((cell) => cellKey(cell.row, cell.col))),
    [line, scanned],
  );
  const complete = scanned >= line.length;
  const barStyle = complete ? connectorStyle(line) : null;

  // 进这一页就自己扫一遍：先让眼睛落在整盘上，再一格一格走。
  useEffect(() => {
    if (complete) return undefined;
    const timer = window.setTimeout(
      () => setScanned((value) => value + 1),
      scanned === 0 ? SCAN_LEAD_IN_MS : SCAN_STEP_MS,
    );
    return () => window.clearTimeout(timer);
  }, [complete, scanned]);

  const review = useCallback((answers: string[]): Promise<ShortAnswerReview> => (
    reviewGomokuWinAnswer(answers[0] ?? '', { boardSize: BOARD_SIZE, winner: winnerLabel, direction })
  ), [direction, winnerLabel]);

  const handleCheck = useCallback((result: QuestionCheckResult) => {
    if (!result.ok) return;
    setPassed(true);
    onComplete();
  }, [onComplete]);

  return (
    <ContentBlock
      headingLevel={1}
      className="ck-gomoku-explain"
      title="计算机是怎么“看”出输赢的？"
      subtitle="棋盘已经变成一堆数字了，这次你当计算机：你会怎么从这些数字里看出谁赢了？"
    >
      <div className="ck-gomoku-explain__layout">
        <div className="ck-gomoku-explain__matrix-slot">
          <div className="ck-gomoku-explain__matrix">
            <div className="ck-gomoku-explain__matrix-corner" aria-hidden="true" />

            <div className="ck-gomoku-explain__matrix-cols" aria-hidden="true">
              {COLUMN_LABELS.map((label) => (
                <Typography key={label} as="span" variant="body" tone="light">{label}</Typography>
              ))}
            </div>

            <div className="ck-gomoku-explain__matrix-rows" aria-hidden="true">
              {ROW_LABELS.map((label) => (
                <Typography key={label} as="span" variant="body" tone="light">{label}</Typography>
              ))}
            </div>

            <div
              className="ck-gomoku-explain__matrix-grid"
              role="group"
              aria-label={`十五路棋盘写成的数字矩阵：1 表示${winnerLabel}子，-1 表示对手的子，0 表示空点。`}
            >
              {ROWS.map((row) => ROWS.map((col) => {
                const value = grid[row][col];
                const ring = Math.min(
                  RING_MAX,
                  Math.max(Math.abs(row - centre.row), Math.abs(col - centre.col)),
                );
                const classes = [
                  'ck-gomoku-explain__cell',
                  `ck-gomoku-explain__cell--ring-${ring}`,
                  value === 1 ? 'ck-gomoku-explain__cell--one' : '',
                  value === -1 ? 'ck-gomoku-explain__cell--minus' : '',
                  markedKeys.has(cellKey(row, col)) ? 'is-marked' : '',
                ].filter(Boolean).join(' ');
                return (
                  <div key={cellKey(row, col)} className={classes}>
                    <Typography
                      as="span"
                      variant="body"
                      tone={value === 0 ? 'muted' : 'inherit'}
                      aria-hidden="true"
                    >
                      {value}
                    </Typography>
                  </div>
                );
              }))}

              {barStyle ? <span className="ck-gomoku-explain__connector" style={barStyle} aria-hidden="true" /> : null}
            </div>
          </div>
        </div>

        <div className="ck-gomoku-explain__panel">
          <Question
            type="short"
            textVariant="body"
            rows={3}
            typeLabel="说说你的判断过程"
            title={`这一局是${winnerLabel}棋赢的。假设你就是那台计算机，面对这张数字棋盘，你会怎么一步步看出这件事？`}
            submitText="提交我的说明"
            review={review}
            onCheck={handleCheck}
            persistenceKey="convolution-kernel-intro:gomoku-explain"
            feedback={{ initial: '写 1～3 句就够。提交后会给出针对你这段说明的评语。' }}
          />

          {passed && (
            <div className="ck-gomoku-explain__summary" aria-live="polite">
              <Typography as="p" variant="body" tone="main">
                <strong>说全了：</strong>每个位置一个数字（1 / -1 / 0） · 沿四个方向逐格扫 · 连续 5 个同色
              </Typography>
            </div>
          )}
        </div>
      </div>
    </ContentBlock>
  );
}
