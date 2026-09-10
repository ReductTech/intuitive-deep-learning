import { ContentBlock, Question, Typography, type QuestionCheckResult } from '../../shared/react';
import { RegressionPlot } from '../components/RegressionPlot';

export function ScatterEvidenceBlock({ interactive = true, onComplete }: { interactive?: boolean; onComplete?: () => void }) {
  const handleCheck = (result: QuestionCheckResult) => {
    if (result.ok) onComplete?.();
  };

  return (
    <ContentBlock
      className="grl-block grl-scatter"
      title="不画线之前，数据已经告诉了我们什么？"
      subtitle="每个橙色点代表一户家庭：横向读父母平均身高，纵向读成年子女身高。"
    >
      <div className="grl-scatter__layout">
        <div className="grl-scatter__plot-wrap">
          <RegressionPlot />
          <Typography variant="bodySmall" tone="muted">教学示意样本 · 趋势来自整体点云，不由单个家庭决定</Typography>
        </div>
        <aside className="grl-evidence-margin">
          <Typography as="span" variant="bodySmall" tone="accent">观察目标</Typography>
          <Typography as="h3" variant="h2">沿着点云，从左向右看。</Typography>
          {interactive ? (
            <Question
              type="choice"
              title="父母平均身高增加时，孩子身高总体怎样变化？"
              answer="up"
              persistenceKey="galton-scatter-trend-v2"
              options={[
                { value: 'up', label: '总体上升，但并不完美', wrongFeedback: '' },
                { value: 'flat', label: '基本没有变化', wrongFeedback: '比较最左和最右的一组点，它们的纵向位置并不相同。' },
                { value: 'exact', label: '每个点都严格上升', wrongFeedback: '总体方向向上，但相邻点仍可能高低交错。' },
              ]}
              feedback={{ correct: '对。点云整体向右上方延伸，这就是正相关；散开说明预测不会完全准确。' }}
              onCheck={handleCheck}
            />
          ) : (
            <div className="grl-static-answer">
              <Typography as="strong" variant="h2" tone="success">总体向右上</Typography>
              <Typography variant="body">这给直线的斜率一个方向：应当大于 0。</Typography>
            </div>
          )}
        </aside>
      </div>
    </ContentBlock>
  );
}

