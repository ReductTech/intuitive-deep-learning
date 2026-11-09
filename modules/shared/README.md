# Shared 默认风格包

Shared 只维护课程的视觉呈现和控件交互：字体、配色、布局、公式、图表、自学教学组件以及 PPT 播放器界面。它不实现平台通信、资源寻址、课程状态存储或播放协议。

- 课程使用 `@shuku/course-style/react` 导入组件，使用 `@shuku/course-style/react/styles.css` 导入样式。
- 资源、请求、状态和页面编排直接从 `@shuku/course-runtime/react/...` 导入；Shared 不再转发这些内核接口。
- PPT 界面使用内核的 `useCoursePlayback`；教学组件可以调用内核保存答案、进度和评分，交互外观与展示方式仍由风格决定。
- `react/routing/UiKitPage.tsx` 是可复用的控件展示组件，不自动注册旧站点 `/shared/ui-kit` 路由。
- `react/learning/reviewShortAnswer.ts` 只把内核返回的评阅结果转换为本风格的反馈文字和色调。
- 本包没有桌面智能体 Telemetry、技能记忆同步、旧 HTTP 上报或全局 DOM 操作采集。

`style.json` 声明风格身份和入口，`bootstrap.ts` 加载风格字体与 CSS。平台构建器负责别名解析及本地预览；上传时可以携带完整 Shared，也可以不携带，由平台提供默认风格。

平台默认副本位于 Shuku 的 `packages/course-styles/default`；IDL 的 `modules/shared` 用于课程仓库编辑。修改默认风格时应同步两份源码。已发布课件使用构建时固定的风格快照，修改源码需重新构建发布才会生效。
