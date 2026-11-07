import { Button, ContentBlock, Typography } from '../../../shared/react';
import { ChoiceButtons, Formula, useActivityState, type ActivityProps } from '../../components/AttentionActivity';
import { useRegressionPage as useAttentionPage } from '../../components/useRegressionPage';
import { PassingGridScene } from '../../components/PassingGridScene';
import { deformableValueReadout, type DeformableTarget } from '../../model/deformableDemo';
import './AttentionDeformableLearningPage.css';
interface State {target:DeformableTarget;point:number;visited:number[]}
const initial:State={target:'black-ball',point:0,visited:[]};
const valid=(v:unknown):v is State=>{if(!v||typeof v!=='object')return false;const s=v as State;return ['white-ball','black-ball'].includes(s.target)&&Number.isInteger(s.point)&&s.point>=0&&s.point<4&&Array.isArray(s.visited)&&s.visited.every(x=>Number.isInteger(x)&&x>=0&&x<4)&&new Set(s.visited).size===s.visited.length;};
const names=['左上','右上','左下','右下'];
export function AttentionDeformableLearningPage(props:ActivityProps){
 const [state,setState]=useActivityState<State>('C32-campus-bilinear-reading',initial,valid);
 const data=deformableValueReadout(state.target),read=data.reads[state.point],done=state.visited.length>=2;const {root,mathReady,canAct}=useAttentionPage(done,props);
 const target=(t:DeformableTarget)=>{if(canAct())setState(s=>({...s,target:t}));};const select=(point:number)=>{if(canAct())setState(s=>({...s,point,visited:[...new Set([...s.visited,point])]}));};
 return <ContentBlock ref={root} headingLevel={1} title="采样与汇聚：先读附近，再合成结果" subtitle="采样点落在格点之间，怎样读取？" className="attn-read-page" bodyClassName="attn-read-body" data-activity="C32" data-activity-complete={done} data-reading-state={JSON.stringify(state)} data-readout={JSON.stringify(data)} data-capture-ready={mathReady} aria-busy={!mathReady}>
  <div className="attn-read-main"><div className="attn-read-scene-column"><ChoiceButtons label="查询位置" value={state.target} options={[{value:'white-ball',label:'白衣队持球处'},{value:'black-ball',label:'黑衣队持球处'}]} onChange={v=>target(v as DeformableTarget)}/><PassingGridScene mode="deform" target={state.target} selected={state.point} onTarget={target} onSelect={select}/><Typography variant="bodySmall" tone={done?'success':'muted'}>点选采样点，比较四角。已看 {Math.min(state.visited.length,2)} / 2。</Typography></div>
   <aside className="attn-read-detail"><Typography variant="h3" tone="accent">1 双线性读取 · 点 {state.point+1}</Typography><Typography variant="bodySmall">s = ({data.samples[state.point].map(x=>x.toFixed(3)).join(', ')})；u = {read.u.toFixed(2)}，v = {read.v.toFixed(2)}</Typography>
    <div className="attn-read-local-row"><div className="attn-read-local" role="img" aria-label={'局部四个格点，横向比例'+read.u.toFixed(2)+'，纵向比例'+read.v.toFixed(2)} data-local-u={read.u} data-local-v={read.v}>
     <svg viewBox="0 0 320 236" aria-hidden="true"><rect x="30" y="45" width="260" height="146" fill="var(--ui-accent-soft)" stroke="var(--ui-border-strong)" strokeWidth="2"/><path d={`M${30+260*read.u} 45V191M30 ${45+146*read.v}H290`} stroke="var(--ui-accent)" strokeDasharray="5 4"/>{[[30,45],[290,45],[30,191],[290,191]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="4" fill="var(--ui-success)"/>)}<circle data-local-point cx={30+260*read.u} cy={45+146*read.v} r="7" fill="var(--ui-accent)"/></svg>
     {read.corners.map((a,i)=><Typography key={i} as="span" variant="bodySmall" className={'attn-read-corner is-'+i}>{a.value.toFixed(2)}</Typography>)}
    </div><table className="attn-read-table" aria-label="单点四角插值"><thead><tr>{['邻点','V','β'].map(x=><th key={x}><Typography variant="bodySmall" tone="muted">{x}</Typography></th>)}</tr></thead><tbody>{read.corners.map((a,i)=><tr key={i} data-corner={i} data-column={a.column} data-row={a.row} data-beta={a.coefficient} data-value={a.value} data-beta-product={a.coefficient*a.value}><td><Typography variant="bodySmall">{names[i]}</Typography></td><td><Typography variant="bodySmall">{a.value.toFixed(2)}</Typography></td><td><Typography variant="bodySmall" tone="success">{a.coefficient.toFixed(3)}</Typography></td></tr>)}</tbody></table></div>
    <Formula label="单点双线性读取" latex={String.raw`\textstyle V(s_{${state.point+1}})=\sum_{k=1}^{4}\beta_kV_k\approx${read.value.toFixed(3)}`}/><Typography variant="bodySmall" tone="muted">β 和为1；V 为手设单通道值，图像仅定位。</Typography>
   </aside></div>
  <footer className="attn-read-footer"><Typography variant="body" tone="accent">2 按 α 汇聚 · 单头单尺度</Typography><div className="attn-read-contributions">{data.reads.map((r,i)=><div key={i} data-read-contribution={i} data-alpha={data.weights[i]} data-sample-value={r.value} data-product={data.contributions[i]}><Typography variant="bodySmall" tone={i===state.point?'accent':'muted'}>点 {i+1}：{data.weights[i].toFixed(2)} × {r.value.toFixed(3)} ≈ {data.contributions[i].toFixed(3)}</Typography></div>)}</div><div className="attn-read-summary"><Formula label="四点注意力汇聚" latex={String.raw`\textstyle c=\sum_{j=1}^{4}\alpha_jV(s_j)\approx${data.context.toFixed(3)}`}/><Button onClick={()=>{if(canAct())setState(initial);}}>重新读取</Button></div></footer>
 </ContentBlock>;
}
