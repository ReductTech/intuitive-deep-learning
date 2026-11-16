import { ContentBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import { ConnectionScene, type ConnectionKind } from './ConnectionScene';
import './SparseConnectivityPage.css';

function Panel({ number, title, description, kind, formula, detail }: { number: string; title: string; description: string; kind: ConnectionKind; formula: string; detail: string }) {
  return <article shuku-edit-id="e-7e31cdfc-354c-438b-ab42-f8a5a6ff615b" className="cg-copy-ck-sparse__panel">
    <header shuku-edit-id="e-145d97dd-ffe1-4d4a-88f0-f6654f1fef16" className="cg-copy-ck-sparse__panel-head"><span shuku-edit-id="e-622f34ce-07a8-4c10-9804-fae2e920772e" className="cg-copy-ck-sparse__number"><Typography shuku-edit-id="e-14ddd4ca-d578-42a1-9fc7-f67c326b428e" as="span" variant="h3" tone="light">{number}</Typography></span><Typography shuku-edit-id="e-f88a309e-ee3b-4306-8c86-855af4f955e8" as="h2" variant="h3" tone="accent">{title}</Typography></header>
    <Typography shuku-edit-id="e-4cd17698-d463-4675-b2f4-aaf82e873a15" variant="bodySmall" tone="muted" className="cg-copy-ck-sparse__description">{description}</Typography>
    <ConnectionScene kind={kind} />
    <div shuku-edit-id="e-b47ef54c-3deb-4611-86d4-41ebd476ced3" className="cg-copy-ck-sparse__parameter"><Typography shuku-edit-id="e-2aacaf8c-f16e-4847-b5f8-611671ffbaea" variant="bodySmall" tone="accent">独立权重数</Typography><MathFormulaStatic latex={formula} /><Typography shuku-edit-id="e-f154a14b-878a-4694-964f-724a24608e9c" variant="bodySmall" tone="muted">{detail}</Typography></div>
  </article>;
}

export function SparseConnectivityPage() {
  return <ContentBlock shuku-edit-id="e-ba649e3e-eac8-4b1f-8db8-9968d5562012" headingLevel={1} className="cg-copy-ck-sparse" title="稀疏连接：为什么参数更少？" subtitle="同样从 5 × 5 输入得到 3 × 3 输出，比较每个输出位置连接多少输入。这里仅统计权重，不计偏置。">
    <div shuku-edit-id="e-758ef2d9-6fc7-44d6-8276-f6a7ab76a0ab" className="cg-copy-ck-sparse__comparison">
      <Panel number="1" title="全连接" description="每个输出都读取全部 25 个输入位置。" kind="dense" formula={String.raw`25\times9=225`} detail="9 个输出，各有 25 个独立权重" />
      <Panel number="2" title="局部连接" description="每个输出只读取对应的 3 × 3 输入窗口。" kind="local" formula={String.raw`9\times9=81`} detail="9 个输出，各有 9 个独立权重" />
    </div>
    <footer shuku-edit-id="e-0a855372-ac32-44d1-a2aa-2ecd4342527c" className="cg-copy-ck-sparse__summary"><Typography shuku-edit-id="e-e9ef1cf7-6fdd-4d06-ace3-37b23e3cbd66" as="span" variant="h3" tone="accent">225 → 81 → 9</Typography><Typography shuku-edit-id="e-1bd68ba5-8867-4044-9edc-e5a8a5ab2fc1" variant="body">局部连接将独立权重减至 81；卷积再让 9 个输出共用同一组 3 × 3 权重，减至 9。</Typography></footer>
  </ContentBlock>;
}
