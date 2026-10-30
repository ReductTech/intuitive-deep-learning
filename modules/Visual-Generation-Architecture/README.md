# 视觉生成网络结构

<!-- module-structure:start -->
## 模块入口与目录约定

- 课程 ID：`visual-generation-architecture`；连续阅读入口：`/modules/visual-generation-architecture` → `ArchitectureGuide.tsx`。
- 已实现页面索引：`outlines.json` 的 `pages`（15 页）。
- PPT：`/scenedeck/?deck=visual-generation-architecture` → `ArchitecturePpt.tsx`；复用共享 SceneDeck。
- 页面布局与页面样式放在 `pages/`；模块内复用交互放在 `components/`；数据、模型和服务按需分目录。
- 专属素材归当前模块 `assets/`；共享能力只引用 `modules/shared/`，不依赖其他课程或 `modules-legacy/`。
- 教学画布为 1600×900；独立文字使用 Shared Typography；入口不复制播放器。
- 从仓库根目录运行 `npm run dev`，检查运行 `node modules/check-module-structure.mjs` 与 `npm run typecheck`。
<!-- module-structure:end -->

15 页课程网页（1 页封面 + 14 页正文）：U-Net → Latent Diffusion → DiT。内容来自工作区已整理的大纲，图解借鉴 `视觉生成网络结构参考页面图`，使用 Shared ContentBlock、Typography、公式组件、控件、Question 和 SceneDeck。Shared 标准页头下，参考图内容区素材与 React 交互层叠加。

故事主线是一份“生成正在学习的小猫”的委托：先解决布局与细节，再接通时间和文本条件，随后回应高清计算开销，最后替换为 Transformer 主干。参考了仓库课程中的摄影委托、分步加噪/去噪与条件切换的教学方式。

本轮新增：

- 进入页面后自动分步呈现，完成后停留完整画面；没有回看、播放、单步或重置这类流程按钮。切换后台或离开视野时暂停推进；减少动态效果时直接呈现完整结果。
- 沿 U-Net 逐块走读、切断 Skip、组装与断开条件路径。
- 点击猫脸/书页/背景，观察示意文本关联权重改变。
- 切换分辨率与步数，复算重复处理的空间位置数。
- 更新一维噪声预测参数，观察实际平方误差下降与曲线记录。
- 点选或拖放 patch，查看展平与线性投影示例，再改变 patch size。
- 更换主干、数值 AdaLN 对照、Cross/Joint 关系矩阵与四组合架构对照。

数字实验使用显式教学模型，图像与特征不是实际推理结果，不宣称运行真实生成网络。重设计前的源码备份位于仓库忽略的 `history/visual-architecture-before-story-20261024/`。

从仓库根目录启动：

```powershell
npm run dev:visual-architecture
```

打开 http://127.0.0.1:5180/visual-architecture.html 。Windows 也可双击仓库根目录的 `start-visual-architecture.cmd`，自动启动并打开浏览器。

- 左侧缩略图或左右方向键翻页。
- `F` 进入全屏，`N` 打开讲稿；`Home` / `End` 跳转首尾页。
- 时间滑杆、注意力路径、patch 大小、采样示意和架构对照均可操作。
- 噪声、特征格、调制与采样动画都是明确标注的教学示意，不运行真实生成模型。
- 图片保存在 `assets/`；本地预览无需 Cloud API、登录或远程素材服务。

验证与构建：

```powershell
npm run typecheck:visual-architecture
python creator-skill/scripts/tools.py check.module --module Visual-Generation-Architecture
npm run build:visual-architecture
python modules/Visual-Generation-Architecture/scripts/verify-reference-layout.py
python modules/Visual-Generation-Architecture/scripts/verify-query.py
```

浏览器检查需要正在运行的本地课程服务、Python Playwright 和 Chrome。默认截图复用仓库工具：

```powershell
python creator-skill/scripts/tools.py capture.slides --module Visual-Generation-Architecture --base-url http://127.0.0.1:5180
```

输出为 `dist-visual-architecture/visual-architecture.html`。用 HTTP 静态服务提供整个构建目录，例如 `python -m http.server 5181 --directory dist-visual-architecture`；静态成品入口为 http://127.0.0.1:5181/visual-architecture.html 。直接双击构建后的 HTML 不支持 ES 模块加载。

独立 Vite 配置绕过上游默认配置中缺失的 `deprecated/Edit-Deck` 与 Cloud runtime。原仓库全量 typecheck 仍受其他课程缺失的数据文件与旧工具引用影响；本课程使用独立类型检查和构建，不修改无关模块。

仓库 `check.course` 同样因加载全局模块发现入口而被上述缺失文件阻断。独立浏览器检查已逐页将运行时 `data-scene-ids` 与本课程大纲核对，验证两个课程入口复用的同一份页序；不将其报告为全局 `check.course` 通过。

当前 Guide 入口复用演示播放器，与 PPT 共用全部 15 页及讲稿；没有另做滚动长文版。全部成果仅保存在本地。

