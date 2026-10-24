# 创作工具索引

工具按用途分组存放在 `creator-skill/scripts/`，统一通过根目录的 `tools.py` 调用；工具 ID 与调用方式不随文件位置变化。

## 发现与调用

从仓库根目录执行。`<工具 ID>` 指清单中的命令名称，例如 `capture.slides`；`describe` 展示工具信息，不执行任务：

```powershell
python creator-skill/scripts/tools.py list
python creator-skill/scripts/tools.py list --category capture
python creator-skill/scripts/tools.py list --json
python creator-skill/scripts/tools.py describe capture.slides
python creator-skill/scripts/tools.py capture.slides --help
```

`catalog.json` 是工具索引，维护分类、相对 `creator-skill/` 的路径、依赖、执行效果及别名的固定参数。完整参数定义只保留在脚本中，通过 `<工具 ID> --help` 查看。命令返回原工具退出码，不拼接 shell 命令。仅查看清单和帮助不会训练、下载、调用模型或上传。

工具正常执行向 stdout 返回一份带 `status` 的 JSON，进度和诊断写入 stderr。退出码 `0` 表示成功或无需修改，`1` 表示检查已完成但未通过，`2` 表示参数、依赖或执行错误。开发与维护脚本时读取[脚本规范](engineering/scripts.md)。

## 分类

| 目录 | 工具 ID | 用途 |
|---|---|---|
| `module/` | `module.identity`、`module.init` | 模块身份与初始大纲 |
| `checks/` | `check.module`、`check.bounds`、`check.course`、`check.styles`、`assets.inspect`、`check.skill`、`environment.doctor` | 模块、页面、资源、Skill 与环境检查 |
| `media/` | `capture.slides`、`capture.thumbnails`、`capture.inspect`、`assets.upload`、`media.remove-green` | 截图、上传与视频处理 |
| `analysis/` | `analyze.pages` | 源码和缩略图统计 |
| `common/` | 内部辅助文件 | 路径、输出与命令行共用逻辑 |
| `tests/` | 测试及测试辅助脚本 | 工具回归验证 |
| `templates/` | 不登记为工具 | 新建 Python / Node 脚本的可复制模板，用法见[脚本规范](engineering/scripts.md) |

清单中的分类用于工具发现，实际路径以清单为准。Rubric 由模型执行，规则见[评分说明](eval/rubric.md)，评估命令与验收流程见[评估脚本与验收](eval/evaluation.md)。

Skill 仅收纳跨课程复用的创作工具。具体课程的模型训练、数据预计算、缓存生成与专用素材导出属于对应模块或后端，不登记到 Skill 工具目录。运行时计算服务继续由 `backend/src/idl_backend/` 实现，服务启停仍使用仓库 `scripts/devstart.ps1`、`devstop.ps1`，不复制一套服务管理逻辑。

## 常用任务

### 模块大纲与工程创建

```powershell
python creator-skill/scripts/tools.py module.init --directory Digital-Image-Intro
```

确保 `modules/Digital-Image-Intro/outlines.json` 存在：已有文件不读写，缺失时只创建初始大纲，不生成 React 文件或资源目录。替换模块名即可使用；可用 `--title "演示标题"` 设置新大纲标题，`--dry-run` 只查看是否需要创建。页面规划见[大纲说明](design/course-outline.md)。

### 截图和缩略图

以下以仓库中的 Policy-Gradient 为例，调用时替换为任务目标。模块可用目录名、课程 ID 或 UUID 指定；`--slide` 使用实际场景 ID，可通过 `capture.inspect` 查询。省略 `--slide` 会捕获整套课件。

```powershell
python creator-skill/scripts/tools.py capture.slides --module Policy-Gradient --slide play-maze --base-url http://127.0.0.1:5173
python creator-skill/scripts/tools.py capture.thumbnails --module Policy-Gradient --slide play-maze
python creator-skill/scripts/tools.py capture.inspect --module Policy-Gradient
```

