import { ContentBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import { ConnectionScene, type ConnectionKind } from './ConnectionScene';
import './SparseConnectivityPage.css';

function Panel({ number, title, description, kind, formula, detail }: { number: string; title: string; description: string; kind: ConnectionKind; formula: string; detail: string }) {
  return <article shuku-edit-id="e-73017004-3720-401c-a9b0-3d8db15fe65e" className="aipe-replay-cg-copy-ck-sparse__panel">
    <header shuku-edit-id="e-accf9542-553a-4055-a468-96ef9a8c44ae" className="aipe-replay-cg-copy-ck-sparse__panel-head"><span shuku-edit-id="e-ab4ff6d3-1187-4985-883d-0dde57e8c1c3" className="aipe-replay-cg-copy-ck-sparse__number"><Typography shuku-edit-id="e-d5fdfcc1-c973-442c-b4b6-66b560acbee6" as="span" variant="h3" tone="light">{number}</Typography></span><Typography shuku-edit-id="e-781cc00c-a950-40b1-bf1b-14b4af4a5c4b" as="h2" variant="h3" tone="accent">{title}</Typography></header>
    <Typography shuku-edit-id="e-90fa4b87-2d89-485a-87c3-f01ed7706103" variant="bodySmall" tone="muted" className="aipe-replay-cg-copy-ck-sparse__description">{description}</Typography>
    <ConnectionScene kind={kind} />
    <div shuku-edit-id="e-61b2217d-4b11-4add-bb6b-8ae5f13bcc77" className="aipe-replay-cg-copy-ck-sparse__parameter"><Typography shuku-edit-id="e-4aa10a1e-fdc5-4a18-ac4d-b9afc1399d02" variant="bodySmall" tone="accent">独立权重数</Typography><MathFormulaStatic latex={formula} /><Typography shuku-edit-id="e-e2eaec5a-384b-458f-8ad4-b312a0dabe36" variant="bodySmall" tone="muted">{detail}</Typography></div>
  </article>;
}

export function SparseConnectivityPage() {
  return <ContentBlock shuku-edit-id="e-090fbb8f-9f37-4336-924d-b15707ef276f" headingLevel={1} className="aipe-replay-cg-copy-ck-sparse" title="稀疏连接：为什么参数更少？" subtitle="同样从 5 × 5 输入得到 3 × 3 输出，比较每个输出位置连接多少输入。这里仅统计权重，不计偏置。">
    <div shuku-edit-id="e-f0fb37f1-c45f-43ed-92e6-2d80a448f440" className="aipe-replay-cg-copy-ck-sparse__comparison">
      <Panel number="1" title="全连接" description="每个输出都读取全部 25 个输入位置。" kind="dense" formula={String.raw`25\times9=225`} detail="9 个输出，各有 25 个独立权重" />
      <Panel number="2" title="局部连接" description="每个输出只读取对应的 3 × 3 输入窗口。" kind="local" formula={String.raw`9\times9=81`} detail="9 个输出，各有 9 个独立权重" />
    </div>
    <footer shuku-edit-id="e-73a063d6-9ac7-4670-9a9e-f03a0207eb99" className="aipe-replay-cg-copy-ck-sparse__summary"><Typography shuku-edit-id="e-8928a1dd-cd94-43ad-8338-4f5a7d2070e3" as="span" variant="h3" tone="accent">225 → 81 → 9</Typography><Typography shuku-edit-id="e-3fc54380-fa3f-4862-b81c-2317497bf213" variant="body">局部连接将独立权重减至 81；卷积再让 9 个输出共用同一组 3 × 3 权重，减至 9。</Typography></footer>
  </ContentBlock>;
}
