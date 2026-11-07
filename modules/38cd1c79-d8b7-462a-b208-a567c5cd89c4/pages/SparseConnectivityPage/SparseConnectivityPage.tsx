import { ContentBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import { ConnectionScene, type ConnectionKind } from './ConnectionScene';
import './SparseConnectivityPage.css';

function Panel({ number, title, description, kind, formula, detail }: { number: string; title: string; description: string; kind: ConnectionKind; formula: string; detail: string }) {
  return <article className="ck-sparse__panel">
    <header className="ck-sparse__panel-head"><span className="ck-sparse__number"><Typography as="span" variant="h3" tone="light">{number}</Typography></span><Typography as="h2" variant="h3" tone="accent">{title}</Typography></header>
    <Typography variant="bodySmall" tone="muted" className="ck-sparse__description">{description}</Typography>
    <ConnectionScene kind={kind} />
    <div className="ck-sparse__parameter"><Typography variant="bodySmall" tone="accent">独立权重数</Typography><MathFormulaStatic latex={formula} /><Typography variant="bodySmall" tone="muted">{detail}</Typography></div>
  </article>;
}

export function SparseConnectivityPage() {
  return <ContentBlock headingLevel={1} className="ck-sparse" title="稀疏连接：为什么参数更少？" subtitle="同样从 5 × 5 输入得到 3 × 3 输出，比较每个输出位置连接多少输入。这里仅统计权重，不计偏置。">
    <div className="ck-sparse__comparison">
      <Panel number="1" title="全连接" description="每个输出都读取全部 25 个输入位置。" kind="dense" formula={String.raw`25\times9=225`} detail="9 个输出，各有 25 个独立权重" />
      <Panel number="2" title="局部连接" description="每个输出只读取对应的 3 × 3 输入窗口。" kind="local" formula={String.raw`9\times9=81`} detail="9 个输出，各有 9 个独立权重" />
    </div>
    <footer className="ck-sparse__summary"><Typography as="span" variant="h3" tone="accent">225 → 81 → 9</Typography><Typography variant="body">局部连接将独立权重减至 81；卷积再让 9 个输出共用同一组 3 × 3 权重，减至 9。</Typography></footer>
  </ContentBlock>;
}
