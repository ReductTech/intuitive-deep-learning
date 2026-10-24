# T07：GitHub 对接与恢复

实现只位于 `backend/src/shuku_backend/`；不修改原 `idl_backend`，不读取 Demo 的业务数据库。

## 运行流程

1. **新建**：数据库记录课程和创建任务；Worker 在配置的组织创建专属私有仓库，保存安装 ID、仓库 ID 和初始提交。
2. **提交共创**：固定本人修订及最初选择的正式版本。对比 Git 文件树，复用未变化的 Blob，上传新增／修改文件，记录删除项，创建审核分支与真实 PR。
3. **合并**：先完成术库审核／评分，再执行远程合并。核对仓库 ID、PR 头提交、基础提交、合并提交的两个父提交及官方分支可达性；通过后才生成术库待发布版本。
4. **发布**：固定提交创建 `vX.Y.Z` Tag 和 Release，核对说明及修订标记、仓库可见性，再切换术库正式版。失败保留原正式版；重复请求复用原任务。
5. **清理**：独立任务删除已合并的术库审核分支。仅操作 `shuku-review/<课程 UUID>/<修订 UUID>`，删除前核对头提交。清理失败不会回滚已核验成功的发布，可单独重试。
6. **反馈**：站内反馈先入库并通知管理者；任务创建 Issue。UUID 标记用于超时后的查重，周期校准保存 Issue 开关状态，消息已读不等于问题解决。
7. **治理**：下架同步私有化；恢复草稿仍保持私有，恢复正式课程才公开。永久删除先确认远程删除，再清本地记录与无引用对象。本人工作区删除只关闭其 PR／删除已登记的审核分支。

当前迁移的创作内容是项目数据和冻结运行产物，写入仓库的 `courses/`；作者对话、撤销历史及设计参考图不进入公开内容。共创编辑阶段仍使用服务器上的私有工作区，提交建议时才建立官方审核分支。任意 React／TSX 源码托管编辑属于 T03 后续工作。

## 配置与启动

安装 `backend[shuku]`，其中包含 `psycopg` 和用于 RS256 签名的 `cryptography`。先显式执行迁移，再启动服务；新增迁移为 `006_github.sql`、`007_external_revision.sql`。

`SHUKU_GITHUB_CONFIG` 指向服务端配置文件，兼容 Demo 字段：

| 字段 | 用途 |
| --- | --- |
| `appId`、`privateKeyPath` | App JWT；私钥始终只读本机文件 |
| `installationId`、`owner` | 专属私有仓库的安装与组织 |
| `webhookSecret` | Webhook 原始请求体验签 |

可复用 Demo 的配置路径 `/home/ecs-assist-user/shukuDemo_server-data/github-config.json`。配置、私钥和 Token 不提交到仓库；运行账号需有读取权限。未配置时继续支持本地演示；已经绑定 GitHub 的课程不会在配置失效时退回本地假成功。

需要组织仓库创建权限，以及 Contents、Pull requests、Issues、Administration 读写和 Metadata 读取。运行时按仓库 ID 申请安装令牌；令牌只缓存在内存，不进入业务表和日志。

Webhook：`POST /api/shuku/github/webhook`，订阅 `pull_request`、`push`、`release`、`issues`、`repository`。使用 HMAC-SHA256 验证原始字节后按 Delivery UUID 去重，仅为匹配仓库 ID／安装 ID 的课程排队，不在请求内做同步。

**部署边界**：同一个 App 只有一个回调地址。现有 Demo 回调保持不变；上线新后端时由入口转发已签名原始请求，或为新环境另装 App。转发不能重新序列化 JSON。此次未切换公网回调、Demo 服务或产品服务。

## 页面与接口

“我的课程／编辑器”的“同步与审核详情”提供阶段、失败重试和仓库链接；默认收起。发布任务未完成时不会显示已发布。

