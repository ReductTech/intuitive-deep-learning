import { ContentBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import { WeightSharingScene, type SharingKind } from './WeightSharingScene';
import './WeightSharingPage.css';

function Panel({ number, title, explanation, kind, formula, note }: { number: string; title: string; explanation: string; kind: SharingKind; formula: string; note: string }) {
  return <article shuku-edit-id="e-308d3c81-4f84-45c9-b271-ff979847067f" className="aipe-replay-cg-copy-ck-share__panel">
    <header shuku-edit-id="e-6279845d-7f97-4800-a5fc-58802210eb67" className="aipe-replay-cg-copy-ck-share__panel-head"><span shuku-edit-id="e-b22a2a8a-0b38-4f1e-9b68-d872b799171a" className="aipe-replay-cg-copy-ck-share__number"><Typography shuku-edit-id="e-753c648c-41cc-4ce4-9e84-08b35fd64a08" as="span" variant="h3" tone="light">{number}</Typography></span><Typography shuku-edit-id="e-f0d82167-ca49-461a-b0ca-397d1ac84cf2" as="h2" variant="h3" tone="accent">{title}</Typography></header>
    <Typography shuku-edit-id="e-fc9561e4-b8b5-4cec-a90f-57c5e1f6178a" variant="bodySmall" tone="muted" className="aipe-replay-cg-copy-ck-share__description">{explanation}</Typography>
    <WeightSharingScene kind={kind} />
    <div shuku-edit-id="e-c11bbad7-b991-41dc-8d16-a0661c911efb" className="aipe-replay-cg-copy-ck-share__parameter"><Typography shuku-edit-id="e-0c5c5ca1-d44a-4bb5-b7b1-fe8d3e481625" variant="bodySmall" tone="accent">独立权重数</Typography><MathFormulaStatic latex={formula} /><Typography shuku-edit-id="e-9c17f0b1-835b-406c-abdb-5ccb54b8eae6" variant="bodySmall" tone="muted">{note}</Typography></div>
  </article>;
}

export function WeightSharingPage() {
  return <ContentBlock shuku-edit-id="e-a239d00b-7e4c-4484-b172-4bb95d8af651" headingLevel={1} className="aipe-replay-cg-copy-ck-share" title="权重共享：同一套权重反复使用" subtitle="两侧都使用 3 × 3 局部窗口；区别在于，移动到新位置时是否重新学习一套权重。仅统计权重，不计偏置。">
    <div shuku-edit-id="e-5af945f2-01fe-4850-9206-17a6a5e48370" className="aipe-replay-cg-copy-ck-share__comparison">
      <Panel number="1" title="局部连接，但不共享" explanation="窗口每移动一次，就换成该位置专属的一套权重。" kind="independent" formula={String.raw`9\times9=81`} note="9 个位置，9 套不同的 3 × 3 权重" />
      <Panel number="2" title="共享权重（卷积层）" explanation="同一套 3 × 3 权重在所有位置重复使用。" kind="shared" formula={String.raw`1\times9=9`} note="9 个位置，始终只有 1 套权重" />
    </div>
    <footer shuku-edit-id="e-43837485-9b3e-4e4f-8192-dcdf0ff3c833" className="aipe-replay-cg-copy-ck-share__summary"><Typography shuku-edit-id="e-b6252411-f36f-4056-921f-645a73e1e8c6" as="span" variant="h3" tone="accent">81 → 9</Typography><Typography shuku-edit-id="e-1441af35-0f91-4d7e-bbf7-87994c7675e5" variant="body">输入窗口和输出位置都没有变；共享使模型在各处寻找同一种局部形状，只需学习一套权重。</Typography></footer>
  </ContentBlock>;
}
