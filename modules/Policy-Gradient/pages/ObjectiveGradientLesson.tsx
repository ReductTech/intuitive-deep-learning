import { useState } from 'react';
import { Button, RangeControl } from '../../shared/react';
import { Page, T, H, F, Controls } from '../components/LessonVisuals';
import { MazeBoard, ARROW } from '../components/ReinforceMaze';
import { A, START, GOAL, DIRECTIONS, DIR_LABEL, returns, transition, random, type Step } from '../mazeModel';
import { DEMO, DEMO_PATH, DEMO_DRAWS, forward, updateNetwork, newNeuralRun, episode, RATE, type Network, type NeuralRun } from '../neuralPolicy';
import './trainingLessons.css';
import { Board, goalPaths } from './trainingSupport';

export function ObjectiveGradientLesson(){const[q,setQ]=useState(50);const mean=5*q/100+3*(1-q/100);return <Page title="怎样让高分路线更常出现？" subtitle="先用一个只含两条路线的简化例子，观察概率怎样影响平均得分。" takeaway="更常走高分路线 → 平均得分更高。接下来：权重该怎样改？"><div className="pg-tr-probability-experiment"><div className="pg-tr-probability-routes">{goalPaths.slice(0,2).map((route,i)=><div key={i}><H>{i===0?'短路线 · 5 分':'绕路 · 3 分'}</H><Board cell={GOAL} steps={route}/><div className="pg-tr-route-frequency"><T>出现概率</T><H>{i===0?q:100-q}%</H></div></div>)}<div className="pg-tr-probability-result"><H>平均得分</H><F latex={String.raw`J(\theta)=${mean.toFixed(2)}`}/><div className="pg-tr-frequency-bar" role="img" aria-label={`短路线 ${q}%，绕路 ${100-q}%`}><span style={{width:`${q}%`}}/><span style={{width:`${100-q}%`}}/></div><F latex={String.raw`${(q/100).toFixed(2)}\times5+${(1-q/100).toFixed(2)}\times3`}/><T small>两条路线的得分没变，改变的是出现概率。</T></div></div><div className="pg-tr-route-slider"><RangeControl label={`短路线出现概率：${q}%`} min={0} max={100} step={5} value={q} onChange={e=>setQ(Number(e.target.value))}/><T small tone="muted">滑块模拟路线概率；训练实际改的是网络权重。</T></div><div className="pg-tr-probability-chain">{['调整权重 θ','每步动作概率 πθ','路线概率 Pπθ','平均得分 J'].map((v,i)=><div key={v}><T small>{v}</T>{i<3&&<T tone="accent">→</T>}</div>)}</div></div></Page>;}
