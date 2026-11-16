import { ContentBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import { WeightSharingScene, type SharingKind } from './WeightSharingScene';
import './WeightSharingPage.css';

function Panel({ number, title, explanation, kind, formula, note }: { number: string; title: string; explanation: string; kind: SharingKind; formula: string; note: string }) {
  return <article shuku-edit-id="e-941112b0-8259-4063-a80a-aa4fdcda1a13" className="cg-copy-ck-share__panel">
    <header shuku-edit-id="e-4484d953-5758-4d54-86c5-b9b01dc42bcf" className="cg-copy-ck-share__panel-head"><span shuku-edit-id="e-a05b648c-d7e8-4d20-a2f3-dc0e312eed3d" className="cg-copy-ck-share__number"><Typography shuku-edit-id="e-3eed6d06-253f-4a77-8135-b003f12f5780" as="span" variant="h3" tone="light">{number}</Typography></span><Typography shuku-edit-id="e-a6210107-4b64-4077-b32a-437d5e614ba5" as="h2" variant="h3" tone="accent">{title}</Typography></header>
    <Typography shuku-edit-id="e-f2a7b93c-436e-46fc-beb6-678ad37ec95e" variant="bodySmall" tone="muted" className="cg-copy-ck-share__description">{explanation}</Typography>
    <WeightSharingScene kind={kind} />
    <div shuku-edit-id="e-02b48e2a-ffc0-4836-96e6-bfcabff8ca1b" className="cg-copy-ck-share__parameter"><Typography shuku-edit-id="e-ae0fe5aa-91a6-4e2f-8c4e-8f465f5352b1" variant="bodySmall" tone="accent">独立权重数</Typography><MathFormulaStatic latex={formula} /><Typography shuku-edit-id="e-9efbb8dd-fa17-46bd-a74b-4e2b2e703811" variant="bodySmall" tone="muted">{note}</Typography></div>
  </article>;
}

export function WeightSharingPage() {
  return <ContentBlock shuku-edit-id="e-24a7d95e-55cd-498c-a85a-5edfa130eee3" headingLevel={1} className="cg-copy-ck-share" title="权重共享：同一套权重反复使用" subtitle="两侧都使用 3 × 3 局部窗口；区别在于，移动到新位置时是否重新学习一套权重。仅统计权重，不计偏置。">
    <div shuku-edit-id="e-89b9d7b4-38cb-4a84-90cc-bcdea34bc0b8" className="cg-copy-ck-share__comparison">
      <Panel number="1" title="局部连接，但不共享" explanation="窗口每移动一次，就换成该位置专属的一套权重。" kind="independent" formula={String.raw`9\times9=81`} note="9 个位置，9 套不同的 3 × 3 权重" />
      <Panel number="2" title="共享权重（卷积层）" explanation="同一套 3 × 3 权重在所有位置重复使用。" kind="shared" formula={String.raw`1\times9=9`} note="9 个位置，始终只有 1 套权重" />
    </div>
    <footer shuku-edit-id="e-c0d1dcb8-c0b3-4e6b-9c3e-d1ed5e1d20f3" className="cg-copy-ck-share__summary"><Typography shuku-edit-id="e-d4771ec2-9ee9-41a1-b171-a615cf844f55" as="span" variant="h3" tone="accent">81 → 9</Typography><Typography shuku-edit-id="e-2b0be7fb-d32b-4c3d-a55a-66738a48e1eb" variant="body">输入窗口和输出位置都没有变；共享使模型在各处寻找同一种局部形状，只需学习一套权重。</Typography></footer>
  </ContentBlock>;
}
