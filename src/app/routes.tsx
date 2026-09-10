import { ContentBlock, ModuleShell } from '../../modules/shared/react';
import { GaltonPresentationSpikePage } from '../../modules/Galton-Linear-Regression/presentation-spike/GaltonPresentationSpikePage';
import { UiKitPage } from '../../modules/shared/react/routing/UiKitPage';
import { LinearRegressionLessonPptSlidePage } from '../../modules/Galton-Linear-Regression-Lesson/LinearRegressionLessonPptSlidePage';
import { NeuronPptSlidePage } from '../../modules/Neuron-Guide/NeuronPptSlidePage';
import { activeModules } from './modules';
import { AppLink, type AppRoute } from './Router';

const blockPreviews = [
  { id: 'grl-opening', moduleId: 'galton-linear-regression-lesson', title: '高尔顿的身高问题', description: '从真实历史问题提出“如何预测孩子身高”。', path: '/modules/galton-linear-regression-lesson' },
  { id: 'grl-ppt', moduleId: 'galton-linear-regression-lesson', title: 'Web PPT 课件', description: '按页播放高尔顿、散点、模型、残差与损失。', path: '/web-ppt/linear-regression-lesson' },
];

function HomePage() {
  return <ModuleShell title="Intuitive Deep Learning" subtitle="从真实问题出发，逐步建立可解释的数学模型。" shellClassName="app-home-shell">
    <section className="app-course-directory" aria-labelledby="app-course-directory-title">
      <header className="app-course-directory__head"><div><span className="app-course-directory__kicker">COURSE DIRECTORY</span><h2 id="app-course-directory-title">课程模块</h2></div><p>选择一个课程，进入完整学习流程或 Web PPT。</p></header>
      <div className="app-course-accordion">{activeModules.map((module, moduleIndex) => { const lessons = blockPreviews.filter((block) => block.moduleId === module.id); return <details className="app-course-group" key={module.id} open><summary className="app-course-group__summary"><span className="app-course-group__index">{String(moduleIndex + 1).padStart(2, '0')}</span><span className="app-course-group__copy"><strong>{module.title}</strong><span>{module.description}</span></span><span className="app-course-group__count">{lessons.length} 个入口</span><span className="app-course-group__chevron" aria-hidden="true" /></summary><div className="app-course-group__body"><AppLink className="app-course-launch" to={module.path}><span className="edu-badge">{module.badge}</span><span><strong>进入完整课程</strong><small>按教学顺序连续学习全部内容</small></span><em>开始学习 →</em></AppLink><ol className="app-course-lessons">{lessons.map((lesson, index) => <li key={lesson.id}><AppLink className="app-course-lesson" to={lesson.path}><span className="app-course-lesson__number">{String(index + 1).padStart(2, '0')}</span><span className="app-course-lesson__copy"><strong>{lesson.title}</strong><small>{lesson.description}</small></span><span className="app-course-lesson__arrow" aria-hidden="true">→</span></AppLink></li>)}</ol></div></details>; })}</div>
    </section>
    <ContentBlock className="app-developer-tools" title="开发工具" subtitle="共享组件检查与 Web PPT 播放入口。"><div className="app-developer-tools__grid"><AppLink className="app-ui-kit-card" to="/shared/ui-kit"><span className="edu-badge">设计系统</span><strong>Shared UI Kit</strong><span>检查共享组件、流程控制和题型。</span><em>打开 →</em></AppLink><a className="app-ui-kit-card" href="/web_ppt/"><span className="edu-badge">演示入口</span><strong>Web PPT</strong><span>播放 React 课件或本地 PPT。</span><em>打开 →</em></a></div></ContentBlock>
  </ModuleShell>;
}

export const appRoutes: AppRoute[] = [
  { path: '/', element: <HomePage /> },
  { path: '/presentation-spike', element: <GaltonPresentationSpikePage /> },
  { path: '/shared/ui-kit', element: <UiKitPage /> },
  { path: '/web-ppt/neuron', element: <NeuronPptSlidePage /> },
  { path: '/web-ppt/linear-regression-lesson', element: <LinearRegressionLessonPptSlidePage /> },
  { path: '/web_ppt/', element: <LinearRegressionLessonPptSlidePage /> },
  { path: '/web_ppt/slide.html', element: <LinearRegressionLessonPptSlidePage /> },
  ...activeModules.map(({ path, element }) => ({ path, element })),
];
