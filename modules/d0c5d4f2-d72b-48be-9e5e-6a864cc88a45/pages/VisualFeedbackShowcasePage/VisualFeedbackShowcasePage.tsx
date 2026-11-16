import { ContentBlock, Typography } from "@shuku/course-style/react";
import { UfoTranslationScene } from '../../../b8d86e85-2150-47e3-9e1a-aa7cc7cce15c/pages/OptionalInteractionPage/UfoTranslationScene';
import '../../../b8d86e85-2150-47e3-9e1a-aa7cc7cce15c/pages/OptionalInteractionPage/OptionalInteractionPage.css';
import '../../components/InteractionShowcase.css';

export function VisualFeedbackShowcasePage(){
 return <ContentBlock shuku-edit-id="e-c8df8a4f-b806-4db0-9d0b-6d555001d81c" className="rf-page rf-visual-feedback-showcase" title="移动一个目标，实时看到计算结果">
  <div shuku-edit-id="e-08e63caf-3c44-47a3-bd14-61d580f17955" className="rf-feedback-scene"><UfoTranslationScene/></div>
  <div shuku-edit-id="e-c4a251d5-c61c-4686-81ac-d961306df083" className="rf-showcase-bottom"><Typography shuku-edit-id="e-e1a9e5f8-b116-42ab-bcd0-4db3e6e814b1" variant="body">移动鼠标控制 UFO，观察边缘响应怎样同步变化</Typography><Typography shuku-edit-id="e-323e02a2-de31-43f1-b87d-983b80b6f9d0" variant="body" tone="accent">真实计算 · 即时反馈 · 自由探索</Typography></div>
 </ContentBlock>;
}
