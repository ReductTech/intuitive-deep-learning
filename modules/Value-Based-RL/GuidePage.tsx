import { Button, ModuleShell, LessonFlow } from '../shared/react';
import { scenes } from './course';
import { GuideCanvas } from './components/GuideCanvas';
import '../shared/react/presentation.css';
import './valueBasedRl.css';
const steps = scenes.map((scene, index) => ({
  id: scene.id, completesLesson: index === scenes.length - 1,
  render: (context: Parameters<typeof scene.render>[0]) => <div className="vbrl-guide-step"><GuideCanvas>{scene.render(context)}</GuideCanvas>{!context.isComplete && <Button onClick={context.complete}>{index === scenes.length - 1 ? '完成本课' : '继续下一页'}</Button>}</div>,
}));
export function GuidePage() {
  return <ModuleShell title="Value-based 强化学习：机器人送货" subtitle="基于价值的强化学习估计状态与动作的长期价值，并据此选择动作。" shellClassName="course-blog-shell vbrl-shell"><LessonFlow steps={steps} persistenceKey="value-based-rl-guide-v1" /></ModuleShell>;
}
