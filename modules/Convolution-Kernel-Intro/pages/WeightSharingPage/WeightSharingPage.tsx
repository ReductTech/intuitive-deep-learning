import { ContentBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import { WeightSharingScene, type SharingKind } from './WeightSharingScene';
import './WeightSharingPage.css';

function Panel({ number, title, explanation, kind, formula, note }: { number: string; title: string; explanation: string; kind: SharingKind; formula: string; note: string }) {
  return <article className="ck-share__panel">
    <header className="ck-share__panel-head"><span className="ck-share__number"><Typography as="span" variant="h3" tone="light">{number}</Typography></span><Typography as="h2" variant="h3" tone="accent">{title}</Typography></header>
    <Typography variant="bodySmall" tone="muted" className="ck-share__description">{explanation}</Typography>
    <WeightSharingScene kind={kind} />
    <div className="ck-share__parameter"><Typography variant="bodySmall" tone="accent">独立权重数</Typography><MathFormulaStatic latex={formula} /><Typography variant="bodySmall" tone="muted">{note}</Typography></div>
  </article>;
}

export function WeightSharingPage() {
  return <ContentBlock headingLevel={1} className="ck-share" title="权重共享：同一套权重反复使用" subtitle="两侧都使用 3 × 3 局部窗口；区别在于，移动到新位置时是否重新学习一套权重。仅统计权重，不计偏置。">
    <div className="ck-share__comparison">
      <Panel number="1" title="局部连接，但不共享" explanation="窗口每移动一次，就换成该位置专属的一套权重。" kind="independent" formula={String.raw`9\times9=81`} note="9 个位置，9 套不同的 3 × 3 权重" />
      <Panel number="2" title="共享权重（卷积层）" explanation="同一套 3 × 3 权重在所有位置重复使用。" kind="shared" formula={String.raw`1\times9=9`} note="9 个位置，始终只有 1 套权重" />
    </div>
    <footer className="ck-share__summary"><Typography as="span" variant="h3" tone="accent">81 → 9</Typography><Typography variant="body">输入窗口和输出位置都没有变；共享使模型在各处寻找同一种局部形状，只需学习一套权重。</Typography></footer>
  </ContentBlock>;
}
