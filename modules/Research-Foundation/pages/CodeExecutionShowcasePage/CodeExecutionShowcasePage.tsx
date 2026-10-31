import { useRef, useState } from 'react';
import { ContentBlock, Typography } from '../../../shared/react';
import { CodeEditor } from '../../../AI-Practice-Education/pages/CodePracticePage/CodeEditor';
import outline from '../../outlines.json';
import '../../../AI-Practice-Education/pages/CodePracticePage/CodePracticePage.css';
import './CodeExecutionShowcasePage.css';
import { EditorView } from '@codemirror/view';
import { useRecordingDemo } from '../../components/RecordingDemo';
import '../../components/InteractionShowcase.css';

const initialCode = `import numpy as np
from course_ops import tensor, conv2d, relu

x = tensor(np.arange(64).reshape(1,1,8,8)/64)
w = np.ones((1,1,3,3), dtype=np.float32)/9

def residual_block(x):
    out = conv2d(x, w, padding=1)
    out = relu(out)
    out = conv2d(out, w, padding=1)
    out = out + x
    return relu(out)

y = residual_block(x)
`;

// Presentation-only preset graph. This page never imports or executes Python.
function SimulatedGraph({ branched }: { branched: boolean }) {
 const main = branched ? 185 : 310;
 const nodes = [
  {id:'input',label:'输入  8 × 8 × 1',x:310,y:30},
  {id:'conv1',label:'Conv 3 × 3',x:main,y:110},
  {id:'relu1',label:'ReLU',x:main,y:180},
  {id:'conv2',label:'Conv 3 × 3',x:main,y:250},
  ...(branched ? [{id:'branch-conv',label:'Conv 3 × 3',x:435,y:110},{id:'branch-relu',label:'ReLU',x:435,y:180},{id:'branch-add',label:'＋',x:310,y:330}] : []),
  {id:'add',label:'＋',x:310,y:410},
  {id:'relu2',label:'ReLU',x:310,y:480},
  {id:'output',label:'输出  8 × 8 × 1',x:310,y:550},
 ];
 const wires = branched
  ? ['M310 49V65H185V91','M310 65H435V91','M185 129V161','M185 199V231','M435 129V161','M185 269V330H290','M435 199V330H330','M310 350V390']
  : ['M310 49V91','M310 129V161','M310 199V231','M310 269V390'];
 return <div className="rf-sim-graph" data-branched={branched}>
  <svg viewBox="0 0 620 580" aria-hidden="true"><g fill="none" stroke="#8fa7c2" strokeWidth="2">{[...wires,'M310 430V461','M310 499V531'].map(d=><path key={d} d={d}/>)}</g><path d="M400 30H555Q565 30 565 40V400Q565 410 555 410H332" fill="none" stroke="#2477f3" strokeWidth="2"/><path d="M340 405L332 410L340 415" fill="none" stroke="#2477f3" strokeWidth="2"/></svg>
  {nodes.map(n=><div key={n.id} className={`rf-sim-node code-lab-node ${n.label==='＋'?'rf-sim-add':''} ${n.id.startsWith('branch')?'rf-sim-branch':''}`} style={{left:`${n.x/620*100}%`,top:`${n.y/580*100}%`}}><Typography variant="bodySmall">{n.label}</Typography></div>)}
  <Typography className="rf-sim-shortcut" variant="bodySmall">捷径连接</Typography>
 </div>;
}

export function CodeExecutionShowcasePage(){
 const [code,setCode]=useState(initialCode),[branched,setBranched]=useState(false);
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
  await demo.until(()=>root.current?.querySelector('.rf-sim-graph')?.getAttribute('data-branched')==='true',1000);
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
 },{ready:()=>Boolean(root.current?.querySelector('.cm-editor'))});
 return <section ref={root} className="rf-page rf-interaction-showcase rf-code-showcase rf-recording-demo" aria-label="代码与网络结构联动的模拟演示">
  <ContentBlock title={outline.pages[11].title} subtitle="以残差连接为例，演示新增分支与网络结构的对应变化" headingLevel={1} className="code-lab-page rf-sim-page" bodyClassName="code-lab-body">
   <div className="code-lab-workspace">
    <header className="code-lab-toolbar">
     <div className="code-lab-file"><span className="code-lab-python">Py</span>residual_block.py</div>
     <Typography variant="bodySmall" className="code-lab-sync">模拟演示</Typography>
     <div className="code-lab-actions"><button className="code-lab-run" onClick={()=>setBranched(code.includes('out = out + branch'))}>▶ 演示</button><button className="code-lab-reset" onClick={()=>{setCode(initialCode);setBranched(false)}}>↻ 重置</button></div>
    </header>
    <div className="code-lab-layout">
     <div className="code-lab-left"><CodeEditor value={code} onChange={setCode} onCursor={()=>{}} onRun={()=>setBranched(code.includes('out = out + branch'))}/></div>
     <div className="code-lab-right"><div className="code-lab-graph-heading"><Typography variant="bodySmall">网络结构</Typography><Typography variant="bodySmall" tone="muted">预设结构示意</Typography></div><SimulatedGraph branched={branched}/></div>
    </div>
   </div>
  </ContentBlock>
 </section>;
}
