import { ContentBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import { ConnectionScene, type ConnectionKind } from './ConnectionScene';
import './SparseConnectivityPage.css';

function Panel({ number, title, description, kind, formula, detail }: { number: string; title: string; description: string; kind: ConnectionKind; formula: string; detail: string }) {
  return <article shuku-edit-id="e-02c68ce6-4922-4002-8e7c-c54c8d40f5ca" className="ck-sparse__panel">
    <header shuku-edit-id="e-eb4da0c8-3bf0-4f34-9009-c96685758953" className="ck-sparse__panel-head"><span shuku-edit-id="e-ab7ad36f-ae4f-4f82-9b3b-cbde761f1348" className="ck-sparse__number"><Typography shuku-edit-id="e-c918662c-3b85-4cc8-9bd1-153e9da0ea5c" as="span" variant="h3" tone="light">{number}</Typography></span><Typography shuku-edit-id="e-382ca039-19dd-40eb-8369-3a3e732b38ef" as="h2" variant="h3" tone="accent">{title}</Typography></header>
    <Typography shuku-edit-id="e-f014fdc9-7851-41ef-b45d-3aa237d5ee4c" variant="bodySmall" tone="muted" className="ck-sparse__description">{description}</Typography>
    <ConnectionScene kind={kind} />
    <div shuku-edit-id="e-6b8b57aa-6e77-4ed2-84a6-efa58ddfdf78" className="ck-sparse__parameter"><Typography shuku-edit-id="e-4ea34ffe-7245-4379-863d-4ae4d2985b44" variant="bodySmall" tone="accent">独立权重数</Typography><MathFormulaStatic latex={formula} /><Typography shuku-edit-id="e-368b178e-2fa6-4b2a-82b6-020755a07d82" variant="bodySmall" tone="muted">{detail}</Typography></div>
  </article>;
}

export function SparseConnectivityPage() {
  return <ContentBlock shuku-edit-id="e-e1ff36da-af15-40d3-a6f5-570df75b3d8c" headingLevel={1} className="ck-sparse" title="稀疏连接：为什么参数更少？" subtitle="同样从 5 × 5 输入得到 3 × 3 输出，比较每个输出位置连接多少输入。这里仅统计权重，不计偏置。">
    <div shuku-edit-id="e-e3bd3ea9-e376-454a-a6ff-2386723a4329" className="ck-sparse__comparison">
      <Panel number="1" title="全连接" description="每个输出都读取全部 25 个输入位置。" kind="dense" formula={String.raw`25\times9=225`} detail="9 个输出，各有 25 个独立权重" />
      <Panel number="2" title="局部连接" description="每个输出只读取对应的 3 × 3 输入窗口。" kind="local" formula={String.raw`9\times9=81`} detail="9 个输出，各有 9 个独立权重" />
    </div>
    <footer shuku-edit-id="e-b6882995-996d-41ae-8949-d52eed9b6e71" className="ck-sparse__summary"><Typography shuku-edit-id="e-f346e9c9-0633-460c-b41a-c5a918ef8bea" as="span" variant="h3" tone="accent">225 → 81 → 9</Typography><Typography shuku-edit-id="e-7fd3f4cd-3e38-475b-b364-e866e09d8981" variant="body">局部连接将独立权重减至 81；卷积再让 9 个输出共用同一组 3 × 3 权重，减至 9。</Typography></footer>
  </ContentBlock>;
}
