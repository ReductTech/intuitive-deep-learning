import { ContentBlock, ModuleShell } from '../../modules/shared/react';
import { UiKitPage } from '../../modules/shared/react/routing/UiKitPage';
import { activeModules, type ActiveModule, type ModulePageOutline } from './modules';
import { AppLink, type AppRoute } from './Router';

// 通用 SceneDeck 演示入口默认交给声明了 ppt.player 的模块，其次是第一个提供 PPT 的模块。
const pptPlayerModule = activeModules.find((module) => module.claimsPptPlayer) ?? activeModules.find((module) => module.pptElement);

/** 页面索引中的每一页对应 PPT 的一页；没有 PPT 的模块指向课程本身。 */
function pageHref(module: ActiveModule, page: ModulePageOutline) {
  return module.pptPath ? `${module.pptPath}?slide=${encodeURIComponent(page.id)}` : module.path;
}

function HomePage() {
  return <ModuleShell title="Intuitive Deep Learning" subtitle="从真实问题出发，逐步建立可解释的数学模型。" shellClassName="app-home-shell">
    <section className="app-course-directory" aria-labelledby="app-course-directory-title">
      <header className="app-course-directory__head"><div><span className="app-course-directory__kicker">COURSE DIRECTORY</span><h2 id="app-course-directory-title">课程模块</h2></div><p>选择一个课程，进入完整学习流程或 SceneDeck。</p></header>
      <div className="app-course-accordion">{activeModules.map((module, moduleIndex) => <details className="app-course-group" key={module.id} open><summary className="app-course-group__summary"><span className="app-course-group__index">{String(moduleIndex + 1).padStart(2, '0')}</span><span className="app-course-group__copy"><strong>{module.title}</strong><span>{module.description}</span></span><span className="app-course-group__count">{module.pages.length} 页</span><span className="app-course-group__chevron" aria-hidden="true" /></summary><div className="app-course-group__body"><AppLink className="app-course-launch" to={module.path}><span className="edu-badge">{module.badge}</span><span><strong>进入完整课程</strong><small>按教学顺序连续学习全部内容</small></span><em>开始学习 →</em></AppLink>{module.pages.length > 0 && <ol className="app-course-lessons">{module.pages.map((page, index) => <li key={page.id}><a className="app-course-lesson" href={pageHref(module, page)}><span className="app-course-lesson__number">{String(index + 1).padStart(2, '0')}</span><span className="app-course-lesson__copy"><strong>{page.title}</strong><small>{page.goal ?? page.summary}</small></span><span className="app-course-lesson__arrow" aria-hidden="true">→</span></a></li>)}</ol>}</div></details>)}</div>
    </section>
    <ContentBlock className="app-developer-tools" title="开发工具" subtitle="共享组件检查与 SceneDeck 演示入口。"><div className="app-developer-tools__grid"><AppLink className="app-ui-kit-card" to="/shared/ui-kit"><span className="edu-badge">设计系统</span><strong>Shared UI Kit</strong><span>检查共享组件、流程控制和题型。</span><em>打开 →</em></AppLink><a className="app-ui-kit-card" href="/scenedeck/"><span className="edu-badge">SceneDeck</span><strong>SceneDeck 播放器</strong><span>用固定 1600 × 900 场景播放课程。</span><em>打开 →</em></a></div></ContentBlock>
  </ModuleShell>;
}

export const appRoutes: AppRoute[] = [
  { path: '/', element: <HomePage /> },
  { path: '/shared/ui-kit', element: <UiKitPage /> },
  ...activeModules.flatMap((module) => [
    { path: module.path, element: module.element },
    ...(module.pptPath && module.pptElement ? [{ path: module.pptPath, element: module.pptElement }] : []),
  ]),
  ...(pptPlayerModule?.pptElement ? [
    { path: '/scenedeck/', element: pptPlayerModule.pptElement },
    { path: '/web_ppt/', element: pptPlayerModule.pptElement },
    { path: '/web_ppt/slide.html', element: pptPlayerModule.pptElement },
  ] : []),
];

