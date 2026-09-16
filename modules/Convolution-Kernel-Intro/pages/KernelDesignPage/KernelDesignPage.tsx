import { useEffect, useMemo, useState } from 'react';
import { Button, Callout, ContentBlock, Question, Typography, ValueTile } from '../../../shared/react';
import { BinaryGrid } from '../../components/BinaryGrid';
import { GameBlocked } from '../../components/GameReady';
import { KernelGrid } from '../../components/KernelGrid';
import { useKernelLesson } from '../../LessonContext';
import { EMPTY, type Cell, type GomokuGame } from '../../model/gomokuEngine';
import {
  KERNEL_SIZE,
  bestActivation,
  buildDisplayCells,
  dotProduct,
  kernelForWinDirection,
  matrixEquals,
  patchMatrix,
  playerForLayer,
  targetOppositeKernel,
  transformActionText,
  transformForWinDirection,
  type ImageTransform,
  type LayerKey,
  type Matrix,
} from '../../model/kernelLab';
import '../ck-pages.css';
import './KernelDesignPage.css';

type Phase = 'transform' | 'design' | 'scan' | 'complete';

const STEPS: ReadonlyArray<{ key: Phase; label: string }> = [
  { key: 'transform', label: '变换图像' },
  { key: 'design', label: '重新设计算子' },
  { key: 'scan', label: '再扫一次' },
  { key: 'complete', label: '回答问题' },
];

const QUESTION_OPTIONS = [
  { key: 'A', value: 'brightness-only', label: '只改变输出数值的范围。' },
  { key: 'B', value: 'position-only', label: '让同一特征出现在不同位置。' },
  { key: 'C', value: 'spatial-pattern', label: '突出不同方向或形状的特征。' },
  { key: 'D', value: 'same-sum', label: '权重总和相同，效果就相同。' },
];

const START: Cell = { row: 0, col: 0 };

export interface KernelDesignPageProps {
  /** 单选题答对、看清两次扫描的差别之后进入 MNIST 那一幕。 */
  onComplete: () => void;
}

export function KernelDesignPage({ onComplete }: KernelDesignPageProps) {
  const { game } = useKernelLesson();
  const ready = game.gameOver && game.winner !== EMPTY;
  return (
    <ContentBlock
      headingLevel={1}
      className="ck-page ck-page--design"
      title="换个方向，还能检测到吗？"
      subtitle="把图像整体变换一次，原来的算子就对不上了。重新设计一个 5 × 5 算子，让它对新方向产生最强的响应。"
    >
      {ready ? <KernelDesignBody game={game} onComplete={onComplete} /> : <GameBlocked game={game} />}
    </ContentBlock>
  );
}

