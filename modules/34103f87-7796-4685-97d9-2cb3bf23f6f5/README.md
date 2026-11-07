# 注意力机制

课程 UUID：`34103f87-7796-4685-97d9-2cb3bf23f6f5`，别名：`attention-mechanism`。

已合入微信文件夹 `Attention-Mechanism` 提供的 25 页新版：校园传球观察、活动记录中的 Q/K/V 与评分、队员位置重建、讲解稿翻译，以及视觉注意力与回顾。入口为 `AttentionMechanismPage.tsx`，PPT 入口为 `AttentionPpt.tsx`，共用 `course.tsx` 的页面与顺序。

沿用既有页面 UUID；标题、内容与讲稿更新不会更换身份。素材直接存放在本模块，缩略图通过仓库根目录的素材映射关联到页面 UUID，不依赖微信目录。课程身份以 `outlines.json` 为准。

构建工具与运行时由术库维护；不在本课程安装依赖或恢复旧的根目录 npm 工程。需发布时，在 Shuku 执行 `python run.py courses-build --module 34103f87-7796-4685-97d9-2cb3bf23f6f5`。开场视频沿用新版实现，依赖 YouTube 网络访问。
