import { ContentBlock, Typography } from '../../../shared/react';
import { SquareTranslationExperiment } from './SquareTranslationExperiment';
import { UfoTranslationScene } from './UfoTranslationScene';
import { DesignComparisonHeader } from '../../components/DesignComparisonHeader';
import './OptionalInteractionPage.css';

export function OptionalInteractionPage() {
  return <ContentBlock headingLevel={1} className="aipe-translation-page" title="让学习者亲手探索，观察并验证结果" subtitle="以拉普拉斯算子为例，比较两种交互设计。">
    <div className="aipe-translation-panels">
      <section className="aipe-translation-panel aipe-translation-conventional aipe-design-comparison-panel">
        <DesignComparisonHeader description="调节参数，观察图形变化" />
        <div className="aipe-translation-experiment"><SquareTranslationExperiment /></div>
      </section>
      <section className="aipe-translation-panel aipe-translation-exploration aipe-design-comparison-panel is-ours">
        <DesignComparisonHeader ours description="直接操作，探索场景变化" />
        <div className="aipe-translation-experiment"><UfoTranslationScene />
          <div className="aipe-translation-mouse-hint"><svg viewBox="0 0 48 58" aria-hidden="true"><rect x="10" y="10" width="28" height="44" rx="14" fill="none" stroke="currentColor" strokeWidth="3"/><path d="M24 11v15M24 1v5M36 3l-4 5M43 12l-6 2" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg><Typography variant="body" tone="accent">移动鼠标，观察响应</Typography></div>
        </div>
      </section>
    </div>
  </ContentBlock>;
}
