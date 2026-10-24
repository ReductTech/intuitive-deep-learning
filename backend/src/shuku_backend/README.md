# 术库独立业务后端

当前已打通：Demo 登录 → 创建私有课程 → 编辑器保存不可变修订 → 本人预览 → 退回／重提／通过 → 本地课程正式发布。原 `idl_backend` 保持不变。

支持现有模块的 React 页面和可编辑文字教学页。托管编辑不会改写共享 TSX；原编辑器的 AI 模拟生成不作为可发布产物。GitHub PR、共创评分、消息和减论 API 等仍待后续迁移。

## 安装与运行

```sh
npm ci
python -m pip install -e './backend[shuku,test]'
python -m shuku_backend migrate
python -m shuku_backend seed-demo
python -m shuku_backend serve
```

先配置进程环境，不将凭据写入版本库：

| 配置 | 说明 |
| --- | --- |
| `SHUKU_DATABASE_URL` | 独立 PostgreSQL 连接；使用 `shuku_business` schema，不指向原 Demo 业务库 |
| `SHUKU_BUCKET_DIR` | 文件桶绝对路径 |
| `SHUKU_SOURCE_ROOT` | intuitive-deep-learning 仓库绝对路径，需包含模块、素材和已安装的 Node 依赖；修订构建需要此配置 |
| `SHUKU_PUBLIC_ORIGIN` | 浏览器来源，如 `http://localhost:5173`，不带末尾斜杠；写请求必须匹配 Origin |
| `SHUKU_DEMO_PASSWORD` | 测试账号共用密码，无内置默认值 |
| `SHUKU_AUTH_PROVIDER` | 当前仅支持 `demo`，不自动降级身份验证 |
| `SHUKU_HOST` / `SHUKU_PORT` | 默认 `127.0.0.1:8010` |

`migrate` 和 `seed-demo` 显式执行；正常启动只检查，不自动建表或初始化用户。测试账号为 `linzhi`（学习者）、`xiaoman`（作者）、`admin`（平台管理员），角色冲突会拒绝重置。正式部署账号分权和网关配置仍需上线验收。

前端现有 Vite 配置新增 `/api/shuku` 代理，目标可由 `SHUKU_API_URL` 覆盖，其他 Cloud／计算接口保持原配置。入口是首页“课程创作”或 `/my-courses`；开发启动仍遵循原项目的 Cloud 服务准备要求。

课程创作使用 SceneDeck 主站的共用顶栏；下拉菜单进入“我要创建课程”“我的课程”“共创待审核”“我参与的共创”子页面。子页面通过 URL 保留选择，创建表单直接显示在页面内；编辑器保留专注布局。

## 操作流程

1. 作者登录，填写名称、简介、类别，选择空白课件或现有模块作为起始内容。
2. 在原编辑器中调整文字页、原页面属性、顺序和内容，点击“保存修订”。未保存的修改不会混入已保存预览。
3. Worker 固定项目内容，构建独立 JS／CSS 和素材引用；成功后才开放受控预览。
4. 作者提交审核；管理员通过“待审核”查看同一修订的真实预览，退回需填写意见。不能审核自己的课程。
5. 作者修改并保存后重新提交；新修订使旧的待审核／批准失效。
6. 当前修订审核通过后，填写递增版本号并发布。文件校验失败不改变正式版本；发布后进入首页目录，旧正式版本仍可通过固定地址访问。

这是本地课程发布链路，不代表已创建 GitHub PR、Tag 或 Release。

## 共创流程

首页的后端已发布课程提供“我想共创”；默认使用最新正式版本，也可选择历史版本。本人工作区在“课程创作 → 我参与的共创”，编辑后保存、预览并提交说明。课程管理者在“待审核”查看教学内容差异、填写 0～10 整数质量分并通过或退回；通过后单独合并，再从“查看待发布课程”确认版本号发布。

工作区固定基础版本，复制教学内容时排除原作者对话、设计参考图和撤销历史。修改使旧批准失效。合并复制已审核冻结产物，仅替换修订资源地址，不重新生成教学代码。官方基础或草稿有变化时返回 `BASE_CHANGED`，保留工作区并要求基于最新正式版重新共创，不覆盖已有修改。

