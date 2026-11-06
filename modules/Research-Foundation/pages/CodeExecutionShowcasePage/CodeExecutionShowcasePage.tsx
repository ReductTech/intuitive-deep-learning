import { ContentBlock, Typography } from '../../../shared/react';
import { CodeEditor } from '../../../AI-Practice-Education/pages/CodePracticePage/CodeEditor';
import outline from '../../outlines.json';
import '../../../AI-Practice-Education/pages/CodePracticePage/CodePracticePage.css';
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
 return <div className="rf-sim-graph" data-branched={branched}>
  <svg viewBox="0 0 620 580" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke="#8fa7c2" strokeWidth="2">{[...wires,'M310 430V461','M310 499V531'].map(d=><path key={d} d={d}/>)}</g><path d="M400 30H555Q565 30 565 40V400Q565 410 555 410H332" fill="none" stroke="#2477f3" strokeWidth="2"/><path d="M340 405L332 410L340 415" fill="none" stroke="#2477f3" strokeWidth="2"/></svg>
  {nodes.map(n=><div key={n.id} className={`rf-sim-node code-lab-node ${n.label==='＋'?'rf-sim-add':''} ${n.id.startsWith('branch')?'rf-sim-branch':''}`} style={{left:`${n.x/620*100}%`,top:`${n.y/580*100}%`}}><Typography variant="bodySmall">{n.label}</Typography></div>)}
  <Typography className="rf-sim-shortcut" variant="bodySmall">捷径连接</Typography>
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
 return <section ref={root} className="rf-page rf-interaction-showcase rf-code-showcase rf-recording-demo" aria-label="代码与网络结构联动" data-phase={branched?'complete':count?'typing':'ready'}>
  <ContentBlock title={outline.pages[11].title} subtitle="以残差连接为例，演示新增分支与网络结构的对应变化" headingLevel={1} className="code-lab-page rf-sim-page" bodyClassName="code-lab-body">
   <div className="code-lab-workspace">
    <header className="code-lab-toolbar">
     <div className="code-lab-file"><span className="code-lab-python">Py</span>residual_block.py</div>

    </header>
    <div className="code-lab-layout">
     <div className="code-lab-left"><CodeEditor value={code} onChange={()=>{}} onCursor={()=>{}}/></div>
     <div className="code-lab-right"><div className="code-lab-graph-heading"><Typography variant="bodySmall">网络结构</Typography></div><SimulatedGraph branched={branched}/></div>
    </div>
   </div>
  </ContentBlock>
 </section>;
}
