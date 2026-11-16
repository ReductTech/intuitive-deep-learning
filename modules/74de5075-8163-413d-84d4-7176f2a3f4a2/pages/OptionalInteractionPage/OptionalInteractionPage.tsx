import { ContentBlock, Typography } from "@shuku/course-style/react";
import { SquareTranslationExperiment } from './SquareTranslationExperiment';
import { UfoTranslationScene } from './UfoTranslationScene';
import { DesignComparisonHeader } from '../../components/DesignComparisonHeader';
import './OptionalInteractionPage.css';

export function OptionalInteractionPage() {
  return <ContentBlock shuku-edit-id="e-ae0fe99a-aacb-4fe6-a050-4608f8a89b90" headingLevel={1} className="aipe-translation-page" title="让学习者亲手探索，观察并验证结果" subtitle="以拉普拉斯算子为例，比较两种交互设计。">
    <div shuku-edit-id="e-b587416c-c3d6-4269-acd7-fb393463872b" className="aipe-translation-panels">
      <section shuku-edit-id="e-173d0fa8-0ae4-4cc8-a603-9046b3f851ef" className="aipe-translation-panel aipe-translation-conventional aipe-design-comparison-panel">
        <DesignComparisonHeader description="调节参数，观察图形变化" />
        <div shuku-edit-id="e-a03ed84c-1005-4e82-b3d6-164a21f91b17" className="aipe-translation-experiment"><SquareTranslationExperiment /></div>
      </section>
      <section shuku-edit-id="e-2de77da9-ae03-475b-b50e-1918e5dd155e" className="aipe-translation-panel aipe-translation-exploration aipe-design-comparison-panel is-ours">
        <DesignComparisonHeader ours description="直接操作，探索场景变化" />
        <div shuku-edit-id="e-185a358f-eb24-4362-9187-e58d4c114902" className="aipe-translation-experiment"><UfoTranslationScene />
          <div shuku-edit-id="e-06af5c3a-6427-4362-ac33-1b6ff1e1473a" className="aipe-translation-mouse-hint"><svg shuku-edit-id="e-8d460dd6-3a46-4545-bfe4-704eec72bd4f" viewBox="0 0 48 58" aria-hidden="true"><rect shuku-edit-id="e-8d0e9b86-1fed-4861-8eec-47eb0000dfa4" x="10" y="10" width="28" height="44" rx="14" fill="none" stroke="currentColor" strokeWidth="3"/><path shuku-edit-id="e-fc12be3c-344b-4d09-93fa-db794c39180e" d="M24 11v15M24 1v5M36 3l-4 5M43 12l-6 2" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg><Typography shuku-edit-id="e-b4298e42-25d5-461b-b513-939cd2b5756a" variant="body" tone="accent">移动鼠标，观察响应</Typography></div>
        </div>
      </section>
    </div>
  </ContentBlock>;
}
