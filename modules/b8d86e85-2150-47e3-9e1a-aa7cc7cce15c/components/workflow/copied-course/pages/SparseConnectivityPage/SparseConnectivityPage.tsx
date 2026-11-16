import { ContentBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import { ConnectionScene, type ConnectionKind } from './ConnectionScene';
import './SparseConnectivityPage.css';

function Panel({ number, title, description, kind, formula, detail }: { number: string; title: string; description: string; kind: ConnectionKind; formula: string; detail: string }) {
  return <article shuku-edit-id="e-424cc413-be37-4b4c-91ec-00ac55141e88" className="cg-copy-ck-sparse__panel">
    <header shuku-edit-id="e-204aa35b-fd45-415c-a65b-38d3fd5d4b6d" className="cg-copy-ck-sparse__panel-head"><span shuku-edit-id="e-55566137-68ec-42f1-ae8f-7db8c8104472" className="cg-copy-ck-sparse__number"><Typography shuku-edit-id="e-c1b347a4-a6f8-428f-902a-310eb164eb9d" as="span" variant="h3" tone="light">{number}</Typography></span><Typography shuku-edit-id="e-ba7569db-c717-4f8f-8dfc-9c473dc1964d" as="h2" variant="h3" tone="accent">{title}</Typography></header>
    <Typography shuku-edit-id="e-f9243bba-1113-401e-9f25-42e2baa07c5a" variant="bodySmall" tone="muted" className="cg-copy-ck-sparse__description">{description}</Typography>
    <ConnectionScene kind={kind} />
    <div shuku-edit-id="e-19ab7111-5258-4732-a0c5-dd17ebcfac6b" className="cg-copy-ck-sparse__parameter"><Typography shuku-edit-id="e-3b935912-34fd-4562-a50c-396a03480a8e" variant="bodySmall" tone="accent">独立权重数</Typography><MathFormulaStatic latex={formula} /><Typography shuku-edit-id="e-59d138f2-7807-4af1-a7b9-c6697a6da2c1" variant="bodySmall" tone="muted">{detail}</Typography></div>
  </article>;
}

export function SparseConnectivityPage() {
  return <ContentBlock shuku-edit-id="e-07080033-69ef-4372-9d15-21a4669187d7" headingLevel={1} className="cg-copy-ck-sparse" title="稀疏连接：为什么参数更少？" subtitle="同样从 5 × 5 输入得到 3 × 3 输出，比较每个输出位置连接多少输入。这里仅统计权重，不计偏置。">
    <div shuku-edit-id="e-ae1a637b-29e3-4b73-962e-067c6b59896b" className="cg-copy-ck-sparse__comparison">
      <Panel number="1" title="全连接" description="每个输出都读取全部 25 个输入位置。" kind="dense" formula={String.raw`25\times9=225`} detail="9 个输出，各有 25 个独立权重" />
      <Panel number="2" title="局部连接" description="每个输出只读取对应的 3 × 3 输入窗口。" kind="local" formula={String.raw`9\times9=81`} detail="9 个输出，各有 9 个独立权重" />
    </div>
    <footer shuku-edit-id="e-abf6d7c4-f691-4d2c-902b-1c9bf6152b20" className="cg-copy-ck-sparse__summary"><Typography shuku-edit-id="e-56bff791-932e-4b03-b97d-23de745f6e3b" as="span" variant="h3" tone="accent">225 → 81 → 9</Typography><Typography shuku-edit-id="e-be12a7f0-cd54-482c-99f1-4aef3b26aba4" variant="body">局部连接将独立权重减至 81；卷积再让 9 个输出共用同一组 3 × 3 权重，减至 9。</Typography></footer>
  </ContentBlock>;
}
