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
{id:'d8e5fb3c-f1ff-4ba1-a730-53f07268b6c9',title:'小狐狸怎样走，才能拿到最高分？',section:'从探索到策略',component:PlayMazePage},
{id:'1147ef31-e1d8-4fad-b142-b4e6b142c9df',title:'刚才你选方向，现在让模型来选',section:'从探索到策略',component:ValuePolicyPage},
{id:'8932ecbd-f542-49c5-a84b-309d66fb4c9f',title:'用神经网络决定行动',section:'策略模型',component:ModelLesson},
{id:'ceb9bd2e-14d2-4686-a011-941e358d0094',title:'策略决定怎么走，目标是平均得分更高',section:'训练思路',component:TrainingOverviewLesson},
{id:'578a6f7a-48e3-4b0c-bdee-faa2db915f67',title:'怎样让高分路线更常出现？',section:'训练原理',component:ObjectiveGradientLesson},
{id:'eecdeea1-98f0-405f-99d1-07fc5f9111ce',title:'目标确定了，网络权重怎样改？',section:'训练原理',component:GradientAscentLesson},
{id:'599d70a9-4251-49aa-a836-9950d422fa10',title:'这次选择，怎样影响权重？',section:'训练原理',component:LearningSignal},
{id:'d649a174-d7ae-4b65-b79c-e95edb1fb5e0',title:'REINFORCE 第一步：采样一局',section:'一局训练详解',component:RolloutLesson},
{id:'46f0ffb5-0c39-47d8-8957-f20a63c1808b',title:'走完以后，倒着计算回报',section:'一局训练详解',component:ReturnsLesson},
{id:'fd09fc56-4c47-490a-ac2a-2ea68fb40cde',title:'更新网络，让行动概率改变',section:'一局训练详解',component:UpdateOverview},
{id:'024fe211-343b-4a11-ad4e-a82c9e1c821a',title:'反复训练，看看策略是否学好了',section:'真实训练',component:LiveTrainingLesson},
{id:'67940399-b894-4757-915f-bce28c11e258',title:'Actor-Critic：让另一个网络评价选择',section:'Actor-Critic',component:ActorCriticIntro},
{id:'71a654ae-c804-4cac-8a07-1e74ebe094de',title:'Critic 怎样学会预测回报？',section:'Actor-Critic',component:CriticUpdateLesson},
{id:'e61c82cb-86af-4d42-9b03-39dde432df3d',title:'Actor：用 Critic 的评分调整行动概率',section:'Actor-Critic',component:ActorUpdateLesson},
{id:'fd3bae80-afce-4274-942d-24d207ea1cf1',title:'真实训练：走一步，就学一步',section:'Actor-Critic',component:ActorCriticTraining},
];
