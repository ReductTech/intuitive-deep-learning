import { useEffect, useRef } from 'react';
import { EditorView } from '@codemirror/view';
import { CodePracticePage } from '../../../AI-Practice-Education/pages/CodePracticePage/CodePracticePage';
import { useRecordingDemo } from '../../components/RecordingDemo';
import '../../components/InteractionShowcase.css';

export function CodeExecutionShowcasePage(){
 const root=useRef<HTMLElement>(null);
 useRecordingDemo(root,async demo=>{
  const host=root.current!.querySelector<HTMLElement>('.cm-editor')!;
  const editor=EditorView.findFromDOM(host)!;
  const marker='    out = out + x',at=editor.state.doc.toString().indexOf(marker);
  if(at<0)throw new Error('未找到残差代码的分支插入点');
  await demo.wait(650);
  editor.dispatch({selection:{anchor:at},effects:EditorView.scrollIntoView(at,{y:'center'})});editor.focus();
  await demo.wait(100);
  const coords=editor.coordsAtPos(at)!;
  await demo.moveTo(demo.fromClient(coords.left+10,(coords.top+coords.bottom)/2),500);
  const addition='    branch = conv2d(x, w, padding=1)\n    branch = relu(branch)\n    out = out + branch\n';
  let inserted=0;
  await demo.animate(2500,t=>{
   const count=Math.min(addition.length,Math.floor(t*addition.length));
   if(count>inserted){editor.dispatch({changes:{from:at+inserted,insert:addition.slice(inserted,count)},selection:{anchor:at+count},effects:EditorView.scrollIntoView(at+count,{y:'nearest'})});inserted=count;}
  });
  await demo.wait(300);await demo.click(root.current!.querySelector<HTMLButtonElement>('.code-lab-run')!,550);
  await demo.until(()=>root.current?.querySelector('.code-lab-sync')?.textContent==='Python 已运行',20000);
  const convolutions=Array.from(root.current!.querySelectorAll<HTMLElement>('.code-lab-node')).filter(node=>node.textContent?.includes('Conv'));
  if(convolutions.length!==3)throw new Error('新增分支未在实际运行结构中出现');
  root.current!.dataset.demoBranchCount='2';
  // Keep the new source visible after the real run opens its output console.
  const branchAt=editor.state.doc.toString().indexOf('    branch = conv2d');
  const scroller=editor.scrollDOM,from=scroller.scrollTop;
  const target=Math.min(scroller.scrollHeight-scroller.clientHeight,Math.max(0,editor.lineBlockAt(branchAt).top-scroller.clientHeight*.35));
  await demo.move(scroller,350);
  await demo.animate(600,t=>{const p=t*t*(3-2*t);scroller.scrollTop=from+(target-from)*p;});
  editor.dispatch({selection:{anchor:branchAt,head:branchAt+addition.length}});
  await demo.move(convolutions[2],650);await demo.wait(1800);
 },{ready:()=>root.current?.querySelector('.code-lab-sync')?.textContent==='Python 已运行'});
 useEffect(()=>{
  const mark=()=>{
   root.current?.querySelector('.cm-scroller')?.setAttribute('data-ppt-viewport','可滚动的 Python 源码编辑器');
   root.current?.querySelector('.code-lab-graph-area')?.setAttribute('data-ppt-viewport','查看算子详情时可滚动的网络结构图');
  };
  mark();const observer=new MutationObserver(mark);if(root.current)observer.observe(root.current,{childList:true,subtree:true});
  return()=>observer.disconnect();
 },[]);
 return <section ref={root} className="rf-page rf-interaction-showcase rf-code-showcase rf-recording-demo" aria-label="真实交互作品：Python 实际执行与网络结构联动"><CodePracticePage autoRunOnEdit={false} parallelBranches/></section>;
}
