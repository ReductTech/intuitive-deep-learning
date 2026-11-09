import { AttentionDeformablePage } from './pages/AttentionDeformablePage/AttentionDeformablePage';
import { AttentionReviewPage } from './pages/AttentionReviewPage/AttentionReviewPage';
import { AttentionDeformableSamplingPage } from './pages/AttentionDeformableSamplingPage/AttentionDeformableSamplingPage';
import { AttentionDeformableLearningPage } from './pages/AttentionDeformableLearningPage/AttentionDeformableLearningPage';
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
import type { LessonFlowRevealMode, LessonStepContext } from "@shuku/course-style/react";
import { AttentionObservationCoverPage } from './pages/AttentionObservationCoverPage/AttentionObservationCoverPage';
import { AttentionGorillaExperimentPage } from './pages/AttentionGorillaExperimentPage/AttentionGorillaExperimentPage';
import { AttentionQueryPage } from './pages/AttentionQueryPage/AttentionQueryPage';

import { AttentionQkvPage } from './pages/AttentionQkvPage/AttentionQkvPage';

import { AttentionDotProductPage } from './pages/AttentionDotProductPage/AttentionDotProductPage';

import { AttentionProjectionPage } from './pages/AttentionProjectionPage/AttentionProjectionPage';

export const ATTENTION_MODULE_ID = 'attention-mechanism';
export const ATTENTION_PROGRESS_ID = 'attention-mechanism-campus-v1';

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
    id: 'e114bde9-6373-45c0-ab0e-acdfadc9a972',
    title: '帮小明数清传球',
    section: '任务与注意力',
    revealMode: 'cue',
    component: (context) => <AttentionGorillaExperimentPage onComplete={context.complete} isComplete={context.isComplete} />,
  },
  {
    id: 'b1e906b5-6939-48f0-87b5-caba60d2f85f',
    title: '同一段录像，留下了哪些信息？',
    section: '任务与注意力',
    revealMode: 'cue',
    component: (context) => <AttentionObservationCoverPage onComplete={context.complete} isComplete={context.isComplete} />,
  },
  {
    id: '209a9404-d3bb-4f04-8667-faa6108edb15',
    title: '同一份记录，问题不同、关注不同',
    section: '任务与注意力',
    revealMode: 'cue',
    component: (context) => <AttentionQueryPage onComplete={context.complete} isComplete={context.isComplete} />,
  },
  {
    id: 'cae3a855-d8dd-43e5-bef2-41fb7bee1f24',
    title: '用权重表示关注程度',
    section: '问题与匹配',
    revealMode: 'cue',
    component: (context) => <AttentionQkvPage onComplete={context.complete} isComplete={context.isComplete} />,
  },
  {id:'4f38d7eb-d5cd-46b4-a6a0-cad581f69a9a',title:'Q、K、V：问题、索引与内容',section:'问题与匹配',revealMode:'cue',component:context=><AttentionKeyValuePurposePage onComplete={context.complete} isComplete={context.isComplete}/>},
  {
    id: '916fb6b2-8765-46ed-9594-134b284ec38a',
    title: '点积评分：方向和长度的作用',
    section: '匹配评分',
    revealMode: 'cue',
    component: (context) => <AttentionDotProductPage onComplete={context.complete} isComplete={context.isComplete} />,
  },
  {
    id: '1193b399-85f6-4614-ab9b-135bcc87e24f',
    title: '匹配评分：点积与加性',
    section: '匹配评分',
    revealMode: 'cue',
    component: (context) => <AttentionProjectionPage onComplete={context.complete} isComplete={context.isComplete} />,
  },
  {id:'a64ebbbe-afbb-437b-badf-6e85e90c384b',title:'Softmax：把分数变成权重',section:'注意力分配',revealMode:'cue',component:context=><AttentionSoftmaxPage onComplete={context.complete} isComplete={context.isComplete}/>},
  {id:'fe1fcc61-df6a-4342-9652-56b355031fc1',title:'缩放点积：控制分数尺度',section:'注意力分配',revealMode:'cue',component:context=><AttentionScalingPage onComplete={context.complete} isComplete={context.isComplete}/>},
  {id:'045a8c1a-245d-47e1-a7e3-9dcf4f567e14',title:'活动记录：注意力的完整计算',section:'注意力分配',revealMode:'cue',component:context=><AttentionRedistributionPage onComplete={context.complete} isComplete={context.isComplete}/>},
  {id:'741693a4-f9ac-441b-99f8-49372a4d5098',title:'补全队员位置：参考哪些时刻',section:'注意力回归',revealMode:'cue',component:context=><AttentionRegressionIntroPage onComplete={context.complete} isComplete={context.isComplete}/>},
  {id:'cae3726d-40e4-4bfa-80c9-89bcdc665284',title:'同一批记录，怎样补全整段轨迹',section:'注意力回归',revealMode:'cue',component:context=><AttentionRegressionCurvePage onComplete={context.complete} isComplete={context.isComplete}/>},
  {id:'f9fc90f6-32ac-4372-98c5-b380dd215b30',title:'用已知记录，学习参考范围',section:'注意力回归',revealMode:'cue',component:context=><AttentionRegressionTrainingPage onComplete={context.complete} isComplete={context.isComplete}/>},
  {id:'da29608a-4079-4314-af54-a4637bf08d4b',title:'把每个时刻的读取比例排成热图',section:'注意力回归',revealMode:'cue',component:context=><AttentionRegressionHeatmapPage onComplete={context.complete} isComplete={context.isComplete}/>},
  {id:'5c63308a-629f-4c68-bc8e-5cf46014d5ec',title:'翻译讲解稿：每一步读取什么？',section:'注意力翻译',revealMode:'cue',component:context=><AttentionTranslationContextPage onComplete={context.complete} isComplete={context.isComplete}/>},
  {id:'2d12bcb6-0ae4-49a7-ad8d-d29aff9da042',title:'填充掩码：不给占位符分配权重',section:'注意力翻译',revealMode:'cue',component:context=><AttentionPaddingMaskPage onComplete={context.complete} isComplete={context.isComplete}/>},
  {id:'62af0521-4fc8-474b-8713-ad7b6d37d187',title:'翻译模型：编码、读取与解码',section:'注意力翻译',revealMode:'cue',component:context=><AttentionTranslationStructurePage onComplete={context.complete} isComplete={context.isComplete}/>},
  {id:'6c8f5db6-d35a-41d4-9f20-d5ca34f23eb2',title:'一步解码：从读取到译词',section:'注意力翻译',revealMode:'cue',component:context=><AttentionDecodingStepPage onComplete={context.complete} isComplete={context.isComplete}/>},
  {id:'d1359b7b-1189-487d-b9d3-a7761ea6122b',title:'训练与生成：前词从哪里来',section:'注意力翻译',revealMode:'cue',component:context=><AttentionTeacherForcingPage onComplete={context.complete} isComplete={context.isComplete}/>},
  {id:'cdcfa315-6b76-429d-8ca2-8ddca2de861e',title:'训练讲解稿：读取比例怎样变化',section:'注意力翻译',revealMode:'cue',component:context=><AttentionTranslationTrainingPage onComplete={context.complete} isComplete={context.isComplete}/>},
  {id:'c08309cf-47be-4489-9ddd-2b3b837ac4fa',title:'留出讲解句：再检查一次翻译',section:'注意力翻译',revealMode:'cue',component:context=><AttentionTranslationResultsPage onComplete={context.complete} isComplete={context.isComplete}/>},
  {id:'84716099-9bb5-40a7-a2ac-5ee941c03e4f',title:'同一幅画面，读取范围有多大',section:'视觉注意力拓展',revealMode:'cue',component:context=><AttentionDeformablePage onComplete={context.complete} isComplete={context.isComplete}/>},
  {id:'bac295f5-eddf-4103-81aa-1d867f69ad15',title:'窗口与可变形采样：参考位置怎样变化',section:'视觉注意力拓展',revealMode:'cue',component:context=><AttentionDeformableSamplingPage onComplete={context.complete} isComplete={context.isComplete}/>},
  {id:'44e23191-281d-4b0e-a14b-ad51e04b5934',title:'采样与汇聚：先读附近，再合成结果',section:'视觉注意力拓展',revealMode:'cue',component:context=><AttentionDeformableLearningPage onComplete={context.complete} isComplete={context.isComplete}/>},
  {id:'eed3eaaf-465f-4394-a346-0be743a531d8',title:'回顾：把活动材料串成讲解',section:'回顾与迁移',revealMode:'cue',component:context=><AttentionReviewPage onComplete={context.complete} isComplete={context.isComplete}/>},
];
