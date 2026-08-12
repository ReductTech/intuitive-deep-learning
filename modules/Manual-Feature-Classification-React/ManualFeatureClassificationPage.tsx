import { useEffect, useState } from 'react';
import { LessonFlow, ModuleShell, type LessonFlowStep } from '../shared/react';
import { DistributionBlock } from './blocks/DistributionBlock';
import { ManualCountBlock } from './blocks/ManualCountBlock';
import { MlpTrainingBlock } from './blocks/MlpTrainingBlock';
import { ResourcesBlock } from './blocks/ResourcesBlock';
import './manual-feature-classification-react.css';

const progress = [
  ['manual-count', '数出人工特征'],
  ['feature-distribution', '比较特征分布'],
  ['train-mlp', '训练分类模型'],
  ['resources', '总结人工特征'],
] as const;

function CourseProgress() {
  const [current, setCurrent] = useState('manual-count');
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) setCurrent((visible.target as HTMLElement).dataset.stepId ?? 'manual-count');
    }, { rootMargin: '-15% 0px -70%', threshold: 0 });
    const observed = new Set<Element>();
    const observeSteps = () => document.querySelectorAll('.hdf-react-shell .edu-lesson-flow-step[data-step-id]').forEach((node) => { if (!observed.has(node)) { observed.add(node); observer.observe(node); } });
    observeSteps();
    const mutations = new MutationObserver(observeSteps);
    const flow = document.querySelector('.hdf-react-shell .edu-lesson-flow');
    if (flow) mutations.observe(flow, { childList: true });
    return () => { mutations.disconnect(); observer.disconnect(); };
  }, []);
  return <nav className="edu-progress hdf-progress" aria-label="模块进度">{progress.map(([id, label]) => <span className={`edu-progress-item ${current === id ? 'is-current' : ''}`} key={id} aria-current={current === id ? 'step' : undefined}>{label}</span>)}</nav>;
}

const steps: LessonFlowStep[] = [
  { id: 'manual-count', revealMode: 'scroll', render: ({ complete, isComplete }) => <ManualCountBlock onComplete={complete} lessonStepComplete={isComplete} /> },
  { id: 'feature-distribution', revealMode: 'cue', render: ({ complete, isComplete }) => <DistributionBlock onComplete={complete} lessonStepComplete={isComplete} /> },
  { id: 'train-mlp', revealMode: 'cue', completesLesson: true, render: ({ complete, isComplete }) => <MlpTrainingBlock onComplete={complete} lessonStepComplete={isComplete} /> },
  { id: 'resources', revealMode: 'immediate', render: () => <ResourcesBlock /> },
];

export function ManualFeatureClassificationPage() {
  return <ModuleShell title="人工特征的分类" subtitle="从二值手写数字的九宫格计数开始，理解人设计的特征如何帮助模型分类，也会在哪里失效。" badge="D02 · Manual Features" className="hdf-root hdf-react-root" shellClassName="hdf-shell hdf-react-shell"><CourseProgress /><LessonFlow steps={steps} persistenceKey="manual-feature-classification-react" cueText="下方有新的实验内容，继续观察人工特征如何进入分类模型。" /></ModuleShell>;
}
