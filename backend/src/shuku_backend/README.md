# 术库独立业务后端

第一批实现：独立启动、显式建表及测试账号初始化、Demo 登录／退出、持久会话、私有课程草稿、文件桶和持久任务基础。原 `idl_backend` 保持不变。

尚未接入前端页面、编辑器修订／产物交付、审核发布、GitHub、反馈及学习记录等完整链路。不能据此宣称整套迁移完成。

## 安装与启动

```sh
python -m pip install -e './backend[shuku,test]'
```

通过进程环境配置以下变量；不要把凭据写入版本库：

| 配置 | 说明 |
| --- | --- |
| `SHUKU_DATABASE_URL` | 独立 PostgreSQL 数据库连接，使用 `shuku_business` schema；不要指向原 Demo 业务库 |
| `SHUKU_BUCKET_DIR` | 新业务的文件桶绝对路径 |
| `SHUKU_PUBLIC_ORIGIN` | 浏览器访问来源，含协议和端口、不带末尾斜杠；写请求必须携带匹配的 Origin |
| `SHUKU_DEMO_PASSWORD` | 服务端配置的 Demo 共用密码，无内置默认值 |
| `SHUKU_AUTH_PROVIDER` | 当前仅支持 `demo`；选择尚未实现的 `jianlun` 会拒绝启动 |
| `SHUKU_HOST` / `SHUKU_PORT` | 默认 `127.0.0.1:8010`，不接管原计算服务 |

依次显式执行：

```sh
python -m shuku_backend migrate
python -m shuku_backend seed-demo
python -m shuku_backend serve
```

`migrate` 需要建表权限；`seed-demo` 准备固定 UUID 的测试账号：`linzhi`（学习者）、`xiaoman`（课程作者）、`admin`（平台管理员）。角色为新模块测试配置；不读取旧 Demo 数据。重复初始化不会重置已有角色，遇到冲突会失败。

正常服务启动只检查结构和文件桶，不自动建表、播种账号或回退 JSON。正式部署的迁移／运行账号分权及网关接入仍待交付；运行账号需只获所需业务表读写权限。HTTPS 来源会启用 Secure Cookie。

## 已有接口

| 方法与路径 | 行为 |
| --- | --- |
| `GET /api/shuku/health` | 数据库结构就绪检查 |
| `POST /api/shuku/auth/login` | JSON `{username,password}`，返回用户和 HttpOnly 会话 Cookie |
| `GET /api/shuku/auth/me` | 当前账号、UUID 和角色 |
| `POST /api/shuku/auth/logout` | JSON `{}`，撤销当前会话并清 Cookie |
| `POST /api/shuku/courses` | 作者／管理员创建私有草稿；字段 `title`、`module_id`，可选 `description`、`category` |
| `GET /api/shuku/courses` | 返回本人及获授权课程，首批最多 100 条，分页待补 |
| `GET /api/shuku/courses/{id}` | 读取有权限的课程；他人私有课程返回 404 |

会话有效期 12 小时，仅保存令牌哈希，重启后仍可使用；账号停用会拒绝后续访问。登录按连接对端地址限制失败次数；前置代理下真实客户端地址处理尚待部署适配，不能直接信任任意转发头。

课程作者由服务端会话确定，不接受客户端传作者或角色。当前 API 只保存课程元数据，尚不能保存或发布可播放课程修订。

## 任务与复用

`storage.Store` 提供幂等入队、资源租约、领取、检查点、续租和带令牌的完成提交；外部操作在事务之外执行。最多重试 3 次，过期执行者不能提交；最后一次执行中崩溃会进入明确失败状态。当前 Worker 只注册 `file.verify` 文件校验，尚无 PR／发布／删除任务处理器。

`adapters.idl.IdlClient` 单向复用 `idl_backend.contracts.client.request_json` 和 `/v1/jobs` 契约；尚未暴露为面向用户的计算路由，也未与真实 Cloud 环境联调。

## 验证

只对单独准备的、名称以 `idl_shuku_test_` 开头的可丢弃数据库运行：

```sh
PYTHONPATH=backend/src python -m pytest backend/tests/shuku_backend -q
```

测试需先通过 `SHUKU_TEST_DATABASE_URL` 提供隔离库连接；会清空该测试库中本模块的业务表，绝不能用于真实业务库。未配置时数据库测试跳过，不能将跳过计为数据库验收通过。

任务及证据见 [迁移进度](../../../docs/术库后端迁移进度.md)。