截图统一写 `assets/<UUID>/scenedeck-thumbnails/<页ID>.png`，保存 1600×900 原图，供播放器缩略图和软评估共用；`capture.slides`、`capture.thumbnails` 与 `--format both` 均只输出这一份图。已有图片对应当前实现时直接复用。可用 `--state` 命名操作状态并写入 `<页ID>/<状态>.png`，`--output` 指定图片根目录。未指定 `--base-url` 时会临时启动 Vite，结束后停止；浏览器使用隔离的无头上下文，不读取用户浏览器配置。

`--actions` 接收按 slide ID 分组的 JSON 文件路径，支持 `click`、`fill`、`press` 和有上限的 `wait`。例如文件内容为 `{"play-maze":[{"action":"click","selector":"button[data-example]"}]}`。选择器必须来自实际页面；只执行任务已授权的操作，不能随便点击训练或发布按钮。传入 `--actions` 时同时传入非 `default` 的 `--state`，如 `--state answered`，避免覆盖默认状态。复查截图覆盖对应状态文件，评分前必须重新读取。


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

资源分析不删除疑似重复文件，也不以静态扫描断言动态引用无效。OSS 上传默认跳过已存在对象；目标地址、凭据和私有 JSON 记录参数见主入口列出的“模块资源”说明。真实上传需本次任务已有发布授权。

### 课件分布统计报告

```powershell
python creator-skill/scripts/tools.py analyze.pages
python creator-skill/scripts/tools.py analyze.pages --module Neuron-Guide --output work/neuron-statistics.html
```

离线扫描当前 PPT / course 的页面入口，不启动浏览器、不训练模型。近似统计每页可见文字、按钮、超链接、输入控件、图片、视频和图形声明；读取 UUID 目录下已有缩略图，计算大津二值化的亮像素留白率、主要颜色数、边缘密度、灰度熵等。缺图与未匹配当前页面的旧图单列，不用 0 填充视觉指标。默认生成 HTML 统计报告 `page-statistics.html`、同名 CSV 和 JSON 到 `references/`；报告嵌入缩略图和二值化预览，可以离线移动和打开。

留白率是亮部面积代理，深色背景与照片不等同于真实空白；控件数是源码声明数，循环不展开、条件分支可能多计。字数统一采用静态近似，与浏览器当前交互状态统计会有差异。使用时看报告中的口径说明，不把这些描述性指标直接当作质量分。可选 `--text-counts` 导入前次逐页文字 CSV；`--no-previews` 生成不嵌图的轻量报告。

Python 图像依赖见 `scripts/requirements-statistics.txt`；源码扫描复用仓库 TypeScript 与 Node.js。`collect_page_metrics.cjs` 是该命令的底层源码扫描器，可单独输出 JSON。

## 依赖与验证

基础 Python 工具需要 Python 3.10+；Node 工具使用支持内置 WebSocket 的现有 Node 环境。`scripts/requirements.txt` 安装 Skill 校验与 OSS 依赖；截图依赖单独在 `scripts/requirements-capture.txt`，避免为只读检查安装视觉模型。

环境诊断只检查通用工具依赖，不安装包或启动服务。课程计算能力按对应模块与后端说明使用，不由 Skill 工具目录接管。未验证的处理与上传如实说明，不把帮助命令通过称为实际执行成功。

## 工具回归测试

测试与测试辅助脚本位于 `scripts/tests/`。修改工具、路径或目录结构时，从仓库根目录执行：

```powershell
python -m pytest creator-skill/scripts/tests -q
node --test creator-skill/scripts/tests/ppt_bounds.test.mjs
```

测试环境需有 pytest；截图测试还需截图依赖和可用 Chromium，骨架类型检查复用仓库的 TypeScript。测试通过只证明工具覆盖的行为，不代表实际课程已经通过页面验收。
