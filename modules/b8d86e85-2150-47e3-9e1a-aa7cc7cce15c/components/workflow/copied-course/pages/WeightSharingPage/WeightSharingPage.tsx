import { ContentBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import { WeightSharingScene, type SharingKind } from './WeightSharingScene';
import './WeightSharingPage.css';

function Panel({ number, title, explanation, kind, formula, note }: { number: string; title: string; explanation: string; kind: SharingKind; formula: string; note: string }) {
  return <article shuku-edit-id="e-56da5f2e-ff86-4cfb-b4fe-9a4080429a48" className="cg-copy-ck-share__panel">
    <header shuku-edit-id="e-d0a4143d-8208-4174-b359-d89378f8f244" className="cg-copy-ck-share__panel-head"><span shuku-edit-id="e-4bffb386-5a5f-4678-a309-3d3a63e9ad1e" className="cg-copy-ck-share__number"><Typography shuku-edit-id="e-f1145c6e-c784-4ebf-a41a-0fc231634e73" as="span" variant="h3" tone="light">{number}</Typography></span><Typography shuku-edit-id="e-2282ba5b-2474-43b4-9261-66d9636459f6" as="h2" variant="h3" tone="accent">{title}</Typography></header>
    <Typography shuku-edit-id="e-3784f64d-be50-4043-9c7e-a56244bf60ad" variant="bodySmall" tone="muted" className="cg-copy-ck-share__description">{explanation}</Typography>
    <WeightSharingScene kind={kind} />
    <div shuku-edit-id="e-5114b704-d96a-471f-bc20-2df498f8b8cb" className="cg-copy-ck-share__parameter"><Typography shuku-edit-id="e-0a71e598-71d9-4021-b00a-d9627c70890e" variant="bodySmall" tone="accent">独立权重数</Typography><MathFormulaStatic latex={formula} /><Typography shuku-edit-id="e-36171754-01ca-4893-9a3e-b3c8db58385a" variant="bodySmall" tone="muted">{note}</Typography></div>
  </article>;
}

export function WeightSharingPage() {
  return <ContentBlock shuku-edit-id="e-93ba7f02-f445-4f1f-90da-2acca63086f1" headingLevel={1} className="cg-copy-ck-share" title="权重共享：同一套权重反复使用" subtitle="两侧都使用 3 × 3 局部窗口；区别在于，移动到新位置时是否重新学习一套权重。仅统计权重，不计偏置。">
    <div shuku-edit-id="e-de23399c-1768-4a32-bc5c-ddf2eb92d82b" className="cg-copy-ck-share__comparison">
      <Panel number="1" title="局部连接，但不共享" explanation="窗口每移动一次，就换成该位置专属的一套权重。" kind="independent" formula={String.raw`9\times9=81`} note="9 个位置，9 套不同的 3 × 3 权重" />
      <Panel number="2" title="共享权重（卷积层）" explanation="同一套 3 × 3 权重在所有位置重复使用。" kind="shared" formula={String.raw`1\times9=9`} note="9 个位置，始终只有 1 套权重" />
    </div>
    <footer shuku-edit-id="e-5d87893b-1136-488b-ad01-d0e57898b693" className="cg-copy-ck-share__summary"><Typography shuku-edit-id="e-6b14229c-db28-4048-bee1-431024390085" as="span" variant="h3" tone="accent">81 → 9</Typography><Typography shuku-edit-id="e-562f7cd8-59d0-47ef-a25e-c39808805cce" variant="body">输入窗口和输出位置都没有变；共享使模型在各处寻找同一种局部形状，只需学习一套权重。</Typography></footer>
  </ContentBlock>;
}
