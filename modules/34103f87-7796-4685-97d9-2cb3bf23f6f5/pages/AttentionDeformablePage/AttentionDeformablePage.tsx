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
 return <ContentBlock shuku-edit-id="e-a4016938-e5f4-4d9f-87f1-26c42e1c4ca1" ref={root} headingLevel={1} title="同一幅画面，读取范围有多大" subtitle="同一个 Q，比较读取范围。" className="attn-window-page" bodyClassName="attn-window-body" data-activity="C28" data-activity-complete={done} data-window-mode={state.mode} data-window-visited={JSON.stringify(state.visited)} data-capture-ready={mathReady} aria-busy={!mathReady}>
  <div shuku-edit-id="e-fd247573-9dda-40a4-9048-a0b135502447" className="attn-window-main"><PassingGridScene mode={state.mode}/><aside shuku-edit-id="e-d60bc690-8b3d-49a0-800a-dcc12094d95d" className="attn-window-detail">
   <Typography shuku-edit-id="e-232e7668-0982-4c63-b315-a45375083666" variant="bodySmall" tone="muted">读取模式</Typography>
   <ChoiceButtons label="比较读取范围" value={state.mode} options={[{value:'full',label:'全局'},{value:'window',label:'固定窗口'},{value:'shift',label:'移位窗口'}]} onChange={v=>{if(canAct())setState(s=>({mode:v as Mode,visited:[...new Set([...s.visited,v as Mode])]}));}}/>
   <div shuku-edit-id="e-d27ab257-8220-43a6-825b-8add62203879" className="attn-window-result">
    <Typography shuku-edit-id="e-fe4322ab-be0b-4fd5-9135-d41331863063" variant="h3" tone="accent">{full?'60':'4'} 个候选位置</Typography>
    <Typography shuku-edit-id="e-872c0112-9bc6-4ab5-89c5-92b62f2134f7" variant="bodySmall">{messages[state.mode]}</Typography>
    <Typography shuku-edit-id="e-c03a158a-2a26-43c3-9012-aec24210898b" variant="bodySmall" tone="muted">包含 Q 自身。</Typography>
   </div>
   <div shuku-edit-id="e-268a9907-a750-430f-b41e-812da89ce083" className="attn-window-reference">
    <Typography shuku-edit-id="e-4b52bc5b-b577-4b85-adf8-18cafd1eb807" variant="bodySmall">Q：黑衣队持球处格点中心 (7, 1)。</Typography>
    <Typography shuku-edit-id="e-b041b575-ac31-4719-8953-8d8473c5ad66" variant="bodySmall" tone="muted">10×6 手设网格；图像仅定位。</Typography>
   </div>
  </aside></div>
  <footer shuku-edit-id="e-78e45e50-3e11-4703-83b5-51e4f3df5763" className="attn-window-footer"><div shuku-edit-id="e-0200230c-88e7-4728-b8e0-766b2e9265e1"><Typography shuku-edit-id="e-9b062514-c533-44de-b9ec-d5d62aece27a" variant="body">切换模式，比较范围。</Typography><Button onClick={()=>{if(canAct())setState({mode:'full',visited:['full']});}}>重新比较</Button></div><Typography shuku-edit-id="e-579b1a2e-259f-46c7-958a-2f268c7f476f" variant="bodySmall" tone={done?'success':'muted'}>{done?'Q 不变，读取范围随模式变。':'已查看 '+state.visited.length+' / 3 种模式。'}</Typography></footer>
 </ContentBlock>;
}
