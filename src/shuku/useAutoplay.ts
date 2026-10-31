import {useContext, useEffect, useRef, useState} from 'react';
import {NarrationContext,fetchNarration} from './narrationBridge';
import type {CreatorPage} from '../creator/model';
type AudioEntry={controller:AbortController;promise:Promise<HTMLAudioElement>;audio?:HTMLAudioElement;url?:string};

export function useAutoplay(pages:CreatorPage[], pageId:string, courseId:string, enabled:boolean) {
 const requestNarration=useContext(NarrationContext)||fetchNarration;
 const [state,setState]=useState<'idle'|'loading'|'playing'|'paused'|'waiting'>('idle');
 const [provider,setProvider]=useState<'minimax'|'browser'>('minimax');
 const [rate,setRate]=useState(1.1),[voiceId,setVoiceId]=useState('Chinese (Mandarin)_Warm_Bestie'),[browserVoice,setBrowserVoice]=useState('');
 const [error,setError]=useState('');
 const [showSubtitles,setShowSubtitles]=useState(false);
 const [caption,setCaption]=useState<{pageId:string;text:string}|null>(null);
 const session=useRef(0), active=useRef(false), paused=useRef(false);
 const media=useRef<HTMLAudioElement|null>(null), utterance=useRef<SpeechSynthesisUtterance|null>(null);
 const prepared=useRef(new Map<string,AudioEntry>());
 const latest=useRef({pages,pageId}); latest.current={pages,pageId};
 function clear() {
  if(media.current){media.current.onended=null;media.current.onerror=null;media.current.ontimeupdate=null;media.current.pause();media.current=null;}
  if(utterance.current){utterance.current.onend=null;utterance.current.onerror=null;utterance.current.onboundary=null;window.speechSynthesis?.cancel();utterance.current=null;}
  setCaption(null);
 }
 function keyFor(page:CreatorPage){return JSON.stringify([page.id,String(page.outline?.snippet||'').trim(),rate,voiceId]);}
 function releaseEntry(key:string,entry:AudioEntry){
  entry.controller.abort();
  if(entry.audio){entry.audio.onended=null;entry.audio.onerror=null;entry.audio.oncanplaythrough=null;entry.audio.pause();entry.audio.removeAttribute('src');entry.audio.load();}
  if(entry.url)URL.revokeObjectURL(entry.url);
  if(prepared.current.get(key)===entry)prepared.current.delete(key);
 }
 function retain(keys:Set<string>){for(const [key,entry] of prepared.current)if(!keys.has(key))releaseEntry(key,entry);}
 function loadAudio(page:CreatorPage):Promise<HTMLAudioElement>{
  const key=keyFor(page),existing=prepared.current.get(key);if(existing)return existing.promise;
  const controller=new AbortController();
  const entry:AudioEntry={controller,promise:Promise.resolve(null as unknown as HTMLAudioElement)};
  prepared.current.set(key,entry);
  entry.promise=(async()=>{
   const blob=await requestNarration(String(page.outline!.snippet).trim(),controller.signal,{rate,...(voiceId?{voiceId}:{})});
   if(controller.signal.aborted)throw new DOMException('已取消预载','AbortError');
   entry.url=URL.createObjectURL(blob);const audio=new Audio();entry.audio=audio;audio.preload='auto';
   await new Promise<void>((resolve,reject)=>{
    const cleanup=()=>{clearTimeout(timer);audio.oncanplaythrough=null;audio.onerror=null;controller.signal.removeEventListener('abort',cancel);};
    const finish=(error?:Error)=>{cleanup();if(error)reject(error);else resolve();};
    const cancel=()=>finish(new DOMException('已取消预载','AbortError'));
    const timer=setTimeout(()=>finish(new Error('音频预载超时，请重试。')),20000);
    audio.oncanplaythrough=()=>finish();audio.onerror=()=>finish(new Error('音频解码失败，请重试。'));
    controller.signal.addEventListener('abort',cancel,{once:true});audio.src=entry.url!;audio.load();
    if(audio.readyState>=4)finish();
   });
   return audio;
  })().catch(error=>{releaseEntry(key,entry);throw error;});
  return entry.promise;
 }
 function nextPage(id:string){const all=latest.current.pages,index=all.findIndex(page=>page.id===id);return index<0?undefined:all.slice(index+1).find(page=>typeof page.outline?.snippet==='string'&&page.outline.snippet.trim());}
 function preloadNext(id:string){
  if(provider!=='minimax'||!active.current)return;
  const next=nextPage(id);if(next)void loadAudio(next).catch(()=>{/* Retry when this page becomes current; keep current audio playing. */});
 }
 function stop(){session.current++;active.current=false;paused.current=false;clear();retain(new Set());setState('idle');}
 function fail(message:string){stop();setError(message);}
 async function play(id:string,token:number){
  if(token!==session.current)return;
  clear();setState(paused.current?'paused':'loading');
  const all=latest.current.pages, start=all.findIndex(p=>p.id===id);
  if(start<0||typeof all[start].outline?.snippet!=='string'||!String(all[start].outline?.snippet).trim()){fail('本页暂无 snippet 讲稿。');return;}
  const page=all[start],text=String(page.outline!.snippet).trim();
  // Only punctuation ends a cue; never cut a sentence at a character limit or a line break.
  const cues=Array.from(text.matchAll(/[\s\S]+?(?:[，,。！？!?；;：:…]+[”’」』）)\]】]*|\.(?!\d)[”’」』）)\]】]*|$)/gu),match=>({start:match.index!,end:match.index!+match[0].length,text:match[0].trim()})).filter(cue=>cue.text);
  const updateCaption=(charIndex:number)=>{
   if(token!==session.current)return;
   const cue=cues.find(cue=>charIndex<cue.end)||cues[cues.length-1];
   if(cue)setCaption(current=>current?.pageId===page.id&&current.text===cue.text?current:{pageId:page.id,text:cue.text});
  };
  const next=nextPage(page.id);
  retain(new Set([keyFor(page),...(next?[keyFor(next)]:[])]));
  playingId.current=page.id;
  const ended=()=>{
   if(token!==session.current)return;
   // Keep the session and preloaded audio ready for manual navigation.
   clear();paused.current=false;setState('waiting');
  };
  try{
   if(provider==='browser'){
    if(!window.speechSynthesis)throw new Error('当前浏览器不支持朗读，请选择 MiniMax。');
    const speech=new SpeechSynthesisUtterance(text);utterance.current=speech;speech.lang='zh-CN';speech.rate=rate;
    updateCaption(0);speech.onboundary=event=>updateCaption(event.charIndex);
    speech.voice=window.speechSynthesis.getVoices().find(v=>v.voiceURI===browserVoice)||window.speechSynthesis.getVoices().find(v=>/^zh/i.test(v.lang))||null;
    speech.onend=ended;speech.onerror=()=>{if(token===session.current)fail('浏览器朗读失败，请重新播放。');};
    if(!paused.current)window.speechSynthesis.resume();window.speechSynthesis.speak(speech);if(paused.current)window.speechSynthesis.pause();setState(paused.current?'paused':'playing');
   }else{
    const audio=await loadAudio(page);if(token!==session.current)return;
    media.current=audio;audio.currentTime=0;
    // The audio endpoint has no word timestamps; estimate sentence positions from playback progress.
    updateCaption(0);audio.ontimeupdate=()=>{if(Number.isFinite(audio.duration)&&audio.duration>0)updateCaption(Math.min(text.length-1,Math.floor(audio.currentTime/audio.duration*text.length)));};
    audio.onended=ended;audio.onerror=()=>{if(token===session.current)fail('音频播放失败，请重试。');};
    if(!paused.current){await audio.play();if(token===session.current&&!paused.current)setState('playing');}
    if(token===session.current)preloadNext(page.id);
   }
  }catch(e){if(token===session.current&&!(paused.current&&(e as Error).name==='AbortError'))fail((e as Error).message);}
 }
 function toggle(){
  setError('');
  if(!active.current||state==='waiting'){
   active.current=true;paused.current=false;void play(pageId,++session.current);
  }else if(paused.current){
   paused.current=false;const token=session.current;
   if(utterance.current)window.speechSynthesis?.resume();
   if(media.current)void media.current.play().then(()=>{if(token===session.current&&active.current&&!paused.current)setState('playing');}).catch(()=>{if(token===session.current&&active.current&&!paused.current)fail('无法继续播放，请重新开始。');});
   setState(media.current||utterance.current?'playing':'loading');
  }else{paused.current=true;media.current?.pause();if(utterance.current)window.speechSynthesis?.pause();setState('paused');}
 }
 // Manual navigation starts the selected page from its beginning, including while paused.
 const playingId=useRef(pageId);
 useEffect(()=>{if(playingId.current!==pageId){playingId.current=pageId;if(active.current)void play(pageId,++session.current);}},[pageId]);
 useEffect(()=>{stop();setError('');},[courseId,provider,rate,voiceId,browserVoice,enabled]);
 useEffect(()=>()=>{session.current++;active.current=false;clear();retain(new Set());},[]);
 const subtitle=enabled&&caption?.pageId===pageId&&(state==='playing'||state==='paused')?caption.text:'';
 return {state,error,provider,setProvider,rate,setRate,voiceId,setVoiceId,browserVoice,setBrowserVoice,showSubtitles,setShowSubtitles,subtitle,toggle,stop};
}
