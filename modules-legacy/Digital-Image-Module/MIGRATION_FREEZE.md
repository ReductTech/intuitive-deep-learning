# Digital-Image-Module React 迁移现状冻结

冻结日期：2026-07-29  
迁移来源模块：`modules/Digital-Image-Module`  
React 目标模块：`modules/Digital-Image-Module-React`  
正式路由目标：`/modules/digital-image-module-react`

## 基线与范围

- 权威迁移前运行基线：
  `C:\Users\zoro-\AppData\Roaming\jianlun_growagent\reduct_data\.claude\skills\intuitive-deep-learning\modules\Digital-Image-Module`
- 正式工作树与减论助手打包版的 `script.js`、`style.css`、`info.json`
  哈希完全相同。
- 正式工作树中的旧 `index.html` 少了
  `../shared/base.css`、`../shared/module-components.css`、
  `../shared/canvas-utils.js` 和 `../shared/module-components.js`。
  因此它只用于私有源码参考，不能把缺少 shared 后的退化页面作为验收基线。
- 迁移目标是接入 React 教学框架，同时保留原模块稳定的 Canvas、像素采样、
  通道拆分、图片本地处理和矩阵计算。
- 本次分析没有发现必须修改 `modules/shared` 的理由。

权威旧快照 SHA-256：

```text
index.html  E9C77A19E8B8C45B655C1CC3A235D48039F91B65E2F72CA4BBD5EE813C1045A0
script.js   A1993ABAF66C949D78ED76FDB2DD410F2BE859B8AFBCA613BBB26BAD86ADCABD
style.css   655A625D41AB43F275CDB76CE47D5F30E2337FAD125C71AD1882AABE22875685
info.json   6FB47249B23E22FC228871E5FB00A968849DC02082913508E7264FFB4FDEF818
```

## 表一：页面、功能与交互冻结

| 顺序 | 区域 | 迁移前真实能力 | 完成、解锁与迁移约束 |
| --- | --- | --- | --- |
| 1 | 页头 | 标题“数字图像如何变成 RGB 矩阵”；副标题说明先观察图片，再拆成三个数字表 | 使用统一 React `ModuleShell`，不得增加原模块没有的辅助教学文案 |
| 2 | 屏幕观察图 | Canvas 绘制彩色渐变、白色圆、RGB 色块、灰阶条和细竖纹 | 保留确定性 Canvas 图案和响应式绘制，不改成静态占位图 |
| 3 | RGB 子像素放大镜 | 点击“放大 RGB”后，鼠标移动时以圆形浮层显示 9×9 单元，每个单元拆为 R/G/B 三条；Esc 关闭 | 开关、悬浮跟随、边界和高分屏绘制保留；开关状态可恢复，指针位置不持久化 |
| 4 | 观察简答题 | 问“摄像头靠近屏幕后连续颜色发生什么变化”；非空提交调用真实分析接口 | 请求成功或失败后都进入下一阶段；不能用写死评语冒充服务结果 |
| 5 | RGB 调色实验 | 三个连续滑杆分别控制 R/G/B；实时显示颜色、0–1 向量和 0–255 向量 | `R<0.05 && G>0.95 && B<0.05` 时完成；一次拖动只产生一个语义提交 |
| 6 | 纯绿反馈 | 未完成时提示调成 `[0,1,0]`；完成后显示 `[0,255,0]` | 首次完成后揭示上传区；恢复时直接呈现，不重复延时、滚动或记录 |
| 7 | 图片输入 | 支持文件选择、拖拽图片、示例图；图片只在浏览器本地处理；最长边压缩到 512 | 不能用假上传按钮；不向后端上传图片；无效文件不应破坏当前结果 |
| 8 | 示例图 | Canvas 生成 384×256 渐变、绿色圆、白色矩形和蓝色条纹 | 保留同一生成算法，确保刷新恢复时可精确重建 |
| 9 | 原图与通道 | 显示原始彩色图，以及 R/G/B 三张灰度强度图 | 继续保留原私有 Canvas；通道图不是三个着色蒙版 |
| 10 | 3×3 选区 | 默认位于图像中心；在原图或任一通道画布按下拖动可更换选区；画布同时显示放大 inset | 拖动中只更新草稿，释放时形成一次状态事件；刷新后恢复像素坐标 |
| 11 | 数值矩阵 | 每个通道显示选区对应的 3×3 数值，中心格高亮；支持 `0–255` 与 `0–1` 两种显示 | 切换一次只记录一次；矩阵必须来自当前真实图片像素 |
| 12 | 课程结尾 | 图片拆分后显示 `H×W×3` 总结、三个 Bilibili 视频、课程目录和下一课 | 图片成功拆分即正式完成；下一课保留课程链路中的 `Manual-Feature-Classification`，待其 React 迁移验收后再切换 |

