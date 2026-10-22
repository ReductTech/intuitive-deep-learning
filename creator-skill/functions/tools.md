# 创作工具索引

所有实现集中在 `creator-skill/scripts/`，按用途分目录；旧入口只转发。首选统一入口，避免临时重写 UUID、截图、上传或检查代码。

## 发现与调用

从仓库根目录执行：

```powershell
python creator-skill/scripts/tools.py list
python creator-skill/scripts/tools.py list --category capture
python creator-skill/scripts/tools.py list --json
python creator-skill/scripts/tools.py describe capture.slides
python creator-skill/scripts/tools.py capture.slides --help
```

`catalog.json` 是唯一工具清单，列出每个工具的分类、路径、依赖、参数和执行效果；`describe` 不执行工具。命令返回原工具退出码，不拼接 shell 命令。仅查看清单和帮助不会训练、下载、调用模型或上传。

## 分类

| 目录 | 工具 ID | 用途 |
|---|---|---|
| `module/` | `module.identity`、`module.init` | UUID 与新模块骨架 |
| `capture/` | `capture.slides`、`capture.thumbnails`、`capture.inspect` | 同一捕获引擎输出原尺寸截图、缩略图或真实页序 |
| `checks/` | `check.module`、`check.skill`、`check.bounds`、`check.course`、`check.styles` | 契约、边界、课程一致性与样式分析 |
| `assets/` | `assets.inspect`、`assets.upload` | 资源统计、重复分析与 OSS 发布 |
| `media/` | `media.remove-green` | 现有 FFmpeg 绿幕转透明视频 |
| `environment/` | `environment.doctor` | 无安装、无启动的依赖诊断 |

Skill 仅收纳跨课程复用的创作工具。具体课程的模型训练、数据预计算、缓存生成与专用素材导出留在原模块或后端，不迁入、不登记到 Skill 工具目录。运行时计算服务继续由 `backend/src/idl_backend/` 实现，服务启停仍使用仓库 `scripts/devstart.ps1`、`devstop.ps1`，不复制一套服务管理逻辑。

## 常用任务

### 创建骨架

在大纲已确认且用户授权创建工程骨架时使用：

```powershell
python creator-skill/scripts/tools.py module.init --directory Example-Course --outline work/approved-outline.json --dry-run
python creator-skill/scripts/tools.py module.init --directory Example-Course --outline work/approved-outline.json
```

只生成入口、课程索引与空内容的 Guide/PPT 适配器，使用现有 Shared 与缩放能力；不生成教学构图、不覆盖已有模块，不复制其他课程 UUID。后续页面设计仍遵循逐页确认。已有模块缺少身份时使用 `module.identity`；只检查加 `--check`。

### 截图和缩略图

```powershell
python creator-skill/scripts/tools.py capture.slides --module Policy-Gradient --slide play-maze --base-url http://127.0.0.1:5173
python creator-skill/scripts/tools.py capture.thumbnails --module Policy-Gradient --slide play-maze
python creator-skill/scripts/tools.py capture.inspect --module Policy-Gradient
```

截图默认写 `work/captures/<deck>/`，可用 `--output` 指定；缩略图写 `assets/<UUID>/scenedeck-thumbnails/`。未指定 `--base-url` 时会临时启动 Vite，结束后停止；浏览器使用隔离的无头上下文，不读取用户浏览器配置。

`--actions` 接收按 slide ID 分组的 JSON，支持 `click`、`fill`、`press` 和有上限的 `wait`。例如 `{"play-maze":[{"action":"click","selector":"button[data-example]"}]}`。选择器必须来自实际页面；只执行任务已授权的操作，不能随便点击训练或发布按钮。默认截图与操作后截图可分别指定输出目录，避免覆盖。


### 课程一致性

```powershell
python creator-skill/scripts/tools.py check.course --module Policy-Gradient --base-url http://127.0.0.1:5173
```

通过 Vite 的真实模块导出读取 PPT 场景与讲稿，并在隔离上下文临时展开 Guide，比较页 ID 和顺序。标题、讲稿差异单列为警告，不擅自改写；Guide 未暴露可读页序时返回未完成检查，不假称一致。

`--save-snapshot` 可保存本次真实快照，后续用 `--snapshot` 离线比较；离线比较不能证明当前页面未变化。运行检查可能加载页面本身的默认行为，需在适用的本地环境执行。

### 资源与环境

```powershell
python creator-skill/scripts/tools.py assets.inspect --module Policy-Gradient --duplicates
python creator-skill/scripts/tools.py assets.upload --module <UUID> --dry-run
python creator-skill/scripts/tools.py environment.doctor --group capture
python creator-skill/scripts/tools.py environment.doctor --tool capture.slides
```

资源分析不删除疑似重复文件，也不以静态扫描断言动态引用无效。上传保持既有目标、跳过已有对象与 private records 契约；真实上传需本次任务已有发布授权与环境变量凭据。

## 依赖与验证

基础 Python 工具需要 Python 3.10+；Node 工具使用支持内置 WebSocket 的现有 Node 环境。`scripts/requirements.txt` 安装 Skill 校验与 OSS 依赖；截图依赖单独在 `scripts/capture/requirements.txt`，避免为只读检查安装视觉模型。

环境诊断只检查通用工具依赖，不安装包或启动服务。课程计算能力按对应模块与后端说明使用，不由 Skill 工具目录接管。未验证的处理与上传如实说明，不把帮助命令通过称为实际执行成功。
