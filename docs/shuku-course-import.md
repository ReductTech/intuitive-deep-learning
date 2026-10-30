# GitHub / ZIP 标准课程导入

## 范围与使用

“创建课程 → 从 GitHub / ZIP 导入已有课程”接受公开 GitHub 仓库/目录链接或标准 React 课程 ZIP。先检查文件，选择一个课程并确认名称、简介、类别，再创建当前账号的私有课程草稿。课程可在网页继续创作，也可使用原有本地 Agent。初始化不提交审核、不发布、不向课程首页收录。

必须有 `outlines.json`、自学入口 `entry`、教学入口 `ppt.entry`，教学入口导出 `deck`。通过 TypeScript AST 检查字面量页面记录；只转换实际实现且没有 `showInPpt:false` 的页面。无法静态识别的动态注册暂不支持。导入包里的 npm scripts、PowerShell / Python / Shell 工具不执行；`scripts/` 中这些辅助工具列入报告的 `excluded_tools`，不交付至课程源码仓库。其他未知类型报告不兼容。

GitHub 来源固定 repository ID、commit 和目录；失败重试不跟随分支更新。分支名支持 `/`；GitHub 查询不存在的 commit 可能返回 422，按候选 ref 继续解析。公开 API 的限额和网络错误单独报告，绝不把组织 App 凭证发给来源地址。

## 工程契约

保留原有课件 `version:1`；新增源码协议 `sourceFormatVersion:2`，兼容旧 data URL 工程。

| 字段 | 含义 |
|---|---|
| `courseId` | 新平台模块对应的 `custom-<新模块 UUID>`，不复用来源归属 |
| `source.files` | 安全相对路径与 UTF-8 文本，最多 500 个文件、合计 12 MiB；单文本 1 MiB |
| `sourceAssets` | 路径 → `{sha256,size,mime}`；二进制在本地 Bucket，单个 32 MiB、合计 64 MiB |
| `authoringModule` | `modules/<课程目录>`，内部保留原素材 UUID 命名空间 |
| `sourceGuideEntry` | 自学组件包装入口 |
| `pages[].sourceEntry` | 从原 deck 渲染指定页面的包装入口 |
| `authoringVersion` | 固定的 `local-authoring.lock.json` 提交；构建读取已准备的框架缓存 |
| `importOrigin` | ZIP 摘要，或 GitHub owner/repository/ID/commit/path；初次保存后保持不变 |

引用本地文件桶必须有当前课程既有修订、导入会话或本课程上传记录授权。提交一个其他课程的哈希不能取得授权。素材大小、摘要及路径在接收与构建时核对。网页再次保存、本地 Agent 的 prepare/pull/push、共创工作区复制和合并保留素材清单。未修改的公开原课素材沿用固定快照引用。

ZIP 原文件最大 100 MiB，展开最大 64 MiB，最多 2,000 个文件；中央目录最大 2 MiB，先检查再创建 ZipFile 条目。拒绝跨卷/ZIP64、链接、加密、异常压缩比、重复/大小写冲突、路径穿越和凭证路径。64 MiB 为当前小内存服务器的首期展开配额，比讨论稿建议值更保守。二进制不会变为超大的 Base64 JSON 或数据库 blob。

GitHub 初始化沿用 `course-<course_id>` 私有仓库及现有建仓任务；读取并核对仓库身份、private 标志、默认分支、提交树和真实文件摘要。课程文件写入 `courses/sources/<逻辑路径>`，其中媒体是原始字节；`courses/project.json` 保存工程，`course.manifest.json` 保存格式、固定框架与来源。许可证放在课程自身路径或 `courses/sources/licenses/`。不包含平台框架、后端、node_modules 或凭证。目标仓库的 outlines 仍可被标准包转换器重新导入。

初始化提交有固定身份标记和确定的作者时间；响应丢失后读取远端 ref/commit 对账。只允许从已登记的初始提交推进，不覆盖远端独立修改。完成前不能提交审核或发布；可继续修改本地草稿，初始化任务仍使用不可变的首个修订，不覆盖新的 head。正式发布时沿用原产品可见性规则，可能将仓库公开。

## 持久任务与接口

复用 `shuku_tasks`，不新增业务表或执行数据库引擎迁移。任务负载只保存账号、对象摘要和状态；候选工程及文件主体保存在本地 Bucket。

