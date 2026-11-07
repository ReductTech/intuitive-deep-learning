# 大模型推理中的注意力优化

课程 UUID：`bc6ed89d-ce23-4837-9b2f-bd44acb810b7`，别名：`kv-cache-guide`。

已合入微信文件夹 `KV-Cache-Guide` 提供的新版：新增课程封面，含封面共 25 页，覆盖 KV Cache、FlashAttention 和 MLA。原 24 页保留 UUID，新封面具有独立 UUID。新版未提供讲稿的已有页面保留原讲稿。

`outlines.json.pages` 管理元数据及顺序，`course.tsx` 按 UUID 关联渲染组件，自学入口与 PPT 共用这一编排。入口分别为 `KvCacheGuide.tsx` 与 `KvCachePpt.tsx`。代码与素材直接存放在仓库，不依赖微信文件夹。

构建由 Shuku 管理；需要发布时，在 Shuku 执行 `python run.py courses-build --module bc6ed89d-ce23-4837-9b2f-bd44acb810b7`。
