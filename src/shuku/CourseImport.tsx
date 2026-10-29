import {useEffect,useRef,useState} from 'react';
import {api} from './client';

type Candidate={key:string;title:string;description:string;category:string;page_count:number;planned_pages:number;file_count:number;asset_bytes:number};
type ImportTask={id:string;state:string;cleanup_state?:string;cleanup_error?:string;phase:string;error_code?:string;course_id?:string;revision_id?:string;expires_at:number;progress:{stage?:string;files_read?:number;file_count?:number};candidates:Candidate[];source?:{commit?:string}};
const stages:Record<string,string>={'storing-assets':'正在保存课程源码和素材','reading-source':'正在读取固定版本的课程文件','validating-package':'正在检查 ZIP','inspecting-pages':'正在检查课程页面','awaiting-confirmation':'文件检查完成，请确认课程信息','waiting-for-preview-and-repository':'正在准备课程预览和私有仓库','initializing-private-repository':'正在同步真实课程源码到私有仓库','ready':'课程草稿已准备完成'};
const errors:Record<string,string>={GITHUB_SOURCE_RATE_LIMIT:'GitHub 公开接口额度已用完，请稍后重试当前任务。',GITHUB_SOURCE_TIMEOUT:'读取 GitHub 超时，请检查服务器网络后重试。',GITHUB_SOURCE_UNAVAILABLE:'无法读取公开源仓库，请检查链接、权限或 GitHub 访问额度。',COURSE_MANIFEST_MISSING:'没有找到标准课程的 outlines.json。',SOURCE_BUILD_FAILED:'课程预览构建失败，请检查入口、语法和固定依赖。',REMOTE_CHANGED:'私有仓库发生独立修改，已保留远程内容，请联系管理员处理。',IMPORT_DEPENDENCY_FAILED:'预览或私有仓库创建失败，可以重试。',HANDLER_FAILED:'文件解析失败，请检查标准课程格式，或联系管理员查看任务。'};

