# 雨花弄：变脸

保留原游戏的画面、对白、剧情顺序、乔装工具、相似度检测、搜查、重试和结算，以及完整关卡编辑器。

## 目录与维护位置

| 目录 / 文件 | 用途 |
| --- | --- |
| `index.ts` | 课程页面使用的公共接口 |
| `entry.ts` | 独立页面启动器，按入口加载游戏或编辑器 |
| 三个根目录 HTML | 游戏、关卡编辑器、调试入口，保留原网址 |
| `data/level.js` | 地图、素材清单、碰撞、角色路线与关卡配置；由关卡编辑器保存 |
| `data/story.js` | 剧情对白与段落数据 |
| `data/videos.ts` | 结算推荐视频 |
| `player/` | 游戏页面模板、样式、启动与文档组装；`html.ts` 为两个入口共用的组装工具 |
| `editor/` | 独立关卡编辑器及其模板、样式、文档组装 |
| `runtime/core.js` | 场景生命周期、碰撞、角色动画、寻路与移动 |
| `runtime/ui.js` | 对话、相似度条与按钮 |
| `runtime/disguise-paint.js` | 画笔、图像渲染、光标 |
| `runtime/disguise-editor.js` | 乔装状态、默认参数与工具操作 |
| `runtime/services.js` | 模型请求、防抖、取消、响应校验 |
| `runtime/story-view.js` | 黑幕、通缉令、结算与教学画面 |
| `runtime/story-flow.js` | 角色轨道与开场、乔装、搜查、重试流程 |
| `runtime/scene.js` | Phaser 场景，负责装配各系统 |

运行代码按职责合并为八个文件。文件内部用命名段落和局部作用域保留各系统的边界，共用一次命名空间初始化；不改绘制坐标、颜色或动画参数。游戏与编辑器共用关卡数据，普通游戏入口不加载关卡编辑器代码。模板和样式独立存放，不再夹在 TypeScript 的长字符串中。

## 启动与关卡编辑

运行仓库的 `npm run dev` 后访问：

- 游戏：`/modules/Visual-Feature-Learning/game/index.html`
- 关卡编辑器：`/modules/Visual-Feature-Learning/game/level-editor.html`
- 调试入口：`/modules/Visual-Feature-Learning/game/game-debug.html`

课程入口为 Guide 最后一页和 SceneDeck 的 `disguise-verification`。三个 HTML 均加入 Vite 生产构建。游戏运行于独立 iframe，重新开始或离开页面会释放实例。

编辑器保留七段剧情、角色轨道、坐标与路径、地图拖动缩放、网格吸附、前景/碰撞显示、预览时间轴、撤销/重做、JSON/JS 导入导出与草稿恢复。

“保存配置 JS”生成 `level.js`，将其保存或覆盖到 `data/level.js`，刷新游戏生效；部署环境修改后需重新构建。JSON 导出用于备份或继续编辑，不能直接替代 JS 配置。草稿键仍为 `visual-feature-learning-yuhuanong-editor-v1`，导出的素材路径保持相对路径。

## 素材与模型服务

素材位于仓库根目录 `assets/80396753-7fc8-4f55-9188-bddbdb828169/yuhuanong/`，资源地址由 Shared 的 `moduleAssetUrl` 生成，支持 `VITE_ASSET_BASE_URL`。Phaser 复用 Shared vendor，无归档目录运行时依赖。

相似度检测沿用 `POST http://127.0.0.1:59415/face-recog/embedding-similarity`，需要仓库的 `scripts/http_service.py` 与 InsightFace 服务。服务不可用时显示原有不可用状态，不提供假分数。切换妆容会废弃旧识别结果，退出场景会取消等待和请求；搜查检测失败时返回乔装界面并保留妆容。
