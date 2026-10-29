import {useEffect,useRef,useState} from 'react';
import type {useAutoplay} from './useAutoplay';
import './NarrationControls.css';

export function NarrationControls({player}:{player:ReturnType<typeof useAutoplay>}){
 const menu=useRef<HTMLDetailsElement>(null);
 const [voices,setVoices]=useState<SpeechSynthesisVoice[]>([]);
 useEffect(()=>{
  const update=()=>setVoices(window.speechSynthesis?.getVoices()||[]);update();
  window.speechSynthesis?.addEventListener('voiceschanged',update);
  const close=(event:MouseEvent)=>{if(menu.current&&!menu.current.parentElement?.contains(event.target as Node))menu.current.open=false;};
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'&&menu.current?.open){event.stopPropagation();menu.current.open=false;}};
  document.addEventListener('click',close);document.addEventListener('keydown',escape,true);
  return()=>{window.speechSynthesis?.removeEventListener('voiceschanged',update);document.removeEventListener('click',close);document.removeEventListener('keydown',escape,true);};
 },[]);
 const active=player.state!=='idle',paused=player.state==='paused';
 return <div className="cw-smart-narration" aria-label="智能讲稿控制">
  <div className="cw-smart-buttons"><button className="cw-smart-start" onClick={player.toggle} title="按讲稿朗读，读完自动翻页"><span aria-hidden="true">{active&&!paused?'Ⅱ':'▶'}</span>{!active?'智能讲稿':paused?'继续讲解':'暂停讲解'}</button><details ref={menu} className="cw-smart-menu"><summary aria-label="讲稿设置" title="音色、语速与自动翻页">⌄</summary><div className="cw-smart-settings">
   <strong>智能讲稿设置</strong><p>按每页讲稿朗读，让课程自己讲下去。</p>
   <label>朗读方式<select aria-label="朗读方式" value={player.provider} onChange={e=>player.setProvider(e.target.value as 'minimax'|'browser')}><option value="minimax">MiniMax 配音</option><option value="browser">浏览器朗读</option></select></label>
   {player.provider==='minimax'?<label>音色<select aria-label="音色" value={player.voiceId} onChange={e=>player.setVoiceId(e.target.value)}><option value="">默认音色（配置文件）</option><option value="Chinese (Mandarin)_IntellectualGirl">知性女声</option><option value="Chinese (Mandarin)_Reliable_Executive">沉稳男声</option><option value="Chinese (Mandarin)_Warm_Bestie">温暖闺蜜</option><option value="Chinese (Mandarin)_News_Anchor">新闻女声</option><option value="Chinese (Mandarin)_Male_Announcer">男播音员</option></select></label>:<label>音色<select aria-label="音色" value={player.browserVoice} onChange={e=>player.setBrowserVoice(e.target.value)}><option value="">系统默认中文音色</option>{voices.map(v=><option key={v.voiceURI} value={v.voiceURI}>{v.name} · {v.lang}</option>)}</select></label>}
   <label>语速<select aria-label="语速" value={player.rate} onChange={e=>player.setRate(Number(e.target.value))}>{[.8,.9,1,1.1,1.2].map(rate=><option key={rate} value={rate}>{rate===1?'1.0':rate}×{rate===1?' · 标准':''}</option>)}</select></label>
   <label className="cw-smart-advance"><span>读完自动翻页<small>关闭后只朗读当前页</small></span><input type="checkbox" checked={player.autoAdvance} onChange={e=>player.setAutoAdvance(e.target.checked)}/></label>
   {active&&<button className="cw-smart-stop" onClick={player.stop}>停止讲解</button>}<small>更换音色或语速后，点击按钮重新讲解。</small>
  </div></details></div>
  {active&&<button className="cw-smart-stop-icon" aria-label="停止讲解" title="停止讲解" onClick={player.stop}>■</button>}
  <span className="cw-smart-state" role="status">{player.state==='loading'?'准备配音…':paused?'已暂停':player.state==='playing'?'正在讲解':''}</span>
  {player.error&&<div className="cw-smart-error" role="alert">{player.error}</div>}
 </div>;
}
