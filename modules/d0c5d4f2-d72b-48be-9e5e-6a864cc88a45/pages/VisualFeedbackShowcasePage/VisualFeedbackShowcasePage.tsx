import { ContentBlock, Typography } from "@shuku/course-style/react";
import { UfoTranslationScene } from '../../../b8d86e85-2150-47e3-9e1a-aa7cc7cce15c/pages/OptionalInteractionPage/UfoTranslationScene';
import '../../../b8d86e85-2150-47e3-9e1a-aa7cc7cce15c/pages/OptionalInteractionPage/OptionalInteractionPage.css';
import '../../components/InteractionShowcase.css';

export function VisualFeedbackShowcasePage(){
 return <ContentBlock className="rf-page rf-visual-feedback-showcase" title="移动一个目标，实时看到计算结果">
  <div className="rf-feedback-scene"><UfoTranslationScene/></div>
  <div className="rf-showcase-bottom"><Typography variant="body">移动鼠标控制 UFO，观察边缘响应怎样同步变化</Typography><Typography variant="body" tone="accent">真实计算 · 即时反馈 · 自由探索</Typography></div>
 </ContentBlock>;
}
