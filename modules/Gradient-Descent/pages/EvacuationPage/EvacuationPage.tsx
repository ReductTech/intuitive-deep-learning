import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Button, Typography } from '../../../shared/react';
import { canRescue, distance, advanceGame, nearbyLoot, startSearch, toggleScan, shockwave, requestRescue, MAX_JUMP, movePlayer, newGame, PICKUPS, radiation, saveRun, type GameState, type Point } from '../../model';
import { createScene, type SceneAPI } from './scene';
import { GameAudio } from './audio';
import './EvacuationPage.css';

function Icon({ name }: { name: 'scan' | 'sound' | 'rescue' | 'reset' | 'shield' | 'arrow' | 'radio' }) {
  const paths = {
    scan: <><circle cx="12" cy="12" r="3"/><path d="M6 5a9 9 0 0 0 0 14M18 5a9 9 0 0 1 0 14M9 8a5 5 0 0 0 0 8M15 8a5 5 0 0 1 0 8"/></>,
    sound: <><path d="m4 9 4 0 5-4v14l-5-4H4zM17 8a6 6 0 0 1 0 8M20 5a10 10 0 0 1 0 14"/></>,
    rescue: <><path d="M3 5h18M12 5v4M5 14c0-3 3-5 7-5s7 2 7 5v2H5zM7 16v3m10-3v3M4 19h16M9 10v5m6-5v5"/></>,
    reset: <><path d="M4 9a8 8 0 1 1 0 6M4 4v5h5"/></>,
    shield: <><path d="m12 3 8 3v6c0 5-8 9-8 9S4 17 4 12V6zM8 12l3 3 5-6"/></>,
    arrow: <><path d="M5 12h14m-5-5 5 5-5 5"/></>,
    radio: <><path d="M12 9v12M8 21h8M8 8a6 6 0 0 1 8 0M5 5a10 10 0 0 1 14 0"/><circle cx="12" cy="8" r="1"/></>,
  };
  return <svg className="gd-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export function EvacuationPage() {
  const [game, setGame] = useState<GameState>(() => newGame());
  const [aim, setAim] = useState<Point | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [sound, setSound] = useState(false);
  const [restartPrompt, setRestartPrompt] = useState(false);
  const [labels, setLabels] = useState<Record<string, { x: number; y: number }>>({});
  const hostRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SceneAPI | null>(null);
  const current = useRef(game);
  const aimRef = useRef(aim);
  const audioRef = useRef<GameAudio | null>(null);
  const locked = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef({ jump: (_p: Point) => {}, pulse: () => {} });
  const commit = (next: GameState) => { current.current = next; setGame(next); };
  const clearAim = () => { aimRef.current = null; setAim(null); sceneRef.current?.aim(null); };
  const begin = () => {if(!audioRef.current?.enabled)void audioRef.current?.toggle().then(setSound); commit({ ...current.current, phase: 'playing', message: '搜寻封存核心。闪现击碎守卫，F 搜索箱子，右键释放震荡。' }); stageRef.current?.focus({ preventScroll: true }); };
  const jump = (to: Point) => {
    if (locked.current) return;
    const before = current.current, next = movePlayer(before, to);
    commit(next); clearAim();
    if (next.moves.length > before.moves.length) {
      locked.current = true; timer.current = setTimeout(() => { locked.current = false; }, 480);
      audioRef.current?.play('jump');setTimeout(()=>audioRef.current?.play('impact'),350);
      saveRun(next);
    }
  };
  const pulse=()=>{const before=current.current,next=shockwave(before);commit(next);if(next.pulseAt!==before.pulseAt)audioRef.current?.play('impact');};
  callbackRef.current={jump,pulse};
  const rescue=()=>{const next=requestRescue(current.current);if(next===current.current)return;clearAim();commit(next);audioRef.current?.play('rescue');};
  const scan=()=>{commit(toggleScan(current.current));audioRef.current?.play('pickup');};
  const search=()=>{commit(startSearch(current.current));};
  const restart = () => { if (timer.current) clearTimeout(timer.current); locked.current = false; clearAim(); const next = { ...newGame(current.current.run + 1), phase: 'playing' as const, message: '新的行动。搜到核心后可以撤离，也可以深入争取更高收益。' }; commit(next); setRestartPrompt(false); stageRef.current?.focus({ preventScroll: true }); };

  useLayoutEffect(() => {
    const host = hostRef.current; if (!host) return;
    audioRef.current = new GameAudio();
    let api: SceneAPI;
    try {
      api = createScene(host, { onAim: p => { aimRef.current = p; setAim(p); }, onJump: p => callbackRef.current.jump(p), onPulse: () => callbackRef.current.pulse(), onError: setError, onReady: () => setReady(true), onView: setLabels });
    } catch { return () => audioRef.current?.dispose(); }
    sceneRef.current = api; api.update(current.current);
    return () => { if (timer.current) clearTimeout(timer.current); api.dispose(); sceneRef.current = null; audioRef.current?.dispose(); audioRef.current = null; };
  }, []);
  useLayoutEffect(() => { sceneRef.current?.update(game); }, [game]);
  useEffect(() => {
    // Persist only actual runs. Entering or remounting a slide must not overwrite the completed route.
    if (game.moves.length) saveRun(game);
  }, [game.moves.length,game.collected.length,game.phase]);

  useEffect(()=>{let last=performance.now();const id=setInterval(()=>{const now=performance.now(),before=current.current;const next=advanceGame(before,(now-last)/1000);last=now;if(next!==before){commit(next);if(next.collected.length>before.collected.length)audioRef.current?.play('pickup');if(next.damageAt!==before.damageAt)audioRef.current?.play('warning');if(next.phase==='won'&&before.phase!=='won')audioRef.current?.play('rescue');}},80);return()=>clearInterval(id);},[]);

  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target instanceof HTMLButtonElement) return;
    const key = event.key.toLowerCase();
    if (!['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'e', 'r', 'f', 'q', 'escape'].includes(key)) return;
    event.preventDefault(); event.stopPropagation();
    if (key === 'escape') { clearAim(); return; }
    if (game.phase === 'briefing' && key === ' ') { begin(); return; }
    if ((game.phase !== 'playing'&&game.phase!=='rescuing') || locked.current) return;
    if(key==='f'){search();return;}if(key==='q'){pulse();return;}
    if (key === 'e') { scan(); return; } if (key === 'r') { rescue(); return; }
    if (key === ' ') { if (aimRef.current) jump(aimRef.current);else pulse(); return; }
    const origin = current.current.position, p = aimRef.current ?? { ...origin };
    const right = key === 'arrowright' ? .65 : key === 'arrowleft' ? -.65 : 0, up = key === 'arrowup' ? .65 : key === 'arrowdown' ? -.65 : 0;
    const x = p.x + right * .846 + up * .533, z = p.z + right * .533 - up * .846;
    const len = Math.hypot(x - origin.x, z - origin.z), ratio = len > MAX_JUMP ? MAX_JUMP / len : 1;
    const a = { x: origin.x + (x - origin.x) * ratio, z: origin.z + (z - origin.z) * ratio };
    aimRef.current = a; setAim(a); sceneRef.current?.aim(a);
  };
  const rad = radiation(game.position), previous = game.moves.at(-1)?.before, delta = previous === undefined ? null : rad - previous;
  const equipped = game.collected.includes('scanner');
  const power=aim?Math.min(1,distance(game.position,aim)/MAX_JUMP):0;
  const message=aim?`裂隙蓄能 ${Math.round(power*100)}% · ${power>.82?'过载：落地方向会偏移':'松手闪现，穿透守卫与树木'}`:game.message;
  const loot=nearbyLoot(game), active=game.phase==='playing'||game.phase==='rescuing';
  const title=game.phase==='won'?'战利品已安全带出':game.phase==='lost'?'背包遗失在禁区':'带上战利品，活着回来';
  const result = game.phase === 'won' || game.phase === 'lost';

  return <section className="gd-page" aria-label="禁区撤离">
    <div className="gd-game" tabIndex={0} ref={stageRef} onKeyDown={keyDown} role="group" aria-label="禁区撤离游戏。按住小球向后拖拽，松手瞬移。也可用方向键瞄准、空格瞬移，F 搜索，Q 或右键震荡，E 扫描，R 呼叫撤离。" data-phase={game.phase} data-blinking={game.elapsed<game.blinkUntil} data-ready={ready} data-x={game.position.x.toFixed(3)} data-z={game.position.z.toFixed(3)} data-health={game.health.toFixed(2)} data-moves={game.moves.length} data-radiation={rad.toFixed(2)} data-energy={game.energy.toFixed(2)} data-value={game.value} data-cores={game.cores} data-kills={game.kills} data-broken={game.brokenTrees.length} data-elapsed={game.elapsed.toFixed(2)} data-search={game.search?.id??''}>
      <div className="gd-world">
        <div className="gd-render" onPointerDown={()=>stageRef.current?.focus({preventScroll:true})} ref={hostRef} aria-label="废弃工业区、森林、河流与救援停机坪的三维地图" />
        <div className="gd-vignette" aria-hidden="true" /><div className="gd-warp" aria-hidden="true" /><div className={`gd-damage${game.elapsed-game.damageAt<.35?' is-hit':''}`} aria-hidden="true" />
        {!ready && !error && <div className="gd-loading"><i/><Typography variant="bodySmall" tone="inherit">正在进入行动区域…</Typography></div>}
        {error && <div className="gd-render-error"><Typography variant="body" tone="inherit">{error}</Typography><Button onClick={() => location.reload()}>重新进入</Button></div>}
        <div className="gd-mission"><div className="gd-mission-mark"><Icon name="radio"/></div><div><Typography variant="bodySmall" tone="inherit" className="gd-eyebrow">禁区 / SECTOR 07</Typography><Typography variant="bodySmall" tone="inherit">搜寻 · 交战 · 撤离</Typography></div></div>
        <div className="gd-status"><div className="gd-health"><Icon name="shield"/><Typography as="span" variant="bodySmall" tone="inherit">防护 {Math.ceil(game.health)}%</Typography><div className="gd-health-track" role="progressbar" aria-label="剩余防护" aria-valuenow={Math.ceil(game.health)} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${game.health}%`, background: game.health < 30 ? '#e2947c' : '#b9d3ac' }}/></div></div><Typography as="span" variant="bodySmall" tone="inherit" className="gd-step-count">₳ {game.value} · 核心 {game.cores}</Typography></div>
        {ready && labels.exit && !result && game.phase !== 'rescuing' && <div className="gd-world-label gd-exit-label" style={{ left: `${labels.exit.x}%`, top: `${labels.exit.y}%` }}><i/><Typography as="span" variant="bodySmall" tone="inherit">撤离点</Typography></div>}
        {ready && PICKUPS.filter(p => !game.collected.includes(p.id)).map(p => labels[p.id] && <div className="gd-world-label gd-pickup-label" key={p.id} style={{ left: `${labels[p.id].x}%`, top: `${labels[p.id].y}%`, color: p.color }}><Typography as="span" variant="bodySmall" tone="inherit">{p.label}</Typography></div>)}
        {game.phase !== 'briefing' && <div className={`gd-meter${rad > 7 ? ' gd-meter--danger' : ''}`}><div className="gd-meter-name"><Icon name="scan"/><Typography variant="bodySmall" tone="inherit">辐射 / 以太</Typography></div><div className="gd-meter-value"><Typography as="span" variant="h2" tone="inherit">{rad.toFixed(2)}</Typography><Typography as="span" variant="bodySmall" tone="inherit" className="gd-delta">{delta === null ? '当前位置' : `${delta <= 0 ? '↓' : '↑'} ${Math.abs(delta).toFixed(2)}`}</Typography></div><div className="gd-rad-track"><i style={{ width: `${Math.min(100, rad * 10)}%` }}/></div><div className="gd-energy"><Typography variant="bodySmall" tone="inherit">以太 {Math.floor(game.energy)} / 100</Typography><div><i style={{width:`${game.energy}%`}}/></div></div></div>}
        {game.scan && <div className="gd-scan-legend"><Typography as="span" variant="bodySmall" tone="inherit">低辐射</Typography><i/><Typography as="span" variant="bodySmall" tone="inherit">高辐射</Typography></div>}
        {game.phase === 'rescuing' && <div className="gd-rescue-caption"><Icon name="rescue"/><Typography variant="body" tone="inherit">守住停机坪 · {Math.max(0,8-game.extraction).toFixed(1)} 秒</Typography></div>}
        {(game.phase === 'briefing' || result) && !error && <div className={`gd-story${result ? ' gd-story--result' : ''}`}><Typography variant="bodySmall" tone="inherit" className="gd-eyebrow">{game.phase === 'won' ? 'MISSION COMPLETE' : game.phase === 'lost' ? 'SIGNAL LOST' : '搜寻 / 交战 / 撤离'}</Typography><Typography variant="h3" tone="inherit">{title}</Typography><Typography variant="bodySmall" tone="inherit">{game.phase === 'won' ? `${game.value} 战利品已入库 · 击碎 ${game.kills} 名守卫 · 破坏 ${game.brokenTrees.length} 棵树` : game.phase === 'lost' ? '本次战利品全部遗失。闪现能撞杀守卫，震荡可以清掉弹幕；先搜一个核心，就有机会带出收益。' : '在森林与废墟里搜寻核心。用裂隙闪现击碎守卫、撞断树木；带着战利品抵达东北的停机坪，守住最后 8 秒。贪心深入，还是见好就收？'}</Typography>{game.phase === 'won' && <Typography variant="bodySmall" tone="inherit" className="gd-reflection">看不见整张地图时，怎样找到更安全的方向？</Typography>}<Button variant="primary" disabled={!ready} onClick={result ? restart : begin}>{game.phase === 'won' ? '再挑战一次' : game.phase === 'lost' ? '重新尝试' : '开始行动'}<Icon name="arrow"/></Button></div>}
        {restartPrompt && <div className="gd-restart-prompt"><Typography variant="bodySmall" tone="inherit">重新开始本次行动？</Typography><div><Button onClick={() => setRestartPrompt(false)}>继续行动</Button><Button onClick={restart} variant="primary">重新开始</Button></div></div>}
      </div>
      {active&&<><div className="gd-storm"><Typography variant="bodySmall" tone="inherit">风暴抵达 {Math.max(0,Math.floor((180-game.elapsed)/60))}:{String(Math.floor((180-game.elapsed)%60)).padStart(2,'0')}</Typography></div><div className="gd-context"><Button disabled={game.energy<28||game.elapsed-game.pulseAt<3.2} onClick={pulse}>震荡 Q · 28 以太</Button>{loot&&game.phase==='playing'&&<Button variant="primary" onClick={search} disabled={!!game.search}>{game.search?`搜索中 ${Math.min(100,Math.floor(game.search.progress*100))}%`:'搜索 F'}</Button>}</div></>}
      <div className="gd-command"><div className="gd-command-message" aria-live="polite"><i className={power>.82?'gd-dot--warning':''}/><Typography variant="bodySmall" tone="inherit">{message}</Typography></div><div className="gd-actions"><Button className="gd-tool" disabled={!equipped || game.phase !== 'playing'} active={game.scan} onClick={scan} explain={equipped ? 'E：消耗 12 以太，扫描 4 秒' : '找到金色补给箱，获得扫描器'}><Icon name="scan"/>{equipped ? game.scan ? '关闭扫描' : '扫描 4 秒' : '扫描器未取得'}</Button><Button variant="primary" className="gd-rescue-button" disabled={!canRescue(game)} onClick={rescue}><Icon name="rescue"/>撤离 R</Button></div></div>
    </div>
    <div className="gd-footer"><Typography variant="bodySmall" tone="muted">拖拽闪现 · 右键 / Q 震荡 · F 搜索 · E 扫描 · 滚轮缩放</Typography><div><Typography variant="bodySmall" tone="muted">守卫蓄能时避开弹道</Typography><Button className="gd-footer-tool" aria-label={sound ? '关闭游戏声音' : '开启游戏声音'} onClick={async () => setSound(await audioRef.current?.toggle() ?? false)}><Icon name="sound"/>{sound ? '声音开' : '声音关'}</Button><Button className="gd-footer-tool" aria-label="重新开始行动" disabled={game.phase === 'rescuing'} onClick={() => game.moves.length && game.phase === 'playing' ? setRestartPrompt(true) : restart()}><Icon name="reset"/></Button></div></div>
  </section>;
}


