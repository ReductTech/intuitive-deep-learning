import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Button, ContentBlock, NoticeStrip, Question } from '../../shared/react';

interface GridSearchSimulationBlockProps { onComplete?: () => void; }

type Cell = {
  id: number;
  row: number;
  column: number;
  score: number;
};

const GRID_SIZE = 10;
const learningRates = ['1e-5', '2e-5', '5e-5', '1e-4', '2e-4', '5e-4', '1e-3', '2e-3', '5e-3', '1e-2'];
const weightDecays = ['1e-1', '5e-2', '2e-2', '1e-2', '5e-3', '2e-3', '1e-3', '5e-4', '2e-4', '1e-4'];

function performanceBaseScore(gap: number) {
  if (gap <= 1) return 100 - 2 * gap ** 2;
  if (gap <= 3) return 98 - 6 * (gap - 1);
  return Math.max(0, 86 - 10.93 * (gap - 3) ** 1.25);
}

function experimentPenalty(attempts: number) {
  return attempts <= 1 ? 0 : 2.5 * Math.log2(attempts);
}

function calculateGameScore(attempts: number, gap: number) {
  return Math.max(0, Math.round(performanceBaseScore(gap) - experimentPenalty(attempts)));
}

function buildLandscape() {
  const peakRow = 2 + Math.floor(Math.random() * 6);
  const peakColumn = 2 + Math.floor(Math.random() * 6);
  const rowWidth = .25 + Math.random() * .22;
  const columnWidth = .3 + Math.random() * .24;
  const phaseA = Math.random() * Math.PI * 2;
  const phaseB = Math.random() * Math.PI * 2;
  const targetPeak = Number((92 + Math.random() * 6).toFixed(1));
  const rawCells = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, id): Cell => {
    const row = Math.floor(id / GRID_SIZE);
    const column = id % GRID_SIZE;
    const distance = rowWidth * (row - peakRow) ** 2 + columnWidth * (column - peakColumn) ** 2;
    const wave = Math.sin((row + 1) * 1.73 + column * .91 + phaseA) * 1.15
      + Math.cos(column * 1.87 - row * .64 + phaseB) * .78
      + Math.sin((row + 2) * (column + 1) * .37) * .42;
    return { id, row, column, score: 90 - distance + wave };
  });
  const rawBest = rawCells.reduce((best, cell) => cell.score > best.score ? cell : best);
  const offset = targetPeak - rawBest.score;
  return rawCells.map((cell) => ({
    ...cell,
    score: cell.id === rawBest.id
      ? targetPeak
      : Math.min(targetPeak - .1, Number((cell.score + offset).toFixed(1))),
  }));
}

