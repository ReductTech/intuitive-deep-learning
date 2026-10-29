# 本地 Agent 创作工程

新课和 React／原生课程的私有共创，使用与 Demo 相同的完整 `reduct-shuku/course-template`。不需要个人 Fork 或绑定 GitHub。

## 使用流程

1. 在术库重新获取本地创作专属指令，保存凭证并下载客户端。
2. 执行指令中的 `prepare`。新课取得标准工程；共创取得所选基础版本的原课程模块和素材。框架包含公共组件、创作规范、视觉样例、检查工具、安装与预览环境。
3. 准备完成后等待用户提出创作要求，再讨论大纲和逐页设计。只修改 `shuku-state.json` 指定的课程目录，其他模板示例不参与上传。
4. 本地执行 `npm --prefix environment/frontend ci`，再运行 `npm --prefix environment/frontend run dev` 预览。
5. 执行 `python3 shuku-local-agent.py push` 保存修订，`status` 查看构建结果；回网页预览并提交审核或共创建议。

已有工程不会被 `prepare` 覆盖。旧客户端的 `pull / push / status` 继续可用；切换标准工程时使用新目录，确认后再合并自己的本地修改。不要把凭证、状态文件、依赖目录或框架上传到 GitHub。

## 开发与部署

- `local-authoring.lock.json` 固定模板版本；后端 `AUTHORING` 必须一致。构建机执行 `npm run authoring:prepare`，将固定提交放在 `.authoring-template/<commit>/`（已有可信模板副本时可加 `-- --from /path/to/course-template`），不在请求处理中安装或克隆依赖。
- 标准工程保留 `courses/modules/...`、`outlines.json`、PPT `deck`、原自学页面入口和素材。客户端转换为现有 `project.source.files`，原生修改上传真实实现；`sourceGuideEntry` 保留自学入口，复用原完整自学页和原播放器；保留固定创作框架版本、页面 ID、`nativeSnapshot`、网页草稿及修订冲突检查。
- 公共组件由固定模板提供，支持已安装的 React、React DOM、three、@icon-park/react、lucide-react。源码解析器支持课程文件内的静态页面索引，页面 CSS 使用与本地预览一致的固定画布断点；仍阻止任意包、服务器文件和目录越界。
- 新素材以 data URL 编码进入修订；未改的原生大素材复用公开固定快照，经仅限素材的流式接口读取，不转成官方最新版。私有修改不进入此公开接口。
- 限额：500 个文件，文本单文件 1 MiB，新素材编码单文件 8 MiB，总源码和新素材编码 12 MiB；原生未改的大素材不占上传额度。框架和 node_modules 不属于课程包。
- 预览继续使用沙箱，不能访问父页面或跨站网络；同源公开素材、内嵌图片/字体/脚本用于课程展示。保存不自动审核、发布或修改官方课程。

独立组织目录收录的纯静态 HTML 快照仍按原有静态发布契约处理，本次不自动转换其 HTML 为 React 源码。

## 验证

后端：`test_local_agent_template.py`、`test_local_agent.py`、`test_source.py`、构建进程清理测试。源码解析器：`node --test scripts/shuku-source-plugin.test.mjs`。

真实工程验收：准备固定模板缓存和原生快照后，运行 `scripts/prepare-authoring-parity-fixtures.py`；将输出项目交给 `build-shuku-preview.mjs`，再运行 `check-local-authoring-parity.mjs`，验证公共组件、交互、Tailwind、普通图片及修改后的原课程页面。
