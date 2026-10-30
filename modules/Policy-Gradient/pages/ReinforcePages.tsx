import { useState } from 'react';
import { Button } from '../../shared/react';
import { Controls, H, Page, T } from '../components/LessonVisuals';
import { ARROW, MazeBoard, MazeGame } from '../components/ReinforceMaze';
import { DIRECTIONS, DIR_LABEL, GOAL, START, WALLS, probabilities, transition, type Direction } from '../mazeModel';

const mazeDistances = (() => {
  const distances: Record<number, number> = { [GOAL]: 0 };
  const queue = [GOAL];
  while (queue.length) { const cell = queue.shift()!; for (const d of DIRECTIONS) { const r=Math.floor(cell/4)+(d==='U'?-1:d==='D'?1:0), c=cell%4+(d==='L'?-1:d==='R'?1:0), next=r*4+c; if(r>=0&&r<4&&c>=0&&c<4&&!WALLS.includes(next)&&distances[next]===undefined) { distances[next]=distances[cell]+1;queue.push(next); } } }
  return distances;
})();

export function ValuePolicyPage() {
  const [mode, setMode] = useState<'value'|'policy'>('value');
  const [hovered, setHovered] = useState<Direction|null>(null);
  const [cell, setCell] = useState(START);
  const [feedback, setFeedback] = useState('点击迷宫中的格子，换个位置试试');
  const [picked, setPicked] = useState<Direction | null>(null);
  const values = DIRECTIONS.map(d => { if(cell===GOAL) return 0; const next=transition(cell,d); return next.terminal ? 10 : 10-mazeDistances[next.next]; });
  const probs = probabilities(values.map(v=>v/2));
  const act = (kind:'value'|'policy', chosen?: Direction) => {
    const outputs=kind==='value'?values:probs;
    const index=chosen ? DIRECTIONS.indexOf(chosen) : outputs.indexOf(Math.max(...outputs));
    const direction=DIRECTIONS[Math.max(0,index)], result=transition(cell,direction);
    setPicked(direction);setCell(result.next);
    setFeedback(`${kind==='value'?'价值方法':'策略方法'}选了 ${ARROW[direction]} ${result.wall?'撞墙，位置不变':result.terminal?'到达宝藏！':'前进一步'}`);
  };
  const candidates = cell===GOAL ? [] : DIRECTIONS.filter((d,i)=>hovered ? d===hovered : values[i]===Math.max(...values)).map(d=>{const r=Math.floor(cell/4)+(d==='U'?-1:d==='D'?1:0),c=cell%4+(d==='L'?-1:d==='R'?1:0);return r>=0&&r<4&&c>=0&&c<4?r*4+c:-1;});
  return <Page scene title="刚才你选方向，现在让模型来选" subtitle="还是这座迷宫。点击位置，切换方法；指向一个方向，看看它对应迷宫中的哪里。" takeaway={mode==='value'?'教学输出示例：价值方法学回报估计，策略方法直接学动作概率。':'策略方法直接输出动作概率。本页选最大概率；训练时再按概率采样。'}>
    <div className="pg-vp-together">
      <div className="pg-vp-map pg-maze-adventure"><MazeBoard position={cell} highlightedCells={candidates} fox facing={picked??'U'} onSelect={next=>{setCell(next);setPicked(null);setFeedback(next===GOAL?'已在终点，选其他位置继续试试':'位置已切换，让模型选下一步');}}/><T tone="accent">{feedback}</T><Button onClick={()=>{setCell(START);setPicked(null);setFeedback('回到起点 S');}}>回到起点 S</Button></div>
      <div className="pg-vp-switch">
        <section className={`pg-vp-dual-lane ${mode==='policy'?'is-policy':''}`}><H>{mode==='value'?'先估计价值，再决定怎么选':'直接输出概率，这就是策略'}</H><div className="pg-vp-dual-numbers">{DIRECTIONS.map((d,i)=><div key={d} role="button" tabIndex={0} aria-label={`查看向${DIR_LABEL[d]}候选动作`} onMouseEnter={()=>setHovered(d)} onMouseLeave={()=>setHovered(null)} onFocus={()=>setHovered(d)} onBlur={()=>setHovered(null)} aria-disabled={cell===GOAL||values[i]!==Math.max(...values)} onKeyDown={event=>{if((event.key==='Enter'||event.key===' ')&&cell!==GOAL&&values[i]===Math.max(...values)){event.preventDefault();act(mode,d);}}} onClick={()=>{setHovered(d);if(cell!==GOAL&&values[i]===Math.max(...values))act(mode,d);}} data-direction={d} className={(hovered===d||(!hovered&&values[i]===Math.max(...values)))?'is-highlighted':''}><T>{ARROW[d]} {DIR_LABEL[d]}</T><H>{cell===GOAL?'—':mode==='value'?values[i]:`${Math.round(probs[i]*100)}%`}</H></div>)}</div><T small>{mode==='value'?'点击高亮的最大值执行动作；多个方向并列最大时，任选一个。':'本页选择概率最大的方向；并列最大时任选一个。'}</T><Button variant="primary" disabled={cell===GOAL} onClick={()=>act(mode)}>{mode==='value'?'自动选一个最大值':'按最大概率走一步'}</Button></section>
        <div className="pg-vp-transition"><T small tone="accent">{mode==='value'?'能不能直接学习“怎么选”，把动作概率作为模型输出？':'可以：直接学习动作概率，用回报来调整这些概率。'}</T><Controls><Button active={mode==='value'} onClick={()=>{setMode('value');setHovered(null);setCell(START);setPicked(null);setFeedback('回到起点 S，用价值方法试试');}}>价值方法</Button><Button active={mode==='policy'} onClick={()=>{setMode('policy');setHovered(null);setCell(START);setPicked(null);setFeedback('回到起点 S，用策略方法试试');}}>策略方法</Button></Controls></div>
      </div>
    </div>
  </Page>;
}

export function PlayMazePage() { return <Page scene title="小狐狸怎样走，才能拿到最高分？" subtitle="先亲手探索这座迷宫，再试着找到一条得分更高的路线。"><MazeGame /></Page>; }
