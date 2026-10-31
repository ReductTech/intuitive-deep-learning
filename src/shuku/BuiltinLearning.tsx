import {ErrorPage} from '../app/ErrorPage';
import {useMemo} from 'react';
import {activeModules} from '../app/modules';
import {createProject} from '../creator/model';
import {RuntimePlayer} from './RuntimePlayer';
import {useStudy} from './personal';
import {isLocalPreview,isPublicPreview} from '../app/runtimeMode';
import './shuku.css';
export function BuiltinLearning(){
 const params=new URLSearchParams(location.search),alias=params.get('module')||'';
 const module=activeModules.find(m=>m.id===alias&&m.pptDeck);
 const project=useMemo(()=>module?createProject(module):null,[module]);
 const localContext=useMemo(()=>isLocalPreview&&module&&project?{resource:'module:'+module.id,title:module.title,version:'builtin',version_label:'本地课件',pages:project.pages.map(page=>page.id),url:'/study?module='+encodeURIComponent(module.id),available:true}:undefined,[module,project]);
 const study=useStudy('module:'+alias,'builtin',params.get('resume')==='1',params.get('mode')==='ppt'?'ppt':'guide',params.get('page')||undefined,localContext);
 if(!module||!project)return <ErrorPage status={404} error="没有找到这个链接对应的本地课程，课程可能已移除或链接中的课程标识有误。"/>;
 return <>{module&&project&&study.initial?<RuntimePlayer project={project} deck={module.pptDeck} guide={module.element} notes={module.getPptNotes} assetId={module.assetId} account={study.account} initialState={study.initial} onProgress={study.progress}/>:study.error?<ErrorPage error={study.failure||study.error}/>:null}{study.initial&&study.error&&<p role="alert" className="shuku-study-error">{study.error}</p>}</>;
}
