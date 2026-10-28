import { ContentBlock, moduleAssetUrl, Typography } from '../../../shared/react';
import outline from '../../outlines.json';
import './FoundationFrontierPage.css';

export function FoundationFrontierPage() {
  return (
    <ContentBlock
      className="llmpe-ff-page"
      title="成为知识探索者，既要打牢基础，也要紧跟前沿"
      bodyClassName="llmpe-ff-body"
    >
      <div className="llmpe-ff-headings">
        <Typography as="h2" variant="display" tone="accent" className="llmpe-ff-choice">打牢基础</Typography>
        <Typography as="h2" variant="display" tone="inherit" className="llmpe-ff-choice llmpe-ff-frontier">紧跟前沿</Typography>
      </div>
      <img
        className="llmpe-ff-materials"
        src={moduleAssetUrl(outline.moduleIdentity.id, 'images/foundation-frontier-materials-v1.png')}
        alt="左侧是系统教材，右侧是最新研究论文，分别对应基础学习与前沿跟进"
        draggable={false}
      />
      <div className="llmpe-ff-captions">
        <div className="llmpe-ff-next">
          <Typography variant="body" tone="muted">系统教材 · 基本方法</Typography>
          <span className="llmpe-ff-emphasis" aria-hidden="true" />
        </div>
        <Typography variant="body" tone="muted">最新论文 · 新问题与新方法</Typography>
      </div>
    </ContentBlock>
  );
}
