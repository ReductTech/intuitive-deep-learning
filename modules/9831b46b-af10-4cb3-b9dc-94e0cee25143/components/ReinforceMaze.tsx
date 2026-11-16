import { moduleAssetUrl } from '@shuku/course-runtime/react/assets';
import { useEffect, useRef, useState } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
import { A, cellName, DIRECTIONS, DIR_LABEL, GOAL, START, transition, WALLS, type Direction, type Step } from '../mazeModel';
import '../reinforce.css';

export const ARROW: Record<Direction, string> = { U: '↑', D: '↓', L: '←', R: '→' };

export function MazeBoard({ steps = [], visible = steps.length, pathStart = START, compactLabels = false, position, focus = -1, large = false, wallFlash = false, exploring = false, discoveredWalls = [], showPath = false, fox = false, facing = 'U', highlightedCells = [], onSelect }: { steps?: Step[]; visible?: number; pathStart?: number; compactLabels?: boolean; position?: number; focus?: number; large?: boolean; wallFlash?: boolean; exploring?: boolean; discoveredWalls?: number[]; showPath?: boolean; fox?: boolean; facing?: Direction; onSelect?: (cell: number) => void; highlightedCells?: number[] }) {
  const location = position ?? (visible ? steps[Math.min(visible, steps.length) - 1]?.next : START);
  const visited = new Set([pathStart, ...steps.slice(0, visible).map(step => step.next)]);
  const path = [pathStart, ...steps.slice(0, visible).filter(step => !step.wall).map(step => step.next)];
  const pathPoints = path.map(cell => `${12.5 + (cell % 4) * 25},${12.5 + Math.floor(cell / 4) * 25}`).join(' ');
  return <div shuku-edit-id="e-89e89b61-9cb6-46da-8701-2b0cf6ae3121" className={`pg-world ${large ? 'is-large' : ''} ${wallFlash ? 'is-bumping' : ''} ${exploring ? 'is-exploring' : ''}`} role={onSelect ? 'group' : 'img'} aria-label={`4 乘 4 迷宫，角色位于 ${cellName(location)}${exploring ? '；未探索的格子可能有障碍' : ''}`}>
    <div shuku-edit-id="e-24cc3145-c474-4eff-965a-8d831b71f737" className="pg-world-grid">{Array.from({ length: 16 }, (_, cell) => {
      const wall = WALLS.includes(cell), goal = cell === GOAL, here = cell === location;
      const shownWall = wall && (!exploring || discoveredWalls.includes(cell));
      const unknown = exploring && !visited.has(cell) && !goal && !shownWall;
      return <div shuku-edit-id="e-58f264d0-39e4-4bda-b4cb-b630437514d6" key={cell} role={onSelect && !wall ? 'button' : undefined} tabIndex={onSelect && !wall ? 0 : undefined} aria-label={onSelect && !wall ? `选择位置 ${cellName(cell)}` : undefined} onClick={() => !wall && onSelect?.(cell)} onKeyDown={event => { if (onSelect && !wall && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onSelect(cell); } }} className={`pg-tile ${highlightedCells.includes(cell) ? 'is-candidate' : ''} ${shownWall ? 'is-wall' : ''} ${unknown ? 'is-unknown' : ''} ${goal ? 'is-goal' : ''} ${cell === START ? 'is-start' : ''} ${cell === A && !exploring ? 'is-a' : ''} ${visited.has(cell) ? 'is-visited' : ''} ${steps[focus]?.state === cell ? 'is-focus' : ''}`}>
        {shownWall ? <><svg shuku-edit-id="e-95b372c6-e34e-4c26-b2c5-c813109f5927" className="pg-wall-bricks" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">{Array.from({length: 7}, (_, row) => Array.from({length: 4}, (_, column) => <rect shuku-edit-id="e-18b0e541-c1c8-46a7-8d1a-0778c4265364" key={`${row}-${column}`} x={column * 34 - (row % 2 ? 17 : 0)} y={row * 17} width="32" height="15" rx="2" fill={(row + column) % 3 === 0 ? '#666765' : '#5c5e5c'} stroke="#737572" strokeWidth=".5" />))}</svg><svg shuku-edit-id="e-03e343b2-42ed-44d6-90df-b059963d0f24" className="pg-wall-letter" viewBox="0 0 100 100" role="img" aria-label="墙"><foreignObject shuku-edit-id="e-543443ee-cf26-4879-8990-932f3964d1fe" x="0" y="0" width="100" height="100"><div shuku-edit-id="e-aa9d4b93-2108-45f4-8424-bb0e145f8263" className="pg-wall-letter-center"><Typography shuku-edit-id="e-6b02e311-9f40-428b-bd26-70a45ec3c23c" as="span" variant="h2" tone="light" className="pg-wall-label">墙</Typography></div></foreignObject></svg></> : <>
          {(cell === START || goal) && <svg shuku-edit-id="e-d940b998-3809-4181-bad4-a771d75782d3" className={`pg-tile-name${compactLabels ? ' is-compact' : ''}`} viewBox={compactLabels ? '0 0 40 40' : '0 0 120 40'} aria-hidden="true"><foreignObject shuku-edit-id="e-c9bdf86a-d6e0-4a52-90dd-e5740194373f" width={compactLabels ? 40 : 120} height="40"><div shuku-edit-id="e-547fced1-90fd-4c06-b4cd-d1e9dcaa1565" className="pg-tile-name-inner"><Typography shuku-edit-id="e-18865732-eda9-4914-8da3-b52b26a9e775" as="span" variant="bodySmall" tone="accent">{compactLabels ? (cell === START ? 'S' : 'G') : (cell === START ? '起点 S' : '终点 G')}</Typography></div></foreignObject></svg>}
          {goal && (fox ? <svg shuku-edit-id="e-e8871d37-c28b-42b9-b954-0b0ca9b952f9" className="pg-treasure-icon" viewBox="0 0 90 80" aria-hidden="true"><ellipse shuku-edit-id="e-e5629c5c-caa8-41a0-9b4f-dd387f3f7808" cx="45" cy="66" rx="32" ry="7" fill="#826335" opacity=".18"/><path shuku-edit-id="e-c36dcd3e-258c-4afa-99d6-8f0c56e41e57" d="M16 33Q16 12 45 12T74 33V60Q45 72 16 60Z" fill="#b87637" stroke="#855629" strokeWidth="2"/><path shuku-edit-id="e-0ab5bdf6-3b5e-4f50-91c3-e28efec9f711" d="M16 33Q16 12 45 12T74 33Z" fill="#e4b364"/><path shuku-edit-id="e-b1d13e10-4cd8-4ee9-945b-9949f3bdcd2c" d="M16 33H74V43H16Z" fill="#f2cf70"/><path shuku-edit-id="e-1092aae4-786e-46e4-a6c0-b0c38433ba58" d="M28 16V62M62 16V62" stroke="#eac05d" strokeWidth="7"/><rect shuku-edit-id="e-b218eaa2-90d8-4c2f-a2e3-35fc6b968add" x="38" y="34" width="14" height="19" rx="3" fill="#ffe397" stroke="#a9782e" strokeWidth="2"/><circle shuku-edit-id="e-686dfc50-a425-4b0e-8e4f-48467877380b" cx="45" cy="41" r="2.7" fill="#92612e"/><path shuku-edit-id="e-cb78485f-f1fd-4ac8-8092-12cbf1d04e18" d="M45 41V46" stroke="#92612e" strokeWidth="2"/><path shuku-edit-id="e-ac7e0a89-d4c2-465b-ba9b-2e596d9a14fb" d="M76 9V21M70 15H82M12 16V24M8 20H16" stroke="#e4ae41" strokeWidth="2.5" strokeLinecap="round"/></svg> : <span shuku-edit-id="e-093100b0-3c3d-4f96-9278-f95624ae526a" className="pg-goal-icon" aria-hidden="true">◆</span>)}
          {unknown ? <svg shuku-edit-id="e-a7da74b9-ade3-4fcb-83e4-42cc8c61810a" className="pg-unknown-mark" viewBox="0 0 100 100" aria-hidden="true"><foreignObject shuku-edit-id="e-e5b8e0a2-e54d-4bc7-aafa-53da44f4048c" width="100" height="100"><div shuku-edit-id="e-538e9b0f-117b-4d03-b083-b18e3d125c7c" className="pg-tile-name-inner"><Typography shuku-edit-id="e-611af12c-d5e0-4d43-b2fc-ec61bd609c51" as="span" variant="h2" tone="inherit">?</Typography></div></foreignObject></svg> : !showPath && steps.slice(0, visible).filter(step => step.state === cell && !step.wall).length > 0 && !here && !goal && <span shuku-edit-id="e-d2bbf74d-7ea0-47ac-80a6-0e349a44b055" className="pg-footprint" aria-hidden="true">· ·</span>}
        </>}
      </div>;
    })}{showPath && path.length > 1 && <svg shuku-edit-id="e-edbcc75f-21bf-4aec-885b-00a2dd8057f3" className="pg-route-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline shuku-edit-id="e-0ff303ab-60ce-43d5-9078-e43914ccaa7e" className="pg-route-glow" points={pathPoints} /><polyline shuku-edit-id="e-d82c70e2-0073-4938-a42b-f731fbcea3e3" className="pg-route-line" points={pathPoints} /></svg>}<span shuku-edit-id="e-aa4e5fc0-30a9-415a-a975-d1c0bda376d7" className={`pg-hero-marker ${fox ? 'is-fox' : ''}`} style={{ left: (12.5 + (location % 4) * 25) + '%', top: (12.5 + Math.floor(location / 4) * 25) + '%' }} aria-hidden="true">{fox ? <img shuku-edit-id="e-dc3bcdfa-50ef-4422-8c2b-f5d6e3ecb1a4" className="pg-fox-avatar" src={moduleAssetUrl('fox-explorer.png')} alt="" style={{ transform: `rotate(${({ U: 0, R: 90, D: 180, L: -90 } as Record<Direction, number>)[facing]}deg)` }} /> : <span shuku-edit-id="e-8fc297e4-2711-438d-ad04-fcc46b44b05f" className="pg-hero"><span shuku-edit-id="e-3104af18-3790-48fd-8df8-8a373c4cd3f5" className="pg-hero-eye" /></span>}</span></div>
  </div>;
}

export function DirectionPad({ onMove, disabled = false }: { onMove: (direction: Direction) => void; disabled?: boolean }) {
  return <div shuku-edit-id="e-928d6d82-634f-4b0c-9be8-87b925130d69" className="pg-direction-pad" role="group" aria-label="移动方向">
    {DIRECTIONS.map(direction => <Button key={direction} onClick={() => onMove(direction)} disabled={disabled} aria-label={`向${DIR_LABEL[direction]}移动`}><Typography shuku-edit-id="e-a69efc55-25a2-4fd8-a91a-41bb4415f243" as="span" variant="h2" tone="inherit" className="pg-pad-arrow">{ARROW[direction]}</Typography></Button>)}
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
  return <div shuku-edit-id="e-d245cd9b-c00a-4cb3-84cf-911169cdb9af" ref={gameRef} tabIndex={0} onKeyDown={onKeyDown} className="pg-re-explore pg-maze-adventure" aria-label="迷宫探索游戏">
    <div shuku-edit-id="e-67e21c48-5cdf-4c24-ab52-35446a43b2c1" className="pg-adventure-board pg-adventure-maze-panel">
      <div shuku-edit-id="e-ffb42f13-2e10-4b91-a266-f55e64226fac" className="pg-adventure-rules"><Typography shuku-edit-id="e-7d166128-deeb-46aa-8858-8887e50c1b65" as="h2" variant="h3" tone="accent">规则</Typography><Typography shuku-edit-id="e-1f0d8898-1dfd-4e3c-9838-832174be32ef" variant="bodySmall" tone="accent">起点 S → 宝藏 G · 每步 <strong shuku-edit-id="e-20a8707b-b70c-466c-96b8-2db9bf879021">−1</strong> · 终点 <strong shuku-edit-id="e-5945b31f-90ad-41c9-9e27-2690bcb90679">+10</strong></Typography><Typography shuku-edit-id="e-d1304e67-65ad-4269-a5cb-f6342808c783" variant="bodySmall" tone="muted">障碍隐藏，撞墙扣 1 分；每局最多 30 步。</Typography></div>
      <MazeBoard steps={steps} position={current} wallFlash={flash} exploring={!revealMap} discoveredWalls={discoveredWalls} showPath fox facing={facing} />
    </div>
    <div shuku-edit-id="e-175686a4-8f32-444c-82df-50f8acb91fcd" className="pg-adventure-controls">
      <div shuku-edit-id="e-dd83b5e3-a980-4e97-a712-1eb9983b65f5" className="pg-adventure-scoreboard" aria-label="探索得分与步数">
        <div shuku-edit-id="e-e90a0b01-fc73-44da-a292-b8b189174178" className="pg-adventure-stat"><Typography shuku-edit-id="e-2a1e016a-5146-44e3-a3de-5c9254f16376" variant="bodySmall" tone="muted">本局得分</Typography><Typography shuku-edit-id="e-8852baa8-c754-499b-8583-1fa25bc24c39" variant="h2" tone="accent">{total >= 0 ? '+' : ''}{total}</Typography><Typography shuku-edit-id="e-e0f9ac52-0682-4916-824b-206855a33dba" variant="bodySmall" tone="muted">最好成绩 {best ? `${best.score >= 0 ? '+' : ''}${best.score}` : '—'}</Typography></div>
        <div shuku-edit-id="e-89847082-5900-4f29-83bd-eee79de249b0" className="pg-adventure-stat"><Typography shuku-edit-id="e-f0dbc212-55c6-4ef8-a496-0800bae81853" variant="bodySmall" tone="muted">已走步数</Typography><Typography shuku-edit-id="e-02743119-a63e-4be1-b82c-c3148abcf0a6" variant="h2" tone="accent">{steps.length} 步</Typography><Typography shuku-edit-id="e-75dd38a7-6985-47d5-afe3-c047460b9e2d" variant="body" tone="accent">第 {attempt} 局</Typography></div>
      </div>
      <div shuku-edit-id="e-d7f356b7-dc62-4607-a9dc-64f088e059b2" className={`pg-adventure-feedback ${done ? 'is-success' : ''}`} aria-live="polite"><Typography as={done ? 'h2' : 'p'} variant={done ? 'h1' : 'body'} tone={done ? 'success' : 'accent'}>{done ? total === 5 ? '找到最高分路线！' : '找到宝藏了！' : steps.length >= 30 ? '这次绕远了，重新挑战吧' : steps.length ? message.replace('：位置不变，奖励 −1', '，留在原地 −1').replace('：奖励 −1', '，−1') : '用方向按钮，迈出第一步'}</Typography>{done && <Typography shuku-edit-id="e-60e16b40-4f2a-4e9c-a335-098279472373" variant="bodySmall" tone="muted">{total === 5 ? '每一步都用在了前进上。' : '再试一次，能少走几步吗？'}</Typography>}</div>
      <div shuku-edit-id="e-95abb6b2-ba80-4bee-aa0d-ba8f4891c04e" className="pg-adventure-control-bottom"><div shuku-edit-id="e-b7d42434-420a-4f10-a1d3-b653556487e7" className="pg-adventure-pad"><DirectionPad onMove={move} disabled={done || steps.length >= 30} /><span shuku-edit-id="e-9834b65c-a793-4f0f-878c-9b9ca7e890d0" className="pg-pad-center" aria-hidden="true"><svg shuku-edit-id="e-4b08a8db-fb79-4615-be29-ffc5b260275c" viewBox="0 0 48 48"><path shuku-edit-id="e-3a1b74ea-742e-4d00-a879-7f8209f5e26b" d="M24 5 30 18 43 24 30 30 24 43 18 30 5 24 18 18Z" fill="currentColor"/><circle shuku-edit-id="e-7812ec36-6f7a-424b-9c7b-39e1e54c4df2" cx="24" cy="24" r="5" fill="#f9f1df"/></svg></span></div>
      <div shuku-edit-id="e-03fa9307-4d60-464e-bc39-e220a744c762" className="pg-game-actions"><Button variant={done ? 'primary' : 'default'} onClick={reset}>{done ? '再走一次 →' : '↻ 重新出发'}</Button>{done && <Button onClick={() => setRevealMap(!revealMap)}>{revealMap ? '收起地图' : '查看完整地图'}</Button>}</div></div>
    </div>
    <div shuku-edit-id="e-fce4e0fc-7ca3-473a-9111-e17b4745867f" className="pg-adventure-footer"><Typography shuku-edit-id="e-9c2be7ea-8eae-4e11-9465-7b3a6c4518b2" variant="body" tone="accent">操作记录</Typography><div shuku-edit-id="e-6f94da20-edce-491e-87f6-a6e1a5d75229" className={`pg-adventure-trail ${steps.length ? '' : 'is-empty'}`} aria-label="本局全部操作步骤">{steps.length ? steps.map((step, index) => <Typography shuku-edit-id="e-7e1068ef-4baa-41de-9c2a-41c88414698b" as="span" variant="bodySmall" tone="inherit" key={index} className={step.wall ? 'is-wall' : step.terminal ? 'is-goal' : ''} title={`第 ${index + 1} 步：向${DIR_LABEL[step.action]}，${step.wall ? '撞墙，原地不动' : step.terminal ? '到达终点' : `到达 ${cellName(step.next)}`}，得分 ${step.reward}`} aria-label={`第 ${index + 1} 步，向${DIR_LABEL[step.action]}${step.wall ? '，撞墙' : step.terminal ? '，到达终点' : ''}`}>{index + 1} {ARROW[step.action]}{step.wall ? '×' : step.terminal ? '✓' : ''}</Typography>) : <Typography shuku-edit-id="e-585b95a7-99bb-44bf-bdf9-b9f3e61240c7" variant="bodySmall" tone="muted">每走一步，就在这里记下一步；撞墙标记 ×，到达终点标记 ✓。</Typography>}</div></div>
  </div>;
}
