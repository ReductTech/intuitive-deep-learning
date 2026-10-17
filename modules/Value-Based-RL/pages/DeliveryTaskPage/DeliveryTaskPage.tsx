import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Refresh } from '@icon-park/react';
import { Button, ContentBlock, Typography } from '../../../shared/react';
import { WarehouseMap } from '../../components/WarehouseMap';
import { GOAL, START, keyOf, type Position } from '../../model';
import { TRAP, warehouseStep } from '../QLearningLoopPage/qLearningSimulation';
import robotIcon from '../../assets/cover-v2/robot.png';
import warehouseScene from '../../assets/cover-v2/warehouse.png';
import heroRobot from '../../assets/cover-v2/robot.png';
import directionKeycap from '../../assets/cover-v2/direction-keycap.png';
import receivingStationEmpty from '../../assets/cover-v2/receiving-station-empty.png';
import receivingStationLoaded from '../../assets/cover-v2/receiving-station-loaded.png';
import maintenancePit from '../../assets/cover-v2/maintenance-pit.png';
import './DeliveryTaskPage.css';

const COLLISION_PENALTY = 10;
type Direction = 'up' | 'down' | 'left' | 'right';
const ACTION_INDEX: Record<Direction, number> = { up: 0, right: 1, down: 2, left: 3 };
const actions: { direction: Direction; name: string }[] = [
  { direction: 'up', name: '向上移动' }, { direction: 'left', name: '向左移动' },
  { direction: 'down', name: '向下移动' }, { direction: 'right', name: '向右移动' },
];
export interface DeliveryTaskPageProps { onComplete?: () => void; }