function KernelDesignBody({ game, onComplete }: { game: GomokuGame; onComplete: () => void }) {
  const { designKernel, setDesignKernel } = useKernelLesson();
  const [phase, setPhase] = useState<Phase>('transform');
  const [transform, setTransform] = useState<ImageTransform>('none');
  const [layer, setLayer] = useState<LayerKey>('winner');
  const [scan, setScan] = useState<Cell>(START);
  const [bestSoFar, setBestSoFar] = useState(0);
  const [questionPassed, setQuestionPassed] = useState(false);

  const base = useMemo(() => kernelForWinDirection(game.winLine), [game.winLine]);
  const target = useMemo(() => targetOppositeKernel(game.winLine, base), [base, game.winLine]);
  const actionText = transformActionText(game.winLine);
  const player = playerForLayer(game.winner, layer);
  const kernel = phase === 'transform' ? base : designKernel;
  const scanning = phase === 'scan' || phase === 'complete';

  const patch = useMemo(
    () => (scanning ? patchMatrix(game.board, player, transform, scan.row, scan.col) : null),
    [game.board, player, scan, scanning, transform],
  );
  const cells = useMemo(
    () => buildDisplayCells(game.board, player, {
      transform,
      winLine: layer === 'winner' ? game.winLine : [],
      kernel: scanning ? designKernel : null,
      window: scanning ? { top: scan.row, left: scan.col } : null,
    }),
    [designKernel, game.board, game.winLine, layer, player, scan, scanning, transform],
  );
  const best = useMemo(
    () => (scanning ? bestActivation(game.board, player, transform, designKernel) : { value: 0, positions: [] }),
    [designKernel, game.board, player, scanning, transform],
  );
  const sum = patch ? dotProduct(designKernel, patch) : 0;
  const reached = phase === 'scan' && best.value > 0 && sum === best.value;

  useEffect(() => {
    if (reached) setPhase('complete');
  }, [reached]);

  // 设计矩阵与目标矩阵一致时自动进入下一阶段；用副作用而不是在点击回调里判断，
  // 这样连续快速点击也只会基于最新矩阵推进一次。
  useEffect(() => {
    if (phase !== 'design' || !matrixEquals(designKernel, target)) return;
    setScan(START);
    setBestSoFar(0);
    setPhase('scan');
  }, [designKernel, phase, target]);

  useEffect(() => {
    if (!scanning) return;
    setBestSoFar((current) => (sum > current ? sum : current));
  }, [scanning, sum]);

  const stepIndex = STEPS.findIndex((step) => step.key === phase);
  const targetOnes = countOnes(target);
  const designedOnes = countOnes(designKernel);
  const matchedOnes = designKernel.reduce(
    (total, line, row) => total + line.reduce((count, value, col) => count + (value && target[row][col] ? 1 : 0), 0),
    0,
  );

  const toggleCell = (row: number, col: number) => {
    setDesignKernel((current) => current.map((line, r) => (
      line.map((value, c) => (r === row && c === col ? (value ? 0 : 1) : value))
    )));
  };

  const beginTransform = () => {
    setTransform(transformForWinDirection(game.winLine));
    setScan(START);
    setPhase('design');
  };

  const readout = (
    <div className="ck-tile-row ck-tile-row--two">
      <ValueTile label="当前激活值" value={sum} tone={phase === 'complete' ? 'success' : 'blue'} />
      <ValueTile label="已经找到的最大值" value={bestSoFar} tone="orange" />
    </div>
  );

  return (
    <div className="ck-split">
      <section className="ck-figure-column" aria-label="被变换后的二值图像">
        <div className="ck-switch">
          <Typography variant="bodySmall" tone="muted">
            {phase === 'transform'
              ? '图像还没有变换：算子里的 1 与获胜连线仍然同方向。'
              : '图像已经' + actionText + '，原来的五个 1 换了方向。'}
          </Typography>
          {scanning && (
            <span className="ck-switch" role="group" aria-label="选择图层">
              <Button active={layer === 'winner'} onClick={() => setLayer('winner')}>赢家图</Button>
              <Button active={layer === 'loser'} onClick={() => setLayer('loser')}>输家图</Button>
            </span>
          )}
        </div>
        <div className="ck-figure-area">
          <div className="ck-square-frame">
            <BinaryGrid
              cells={cells}
              windowTop={scan.row}
              windowLeft={scan.col}
              windowSize={KERNEL_SIZE}
              showWindow={scanning}
              interactive={phase === 'scan'}
              onMoveWindow={(row, col) => setScan({ row, col })}
              label="变换后的二值棋盘"
            />
          </div>
        </div>
        {phase === 'complete' && readout}
      </section>

      <aside className="ck-side">
        {phase !== 'complete' && (
          <ol className="ck-steps">
            {STEPS.map((step, index) => (
              <li
                key={step.key}
                className={index === stepIndex ? 'is-current' : index < stepIndex ? 'is-done' : 'is-pending'}
              >
                <Typography as="span" variant="bodySmall" tone="inherit">{step.label}</Typography>
              </li>
            ))}
          </ol>
        )}

        {phase === 'transform' && (
          <>
            <section className="ck-card">
              <Typography as="h2" variant="h3" tone="accent">先看清原来的算子</Typography>
              <Typography variant="bodySmall" tone="muted">
                这盘棋是沿着一个方向连成五子的，所以原来的算子把 1 排在同样的方向上，扫到那条线时激活值最大。
              </Typography>
              <KernelGrid matrix={base} label="与获胜连线同方向的五乘五算子" className="ck-design-kernel" />
            </section>
            <Callout
              tone="orange"
              label="要做的变换"
              text={'把整张图' + actionText + '。形状变了，但算子还没有变——先看看它们还能不能对上。'}
            />
            <div className="ck-actions">
              <Button variant="primary" onClick={beginTransform}>{actionText + '图像'}</Button>
            </div>
          </>
        )}

        {phase === 'design' && (
          <>
            <section className="ck-card">
              <Typography as="h2" variant="h3" tone="accent">现在轮到你设计算子</Typography>
              <Typography variant="bodySmall" tone="muted">
                观察左边图像里 1 的排列，再调整下面的 5 × 5 小矩阵。悬浮方格会临时切换 0 / 1，点击才会保存。
              </Typography>
              <div className="ck-design-grid-wrap">
                <KernelGrid
                  matrix={designKernel}
                  editable
                  onToggle={toggleCell}
                  label="可编辑的五乘五算子"
                  className="ck-design-kernel"
                />
              </div>
              <Typography variant="bodySmall" tone="muted">
                已经放对 {matchedOnes} / {targetOnes} 个 1
                {designedOnes > matchedOnes ? '，还有 ' + (designedOnes - matchedOnes) + ' 个 1 放在了不该放的位置。' : '。'}
              </Typography>
            </section>
            <div className="ck-actions">
              <Button disabled={designedOnes === 0} onClick={() => setDesignKernel((current) => zeroOnes(current))}>
                清空
              </Button>
            </div>
          </>
        )}

        {phase === 'scan' && (
          <>
            {readout}
            <section className="ck-card">
              <Typography as="h2" variant="h3" tone="accent">你设计的 5 × 5 算子</Typography>
              <div className="ck-design-grid-wrap">
                <KernelGrid
                  matrix={designKernel}
                  hitMask={patch}
                  label="已设计的五乘五算子"
                  className="ck-design-kernel"
                />
              </div>
              <Typography variant="bodySmall" tone="muted">
                新的方向上有 {targetOnes} 个 1，算子也放了 {designedOnes} 个——只在 1 完全对齐的窗口里，激活值才最大。
              </Typography>
            </section>
            <Callout
              tone="blue"
              label="扫描提示"
              text="拖动橙色窗口，在变换后的图像上再找一次最大激活值。"
            />
          </>
        )}

        {phase === 'complete' && (
          <>
            <Callout
              tone="green"
              label="两次扫描都对上了"
              text="同一个算子只响应对应方向的图案。换句话说，算子决定模型能「看见」什么特征。"
            />
            <Question
              type="choice"
              typeLabel="单选题"
              title="不同的算子，有什么不同的效果？"
              options={QUESTION_OPTIONS}
              answer="spatial-pattern"
              textVariant="bodySmall"
              persistenceKey="convolution-kernel-intro-kernel-effect-v1"
              feedback={{
                initial: '选一个最贴近刚才两次扫描的答案。',
                correct: '正确。不同算子会突出不同的局部特征。',
                wrong: '再想想：算子的排列不同，关注的局部特征也不同。',
              }}
              onCheck={(result) => { if (result.ok) setQuestionPassed(true); }}
            />
            <div className="ck-actions">
              <Button variant="primary" disabled={!questionPassed} onClick={onComplete}>继续</Button>
              {!questionPassed && (
                <Typography variant="bodySmall" tone="muted">答对单选题以后进入下一幕。</Typography>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

function countOnes(matrix: Matrix): number {
  return matrix.reduce((total, line) => total + line.reduce((count, value) => count + (value ? 1 : 0), 0), 0);
}

function zeroOnes(matrix: Matrix): Matrix {
  return matrix.map((line) => line.map(() => 0));
}
