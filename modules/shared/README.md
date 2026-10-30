# 共享基础模块

`modules/shared` 提供各课程共用的组件、样式和运行能力，不包含课程专属内容。默认禁止修改本文件夹下内容。

## UI Kit

- **网页预览**：运行 `npm run dev` 后，在浏览器访问 [http://localhost:5173/shared/ui-kit](http://localhost:5173/shared/ui-kit)，查看控件、排版、公式、图表和交互示例。这是网页路由，注册在 [src/app/routes.tsx](../../src/app/routes.tsx)。
- **组件入口**：[react/index.ts](react/index.ts)，统一导出 `Typography`、`Button`、`Select`、`ContentBlock` 等组件。
- **样式与主题**：[react/styles.css](react/styles.css) 提供基础样式，[react/typography/](react/typography/) 管理字体规范，[react/theme.ts](react/theme.ts) 定义主题。
- **展示页**：[UiKitPage.tsx](react/routing/UiKitPage.tsx) 和 [ui-kit.css](react/ui-kit.css) 用于组件总览；课程无需为了使用控件而引入展示页样式。

## 目录

| 目录 | 用途 |
| --- | --- |
| `react/` | 通用布局、控件、教学组件、可视化及 术库 播放器 |
| `vendor/` | 本地第三方浏览器库，详见[依赖说明](vendor/README.md) |

## 使用约定

- **单向依赖**：课程可以引用 Shared；Shared 不得引用课程代码、课程 ID 或专属类名。
- **课程自己管理内容**：页面、大纲、状态、讲稿和专属样式留在课程目录；素材放在 `assets/<模块 UUID>/`，通过 `moduleAssetUrl` 引用。
- **优先复用规范**：文字使用 `Typography`，颜色等样式使用 `--ui-*` 变量；通用组件负责自己的样式，页面布局留在页面旁。
- **播放入口保持轻量**：课程向 `SceneDeck` 提供页面目录、稳定的 `progressKey` 和可选讲稿，不把课程逻辑放进播放器。

## 独立课程分发

课程及共享组件仍在本仓库 develop 分支编辑，已提交的新增和修改会单向同步到 reduct-shuku/intuitive-deep-learning 的 main。平台按锁定快照读取课程；业务与计算 API 由平台提供。目标旧默认分支保存在 back，请勿在分发仓库直接编辑课程。
