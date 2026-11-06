import { useRef } from 'react';
import { EstimateWeightPage } from '../../../Regression-Loss/pages/EstimateWeightPage/EstimateWeightPage';
import { useRecordingDemo } from '../../components/RecordingDemo';
import '../../components/InteractionShowcase.css';

export function RegressionFitShowcasePage() {
  const root=useRef<HTMLElement>(null);
  useRecordingDemo(root,async demo=>{
    const handle=root.current!.querySelector<HTMLElement>('.rl-estimate-handle')!;
    const endpoint=(slope:number)=>{
      const rect=root.current!.querySelector('.rl-estimate-plot-canvas')!.getBoundingClientRect();
      const x=Math.min(3000,48/slope),y=slope*x;
      return demo.fromClient(rect.x+rect.width*(.1+x/3000*.84),rect.y+rect.height*(.12+(1-y/48)*.74));
    };
    await demo.wait(700);await demo.drag(handle,endpoint(.024),1000);await demo.wait(650);
    await demo.drag(handle,endpoint(.016),1400);await demo.wait(650);
    const reveal=Array.from(root.current!.querySelectorAll('button')).find(button=>button.textContent?.includes('揭晓真实象重'))!;
    await demo.click(reveal,600);await demo.wait(1800);
  });
  return <section ref={root} className="rf-page rf-interaction-showcase rf-regression-showcase rf-recording-demo" aria-label="交互教学：线性拟合与损失"><EstimateWeightPage showLoss /></section>;
}
