import { useState } from 'react';
import { Button, RangeControl } from '../../shared/react';
import { Page, T, H, F, Controls } from '../components/LessonVisuals';
import { MazeBoard, ARROW } from '../components/ReinforceMaze';
import { A, START, GOAL, DIRECTIONS, DIR_LABEL, returns, transition, random, type Step } from '../mazeModel';
import { DEMO, DEMO_PATH, DEMO_DRAWS, forward, updateNetwork, newNeuralRun, episode, RATE, type Network, type NeuralRun } from '../neuralPolicy';
import './trainingLessons.css';

export function Board({cell=START,steps=[],visible=steps.length,focus=-1,onSelect}:{cell?:number;steps?:Step[];visible?:number;focus?:number;onSelect?:(cell:number)=>void}){return <div className="pg-tr-board"><MazeBoard position={cell} steps={steps} visible={visible} focus={focus} compactLabels fox showPath onSelect={onSelect}/></div>}

export function Steps({active,onSelect}:{active:number;onSelect:(i:number)=>void}){return <Controls>{path.map((s,i)=><Button key={i} active={active===i} onClick={()=>onSelect(i)}>{i+1} {ARROW[s.action]}{s.wall?'×':''}</Button>)}</Controls>}

export function TrainingProgress({active}:{active:number}){return <div className="pg-tr-training-progress" role="list" aria-label="REINFORCE 训练流程">{['① 采样一局','② 计算回报','③ 更新网络','↻ 用新网络重复'].map((label,i)=><div key={label} role="listitem" aria-current={i===active?'step':undefined} className={i===active?'is-current':''}><T small>{label}</T></div>)}</div>}

export function TrainingCurve({scores}:{scores:number[]}){if(!scores.length)return <div className="pg-tr-curve-empty"><T small tone="muted">训练后显示平均回报曲线</T></div>;const points:{x:number;y:number}[]=[];for(let end=1;end<=scores.length;end++){if(end!==1&&end%20!==0&&end!==scores.length)continue;const window=scores.slice(Math.max(0,end-100),end);const mean=window.reduce((a,b)=>a+b,0)/window.length;points.push({x:scores.length===1?0:(end-1)/Math.max(1,scores.length-1)*600,y:6+(5-mean)/35*62});}const d=points.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');return <div className="pg-tr-training-curve"><div><T small>+5</T><T small>−30</T></div>{scores.length?<div className="pg-tr-curve-plot"><svg viewBox="0 0 600 74" role="img" aria-label="真实训练记录的最近100局平均回报曲线；不足100局时使用已有局数"><path d="M0 6H600M0 68H600" fill="none" stroke="#c7d5df" strokeWidth="1"/><path d={d} fill="none" stroke="#315b7b" strokeWidth="3"/>{points.length===1&&<circle cx={points[0].x} cy={points[0].y} r="4" fill="#315b7b"/>}</svg><div className="pg-tr-curve-axis"><T small>第 1 局</T><T small>训练局数 → {scores.length}</T></div></div>:<T small tone="muted">训练后显示平均回报曲线</T>}</div>;}

export function realEpisode(run:NeuralRun):{record:EpisodeRecord;run:NeuralRun}{const[path,seed]=episode(run.network,run.seed);const {after}=updateNetwork(run.network,path);return {record:{number:run.episodes+1,before:run.network,after,path,seed},run:{network:after,seed,episodes:run.episodes+1,returns:[...run.returns,returns(path)[0]],last:path}};}

export function goalExample(actions:number[]):Step[]{let cell=START;return actions.map(a=>{const result=transition(cell,DIRECTIONS[a]);const step={state:cell,action:DIRECTIONS[a],probability:forward(DEMO,cell).p[a],...result};cell=result.next;return step;});}

export const goalPaths=[goalExample([3,3,0,0,0,3]),goalExample([3,3,3,2,0,0,0,3]),goalExample(Array(30).fill(1))];

export const pct=(v:number)=>`${(100*v).toFixed(1)}%`;

export const n=(v:number)=>v.toFixed(3);

export const path=DEMO_PATH, gains=returns(path);

export interface EpisodeRecord { number:number; before:Network; after:Network; path:Step[]; seed:number }
