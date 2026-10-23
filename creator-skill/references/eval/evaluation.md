# 评估脚本与验收

所有评估脚本平铺在 `scripts/`，本目录只保留评估说明与 [Rubric 评分规则](rubric.md)。可确定的要求优先运行脚本；教学表达、视觉与交互质量由模型读取真实截图并结合操作证据评分，脚本不会自动给出 Rubric 分数。

## 准备评估环境

从仓库根目录执行命令。先确定本次模块、页 ID 和受影响状态；用 `python creator-skill/scripts/tools.py describe <工具ID>` 查看脚本的依赖与执行效果，用 `<工具ID> --help` 查看参数。

截图与在线课程一致性检查需要 Playwright、Pillow 和可用 Chromium；依赖清单位于 `scripts/requirements-capture.txt`。可先运行 `python creator-skill/scripts/tools.py environment.doctor --tool capture.slides` 检查环境。已有 Vite 服务时传入 `--base-url`；未传入时截图工具会临时启动并在结束后关闭 Vite。边界检查另需已有的 Chromium 远程调试会话，详见下方调用说明。

## 页面验收循环

1. **完成初稿。** 沿用已确认的目标和设计，明确本次页面、修改范围、需要检查的交互状态与用户指定的限制。
2. **检查初稿。** 按两类标准选择适用项，运行硬检查，生成并实际读取真实截图，操作相关交互后按软评估规则打分。设计图不能代替实现效果，类型检查不能代替视觉检查。
3. **定位问题。** 每项问题写明页 ID、状态、具体元素或代码位置、实际现象与应达到的标准。例如“第 3 页提交后，反馈文字超出右侧区域”，不能只写“排版需要优化”。
4. **局部返工。** 只修改不合格部分及其必要依赖，保留已通过部分和已确认设计方向，不扩展为无关页面重做或 Shared 修改。仅请求评估时只给出问题与修正建议，不自动改页面。
5. **复查与结束。** 重新运行受影响检查、查看修改后的状态；涉及公共逻辑或页序时扩大到受影响范围。硬检查通过且软评估达到分数门槛后结束，否则继续返工。

默认初稿评估后最多 **2 轮返工**，每轮修改后复查一次；用户指定次数时遵循用户要求。到达上限或必要检查受阻时，保留成果，列出未解决问题与缺少的验证条件，不无限重试，不将“未验证”算作通过。

检查结果使用“通过 / 不通过 / 未验证 / 不适用”。不适用项说明理由；建议性改进不作为必需返工项。已有的无关错误单独说明，不借此修改无关课程。

## 检查范围与工具

优先复用 `creator-skill/scripts/tools.py` 中的工具，命令与适用条件见下方检查标准与脚本调用。先确认实际模块、页 ID、入口及依赖，截图必须来自本次修改后的页面。完成多个页面时逐页检查；已有连续制作授权也不省略验证。

对 TS/TSX 改动运行 `npm run typecheck`；新模块注册、打包或资源发布相关改动通常还需 `npm run build`。用户明确不需要 build 时执行相关类型与渲染检查并说明范围。计算或状态逻辑变化运行能验证实际行为的相关测试，不为低影响文字或样式修改编写机械对应实现的测试。没有新改动或未解决风险时，不反复执行全量检查。

## 仅修改 skill 或其他文档

运行 `python creator-skill/scripts/tools.py check.skill creator-skill`，检查 frontmatter、占位符与本地链接；再核对任务入口、命令、代码路径和规则一致性。文档改名或移动时检查调用方与文档展示插件；不因纯文档修改启动模型、GPU 或课程服务。

## 交付

简要说明改动、实际检查结果和剩余问题，无需额外生成评分表或流程报告。默认逐页制作时展示真实效果；已有连续制作授权时按授权范围推进。尚未运行的检查不能写成“通过”。

## 检查标准

针对本次页面与受影响范围检查。每项记录实际证据；脚本未覆盖的动态行为需要运行页面验证，不根据静态检查推断通过。

| 检查项 | 可观察的通过标准 | 检查方式 |
|---|---|---|
| 文件与身份 | 模块元数据、入口和所需页面文件完整；UUID 格式正确、无重复且未缺失；页 ID 无重复 | `check.module`；身份变更时补充 `module.identity --check` |
| 资源与引用 | 素材位于根目录 `assets/<moduleIdentity.id>/`；UUID、`moduleAssetUrl` 和 SceneDeck `assetId` 一致；实际所需文件、图集索引和图集存在且可加载 | `check.module`，结合页面加载和动态引用检查 |
| 页序与内容对应 | 大纲、Guide 与 PPT 的页 ID 和顺序一致；涉及修改的核心内容、讲稿与习题呈现相符 | 页序或双入口内容变化时运行 `check.course`，并查看实际页面 |
| 数据与计算 | 相同量在图形、文字、公式和反馈中一致；用已知输入复算得到预期结果；参考答案正确，模拟数据有清楚标识 | 优先复用相关计算或测试脚本，核对预期值与实际值；无法确定时标记未验证 |
| 画布与可见内容 | 实际页面为 1600×900；文字、公式、媒体、标签及控件完整，无非预期重叠、截断或越界 | 真实截图与 `check.bounds`；有意设计的内部视口按可见内容检查，不以裁切掩盖页面溢出 |
| 数量与长度 | 满足用户明确规定的页数、字数或其他长度限制；内容完整放入实际画布 | 按指定计数口径检查并查看渲染；未指定限制时不自行添加固定字数门槛 |
| 交互状态 | 默认状态与关键操作后的状态正确；本次涉及的等待、失败、重试、重置分支可正常使用，结果与输入对应 | 实际操作与相关行为测试，截图覆盖受影响状态 |
| 实现约束 | 类型检查通过；沿用 Shared 组件、Typography 和 Theme；无未授权 Shared 修改、跨模块样式污染、重复播放器或禁止的运行时依赖 | `typecheck`、检查改动与相关样式；必要时 `check.styles` 辅助分析 |

