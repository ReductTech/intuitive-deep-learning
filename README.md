# Intuitive Deep Learning

本仓库保存课程源码、大纲、素材和课程共享组件。每个 `modules/<UUID>/` 是一门完整课程，`pages/` 是课程页面；模块目录名、`outlines.json.id` 和 `moduleIdentity.id` 必须一致，可读名称保存在 `alias`。当前 30 份大纲，29 门可构建，1 门大纲草稿。

## 检查与构建在术库执行

统一的 npm 依赖、检查脚本、构建脚本、运行时适配、媒体优化工具已经迁到 **Shuku/tooling/course-build/**。本仓库不再提供根目录 npm 构建工程。已有 node_modules、dist 或缓存只是历史本地产物，不作为新流程输入，也不提交 Git。

先在术库的 `shuku.json` 配置 `course_build.source_root`（本仓库）和 `course_build.output_root`（产物目录）；相对路径相对于该配置文件。然后在 Shuku 执行：

```powershell
python run.py courses-install
python run.py courses-list
python run.py courses-check
python run.py courses-build --module basic-example
python run.py courses-build
python run.py courses-test
```

需要 Node.js 24。只修改课件时，不需要在本仓库安装 npm 依赖。源码只由术库构建进程读取，展示端始终只读取构建产物。新建课程可参考 `modules/1a8e20a6-6e70-4d1d-8830-3b6b9a34ffed/`，复制为新课程或独立页面时生成新的 UUID，页面文件名继续使用可读语义名称。

## 产物与版本

每门课程输出到 `<output_root>/<课程UUID>/<构建SHA-256>/`，包含入口 HTML、编译后 JS/CSS、素材、`course.json` 和 `artifact-manifest.json`。只将完成的版本原子移动到正式目录；失败构建不替换旧版本。术库按配置的间隔重新识别目录并刷新课程列表，无需重新构建网站或重启 API。

所有已实现课程都保留，包括 AI Practice、SPP、研究汇报与创作指南；只有大纲的课程不伪装成可播放课程。模型、GPU 等互动仍需要对应的外部服务。

素材使用模块 UUID 和逻辑路径引用。清单保留最终字节的 SHA-256、大小、MIME 及内容对象键；相同字节可共享对象。课程共用组件在 `modules/shared/`，本次构建工具迁移未修改它们。

历史迁移信息见 `docs/MIGRATION.md`。课程内的教学示例、计算代码及随课程维护的局部验证资料保留；平台账号、数据库、审核、发布和执行队列归术库管理，Creator Skill 保持独立。

## 页面身份约定

页面的 `id` 统一为一次生成并持久保存的 UUID v4。改标题、讲稿、源码文件名、内容或显示顺序均保留原 UUID；只有新增独立页面或复制为独立页面时生成新 UUID。UUID 不从标题、文件路径或数组下标推导，也不在渲染时生成。

`outlines.json.pages` 保存页面元数据（包括 `id`、`title`、`snippet`）及课程内的编排顺序；源码渲染注册、PPT 场景、自学步骤、页面跳转和讲稿索引引用同一 UUID。序号仅用于显示。内嵌课件副本具有独立的页面身份，局部登记在 `outlines.json` 或 `pages.json`，不注册为顶层课程。数据库及课程和页面的关系表由术库负责。

一次性旧 ID 对照保存在 `docs/PAGE_UUID_MIGRATION.json`，仅供迁移数据库、旧链接和学习进度；课程运行时不依赖此对照文件。旧的已发布产物保持原有身份，本次源码变更不会修改或重新发布它们。后续发布新版本时需在术库侧按课程和页面作用域迁移旧记录，不能只按旧页面 ID 全局匹配。
