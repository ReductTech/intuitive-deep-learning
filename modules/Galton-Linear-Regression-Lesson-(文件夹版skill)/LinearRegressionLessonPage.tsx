import { ModuleShell } from '../shared/react';
import { linearRegressionLessonUnits } from './lessonUnits';
import './linear-regression-lesson.css';

export function LinearRegressionLessonPage() {
  return (
    <ModuleShell
      title="从高尔顿的身高问题到损失函数"
      subtitle="先看见关系，再把直线的好坏变成一个可以优化的数字。"
      badge="线性回归 · 入门"
      shellClassName="grl-shell"
    >
      <div className="grl-guide-flow">
        {linearRegressionLessonUnits.map((unit) => (
          <section className="grl-guide-step" id={`grl-${unit.id}`} key={unit.id} data-unit-id={unit.id}>
            {unit.render('guide')}
          </section>
        ))}
      </div>
    </ModuleShell>
  );
}
