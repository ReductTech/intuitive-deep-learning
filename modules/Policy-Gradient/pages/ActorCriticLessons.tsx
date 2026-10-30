import { useState } from 'react';
import { Button, Typography } from '../../shared/react';
import { Page, T, H, F, Controls } from '../components/LessonVisuals';
import { MazeBoard, ARROW } from '../components/ReinforceMaze';
import { START, GOAL, DIRECTIONS, DIR_LABEL, type Step } from '../mazeModel';
import { forward, episode } from '../neuralPolicy';
import { newACRun, trainAC, qValues } from '../actorCritic';
import { TrainingCurve } from './TrainingLessons';
import './actorCritic.css';
const initial=newACRun();
const name=(s:number)=>`第 ${Math.floor(s/4)+1} 行第 ${s%4+1} 列`;
function Board({cell=START,steps=[],focus=-1,onSelect}:{cell?:number;steps?:Step[];focus?:number;onSelect?:(s:number)=>void}){return <div className="pg-ac-board pg-tr-board"><MazeBoard position={cell} steps={steps} focus={focus} compactLabels fox showPath onSelect={onSelect}/></div>}
function ActionRows({cell,actor=initial.actor,critic=initial.critic}:{cell:number;actor?:typeof initial.actor;critic?:typeof initial.critic}){return <div className="pg-ac-action-rows"><div><T small>方向</T><T>Actor · 概率</T><T>Critic · 估计回报</T></div>{DIRECTIONS.map((d,i)=><div key={d}><T small>{ARROW[d]} {DIR_LABEL[d]}</T><T tone="accent">{(forward(actor,cell).p[i]*100).toFixed(1)}%</T><T tone="warning">{qValues(critic,cell)[i].toFixed(2)}</T></div>)}</div>}
export function ACProgress({active=-1}:{active?:number}){return <div className="pg-ac-flow" role="list" aria-label="Actor-Critic 每步训练流程">{['① 按策略选动作','② 执行，得奖励','③ 算学习目标','④ 更新 Critic','⑤ 更新 Actor'].map((v,i)=><div key={v} role="listitem" aria-current={active===i?'step':undefined} className={active===i?'is-current':''}><T small>{v}</T></div>)}</div>}
export function ActorCriticIntro(){
 const[cell,setCell]=useState(START);
 const probabilities=forward(initial.actor,cell).p;
 const estimates=qValues(initial.critic,cell);
 return <Page title="Actor-Critic：让另一个网络评价选择" subtitle="REINFORCE 要等终局，单局回报又容易受运气影响。怎么办？" takeaway="Critic 学习平均回报：让 Actor 每步更新，评价通常更稳定；但估计不准也会影响学习。">
  <div className="pg-ac12-layout">
   <div className="pg-ac12-comparison">
    <div><T>REINFORCE · 等终局</T><F latex={String.raw`G_t`}/></div>
    <T tone="muted">→</T>
    <div><T tone="warning">Actor-Critic · 每走一步</T><F latex={String.raw`q_w(s_t,a_t)`}/></div>
   </div>
   <div className="pg-ac12-models">
    <div className="pg-ac12-state"><Board cell={cell} onSelect={c=>c!==GOAL&&setCell(c)}/><T small>{name(cell)} · 点击格子查看</T></div>
    <div className="pg-ac12-outputs">
     <div className="pg-ac12-head"><div/><div><H>Actor · 选择动作</H><T>四个概率</T></div><div><Typography variant="h3" tone="warning">Critic · 评价动作</Typography><T>四个回报估计</T></div></div>
     <div className="pg-ac12-rows">{DIRECTIONS.map((d,i)=><div key={d}><T small>{ARROW[d]} {DIR_LABEL[d]}</T><T tone="accent">{(probabilities[i]*100).toFixed(1)}%</T><T tone="warning">{estimates[i].toFixed(2)}</T></div>)}</div>
     <T small tone="muted">本课用 Q 型 Critic；评分不是概率，可为负。</T>
    </div>
   </div>
  </div>
 </Page>;
}
export function ActorCriticTraining(){const[run,setRun]=useState(newACRun),[busy,setBusy]=useState(false),[cell,setCell]=useState(START);const train=async(n:number)=>{setBusy(true);let next=run;for(let done=0;done<n;done+=50){next=trainAC(next,Math.min(50,n-done));setRun(next);await new Promise(resolve=>setTimeout(resolve,0));}setBusy(false);};const evaluation=run.episodes?episode(run.actor,run.seed,true)[0]:[];const evaluationScore=evaluation.reduce((sum,v)=>sum+v.reward,0);const recent=run.scores.slice(-100),mean=recent.length?recent.reduce((a,b)=>a+b,0)/recent.length:null;return <Page title="真实训练：走一步，就学一步" subtitle="从随机网络开始，按概率采样；每一步实际更新 Actor 和 Critic。" takeaway="训练按概率采样，测试选最大概率；看平均得分和实际路线判断是否学好。每局最多 30 步。"><div className="pg-ac-loop-wrap"><ACProgress/><div className="pg-ac-training pg-readable-ac-training"><div className="pg-ac-left"><Board cell={run.last.at(-1)?.step.next??START} steps={run.last.map(v=>v.step)} onSelect={c=>c!==GOAL&&setCell(c)}/><T small>{run.last.length?`最近一局 · ${run.last.length} 步 · ${run.scores.at(-1)} 分`:'两个网络随机初始化，尚未训练'}</T><T small tone="accent">最大概率测试：{run.episodes?`${evaluation.length} 步 · ${evaluationScore} 分`:'尚未训练'}</T><Controls><Button variant="primary" disabled={busy} onClick={()=>train(1)}>训练 1 局</Button><Button disabled={busy} onClick={()=>train(100)}>训练 100 局</Button><Button disabled={busy} onClick={()=>train(1000)}>{busy?'训练中…':'训练 1000 局'}</Button><Button disabled={busy} onClick={()=>{setRun(newACRun());setCell(START);}}>重置</Button></Controls></div><div className="pg-ac-right"><div className="pg-ac-metrics"><H>已训练 {run.episodes} 局</H><T>近 {recent.length||100} 局均分：{mean===null?'—':mean.toFixed(2)}</T></div><TrainingCurve scores={run.scores}/><T small tone="accent">{name(cell)} · 点击迷宫查看</T><ActionRows cell={cell} actor={run.actor} critic={run.critic}/></div></div></div></Page>}
