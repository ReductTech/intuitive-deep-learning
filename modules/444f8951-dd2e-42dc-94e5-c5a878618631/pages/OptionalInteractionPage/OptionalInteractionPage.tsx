import { ContentBlock, Typography } from "@shuku/course-style/react";
import { SquareTranslationExperiment } from './SquareTranslationExperiment';
import { UfoTranslationScene } from './UfoTranslationScene';
import { DesignComparisonHeader } from '../../components/DesignComparisonHeader';
import './OptionalInteractionPage.css';

export function OptionalInteractionPage() {
  return <ContentBlock shuku-edit-id="e-744c3e7c-a011-4c44-aeb6-1a7b2e8950ea" headingLevel={1} className="cg-translation-page" title="让学习者亲手探索，观察并验证结果" subtitle="以拉普拉斯算子为例，比较两种交互设计。">
    <div shuku-edit-id="e-907da7f6-6bc5-4e7b-910e-0bb4b7de011d" className="cg-translation-panels">
      <section shuku-edit-id="e-fac09a4b-1125-4fd4-a342-4fd134d37fec" className="cg-translation-panel cg-translation-conventional cg-design-comparison-panel">
        <DesignComparisonHeader description="调节参数，观察图形变化" />
        <div shuku-edit-id="e-58aa2659-0533-4a4f-be5f-e04fd57594d6" className="cg-translation-experiment"><SquareTranslationExperiment /></div>
      </section>
      <section shuku-edit-id="e-63341d29-b825-4a1c-9b33-1f80791741ed" className="cg-translation-panel cg-translation-exploration cg-design-comparison-panel is-ours">
        <DesignComparisonHeader ours description="直接操作，探索场景变化" />
        <div shuku-edit-id="e-32eceece-df31-4a63-8737-2a4920125fc0" className="cg-translation-experiment"><UfoTranslationScene />
          <div shuku-edit-id="e-fac60ced-8a9d-4c06-8f06-b9705e98c87c" className="cg-translation-mouse-hint"><svg shuku-edit-id="e-a33543b7-819d-492b-af81-7cb9f0f99fc8" viewBox="0 0 48 58" aria-hidden="true"><rect shuku-edit-id="e-5eaa8fa9-b533-4888-a1a4-dee641999609" x="10" y="10" width="28" height="44" rx="14" fill="none" stroke="currentColor" strokeWidth="3"/><path shuku-edit-id="e-cba6cc7c-fc69-41a5-bc82-5b8a2c41c733" d="M24 11v15M24 1v5M36 3l-4 5M43 12l-6 2" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg><Typography shuku-edit-id="e-ac86eb1c-93db-4c0b-bca9-d9030af581bb" variant="body" tone="accent">移动鼠标，观察响应</Typography></div>
        </div>
      </section>
    </div>
  </ContentBlock>;
}