## 表二：状态、事件与 SQLite 恢复

| 状态域 | SQLite `state_key` | 必须保存的稳定快照 | 事件与恢复要求 |
| --- | --- | --- | --- |
| 教学流程 | `lesson-flow:digital-image-module-react` | `completedIds`、`visibleCount`、`completed` | 直接复用 Lesson Flow；恢复不重新滚动、不播放解锁动画、不伪装成用户完成 |
| 观察题 | `question:digital-image-observation` | 文本、提交结果、完整模型评语 | 使用 shared `Question`；刷新后不得重新请求 59414 |
| 放大镜 | `activity:digital-image-observation` | `magnifierEnabled` | 开关一次写一个 `digital_image_magnifier_toggle`；hover 和指针位置不保存 |
| RGB 调色 | `activity:digital-image-rgb` | `r/g/b`、`solved` | 滑动中只更新内存；pointerup、键盘提交或失焦写一个 `digital_image_rgb_commit` |
| 图片实验 | `activity:digital-image-matrix` | 来源类型、可恢复的本地图像快照、宽高、选区、scaleMode、splitDone | 示例图保存稳定来源标记；用户图片保存本地规范化快照，不新增 localStorage |
| 选区拖动 | 并入图片实验 | 最终像素坐标 | pointerup 写一个 `digital_image_selection_commit`；pointermove 不写事件 |
| 数值模式 | 并入图片实验 | `255` 或 `unit` | 点击写一个 `digital_image_scale_mode_commit`；恢复不重复点击 |
| 模块完成 | `module:digital-image-module-react` | `completed`、`completedIds` | 图片成功拆分时由最终 Lesson Flow 步骤幂等产生一次 `module_complete` |

不持久化的瞬态包括：Canvas context、ResizeObserver、DPR、DOMRect、
指针位置、拖拽深度、pointer capture、object URL、临时 `Image` 对象、
RAF 和动画 class。用户上传的图片不离开本机；为刷新恢复而保存的规范化
图像快照只写入现有 Telemetry SQLite。

建议语义事件：

- `digital_image_magnifier_toggle`
- `digital_image_observation_submit`
- `digital_image_rgb_commit`
- `digital_image_demo_load`
- `digital_image_upload_commit`
- `digital_image_selection_commit`
- `digital_image_scale_mode_commit`

## 表三：后端与外部依赖

| 依赖 | 迁移前契约 | React 迁移边界 |
| --- | --- | --- |
| 观察评阅 API | `POST http://127.0.0.1:59414/image/observation-feedback`，body `{answer}`；结构化结果包含 `verdict/level/is_correct/explanation/task_id` | 保留真实请求、错误码和失败语义；模块私有 service 校验响应；服务失败仍允许继续，与旧流程一致 |
| LLM Proxy | 59414 通过 59413 调用已配置模型 | 前端不持有密钥；未启动服务不是删除简答题的理由 |
| Telemetry SQLite | Vite 将 `/__telemetry` 代理到 59411；shared telemetry 负责事件与状态读取 | 禁止新增 localStorage；模块私有 typed adapter 只组合现有 API，不修改 shared |
| 浏览器文件 API | `<input type=file>`、拖放、object URL、`Image`、Canvas `ImageData` | 图片仅本地处理；组件卸载时释放 object URL；恢复使用 SQLite 中的本地规范化快照 |
| 旧 Canvas 全局 | `DLCanvas.prepare/size/pointer` | 将高清缩放、坐标映射和 ResizeObserver 生命周期适配到模块私有 React 组件，不向 shared 加回旧全局 |
| 旧 UI 全局 | `DLModuleUI.mountQuestion/renderRelatedVideos/requireServiceResult` | 标准问答和资源分别改用 shared `Question`、`LessonFooter`；业务响应解析留在模块 service |
| Bilibili | 三个 iframe | 作为延伸资源保留，加载失败不能阻断模块完成 |
| 导航 | `../CourseMap/`、`../Manual-Feature-Classification/` | 返回入口使用 React 课程目录；下一课在目标模块迁移完成前保留旧正式地址 |

