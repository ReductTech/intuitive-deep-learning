import { Button, ContentBlock, Typography } from "@shuku/course-style/react";
import { ChoiceButtons, useActivityState, type ActivityProps } from '../../components/AttentionActivity';
import { useRegressionPage as useAttentionPage } from '../../components/useRegressionPage';
import { PassingGridScene } from '../../components/PassingGridScene';
import './AttentionDeformablePage.css';
type Mode='full'|'window'|'shift';
interface State { mode:Mode;visited:Mode[] }
const valid=(v:unknown):v is State=>{if(!v||typeof v!=='object')return false;const s=v as State;return ['full','window','shift'].includes(s.mode)&&Array.isArray(s.visited)&&new Set(s.visited).size===s.visited.length&&s.visited.includes(s.mode)&&s.visited.every(x=>['full','window','shift'].includes(x));};
export function AttentionDeformablePage(props:ActivityProps){
 const [state,setState]=useActivityState<State>('C28-campus-window-comparison',{mode:'full',visited:['full']},valid);
 const done=state.visited.length===3;const {root,mathReady,canAct}=useAttentionPage(done,props);
 const full=state.mode==='full';
 const messages={full:'连线从 Q 延伸到各候选位置。',window:'只比较所属2×2窗口的四格。',shift:'相邻层交替移位，建立跨窗联系。'};
 return <ContentBlock ref={root} headingLevel={1} title="同一幅画面，读取范围有多大" subtitle="同一个 Q，比较读取范围。" className="attn-window-page" bodyClassName="attn-window-body" data-activity="C28" data-activity-complete={done} data-window-mode={state.mode} data-window-visited={JSON.stringify(state.visited)} data-capture-ready={mathReady} aria-busy={!mathReady}>
  <div className="attn-window-main"><PassingGridScene mode={state.mode}/><aside className="attn-window-detail">
   <Typography variant="bodySmall" tone="muted">读取模式</Typography>
   <ChoiceButtons label="比较读取范围" value={state.mode} options={[{value:'full',label:'全局'},{value:'window',label:'固定窗口'},{value:'shift',label:'移位窗口'}]} onChange={v=>{if(canAct())setState(s=>({mode:v as Mode,visited:[...new Set([...s.visited,v as Mode])]}));}}/>
   <div className="attn-window-result">
    <Typography variant="h3" tone="accent">{full?'60':'4'} 个候选位置</Typography>
    <Typography variant="bodySmall">{messages[state.mode]}</Typography>
    <Typography variant="bodySmall" tone="muted">包含 Q 自身。</Typography>
   </div>
   <div className="attn-window-reference">
    <Typography variant="bodySmall">Q：黑衣队持球处格点中心 (7, 1)。</Typography>
    <Typography variant="bodySmall" tone="muted">10×6 手设网格；图像仅定位。</Typography>
   </div>
  </aside></div>
  <footer className="attn-window-footer"><div><Typography variant="body">切换模式，比较范围。</Typography><Button onClick={()=>{if(canAct())setState({mode:'full',visited:['full']});}}>重新比较</Button></div><Typography variant="bodySmall" tone={done?'success':'muted'}>{done?'Q 不变，读取范围随模式变。':'已查看 '+state.visited.length+' / 3 种模式。'}</Typography></footer>
 </ContentBlock>;
}