当前布局：Shared 模块规范 + 参考图内容区构图。

- 15 页全部使用 Shared ContentBlock 的可见标题、副标题及默认字号和间距。去除隐藏标题、整页图片覆盖及标题 Token 覆盖，Shared 公共实现保持不变。
- 11 页仅裁出原始参考页的内容区图表，保留特征纹理、透视、latent 通道与箭头关系。图片不包含原稿大标题；独立新增文字使用 Typography。原始参考文件保持不变，内容区裁剪可由脚本复现。
- 第 11、13、14 页没有整页对应的参考图，使用 22、24、08、03 等页的原始素材组合，延续白底、深蓝文字、橙色条件路径与横向流程，不套用旧蓝色面板。
- 图表与真实 React 交互使用同一原稿坐标，去除原稿页头后，等比装入 1600×900 画布的 Shared 内容区。Query、patch、时间条件和噪声覆盖层定位在原图的对应元素上。
- 第 4 页保留任意位置点击、拖动、方向键、Home/End 与边界限制；权重是教学插值。
- 第 6 页保留分辨率、总采样步数 N、已完成步数 k、动态噪声与位置计数。状态按 k/N 示意，不伪装成实际生成模型。
- 第 7 页使用原稿的横向 Encoder—latent—Decoder 链。切换生成路线时，将原图与 Encoder 实际替换为随机噪声与扩散采样；同一个 Decoder 保留。
- 第 10 页完整沿用参考图 22 的 **32×32** 示例，并明确注明这一局部示例尺寸：patch 2→256 tokens，patch 4→64 tokens。与前文 64×64 示例区别说明，不混用计数。
- 自动动画有限播放，结束后图文常驻；减少动态效果时直接显示全部内容。没有回看、播放过程、下一段或重置动画按钮。
- 原版式对应与实现边界详见 [reference-layout-plan.md](reference-layout-plan.md)。旧实现分别保存在 `history/visual-architecture-before-reference-fidelity-20261024/` 与 `history/visual-architecture-before-standard-header-20261025/`。

参考图视觉素材：

- 特征图直接取自参考图 03 的小猫/书本热力图，保留不同尺度、透视边框与纹理；不再使用随机色块。
- latent 使用参考图 12、13、18 的通道堆叠，分别表达多通道特征、编码表示、随机噪声与最终状态。
- patch、向量、DiT 块和注意力热力图取自参考图 22、24、08；区域选择、拖放、播放与数值实验仍由网页交互层实现。
- 原图保持在 `references/`，裁剪结果在 `visuals/`；`visuals/manifest.json` 记录来源、原图坐标和轮廓蒙版，`visuals/contact-sheet.jpg` 可一次查看全部素材。
- 特征、latent 与注意力图均为参考图的教学示意，不是当前交互状态下的真实模型计算结果。时间编码、投影及损失数值保持各页原有示例计算。

重新提取素材（只读取课程内本地参考图）：

```powershell
python modules/Visual-Generation-Architecture/scripts/extract-reference-visuals.py
```

复现本轮补充裁剪与验收截图：

```powershell
python modules/Visual-Generation-Architecture/scripts/extract-reference-scenes.py
python modules/Visual-Generation-Architecture/scripts/verify-reference-layout.py
python modules/Visual-Generation-Architecture/scripts/verify-query.py
```

15 页总览：`assets/reference-layout-overview.jpg`。真实截图与关键状态位于同目录下的 `scenedeck-thumbnails/`；验收结果位于 `scripts/reference-layout-results.json`。

模块布局验收还会将每页标题、副标题的实际字号、字重、行高、颜色和间距，与同一 SceneDeck 环境下的默认 Shared 样式比较；并检查全部图形位于内容区、未压到标题。

第 14 页已移除“读组件，判断架构”题目；主图扩展为完整内容区的四组合架构对照，点击组合可查看组件分工。

封面引子（architecture-opening）：“一张没拍过的照片”
- 一封急件要求拍摄认真复习的小猫，但没有相机，小猫也没来。
- 空白相纸自动显影并盖上“已交片”；点击照片翻面，发现“快门次数：0”的线索。
- 用“没有按过快门，这张照片是怎么来的？”制造悬念，封面不展示技术名称或结构图。
- 默认 Shared 页头、有限自动动画、减少动态效果直接显示结果；无播放控制。
- 直接预览：http://127.0.0.1:5180/visual-architecture.html?slide=architecture-opening


资源目录：本课程按本地整理要求，将参考原图、裁切素材和页面截图统一保存在本模块的 `assets/` 下。`assets.ts` 解析课程图片，开发和构建均不依赖仓库根目录的 UUID 资源文件夹，也不依赖 CDN。裁图与验收脚本使用同一目录；构建只打包运行时图片。仓库通用 `check.module` 的资源检查仍按根目录 UUID 约定执行，不适用于本课程采用的模块内存放方式。