export function GridSearchSimulationBlock({ onComplete }: GridSearchSimulationBlockProps) {
  const [cells, setCells] = useState<Cell[]>(buildLandscape);
  const [revealed, setRevealed] = useState<Set<number>>(() => new Set());
  const [runningId, setRunningId] = useState<number | null>(null);
  const [runPhase, setRunPhase] = useState<'training' | 'validation'>('training');
  const [solved, setSolved] = useState(false);
  const [conditionalAnswerCorrect, setConditionalAnswerCorrect] = useState(false);
  const timers = useRef<number[]>([]);
  const attempts = revealed.size;
  const bestCell = useMemo(() => cells.reduce((best, cell) => cell.score > best.score ? cell : best), [cells]);
  const bestRevealed = useMemo(() => [...revealed].map((id) => cells[id]).reduce<Cell | null>((best, cell) => !best || cell.score > best.score ? cell : best, null), [revealed, cells]);
  const finalGap = bestRevealed ? Math.max(0, bestCell.score - bestRevealed.score) : 0;
  const gameScore = solved ? calculateGameScore(attempts, finalGap) : null;

  const clearTimers = () => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  };

  useEffect(() => clearTimers, []);

  const explore = (cell: Cell) => {
    if (solved || runningId !== null) return;
    if (revealed.has(cell.id)) return;
    setRunningId(cell.id);
    setRunPhase('training');
    timers.current.push(window.setTimeout(() => setRunPhase('validation'), 420));
    timers.current.push(window.setTimeout(() => {
      setRevealed((current) => new Set(current).add(cell.id));
      setRunningId(null);
    }, 760));
  };

  const finish = () => {
    if (!bestRevealed || runningId !== null) return;
    setSolved(true);
  };

  const reset = () => {
    clearTimers();
    setRevealed(new Set());
    setRunningId(null);
    setRunPhase('training');
    setSolved(false);
    setConditionalAnswerCorrect(false);
    setCells(buildLandscape());
  };

  return (
    <ContentBlock className="hp-block hp-grid-block" title="找到更好的超参数组合" subtitle="不同组合可能产生不同效果，我们需要通过实验寻找更好的方案。">
      <NoticeStrip tone="blue" className="hp-sweeper-notice" lead="网格搜索：">当候选范围有限时，可以遍历所有可能组合，并比较验证集性能。但是，随着超参数数量增加，组合数量会快速增长。</NoticeStrip>
      <section className="hp-sweeper-toolbar">
        <div><span>当前实验次数</span><strong>{attempts}</strong></div>
        <div><span>{solved ? '与最好结果的差距' : '目前最好的结果'}</span><strong>{bestRevealed ? solved ? `${finalGap.toFixed(1)}%` : `${bestRevealed.score.toFixed(1)}%` : '—'}</strong></div>
        {solved && <div className="hp-sweeper-score"><span>游戏得分</span><strong>{gameScore}<small> 分</small></strong></div>}
        {!solved && <Button variant="primary" disabled={runningId !== null || attempts === 0} onClick={finish}>结束搜索</Button>}
        {solved && <Button onClick={reset}>重新开始</Button>}
      </section>

      <section className="hp-sweeper-board-wrap" aria-label="学习率与权重衰减网格搜索棋盘">
        <div className="hp-sweeper-axis-title hp-sweeper-axis-title--y">权重衰减 wd</div>
        <div className="hp-sweeper-grid">
          {cells.map((cell) => {
            const isRevealed = revealed.has(cell.id);
            const isRunning = runningId === cell.id;
            const intensity = Math.max(0, Math.min(1, (cell.score - 76) / 19));
            const visible = isRevealed || solved;
            return <div className="hp-sweeper-grid-cell" key={cell.id}>{cell.column === 0 && <div className="hp-sweeper-tick hp-sweeper-tick--y">{weightDecays[cell.row]}</div>}<button
              className={`hp-sweeper-cell${visible ? ' is-revealed' : ''}${isRevealed ? ' is-explored' : ''}${bestRevealed?.id === cell.id ? ' is-current-best' : ''}${solved && !isRevealed ? ' is-unexplored' : ''}${isRunning ? ` is-running is-${runPhase}` : ''}${solved && cell.id === bestCell.id ? ' is-peak' : ''}`}
              style={{ '--hp-cell-light': `${94 - intensity * 22}%` } as CSSProperties}
              type="button"
              aria-label={`第 ${cell.row + 1} 行，第 ${cell.column + 1} 列${visible ? `，验证性能 ${cell.score.toFixed(1)}%${isRevealed ? '，已经实验' : '，未实验'}` : '，尚未实验'}`}
              onClick={() => explore(cell)}
            >
              {isRunning ? <><strong>{runPhase === 'training' ? '训练' : '验证'}</strong><span>···</span></> : visible ? <strong>{cell.score.toFixed(1)}</strong> : <span />}
            </button></div>;
          })}
          <div className="hp-sweeper-corner">学习率 lr →</div>
          {learningRates.map((learningRate) => <div className="hp-sweeper-tick hp-sweeper-tick--x" key={learningRate}>{learningRate}</div>)}
        </div>
      </section>

      <div className="hp-sweeper-guide">
        <span>选择一个组合</span><i>→</i><span>比较实验结果</span><i>→</i><span>决定何时停止</span>
      </div>
      {solved && <Question
        persistenceKey="grid-search-conditional-optimum-v2"
        type="choice"
        title="你在固定模型结构时，比较后找到了效果最好的 lr 与 wd 组合。之后又改了其他超参数，原来的组合该怎样处理？"
        options={[
          { key: 'A', value: 'still-optimal', label: '可以直接沿用，因为它已经在上一次比较中效果最好', wrongFeedback: '上一次的结论只适用于当时其他设置不变的情况；条件变了，效果也可能改变。' },
          { key: 'B', value: 'independent', label: '可以直接沿用，因为不同超参数彼此不会影响', wrongFeedback: '超参数会共同影响训练，例如 Batch Size 变化后，合适的学习率范围也可能变化。' },
          { key: 'C', value: 'revalidate', label: '需要在新的超参数设置下重新比较 lr 与 wd，因为超参数之间可能存在相互影响' },
          { key: 'D', value: 'changed-only', label: '只要调整刚刚改动的那个超参数，其他选择不需要再看', wrongFeedback: '一个选择变化后，原来组合的效果也可能改变，因此相关设置需要重新比较。' },
        ]}
        answer="revalidate"
        feedback={{
          correct: '正确。当前 lr 与 wd 的效果以其他设置不变为前提；Batch Size 或模型结构变化后，原来的组合也需要重新比较。',
          wrong: 'lr、wd 会和 Batch Size、模型结构等设置一起影响训练。其他设置变化后，需要重新比较原来的组合是否仍然合适。',
        }}
        onCheck={(result) => { if (result.ok) setConditionalAnswerCorrect(true); }}
      />}
      {solved && conditionalAnswerCorrect && <Question
        persistenceKey="grid-search-combinations-v1"
        type="fill"
        title="如果要比较 3 个超参数，每个都有 5 个候选值，一共需要尝试 ____ 种组合。"
        blanks={[{ label: '组合数量', placeholder: '填写次数' }]}
        answer="125"
        submitText="检查计算"
        feedback={{
          correct: '正确。5 × 5 × 5 = 125。超参数或候选值一多，需要比较的组合就会迅速增加。',
          wrong: '每一个候选值都要和另外两项的所有候选值配对：5 × 5 × 5。',
        }}
        onCheck={(result) => { if (result.ok) onComplete?.(); }}
      />}
    </ContentBlock>
  );
}
