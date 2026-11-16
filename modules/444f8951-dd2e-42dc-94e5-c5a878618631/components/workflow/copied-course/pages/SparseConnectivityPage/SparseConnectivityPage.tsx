import { ContentBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import { ConnectionScene, type ConnectionKind } from './ConnectionScene';
import './SparseConnectivityPage.css';

function Panel({ number, title, description, kind, formula, detail }: { number: string; title: string; description: string; kind: ConnectionKind; formula: string; detail: string }) {
  return <article shuku-edit-id="e-0410644c-df2b-43a9-b24b-5740001bb1b9" className="cg-copy-ck-sparse__panel">
    <header shuku-edit-id="e-fe0e1fb2-4882-4a6b-a4b3-3cfb689bb083" className="cg-copy-ck-sparse__panel-head"><span shuku-edit-id="e-7ff0538d-ff32-41ff-9b84-010dd6b8ebba" className="cg-copy-ck-sparse__number"><Typography shuku-edit-id="e-3ca6d21d-39e6-4bb0-9112-b941c2697bd4" as="span" variant="h3" tone="light">{number}</Typography></span><Typography shuku-edit-id="e-2939cb7f-457a-4435-8f37-621495348356" as="h2" variant="h3" tone="accent">{title}</Typography></header>
    <Typography shuku-edit-id="e-fb5890d0-b40b-4417-ab14-d7da7dafb782" variant="bodySmall" tone="muted" className="cg-copy-ck-sparse__description">{description}</Typography>
    <ConnectionScene kind={kind} />
    <div shuku-edit-id="e-7b2f538c-2d6d-4bac-b2b6-d454b64ba1e7" className="cg-copy-ck-sparse__parameter"><Typography shuku-edit-id="e-5c041771-2818-428d-86c2-08bf25811914" variant="bodySmall" tone="accent">独立权重数</Typography><MathFormulaStatic latex={formula} /><Typography shuku-edit-id="e-81f2c743-b8f9-4b69-8d0c-3b43b3b21cb2" variant="bodySmall" tone="muted">{detail}</Typography></div>
  </article>;
}

export function SparseConnectivityPage() {
  return <ContentBlock shuku-edit-id="e-75324219-6274-4879-97f8-2ba0898891c1" headingLevel={1} className="cg-copy-ck-sparse" title="稀疏连接：为什么参数更少？" subtitle="同样从 5 × 5 输入得到 3 × 3 输出，比较每个输出位置连接多少输入。这里仅统计权重，不计偏置。">
    <div shuku-edit-id="e-ac51b370-2ccd-4765-b6d2-3bbac87e4b50" className="cg-copy-ck-sparse__comparison">
      <Panel number="1" title="全连接" description="每个输出都读取全部 25 个输入位置。" kind="dense" formula={String.raw`25\times9=225`} detail="9 个输出，各有 25 个独立权重" />
      <Panel number="2" title="局部连接" description="每个输出只读取对应的 3 × 3 输入窗口。" kind="local" formula={String.raw`9\times9=81`} detail="9 个输出，各有 9 个独立权重" />
    </div>
    <footer shuku-edit-id="e-72dc8122-a1c4-4f5b-a7b1-aa3d71f358ca" className="cg-copy-ck-sparse__summary"><Typography shuku-edit-id="e-cfeb0836-7541-4463-98d1-b104bca47105" as="span" variant="h3" tone="accent">225 → 81 → 9</Typography><Typography shuku-edit-id="e-76d3482e-ec08-4662-b5c7-31295f00d081" variant="body">局部连接将独立权重减至 81；卷积再让 9 个输出共用同一组 3 × 3 权重，减至 9。</Typography></footer>
  </ContentBlock>;
}
