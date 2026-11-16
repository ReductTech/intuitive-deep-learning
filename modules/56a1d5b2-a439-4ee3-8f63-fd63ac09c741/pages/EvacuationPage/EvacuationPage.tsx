import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Button, Typography } from "@shuku/course-style/react";
import { canRescue, distance, advanceGame, nearbyLoot, startSearch, toggleScan, shockwave, requestRescue, MAX_JUMP, movePlayer, newGame, PICKUPS, radiation, saveRun, type GameState, type Point } from '../../model';
import { createScene, type SceneAPI } from './scene';
import { GameAudio } from './audio';
import './EvacuationPage.css';

function Icon({ name }: { name: 'scan' | 'sound' | 'rescue' | 'reset' | 'shield' | 'arrow' | 'radio' }) {
  const paths = {
    scan: <><circle shuku-edit-id="e-ce6e04cf-82d4-412a-8f78-bc1f6f68998d" cx="12" cy="12" r="3"/><path shuku-edit-id="e-4271b423-7a6e-4687-b001-3b312b946526" d="M6 5a9 9 0 0 0 0 14M18 5a9 9 0 0 1 0 14M9 8a5 5 0 0 0 0 8M15 8a5 5 0 0 1 0 8"/></>,
    sound: <><path shuku-edit-id="e-2f7c1c42-3eed-4f05-ae1d-8e7e52b024f9" d="m4 9 4 0 5-4v14l-5-4H4zM17 8a6 6 0 0 1 0 8M20 5a10 10 0 0 1 0 14"/></>,
    rescue: <><path shuku-edit-id="e-b645de02-ddbf-4791-b5a4-7fa7cc2ee6a6" d="M3 5h18M12 5v4M5 14c0-3 3-5 7-5s7 2 7 5v2H5zM7 16v3m10-3v3M4 19h16M9 10v5m6-5v5"/></>,
    reset: <><path shuku-edit-id="e-cd5c7751-9bb1-43a7-85d1-5fc598241de7" d="M4 9a8 8 0 1 1 0 6M4 4v5h5"/></>,
    shield: <><path shuku-edit-id="e-5dbada50-7522-40ea-94da-a20fb3327232" d="m12 3 8 3v6c0 5-8 9-8 9S4 17 4 12V6zM8 12l3 3 5-6"/></>,
    arrow: <><path shuku-edit-id="e-68d73327-f7f0-4027-95ff-b688a5c6aa0d" d="M5 12h14m-5-5 5 5-5 5"/></>,
    radio: <><path shuku-edit-id="e-f60501be-1ab4-41bb-b490-946ea533333f" d="M12 9v12M8 21h8M8 8a6 6 0 0 1 8 0M5 5a10 10 0 0 1 14 0"/><circle shuku-edit-id="e-19e1c6fa-a97f-4163-bece-5e4fe5a59d69" cx="12" cy="8" r="1"/></>,
  };
  return <svg shuku-edit-id="e-20d5ff2e-e80e-44f1-bba9-f0ce4ac88ae8" className="gd-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
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

  return <section shuku-edit-id="e-3352179f-6e43-4d26-8b12-25a8af152297" className="gd-page" aria-label="禁区撤离">
    <div shuku-edit-id="e-fb5668ba-04f8-4b01-b116-55165aa13529" className="gd-game" tabIndex={0} ref={stageRef} onKeyDown={keyDown} role="group" aria-label="禁区撤离游戏。按住小球向后拖拽，松手瞬移。也可用方向键瞄准、空格瞬移，F 搜索，Q 或右键震荡，E 扫描，R 呼叫撤离。" data-phase={game.phase} data-blinking={game.elapsed<game.blinkUntil} data-ready={ready} data-x={game.position.x.toFixed(3)} data-z={game.position.z.toFixed(3)} data-health={game.health.toFixed(2)} data-moves={game.moves.length} data-radiation={rad.toFixed(2)} data-energy={game.energy.toFixed(2)} data-value={game.value} data-cores={game.cores} data-kills={game.kills} data-broken={game.brokenTrees.length} data-elapsed={game.elapsed.toFixed(2)} data-search={game.search?.id??''}>
      <div shuku-edit-id="e-03db7c29-2805-4699-a166-6a1d0ecf60f0" className="gd-world">
        <div shuku-edit-id="e-0135df1d-1097-4e3e-bce1-4a5ffbce86ca" className="gd-render" onPointerDown={()=>stageRef.current?.focus({preventScroll:true})} ref={hostRef} aria-label="废弃工业区、森林、河流与救援停机坪的三维地图" />
        <div shuku-edit-id="e-68a051dd-c49a-409b-ae6f-26fe6b49e3fc" className="gd-vignette" aria-hidden="true" /><div shuku-edit-id="e-c29141a8-2b20-4a4a-ae3b-482ba7deed7a" className="gd-warp" aria-hidden="true" /><div shuku-edit-id="e-2e0b0afa-4a77-46a0-bca8-db58733b5ad7" className={`gd-damage${game.elapsed-game.damageAt<.35?' is-hit':''}`} aria-hidden="true" />
        {!ready && !error && <div shuku-edit-id="e-5f5ee006-d6f7-4d8c-840a-3585b3a0f5bd" className="gd-loading"><i shuku-edit-id="e-f1ffb904-08b4-4dd8-995a-2906116e06bb"/><Typography shuku-edit-id="e-e36d456b-62c2-4663-adfe-774630401cbf" variant="bodySmall" tone="inherit">正在进入行动区域…</Typography></div>}
        {error && <div shuku-edit-id="e-18c32e87-4c65-4681-980c-6f45fa2ada5e" className="gd-render-error"><Typography shuku-edit-id="e-c4bd5a0f-8447-4998-a61e-8a801525b27e" variant="body" tone="inherit">{error}</Typography><Button onClick={() => location.reload()}>重新进入</Button></div>}
        <div shuku-edit-id="e-522dc068-e42f-4f00-a49a-3add757c0fa5" className="gd-mission"><div shuku-edit-id="e-8f08886b-526c-4794-884d-42c80e57559f" className="gd-mission-mark"><Icon name="radio"/></div><div shuku-edit-id="e-02d0e1db-d9b5-4999-baf4-01f9d787045e"><Typography shuku-edit-id="e-041fda11-86e3-472c-9298-b9ca1c47f283" variant="bodySmall" tone="inherit" className="gd-eyebrow">禁区 / SECTOR 07</Typography><Typography shuku-edit-id="e-218aae05-705c-4788-9c96-7cab99dbe17d" variant="bodySmall" tone="inherit">搜寻 · 交战 · 撤离</Typography></div></div>
        <div shuku-edit-id="e-a79b4bc0-58b3-40b3-9c62-ccaf808eb417" className="gd-status"><div shuku-edit-id="e-0c1a6560-2286-4277-b2f1-b84f5ef99635" className="gd-health"><Icon name="shield"/><Typography shuku-edit-id="e-b129d759-679a-48d7-9f65-ef3a08c032e3" as="span" variant="bodySmall" tone="inherit">防护 {Math.ceil(game.health)}%</Typography><div shuku-edit-id="e-0649f5cb-1aad-4256-98df-0c2d99cceac5" className="gd-health-track" role="progressbar" aria-label="剩余防护" aria-valuenow={Math.ceil(game.health)} aria-valuemin={0} aria-valuemax={100}><i shuku-edit-id="e-c9ce98c1-1245-4c54-8d0b-3373e549b22f" style={{ width: `${game.health}%`, background: game.health < 30 ? '#e2947c' : '#b9d3ac' }}/></div></div><Typography shuku-edit-id="e-3b648b46-153d-4329-a2cc-5ce9310e5974" as="span" variant="bodySmall" tone="inherit" className="gd-step-count">₳ {game.value} · 核心 {game.cores}</Typography></div>
        {ready && labels.exit && !result && game.phase !== 'rescuing' && <div shuku-edit-id="e-8b9315cb-45ff-451b-8d37-2bbf4331d651" className="gd-world-label gd-exit-label" style={{ left: `${labels.exit.x}%`, top: `${labels.exit.y}%` }}><i shuku-edit-id="e-c9212bd8-bf78-4c9c-8266-843915328b48"/><Typography shuku-edit-id="e-5e43bd02-05bb-4dd1-b8f2-4cad6867cfae" as="span" variant="bodySmall" tone="inherit">撤离点</Typography></div>}
        {ready && PICKUPS.filter(p => !game.collected.includes(p.id)).map(p => labels[p.id] && <div shuku-edit-id="e-bda599f4-4233-4b41-8332-97c861cec77b" className="gd-world-label gd-pickup-label" key={p.id} style={{ left: `${labels[p.id].x}%`, top: `${labels[p.id].y}%`, color: p.color }}><Typography shuku-edit-id="e-44e62972-3e96-496d-93b5-c1d37cf20998" as="span" variant="bodySmall" tone="inherit">{p.label}</Typography></div>)}
        {game.phase !== 'briefing' && <div shuku-edit-id="e-922cd404-8227-4a04-a928-c29163d55a97" className={`gd-meter${rad > 7 ? ' gd-meter--danger' : ''}`}><div shuku-edit-id="e-c07f66d5-3feb-4ea2-8831-878671dd920c" className="gd-meter-name"><Icon name="scan"/><Typography shuku-edit-id="e-e365cd54-3d8a-46ea-b1bd-08ca081106d5" variant="bodySmall" tone="inherit">辐射 / 以太</Typography></div><div shuku-edit-id="e-de52aa93-a3cc-4804-bd15-5599b0e60b3f" className="gd-meter-value"><Typography shuku-edit-id="e-2cd16e93-a79b-4af4-93f1-4e648b8aabd9" as="span" variant="h2" tone="inherit">{rad.toFixed(2)}</Typography><Typography shuku-edit-id="e-b1208a51-038e-4b17-88c3-ca85ceb6f1fb" as="span" variant="bodySmall" tone="inherit" className="gd-delta">{delta === null ? '当前位置' : `${delta <= 0 ? '↓' : '↑'} ${Math.abs(delta).toFixed(2)}`}</Typography></div><div shuku-edit-id="e-59320487-b53b-4e02-9960-51b1945f4c24" className="gd-rad-track"><i shuku-edit-id="e-80b97243-c8b5-4c63-82ff-8f38bb84cad7" style={{ width: `${Math.min(100, rad * 10)}%` }}/></div><div shuku-edit-id="e-780098a5-41f3-44d8-ae94-1aca2b9687b5" className="gd-energy"><Typography shuku-edit-id="e-e3eb6120-153b-43e7-bd8b-db363a690be4" variant="bodySmall" tone="inherit">以太 {Math.floor(game.energy)} / 100</Typography><div shuku-edit-id="e-d600c3c9-6452-4204-8d93-084664caa369"><i shuku-edit-id="e-67e9d672-166f-4955-9a5a-839c17aebc0f" style={{width:`${game.energy}%`}}/></div></div></div>}
        {game.scan && <div shuku-edit-id="e-a8ca04c3-5308-4526-83e7-06cdd9d88fa7" className="gd-scan-legend"><Typography shuku-edit-id="e-bbbe579e-1905-4695-8af0-343f5e74a92b" as="span" variant="bodySmall" tone="inherit">低辐射</Typography><i shuku-edit-id="e-06a54ff6-158f-436f-a0ff-e81a4742567e"/><Typography shuku-edit-id="e-ba2940cb-a3c5-4267-b7e1-6e46e6608c61" as="span" variant="bodySmall" tone="inherit">高辐射</Typography></div>}
        {game.phase === 'rescuing' && <div shuku-edit-id="e-05eea7a5-8669-4731-885f-19dfc146caf8" className="gd-rescue-caption"><Icon name="rescue"/><Typography shuku-edit-id="e-0a10e630-9f1a-44b8-a961-04ab5ea27c2d" variant="body" tone="inherit">守住停机坪 · {Math.max(0,8-game.extraction).toFixed(1)} 秒</Typography></div>}
        {(game.phase === 'briefing' || result) && !error && <div shuku-edit-id="e-676bba5a-17da-488c-8c29-273d4680737c" className={`gd-story${result ? ' gd-story--result' : ''}`}><Typography shuku-edit-id="e-5946cc5b-49c7-4ee9-b398-d0610d48dcd4" variant="bodySmall" tone="inherit" className="gd-eyebrow">{game.phase === 'won' ? 'MISSION COMPLETE' : game.phase === 'lost' ? 'SIGNAL LOST' : '搜寻 / 交战 / 撤离'}</Typography><Typography shuku-edit-id="e-777f6e2a-93fc-4509-9b54-989aac81279f" variant="h3" tone="inherit">{title}</Typography><Typography shuku-edit-id="e-ff5363b6-cdeb-4c01-abe5-fa3476537783" variant="bodySmall" tone="inherit">{game.phase === 'won' ? `${game.value} 战利品已入库 · 击碎 ${game.kills} 名守卫 · 破坏 ${game.brokenTrees.length} 棵树` : game.phase === 'lost' ? '本次战利品全部遗失。闪现能撞杀守卫，震荡可以清掉弹幕；先搜一个核心，就有机会带出收益。' : '在森林与废墟里搜寻核心。用裂隙闪现击碎守卫、撞断树木；带着战利品抵达东北的停机坪，守住最后 8 秒。贪心深入，还是见好就收？'}</Typography>{game.phase === 'won' && <Typography shuku-edit-id="e-7238d989-8c79-49da-a518-98a64f96b6d2" variant="bodySmall" tone="inherit" className="gd-reflection">看不见整张地图时，怎样找到更安全的方向？</Typography>}<Button variant="primary" disabled={!ready} onClick={result ? restart : begin}>{game.phase === 'won' ? '再挑战一次' : game.phase === 'lost' ? '重新尝试' : '开始行动'}<Icon name="arrow"/></Button></div>}
        {restartPrompt && <div shuku-edit-id="e-95a2de35-ca51-485c-9167-326a17a2481f" className="gd-restart-prompt"><Typography shuku-edit-id="e-adda1986-1531-43d8-8d36-95942b1495f5" variant="bodySmall" tone="inherit">重新开始本次行动？</Typography><div shuku-edit-id="e-71a7cc95-5adf-40c1-8ca4-e1495da0c8f1"><Button onClick={() => setRestartPrompt(false)}>继续行动</Button><Button onClick={restart} variant="primary">重新开始</Button></div></div>}
      </div>
      {active&&<><div shuku-edit-id="e-09038a02-1c10-4a73-9e1e-795e4402625c" className="gd-storm"><Typography shuku-edit-id="e-54fe3da7-56e2-4065-a02f-6a7359bd5c89" variant="bodySmall" tone="inherit">风暴抵达 {Math.max(0,Math.floor((180-game.elapsed)/60))}:{String(Math.floor((180-game.elapsed)%60)).padStart(2,'0')}</Typography></div><div shuku-edit-id="e-2e2c2371-43de-4e45-ab2f-19749fd4d68f" className="gd-context"><Button disabled={game.energy<28||game.elapsed-game.pulseAt<3.2} onClick={pulse}>震荡 Q · 28 以太</Button>{loot&&game.phase==='playing'&&<Button variant="primary" onClick={search} disabled={!!game.search}>{game.search?`搜索中 ${Math.min(100,Math.floor(game.search.progress*100))}%`:'搜索 F'}</Button>}</div></>}
      <div shuku-edit-id="e-66229025-e18d-40fd-b560-60ac8d03bbdb" className="gd-command"><div shuku-edit-id="e-0d145f1c-de09-4b2c-83c5-a0c6a14d6e7c" className="gd-command-message" aria-live="polite"><i shuku-edit-id="e-63c0c5f3-555e-46b6-9922-dca0aaa6b65b" className={power>.82?'gd-dot--warning':''}/><Typography shuku-edit-id="e-999aea0a-0cf9-45eb-be00-add34f950bd0" variant="bodySmall" tone="inherit">{message}</Typography></div><div shuku-edit-id="e-2b1a44f9-8e1b-42a3-9767-737594560237" className="gd-actions"><Button className="gd-tool" disabled={!equipped || game.phase !== 'playing'} active={game.scan} onClick={scan} explain={equipped ? 'E：消耗 12 以太，扫描 4 秒' : '找到金色补给箱，获得扫描器'}><Icon name="scan"/>{equipped ? game.scan ? '关闭扫描' : '扫描 4 秒' : '扫描器未取得'}</Button><Button variant="primary" className="gd-rescue-button" disabled={!canRescue(game)} onClick={rescue}><Icon name="rescue"/>撤离 R</Button></div></div>
    </div>
    <div shuku-edit-id="e-97d11b7a-c8b4-4c95-9ea9-65b12af9bbfa" className="gd-footer"><Typography shuku-edit-id="e-727e5efc-1f69-4b15-8f70-5549dd81875f" variant="bodySmall" tone="muted">拖拽闪现 · 右键 / Q 震荡 · F 搜索 · E 扫描 · 滚轮缩放</Typography><div shuku-edit-id="e-4dcacf27-f5cb-4042-b6b3-fd74f1635494"><Typography shuku-edit-id="e-be28e1f1-d204-4d79-9207-dbd8f9f2f0a4" variant="bodySmall" tone="muted">守卫蓄能时避开弹道</Typography><Button className="gd-footer-tool" aria-label={sound ? '关闭游戏声音' : '开启游戏声音'} onClick={async () => setSound(await audioRef.current?.toggle() ?? false)}><Icon name="sound"/>{sound ? '声音开' : '声音关'}</Button><Button className="gd-footer-tool" aria-label="重新开始行动" disabled={game.phase === 'rescuing'} onClick={() => game.moves.length && game.phase === 'playing' ? setRestartPrompt(true) : restart()}><Icon name="reset"/></Button></div></div>
  </section>;
}