外部 PR 通过 Webhook 或每五分钟校准进入管理者待审核列表，并产生站内未读消息。新头提交使旧批准失效。外部 PR 支持当前 courses/project.json 的项目数据修改：先校验 Git 内容及项目格式，再远程合并，生成新的私有待发布修订并用可信模块重建预览。管理者从“查看合并后的课程”继续审核；正式发布另建运行文件同步 PR，核验后再创建 Tag／Release。重复／超时不会重复导入。任意 React／运行文件修改会在远程合并前明确拒绝，仍待 T03 托管源码能力；不直接执行外部脚本。

| 接口（均以 `/api/shuku` 开头） | 权限及作用 |
| --- | --- |
| `GET /courses/{id}/github` | 课程管理权限，查看任务及外部 PR |
| `POST /courses/{id}/github/provision` | 课程管理权限，恢复专属仓库初始化 |
| `POST /courses/{id}/github/bind` | 平台管理员，首次发布前绑定已核实的独立仓库 |
| `POST /courses/{id}/github/retry` | 管理者提交 `job_id`，重试终态失败任务 |
| `POST /courses/{id}/github/reconcile` | 管理者主动核对远程状态 |
| `GET /github/reviews` | 仅返回本人管理的外部 PR 所属课程 |
| `POST /courses/{id}/github/external-decision` | `number`、`head_sha`、`decision=approved/rejected/merge` |

已有本地正式版不会自动绑定任意远程提交。新环境应在首次发布前建立专属仓库；测试数据可重建。绑定接口的 `allow_destroy` 仅在管理员明确核实仓库可永久删除时开启；自动创建的专属仓库已登记此授权。

## 数据与故障恢复

| 表 | 保存什么 |
| --- | --- |
| `github_repositories` | 课程、仓库身份、安装、基础分支、初始 SHA、删除授权 |
| `github_revisions` | 不可变修订对应的基础 SHA、审核分支、PR、提交／合并 SHA 和 Release |
| `github_jobs` + `tasks` | 操作意图、操作者、状态、阶段、Blob 检查点及有限重试 |
| `github_deliveries` | 投递 UUID、内容摘要、事件和接收时间 |
| `github_external_prs` | 外部 PR 当前头、审核绑定、合并事实与导入后的本地修订 |
| `feedback` 新字段 | Issue 编号与远程开关状态 |

- 使用原有数据库队列、资源租约、心跳和过期执行者隔离。HTTP 超时后不立即认定写入失败：重试先查分支／PR／Tag／Release／Issue 的远程事实，避免重复写入。
- Blob 检查点只保存路径和 SHA。提交内容及时间固定，同一操作重建得到相同提交。服务重启沿原任务继续；资源忙时等待不消耗失败次数。
- Tag 已被其他提交占用、官方基础变化、分支被外部修改、权限失效均停止覆盖，显示稳定错误码。修复权限或网络后从同一任务重试。
- 仓库创建后、数据库绑定前中断时，删除流程按预存创建任务及专属仓库标记恢复，避免孤儿仓库。
- 周期校准按课程分页排队，由 Worker 串行执行；清理异常与其他课程／Issue 校准分开恢复。服务启动和关闭同时管理校准线程与 Worker。

## 验证

自动回归覆盖签名／重放、权限隔离、差量文件与删除项、基础提交校验、合并等待、上传检查点、PR／合并／Release／Issue 超时查重、版本冲突、恢复草稿的私有性、外部 PR 通知及批准失效、删除失败保留本地数据。

真实联调复用 Demo App，在独立测试仓库完成首版与共创第二版的真实 PR、合并、Tag／Release、Issue、上下架及永久删除；外部 PR 还验证了接收、通知、远程合并、重建预览、再次审核及独立发版；测试仓库已清理。公网 GitHub → 新服务回调路由待 T08 部署验证，不能把本地验签测试当作公网投递验收。

重复真实验证可使用 `backend/tools/check_shuku_github.py --allow-remote-write --config <服务端配置文件>`；环境变量 `SHUKU_TEST_DATABASE_URL` 必须指向专用 `idl_shuku_test_*` 数据库。该脚本会在配置组织创建并最终删除一门专用测试课程，不能对生产业务数据库运行。
