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

中间产物遵守根入口的两级 `_scratchpad/` 约定。逐页设计与检查产物保存到 `pages/<语义页目录>/_scratchpad/`；课程整体原稿和汇总结果保存到模块级 `_scratchpad/`。工具通过 `--module` 定位模块；逐页截图同时指定 `--slide` 与 `--page-directory`。其他逐页工具通过 `--output` 指向页目录内的 `_scratchpad/`；相对路径按仓库根目录解析。

## 分类

| 目录 | 工具 ID | 用途 |
|---|---|---|
| `module/` | `module.identity`、`module.init` | 模块身份与初始大纲 |
| `checks/` | `check.module`、`check.bounds`、`check.course`、`check.styles`、`assets.inspect`、`check.skill`、`environment.doctor` | 模块、页面、资源、Skill 与环境检查 |
| `checks/` | `check.asset-imports` | 检查 assets 运行时边界，禁止源码编译时导入；构建前自动执行 |
| `media/` | `extract.pptx`、`capture.slides`、`capture.thumbnails`、`capture.inspect`、`assets.upload`、`media.remove-green` | 原稿提取、截图、上传与视频处理 |
| `analysis/` | `analyze.pages` | 源码和缩略图统计 |
| `common/` | 内部辅助文件 | 路径、输出与命令行共用逻辑 |
| `tests/` | 测试及测试辅助脚本 | 工具回归验证 |
| `templates/` | 不登记为工具 | 新建 Python / Node 脚本的可复制模板，用法见[脚本规范](engineering/scripts.md) |

清单中的分类用于工具发现，实际路径以清单为准。页面制作与修改后执行[基础检查与验收](eval/checks.md)；仅用户明确要求评分时加载 [Rubric Evaluation](eval/rubric-evaluation.md)，不把一般检查或优化请求视作评分授权。

Skill 仅收纳跨课程复用的创作工具。具体课程的模型训练、数据预计算、缓存生成与专用素材导出属于对应模块或后端，不登记到 Skill 工具目录。运行时计算服务继续由 `backend/src/idl_backend/` 实现，服务启停仍使用仓库 `scripts/devstart.ps1`、`devstop.ps1`，不复制一套服务管理逻辑。

## 常用任务

### 模块大纲与工程创建

```powershell
python creator-skill/scripts/tools.py module.init --directory Digital-Image-Intro
```

确保 `modules/Digital-Image-Intro/outlines.json` 存在：已有文件不读写，缺失时只创建初始大纲，不生成 React 文件或资源目录。替换模块名即可使用；可用 `--title "演示标题"` 设置新大纲标题，`--dry-run` 只查看是否需要创建。页面规划见[大纲说明](design/course-outline.md)。

### PPTX 原稿提取

```powershell
python creator-skill/scripts/tools.py extract.pptx "原稿.pptx" --module Digital-Image-Intro
```

需要 Windows 与已安装的桌面版 Microsoft PowerPoint，不需要额外 Python 包。默认创建 `modules/Digital-Image-Intro/_scratchpad/原稿-extracted/`；已有目录拒绝覆盖，可用 `--output` 指定该模块 `_scratchpad/` 内的新目录。原稿只读打开。

每页输出 `0001.png`、`0001.txt`、`0001.notes.txt`，分别为页面图片、正文和演讲者备注；无备注时文件为空。`manifest.json` 按原稿页序汇总页码、正文、备注和相对文件路径，包括隐藏页。图片默认宽 1600 像素，高度保持原稿比例，可用 `--width` 调整。`--timeout` 为导出超时秒数，默认 300。

图片是 PowerPoint 导出的静态画面，不播放动画或视频。正文提取包含文本框、组合内文字和表格，按文件内对象顺序排列，不做 OCR；图片、图表、SmartArt 及母版中的文字需对照截图核查。备注提取正文占位符，不混入页码、页眉和页脚。导出失败不发布半成品目录。

### 截图和缩略图

以下以仓库中的 Policy-Gradient 为例，调用时替换为任务目标。模块可用目录名、课程 ID 或 UUID 指定；`--slide` 使用实际场景 ID，可通过 `capture.inspect` 查询。省略 `--slide` 会捕获整套课件。

**仅更新缩略图，直接执行一条命令：**

```powershell
python creator-skill/scripts/tools.py capture.thumbnails --module AI-Practice-Education
```

优先复用 5173 端口上经握手确认属于当前仓库的 Vite；没有匹配服务时自动启动并关闭精简的临时服务。临时服务不启动全站离线构建、下载准备或 Cloud 注入，并使用独立依赖缓存，避免干扰正在开发的页面。其他端口可用 `--base-url` 明确指定。页 ID 已知时用 `--slide <ID>` 只更新受影响页；不必先运行 `capture.inspect`、扫描脚本源码或检查全部依赖。只有缺依赖或命令失败时再按具体错误诊断。

