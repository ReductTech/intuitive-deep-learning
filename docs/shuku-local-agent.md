# 本地 Agent 创作

创建课程时选择“使用本地 Agent”，填写基本信息后复制或下载专属指令。首次仅准备项目，随后由用户和 Agent 讨论大纲、逐页创作。在我的课程、编辑器和我参与的共创中也可获取指令。

本地助手 scripts/shuku-local-agent.py 仅依赖 Python 标准库。先将凭证保存为 api_token，再读取项目：
python3 shuku-local-agent.py --origin <术库地址> --course <课程ID> pull
修改 source/ 和 project.json 后执行 push，再用 status 查看构建。既有本地文件不覆盖。网络失败保留幂等编号，冲突保留本地文件，在新目录读取服务器版本后人工合并。

接口使用 /api/shuku：
- POST /local-agent/courses：会话登录，新建课程并返回专属指令。
- POST /local-agent/courses/{id}/brief：会话登录，为本人已有课程或共创工作区签发指令。
- GET /local-agent/credentials、POST /local-agent/credentials/{id}/revoke：会话管理凭证。
- GET /local-agent/client：凭证读取标准库助手。
- GET /local-agent/courses/{id}/project：凭证读取当前草稿或最新修订与并发版本。
- POST /courses/{id}/revisions：凭证保存既有项目，必须同时提供 expected_revision、expected_draft 和 Idempotency-Key。
- GET /revisions/{id}：凭证查询本课程修订与构建结果。

不增加 ZIP 接收、包校验或新课程包存储。保存复用 Workflow.save_in、文件桶、Worker 构建、审核和发布。组织 GitHub App 建仓及私有工作区分支复用现有实现，用户无需绑定 GitHub。仅保存课程源码并不表示审核通过或正式发布。

凭证绑定账号和课程，30天有效，数据库只存摘要；一账号最多20个有效凭证；每门课程每分钟最多10次新保存，不能堆积未完成构建。只能访问上面列出的三类数据操作和助手下载，不能使用凭证审核、发布、删除或管理账号。网页草稿与修订使用双重 CAS；重复保存请求返回同一修订，永久删除清理凭证及幂等记录。

源码和素材范围沿用 docs/shuku-source-authoring.md。不将完整任意 npm 工程或 course-template 的 ZIP 接口包装成已支持。静态 externalSnapshot 仍需既有 GitHub 共创流程；尚未迁移到托管项目格式，不签发无效指令。原生模块改动实现需用托管 React 页面替代，单独修改本地原生组件不会改变服务器快照。

数据库升级为006_local_agent_authoring，显式 migrate 后启动服务。只增加两张带 shuku_ 前缀的表，不修改 idl_backend、现有课程源码或已有正式版本。

## 验证

- 后端完整回归及失败项复查、本地助手 HTTP 端到端、最小权限运行账号清理检查均通过。原生课程构建按足够的单任务资源限制串行验证。
- 前端模型15项、完整类型检查、锁定独立课程库的生产构建通过。
- scripts/check-shuku-local-agent.mjs：模拟 API 验证创建方式、指令分步展示与下载、本地继续创作、共创方式选择、凭证撤销和窄屏布局。
- scripts/check-shuku-categories.mjs：原有网页创建分类及自定义分类回归通过。
- 小内存服务器不并行执行完整前端构建和后端测试；完整前端构建可在开发机完成后部署 dist。
