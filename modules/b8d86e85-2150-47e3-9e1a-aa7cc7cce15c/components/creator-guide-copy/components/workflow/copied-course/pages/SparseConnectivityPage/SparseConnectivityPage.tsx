import { ContentBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import { ConnectionScene, type ConnectionKind } from './ConnectionScene';
import './SparseConnectivityPage.css';

function Panel({ number, title, description, kind, formula, detail }: { number: string; title: string; description: string; kind: ConnectionKind; formula: string; detail: string }) {
  return <article shuku-edit-id="e-9ae5de3e-fbab-48e9-9599-5ff149d03299" className="aipe-replay-cg-copy-ck-sparse__panel">
    <header shuku-edit-id="e-e3c0ab39-b485-4fba-bdd1-b63fb734e023" className="aipe-replay-cg-copy-ck-sparse__panel-head"><span shuku-edit-id="e-10702f01-ae5e-49e5-9169-dcda2492969f" className="aipe-replay-cg-copy-ck-sparse__number"><Typography shuku-edit-id="e-62311b5a-7023-414b-982c-05265f77ef68" as="span" variant="h3" tone="light">{number}</Typography></span><Typography shuku-edit-id="e-ff8a4ea0-7b2c-4228-a309-50d0d7ead2c8" as="h2" variant="h3" tone="accent">{title}</Typography></header>
    <Typography shuku-edit-id="e-eb7bb236-ce0c-4aaa-961f-2988c3b1b127" variant="bodySmall" tone="muted" className="aipe-replay-cg-copy-ck-sparse__description">{description}</Typography>
    <ConnectionScene kind={kind} />
    <div shuku-edit-id="e-49b4baa6-c30c-48b0-8102-d95a0c12dee9" className="aipe-replay-cg-copy-ck-sparse__parameter"><Typography shuku-edit-id="e-03df6d3d-d01a-4296-a693-b970a649df85" variant="bodySmall" tone="accent">独立权重数</Typography><MathFormulaStatic latex={formula} /><Typography shuku-edit-id="e-d319ed73-436a-4ed9-a334-09a30837760c" variant="bodySmall" tone="muted">{detail}</Typography></div>
  </article>;
}

export function SparseConnectivityPage() {
  return <ContentBlock shuku-edit-id="e-da374851-3fdf-45a8-b9b7-87dd7a3a3433" headingLevel={1} className="aipe-replay-cg-copy-ck-sparse" title="稀疏连接：为什么参数更少？" subtitle="同样从 5 × 5 输入得到 3 × 3 输出，比较每个输出位置连接多少输入。这里仅统计权重，不计偏置。">
    <div shuku-edit-id="e-ab4006d3-e19b-4ea4-a3a9-0f9fd8b1e42d" className="aipe-replay-cg-copy-ck-sparse__comparison">
      <Panel number="1" title="全连接" description="每个输出都读取全部 25 个输入位置。" kind="dense" formula={String.raw`25\times9=225`} detail="9 个输出，各有 25 个独立权重" />
      <Panel number="2" title="局部连接" description="每个输出只读取对应的 3 × 3 输入窗口。" kind="local" formula={String.raw`9\times9=81`} detail="9 个输出，各有 9 个独立权重" />
    </div>
    <footer shuku-edit-id="e-0c482b72-9cec-4dbd-8ede-1295c7bc0d9c" className="aipe-replay-cg-copy-ck-sparse__summary"><Typography shuku-edit-id="e-496a0202-3207-4d67-b45f-a78cead3e32b" as="span" variant="h3" tone="accent">225 → 81 → 9</Typography><Typography shuku-edit-id="e-218e1da1-fbe8-459d-a23a-aed3ddae5eb8" variant="body">局部连接将独立权重减至 81；卷积再让 9 个输出共用同一组 3 × 3 权重，减至 9。</Typography></footer>
  </ContentBlock>;
}
