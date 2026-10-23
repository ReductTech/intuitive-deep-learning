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
| `GET /public/courses` | 匿名读取正式目录，仅返回当前已发布版本 |

会话保存令牌哈希，12 小时过期，退出、停用及切换账号会影响后续访问。创建、审核和发布均以服务端身份和修订状态为准。

正式产物只包含学习内容，创作对话、撤销历史和设计参考图保留在私有修订中，不随课程公开。

数据库只保存关系、状态和对象清单；项目、图片及产物字节放在哈希文件桶。修订构建与文件校验走持久 Worker；GitHub 等任务处理器尚未接入。

## 验证

数据库测试只使用可丢弃的 `idl_shuku_test_*` 数据库，并配置 `SHUKU_TEST_DATABASE_URL`；测试会清空其中本模块的业务表。

```sh
PYTHONPATH=backend/src python -m pytest backend/tests/shuku_backend -q
node scripts/check-shuku-workflow.mjs <Playwright模块路径>
```

浏览器验收需独立本地环境，设置 `SHUKU_E2E_URL`、`SHUKU_E2E_PASSWORD`；可设置 `SHUKU_E2E_BROWSER_CHANNEL` 和截图目录 `SHUKU_E2E_ARTIFACT_DIR`。只接受本机地址，不对正式站点运行创建／发布测试。

当前范围和证据见 [迁移进度](../../../docs/术库后端迁移进度.md)。
