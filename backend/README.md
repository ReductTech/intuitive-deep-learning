# 共用服务与本地开发

计算实现只维护在 `backend/src/idl_backend/`。Cloud 仓库通过固定版本的 Git submodule 安装同一个 Python 包；不再复制 worker 源代码。

## Windows 启动

在本仓库根目录、已激活的 Python 环境中执行：

```powershell
python -m pip install -e './backend[vision,projection,assessment,dev]'
# 按本机 CPU / CUDA 环境单独安装匹配的 torch 与 torchvision。
.\scripts\devstart.ps1
```

默认一次启动视觉服务 28431、问答服务 28432、模型代理 59413、学习记录服务 59411，以及共用 Cloud API 8000。它们在后台运行，日志写到 `runtime_logs/`；已有健康服务会复用。随后在另一个终端运行 `npm run dev` 打开课件。

`devstart.ps1 -Status` 查看状态，`devstop.ps1` 停止本入口创建的进程；`-Kind vision` 只启动视觉服务。可用 `-Port` 或 `-Course <UUID>` 调试单个服务。模型代理沿用已有模型配置，缺少配置时接口会说明服务不可用。

不需要 Docker。本地必须有同级 Cloud 仓库（或设置 `IDL_CLOUD_REPOSITORY`），首次安装 `python -m pip install -r ../cloud-intuitive-deep-learning/backend/requirements.txt`。启动器复用 Cloud API 源码，从环境、Cloud `.env.local`、`infra/.env.cloud.production` 按优先级读取 MySQL 和服务 token；不会导入生产 FRP 地址，凭据只在服务端使用。

`npm run dev` 自动注入 Cloud 的同一份 `frontend/cloud-runtime.js`，将视觉、训练和 LLM 请求转换为同源 `/api/lab`、`/api/ai`，再代理至 8000。缓存查询、计算任务交接和 `idl_cache` 写入都走同一个 Cloud API。学习记录继续使用本地 59411；本地默认关闭 Cloud PostgreSQL 遥测，生产默认开启。缺少共用缓存配置时启动报错，不静默绕过缓存。

独立启动某个 API 也可使用 `python -m idl_backend serve --kind vision --dev`。课程身份工具为 `python -m idl_backend.contracts.identity --check`。原 scripts 下的 Python 转发入口已删除。

## 目录与职责

| 目录 | 职责 |
| --- | --- |
| `contracts/` | HTTP 客户端、签名课程 UUID、任务目录、缓存版本 |
| `datasets/` | MNIST、EMNIST、人脸样本加载 |
| `vision/features/` | 固定核、人工特征和投影 |
| `vision/training/` | 数字分类、人脸分类训练 |
| `vision/inference/` | 手写识别、人脸相似度 |
| `assessment/` | 结构化问答、题库和已审核预计算内容 |
| `providers/` | 模型供应商配置，兼容已有本地配置 |
| `jobs/` | 有界任务执行、进度与旧任务接口 |
| `local/` | 原生 HTTP、静态内容服务、Windows 开发进程管理 |
| `tools/` | 不参与请求处理的内容、模型与媒体工具 |
| `scripts/content/` | 缩略图、课程素材、候选答案生成入口 |
| `scripts/checks/` | 布局和样式检查入口 |

Python 离线工具直接运行公共包：

```powershell
python -m idl_backend.tools.models.train_emnist_mobilenet_v3 --help
python -m idl_backend.tools.content.generate_scenedeck_thumbnails --help
python -m idl_backend.tools.media.remove_green_screen input.mp4
```

新增任务只在 `contracts/tasks.py` 注册；新增课程使用 `outlines.json.moduleIdentity.id`，不用目录名作为身份。

## 路径与依赖

- `IDL_REPOSITORY_ROOT`：非源码安装时指向课件仓库。
- `IDL_MODULES_DIR`：签名 outlines 注册目录。
- `IDL_DATA_DIR`：数据根目录，默认仓库 datasets/；不再查找旧目录。
- `IDL_MODEL_DIR`：模型根目录，默认 datasets/models/。
- `IDL_ARTIFACT_DIR`：训练输出目录，默认 datasets/artifacts/<课程 UUID>/digit-training/；云端须挂载持久化可写卷。
- `IDL_DEVICE`：默认 auto，优先 CUDA，不可用时回退 CPU；显式 cpu / cuda / mps 可覆盖，显式指定不可用设备会报错。兼容原 CNN 设备变量。

