import { AttentionReviewPage } from './pages/AttentionReviewPage/AttentionReviewPage';
import { AttentionDeformablePage, AttentionDeformableSamplingPage, AttentionDeformableLearningPage } from './pages/AttentionDeformablePage/AttentionDeformableLessons';
import { AttentionKeyValuePurposePage } from './pages/AttentionKeyValuePurposePage/AttentionKeyValuePurposePage';
import { AttentionTranslationResultsPage } from './pages/AttentionTranslationResultsPage/AttentionTranslationResultsPage';
import { AttentionTranslationTrainingPage } from './pages/AttentionTranslationTrainingPage/AttentionTranslationTrainingPage';
import { AttentionTeacherForcingPage } from './pages/AttentionTeacherForcingPage/AttentionTeacherForcingPage';
import { AttentionDecodingStepPage } from './pages/AttentionDecodingStepPage/AttentionDecodingStepPage';
import { AttentionTranslationStructurePage } from './pages/AttentionTranslationStructurePage/AttentionTranslationStructurePage';
import { AttentionPaddingMaskPage } from './pages/AttentionPaddingMaskPage/AttentionPaddingMaskPage';
import { AttentionTranslationContextPage } from './pages/AttentionTranslationContextPage/AttentionTranslationContextPage';
import { AttentionRegressionHeatmapPage } from './pages/AttentionRegressionHeatmapPage/AttentionRegressionHeatmapPage';
import { AttentionRegressionTrainingPage } from './pages/AttentionRegressionTrainingPage/AttentionRegressionTrainingPage';
import { AttentionRegressionCurvePage } from './pages/AttentionRegressionCurvePage/AttentionRegressionCurvePage';
import { AttentionRegressionIntroPage } from './pages/AttentionRegressionIntroPage/AttentionRegressionIntroPage';
import { AttentionRedistributionPage } from './pages/AttentionRedistributionPage/AttentionRedistributionPage';
import { AttentionScalingPage } from './pages/AttentionScalingPage/AttentionScalingPage';
import { AttentionSoftmaxPage } from './pages/AttentionSoftmaxPage/AttentionSoftmaxPage';
import type { ReactNode } from 'react';
import type { LessonFlowRevealMode, LessonStepContext } from '../shared/react';
import { AttentionObservationPage } from './pages/AttentionObservationPage/AttentionObservationPage';
import { AttentionQueryPage } from './pages/AttentionQueryPage/AttentionQueryPage';

import { AttentionQkvPage } from './pages/AttentionQkvPage/AttentionQkvPage';

import { AttentionDotProductPage } from './pages/AttentionDotProductPage/AttentionDotProductPage';

import { AttentionProjectionPage } from './pages/AttentionProjectionPage/AttentionProjectionPage';

export const ATTENTION_MODULE_ID = 'attention-mechanism';
export const ATTENTION_PROGRESS_ID = 'attention-mechanism-v20';

export interface AttentionCourseItem {
  id: string;
  title: string;
  section: string;
  revealMode: LessonFlowRevealMode;
  component: (context: LessonStepContext) => ReactNode;
}