默认复用一次加载的课件，每次切页重新挂载页面以重置状态；等待字体、图片、可见的 `aria-busy` 和 `data-capture-ready` 就绪，不为每页固定停留数秒。**常规生成不要传 `--settle-ms 6500`**；只有明确需要某个等待时刻的截图才指定 `--settle-ms`。异步生成内容或自动播放页面应在实际内容容器暴露 `data-capture-ready={是否完成}`，不要让通用截图脚本识别课程专属选择器。默认加载/就绪超时 15 秒，可用 `--timeout-ms` 调整；渲染异常直接报告原因。

冷启动依赖优化导致首次加载超时时，工具保留已启动的服务并仅重试入口一次；不会无上限重跑整套。原有服务和用户浏览器不被关闭，工具自己的隔离浏览器在截图缓冲完成后直接退出。

正式图片写入模块自己的 `assets/scenedeck-thumbnails/`。同时自动保存模块 `_scratchpad/thumbnails/report.json` 和 `contact-sheet.jpg`；单页任务保存 `<页ID>.json`，不重建整套总览。JSON 返回 `generatedCount`、`requestedCount`、`generationStatus`、`checksStatus`、`timing.totalSeconds`、各页 `elapsedMs` 及报告路径，无需另写汇总脚本。

检查 `generationStatus` 和生成数量后打开总览核对。`generationStatus: ok` 表示图片已写入；`checksStatus: failed` / 退出码 `1` 表示另有布局检查发现，不等于没有生成图片，**不要因此反复重跑整套**。保留并按范围核对这些发现；只有执行错误、缺页或图像错误才补采相关页。缩略图维护不默认制作 ZIP、额外逐页截图或执行全仓库测试；修改了工具本身才运行工具回归测试。

```powershell
python creator-skill/scripts/tools.py capture.slides --module AI-Learning-Exploration --slide opening --page-directory OpeningPage --base-url http://127.0.0.1:5173
python creator-skill/scripts/tools.py capture.thumbnails --module Policy-Gradient --slide play-maze
python creator-skill/scripts/tools.py capture.inspect --module Policy-Gradient
```

逐页使用 `capture.slides --slide <场景ID> --page-directory <语义页目录>`，保存到 `modules/<模块目录名>/pages/<语义页目录>/_scratchpad/screenshots/<场景ID>.png`；操作状态用 `--state` 命名为 `<场景ID>/<状态>.png`。批量捕获旧模块而未指定页目录时仍兼容模块级输出，制作新页时使用逐页目录。`--output` 可指定对应页 `_scratchpad/` 内的图片目录。

`capture.thumbnails` 生成正式播放器缩略图，默认保存到 `modules/<模块目录名>/assets/scenedeck-thumbnails/<页ID>.jpg`（320×180 渐进式 JPEG，质量 75、4:4:4 采样），只接受默认状态；其 `--output` 仅可选择正式缩略图目录内的位置。`capture.slides --format both` 从一次采集中同时写入评估目录和正式缩略图目录。评估截图仍为 1600×900 PNG。采集到当前运行时第一页时，自动另外生成 `assets/course-covers/<第一页ID>.jpg`（800×450，质量 80），供首页使用；封面直接由完整页面采样，不放大小缩略图。智能体只需指定模块，可选指定页 ID，无需填写尺寸和质量；已有图片对应当前实现和状态时直接复用。

浏览器使用隔离的无头上下文，不读取用户浏览器配置。复用已有 Vite 时不关闭用户的服务；仅临时启动的服务会在任务结束后停止。

截图入口在隔离浏览器内直接挂载目标模块 `outlines.json` 的 `ppt.entry`，复用真实课件组件、Shared 样式与资源，不依赖应用旧的 `/scenedeck/` 路由，也不另建页面副本。工具及浏览器启动辅助文件均位于 `creator-skill/scripts/`；后端同名旧命令只保留兼容转发。整批采集结束、关闭浏览器后才写入图片，避免更新资源触发 Vite 热刷新而打断后续页面。

`--actions` 接收按 slide ID 分组的 JSON 文件路径，支持 `click`、`fill`、`press` 和有上限的 `wait`。例如文件内容为 `{"play-maze":[{"action":"click","selector":"button[data-example]"}]}`。选择器必须来自实际页面；只执行任务已授权的操作，不能随便点击训练或发布按钮。传入 `--actions` 时同时传入非 `default` 的 `--state`，如 `--state answered`，避免覆盖默认状态。复查截图覆盖对应状态文件，检查时必须重新读取。

### 页面基础检查与字数

`capture.slides` 复用同一次加载、动作和截图，在 JSON 的 `checks` 中返回各页当前状态的几何检查和字数：验证页面就绪、实际页 ID、逻辑画布、画布外越界、容器内部溢出。`--surface` 默认 `.ppt-slide-surface`。可追踪的内部视口例外及人工核对范围见[基础检查](eval/checks.md)。

字数口径为 `rendered-dom-codepoints-v1`：中文、英文字母、数字、标点各计一个非空白 Unicode 码点，可见文本节点不重复累加，隐藏文本和画布外播放器、讲稿不计。可见文本输入值和选中项单列并计入；密码及非文本控件不计。图片、Canvas、视频及 CSS 生成文字未覆盖，输入值可能包含裁切字符；不是 OCR 或完整页面精确计数。默认与交互状态分别返回，不相加。

