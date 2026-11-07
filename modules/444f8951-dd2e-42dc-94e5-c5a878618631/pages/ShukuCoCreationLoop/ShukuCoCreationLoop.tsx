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
 return <article ref={root} className="scl-page cg-shuku-cocreation-loop" aria-label="术库：让课程在共创中持续进化，形成知识循环" onKeyDown={keys}>
  <LoopArtwork onOpen={open}/>
  {current&&panel&&<div className={`scl-overlay scl-${current.tone}`}>
   <button className="scl-backdrop" tabIndex={-1} aria-label="关闭放大预览" onClick={close}/>
   <section ref={dialog} className="scl-dialog" role="dialog" aria-modal="true" aria-labelledby={id+'-title'} aria-describedby={id+'-description'}>
    <header className="scl-dialog-header"><div><span className="scl-eyebrow">术库 · 知识共创 / 交互示例</span><h2 id={id+'-title'}>{current.title}</h2><p id={id+'-description'}>{current.subtitle}</p></div><button className="scl-close" onClick={close} aria-label="收起放大预览">收起 ↗</button></header>
    <div className="scl-dialog-body"><div className="scl-original">{panel==='course'?<LoopCourseCard/>:<LoopStageCard panel={panel}/>}
<p>示例演示 · 操作仅保留在当前页面，不提交到真实课程。</p><nav aria-label="切换共创流程">{(['classroom','creation','review','release'] as Panel[]).map((key,i)=><button key={key} aria-pressed={panel===key} onClick={()=>setPanel(key)}>{String(i+1).padStart(2,'0')} {panels[key].title}</button>)}</nav></div>
    <div className="scl-interaction">
     {(panel==='classroom'||panel==='course')&&<><span className="scl-kicker">梯度下降 · 可操作演示</span><h3>为什么学习率太大会震荡？</h3><p>调节学习率，观察同一个目标函数的损失怎样变化。</p><div className="scl-chart"><svg viewBox="0 0 550 260" role="img" aria-label={`学习率 ${rate.toFixed(2)} 的损失变化曲线`}><path d="M24 15V235H530" stroke="#c9d9f0" fill="none"/><polyline points={points} fill="none" stroke="#0874ff" strokeWidth="3"/>{losses.map((loss,i)=><circle key={i} cx={24+i*29} cy={235-Math.min(loss,2)*105} r="3.5" fill="#0874ff"/>)}</svg></div><label className="scl-slider">学习率 η <input aria-label="调整学习率" type="range" min="0.05" max="1" step="0.05" value={rate} onChange={e=>setRate(Number(e.target.value))}/><output>{rate.toFixed(2)}</output></label><p className="scl-observation" role="status">{rate===1?'此时参数在两侧来回跳动，损失没有下降。':rate>0.5?'参数在最低点两侧交替移动；接近 1 时，收敛变慢。':'损失逐步下降；学习率很小时，需要更多步才能接近最低点。'}</p><button className="scl-primary" onClick={()=>dispatch({type:'feedback'})}>{state.feedback?'✓ 已记录：希望补充学习率演示':'提出反馈：希望补充学习率演示'}</button>{state.feedback&&<button className="scl-link" onClick={()=>setPanel('creation')}>带着这个问题参与共创 →</button>}</>}
     {panel==='creation'&&<><span className="scl-kicker">从学习中的问题出发</span><h3>两位学生，两种改进</h3><p>共创先发生在个人版本中，正式课程保持原样。</p><div className="scl-examples">{examples.map(e=><section key={e.id}><span>{e.author}</span><h4>{e.title}</h4><p>{e.id==='learning-rate'?'加入可调节参数的互动演示，让学习者观察收敛与震荡。':'补充从噪声到图像的应用案例，把抽象概念联系到真实任务。'}</p></section>)}</div><button className="scl-primary" disabled={state.published} onClick={()=>{dispatch({type:'submit'});setPanel('review');}}>提交两项改进，进入审核 →</button>{state.published&&<p>本轮已发布，可在“纳入新版”中重置演示。</p>}</>}
     {panel==='review'&&<><span className="scl-kicker">AI 评分供参考 · 教师作出判断</span><h3>选择要进入新版的改进</h3><p>分数是示例，不会自动决定是否采纳。未通过的内容继续留在个人版本。</p>{!state.submitted&&<p className="scl-observation">请先在“学生共创”中提交改进。</p>}<div className="scl-reviews">{examples.map(e=><section key={e.id}><div><span>{e.author}</span><h4>{e.title}</h4><p>{e.criteria.join(' · ')}</p></div><strong>{e.score}<small>示例分</small></strong><div className="scl-decisions"><button disabled={!state.submitted||state.published} aria-pressed={state.decisions[e.id]==='accepted'} onClick={()=>dispatch({type:'decide',id:e.id,decision:'accepted'})}>采纳{e.author}</button><button disabled={!state.submitted||state.published} aria-pressed={state.decisions[e.id]==='rejected'} onClick={()=>dispatch({type:'decide',id:e.id,decision:'rejected'})}>退回{e.author}</button></div></section>)}</div><p className="scl-observation" role="status">{state.published?'本轮已发布。':canPublish(state)?'审核已完成。采纳的改进还需要明确发布，才会进入正式课程。':'请完成两项审核，并至少采纳一项改进，才能发布新版。'}</p><button className="scl-primary" disabled={!canPublish(state)} onClick={()=>setPanel('release')}>查看待发布内容 →</button></>}
     {panel==='release'&&<><span className="scl-kicker">{state.published?'共同维护的课程 · v1.1':'正式课程 · v1.0'}</span><h3>{state.published?'新版本已发布':'优秀内容，进入课程下一版'}</h3><p>审核与发布是两个步骤。只有明确发布后，学习者才会看到新版内容。</p><div className="scl-release"><span className="scl-version">{state.published?'v1.1':'v1.0 → v1.1'}</span><h4>梯度下降</h4><ul><li>保留基本概念与数学原理</li>{accepted.map(e=><li key={e.id}><b>{e.title}</b><small>贡献来自{e.author} · {state.published?'已纳入新版':'审核已采纳，等待发布'}</small></li>)}</ul>{accepted.length===0&&<p>目前还没有采纳的改进。</p>}</div><button className="scl-primary" disabled={!canPublish(state)} onClick={()=>dispatch({type:'publish'})}>{state.published?'✓ 已发布 v1.1':'发布课程 v1.1'}</button><button className="scl-link" onClick={()=>{dispatch({type:'reset'});setRate(0.1);setPanel('classroom');}}>重置演示，开始下一轮 →</button></>}
    </div></div>
   </section>
  </div>}
 </article>;
}
export default ShukuCoCreationLoop;
