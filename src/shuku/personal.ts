import {useCallback,useEffect,useRef,useState} from 'react';
import {api,ApiError} from './client';
import {isGuestMode,requestSignIn} from './guest';
import {isLocalPreview} from '../app/runtimeMode';
export interface StudyPosition {page_id:string;mode:'guide'|'ppt';completed:string[]}
export interface StudyContext {resource:string;title:string;version:string;version_label:string;pages:string[];page_details?:{id:string;title:string;thumbnail?:string|null}[];url:string|null;available:boolean;sandboxed?:boolean;course_id?:string;revision_id?:string}
export interface StudyRecord extends StudyContext,StudyPosition {updated_at:number;page_count:number}
export interface PublishedCourse {id:string;title:string;description:string;category:string;version:string;revision_id:string}
export interface PersonalData {favorite_courses:PublishedCourse[];account_id:string;favorites:string[];history:StudyRecord[];next_cursor:string|null}
export function studyHref(record:StudyRecord){return record.url+(record.url?.includes('?')?'&':'?')+'resume=1';}
export function usePersonal(){
 const [data,setData]=useState<PersonalData>({favorite_courses:[],account_id:'',favorites:[],history:[],next_cursor:null}),[error,setError]=useState(''),[authenticated,setAuthenticated]=useState(false),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true);
 useEffect(()=>{if(isLocalPreview||isGuestMode()){setLoading(false);return;}let active=true;api<PersonalData>('/personal').then(d=>{if(active){setData(d);setAuthenticated(true);}}).catch(e=>{if(active&&(!(e instanceof ApiError)||e.status!==401))setError(e.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;};},[]);
 async function favorite(resource:string){if(!authenticated){if(isLocalPreview||isGuestMode()){requestSignIn();return;}location.assign('/my-courses?next='+encodeURIComponent(location.pathname+location.search));return;}if(busy)return;setBusy(true);setError('');const saved=!data.favorites.includes(resource);try{await api('/personal/favorites',{resource,saved},{'X-Shuku-Account':data.account_id});setData(d=>({...d,favorites:saved?[...d.favorites,resource]:d.favorites.filter(k=>k!==resource)}));}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 async function more(){if(!data.next_cursor||busy)return;setBusy(true);try{const result=await api<PersonalData>('/personal?cursor='+encodeURIComponent(data.next_cursor));setData(d=>({...result,history:[...d.history,...result.history.filter(r=>!d.history.some(old=>old.resource===r.resource))]}));}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return {data,error,authenticated,busy:busy||loading,favorite,more};
}
export function useStudy(resource:string,version:string,resume:boolean,requestedMode:'guide'|'ppt'='guide',requestedPage?:string,localContext?:StudyContext){
 const [context,setContext]=useState<StudyContext|null>(null),[initial,setInitial]=useState<StudyPosition|null>(null),[error,setError]=useState(''),[status,setStatus]=useState(''),[guest,setGuest]=useState(false);
 const [failure,setFailure]=useState<unknown>(null);
 const writer=useRef<{account:string;counter:number;pending:StudyPosition|null;busy:boolean;stopped:boolean;timer?:ReturnType<typeof setTimeout>}>({account:'',counter:0,pending:null,busy:false,stopped:true});
 useEffect(()=>{
  if(!resource)return;
  setError('');setFailure(null);setContext(null);setInitial(null);setGuest(false);
  const w={account:'',counter:0,pending:null as StudyPosition|null,busy:false,stopped:false,timer:undefined as ReturnType<typeof setTimeout>|undefined};writer.current=w;let active=true;
  if(isLocalPreview){
   w.stopped=true;setGuest(true);
   if(!localContext?.pages.length){setError('未找到本地课件。');return;}
   setContext(localContext);setInitial({page_id:requestedPage&&localContext.pages.includes(requestedPage)?requestedPage:localContext.pages[0],mode:requestedMode,completed:[]});
   return()=>{active=false;w.stopped=true;};
  }
  async function load(){try{
   let c:StudyContext,s:StudyPosition|null=null;
   if(isGuestMode()){c=await api<StudyContext>('/public/study/'+encodeURIComponent(resource)+'/'+encodeURIComponent(version));w.stopped=true;if(active)setGuest(true);}
   else {
   try{const result=await api<{account_id:string;context:StudyContext;state:(StudyPosition&{state_version:number})|null}>('/personal/study/'+encodeURIComponent(resource)+'/'+encodeURIComponent(version));c=result.context;s=result.state;w.account=result.account_id;w.counter=result.state?.state_version||0;}
   catch(e){if(!(e instanceof ApiError)||e.status!==401)throw e;c=await api<StudyContext>('/public/study/'+encodeURIComponent(resource)+'/'+encodeURIComponent(version));w.stopped=true;if(active)setGuest(true);}
   }
   if(resume&&s&&!c.pages.includes(s.page_id))throw Error('上次学习的页面已移除，请从课程首页重新开始。');
   if(active){setContext(c);setInitial({page_id:resume&&s?s.page_id:requestedPage&&c.pages.includes(requestedPage)?requestedPage:c.pages[0],mode:resume&&s?s.mode:requestedMode,completed:s?.completed.filter(p=>c.pages.includes(p))||[]});}
  }catch(e){if(active){setFailure(e);setError((e as Error).message);}}}
  void load();return()=>{active=false;w.stopped=true;clearTimeout(w.timer);};
 },[resource,version,resume,requestedMode,requestedPage,localContext]);
 const flush=useCallback(async()=>{
  const w=writer.current;if(w.stopped||w.busy||!w.pending)return;const position=w.pending;w.pending=null;w.busy=true;setStatus('正在保存…');
  try{const result=await api<{state_version:number}>('/personal/study',{resource,version,...position,expected_version:w.counter},{'X-Shuku-Account':w.account});w.counter=result.state_version;if(!w.stopped)setStatus('已保存');}
  catch(e){w.stopped=true;setStatus('');setError((e as Error).message+' 刷新页面后可继续。');}finally{w.busy=false;if(!w.stopped&&w.pending)w.timer=setTimeout(()=>void flush(),100);}
 },[resource,version]);
 const progress=useCallback((position:StudyPosition)=>{const w=writer.current;if(w.stopped)return;w.pending=position;clearTimeout(w.timer);w.timer=setTimeout(()=>void flush(),350);},[flush]);
 // Flush when a tab is backgrounded or navigated away. CAS prevents stale-device overwrites.
 useEffect(()=>{const save=()=>{const w=writer.current;if(w.stopped||w.busy||!w.pending)return;const position=w.pending;w.pending=null;clearTimeout(w.timer);w.busy=true;void fetch('/api/shuku/personal/study',{method:'POST',credentials:'same-origin',keepalive:true,headers:{'Content-Type':'application/json','X-Shuku-Account':w.account},body:JSON.stringify({resource,version,...position,expected_version:w.counter})}).then(async r=>{if(!r.ok)throw Error('保存未完成，请刷新页面。');w.counter=(await r.json()).state_version;}).catch(e=>{w.stopped=true;setError(e.message);}).finally(()=>{w.busy=false;if(!w.stopped&&w.pending)void flush();});};const hide=()=>{if(document.hidden)save();};document.addEventListener('visibilitychange',hide);window.addEventListener('pagehide',save);return()=>{document.removeEventListener('visibilitychange',hide);window.removeEventListener('pagehide',save);};},[resource,version,flush]);
 return {context,initial,error,failure,status,guest,progress,account:writer.current.account||'guest'};
}
