import { ContentBlock, Typography } from '../../../shared/react';
import { WeightSharingScene } from '../../../Convolution-Kernel-Intro/pages/WeightSharingPage/WeightSharingScene';
import '../../../Convolution-Kernel-Intro/pages/WeightSharingPage/WeightSharingPage.css';
import '../../components/InteractionShowcase.css';

export function ThreeDInteractionShowcasePage(){
 return <ContentBlock className="rf-page rf-three-d-showcase" title="三维结构，可以旋转，也可以动态计算">
  <div className="rf-three-d-scene"><WeightSharingScene kind="shared"/></div>
  <div className="rf-showcase-bottom"><Typography variant="body">拖动旋转视角，观察输入、卷积核与输出之间的对应</Typography><Typography variant="body" tone="accent">三维交互 · 动态扫描 · 权重共享</Typography></div>
 </ContentBlock>;
}