合并构建失败时旧正式版可用；详情显示失败后课程管理者可点击“重试合并”，复用同一任务及目标修订。贡献历史关联原作者、审核者、合并者、质量分和最终正式版本，成功合并才计入排名。静态内置模块尚未自动登记成后端课程；真实 GitHub 操作属于 T07。

## 课程治理与清理

管理员在“我的课程”下架或恢复课程。下架后匿名文件、公开目录及共创入口不可用，作者仍可管理，后台发版不能自动重新公开。恢复私有草稿仍为私有，不会因恢复而首次公开。

本人可在“我参与的共创”删除工作区；管理员可以永久删除课程及其全部工作区。弹窗再次确认即可，无需输入名称。页面底部“删除进度”展示执行、等待、成功或失败状态；失败可点击“重试清理”，沿用原请求和检查点。

删除先提交意图和持久任务、冻结资源、取消排队构建，再等待在途任务结束。已开始的共创合并需先完成或由课程管理者重试合并，之后才能清理它的私有源文件；等待不会耗尽删除重试次数。真实异常有限重试，终止失败由页面人工重试。普通启动不自动迁移，请升级时显式执行 `python -m shuku_backend migrate`。

工作区私有源码和预览会被删除，已合并贡献保留最小的归属／基础版本墓碑，保留署名和评分，不保留可访问草稿。永久删除课程会清除关联工作区、修订、审核、版本、权限及贡献记录；删除回执、任务及审计用于故障恢复与核查。

文件先持久记录候选哈希、删除引用，再按 32 个一批复核其他修订引用并回收。保存／构建持有共享引用锁，回收持有独占锁，防止新引用尚未提交时文件被误删。已删文件重试视为成功；共享文件留给仍引用它的课程。数据库与文件桶必须属于同一套业务实例，不共用给另一个独立数据库。

本阶段不操作 GitHub 仓库或分支，远程治理仍属于 T07。

## 课程反馈与消息

首页新后端已发布课程的“开始学习”进入 `/learn?revision=...`，学习页提供“反馈问题”。自动绑定当前正式学习版本，可填写页面位置；登录前的反馈草稿会在当前浏览器登录返回后恢复。提交后可点“查看反馈”查看处理状态。

反馈与通知同事务落库。接收者为有效课程所有者和已授权管理者；均不可用时转交有效平台管理员。管理者从顶栏“我的消息”查看反馈，选择待处理、处理中、已解决或已关闭，填写处理说明；变更后反馈者收到站内通知。GitHub Issue 创建尚未接入。

点击消息会自动标为已读，“一键已读”只处理本人当前已有消息，不会解决或关闭反馈。消息固定每页 20 条，支持游标加载更多和独立未读计数；顶栏每 30 秒刷新未读，并在本页操作后立即刷新。消息、反馈详情和处理权限分别校验，不使用客户端角色。

提交使用 `request_key` UUID 幂等，每账号每小时最多 10 条新反馈；重复请求不重复通知。处理采用 `expected_version` 防止并发覆盖。下架保留已有反馈处理能力，停止接受新反馈；永久删除课程时级联删除对应反馈及消息。原有静态内置课程尚未自动登记到新后端，这些课程暂未接入站内反馈。

## 接口

统一前缀 `/api/shuku`；私有操作使用 HttpOnly Cookie 会话。

