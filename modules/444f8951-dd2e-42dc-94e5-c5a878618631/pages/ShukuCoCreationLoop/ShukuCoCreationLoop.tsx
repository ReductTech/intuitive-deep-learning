import {useEffect,useId,useReducer,useRef,useState,type KeyboardEvent} from 'react';
import {LoopArtwork,LoopStageCard,LoopCourseCard,type LoopPanel} from './LoopArtwork';
import {canPublish,examples,gradientSteps,initialLoop,loopReducer} from './model';
import './ShukuCoCreationLoop.css';

type Panel = LoopPanel;
const panels:Record<Panel,{title:string;subtitle:string;tone:string}>= {
 classroom:{title:'课堂使用',subtitle:'学生学习课程，提出问题与新想法',tone:'blue'},
 creation:{title:'学生共创',subtitle:'补充更好的讲法与案例',tone:'orange'},
 review:{title:'教师审核',subtitle:'结合 AI 评价与教学判断进行筛选',tone:'purple'},
 release:{title:'纳入新版',subtitle:'优秀内容进入课程 v1.1',tone:'green'},
 course:{title:'共同维护的课程',subtitle:'梯度下降 · 从直觉理解到互动演示',tone:'blue'},
};
export function ShukuCoCreationLoop(){
 const [panel,setPanel]=useState<Panel|null>(null),[rate,setRate]=useState(0.1);
 const [state,dispatch]=useReducer(loopReducer,undefined,initialLoop);
 const root=useRef<HTMLElement>(null),dialog=useRef<HTMLElement>(null),trigger=useRef<HTMLButtonElement|null>(null);
 const id=useId(),current=panel?panels[panel]:null;
 useEffect(()=>{if(panel)dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();},[panel]);
 function close(){setPanel(null);requestAnimationFrame(()=>trigger.current?.focus());}
 function open(value:Panel,button:HTMLButtonElement){trigger.current=button;setPanel(value);}
 function keys(event:KeyboardEvent<HTMLElement>){
  if(!panel)return;
  // Keep slide shortcuts from consuming controls inside this lesson.
  event.stopPropagation();
  if(event.key==='Escape'){event.preventDefault();close();}
  if(event.key==='Tab'){
   const nodes=dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),[tabindex="0"]');
   if(!nodes?.length)return;
   const first=nodes[0],last=nodes[nodes.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  }
 }
 const losses=gradientSteps(rate),accepted=examples.filter(e=>state.decisions[e.id]==='accepted');
 const points=losses.map((loss,i)=>`${24+i*29},${235-Math.min(loss,2)*105}`).join(' ');
 return <article shuku-edit-id="e-fff7960f-1e4f-459d-bff1-a623a7b570b6" ref={root} className="scl-page cg-shuku-cocreation-loop" aria-label="术库：让课程在共创中持续进化，形成知识循环" onKeyDown={keys}>
  <LoopArtwork onOpen={open}/>
  {current&&panel&&<div shuku-edit-id="e-a7f5072a-f2f9-4263-b806-8d19672cb30c" className={`scl-overlay scl-${current.tone}`}>
   <button shuku-edit-id="e-0c587f4d-b7c8-4122-ba1d-6fa551ca81c3" className="scl-backdrop" tabIndex={-1} aria-label="关闭放大预览" onClick={close}/>
   <section shuku-edit-id="e-bb3f77e6-7e98-4020-be23-f3a61c5b714e" ref={dialog} className="scl-dialog" role="dialog" aria-modal="true" aria-labelledby={id+'-title'} aria-describedby={id+'-description'}>
    <header shuku-edit-id="e-49ec4db6-cecf-47df-aa6f-7ef0d9dd9100" className="scl-dialog-header"><div shuku-edit-id="e-52e73b5c-40bb-4c57-a3a1-3f6b9768bf28"><span shuku-edit-id="e-09516f92-009b-41cb-a576-0943cf1fd0bc" className="scl-eyebrow">术库 · 知识共创 / 交互示例</span><h2 shuku-edit-id="e-65186261-b30d-4c75-bbdb-1fee54d18a08" id={id+'-title'}>{current.title}</h2><p shuku-edit-id="e-b6111530-9276-477d-ac07-226dbe168825" id={id+'-description'}>{current.subtitle}</p></div><button shuku-edit-id="e-72ac98d1-3543-477d-8247-6f7dc540fd71" className="scl-close" onClick={close} aria-label="收起放大预览">收起 ↗</button></header>
    <div shuku-edit-id="e-c7e5ccf4-9432-4e2e-a492-24e12eebb840" className="scl-dialog-body"><div shuku-edit-id="e-0569694c-06f4-4632-a59a-fe475bac334b" className="scl-original">{panel==='course'?<LoopCourseCard/>:<LoopStageCard panel={panel}/>}
<p shuku-edit-id="e-3b5dddc3-97e3-4601-b23d-bce6420f58a9">示例演示 · 操作仅保留在当前页面，不提交到真实课程。</p><nav shuku-edit-id="e-0946427a-6cba-444e-9ae7-cc528f8a4fac" aria-label="切换共创流程">{(['classroom','creation','review','release'] as Panel[]).map((key,i)=><button shuku-edit-id="e-94dd3983-c696-4cf3-b30d-b716b6c847c8" key={key} aria-pressed={panel===key} onClick={()=>setPanel(key)}>{String(i+1).padStart(2,'0')} {panels[key].title}</button>)}</nav></div>
    <div shuku-edit-id="e-6967177d-6dcc-4f69-8724-5a5729114204" className="scl-interaction">
     {(panel==='classroom'||panel==='course')&&<><span shuku-edit-id="e-f8b132e3-b185-407e-8b0d-af7d8c1afe65" className="scl-kicker">梯度下降 · 可操作演示</span><h3 shuku-edit-id="e-f80e0bbf-d871-40db-840b-c6aa687e79ef">为什么学习率太大会震荡？</h3><p shuku-edit-id="e-74c224c6-41b5-452b-aebf-5b43454a20a9">调节学习率，观察同一个目标函数的损失怎样变化。</p><div shuku-edit-id="e-61f6ae36-81e1-4811-b17f-06a027996726" className="scl-chart"><svg shuku-edit-id="e-946dea9d-5254-48cc-b0f4-029e291d6b9c" viewBox="0 0 550 260" role="img" aria-label={`学习率 ${rate.toFixed(2)} 的损失变化曲线`}><path shuku-edit-id="e-9bc7076f-c621-4f4b-9623-4c5e111a6732" d="M24 15V235H530" stroke="#c9d9f0" fill="none"/><polyline shuku-edit-id="e-65e07e68-e667-44c1-8f0a-502f7d95bae2" points={points} fill="none" stroke="#0874ff" strokeWidth="3"/>{losses.map((loss,i)=><circle shuku-edit-id="e-9a95f2dc-5eb4-4953-b3de-f31ae278cb9b" key={i} cx={24+i*29} cy={235-Math.min(loss,2)*105} r="3.5" fill="#0874ff"/>)}</svg></div><label shuku-edit-id="e-e0576ca4-b186-46bb-bc59-20a09b6bc5e3" className="scl-slider">学习率 η <input shuku-edit-id="e-88082d60-2e76-4107-bc0a-2dce68eb4274" aria-label="调整学习率" type="range" min="0.05" max="1" step="0.05" value={rate} onChange={e=>setRate(Number(e.target.value))}/><output shuku-edit-id="e-c893e7fa-167d-4f82-bb33-c8371d4cc933">{rate.toFixed(2)}</output></label><p shuku-edit-id="e-b34b4f8d-7465-4428-bb7f-18e90d718438" className="scl-observation" role="status">{rate===1?'此时参数在两侧来回跳动，损失没有下降。':rate>0.5?'参数在最低点两侧交替移动；接近 1 时，收敛变慢。':'损失逐步下降；学习率很小时，需要更多步才能接近最低点。'}</p><button shuku-edit-id="e-a1713587-c6ad-4bdb-8167-acc44b702cbb" className="scl-primary" onClick={()=>dispatch({type:'feedback'})}>{state.feedback?'✓ 已记录：希望补充学习率演示':'提出反馈：希望补充学习率演示'}</button>{state.feedback&&<button shuku-edit-id="e-1b66f822-a93c-4a7b-8b87-286eb0ba7897" className="scl-link" onClick={()=>setPanel('creation')}>带着这个问题参与共创 →</button>}</>}
     {panel==='creation'&&<><span shuku-edit-id="e-b41357d5-4eae-486f-ae57-0161eee908f3" className="scl-kicker">从学习中的问题出发</span><h3 shuku-edit-id="e-ecbeed52-cdc9-4ca6-bd65-2ee22c90c9aa">两位学生，两种改进</h3><p shuku-edit-id="e-5069bf18-f8f1-4d6d-965a-8e2c85295a4a">共创先发生在个人版本中，正式课程保持原样。</p><div shuku-edit-id="e-6c32581b-ea1c-4905-83aa-1c513f824334" className="scl-examples">{examples.map(e=><section shuku-edit-id="e-fd9add20-4743-4370-a0c2-c5e5d75c96ff" key={e.id}><span shuku-edit-id="e-9be6ad63-f54d-445b-8823-bb509d1a6051">{e.author}</span><h4 shuku-edit-id="e-8ed9d9be-8ba2-45e5-b521-108f776c4f30">{e.title}</h4><p shuku-edit-id="e-b500eda0-96fa-46c8-a1de-6ff619faa2dc">{e.id==='learning-rate'?'加入可调节参数的互动演示，让学习者观察收敛与震荡。':'补充从噪声到图像的应用案例，把抽象概念联系到真实任务。'}</p></section>)}</div><button shuku-edit-id="e-6bbf0003-fbf7-4023-9266-3cc5f4bd0e00" className="scl-primary" disabled={state.published} onClick={()=>{dispatch({type:'submit'});setPanel('review');}}>提交两项改进，进入审核 →</button>{state.published&&<p shuku-edit-id="e-1e725259-b2ac-4dc0-ac3f-b0eb9ea54294">本轮已发布，可在“纳入新版”中重置演示。</p>}</>}
     {panel==='review'&&<><span shuku-edit-id="e-102992f7-75bc-4538-bb71-fc74db2292f9" className="scl-kicker">AI 评分供参考 · 教师作出判断</span><h3 shuku-edit-id="e-5d481400-a936-4f9f-b8c3-34a346bfad96">选择要进入新版的改进</h3><p shuku-edit-id="e-b7de8e83-15ca-4b7d-9537-0d191b748f04">分数是示例，不会自动决定是否采纳。未通过的内容继续留在个人版本。</p>{!state.submitted&&<p shuku-edit-id="e-d6f9db41-d785-4e35-a3ea-245e8b89a555" className="scl-observation">请先在“学生共创”中提交改进。</p>}<div shuku-edit-id="e-ef66386c-9afe-436b-bda8-78fe61523f27" className="scl-reviews">{examples.map(e=><section shuku-edit-id="e-9402d9c8-d999-4127-b147-b2bede97005a" key={e.id}><div shuku-edit-id="e-6c217314-26bb-4fb2-a3a2-9d57bfdc452b"><span shuku-edit-id="e-d0caaf10-5ff9-4c6b-a7a3-94eb3ac6df1c">{e.author}</span><h4 shuku-edit-id="e-2db6e8c4-4f64-4078-ba85-b307acc2f826">{e.title}</h4><p shuku-edit-id="e-96f5a23d-6ccf-4289-b384-6c46d123adcb">{e.criteria.join(' · ')}</p></div><strong shuku-edit-id="e-352c9ba9-a21e-4009-b2b0-b722300b111c">{e.score}<small shuku-edit-id="e-5bd34b0b-4eac-43a3-8764-a1cadcd786b2">示例分</small></strong><div shuku-edit-id="e-b8e264dd-c578-4c2e-bdbe-56e6d6fa71d4" className="scl-decisions"><button shuku-edit-id="e-9e2a4dc3-f1fe-49d0-a2c2-9c5f7027800e" disabled={!state.submitted||state.published} aria-pressed={state.decisions[e.id]==='accepted'} onClick={()=>dispatch({type:'decide',id:e.id,decision:'accepted'})}>采纳{e.author}</button><button shuku-edit-id="e-15d3e70b-7851-4ec2-b7f7-9d686a96626e" disabled={!state.submitted||state.published} aria-pressed={state.decisions[e.id]==='rejected'} onClick={()=>dispatch({type:'decide',id:e.id,decision:'rejected'})}>退回{e.author}</button></div></section>)}</div><p shuku-edit-id="e-11b7889e-feaa-46b1-98de-93615f38d0c2" className="scl-observation" role="status">{state.published?'本轮已发布。':canPublish(state)?'审核已完成。采纳的改进还需要明确发布，才会进入正式课程。':'请完成两项审核，并至少采纳一项改进，才能发布新版。'}</p><button shuku-edit-id="e-e6210e0a-9493-4e82-b10c-4f9424a2e71f" className="scl-primary" disabled={!canPublish(state)} onClick={()=>setPanel('release')}>查看待发布内容 →</button></>}
     {panel==='release'&&<><span shuku-edit-id="e-2e144a21-7901-4336-b7e2-85a07c841e5a" className="scl-kicker">{state.published?'共同维护的课程 · v1.1':'正式课程 · v1.0'}</span><h3 shuku-edit-id="e-fa8af51e-4576-4dca-a413-7f403c0eaa24">{state.published?'新版本已发布':'优秀内容，进入课程下一版'}</h3><p shuku-edit-id="e-986f4328-4ef7-40da-b45c-0310463b6fb8">审核与发布是两个步骤。只有明确发布后，学习者才会看到新版内容。</p><div shuku-edit-id="e-a28ce235-0a72-4154-809a-a4afcf1eece2" className="scl-release"><span shuku-edit-id="e-3405458f-1da7-48a4-a61a-fa3e3ad532fb" className="scl-version">{state.published?'v1.1':'v1.0 → v1.1'}</span><h4 shuku-edit-id="e-93427fd6-d2c2-4f8c-9679-6f2f562e6f54">梯度下降</h4><ul shuku-edit-id="e-ba56ea4c-bd6b-4271-947d-faecad5ba292"><li shuku-edit-id="e-bd9d4a03-e7f3-4ff1-814f-9b1d86baae41">保留基本概念与数学原理</li>{accepted.map(e=><li shuku-edit-id="e-c748eeb0-b59c-4f49-a7eb-f8fcbce2aece" key={e.id}><b shuku-edit-id="e-9eedaadd-20bb-4366-bc74-f965275938fd">{e.title}</b><small shuku-edit-id="e-81b52060-6fd1-4e40-94dd-92f8b3e074dc">贡献来自{e.author} · {state.published?'已纳入新版':'审核已采纳，等待发布'}</small></li>)}</ul>{accepted.length===0&&<p shuku-edit-id="e-d6e2e572-377e-45f1-a900-420c067af71f">目前还没有采纳的改进。</p>}</div><button shuku-edit-id="e-28c06402-4e22-4e17-b49b-50ac2a0a06c3" className="scl-primary" disabled={!canPublish(state)} onClick={()=>dispatch({type:'publish'})}>{state.published?'✓ 已发布 v1.1':'发布课程 v1.1'}</button><button shuku-edit-id="e-5633760f-52c2-4202-bf43-56d0e3296257" className="scl-link" onClick={()=>{dispatch({type:'reset'});setRate(0.1);setPanel('classroom');}}>重置演示，开始下一轮 →</button></>}
    </div></div>
   </section>
  </div>}
 </article>;
}
export default ShukuCoCreationLoop;
