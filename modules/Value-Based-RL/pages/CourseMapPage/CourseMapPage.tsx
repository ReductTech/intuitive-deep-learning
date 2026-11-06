import { CourseEndingPage } from '../../../shared/react';
import { endingResources } from './endingResources';
import './CourseMapPage.css';

export function CourseMapPage() {
  return <div className="vbrl-ending-page">
    <CourseEndingPage
      pageKey="value-based-rl-ending"
      developerIds={['jassary08']}
      title="基于价值的强化学习：从经历到决策"
      summary="从交互中获得奖励，用回报衡量长期结果，通过 Bellman 目标更新动作价值，再依据 Q 值选择动作。DQN 用神经网络表示价值，结合经验回放与目标网络进行学习。"
      topics={['奖励与回报', 'V 与 Q', 'Bellman 目标', 'Q-learning', '探索与利用', 'DQN']}
      resources={endingResources}
      resourceHeading="回顾与延伸"
    />
  </div>;
}