| 方法与相对路径 | 用途 |
| --- | --- |
| `GET /health` | 检查就绪状态 |
| `POST /auth/login`、`GET /auth/me`、`POST /auth/logout` | 登录、当前身份、退出 |
| `GET /modules` | 查询可用课程模块 |
| `POST /courses`、`GET /courses`、`GET /courses/{id}` | 创建及管理本人／获授权课程 |
| `POST /courses/{id}/revisions` | 提交 `{project, expected_revision}`，返回 202 和新修订 ID；并发修改返回 409 |
| `GET /revisions/{id}` | 获取有权限的编辑内容、构建和审核状态 |
| `GET /revisions/{id}/files/{path}` | 按权限读取固定产物；发布前仅作者／管理员可读，发布后才公开 |
| `POST /courses/{id}/submit` | 提交 `{revision_id}` 审核 |
| `GET /reviews` | 管理员读取待审核列表 |
| `POST /reviews/{id}/decision` | `{revision_id, decision: approved或rejected, note}` |
| `POST /courses/{id}/publish` | 发布 `{revision_id, version, note}`；相同内容重试返回已有版本 |
| `GET /public/courses/{id}/releases` | 查询可选正式版本及当前版本标志 |
| `POST /courses/{id}/workspaces` | `{base_release_id?}`，不传时用当前正式版；同人同基础重复请求沿用工作区 |
| `GET /workspaces` | 本人的私有共创工作区 |
| `POST /workspaces/{id}/submit` | `{revision_id, summary}`，提交最新就绪修订 |
| `GET /contributions`、`GET /contributions/{id}` | 有管理权限的待处理建议；本人或管理者读取差异与状态 |
| `POST /contributions/{id}/decision` | `{revision_id, decision, score?, note?}`，通过必须提供 0～10 整数分；退回必须提供原因 |
| `POST /contributions/{id}/merge` | `{revision_id}`，返回持久处理状态；重复调用不会新增官方修订 |
| `GET /courses/{id}/contributions` | 成功合并的贡献记录、正式版本归属及质量分排名 |
| `POST /courses/{id}/visibility` | 管理员 `{action: hide或restore}`，恢复原公开／私有状态 |
| `POST /courses/{id}/remove` | 管理员 `{confirm:true}`，永久删除课程，返回删除回执 ID |
| `POST /workspaces/{id}/remove` | 本人或管理员 `{confirm:true}`，删除私有工作区并保留已合并贡献 |
| `GET /removals` | 本人发起的删除任务；管理员可查看全部。返回状态、阶段与失败代码 |
| `POST /removals/{id}/retry` | `{}`，重试终止失败的清理，复用原任务及回执 |
| `GET /public/revisions/{id}` | 读取可学习的正式课程及版本元信息 |
| `POST /revisions/{id}/feedback` | 登录用户 `{request_key, message, location?}`，返回反馈 ID；版本与归属由后端确定 |
| `GET /feedback/{id}` | 反馈本人或课程管理者读取问题、原学习版本及处理状态 |
| `POST /feedback/{id}/status` | 管理者 `{status, reply, expected_version}`，更新处理并通知反馈者 |
| `GET /messages?cursor={id}` | 本人的消息，固定 20 条；首屏不传 cursor，返回 next_cursor 和总未读数 |
| `POST /messages/{id}/read` | `{}`，本人消息标为已读，重复请求保留首次已读时间 |
| `POST /messages/read-all` | `{}`，本人现有消息一键已读 |
| `GET /public/courses` | 匿名读取正式目录，仅返回当前已发布版本 |

会话保存令牌哈希，12 小时过期，退出、停用及切换账号会影响后续访问。创建、审核和发布均以服务端身份和修订状态为准。

正式产物只包含学习内容，创作对话、撤销历史和设计参考图保留在私有修订中，不随课程公开。

数据库只保存关系、状态和对象清单；项目、图片及产物字节放在哈希文件桶。修订构建与文件校验走持久 Worker；GitHub 等任务处理器尚未接入。

同步上游归档后，当前创作器仍复用 `deprecated/Edit-Deck` 中的本机接口适配；旧 `/edit-deck/legacy` 路由转入当前创作器。保留根 `index.html` 作为活动应用入口，归档的 web_ppt HTML 不再作为构建入口，播放器路由由当前应用提供。

## 验证

数据库测试只使用可丢弃的 `idl_shuku_test_*` 数据库，并配置 `SHUKU_TEST_DATABASE_URL`；测试会清空其中本模块的业务表。

```sh
PYTHONPATH=backend/src python -m pytest backend/tests/shuku_backend -q
node scripts/check-shuku-workflow.mjs <Playwright模块路径>
```

浏览器验收需独立本地环境，设置 `SHUKU_E2E_URL`、`SHUKU_E2E_PASSWORD`；可设置 `SHUKU_E2E_BROWSER_CHANNEL` 和截图目录 `SHUKU_E2E_ARTIFACT_DIR`。只接受本机地址，不对正式站点运行创建／发布测试。

当前范围和证据见 [迁移进度](../../../docs/术库后端迁移进度.md)。
