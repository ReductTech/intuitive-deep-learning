import { ContentBlock, Typography } from "@shuku/course-style/react";
import { WeightSharingScene } from '../../../38cd1c79-d8b7-462a-b208-a567c5cd89c4/pages/WeightSharingPage/WeightSharingScene';
import '../../../38cd1c79-d8b7-462a-b208-a567c5cd89c4/pages/WeightSharingPage/WeightSharingPage.css';
import '../../components/InteractionShowcase.css';

export function ThreeDInteractionShowcasePage(){
 return <ContentBlock shuku-edit-id="e-26894f2b-0cee-4df1-b6e6-da58dc4bd02b" className="rf-page rf-three-d-showcase" title="三维结构，可以旋转，也可以动态计算">
  <div shuku-edit-id="e-f1646e53-181e-4445-b0eb-9043ead8744a" className="rf-three-d-scene"><WeightSharingScene kind="shared"/></div>
  <div shuku-edit-id="e-a3253006-9365-44b2-b3db-a5953d519617" className="rf-showcase-bottom"><Typography shuku-edit-id="e-0ce13cf7-0e78-4867-9b5c-566c8651ddbb" variant="body">拖动旋转视角，观察输入、卷积核与输出之间的对应</Typography><Typography shuku-edit-id="e-97126471-1704-4561-9fc5-823ad3e607f3" variant="body" tone="accent">三维交互 · 动态扫描 · 权重共享</Typography></div>
 </ContentBlock>;
}
