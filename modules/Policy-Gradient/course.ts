import { CriticUpdateLesson, ActorUpdateLesson } from './pages/ACUpdateLessons';
import { LearningSignal } from './pages/LearningSignal';
import { GradientAscentLesson } from './pages/GradientAscentLesson';
import { UpdateOverview } from './pages/UpdateOverview';
import type { ComponentType } from 'react';
import { PlayMazePage, ValuePolicyPage } from './pages/ReinforcePages';
import { ModelLesson, TrainingOverviewLesson, ObjectiveGradientLesson, RolloutLesson, ReturnsLesson, LiveTrainingLesson } from './pages/TrainingLessons';
import { ActorCriticIntro, ActorCriticTraining } from './pages/ActorCriticLessons';
export interface CoursePage {id:string;title:string;section:string;component:ComponentType}
export const course:CoursePage[]=[
{id:'play-maze',title:'小狐狸怎样走，才能拿到最高分？',section:'从探索到策略',component:PlayMazePage},
{id:'value-policy',title:'刚才你选方向，现在让模型来选',section:'从探索到策略',component:ValuePolicyPage},
{id:'model-forward',title:'用神经网络决定行动',section:'策略模型',component:ModelLesson},
{id:'training-overview',title:'策略决定怎么走，目标是平均得分更高',section:'训练思路',component:TrainingOverviewLesson},
{id:'objective-gradient',title:'怎样让高分路线更常出现？',section:'训练原理',component:ObjectiveGradientLesson},
{id:'gradient-ascent',title:'目标确定了，网络权重怎样改？',section:'训练原理',component:GradientAscentLesson},
{id:'trajectory-derivation',title:'这次选择，怎样影响权重？',section:'训练原理',component:LearningSignal},
{id:'rollout-steps',title:'REINFORCE 第一步：采样一局',section:'一局训练详解',component:RolloutLesson},
{id:'return-calculation',title:'走完以后，倒着计算回报',section:'一局训练详解',component:ReturnsLesson},
{id:'numeric-update',title:'更新网络，让行动概率改变',section:'一局训练详解',component:UpdateOverview},
{id:'live-training',title:'反复训练，看看策略是否学好了',section:'真实训练',component:LiveTrainingLesson},
{id:'actor-critic-intro',title:'Actor-Critic：让另一个网络评价选择',section:'Actor-Critic',component:ActorCriticIntro},
{id:'actor-critic-step',title:'Critic 怎样学会预测回报？',section:'Actor-Critic',component:CriticUpdateLesson},
{id:'actor-update',title:'Actor：用 Critic 的评分调整行动概率',section:'Actor-Critic',component:ActorUpdateLesson},
{id:'actor-critic-training',title:'真实训练：走一步，就学一步',section:'Actor-Critic',component:ActorCriticTraining},
];
