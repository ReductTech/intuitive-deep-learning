import {useId,type MouseEvent} from 'react';
import { moduleAssetUrl } from '../../../shared/react/assets';
import { moduleIdentity } from '../../outlines.json';
const surface = moduleAssetUrl(moduleIdentity.id, 'images/shuku-co-creation/gradient-surface.png');
const noise = moduleAssetUrl(moduleIdentity.id, 'images/shuku-co-creation/noise.png');
const cat = moduleAssetUrl(moduleIdentity.id, 'images/shuku-co-creation/cat.png');
import './LoopArtwork.css';

export type LoopPanel = 'classroom'|'creation'|'review'|'release'|'course';
export type OpenPanel = (panel:LoopPanel,button:HTMLButtonElement)=>void;
const stages={
 classroom:{number:'01',title:'课堂使用',subtitle:'学生学习课程，提出问题与新想法',tone:'blue'},
 creation:{number:'02',title:'学生共创',subtitle:'补充更好的讲法与案例',tone:'orange'},
 review:{number:'03',title:'教师审核',subtitle:'结合 AI 评价与教学判断进行筛选',tone:'purple'},
 release:{number:'04',title:'纳入新版',subtitle:'优秀内容进入课程 v1.1',tone:'green'},
} as const;
function Plot({multiple=false}:{multiple?:boolean}){
 return <svg className="scl-art-plot" viewBox="0 0 220 150" role="img" aria-label="随迭代逐步收敛的损失曲线"><path d="M15 12V136H210" stroke="#c1d8fa" strokeWidth="2" fill="none"/>{(multiple?[['#ffb52e','M18 24C55 100 84 105 120 112S177 119 208 122'],['#eb7065','M18 24C35 87 59 119 99 126S172 133 208 134'],['#0874ff','M18 24C31 103 56 130 99 133S172 136 208 136']]:[['#0874ff','M18 24C38 69 58 105 99 118S165 131 208 133']]).map(([color,d])=><path key={color} d={d} stroke={color} strokeWidth="2.5" fill="none"/>)}{!multiple&&[[18,24],[38,64],[57,93],[81,111],[107,121],[135,127],[164,131],[193,133]].map(([x,y])=><circle key={x} cx={x} cy={y} r="3.5" fill="#0874ff"/>)}</svg>;
}
function Dots(){return <div className="scl-art-dots" aria-hidden="true"><i/><i/><i/></div>;}
function ImagePair(){return <div className="scl-art-pair"><img src={noise} alt="生成前的噪声图"/><span aria-hidden="true">→</span><img src={cat} alt="生成后的猫图"/></div>;}
function Rate({value='0.5'}:{value?:string}){return <div className="scl-art-rate"><span>学习率 <i>η</i></span><div><i aria-hidden="true"/><span>{value}</span></div></div>;}
function Contribution({kind}:{kind:'rate'|'image'}){
 return <div className={'scl-art-contribution '+(kind==='image'?'is-image':'')}><h3>{kind==='rate'?'学生 A：可调节学习率的演示':'学生 B：图像生成中的应用'}</h3>{kind==='rate'?<div className="scl-art-rate-preview"><Plot multiple/><Rate/></div>:<ImagePair/>}</div>;
}
function StageContent({panel}:{panel:Exclude<LoopPanel,'course'>}){
 if(panel==='classroom')return <div className="scl-art-study"><div className="scl-art-study-window"><Dots/><div className="scl-art-study-content"><div className="scl-art-sidebars" aria-hidden="true"><i/><i/><i/></div><Plot/></div></div><div className="scl-art-question"><span>?</span><p>为什么学习率<br/>太大会震荡？</p></div></div>;
 if(panel==='creation')return <div className="scl-art-contributions"><Contribution kind="rate"/><Contribution kind="image"/></div>;
 if(panel==='review')return <div className="scl-art-review-rows">{(['rate','image'] as const).map((kind,i)=><div key={kind} className="scl-art-review-row"><div className="scl-art-review-thumb">{kind==='rate'?<Plot multiple/>:<ImagePair/>}</div><div className="scl-art-review-copy"><h3>{i===0?'学生 A：可调节学习率的演示':'学生 B：图像生成中的应用'}</h3><p><span>✓</span>{i===0?'内容准确':'案例典型'}</p><p><span>✓</span>{i===0?'有助于理解':'具有教学价值'}</p></div><strong>{i===0?'85':'82'}</strong><span className="scl-art-accepted">✓ 采纳</span></div>)}</div>;
 return <div className="scl-art-new-course"><h3>梯度下降 <span>v1.1</span></h3><div className="scl-art-new-content"><ol><li>基本概念</li><li>数学原理</li><li>互动演示 <b>新增</b></li><li>应用案例 <b>新增</b></li><li>不同讲法</li></ol><div className="scl-art-added-items"><div><span className="scl-art-play">▶</span><p><b>可调节学习率的演示</b><small>（来自学生 A）</small></p><Plot multiple/></div><div><ImagePair/><p><b>图像生成中的应用</b><small>（来自学生 B）</small></p></div></div></div></div>;
}
export function LoopStageCard({panel,onOpen}:{panel:Exclude<LoopPanel,'course'>;onOpen?:OpenPanel}){
 const stage=stages[panel];
 function openCard(event:MouseEvent<HTMLElement>){
  if(!onOpen||window.getSelection()?.toString()||(event.target instanceof Element&&event.target.closest('button')))return;
  const button=event.currentTarget.querySelector<HTMLButtonElement>('.scl-art-expand');if(button)onOpen(panel,button);
 }
 return <section className={`scl-art-stage scl-art-${panel} scl-${stage.tone}`} onClick={openCard}><header><span className="scl-art-number">{stage.number}</span><div><h2>{stage.title}</h2><p>{stage.subtitle}</p></div>{onOpen&&<button className="scl-art-expand" aria-label={'放大'+stage.title} aria-haspopup="dialog" onClick={e=>onOpen(panel,e.currentTarget)}>⤢</button>}</header><StageContent panel={panel}/></section>;
}
export function LoopCourseCard({onOpen}:{onOpen?:OpenPanel}){
 return <section className="scl-art-course"><Dots/><div className="scl-art-course-inner"><h2>梯度下降</h2><div className="scl-art-course-content"><ol>{['基本概念','数学原理','优化算法','互动演示','应用案例'].map((text,i)=><li key={text}>{i+1}.　{text}</li>)}</ol><div className="scl-art-surface"><img src={surface} alt="梯度下降曲面与下降轨迹，无文字插图"/><Rate value="0.1"/><span className="scl-art-formula">θ<sub>t+1</sub> = θ<sub>t</sub> − η∇f (θ<sub>t</sub>)</span></div></div><div className="scl-art-course-demo"><span className="scl-art-play">▶</span><span>交互演示：观察参数如何逐步收敛</span></div></div>{onOpen&&<button className="scl-art-expand" aria-label="放大共同维护的课程" aria-haspopup="dialog" onClick={e=>onOpen('course',e.currentTarget)}>⤢</button>}</section>;
}
export function LoopArtwork({onOpen}:{onOpen:OpenPanel}){
 const id=useId().replaceAll(':','');
 return <div className="scl-artwork">
  <header className="scl-art-heading"><h1>Shuku（术库）：让课程在共创中持续进化，<span>形成知识循环</span></h1><p>汇集实践中的发现与创造，共同打磨交互直觉的知识呈现</p></header>
  <div className="scl-art-halo" aria-hidden="true"/>
  <svg className="scl-art-arrows" viewBox="0 0 1600 900" aria-hidden="true"><defs>{[['blue','#5a9eff'],['orange','#ffa959'],['green','#7cdda3'],['purple','#9b64ff']].map(([name,color])=><marker key={name} id={id+name} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 10 5 0 10Z" fill={color}/></marker>)}</defs>{[['blue','M595 240C730 152 876 161 1008 247'],['orange','M1117 436Q1133 480 1103 526'],['purple','M999 692C879 780 717 780 599 686'],['green','M492 531Q452 471 497 414']].map(([color,d])=><path key={color} d={d} fill="none" stroke={({blue:'#5a9eff',orange:'#ffa959',purple:'#9b64ff',green:'#7cdda3'} as Record<string,string>)[color]} strokeWidth="5" strokeLinecap="round" markerEnd={`url(#${id+color})`}/>)}</svg>
  <span className="scl-art-label scl-art-feedback">学生使用反馈</span><span className="scl-art-label scl-art-maintained">共同维护的课程</span><span className="scl-art-label scl-art-selection">选取优秀案例</span>
  {(['classroom','creation','review','release'] as const).map(panel=><LoopStageCard key={panel} panel={panel} onOpen={onOpen}/>)}
  <LoopCourseCard onOpen={onOpen}/>
  <footer className="scl-art-footer"><svg viewBox="0 0 60 60" aria-hidden="true"><path d="M30 45V21M30 33C8 32 8 15 8 10c18 0 22 7 22 23M30 29C49 29 53 13 52 10c-17 0-22 5-22 19M18 48h24" fill="#63a5ff" stroke="#63a5ff" strokeWidth="4" strokeLinecap="round"/></svg><i aria-hidden="true"/><p>一个人创建一门课程，<strong>一群人让它持续生长。</strong></p></footer>
 </div>;
}
