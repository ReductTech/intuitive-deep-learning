import {useMemo} from 'react';
import {activeModules} from '../app/modules';
import {createProject} from '../creator/model';
import {RuntimePlayer} from './RuntimePlayer';
import {SiteHeader} from './SiteHeader';
import {useStudy} from './personal';
import {isLocalPreview} from '../app/runtimeMode';
import './shuku.css';
export function BuiltinLearning(){
 const params=new URLSearchParams(location.search),alias=params.get('module')||'';
 const module=activeModules.find(m=>m.id===alias&&m.pptDeck);
 const project=useMemo(()=>module?createProject(module):null,[module]);
 const localContext=useMemo(()=>isLocalPreview&&module&&project?{resource:'module:'+module.id,title:module.title,version:'builtin',version_label:'本地课件',pages:project.pages.map(page=>page.id),url:'/study?module='+encodeURIComponent(module.id),available:true}:undefined,[module,project]);
 const study=useStudy('module:'+alias,'builtin',params.get('resume')==='1',params.get('mode')==='ppt'?'ppt':'guide',params.get('page')||undefined,localContext);
 return <div className="sd-library shuku-management shuku-learning"><SiteHeader section="courses"/><main className="shuku-learn-body"><header><a href="/">探索课程</a>{study.guest?<a href={'/my-courses?next='+encodeURIComponent(location.pathname+location.search)}>登录后保存学习进度</a>:<span role="status">{study.status}</span>}</header>{study.error&&<p role="alert">{study.error}</p>}{module&&project&&study.initial?<RuntimePlayer project={project} deck={module.pptDeck} initialState={study.initial} onProgress={study.progress}/>:<p>{study.error?'':'正在打开课程…'}</p>}</main></div>;
}
