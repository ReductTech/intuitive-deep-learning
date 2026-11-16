import { ContentBlock, Typography } from "@shuku/course-style/react";
import { SquareTranslationExperiment } from './SquareTranslationExperiment';
import { UfoTranslationScene } from './UfoTranslationScene';
import { DesignComparisonHeader } from '../../components/DesignComparisonHeader';
import './OptionalInteractionPage.css';

export function OptionalInteractionPage() {
  return <ContentBlock shuku-edit-id="e-970b3c2f-e8af-4c33-ae64-2b0513cac4c3" headingLevel={1} className="aipe-translation-page" title="让学习者亲手探索，观察并验证结果" subtitle="以拉普拉斯算子为例，比较两种交互设计。">
    <div shuku-edit-id="e-9be8fd85-52f6-4f80-90ec-211abe404e4d" className="aipe-translation-panels">
      <section shuku-edit-id="e-e8f0618f-5bab-4b64-bd63-f40c80000f5b" className="aipe-translation-panel aipe-translation-conventional aipe-design-comparison-panel">
        <DesignComparisonHeader description="调节参数，观察图形变化" />
        <div shuku-edit-id="e-c943dcd9-2ac0-4797-ba86-4dce42e81320" className="aipe-translation-experiment"><SquareTranslationExperiment /></div>
      </section>
      <section shuku-edit-id="e-3ac9300f-4467-4ac8-a157-6d62d46aafbb" className="aipe-translation-panel aipe-translation-exploration aipe-design-comparison-panel is-ours">
        <DesignComparisonHeader ours description="直接操作，探索场景变化" />
        <div shuku-edit-id="e-64509043-4673-421f-b638-f54a54527763" className="aipe-translation-experiment"><UfoTranslationScene />
          <div shuku-edit-id="e-772b8026-367e-41ef-8e12-825c8af5981f" className="aipe-translation-mouse-hint"><svg shuku-edit-id="e-0bf07254-c3b1-4d74-8574-39e12176c9f4" viewBox="0 0 48 58" aria-hidden="true"><rect shuku-edit-id="e-83d46d71-2454-4e37-b96a-0d986e58c82d" x="10" y="10" width="28" height="44" rx="14" fill="none" stroke="currentColor" strokeWidth="3"/><path shuku-edit-id="e-7b22beaa-63d1-4728-bd42-f4607eafdb2c" d="M24 11v15M24 1v5M36 3l-4 5M43 12l-6 2" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg><Typography shuku-edit-id="e-936b298d-c198-4f30-882f-e9f9e81d929f" variant="body" tone="accent">移动鼠标，观察响应</Typography></div>
        </div>
      </section>
    </div>
  </ContentBlock>;
}