// Only implemented pages belong here. outlines.plannedPages is not a runtime catalog.
export const attentionCourse: AttentionCourseItem[] = [
  {
    id: 'C01',
    title: '任务决定关注重点',
    section: '任务与注意力',
    revealMode: 'cue',
    component: (context) => <AttentionObservationPage onComplete={context.complete} isComplete={context.isComplete} />,
  },
  {
    id: 'C02',
    title: '同一句话，问题不同、关注不同',
    section: '任务与注意力',
    revealMode: 'cue',
    component: (context) => <AttentionQueryPage onComplete={context.complete} isComplete={context.isComplete} />,
  },
  {
    id: 'C03',
    title: '用权重表示关注程度',
    section: '问题与匹配',
    revealMode: 'cue',
    component: (context) => <AttentionQkvPage onComplete={context.complete} isComplete={context.isComplete} />,
  },
  {id:'C26',title:'Q、K、V：问题、索引与内容',section:'问题与匹配',revealMode:'cue',component:context=><AttentionKeyValuePurposePage onComplete={context.complete} isComplete={context.isComplete}/>},
  {
    id: 'C04',
    title: '点积评分：方向和长度的作用',
    section: '匹配评分',
    revealMode: 'cue',
    component: (context) => <AttentionDotProductPage onComplete={context.complete} isComplete={context.isComplete} />,
  },
  {
    id: 'C05',
    title: '匹配评分：点积与加性',
    section: '匹配评分',
    revealMode: 'cue',
    component: (context) => <AttentionProjectionPage onComplete={context.complete} isComplete={context.isComplete} />,
  },
  {id:'C10',title:'Softmax：把分数变成权重',section:'注意力分配',revealMode:'cue',component:context=><AttentionSoftmaxPage onComplete={context.complete} isComplete={context.isComplete}/>},
  {id:'C11',title:'缩放点积：控制分数尺度',section:'注意力分配',revealMode:'cue',component:context=><AttentionScalingPage onComplete={context.complete} isComplete={context.isComplete}/>},
  {id:'C12',title:'小明买水：注意力的完整计算',section:'注意力分配',revealMode:'cue',component:context=><AttentionRedistributionPage onComplete={context.complete} isComplete={context.isComplete}/>},
  {id:'C13',title:'注意力估价：参考哪些店铺',section:'注意力回归',revealMode:'cue',component:context=><AttentionRegressionIntroPage onComplete={context.complete} isComplete={context.isComplete}/>},
  {id:'C14',title:'注意力估价：预测沿街价格',section:'注意力回归',revealMode:'cue',component:context=><AttentionRegressionCurvePage onComplete={context.complete} isComplete={context.isComplete}/>},
  {id:'C15',title:'学习注意力的参考范围',section:'注意力回归',revealMode:'cue',component:context=><AttentionRegressionTrainingPage onComplete={context.complete} isComplete={context.isComplete}/>},
  {id:'C16',title:'价格估计的注意力热力图',section:'注意力回归',revealMode:'cue',component:context=><AttentionRegressionHeatmapPage onComplete={context.complete} isComplete={context.isComplete}/>},
  {id:'C17',title:'翻译时按需汇聚上下文',section:'注意力翻译',revealMode:'cue',component:context=><AttentionTranslationContextPage onComplete={context.complete} isComplete={context.isComplete}/>},
  {id:'C18',title:'填充掩码：排除补齐位置',section:'注意力翻译',revealMode:'cue',component:context=><AttentionPaddingMaskPage onComplete={context.complete} isComplete={context.isComplete}/>},
  {id:'C19',title:'翻译模型：编码、注意力与解码',section:'注意力翻译',revealMode:'cue',component:context=><AttentionTranslationStructurePage onComplete={context.complete} isComplete={context.isComplete}/>},
  {id:'C20',title:'一步解码：生成当前译词',section:'注意力翻译',revealMode:'cue',component:context=><AttentionDecodingStepPage onComplete={context.complete} isComplete={context.isComplete}/>},
  {id:'C21',title:'翻译训练：样本与前词输入',section:'注意力翻译',revealMode:'cue',component:context=><AttentionTeacherForcingPage onComplete={context.complete} isComplete={context.isComplete}/>},
  {id:'C24',title:'训练中，关注重点如何变化',section:'注意力翻译',revealMode:'cue',component:context=><AttentionTranslationTrainingPage onComplete={context.complete} isComplete={context.isComplete}/>},
  {id:'C25',title:'验证句：训练前后的注意力',section:'注意力翻译',revealMode:'cue',component:context=><AttentionTranslationResultsPage onComplete={context.complete} isComplete={context.isComplete}/>},
  {id:'C28',title:'全局自注意力与窗口自注意力',section:'视觉注意力拓展',revealMode:'cue',component:context=><AttentionDeformablePage onComplete={context.complete} isComplete={context.isComplete}/>},
  {id:'C30',title:'窗口注意力与可变形注意力',section:'视觉注意力拓展',revealMode:'cue',component:context=><AttentionDeformableSamplingPage onComplete={context.complete} isComplete={context.isComplete}/>},
  {id:'C32',title:'可变形注意力：采样与汇聚',section:'视觉注意力拓展',revealMode:'cue',component:context=><AttentionDeformableLearningPage onComplete={context.complete} isComplete={context.isComplete}/>},
  {id:'C33',title:'回顾：换个任务识别注意力',section:'回顾与迁移',revealMode:'cue',component:context=><AttentionReviewPage onComplete={context.complete} isComplete={context.isComplete}/>},
];
