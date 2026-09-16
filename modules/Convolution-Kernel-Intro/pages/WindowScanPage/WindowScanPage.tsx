import { useEffect, useMemo, useState } from 'react';
import { Button, Callout, ContentBlock, Typography, ValueTile } from '../../../shared/react';
import { BinaryGrid } from '../../components/BinaryGrid';
import { GameBlocked } from '../../components/GameReady';
import { KernelGrid } from '../../components/KernelGrid';
import { MultiplyGrid } from '../../components/MultiplyGrid';
import { useKernelLesson } from '../../LessonContext';
import { EMPTY, type Cell, type GomokuGame } from '../../model/gomokuEngine';
import {
  KERNEL_SIZE,
  bestActivation,
  buildDisplayCells,
  dotProduct,
  kernelForWinDirection,
  patchMatrix,
} from '../../model/kernelLab';
import '../ck-pages.css';
import './WindowScanPage.css';

const START: Cell = { row: 0, col: 0 };

export interface WindowScanPageProps {
  /** 找到最大激活值、看完扫描过程后进入设计算子的下一页。 */
  onComplete: () => void;
}

export function WindowScanPage({ onComplete }: WindowScanPageProps) {
  const { game } = useKernelLesson();
  const ready = game.gameOver && game.winner !== EMPTY;
  return (
    <ContentBlock
      headingLevel={1}
      className="ck-page ck-page--scan"
      title="拖动窗口，找出响应最强的地方"
      subtitle="用一个小矩阵去检测图像里的特定模式：它的 1 和刚才那条获胜连线的形状一致。把 5 × 5 窗口挪到对齐的位置，就能得到最大的激活值。"
    >
      {ready ? <WindowScanBody game={game} onComplete={onComplete} /> : <GameBlocked game={game} />}
    </ContentBlock>
  );
}

function WindowScanBody({ game, onComplete }: { game: GomokuGame; onComplete: () => void }) {
  const [scan, setScan] = useState<Cell>(START);
  const [foundMax, setFoundMax] = useState(false);
  const [bestSoFar, setBestSoFar] = useState(0);
  const [calcOpen, setCalcOpen] = useState(false);

  const player = game.winner;
  const kernel = useMemo(() => kernelForWinDirection(game.winLine), [game.winLine]);
  const best = useMemo(
    () => bestActivation(game.board, player, 'none', kernel),
    [game.board, kernel, player],
  );
  const patch = useMemo(
    () => patchMatrix(game.board, player, 'none', scan.row, scan.col),
    [game.board, player, scan],
  );
  const cells = useMemo(
    () => buildDisplayCells(game.board, player, {
      kernel,
      winLine: game.winLine,
      window: { top: scan.row, left: scan.col },
    }),
    [game.board, game.winLine, kernel, player, scan],
  );
  const sum = dotProduct(kernel, patch);
  const reached = best.value > 0 && sum === best.value;

  useEffect(() => {
    if (reached) setFoundMax(true);
  }, [reached]);

  useEffect(() => {
    setBestSoFar((current) => (sum > current ? sum : current));
  }, [sum]);

  const hitCount = patch.reduce(
    (total, line, row) => total + line.reduce((count, value, col) => count + (value && kernel[row][col] ? 1 : 0), 0),
    0,
  );
  const readout = foundMax
    ? '找到了。窗口里的 1 与算子的 1 完全对齐，激活值达到 ' + best.value + '。'
    : '拖动橙色窗口，继续寻找激活值更高的位置。';

  return (
    <div className="ck-split">
      <section className="ck-figure-column" aria-label="补零后的二值图像">
        <Typography variant="bodySmall" tone="muted">
          按住鼠标左键拖动橙色窗口；窗口中心会吸附到指针所在的格子。
        </Typography>
        <div className="ck-figure-area">
          <div className="ck-square-frame">
            <BinaryGrid
              cells={cells}
              windowTop={scan.row}
              windowLeft={scan.col}
              windowSize={KERNEL_SIZE}
              interactive
              onMoveWindow={(row, col) => setScan({ row, col })}
              label="补零后的二值棋盘，可以拖动五乘五窗口"
            />
          </div>
        </div>
      </section>

      <aside className="ck-side">
        <div className="ck-tile-row ck-tile-row--two">
          <ValueTile label="当前激活值" value={sum} tone={reached ? 'success' : 'blue'} />
          <ValueTile label="已经找到的最大值" value={bestSoFar} tone="orange" />
        </div>

        <section className="ck-card">
          <Typography as="h2" variant="h3" tone="accent">5 × 5 算子与当前窗口</Typography>
          <div className="ck-operator-row">
            <KernelGrid matrix={kernel} hitMask={patch} label="与获胜连线同方向的五乘五算子" />
          </div>
          <Typography variant="bodySmall" tone="muted">
            乘积之和 = {sum}，其中 {hitCount} 个 1 落在算子的 1 上。
          </Typography>
          <div className="ck-actions">
            <Button onClick={() => setCalcOpen(true)}>计算过程</Button>
          </div>
        </section>

        <Callout tone={foundMax ? 'green' : 'blue'} label="扫描提示" text={readout} />

        <div className="ck-actions">
          {foundMax && (
            <Button variant="primary" onClick={onComplete}>换一种模式试试吧</Button>
          )}
          <Button
            disabled={bestSoFar === 0 && scan.row === START.row && scan.col === START.col}
            onClick={() => setScan(START)}
          >
            窗口回到左上角
          </Button>
        </div>

      {calcOpen && (
        <div className="ck-calc-overlay" role="dialog" aria-label="按位相乘再相加的计算过程">
          <div className="ck-calc-head">
            <Typography as="h2" variant="h3" tone="accent">按位相乘再相加</Typography>
            <Button onClick={() => setCalcOpen(false)}>收起</Button>
          </div>
          <div className="ck-calc-body">
            <MultiplyGrid kernel={kernel} patch={patch} />
          </div>
          <Typography variant="bodySmall" tone="muted">
            M 是 5 × 5 算子，X 是当前窗口；每个格子给出两个因数与它们的乘积，全部相加 = {sum}。
          </Typography>
        </div>
      )}
      </aside>
    </div>
  );
}