Torch 与 torchvision 由运行环境提供，不捆绑 CUDA 版本。HTTP 模块导入不会加载 Torch、InsightFace 或 LangChain；启动视觉服务时会在常驻识别子进程中预热手写模型，后续请求复用权重。训练使用独立执行槽与独立进程，不阻塞手写识别。旧 `requirements.txt` 保留完整本地环境安装方式，新环境使用 extras 按需安装。

## 协议与验证

两种执行环境都使用 `POST /v1/jobs`、`GET /v1/jobs/{id}`，请求包含 `course_uuid`、`endpoint`、`payload`。`Idempotency-Key` 支持同请求重试；不同内容重用键会被拒绝。Windows 默认一个训练执行槽、一个常驻识别执行槽，总共最多 64 个在途任务。训练使用独立 spawn 子进程，识别进程复用；超时或进程退出后自动重建识别进程。

`/v1/completions` 与 ACK 为 Cloud API 的数据库写入提供交接协议。本地仅是开发用的内存任务表和交接表；重启本地服务会丢失未交接任务。生产版由 Cloud 的 Redis/RabbitMQ 持久化。结果缓存由 Cloud 既有 MySQL DAO 管理，不另建一套缓存。

```powershell
$env:PYTHONPATH='backend/src'
python -m pytest backend/tests -q
npm run typecheck
```

一次性迁移脚本不应在日常启动或容器初始化中自动执行。

## 视觉特征学习第 8 页

`/visual-feature-learning/manual-feature-train` 接收整数 `seed: 0..9`，固定训练 10 轮的 9→32→10 ReLU 分类器。训练直接读取 `datasets/t10k-images.idx3-ubyte` 和对应标签，采用按类别约 90/10 的本地训练/验证划分。九宫格边界为 `[0,9,18,28]`，灰度阈值为 128，模型输入为区域墨迹数除以对应面积；不是固定卷积的 grid8 特征。

结果包含 650 个参数、10 轮损失与准确率、样本数量及划分索引。计算函数不写本地模型文件或数据库。Cloud API 在现有 MySQL `idl_cache` 中保存整份结果：`course_id=80396753-7fc8-4f55-9188-bddbdb828169`，`endpoint=/visual-feature-learning/manual-feature-train`，`request_data={"seed":N}`。这一页不使用版本字段，最多十组记录；`response_data.result.classifier` 为权重，`response_data.result.history` 为训练记录，`response_data.result.dataset` 为数据来源及划分。Cloud 完成任务的交接写入由现有 completion drainer 执行，成功写入后 ACK。

正常本地网页通过 8000 访问同一云端持久缓存；仅直接调试原生 28431 接口时不经过缓存。云端部署需同时更新共用 backend 包与 `cloud-intuitive-deep-learning/backend/cloud_api/app.py`；前端沿用 `cloud-runtime.js` 对本地服务 URL 的转换。命中云端缓存直接显示完成状态，不模拟训练进度。

## 固定卷积特征分类（第 10 页）

`/lenet5/fixed-kernel-train` 使用预准备的 `datasets/mnist/lenet-fixed11-*` 数据与 grid8 特征，筛出 0–9 标签（排除拒识样本），固定训练 10 轮、十类输出的线性分类器。旧十一类结果读取时失效，新结果完成后覆盖同一缓存键。六种核可多选，后端按固定顺序去重排序，`seed` 为整数 0–4。每个非空组合最多五组 Cloud MySQL 缓存，无版本字段；共 63 个组合，最多 315 组。缓存键只包含 `kernels` 与 `seed`，不包含当前画布；返回分类器权重、标准化参数、训练记录与指标，预测在浏览器完成。

Cloud API 强制异步，进度接口为 `/lenet5/fixed-kernel-train-status`，结果通过既有 completion drainer 入库。特征计算为 28×28 → 不补边的 3×3 卷积及 ReLU → 26×26 → 将响应划为 8×8 区域并取平均；不是一次卷积直接得到 8×8，也不是固定 3×3、步长 3 的池化。
