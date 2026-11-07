import { Button, ContentBlock, Typography } from '../../../shared/react';
import { ChoiceButtons, Formula, useActivityState, type ActivityProps } from '../../components/AttentionActivity';
import { useRegressionPage as useAttentionPage } from '../../components/useRegressionPage';
import { PassingGridScene } from '../../components/PassingGridScene';
import { deformableDemo, type DeformableTarget } from '../../model/deformableDemo';
import './AttentionDeformableSamplingPage.css';
type Mode='window'|'deform';
interface State {mode:Mode;target:DeformableTarget;modes:Mode[];targets:DeformableTarget[]}
const initial:State={mode:'deform',target:'black-ball',modes:[],targets:[]};
const valid=(v:unknown):v is State=>{if(!v||typeof v!=='object')return false;const s=v as State;return ['window','deform'].includes(s.mode)&&['white-ball','black-ball'].includes(s.target)&&Array.isArray(s.modes)&&Array.isArray(s.targets)&&s.modes.every(x=>['window','deform'].includes(x))&&s.targets.every(x=>['white-ball','black-ball'].includes(x))&&new Set(s.modes).size===s.modes.length&&new Set(s.targets).size===s.targets.length;};
export function AttentionDeformableSamplingPage(props:ActivityProps){
 const [state,setState]=useActivityState<State>('C30-campus-sampling-comparison',initial,valid);
 const data=deformableDemo(state.target),deform=state.mode==='deform',done=state.modes.length===2&&state.targets.length===2;const {root,mathReady,canAct}=useAttentionPage(done,props);
 const target=(t:DeformableTarget)=>{if(canAct())setState(s=>({...s,target:t,targets:[...new Set([...s.targets,t])]}));};
 return <ContentBlock ref={root} headingLevel={1} title="窗口与可变形采样：参考位置怎样变化" subtitle="切换查询，比较四个参考位置。" className="attn-sampling-page" bodyClassName="attn-sampling-body" data-activity="C30" data-activity-complete={done} data-sampling-state={JSON.stringify(state)} data-offsets={JSON.stringify(data.offsets)} data-query-vector={JSON.stringify(data.q)} data-capture-ready={mathReady} aria-busy={!mathReady}>
  <div className="attn-sampling-main"><PassingGridScene mode={state.mode} target={state.target} onTarget={target}/><aside className="attn-sampling-detail">
   <ChoiceButtons label="读取方式" value={state.mode} options={[{value:'window',label:'固定窗口'},{value:'deform',label:'可变形采样'}]} onChange={v=>{if(canAct())setState(s=>({...s,mode:v as Mode,modes:[...new Set([...s.modes,v as Mode])]}));}}/>
   <ChoiceButtons label="查询位置" value={state.target} options={[{value:'white-ball',label:'白衣队持球处'},{value:'black-ball',label:'黑衣队持球处'}]} onChange={v=>target(v as DeformableTarget)}/>
   <div><Typography variant="bodySmall" tone="accent">参考点 p = ({data.reference.map(x=>x.toFixed(2)).join(', ')})</Typography><Typography variant="bodySmall">手设 Q = [{data.q.join(', ')}] · 格点中心</Typography></div>
   {deform?<><table className="attn-sampling-table" aria-label="四点偏移与注意力权重"><thead><tr>{['点','偏移 Δp（格）','权重 α'].map(x=><th key={x}><Typography variant="bodySmall" tone="muted">{x}</Typography></th>)}</tr></thead><tbody>{data.offsets.map((o,i)=><tr key={i} data-offset-row={i} data-offset={JSON.stringify(o)} data-alpha={data.weights[i]}><td><Typography variant="bodySmall" tone="accent">{i+1}</Typography></td><td><Typography variant="bodySmall">({o.map(x=>x.toFixed(2)).join(', ')})</Typography></td><td><Typography variant="bodySmall">{data.weights[i].toFixed(2)}</Typography></td></tr>)}</tbody></table><Typography variant="bodySmall" tone="muted">手设 Q 产生偏移与 α；α 和为1。</Typography></>:<><Typography variant="h3" tone="accent">固定的 2×2 窗口</Typography><Typography variant="bodySmall">读取所属窗口的四个格点中心。</Typography><Typography variant="bodySmall" tone="muted">Q 产生偏移，无需逐格计算 Q·K。</Typography></>}
  </aside></div>
  <footer className="attn-sampling-footer"><div className="attn-sampling-rule"><Formula label="采样坐标" latex={String.raw`p_j=p_{\mathrm{ref}}+\Delta p_j\oslash(10,6)`}/><Typography variant="bodySmall" tone="muted">偏移按分量相除；10×6 手设网格，图像仅定位。</Typography></div><div className="attn-sampling-status"><Typography variant="bodySmall" tone={done?'success':'muted'}>{done?'窗口限范围；偏移定位置。':'已查看方式 '+state.modes.length+'/2，查询 '+state.targets.length+'/2。'}</Typography><Button onClick={()=>{if(canAct())setState(initial);}}>重新比较</Button></div></footer>
 </ContentBlock>;
}
