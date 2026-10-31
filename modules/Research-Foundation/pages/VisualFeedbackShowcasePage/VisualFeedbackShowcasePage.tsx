import { ContentBlock, Typography } from '../../../shared/react';
import { UfoTranslationScene } from '../../../AI-Practice-Education/pages/OptionalInteractionPage/UfoTranslationScene';
import '../../../AI-Practice-Education/pages/OptionalInteractionPage/OptionalInteractionPage.css';
import '../../components/InteractionShowcase.css';

export function VisualFeedbackShowcasePage(){
 return <ContentBlock className="rf-page rf-visual-feedback-showcase" title="移动一个目标，实时看到计算结果">
  <div className="rf-feedback-scene"><UfoTranslationScene/></div>
  <div className="rf-showcase-bottom"><Typography variant="body">移动鼠标控制 UFO，观察边缘响应怎样同步变化</Typography><Typography variant="body" tone="accent">真实计算 · 即时反馈 · 自由探索</Typography></div>
 </ContentBlock>;
}
