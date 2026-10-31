# Memory Test

<!-- module-structure:start -->
## 模块入口与目录约定

- 课程 ID：`memory-test`；连续阅读入口：`/modules/memory-test` → `GuidePage.tsx`。
- 已实现页面索引：`outlines.json` 的 `pages`（4 页）。
- 此模块目前提供单一入口；不注册尚未实现的 PPT。
- 页面布局与页面样式放在 `pages/`；模块内复用交互放在 `components/`；数据、模型和服务按需分目录。
- 专属素材归当前模块 `assets/`；共享能力只引用 `modules/shared/`，不依赖其他课程或 `modules-legacy/`。
- 教学画布为 1600×900；独立文字使用 Shared Typography；入口不复制播放器。
- 从仓库根目录运行 `npm run dev`，检查运行 `node modules/check-module-structure.mjs` 与 `npm run typecheck`。
<!-- module-structure:end -->

访问 `/modules/memory-test`。这是一个只用于宿主网站嵌入联调的假课程：三个交互页和一个结束页，包含选择题、简答题、按钮、滑块、开关、短视频与星级评分。

操作会由 `memoryBridge.ts` 直接调用当前课程页的 `window.__growAgentIpc.reportSkillMemory({ skill_id, content })`。`skill_id` 沿用 `intuitive-deep-learning`，`content` 是单条 JSON 测试事件；包含 `event_id`、`run_id`、`module_id=memory-test`、`page_id`、事件名、时间和属性，不包含用户 ID。页面顶部显示每次调用的等待、成功或失败状态。这里没有本机 SQLite、`sync/pending` 或 `sync/ack`。

顶部“调用 skillMemoryList”用于手动读取验证。仓库没有这个接口的参数契约，输入框可以修改传入的 JSON 对象，页面会展示原始返回或错误。`ok=true` 只说明写入接口报告成功；用户归属与实际可查询内容仍需在宿主的真实登录环境确认。

如果课程放在 iframe 中，宿主必须确保桥接脚本在 **iframe 自己的 `window`** 中提供 `__growAgentIpc`；仅在父页面上提供同名变量不能让本页直接调用。页面会显示“未找到”及明确失败原因，方便判断这一点。

根 `index.html` 会在旧 telemetry 脚本前为此测试路由建立空状态适配器，屏蔽旧的本地传输，供 Shared `Question`、`PageRating` 组件使用；其他模块仍走原来的传输。此测试模块的写入全部由 `memoryBridge.ts` 执行。
