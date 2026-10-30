import { moduleIdentity } from '../outlines.json';
import { useEffect, useRef, useState } from 'react';
import { Button, Typography, moduleAssetUrl } from '../../shared/react';
import { A, cellName, DIRECTIONS, DIR_LABEL, GOAL, START, transition, WALLS, type Direction, type Step } from '../mazeModel';
import '../reinforce.css';

export const ARROW: Record<Direction, string> = { U: '↑', D: '↓', L: '←', R: '→' };

export function MazeBoard({ steps = [], visible = steps.length, pathStart = START, compactLabels = false, position, focus = -1, large = false, wallFlash = false, exploring = false, discoveredWalls = [], showPath = false, fox = false, facing = 'U', highlightedCells = [], onSelect }: { steps?: Step[]; visible?: number; pathStart?: number; compactLabels?: boolean; position?: number; focus?: number; large?: boolean; wallFlash?: boolean; exploring?: boolean; discoveredWalls?: number[]; showPath?: boolean; fox?: boolean; facing?: Direction; onSelect?: (cell: number) => void; highlightedCells?: number[] }) {
  const location = position ?? (visible ? steps[Math.min(visible, steps.length) - 1]?.next : START);
  const visited = new Set([pathStart, ...steps.slice(0, visible).map(step => step.next)]);
  const path = [pathStart, ...steps.slice(0, visible).filter(step => !step.wall).map(step => step.next)];
  const pathPoints = path.map(cell => `${12.5 + (cell % 4) * 25},${12.5 + Math.floor(cell / 4) * 25}`).join(' ');
  return <div className={`pg-world pg-readable-maze ${large ? 'is-large' : ''} ${wallFlash ? 'is-bumping' : ''} ${exploring ? 'is-exploring' : ''}`} role={onSelect ? 'group' : 'img'} aria-label={`4 乘 4 迷宫，角色位于 ${cellName(location)}${exploring ? '；未探索的格子可能有障碍' : ''}`}>
    <div className="pg-world-grid">{Array.from({ length: 16 }, (_, cell) => {
      const wall = WALLS.includes(cell), goal = cell === GOAL, here = cell === location;
      const shownWall = wall && (!exploring || discoveredWalls.includes(cell));
      const unknown = exploring && !visited.has(cell) && !goal && !shownWall;
      return <div key={cell} role={onSelect && !wall ? 'button' : undefined} tabIndex={onSelect && !wall ? 0 : undefined} aria-label={onSelect && !wall ? `选择位置 ${cellName(cell)}` : undefined} onClick={() => !wall && onSelect?.(cell)} onKeyDown={event => { if (onSelect && !wall && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onSelect(cell); } }} className={`pg-tile ${highlightedCells.includes(cell) ? 'is-candidate' : ''} ${shownWall ? 'is-wall' : ''} ${unknown ? 'is-unknown' : ''} ${goal ? 'is-goal' : ''} ${cell === START ? 'is-start' : ''} ${cell === A && !exploring ? 'is-a' : ''} ${visited.has(cell) ? 'is-visited' : ''} ${steps[focus]?.state === cell ? 'is-focus' : ''}`}>
        {shownWall ? <><svg className="pg-wall-bricks" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{Array.from({length: 7}, (_, row) => Array.from({length: 4}, (_, column) => <rect key={`${row}-${column}`} x={column * 34 - (row % 2 ? 17 : 0)} y={row * 17} width="32" height="15" rx="2" fill={(row + column) % 3 === 0 ? '#666765' : '#5c5e5c'} stroke="#737572" strokeWidth=".5" />))}</svg><svg className="pg-wall-letter" viewBox="0 0 100 100" role="img" aria-label="墙"><foreignObject x="0" y="0" width="100" height="100"><div className="pg-wall-letter-center"><Typography as="span" variant="h2" tone="light" className="pg-wall-label">墙</Typography></div></foreignObject></svg></> : <>
          {(cell === START || goal) && <svg className={`pg-tile-name${compactLabels ? ' is-compact' : ''}`} viewBox={compactLabels ? '0 0 40 40' : '0 0 120 40'} aria-hidden="true"><foreignObject width={compactLabels ? 40 : 120} height="40"><div className="pg-tile-name-inner"><Typography as="span" variant="bodySmall" tone="accent">{compactLabels ? (cell === START ? 'S' : 'G') : (cell === START ? '起点 S' : '终点 G')}</Typography></div></foreignObject></svg>}
          {goal && (fox ? <svg className="pg-treasure-icon" viewBox="0 0 90 80" aria-hidden="true"><ellipse cx="45" cy="66" rx="32" ry="7" fill="#826335" opacity=".18"/><path d="M16 33Q16 12 45 12T74 33V60Q45 72 16 60Z" fill="#b87637" stroke="#855629" strokeWidth="2"/><path d="M16 33Q16 12 45 12T74 33Z" fill="#e4b364"/><path d="M16 33H74V43H16Z" fill="#f2cf70"/><path d="M28 16V62M62 16V62" stroke="#eac05d" strokeWidth="7"/><rect x="38" y="34" width="14" height="19" rx="3" fill="#ffe397" stroke="#a9782e" strokeWidth="2"/><circle cx="45" cy="41" r="2.7" fill="#92612e"/><path d="M45 41V46" stroke="#92612e" strokeWidth="2"/><path d="M76 9V21M70 15H82M12 16V24M8 20H16" stroke="#e4ae41" strokeWidth="2.5" strokeLinecap="round"/></svg> : <span className="pg-goal-icon" aria-hidden="true">◆</span>)}
          {unknown ? <svg className="pg-unknown-mark" viewBox="0 0 100 100" aria-hidden="true"><foreignObject width="100" height="100"><div className="pg-tile-name-inner"><Typography as="span" variant="h2" tone="inherit">?</Typography></div></foreignObject></svg> : !showPath && steps.slice(0, visible).filter(step => step.state === cell && !step.wall).length > 0 && !here && !goal && <span className="pg-footprint" aria-hidden="true">· ·</span>}
        </>}
      </div>;
    })}{showPath && path.length > 1 && <svg className="pg-route-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline className="pg-route-glow" points={pathPoints} /><polyline className="pg-route-line" points={pathPoints} /></svg>}<span className={`pg-hero-marker ${fox ? 'is-fox' : ''}`} style={{ left: (12.5 + (location % 4) * 25) + '%', top: (12.5 + Math.floor(location / 4) * 25) + '%' }} aria-hidden="true">{fox ? <img className="pg-fox-avatar" src={moduleAssetUrl(moduleIdentity.id, 'fox-explorer.png')} alt="" style={{ transform: `rotate(${({ U: 0, R: 90, D: 180, L: -90 } as Record<Direction, number>)[facing]}deg)` }} /> : <span className="pg-hero"><span className="pg-hero-eye" /></span>}</span></div>
  </div>;
}

export function DirectionPad({ onMove, disabled = false }: { onMove: (direction: Direction) => void; disabled?: boolean }) {
  return <div className="pg-direction-pad" role="group" aria-label="移动方向">
    {DIRECTIONS.map(direction => <Button key={direction} onClick={() => onMove(direction)} disabled={disabled} aria-label={`向${DIR_LABEL[direction]}移动`}><Typography as="span" variant="h2" tone="inherit" className="pg-pad-arrow">{ARROW[direction]}</Typography></Button>)}
  </div>;
}

export function MazeGame() {
  const gameRef = useRef<HTMLDivElement>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [facing, setFacing] = useState<Direction>('U');
  const [attempt, setAttempt] = useState(1);
  const [best, setBest] = useState<{ score: number; steps: number } | null>(null);
  const [discoveredWalls, setDiscoveredWalls] = useState<number[]>([]);
  const [revealMap, setRevealMap] = useState(false);
  const [flash, setFlash] = useState(false);
  const [message, setMessage] = useState('用方向键或下方按钮，从 S 走到 G');
  const current = steps.at(-1)?.next ?? START;
  const done = current === GOAL;
  const total = steps.reduce((sum, step) => sum + step.reward, 0);
  const move = (direction: Direction) => {
    if (done || steps.length >= 30) return;
    setFacing(direction);
    const result = transition(current, direction);
    const next: Step = { state: current, action: direction, ...result, probability: .25 };
    setSteps(previous => [...previous, next]);
    const row = Math.floor(current / 4), column = current % 4;
    const targetRow = row + (direction === 'U' ? -1 : direction === 'D' ? 1 : 0);
    const targetColumn = column + (direction === 'L' ? -1 : direction === 'R' ? 1 : 0);
    const boundary = targetRow < 0 || targetRow > 3 || targetColumn < 0 || targetColumn > 3;
    if (result.wall && !boundary) setDiscoveredWalls(previous => [...new Set([...previous, targetRow * 4 + targetColumn])]);
    setMessage(result.wall ? boundary ? '碰到迷宫边界：位置不变，奖励 −1' : '发现一堵墙：位置不变，奖励 −1' : result.terminal ? '到达终点：奖励 +10' : `到达 ${cellName(result.next)}：奖励 −1`);
    setFlash(result.wall);
  };
  useEffect(() => {
    if (!flash) return;
    const timer = window.setTimeout(() => setFlash(false), 360);
    return () => window.clearTimeout(timer);
  }, [flash]);
  useEffect(() => {
    if (done) setBest(previous => previous && previous.score >= total ? previous : { score: total, steps: steps.length });
  }, [done, total, steps.length]);
  useEffect(() => { gameRef.current?.focus(); }, []);
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const direction = ({ ArrowUp: 'U', ArrowDown: 'D', ArrowLeft: 'L', ArrowRight: 'R', w: 'U', s: 'D', a: 'L', d: 'R' } as Record<string, Direction>)[event.key];
    if (direction) { event.preventDefault(); event.stopPropagation(); move(direction); }
  };
  const reset = () => { setSteps([]); setAttempt(value => value + 1); setFacing('U'); setRevealMap(false); setDiscoveredWalls([]); setMessage('重新从起点 S 出发'); gameRef.current?.focus(); };
  return <div ref={gameRef} tabIndex={0} onKeyDown={onKeyDown} className="pg-re-explore pg-maze-adventure" aria-label="迷宫探索游戏">
    <div className="pg-adventure-board pg-adventure-maze-panel">
      <div className="pg-adventure-rules"><Typography as="h2" variant="h3" tone="accent">规则</Typography><Typography variant="body" tone="accent">起点 S → 宝藏 G · 每步 <strong>−1</strong> · 终点 <strong>+10</strong></Typography><Typography variant="bodySmall" tone="muted">障碍隐藏，撞墙扣 1 分；每局最多 30 步。</Typography></div>
      <MazeBoard steps={steps} position={current} wallFlash={flash} exploring={!revealMap} discoveredWalls={discoveredWalls} showPath fox facing={facing} />
    </div>
    <div className="pg-adventure-controls">
      <div className="pg-adventure-scoreboard" aria-label="探索得分与步数">
        <div className="pg-adventure-stat"><Typography variant="body" tone="muted">本局得分</Typography><Typography variant="h2" tone="accent">{total >= 0 ? '+' : ''}{total}</Typography><Typography variant="bodySmall" tone="muted">最好成绩 {best ? `${best.score >= 0 ? '+' : ''}${best.score}` : '—'}</Typography></div>
        <div className="pg-adventure-stat"><Typography variant="body" tone="muted">已走步数</Typography><Typography variant="h2" tone="accent">{steps.length} 步</Typography><Typography variant="body" tone="accent">第 {attempt} 局</Typography></div>
      </div>
      <div className={`pg-adventure-feedback ${done ? 'is-success' : ''}`} aria-live="polite"><Typography as={done ? 'h2' : 'p'} variant={done ? 'h1' : 'body'} tone={done ? 'success' : 'accent'}>{done ? total === 5 ? '找到最高分路线！' : '找到宝藏了！' : steps.length >= 30 ? '这次绕远了，重新挑战吧' : steps.length ? message.replace('：位置不变，奖励 −1', '，留在原地 −1').replace('：奖励 −1', '，−1') : '用方向按钮，迈出第一步'}</Typography>{done && <Typography variant="bodySmall" tone="muted">{total === 5 ? '每一步都用在了前进上。' : '再试一次，能少走几步吗？'}</Typography>}</div>
      <div className="pg-adventure-control-bottom"><div className="pg-adventure-pad"><DirectionPad onMove={move} disabled={done || steps.length >= 30} /><span className="pg-pad-center" aria-hidden="true"><svg viewBox="0 0 48 48"><path d="M24 5 30 18 43 24 30 30 24 43 18 30 5 24 18 18Z" fill="currentColor"/><circle cx="24" cy="24" r="5" fill="#f9f1df"/></svg></span></div>
      <div className="pg-game-actions"><Button variant={done ? 'primary' : 'default'} onClick={reset}>{done ? '再走一次 →' : '↻ 重新出发'}</Button>{done && <Button onClick={() => setRevealMap(!revealMap)}>{revealMap ? '收起地图' : '查看完整地图'}</Button>}</div></div>
    </div>
    <div className="pg-adventure-footer"><Typography variant="body" tone="accent">操作记录</Typography><div className={`pg-adventure-trail ${steps.length ? '' : 'is-empty'}`} aria-label="本局全部操作步骤">{steps.length ? steps.map((step, index) => <Typography as="span" variant="bodySmall" tone="inherit" key={index} className={step.wall ? 'is-wall' : step.terminal ? 'is-goal' : ''} title={`第 ${index + 1} 步：向${DIR_LABEL[step.action]}，${step.wall ? '撞墙，原地不动' : step.terminal ? '到达终点' : `到达 ${cellName(step.next)}`}，得分 ${step.reward}`} aria-label={`第 ${index + 1} 步，向${DIR_LABEL[step.action]}${step.wall ? '，撞墙' : step.terminal ? '，到达终点' : ''}`}>{index + 1} {ARROW[step.action]}{step.wall ? '×' : step.terminal ? '✓' : ''}</Typography>) : <Typography variant="bodySmall" tone="muted">每走一步，就在这里记下一步；撞墙标记 ×，到达终点标记 ✓。</Typography>}</div></div>
  </div>;
}