仅有明确上限时传 `--max-chars <上限>`；未传时照常统计，`maximum` 和 `exceeded` 为 `null`。`text.characters: null` 表示未验证，不能记为零。JSON 的错误、警告、例外和覆盖限制分列；退出码 `1` 为发现违规，`2` 为执行错误或未验证，截图仍可用于定位问题。基础检查不生成 Rubric 分数或 HTML 报告。

`check.bounds --url <页面地址> --slides <页ID>` 复用同一浏览器检查表达式，通过已有 Chromium 调试端口（默认 9223，`--port` 可改）新开检查标签页，结束后关闭；不启动浏览器或服务。按就绪条件轮询，`--timeout` 默认 15000 毫秒。术库 URL 自动使用无播放器侧栏的捕获入口；其他页面须暴露真实 `data-scene-id`。支持同样的 `--surface` 和 `--max-chars`。此命令检查新开页面的默认状态；关键操作状态用 `capture.slides --actions ... --state ...`，不另建动作格式。


### 课程一致性

```powershell
python creator-skill/scripts/tools.py check.course --module Policy-Gradient --base-url http://127.0.0.1:5173
```

通过 Vite 的真实模块导出读取 PPT 场景与讲稿，并在隔离上下文临时展开 Guide，比较页 ID 和顺序。标题、讲稿差异单列为警告，不擅自改写；Guide 未暴露可读页序时返回未完成检查，不假称一致。

`--save-snapshot modules/<模块目录名>/_scratchpad/snapshots/course.json` 可保存本次真实快照，返回实际保存路径；后续用 `--snapshot` 离线比较。离线比较不能证明当前页面未变化。运行检查可能加载页面本身的默认行为，需在适用的本地环境执行。

### 资源与环境

素材清单读取目标模块自己的 `modules/<模块目录名>/assets/`。上传使用默认资源发现与 `--module <UUID>` 保留 OSS UUID 前缀；共享素材与历史别名按资源索引解析，详见[模块身份与资源](engineering/module-assets.md)。

```powershell
python creator-skill/scripts/tools.py assets.inspect --module Policy-Gradient --duplicates
python creator-skill/scripts/tools.py assets.upload --module <UUID> --dry-run
python creator-skill/scripts/tools.py assets.upload --help
python creator-skill/scripts/tools.py environment.doctor --group capture
python creator-skill/scripts/tools.py environment.doctor --tool capture.slides
python creator-skill/scripts/tools.py media.remove-green "原视频.mp4" --module Digital-Image-Intro
```

资源分析不删除疑似重复文件，也不以静态扫描断言动态引用无效。OSS 上传默认跳过已存在对象，`--dry-run` 不联系 OSS、不需要凭据或 oss2；执行上传所需依赖见 `scripts/requirements.txt`。目标地址、凭据和发布约定见[模块身份与资源](engineering/module-assets.md)，完整参数以工具帮助为准。真实上传需本次任务已有发布授权。

绿幕处理默认将 `<原视频名>_alpha.webm` 和同名 `.mov` 写入该模块 `_scratchpad/media/`，重复执行会覆盖这两个文件；可用 `--output` 指定目录内其他位置。选定正式素材后按[模块身份与资源](engineering/module-assets.md)归档。

### 课件分布统计报告

```powershell
python creator-skill/scripts/tools.py analyze.pages
python creator-skill/scripts/tools.py analyze.pages --module Neuron-Guide
```

离线扫描当前 PPT / course 的页面入口，不启动浏览器、不训练模型。近似统计每页可见文字、按钮、超链接、输入控件、图片、视频和图形声明；通过模块 UUID 解析 `modules/<模块目录名>/assets/scenedeck-thumbnails/` 下已有缩略图，计算大津二值化的亮像素留白率、主要颜色数、边缘密度、灰度熵等。缺图与未匹配当前页面的旧图单列，不用 0 填充视觉指标。报告默认保存到对应模块 `_scratchpad/reports/page-statistics.html`，附同名 CSV 和 JSON；未指定 `--module` 时逐模块保存报告，JSON 结果列出各报告路径。`--output` 需同时指定 `--module`，只能选择该模块 `_scratchpad/` 内的 `.html` 路径。报告嵌入缩略图和二值化预览，可以离线移动和打开。

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

批量重新生成全部已注册课件的 JPG 缩略图：

```bash
python creator-skill/scripts/media/capture_all_thumbnails.py --base-url http://localhost:5173
```

旧缩略图格式迁移：`python creator-skill/scripts/media/migrate_thumbnail_jpg.py`。保留已生成 JPG，转换缩略图目录内的旧格式，验证后移除旧文件，并同步旧地址兼容映射；普通教学图片和评估截图不受影响。

### 大纲必填字段

`python creator-skill/scripts/tools.py check.outlines` 静态验证所有模块大纲每页的 `id`、`title`、`snippet` 非空且 ID 唯一，不启动服务。加 `--module <目录名>` 限定模块；`--fix` 优先从现有场景补 ID，保留已存在的 ID，不编造题目或讲稿。未实现页面生成一次性的稳定 ID。
