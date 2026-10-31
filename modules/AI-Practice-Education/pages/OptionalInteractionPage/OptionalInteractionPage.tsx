import { ContentBlock, Typography } from '../../../shared/react';
import { SquareTranslationExperiment } from './SquareTranslationExperiment';
import { UfoTranslationScene } from './UfoTranslationScene';
import './OptionalInteractionPage.css';

export function OptionalInteractionPage() {
  return <ContentBlock headingLevel={1} className="aipe-translation-page" title="让学习者亲手探索，观察并验证结果" subtitle="以拉普拉斯算子为例，比较两种平移等变性的学习体验。">
    <div className="aipe-translation-panels">
      <section className="aipe-translation-panel aipe-translation-conventional">
        <header><Typography as="h2" variant="h3" tone="inherit">常见讲解思路</Typography><Typography variant="bodySmall" tone="muted">调节位移，实时观察边缘响应。</Typography></header>
        <SquareTranslationExperiment />
      </section>
      <section className="aipe-translation-panel aipe-translation-exploration">
        <header><Typography as="h2" variant="h3" tone="inherit">我们的交互式知识呈现</Typography><Typography variant="bodySmall" tone="muted">自由移动目标，实时观察响应。</Typography></header>
        <Typography variant="bodySmall" tone="accent" className="aipe-translation-question">目标向右移动，响应会怎样变化？</Typography>
        <UfoTranslationScene />
        <div className="aipe-translation-note"><Typography variant="bodySmall" tone="accent">鼠标控制 UFO，自由选择位置。</Typography><Typography variant="bodySmall" tone="muted">可继续探索遮挡对响应的影响。</Typography></div>
      </section>
    </div>
    <footer className="aipe-translation-summary"><Typography variant="body" tone="accent">从简单示意到可探索场景，让学习者自主观察与验证。</Typography><Typography variant="bodySmall" tone="muted">观察目标的局部响应；遮挡会改变可见输入与响应。</Typography></footer>
  </ContentBlock>;
}
