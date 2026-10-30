import { useState } from 'react';
import { Button, RangeControl } from '../../shared/react';
import { Page, T, H, F, Controls } from '../components/LessonVisuals';
import { MazeBoard, ARROW } from '../components/ReinforceMaze';
import { A, START, GOAL, DIRECTIONS, DIR_LABEL, returns, transition, random, type Step } from '../mazeModel';
import { DEMO, DEMO_PATH, DEMO_DRAWS, forward, updateNetwork, newNeuralRun, episode, RATE, type Network, type NeuralRun } from '../neuralPolicy';
import './trainingLessons.css';
import { Board, Steps, TrainingProgress, path, gains } from './trainingSupport';

export function ReturnsLesson(){const[i,setI]=useState(path.length-1);const nextReturn=i===path.length-1?0:gains[i+1];return <Page title="走完以后，倒着计算回报" subtitle="本章 γ = 1，不打折；从最后一步往前相加。下标 t 从 0 计。" takeaway="六步回报为 5、6、7、8、9、10；下一页用它们给各步梯度加权。"><div className="pg-tr-course-wrap"><TrainingProgress active={1}/><div className="pg-tr-scene pg-tr-return-practice"><div className="pg-tr-stack"><Board cell={GOAL} steps={path} focus={i}/><Steps active={i} onSelect={setI}/><T small tone="muted">橙框：当前回看的历史位置</T></div><div className="pg-tr-stack"><H>第 {i+1} 步的回报</H><F latex={String.raw`G_t=r_t+\gamma G_{t+1}`}/><div className="pg-tr-return-calculation"><div><T>本步奖励 rₜ</T><H>{path[i].reward}</H></div><T>+</T><div><T>下一步回报 Gₜ₊₁</T><H>{nextReturn}</H></div><T>=</T><div className="is-result"><T>本步回报 Gₜ</T><H>{gains[i]}</H></div></div><F latex={String.raw`G_{${i}}=${path[i].reward}+${nextReturn}=${gains[i]}`}/><T small>{i===path.length-1?'终局之后的回报为 0，从这里开始往前算。':i===0?'六步回报全部算完；G₀ = 5，也是这一局的总得分。':'下一步的回报已经算好，再加上本步奖励。'}</T><Controls><Button variant="primary" disabled={i===0} onClick={()=>setI(i-1)}>往前算一步 ←</Button><Button onClick={()=>setI(path.length-1)}>从最后一步重播</Button></Controls></div></div></div></Page>}