| 接口 | 用途 |
|---|---|
| `POST /api/shuku/course-imports` | JSON `{type:"github",url}`；必须有 `Idempotency-Key` |
| `POST /api/shuku/course-imports/zip` | 流式二进制 ZIP；`Content-Type:application/zip`，相同幂等头 |
| `GET /api/shuku/course-imports` | 本账号最近 10 个任务，供刷新恢复 |
| `GET /api/shuku/course-imports/<id>` | 检查、初始化进度、失败码、课程/修订 ID |
| `POST .../<id>/confirm` | `{selection,title,description,category}`；相同确认返回同一课程 |
| `POST .../<id>/retry` | 重排失败的检查、构建、建仓和初始化任务，不重复建课 |
| `POST .../<id>/cancel` | 取消未确认且未持有有效执行租约的会话；正在检查时可稍后重试 |
| `POST /api/shuku/courses/<id>/assets` | 二进制素材，`X-Shuku-Asset-Path` 为百分号编码的逻辑路径 |
| `GET .../<id>/assets/<sha256>` | 读取本课程已授权素材；支持课程范围的 Agent 凭证 |

`course.import.inspect` 检查文件并等待确认；确认事务原子创建新课程、首个修订和后续任务。`course.import.finalize` 在构建和建仓完成前释放 worker，等待依赖，不阻塞自己的子任务。失败保留检查清单、固定源版本和已准备的远端提交。每个账号 24 小时内最多 10 次导入。

未确认结果保留 24 小时，worker 每分钟检查过期会话并派发 `course.import.cleanup`。取消和清理保留审计；已确认课程使用“我的课程”的现有删除补偿流程。回收同时检查所有修订、播放器、导入会话和暂存素材引用，共享对象不误删。删除期间已有任务停止推进，远端建仓与删除仍由原 GitHub 对账逻辑处理。

## 验证方式

安装原项目依赖并准备固定框架后，可以只读核查真实样本；此工具不创建数据库课程或 GitHub 仓库：

```powershell
python scripts/verify-course-import.py --zip "<课程.zip>" --out "<新的输出目录>" --build
python scripts/verify-course-import.py --github "https://github.com/ReductTech/intuitive-deep-learning/tree/develop/modules/Visual-Generation-Guide" --out "<另一输出目录>" --build
```

测试命令：

```text
python -m pytest backend/tests/shuku_backend/test_course_package.py backend/tests/shuku_backend/test_github_course_source.py backend/tests/shuku_backend/test_course_imports.py
node --test scripts/shuku-source-plugin.test.mjs
npm run typecheck
npm run build
```

数据库测试必须使用以 `idl_shuku_test_` 开头的独立 MySQL 8 库；不得用真实业务库跑清表夹具。还需回归 source、local_agent、local_agent_template、workflow、collaboration、github、governance、tasks、HTTP 相关测试。

可选浏览器验证工具 `scripts/test-course-import-browser.mjs` 使用 Playwright 和 Chrome。安装 Playwright 作为临时验证依赖，或将 `SHUKU_PLAYWRIGHT_MODULE` 指向其模块；`SHUKU_IMPORT_PREVIEW` 指向上述工具输出目录，可逐页验证实际样本及自学入口。不指定样本时仅测试来源表单、确认与刷新恢复。浏览器 API 使用可控夹具，不调用真实建仓接口。

具体执行结果、提交与部署状态以任务书和交付说明为准，代码合入不等于线上部署完成。

## 2026-10-29 验证与交付记录

Linux / MySQL 8 完整后端回归 279 项通过、2 项条件跳过；补充相关回归 57 项通过。Node 编译适配测试 9 项通过，类型检查、生产构建通过。两个用户提供的真实来源均完成标准化、固定依赖构建及严格沙箱浏览器验证，展示 20 个已实现教学页面、实际自学入口和图片字体素材。

私有仓库创建及文件树、重试、响应丢失恢复与删除通过接口夹具验证；实际 GitHub App 组织及权限只读检查通过。未使用真实用户创建远程测试课程；真实私有仓库联调、运行版安装和线上验收仍待完成。代码提交不代表已更新线上服务。

导入检查先登记完整文件清单再写入本地文件桶，部分写入失败可按清单回收；取消及过期会话可单独重试失败清理。课程名称、描述、分类写回标准大纲，本地 Agent 未主动改名时保留网页端名称。课程文件内容继续存于本地文件桶。
