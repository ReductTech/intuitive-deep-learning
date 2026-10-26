import {useMemo,useState,useCallback} from 'react';
import {activeModules} from '../app/modules';
import {createProject} from '../creator/model';
import {RuntimePlayer} from './RuntimePlayer';
import {SiteHeader} from './SiteHeader';
import {useStudy,type StudyPosition} from './personal';
import {TeachingLayout} from './TeachingLayout';
import {moduleAssetUrl} from '../../modules/shared/react/assets';
import {isLocalPreview} from '../app/runtimeMode';
import './shuku.css';
export function BuiltinLearning(){
 const params=new URLSearchParams(location.search),alias=params.get('module')||'';
 const module=activeModules.find(m=>m.id===alias&&m.pptDeck);
 const project=useMemo(()=>module?createProject(module):null,[module]);
 const localContext=useMemo(()=>isLocalPreview&&module&&project?{resource:'module:'+module.id,title:module.title,version:'builtin',version_label:'本地课件',pages:project.pages.map(page=>page.id),url:'/study?module='+encodeURIComponent(module.id),available:true}:undefined,[module,project]);
 const study=useStudy('module:'+alias,'builtin',params.get('resume')==='1',params.get('mode')==='ppt'?'ppt':'guide',params.get('page')||undefined,localContext);
 const [playback,setPlayback]=useState<StudyPosition|null>(null),[selection,setSelection]=useState<string|null>(null);
 const progress=useCallback((value:StudyPosition)=>{setPlayback(old=>old?.page_id===value.page_id&&old?.mode===value.mode?old:value);study.progress(value);},[study.progress]);
 return <div className="sd-library shuku-management shuku-learning"><SiteHeader section="courses"/><main className="shuku-learn-body"><header><a href="/">探索课程</a>{study.guest?<a href={'/my-courses?next='+encodeURIComponent(location.pathname+location.search)}>登录后保存学习进度</a>:<span role="status">{study.status}</span>}</header>{study.error&&<p role="alert">{study.error}</p>}{module&&project&&study.initial?<TeachingLayout pages={project.pages.map(p=>({id:p.id,title:p.title,thumbnail:moduleAssetUrl(module.assetId,`scenedeck-thumbnails/${p.nativeId||p.id}.png`)}))} active={(playback||study.initial).page_id} mode={(playback||study.initial).mode} onSelect={setSelection}><RuntimePlayer project={project} deck={module.pptDeck} initialState={study.initial} onProgress={progress} requestedPage={selection}/></TeachingLayout>:<p>{study.error?'':'正在打开课程…'}</p>}</main></div>;
}
