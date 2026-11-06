import { useRef } from 'react';
import { CaoChongPage } from '../../../Regression-Loss/pages/CaoChongPage/CaoChongPage';
import { useRecordingDemo } from '../../components/RecordingDemo';
import '../../components/InteractionShowcase.css';

export function CaoChongShowcasePage() {
  const root=useRef<HTMLElement>(null);
  useRecordingDemo(root,async demo=>{
    const button=root.current!.querySelector<HTMLButtonElement>('.rl-cao-stone-button')!;
    await demo.wait(500);await demo.click(button);
    await demo.until(()=>button.getAttribute('aria-label')?.startsWith('投放')===true&&!button.disabled,9000);
    for(let i=0;i<5;i++){
      await demo.click(button,150);await demo.wait(900);
      await demo.until(()=>i===4?button.getAttribute('aria-label')==='石头用完了':!button.disabled,4000);
    }
    await demo.move(root.current!.querySelector('.rl-cao-chart')!,650);await demo.wait(1300);
  },{ready:()=>Array.from(root.current?.querySelectorAll('img')??[]).every(image=>image.complete)});
  return <section ref={root} className="rf-page rf-interaction-showcase rf-regression-showcase rf-recording-demo" aria-label="交互教学：曹冲称象实验"><CaoChongPage /></section>;
}
