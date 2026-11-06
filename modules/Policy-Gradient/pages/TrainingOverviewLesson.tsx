import { useState } from 'react';
import { Button, RangeControl } from '../../shared/react';
import { Page, T, H, F, Controls } from '../components/LessonVisuals';
import { MazeBoard, ARROW } from '../components/ReinforceMaze';
import { A, START, GOAL, DIRECTIONS, DIR_LABEL, returns, transition, random, type Step } from '../mazeModel';
import { DEMO, DEMO_PATH, DEMO_DRAWS, forward, updateNetwork, newNeuralRun, episode, RATE, type Network, type NeuralRun } from '../neuralPolicy';
import './trainingLessons.css';
import { Board, goalPaths } from './trainingSupport';

export function TrainingOverviewLesson(){return <Page title="策略决定怎么走，目标是平均得分更高" subtitle="πθ(a|s)：权重为 θ 的策略网络，在位置 s 选择动作 a 的概率。" takeaway="调整权重 θ，让当前策略的期望得分 J(θ) 更高。"><div className="pg-tr-goal-visual pg-tr-goal-static"><div className="pg-tr-goal-games">{goalPaths.map((p,i)=><div key={i}><T>{['示例 1 · 6 步到达','示例 2 · 8 步到达','示例 3 · 30 步超时'][i]}</T><Board cell={p.at(-1)!.next} steps={p}/><F latex={[String.raw`5\times(-1)+10=5`,String.raw`7\times(-1)+10=3`,String.raw`30\times(-1)=-30`][i]}/></div>)}</div><div className="pg-tr-goal-formulas"><div><T small tone="accent">① 奖励相加 → 一局得分</T><F latex={String.raw`R=\sum_t r_t`}/><T small>rₜ：本步奖励；Σ：求和；γ：折扣因子，本章取 1。</T></div><div><T small tone="accent">② 多局得分 → 样本平均</T><F latex={String.raw`\bar R=\frac{5+3-30}{3}\approx-7.33`}/><T small>R̄：三条示例的均值；实际评价要随机采样多局。</T></div><div><T small tone="accent">③ 按当前策略玩很多局 → 期望</T><F latex={String.raw`J(\theta)=\mathbb{E}_{\pi_\theta}[R]`}/><T small>E：期望；J：要提高的平均表现。</T></div></div></div></Page>;}
