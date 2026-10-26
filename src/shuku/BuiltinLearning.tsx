import {useMemo} from 'react';
import {activeModules} from '../app/modules';
import {createProject} from '../creator/model';
import {RuntimePlayer} from './RuntimePlayer';
import {useStudy} from './personal';
import {isLocalPreview} from '../app/runtimeMode';
import './shuku.css';
export function BuiltinLearning(){
 const params=new URLSearchParams(location.search),alias=params.get('module')||'';
 const module=activeModules.find(m=>m.id===alias&&m.pptDeck);
 const project=useMemo(()=>module?createProject(module):null,[module]);
 const localContext=useMemo(()=>isLocalPreview&&module&&project?{resource:'module:'+module.id,title:module.title,version:'builtin',version_label:'本地课件',pages:project.pages.map(page=>page.id),url:'/study?module='+encodeURIComponent(module.id),available:true}:undefined,[module,project]);
 const study=useStudy('module:'+alias,'builtin',params.get('resume')==='1',params.get('mode')==='ppt'?'ppt':'guide',params.get('page')||undefined,localContext);
 return <>{module&&project&&study.initial?<RuntimePlayer project={project} deck={module.pptDeck} guide={module.element} notes={module.getPptNotes} assetId={module.assetId} account={study.account} initialState={study.initial} onProgress={study.progress}/>:<p role={study.error?'alert':'status'}>{study.error||'正在打开课程…'}</p>}{study.initial&&study.error&&<p role="alert" className="shuku-study-error">{study.error}</p>}</>;
}
