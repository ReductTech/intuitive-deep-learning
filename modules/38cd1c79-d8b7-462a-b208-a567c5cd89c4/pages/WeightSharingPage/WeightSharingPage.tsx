import { ContentBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import { WeightSharingScene, type SharingKind } from './WeightSharingScene';
import './WeightSharingPage.css';

function Panel({ number, title, explanation, kind, formula, note }: { number: string; title: string; explanation: string; kind: SharingKind; formula: string; note: string }) {
  return <article shuku-edit-id="e-a1c02710-a279-44c7-886a-2a6b13d081ce" className="ck-share__panel">
    <header shuku-edit-id="e-a1f7a41b-ceb4-4308-99aa-cfa83a0815bb" className="ck-share__panel-head"><span shuku-edit-id="e-1459216b-0d3b-42c7-b78b-808784bd0ae8" className="ck-share__number"><Typography shuku-edit-id="e-e1534989-c025-4699-8a0f-b24e3b5f04ae" as="span" variant="h3" tone="light">{number}</Typography></span><Typography shuku-edit-id="e-a92582d1-4f7e-4f08-b546-750b06d0fcdc" as="h2" variant="h3" tone="accent">{title}</Typography></header>
    <Typography shuku-edit-id="e-7e70a7b5-2c6b-437b-9680-090b608027b6" variant="bodySmall" tone="muted" className="ck-share__description">{explanation}</Typography>
    <WeightSharingScene kind={kind} />
    <div shuku-edit-id="e-7b759202-1d9b-47fe-bd0a-6da2353184fb" className="ck-share__parameter"><Typography shuku-edit-id="e-a587a985-6be2-46e0-9c09-adac7e51db7f" variant="bodySmall" tone="accent">独立权重数</Typography><MathFormulaStatic latex={formula} /><Typography shuku-edit-id="e-f95aaa81-8a5d-4933-bf00-a27f8d1d4f27" variant="bodySmall" tone="muted">{note}</Typography></div>
  </article>;
}

export function WeightSharingPage() {
  return <ContentBlock shuku-edit-id="e-676e575d-093f-4c09-89cf-62267291e3cf" headingLevel={1} className="ck-share" title="权重共享：同一套权重反复使用" subtitle="两侧都使用 3 × 3 局部窗口；区别在于，移动到新位置时是否重新学习一套权重。仅统计权重，不计偏置。">
    <div shuku-edit-id="e-ec0449d1-e897-4caa-a553-4d35fa42cddb" className="ck-share__comparison">
      <Panel number="1" title="局部连接，但不共享" explanation="窗口每移动一次，就换成该位置专属的一套权重。" kind="independent" formula={String.raw`9\times9=81`} note="9 个位置，9 套不同的 3 × 3 权重" />
      <Panel number="2" title="共享权重（卷积层）" explanation="同一套 3 × 3 权重在所有位置重复使用。" kind="shared" formula={String.raw`1\times9=9`} note="9 个位置，始终只有 1 套权重" />
    </div>
    <footer shuku-edit-id="e-236a2edf-fb2c-4cf2-a336-f44470417b80" className="ck-share__summary"><Typography shuku-edit-id="e-da538f50-83c4-44c7-bedc-ff90c0093819" as="span" variant="h3" tone="accent">81 → 9</Typography><Typography shuku-edit-id="e-78e26ba3-a1e9-4b7b-bed1-38bdba4bf792" variant="body">输入窗口和输出位置都没有变；共享使模型在各处寻找同一种局部形状，只需学习一套权重。</Typography></footer>
  </ContentBlock>;
}
