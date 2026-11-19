import { valueBasedRlAssetUrl } from '../../assetUrls';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Refresh } from '@icon-park/react';
import { Button, ContentBlock, Typography } from "@shuku/course-style/react";
import { WarehouseMap } from '../../components/WarehouseMap';
import { GOAL, START, keyOf, type Position } from '../../model';
import { TRAP, warehouseStep } from '../QLearningLoopPage/qLearningSimulation';
import './DeliveryTaskPage.css';

const robotIcon = valueBasedRlAssetUrl("cover-v2/robot.webp");
const warehouseScene = valueBasedRlAssetUrl("cover-v2/warehouse.webp");
const heroRobot = valueBasedRlAssetUrl("cover-v2/robot.webp");
const directionKeycap = valueBasedRlAssetUrl("cover-v2/direction-keycap.webp");
const receivingStationEmpty = valueBasedRlAssetUrl("cover-v2/receiving-station-empty.webp");
const receivingStationLoaded = valueBasedRlAssetUrl("cover-v2/receiving-station-loaded.webp");
const maintenancePit = valueBasedRlAssetUrl("cover-v2/maintenance-pit.webp");

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

  return <ContentBlock shuku-edit-id="e-c38bf22a-238d-49d6-97f1-611bf326d0f2" ref={rootRef} className="vbrl-delivery" title="让机器人学会到达终点" headingLevel={1}
    style={{ '--vbrl-cover-scene': `url("${warehouseScene}")` } as CSSProperties}
    data-position={keyOf(robot)} data-moves={moves} data-collisions={collisions} data-delivered={delivered} data-trapped={trapped} data-score={score}
    data-best-score={bestScore} data-motion={movingBackground ? 'running' : 'paused'} onKeyDown={event => {
      const direction = ({ ArrowUp: 'up', ArrowLeft: 'left', ArrowDown: 'down', ArrowRight: 'right' } as const)[event.key as 'ArrowUp'];
      if (direction) { event.preventDefault(); event.stopPropagation(); move(direction); }
      if (event.key === ' ' && event.target instanceof HTMLElement && event.target.closest('button')) event.stopPropagation();
    }}>
    <div shuku-edit-id="e-4cd4cb06-3288-476e-b13b-640df377ccc3" className="vbrl-delivery__scenery" aria-hidden="true" />
    <div shuku-edit-id="e-8c29f878-818d-40a2-84af-35ad777868f0" className="vbrl-delivery__daylight" aria-hidden="true" />
    <div shuku-edit-id="e-a57dc2c9-858d-4531-a346-60830511ea99" className="vbrl-delivery__layout">
      <section shuku-edit-id="e-9ed92d8c-4b4b-4fed-87e7-b34824af2d03" className="vbrl-delivery__brief" aria-label="送货任务与移动控制">
        <Typography shuku-edit-id="e-eb1ee956-a459-4a2f-92af-814dc5102c62" className="vbrl-delivery__eyebrow" variant="bodySmall" tone="accent">VALUE-BASED REINFORCEMENT LEARNING</Typography>
        <Typography shuku-edit-id="e-58c34cdf-d361-43d1-b884-a75aec3e35b4" as="h2" variant="h1" tone="accent">先试着送达<br shuku-edit-id="e-b6570a8a-4a4d-4a32-a0db-4e2879b9b359" />再学会判断</Typography>
        <Typography shuku-edit-id="e-82b60b6d-86c5-45c5-832f-ee3239129895" variant="body" tone="accent">通过与环境交互，<br shuku-edit-id="e-d7627dc9-592e-4116-bd04-d42e30df9985" />学习长期回报更高的策略。</Typography>
        <div shuku-edit-id="e-33c047ce-750b-4d65-8341-d63e34068cb9" className="vbrl-delivery__controller" role="group" aria-label="移动控制">
          {actions.map(action => <Button key={action.direction} className={'vbrl-delivery__direction is-' + action.direction}
            disabled={ended} aria-label={action.name} data-pressed={pressedDirection === action.direction || undefined} onClick={() => move(action.direction)}>
            <span shuku-edit-id="e-f8532b82-fdab-4d87-bd43-04f6c8441a1f" className="vbrl-delivery__key-art" aria-hidden="true">
              <img shuku-edit-id="e-e6cd506c-5797-49cc-8dd6-ccb0f250d483" src={directionKeycap} alt="" draggable={false} />
              <span shuku-edit-id="e-e77a37a1-ae80-4d95-84b8-58e004c6b65e" className="vbrl-delivery__key-face">
                <svg shuku-edit-id="e-fe633227-d457-4906-ae1d-49b095a395e0" className="vbrl-delivery__key-arrow" viewBox="0 0 32 32" fill="currentColor"><path shuku-edit-id="e-3447e181-0d4c-4bd3-afe5-e17825c2b2f1" d="M16 4 28 16H21V28H11V16H4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>
              </span>
            </span>
          </Button>)}
        </div>
        <div shuku-edit-id="e-6ac987e1-a25f-4d59-9508-6225be2bd74e" className="vbrl-delivery__reset-row"><Button onClick={reset} aria-label="重置机器人"><Refresh size="22" /><Typography shuku-edit-id="e-f813839e-2c12-4e53-a330-cb018e54d882" as="span" variant="bodySmall" tone="inherit">重新开始</Typography></Button></div>
        <div shuku-edit-id="e-c51c5632-691b-4b04-b6ee-94402ce2ed97" className="vbrl-delivery__feedback" aria-live="polite">
          <Typography shuku-edit-id="e-f5a05361-a7b5-470c-abb0-c6203e2c5e58" variant="bodySmall" tone={delivered ? 'success' : trapped || collision ? 'danger' : 'accent'}>
            {delivered ? '包裹已签收 · 本局 ' + score + ' 分' : trapped ? '掉入维修坑 · 本回合结束' : collision ? '前方受阻，换个方向试试。' : '避开障碍与维修坑，完成送货。'}</Typography>
          {(delivered || trapped) && <Typography shuku-edit-id="e-741077a3-8e31-4505-80dc-18185040f834" variant="bodySmall" tone="muted">{delivered ? '最高 ' + bestScore + ' 分 · 再试一次。' : '危险区奖励 −10，重新出发。'}</Typography>}
        </div>
      </section>
      <section shuku-edit-id="e-cad4c366-306f-4392-9584-f1e46645d0e9" className="vbrl-delivery__game" aria-label="可交互的七乘七送货地图">
        <div shuku-edit-id="e-49474963-4993-43b7-b0a4-bfb1233b6f6b" className="vbrl-delivery__map-heading">
          <Typography shuku-edit-id="e-fd614e8f-fb60-42f0-a553-e7bf487a1eca" variant="bodySmall" tone="accent">仓库 A · 将包裹送到签收站</Typography>
          <Typography shuku-edit-id="e-e048b936-6031-4171-81e3-27795df787b1" variant="bodySmall" tone="accent">移动 {moves} 步{collisions > 0 ? ' · 碰撞 ' + collisions + ' 次' : ''}</Typography>
        </div>
        <div shuku-edit-id="e-51ffdf24-53ec-486c-a802-8347ec8de407" className={'vbrl-delivery__map-stage' + (collision ? ' is-collision' : '') + (delivered ? ' is-delivered' : '') + (trapped ? ' is-trapped' : '')}
          tabIndex={0} role="group" aria-label="送货地图，使用方向键移动机器人">
          <WarehouseMap className="vbrl-delivery__map" robot={robot} markers={{ [keyOf(TRAP)]: '!' }} overlay={<>
            <div shuku-edit-id="e-776659b8-a7ed-44b6-8038-3c118cde1934" className="vbrl-delivery__landmark is-receiving-station" role="img" aria-label={delivered ? '签收站已收到包裹' : '空的包裹签收站，等待送达'} data-cargo={delivered ? 'received' : 'empty'}
              style={{ '--landmark-row': GOAL.row, '--landmark-col': GOAL.col } as CSSProperties}>
              <div shuku-edit-id="e-60a2d6a6-60de-4aba-a3f7-fb378a7b0073" className="vbrl-delivery__station-art" aria-hidden="true">
                <img shuku-edit-id="e-e1767d13-9eab-4b50-92b7-b434e3748384" className="vbrl-delivery__station-empty" src={receivingStationEmpty} alt="" />
                <img shuku-edit-id="e-30f4f08c-5dcc-4272-9ec3-722073f8469b" className="vbrl-delivery__station-loaded" src={receivingStationLoaded} alt="" />
              </div>
            </div>
            <div shuku-edit-id="e-7a05c9a3-0ad9-4b31-a7db-dd2d9d44ffeb" className="vbrl-delivery__landmark is-maintenance-pit" role="img" aria-label="地面维修坑，奖励负10，进入后本回合结束"
              style={{ '--landmark-row': TRAP.row, '--landmark-col': TRAP.col } as CSSProperties}><img shuku-edit-id="e-108665e1-c0b9-4d48-91c3-117527f5b681" src={maintenancePit} alt="" /></div>
            <div shuku-edit-id="e-1c746ab1-c761-4821-adbd-a4ddc7b40025" className="vbrl-delivery__moving-robot" style={{ '--robot-row': robot.row, '--robot-col': robot.col } as CSSProperties}><img shuku-edit-id="e-2393eabf-45ac-4933-aacb-62f3770aa41c" src={robotIcon} alt="机器人" /></div>
          </>} />
        </div>
        <div shuku-edit-id="e-f092b793-b372-4e1e-a6f2-932a0667ab75" className="vbrl-delivery__map-legend" role="list" aria-label="地图图例">
          <div shuku-edit-id="e-9357a100-f40e-45dc-8249-eb7b9f6f8c73" className="vbrl-delivery__legend-item" role="listitem">
            <span shuku-edit-id="e-8d756d71-e57f-4b60-b438-f3c0161fa890" className="vbrl-delivery__legend-art" aria-hidden="true"><img shuku-edit-id="e-2a981ff2-d05c-45a3-9c78-af2475d18f92" src={robotIcon} alt="" /></span>
            <Typography shuku-edit-id="e-24fa7711-7407-44d0-97cf-3906243fae94" as="span" variant="bodySmall" tone="accent">机器人</Typography>
          </div>
          <div shuku-edit-id="e-e11425af-3d17-4b6e-a2d2-c5b78309bf64" className="vbrl-delivery__legend-item" role="listitem">
            <span shuku-edit-id="e-aa8ea049-8373-470b-a352-ea869f7e5a8d" className="vbrl-delivery__legend-art" aria-hidden="true"><img shuku-edit-id="e-14a04405-b846-4f3c-8ce7-596e93cc22c8" src={receivingStationEmpty} alt="" /></span>
            <Typography shuku-edit-id="e-b34697a6-1a19-4adf-8a5a-98b8358363a2" as="span" variant="bodySmall" tone="accent">签收站</Typography>
          </div>
          <div shuku-edit-id="e-c13d882d-8005-4b86-8340-30fb1a880a04" className="vbrl-delivery__legend-item" role="listitem">
            <span shuku-edit-id="e-4e782596-fba5-42cb-9bbc-7adf564dc575" className="vbrl-delivery__legend-art" aria-hidden="true"><span shuku-edit-id="e-9387ae6a-1115-4c9b-8702-507285dc838c" className="vbrl-delivery__legend-wall" /></span>
            <Typography shuku-edit-id="e-e1518a39-01b0-499e-b297-edf0dfc5ee56" as="span" variant="bodySmall" tone="accent">障碍</Typography>
          </div>
          <div shuku-edit-id="e-73e95c4e-c721-41a5-b737-fcb7cc0401a2" className="vbrl-delivery__legend-item" role="listitem">
            <span shuku-edit-id="e-924c2e61-499c-44e5-8dd1-b40b2455635c" className="vbrl-delivery__legend-art" aria-hidden="true"><img shuku-edit-id="e-6949305d-b1dd-4c77-a7a3-3b1ad43f3394" src={maintenancePit} alt="" /></span>
            <Typography shuku-edit-id="e-b00abcce-9971-4fd7-acad-ec39d350560a" as="span" variant="bodySmall" tone="accent">维修坑</Typography>
          </div>
        </div>
      </section>
    </div>
    <div shuku-edit-id="e-4fbc5402-b52c-4d30-aa54-39cd14f8dacd" className="vbrl-delivery__hero" aria-hidden="true">
      <div shuku-edit-id="e-895dc9c3-63c8-41f9-aa36-0e9fc3a47e7f" className="vbrl-delivery__hero-shadow" />
      <div shuku-edit-id="e-3ae5469c-bf59-43dc-9a4d-b271695cf279" className="vbrl-delivery__hero-body">
        <div shuku-edit-id="e-c1382aca-1bdd-46d7-b6f4-1595af5f7db3" className="vbrl-delivery__hero-art">
          <img shuku-edit-id="e-d2831163-724b-4d93-b2f0-40d97caa626c" className="vbrl-delivery__hero-shell" src={heroRobot} alt="" />
          <div shuku-edit-id="e-4cbfdf9e-1405-42eb-90dc-5475bdc7387c" className="vbrl-delivery__hero-antenna"><img shuku-edit-id="e-eb256766-a996-463f-8fd9-e0fc2c6f20bd" src={heroRobot} alt="" /></div>
        </div>
      </div>
    </div>
  </ContentBlock>;
}