脚本只验证各自覆盖的条件。`check.styles` 是启发式统计，不能据此认定 CSS 未使用；重复资源检查只提供线索，不自动删除文件。单页修改无需重验无关课程。

## 脚本覆盖范围

确定性检查实现均在 `scripts/`：`validate_module.py` 检查元数据、TSX 字面量资源路径及依赖；`validate_ppt_bounds.mjs` 检查画布边界；`course_consistency.py` 检查课程一致性；`analyze_module_styles.mjs` 分析样式；`inspect_assets.py` 检查资源与重复。

TSX 类型检查复用仓库 `npm run typecheck`。脚本未实现的组件使用、布局和动态引用约束仍需检查代码或真实运行，不能声称全部已自动覆盖。

## 脚本调用

从仓库根目录调用，模块名、页 ID、URL 和选择器替换为实际值：

```bash
python creator-skill/scripts/tools.py check.module --module <模块名或UUID>
python creator-skill/scripts/tools.py check.course --module <模块名> --base-url <Vite地址>
python creator-skill/scripts/tools.py check.styles --module <模块目录名>
python creator-skill/scripts/tools.py assets.inspect --module <模块名或UUID> --duplicates
python creator-skill/scripts/tools.py capture.slides --module <模块名> --slide <页ID> --base-url <Vite地址>
python creator-skill/scripts/tools.py check.bounds --url <页面地址> --slides <页ID>
```

按本次改动选用命令，不要求每次运行全部检查。涉及 TS/TSX 时补充 `npm run typecheck`；身份变化时补充 `module.identity --check`。查看输出中的错误与警告并核对检查范围；退出码为零不能证明脚本未覆盖的动态行为、教学质量或视觉效果通过。

`check.module` 只读，UUID 与模块 slug 的重复始终全局检查；它检查元数据、入口、页 ID、字面量资源引用和依赖，不能验证全部动态表达式。

`capture.slides` 生成真实 1600×900 截图；可用 `--actions` 配合 `--state <状态名>` 指定点击、填入或按键等操作，调用前确认实际选择器及动作效果。`check.bounds` 需要已有 Chromium 远程调试会话，默认端口 9223，可用 `--port` 改写；不启动浏览器或服务，会关闭自己创建的检查标签页。按实际画布选择 `--surface`（默认 `.ppt-slide-surface`），仅检查当前渲染状态，不能代替截图和交互验证。其他参数通过对应工具的 `--help` 查询。

## 截图与评分证据

复用 `scripts/capture_slides.py`，从仓库根目录执行：

```bash
python creator-skill/scripts/tools.py capture.slides --module <模块名> --slide <页ID> --base-url <Vite地址>
python creator-skill/scripts/tools.py capture.slides --module <模块名> --slide <页ID> --base-url <Vite地址> --actions <动作JSON文件路径> --state answered
```

`--actions` 读取 JSON 文件，按实际页 ID 列出操作，例如 `{"page-id":[{"action":"click","selector":"button[data-example]"}]}`；将示例页 ID 与选择器替换为目标页面的真实值。支持的动作与限制见工具帮助和[工具索引](../tools.md)。

截图与播放器缩略图共用根目录 `assets/<UUID>/scenedeck-thumbnails/`：默认状态为 `<页ID>.png`，操作状态为 `<页ID>/answered.png`，不覆盖播放器使用的默认图。统一保存 1600×900 原图，播放器按缩略图尺寸显示，模型读取同一张原图评分，不另生成评估副本。`--slide` 使用实际 SceneDeck 页 ID；省略时逐页截图。已有图片确认对应当前实现和状态时直接复用；页面修改后仅重新生成受影响的截图。动作格式和环境条件见主入口的工具说明。

模型必须通过图片读取工具打开对应当前实现的截图，并结合本页教学目标、必要的前后页和操作说明评分。至少读取默认状态；有交互时再读关键操作后的截图。图片无法证明的行为需实际操作验证；截图缺失、过期、不可读或模型不支持读图时标记未验证，不给出推测分数。修复后重新截图并重新读取，不沿用旧图评分。


采集证据后按 [Rubric](rubric.md) 逐维评分；脚本退出码与 Rubric 得分分别记录。工具参数、动作 JSON 和依赖说明见[创作工具索引](../tools.md)。
