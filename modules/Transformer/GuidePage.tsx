import { LessonFlow, ModuleShell } from '../shared/react';
import { transformerLessonSteps } from './course';

export function GuidePage() {
  return <ModuleShell className="tr-root" shellClassName="tr-shell" title="Transformer 入门" subtitle="从机器翻译理解注意力机制的应用" badge="互动课程">
    <LessonFlow steps={transformerLessonSteps} persistenceKey="transformer-course-v9" />
  </ModuleShell>;
}
