import {useState,type ReactNode} from 'react';
import type {CreatorProject} from '../creator/model';
import './SourceEditor.css';

export const firstSource=`import React, {useState} from 'react';
import './lesson.css';

export default function Lesson() {
  const [count, setCount] = useState(0);
  return <section className="lesson">
    <h1>从一个问题开始</h1>
    <p>在这里编写课程内容和互动。</p>
    <button onClick={() => setCount(count + 1)}>试一试：{count}</button>
  </section>;
}
`;
export function blankSource(courseId:string,title:string):CreatorProject {
 return {version:1,id:crypto.randomUUID(),courseId,title,duration:30,style:'简洁教学',outlineConfirmed:true,
  source:{files:{'Lesson.tsx':firstSource,'lesson.css':'.lesson { padding: 100px; color: #17304f; font: 28px sans-serif; }\n.lesson button { padding: 16px 28px; cursor: pointer; }'}},
  pages:[{id:crypto.randomUUID(),format:'react',sourceEntry:'Lesson.tsx',title:'第一课',goal:'',summary:'',note:'',designed:true,ready:true,revisions:[],messages:[]}]};
}
export function SourceEditor({project,onChange,actions,status,previewUrl,buildError}:{project:CreatorProject;onChange:(p:CreatorProject)=>void;actions:ReactNode;status:string;previewUrl?:string;buildError?:string}){
 const [file,setFile]=useState(Object.keys(project.source?.files||{})[0]||''),[pageId,setPageId]=useState(project.pages[0].id),[name,setName]=useState(''),[error,setError]=useState('');
 const files=project.source?.files||{},page=project.pages.find(p=>p.id===pageId)||project.pages[0];
 function patchFiles(next:Record<string,string>){onChange({...project,source:{files:next}});}
 function addFile(){if(!/^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*\.(tsx|ts|jsx|js|css|json|svg)$/.test(name)||Object.keys(files).some(n=>n.toLowerCase()===name.toLowerCase())){setError('请填写未使用的相对文件路径，例如 pages/Lesson.tsx。');return;}patchFiles({...files,[name]:name.endsWith('tsx')?'import React from "react";\nexport default function Lesson(){return <h1>新的一课</h1>;}\n':''});setFile(name);setName('');setError('');}
 function removeFile(){if(project.pages.some(p=>p.sourceEntry===file)){setError('请先更换使用这个文件的页面入口。');return;}const next={...files};delete next[file];patchFiles(next);setFile(Object.keys(next)[0]||'');}
 function changePage(patch:Partial<typeof page>){onChange({...project,pages:project.pages.map(p=>p.id===page.id?{...p,...patch}:p)});}
 return <div className="shuku-source-editor"><header><strong>{project.title}</strong><span role="status">{status}</span><nav>{actions}</nav></header><div className="shuku-source-settings"><label>课程名称<input value={project.title} maxLength={120} onChange={e=>onChange({...project,title:e.target.value})}/></label><label>页面<select aria-label="源码课程页面" value={page.id} onChange={e=>setPageId(e.target.value)}>{project.pages.map((p,i)=><option key={p.id} value={p.id}>{i+1}. {p.title}</option>)}</select></label><label>标题<input value={page.title} onChange={e=>changePage({title:e.target.value})}/></label><label>组件入口<select aria-label="组件入口" value={page.sourceEntry||''} onChange={e=>changePage({format:'react',sourceEntry:e.target.value,nativeId:undefined,ready:true})}><option value="" disabled>选择默认导出的组件</option>{Object.keys(files).filter(n=>/\.[jt]sx?$/.test(n)).map(n=><option key={n}>{n}</option>)}</select></label><button disabled={project.pages.length>=100} onClick={()=>{const p={...page,id:crypto.randomUUID(),title:'新的一课',messages:[],revisions:[]};onChange({...project,pages:[...project.pages,p]});setPageId(p.id);}}>添加页面</button>{project.pages.length>1&&<button onClick={()=>{onChange({...project,pages:project.pages.filter(p=>p.id!==page.id)});setPageId(project.pages.find(p=>p.id!==page.id)!.id);}}>删除页面</button>}</div>{error&&<p role="alert">{error}</p>}{buildError&&<pre role="alert" className="shuku-source-error">{buildError}</pre>}<main><aside aria-label="课程源码文件">{Object.keys(files).map(n=><button key={n} className={n===file?'is-active':''} onClick={()=>setFile(n)}>{n}</button>)}<form onSubmit={e=>{e.preventDefault();addFile();}}><input aria-label="新文件路径" value={name} onChange={e=>setName(e.target.value)} placeholder="pages/Lesson.tsx"/><button>添加文件</button></form><button disabled={!file} onClick={removeFile}>删除当前文件</button></aside><section className="shuku-source-code"><label htmlFor="course-source-code">{file||'课程源码'}</label><textarea id="course-source-code" aria-label="源码编辑" value={files[file]||''} spellCheck={false} disabled={!file} onChange={e=>patchFiles({...files,[file]:e.target.value})}/></section><section className="shuku-source-preview" aria-label="已保存版本预览">{previewUrl?<iframe key={previewUrl} title="源码课程预览" src={previewUrl} sandbox="allow-scripts"/>:<p>保存修订后查看互动预览。</p>}</section></main></div>;
}