export function DeliveryTaskPage({ onComplete }: DeliveryTaskPageProps) {
  const [robot, setRobot] = useState<Position>(START), [moves, setMoves] = useState(0), [collisions, setCollisions] = useState(0);
  const [score, setScore] = useState<number | null>(null), [bestScore, setBestScore] = useState<number | null>(null), [collision, setCollision] = useState(false);
  const [trapped, setTrapped] = useState(false), [visible, setVisible] = useState(true), [reducedMotion, setReducedMotion] = useState(false);
  const [pressedDirection, setPressedDirection] = useState<Direction | null>(null);
  const rootRef = useRef<HTMLElement>(null), collisionTimer = useRef<number | null>(null), keyTimer = useRef<number | null>(null);
  const delivered = keyOf(robot) === keyOf(GOAL), ended = delivered || trapped, movingBackground = visible && !reducedMotion;

  const move = useCallback((direction: Direction) => {
    if (ended) return;
    setPressedDirection(direction);
    if (keyTimer.current !== null) window.clearTimeout(keyTimer.current);
    keyTimer.current = window.setTimeout(() => setPressedDirection(null), 180);
    const result = warehouseStep(robot, ACTION_INDEX[direction]), next = result.next;
    if (result.hit) {
      setCollisions(value => value + 1); setCollision(true);
      if (collisionTimer.current !== null) window.clearTimeout(collisionTimer.current);
      collisionTimer.current = window.setTimeout(() => setCollision(false), 900); return;
    }
    const nextMoves = moves + 1; setRobot(next); setMoves(nextMoves); setCollision(false);
    if (result.trapped) { setTrapped(true); return; }
    if (result.done) {
      const earned = Math.max(20, 120 - nextMoves * 5 - collisions * COLLISION_PENALTY);
      setScore(earned); setBestScore(value => value === null ? earned : Math.max(value, earned)); onComplete?.();
    }
  }, [collisions, ended, moves, onComplete, robot]);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)'), preference = () => setReducedMotion(query.matches);
    preference(); query.addEventListener('change', preference);
    let inView = true; const visibility = () => setVisible(inView && !document.hidden);
    const observer = new IntersectionObserver(entries => { inView = entries[0].isIntersecting; visibility(); });
    if (rootRef.current) observer.observe(rootRef.current); document.addEventListener('visibilitychange', visibility);
    return () => { observer.disconnect(); query.removeEventListener('change', preference); document.removeEventListener('visibilitychange', visibility);
      if (collisionTimer.current !== null) window.clearTimeout(collisionTimer.current);
      if (keyTimer.current !== null) window.clearTimeout(keyTimer.current); };
  }, []);
  function reset() {
    if (collisionTimer.current !== null) window.clearTimeout(collisionTimer.current);
    if (keyTimer.current !== null) window.clearTimeout(keyTimer.current);
    setPressedDirection(null);
    setRobot(START); setMoves(0); setScore(null); setCollisions(0); setCollision(false); setTrapped(false);
  }

  return <ContentBlock ref={rootRef} className="vbrl-delivery" title="让机器人学会到达终点" headingLevel={1}
    style={{ '--vbrl-cover-scene': `url("${warehouseScene}")` } as CSSProperties}
    data-position={keyOf(robot)} data-moves={moves} data-collisions={collisions} data-delivered={delivered} data-trapped={trapped} data-score={score}
    data-best-score={bestScore} data-motion={movingBackground ? 'running' : 'paused'} onKeyDown={event => {
      const direction = ({ ArrowUp: 'up', ArrowLeft: 'left', ArrowDown: 'down', ArrowRight: 'right' } as const)[event.key as 'ArrowUp'];
      if (direction) { event.preventDefault(); event.stopPropagation(); move(direction); }
      if (event.key === ' ' && event.target instanceof HTMLElement && event.target.closest('button')) event.stopPropagation();
    }}>
    <div className="vbrl-delivery__scenery" aria-hidden="true" />
    <div className="vbrl-delivery__daylight" aria-hidden="true" />
    <div className="vbrl-delivery__layout">
      <section className="vbrl-delivery__brief" aria-label="送货任务与移动控制">
        <Typography className="vbrl-delivery__eyebrow" variant="bodySmall" tone="accent">VALUE-BASED REINFORCEMENT LEARNING</Typography>
        <Typography as="h2" variant="h1" tone="accent">先试着送达<br />再学会判断</Typography>
        <Typography variant="body" tone="accent">通过与环境交互，<br />学习长期回报更高的策略。</Typography>
        <div className="vbrl-delivery__controller" role="group" aria-label="移动控制">
          {actions.map(action => <Button key={action.direction} className={'vbrl-delivery__direction is-' + action.direction}
            disabled={ended} aria-label={action.name} data-pressed={pressedDirection === action.direction || undefined} onClick={() => move(action.direction)}>
            <span className="vbrl-delivery__key-art" aria-hidden="true">
              <img src={directionKeycap} alt="" draggable={false} />
              <span className="vbrl-delivery__key-face">
                <svg className="vbrl-delivery__key-arrow" viewBox="0 0 32 32" fill="currentColor"><path d="M16 4 28 16H21V28H11V16H4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>
              </span>
            </span>
          </Button>)}
        </div>
        <div className="vbrl-delivery__reset-row"><Button onClick={reset} aria-label="重置机器人"><Refresh size="22" /><Typography as="span" variant="bodySmall" tone="inherit">重新开始</Typography></Button></div>
        <div className="vbrl-delivery__feedback" aria-live="polite">
          <Typography variant="bodySmall" tone={delivered ? 'success' : trapped || collision ? 'danger' : 'accent'}>
            {delivered ? '包裹已签收 · 本局 ' + score + ' 分' : trapped ? '掉入维修坑 · 本回合结束' : collision ? '前方受阻，换个方向试试。' : '避开障碍与维修坑，完成送货。'}</Typography>
          {(delivered || trapped) && <Typography variant="bodySmall" tone="muted">{delivered ? '最高 ' + bestScore + ' 分 · 再试一次。' : '危险区奖励 −10，重新出发。'}</Typography>}
        </div>
      </section>
      <section className="vbrl-delivery__game" aria-label="可交互的七乘七送货地图">
        <div className="vbrl-delivery__map-heading">
          <Typography variant="bodySmall" tone="accent">仓库 A · 将包裹送到签收站</Typography>
          <Typography variant="bodySmall" tone="accent">移动 {moves} 步{collisions > 0 ? ' · 碰撞 ' + collisions + ' 次' : ''}</Typography>
        </div>
        <div className={'vbrl-delivery__map-stage' + (collision ? ' is-collision' : '') + (delivered ? ' is-delivered' : '') + (trapped ? ' is-trapped' : '')}
          tabIndex={0} role="group" aria-label="送货地图，使用方向键移动机器人">
          <WarehouseMap className="vbrl-delivery__map" robot={robot} markers={{ [keyOf(TRAP)]: '!' }} overlay={<>
            <div className="vbrl-delivery__landmark is-receiving-station" role="img" aria-label={delivered ? '签收站已收到包裹' : '空的包裹签收站，等待送达'} data-cargo={delivered ? 'received' : 'empty'}
              style={{ '--landmark-row': GOAL.row, '--landmark-col': GOAL.col } as CSSProperties}>
              <div className="vbrl-delivery__station-art" aria-hidden="true">
                <img className="vbrl-delivery__station-empty" src={receivingStationEmpty} alt="" />
                <img className="vbrl-delivery__station-loaded" src={receivingStationLoaded} alt="" />
              </div>
            </div>
            <div className="vbrl-delivery__landmark is-maintenance-pit" role="img" aria-label="地面维修坑，奖励负10，进入后本回合结束"
              style={{ '--landmark-row': TRAP.row, '--landmark-col': TRAP.col } as CSSProperties}><img src={maintenancePit} alt="" /></div>
            <div className="vbrl-delivery__moving-robot" style={{ '--robot-row': robot.row, '--robot-col': robot.col } as CSSProperties}><img src={robotIcon} alt="机器人" /></div>
          </>} />
        </div>
        <div className="vbrl-delivery__map-legend" role="list" aria-label="地图图例">
          <div className="vbrl-delivery__legend-item" role="listitem">
            <span className="vbrl-delivery__legend-art" aria-hidden="true"><img src={robotIcon} alt="" /></span>
            <Typography as="span" variant="bodySmall" tone="accent">机器人</Typography>
          </div>
          <div className="vbrl-delivery__legend-item" role="listitem">
            <span className="vbrl-delivery__legend-art" aria-hidden="true"><img src={receivingStationEmpty} alt="" /></span>
            <Typography as="span" variant="bodySmall" tone="accent">签收站</Typography>
          </div>
          <div className="vbrl-delivery__legend-item" role="listitem">
            <span className="vbrl-delivery__legend-art" aria-hidden="true"><span className="vbrl-delivery__legend-wall" /></span>
            <Typography as="span" variant="bodySmall" tone="accent">障碍</Typography>
          </div>
          <div className="vbrl-delivery__legend-item" role="listitem">
            <span className="vbrl-delivery__legend-art" aria-hidden="true"><img src={maintenancePit} alt="" /></span>
            <Typography as="span" variant="bodySmall" tone="accent">维修坑</Typography>
          </div>
        </div>
      </section>
    </div>
    <div className="vbrl-delivery__hero" aria-hidden="true">
      <div className="vbrl-delivery__hero-shadow" />
      <div className="vbrl-delivery__hero-body">
        <div className="vbrl-delivery__hero-art">
          <img className="vbrl-delivery__hero-shell" src={heroRobot} alt="" />
          <div className="vbrl-delivery__hero-antenna"><img src={heroRobot} alt="" /></div>
        </div>
      </div>
    </div>
  </ContentBlock>;
}
