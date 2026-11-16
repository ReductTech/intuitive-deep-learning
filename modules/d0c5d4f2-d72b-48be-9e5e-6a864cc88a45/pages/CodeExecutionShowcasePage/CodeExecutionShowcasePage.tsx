import { ContentBlock, Typography } from "@shuku/course-style/react";
import { CodeEditor } from '../../../b8d86e85-2150-47e3-9e1a-aa7cc7cce15c/pages/CodePracticePage/CodeEditor';
import outline from '../../outlines.json';
import '../../../b8d86e85-2150-47e3-9e1a-aa7cc7cce15c/pages/CodePracticePage/CodePracticePage.css';
import './CodeExecutionShowcasePage.css';
import { useResearchAnimation } from '../../components/useResearchAnimation';
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

y = residual_block(x)`;

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
 return <div shuku-edit-id="e-d748aca7-0175-48d7-b838-f18bb55f5433" className="rf-sim-graph" data-branched={branched}>
  <svg shuku-edit-id="e-20e8407b-2dfc-4f70-9064-2cbee6cf51ce" viewBox="0 0 620 580" preserveAspectRatio="none" aria-hidden="true"><g shuku-edit-id="e-5fa00b4d-7c88-403b-a07f-6f415c17be5a" fill="none" stroke="#8fa7c2" strokeWidth="2">{[...wires,'M310 430V461','M310 499V531'].map(d=><path shuku-edit-id="e-83faf151-7231-4a9f-985c-febf1ec3db08" key={d} d={d}/>)}</g><path shuku-edit-id="e-251e9eb0-4bfc-4051-9d7c-095fc5dff651" d="M400 30H555Q565 30 565 40V400Q565 410 555 410H332" fill="none" stroke="#2477f3" strokeWidth="2"/><path shuku-edit-id="e-e0808025-ee0f-4154-a491-d00b99b6c660" d="M340 405L332 410L340 415" fill="none" stroke="#2477f3" strokeWidth="2"/></svg>
  {nodes.map(n=><div shuku-edit-id="e-2bd5f90c-1862-4eb6-bcb2-89ca117a0d72" key={n.id} className={`rf-sim-node code-lab-node ${n.label==='＋'?'rf-sim-add':''} ${n.id.startsWith('branch')?'rf-sim-branch':''}`} style={{left:`${n.x/620*100}%`,top:`${n.y/580*100}%`}}><Typography shuku-edit-id="e-c0ae0e46-9af0-494d-9be5-5297388269e7" variant="bodySmall">{n.label}</Typography></div>)}
  <Typography shuku-edit-id="e-b4b7a0a9-1d0e-4744-b277-673d32935960" className="rf-sim-shortcut" variant="bodySmall">捷径连接</Typography>
 </div>;
}

export function CodeExecutionShowcasePage(){
 const {elapsed,root}=useResearchAnimation(8000);
 const addition='\n    branch = conv2d(x, w, padding=1)\n    branch = relu(branch)\n    out = out + branch\n';
 const at=initialCode.indexOf('    out = out + x');
 const count=Math.floor(Math.max(0,Math.min(1,(elapsed-1100)/2700))*addition.length);
 const inserted=addition.slice(0,count);
 // Replace the complete document on every frame; reserve a separate line for
 // the existing residual connection even while the new line is being typed.
 const code=count===0?initialCode:initialCode.slice(0,at)+inserted+(inserted.endsWith('\n')?'':'\n')+'\n'+initialCode.slice(at);
 const branched=elapsed>=4300;
 return <section shuku-edit-id="e-f605fa36-055f-45ec-9d97-ed84a1e14706" ref={root} className="rf-page rf-interaction-showcase rf-code-showcase rf-recording-demo" aria-label="代码与网络结构联动" data-phase={branched?'complete':count?'typing':'ready'}>
  <ContentBlock shuku-edit-id="e-56eaef75-c8e8-40e0-be07-793f81231e23" title={outline.pages.find(page => page.id === '61e3a590-92b5-4817-a2d3-08ea993735f3')!.title} subtitle="以残差连接为例，演示新增分支与网络结构的对应变化" headingLevel={1} className="code-lab-page rf-sim-page" bodyClassName="code-lab-body">
   <div shuku-edit-id="e-ccdf9104-3f2e-480a-87f0-c30fd07b2ca7" className="code-lab-workspace">
    <header shuku-edit-id="e-46093429-2726-4eae-8e39-06f5add2a577" className="code-lab-toolbar">
     <div shuku-edit-id="e-3c47aa29-f86e-4dfb-9ab8-0f8124290b0c" className="code-lab-file"><span shuku-edit-id="e-ca3a2e0e-bb85-45f6-ba00-e0a2f1b8bd9f" className="code-lab-python">Py</span>residual_block.py</div>

    </header>
    <div shuku-edit-id="e-8256dc5d-0eb5-4fd3-ab61-4ad29e5c0dab" className="code-lab-layout">
     <div shuku-edit-id="e-d3d1db64-5e6b-4bb3-9bec-0f331d76d794" className="code-lab-left"><CodeEditor value={code} onChange={()=>{}} onCursor={()=>{}}/></div>
     <div shuku-edit-id="e-d3c31794-00fd-47fb-b08b-daf71b56c24c" className="code-lab-right"><div shuku-edit-id="e-edd4e9b1-db13-4dbd-a2fd-85f96cb99e4c" className="code-lab-graph-heading"><Typography shuku-edit-id="e-715f193c-36c0-445e-97da-823894be971f" variant="bodySmall">网络结构</Typography></div><SimulatedGraph branched={branched}/></div>
    </div>
   </div>
  </ContentBlock>
 </section>;
}
