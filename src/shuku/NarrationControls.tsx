import {useEffect,useRef,useState} from 'react';
import type {useAutoplay} from './useAutoplay';
import './NarrationControls.css';

export function NarrationControls({player,compact=false}:{player:ReturnType<typeof useAutoplay>;compact?:boolean}){
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
 const active=player.state!=='idle',paused=player.state==='paused',waiting=player.state==='waiting';
 const label=waiting?'重新讲解':!active?'开始智能讲稿':paused?'继续讲解':'暂停讲解';
 return <div className={`cw-smart-narration${compact?' is-compact':''}`} aria-label="智能讲稿控制">
  <div className="cw-smart-buttons"><button className="cw-smart-start" onClick={player.toggle} aria-label={label} title={label}><svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">{active&&!paused&&!waiting?<path d="M7 5h4v14H7zM15 5h4v14h-4z"/>:<path d="M8 5.5a.8.8 0 0 1 1.2-.7l10 6.5a.8.8 0 0 1 0 1.4l-10 6.5a.8.8 0 0 1-1.2-.7z"/>}</svg><span className="cw-smart-label">{waiting?'重新讲解':!active?'智能讲稿':paused?'继续讲解':'暂停讲解'}</span></button><details ref={menu} className="cw-smart-menu"><summary aria-label="讲稿设置" title="音色与语速"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m8 10 4 4 4-4"/></svg></summary><div className="cw-smart-settings">
   <strong>智能讲稿设置</strong><p>按每页讲稿朗读，读完后手动翻页。</p>
   <label>朗读方式<select aria-label="朗读方式" value={player.provider} onChange={e=>player.setProvider(e.target.value as 'minimax'|'browser')}><option value="minimax">MiniMax 配音</option><option value="browser">浏览器朗读</option></select></label>
   {player.provider==='minimax'?<label>音色<select aria-label="音色" value={player.voiceId} onChange={e=>player.setVoiceId(e.target.value)}><option value="">默认音色（配置文件）</option><option value="Chinese (Mandarin)_IntellectualGirl">知性女声</option><option value="Chinese (Mandarin)_Reliable_Executive">沉稳男声</option><option value="Chinese (Mandarin)_Warm_Bestie">温暖闺蜜</option><option value="Chinese (Mandarin)_News_Anchor">新闻女声</option><option value="Chinese (Mandarin)_Male_Announcer">男播音员</option></select></label>:<label>音色<select aria-label="音色" value={player.browserVoice} onChange={e=>player.setBrowserVoice(e.target.value)}><option value="">系统默认中文音色</option>{voices.map(v=><option key={v.voiceURI} value={v.voiceURI}>{v.name} · {v.lang}</option>)}</select></label>}
   <label>语速<select aria-label="语速" value={player.rate} onChange={e=>player.setRate(Number(e.target.value))}>{[{label:'慢',rate:1},{label:'中',rate:1.1},{label:'快',rate:1.2}].map(({label,rate})=><option key={rate} value={rate}>{label} · {rate.toFixed(1)}×</option>)}</select></label>
   <label className="cw-smart-subtitles"><span>显示字幕</span><input type="checkbox" checked={player.showSubtitles} onChange={event=>player.setShowSubtitles(event.target.checked)}/></label>
   {active&&<button className="cw-smart-stop" onClick={player.stop}>停止讲解</button>}<small>更换音色或语速后，点击按钮重新讲解。</small>
  </div></details></div>
  <span className="cw-smart-state" role="status">{waiting?'本页讲解完毕，请手动翻页':player.state==='loading'?'准备配音…':paused?'已暂停':player.state==='playing'?'正在讲解':''}</span>
  {player.error&&<div className="cw-smart-error" role="alert">{player.error}</div>}
 </div>;
}
