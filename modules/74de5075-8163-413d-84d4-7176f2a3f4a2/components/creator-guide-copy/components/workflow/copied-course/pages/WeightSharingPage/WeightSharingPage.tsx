import { ContentBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import { WeightSharingScene, type SharingKind } from './WeightSharingScene';
import './WeightSharingPage.css';

function Panel({ number, title, explanation, kind, formula, note }: { number: string; title: string; explanation: string; kind: SharingKind; formula: string; note: string }) {
  return <article shuku-edit-id="e-4514913f-97f3-4522-9a19-c2819fd8fb83" className="aipe-replay-cg-copy-ck-share__panel">
    <header shuku-edit-id="e-62e11f0b-bb53-4451-b20e-bef529771e07" className="aipe-replay-cg-copy-ck-share__panel-head"><span shuku-edit-id="e-d7e845f7-8880-481f-8361-c853204478db" className="aipe-replay-cg-copy-ck-share__number"><Typography shuku-edit-id="e-449a0c71-826b-42b8-9f15-9aa2b235f204" as="span" variant="h3" tone="light">{number}</Typography></span><Typography shuku-edit-id="e-4cdb29b1-8ec1-4ccb-8e21-027a87acfe39" as="h2" variant="h3" tone="accent">{title}</Typography></header>
    <Typography shuku-edit-id="e-b03c2480-d501-4773-8c2f-b19f7fd70812" variant="bodySmall" tone="muted" className="aipe-replay-cg-copy-ck-share__description">{explanation}</Typography>
    <WeightSharingScene kind={kind} />
    <div shuku-edit-id="e-639faf38-a4de-45ff-96f2-b420581152bc" className="aipe-replay-cg-copy-ck-share__parameter"><Typography shuku-edit-id="e-609bd453-7441-420a-b0d4-bc04f2cf645d" variant="bodySmall" tone="accent">独立权重数</Typography><MathFormulaStatic latex={formula} /><Typography shuku-edit-id="e-5f89c25e-e1c9-408d-93d8-60c657da75e4" variant="bodySmall" tone="muted">{note}</Typography></div>
  </article>;
}

export function WeightSharingPage() {
  return <ContentBlock shuku-edit-id="e-8be81d93-47f6-4dbc-add1-830f613e8e05" headingLevel={1} className="aipe-replay-cg-copy-ck-share" title="权重共享：同一套权重反复使用" subtitle="两侧都使用 3 × 3 局部窗口；区别在于，移动到新位置时是否重新学习一套权重。仅统计权重，不计偏置。">
    <div shuku-edit-id="e-be554fa1-7989-4db9-b2fa-037ecbbeb35d" className="aipe-replay-cg-copy-ck-share__comparison">
      <Panel number="1" title="局部连接，但不共享" explanation="窗口每移动一次，就换成该位置专属的一套权重。" kind="independent" formula={String.raw`9\times9=81`} note="9 个位置，9 套不同的 3 × 3 权重" />
      <Panel number="2" title="共享权重（卷积层）" explanation="同一套 3 × 3 权重在所有位置重复使用。" kind="shared" formula={String.raw`1\times9=9`} note="9 个位置，始终只有 1 套权重" />
    </div>
    <footer shuku-edit-id="e-856cdaba-e9d3-4865-86e9-6d24d0924128" className="aipe-replay-cg-copy-ck-share__summary"><Typography shuku-edit-id="e-563d2c69-d215-458c-9531-6182e2d21249" as="span" variant="h3" tone="accent">81 → 9</Typography><Typography shuku-edit-id="e-7d0b25ab-69e6-4957-967a-72bc7199d68d" variant="body">输入窗口和输出位置都没有变；共享使模型在各处寻找同一种局部形状，只需学习一套权重。</Typography></footer>
  </ContentBlock>;
}