## 表四：React 与 shared 复用关系

| 迁移内容 | 直接复用 shared | 模块私有保留/适配 | 是否修改 shared |
| --- | --- | --- | --- |
| 页面外壳 | `ModuleShell` | 模块 class 和原文案 | 否 |
| 教学步骤 | `LessonFlow`、`ScrollCue` | 三个真实完成条件 | 否 |
| 标准内容区 | `LessonStage`、`Callout`、`NoticeStrip` | 课程文案和局部网格 | 否 |
| 观察简答题 | `Question` | 59414 review service、失败后继续规则 | 否 |
| RGB 控件 | `RangeControl`、`ValueTile`、`NoticeStrip` | 阈值、颜色换算和去重提交 | 否 |
| 放大镜 | shared 按钮视觉 | 私有 Observation Canvas 和 RGB 子像素绘制 | 否 |
| 上传区 | shared token 和按钮视觉 | 文件选择、拖拽、图片解码、错误处理 | 否 |
| 原图与通道 | shared 卡片/面板样式 | 私有 Canvas、高分屏绘制、通道 ImageData | 否 |
| 3×3 矩阵 | shared 排版 token | 私有像素采样、中心格和通道颜色 | 否 |
| 状态恢复 | shared telemetry API | 模块私有 typed SQLite adapter 和图像快照 schema | 否 |
| 课程结尾 | `LessonFooter`、`RelatedVideos` | 原三个视频和下一课地址 | 否 |

## Lesson Flow 冻结

1. `observe-pixels`：提交非空观察，真实评阅成功或失败后均完成。
2. `mix-rgb`：把 RGB 调到纯绿色阈值。
3. `split-image`：成功载入用户图片或示例图并生成三个通道与矩阵；
   此步骤标记整个模块完成。
4. `resources`：立即显示课程总结、推荐视频和导航。

完整页面和单内容块预览必须引用同一份 React 实现。

## 拟议目录与调试路由

```text
modules/Digital-Image-Module-React/
  DigitalImagePage.tsx
  digital-image-module-react.css
  blocks/
    ObservationBlock.tsx
    RgbColorLabBlock.tsx
    ImageMatrixLabBlock.tsx
    ResourcesBlock.tsx
  components/
    ObservationCanvas.tsx
    ImageSelectionCanvas.tsx
    usePersistedActivity.ts
  model/
    imageMath.ts
    imageSnapshot.ts
  services/
    observationFeedback.ts

/dev/blocks/digital-image-module-react/observation
/dev/blocks/digital-image-module-react/rgb
/dev/blocks/digital-image-module-react/image-matrix
/dev/blocks/digital-image-module-react/resources
```

## 跨模块共性问题与 shared 决策

多个旧静态模块的工作树入口都可能缺少打包时补入的旧 shared 资源，这属于
旧静态打包/兼容运行时问题，不等于 React shared 缺少组件。本模块当前所有
特殊需求都可以通过模块内适配完成，没有满足“必须修改 shared”的四项条件。

本轮结论：

- 不修改 `modules/shared`；
- 不向 shared 加入图片上传、像素矩阵或 Canvas 放大镜；
- 不恢复 `DLCanvas`、`DLModuleUI` 全局作为 React 依赖；
- 如果后续多个图像模块都需要同一套可恢复图片快照，再单独评估共享能力。