export function CourseImport({onBack}:{onBack:()=>void}){
 const requestKey=useRef(crypto.randomUUID());
 const [type,setType]=useState<'github'|'zip'>('github'),[url,setUrl]=useState(''),[file,setFile]=useState<File|null>(null);
 const [id,setId]=useState(()=>new URLSearchParams(location.search).get('import')||''),[task,setTask]=useState<ImportTask|null>(null),[recent,setRecent]=useState<ImportTask[]>([]);
 const [selection,setSelection]=useState(''),[title,setTitle]=useState(''),[description,setDescription]=useState(''),[category,setCategory]=useState(''),[rights,setRights]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{if(!id)void api<{imports:ImportTask[]}>('/course-imports').then(r=>setRecent(r.imports)).catch(e=>setError(e.message));},[id]);
 useEffect(()=>{if(!id)return;let active=true;const load=()=>api<ImportTask>('/course-imports/'+id).then(r=>{if(active)setTask(r);}).catch(e=>{if(active)setError(e.message);});void load();const timer=setInterval(()=>void load(),2000);return()=>{active=false;clearInterval(timer);};},[id]);
 useEffect(()=>{const item=task?.candidates.find(c=>c.key===selection)||task?.candidates[0];if(item&&item.key!==selection){choose(item);}},[task?.candidates,selection]);
 function choose(item:Candidate){setSelection(item.key);setTitle(item.title);setDescription(item.description);setCategory(item.category);}
 function open(value:string){setTask(null);setSelection('');setRights(false);setId(value);const query=new URLSearchParams(location.search);query.set('import',value);history.replaceState(null,'','/my-courses?'+query);}
 async function run(action:()=>Promise<unknown>){setBusy(true);setError('');try{await action();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 async function start(){
  const key=requestKey.current;
  if(type==='github'){const result=await api<{id:string}>('/course-imports',{type,url},{'Idempotency-Key':key});open(result.id);}
  else{
   if(!file||!file.size||file.size>100*1024*1024||!file.name.toLowerCase().endsWith('.zip'))throw Error('请选择 100 MiB 以内的 ZIP。');
   const response=await fetch('/api/shuku/course-imports/zip',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/zip','Idempotency-Key':key},body:file});
   const result=await response.json();if(!response.ok)throw Error(result.error||'上传失败，请重试。');open(result.id);
  }
 }
 const candidate=task?.candidates.find(c=>c.key===selection);
 const inspected=task?.state==='succeeded'&&task.phase==='inspecting';
 const ready=task?.state==='succeeded'&&task.phase==='initializing';
 return <div className="shuku-course-import"><button className="shuku-secondary" type="button" onClick={onBack}>返回创作方式</button><h2>导入已有课程</h2><p>从公开 GitHub 链接或 ZIP 创建可编辑的私有课程草稿。支持标准 React 课程及固定运行依赖；导入后仍需审核才能正式发布。</p>
 {!id?<><form onSubmit={e=>{e.preventDefault();void run(start);}}><fieldset className="la-methods"><legend>课程来源</legend><label><input type="radio" name="importSource" checked={type==='github'} onChange={()=>{requestKey.current=crypto.randomUUID();setType('github');}}/>GitHub 链接</label><label><input type="radio" name="importSource" checked={type==='zip'} onChange={()=>{requestKey.current=crypto.randomUUID();setType('zip');}}/>课程 ZIP</label></fieldset>{type==='github'?<label>公开仓库或课程目录链接<input type="url" required value={url} onChange={e=>{requestKey.current=crypto.randomUUID();setUrl(e.target.value);}} placeholder="https://github.com/组织/仓库/tree/分支/modules/课程"/></label>:<label>课程 ZIP（最大 100 MiB）<input type="file" accept=".zip,application/zip" required onChange={e=>{requestKey.current=crypto.randomUUID();setFile(e.target.files?.[0]||null);}}/></label>}<p>课程需包含 outlines.json、自学入口、教学 deck 和所需素材。不会执行压缩包中的安装或构建脚本。</p><button className="shuku-primary" disabled={busy}>{busy?'正在上传…':'检查课程文件'}</button></form>{recent.length>0&&<details><summary>最近的导入任务</summary>{recent.map(item=><p key={item.id}><button className="shuku-secondary" onClick={()=>open(item.id)}>{item.candidates[0]?.title||'课程导入'} · {item.state==='failed'?'失败':item.state==='succeeded'?(item.phase==='initializing'?'课程已就绪':'已完成检查'):({queued:'排队中',running:'处理中',expired:'已过期',cancelled:'已取消',removed:'已删除'}[item.state]||'处理中')}</button></p>)}</details>}</>:<>
 <p role="status">{ready?'课程草稿已就绪':task?.state==='failed'?'导入未完成':task?.state==='cancelled'?'导入已取消':task?.state==='expired'?'检查结果已过期':task?.state==='removed'?'课程已删除':stages[task?.progress.stage||'']||'正在排队检查…'}{task?.progress.file_count?`（${task.progress.files_read||0}/${task.progress.file_count} 文件）`:''}</p>
 {task?.source?.commit&&<p><small>固定源提交：{task.source.commit.slice(0,12)}</small></p>}
 {inspected&&<form onSubmit={e=>{e.preventDefault();void run(async()=>{await api('/course-imports/'+id+'/confirm',{selection,title,description,category});setTask(await api<ImportTask>('/course-imports/'+id));});}}><label>要导入的课程<select value={selection} onChange={e=>choose(task.candidates.find(c=>c.key===e.target.value)!)}>{task.candidates.map(c=><option key={c.key} value={c.key}>{c.title} · {c.key}</option>)}</select></label>{candidate&&<p>{candidate.page_count} 个已实现页面 · {candidate.file_count} 个课程文件 · 素材 {(candidate.asset_bytes/1024/1024).toFixed(1)} MiB{candidate.planned_pages?`；${candidate.planned_pages} 个尚未实现的大纲页面未导入。`:'。'}</p>}<label>课程名称<input required maxLength={120} value={title} onChange={e=>setTitle(e.target.value)}/></label><label>课程简介<textarea rows={3} maxLength={3000} value={description} onChange={e=>setDescription(e.target.value)}/></label><label>课程类别<input required maxLength={80} value={category} onChange={e=>setCategory(e.target.value)}/></label><label className="shuku-import-rights"><input type="checkbox" required checked={rights} onChange={e=>setRights(e.target.checked)}/>我有权使用并修改这些课程文件；原许可证和来源将保留。</label><p>确认后将创建独立课程和 reduct-shuku 下的私有仓库。检查结果保留 24 小时。</p><button className="shuku-primary" disabled={busy||!rights}>确认并创建私有课程</button></form>}
 {task?.cleanup_state==='failed'&&<p role="alert">课程导入已停止，文件清理尚未完成。<button type="button" disabled={busy} className="shuku-secondary" onClick={()=>void run(async()=>{await api('/course-imports/'+id+'/retry',{});setTask(await api<ImportTask>('/course-imports/'+id));})}>重试文件清理</button></p>}
 {task?.error_code&&task.state==='failed'&&<p role="alert">{errors[task.error_code]||'导入失败，请检查课程包后重试。'} <small>错误代码：{task.error_code}</small></p>}
 {task?.state==='failed'&&<button className="shuku-secondary" disabled={busy} onClick={()=>void run(async()=>{await api('/course-imports/'+id+'/retry',{});setTask(await api<ImportTask>('/course-imports/'+id));})}>重试当前任务</button>}
 {ready&&task.course_id&&<a className="shuku-primary" href={'/my-courses/editor?course='+task.course_id}>预览并继续创作</a>}
 {task?.course_id&&<p><a href="/my-courses">到我的课程查看、编辑或删除草稿</a></p>}
 {task&&!task.course_id&&!['cancelled','expired','removed'].includes(task.state)&&<button type="button" className="shuku-secondary" disabled={busy} onClick={()=>void run(async()=>{await api('/course-imports/'+id+'/cancel',{});setTask(await api<ImportTask>('/course-imports/'+id));})}>取消导入并清理文件</button>}
 <p><button type="button" className="shuku-secondary" onClick={()=>{requestKey.current=crypto.randomUUID();setId('');setTask(null);setSelection('');const query=new URLSearchParams(location.search);query.delete('import');history.replaceState(null,'','/my-courses?'+query);}}>开始另一项导入</button></p>
 </>}{error&&<p role="alert" className="shuku-error">{error}</p>}</div>;
}
