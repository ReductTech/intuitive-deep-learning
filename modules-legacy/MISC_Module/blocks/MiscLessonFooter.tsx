import { LessonFooter } from '../../shared/react';

export function MiscLessonFooter() {
  return <LessonFooter className="misc-block" title="本节学习完成" description="你已经理解 Batch、Step 与 Epoch 如何共同描述训练进度。" back={{ href: '../CourseMap/', label: '返回课程主页' }} />;
}
