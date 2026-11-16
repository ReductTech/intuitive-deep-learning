import { ContentBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import { WeightSharingScene, type SharingKind } from './WeightSharingScene';
import './WeightSharingPage.css';

function Panel({ number, title, explanation, kind, formula, note }: { number: string; title: string; explanation: string; kind: SharingKind; formula: string; note: string }) {
  return <article shuku-edit-id="e-0e16f6c0-d9b2-487e-b17f-1c0da70b77af" className="cg-copy-ck-share__panel">
    <header shuku-edit-id="e-a21f6edf-2150-4a49-95d8-85c5bfb81398" className="cg-copy-ck-share__panel-head"><span shuku-edit-id="e-d46cbd8a-0d01-475f-8155-5c088f0d9038" className="cg-copy-ck-share__number"><Typography shuku-edit-id="e-c2e32360-23f8-4fe0-8b09-900737f272fb" as="span" variant="h3" tone="light">{number}</Typography></span><Typography shuku-edit-id="e-805213b5-aac3-40cc-9fa3-dcbba0d4d4e6" as="h2" variant="h3" tone="accent">{title}</Typography></header>
    <Typography shuku-edit-id="e-0ab0cc6a-4f09-483a-9558-0968e22faa16" variant="bodySmall" tone="muted" className="cg-copy-ck-share__description">{explanation}</Typography>
    <WeightSharingScene kind={kind} />
    <div shuku-edit-id="e-7c8974b4-4958-4914-8448-c45c7297083b" className="cg-copy-ck-share__parameter"><Typography shuku-edit-id="e-6c5e8574-3e5b-4f8d-a600-d2402b96595f" variant="bodySmall" tone="accent">独立权重数</Typography><MathFormulaStatic latex={formula} /><Typography shuku-edit-id="e-d3278fde-5d27-4ac5-be3e-69ee23eb594f" variant="bodySmall" tone="muted">{note}</Typography></div>
  </article>;
}

export function WeightSharingPage() {
  return <ContentBlock shuku-edit-id="e-a2e1bf61-a112-4b32-99ec-d6c76ef86750" headingLevel={1} className="cg-copy-ck-share" title="权重共享：同一套权重反复使用" subtitle="两侧都使用 3 × 3 局部窗口；区别在于，移动到新位置时是否重新学习一套权重。仅统计权重，不计偏置。">
    <div shuku-edit-id="e-7001412b-4d9f-42aa-b124-56e8c6ddb2f0" className="cg-copy-ck-share__comparison">
      <Panel number="1" title="局部连接，但不共享" explanation="窗口每移动一次，就换成该位置专属的一套权重。" kind="independent" formula={String.raw`9\times9=81`} note="9 个位置，9 套不同的 3 × 3 权重" />
      <Panel number="2" title="共享权重（卷积层）" explanation="同一套 3 × 3 权重在所有位置重复使用。" kind="shared" formula={String.raw`1\times9=9`} note="9 个位置，始终只有 1 套权重" />
    </div>
    <footer shuku-edit-id="e-86de8d0c-4924-49f3-b243-2114f0946d0d" className="cg-copy-ck-share__summary"><Typography shuku-edit-id="e-abee029d-c323-4f10-ab32-b22c77e68ea8" as="span" variant="h3" tone="accent">81 → 9</Typography><Typography shuku-edit-id="e-8133e6a8-91e1-4751-8144-b9387638ebeb" variant="body">输入窗口和输出位置都没有变；共享使模型在各处寻找同一种局部形状，只需学习一套权重。</Typography></footer>
  </ContentBlock>;
}
