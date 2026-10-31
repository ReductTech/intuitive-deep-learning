import {Button,MathFormulaBlock,MathFormulaStatic,Typography} from '../../../shared/react';
import {AttentionActivity,ChoiceButtons,useActivityState,type ActivityProps} from '../../components/AttentionActivity';
import {DeskVectorScene} from '../../components/DeskVectorScene';
import {deformableDemo,deformableValueReadout,type DeformableTarget} from '../../model/deformableDemo';
import './AttentionDeformableLessons.css';
function MathLine({latex,compact=false}:{latex:string;compact?:boolean}){return <MathFormulaBlock appearance="plain" className="attn-dfm-math">{compact?<Typography variant="bodySmall" tone="inherit"><MathFormulaStatic latex={latex}/></Typography>:<MathFormulaStatic latex={latex}/>}</MathFormulaBlock>;}
function Shelf({target='juice',samples=true,dense=false,windowMode,onTarget,selected,onSelect}:{target?:DeformableTarget;samples?:boolean;dense?:boolean;windowMode?:string;onTarget?:(t:DeformableTarget)=>void;selected?:number;onSelect?:(j:number)=>void}){
 const {reference:p,weights,samples:points,cell}=deformableDemo(target);
 return <div className="attn-dfm-scene"><DeskVectorScene roundTwo/><svg className="attn-dfm-overlay" viewBox="0 0 820 440" aria-hidden="true">
 {Array.from({length:9},(_,j)=><line key={'x'+j} x1={(j+1)*82} x2={(j+1)*82} y1="0" y2="440" stroke="var(--ui-accent)" opacity=".18"/>)}
 {Array.from({length:5},(_,j)=><line key={'y'+j} y1={(j+1)*440/6} y2={(j+1)*440/6} x1="0" x2="820" stroke="var(--ui-accent)" opacity=".18"/>)}
 <rect x={cell[0]*82} y={cell[1]*440/6} width="82" height={440/6} fill="var(--ui-accent)" fillOpacity=".12" stroke="var(--ui-accent)" strokeWidth="3"/>
 {samples&&!dense&&points.map(([x,y],j)=><g key={j}><line x1={p[0]*820} y1={p[1]*440} x2={x*820} y2={y*440} stroke="var(--ui-accent-alt)" strokeWidth={selected===j?5:3}/><circle cx={x*820} cy={y*440} r={12+weights[j]*22} fill="var(--ui-accent-alt)" stroke="white" strokeWidth="3"/></g>)}
 {dense&&Array.from({length:60},(_,j)=>{const x=(j%10+.5)*82,y=(Math.floor(j/10)+.5)*440/6;return <g key={j}><line x1={p[0]*820} y1={p[1]*440} x2={x} y2={y} stroke="var(--ui-accent)" strokeWidth="1" opacity=".24"/><circle cx={x} cy={y} r="5" fill="var(--ui-accent)" opacity=".65"/></g>})}
 {windowMode&&(()=>{const x0=windowMode==='shift'?Math.floor((cell[0]-1)/2)*2+1:Math.floor(cell[0]/2)*2,y0=windowMode==='shift'?Math.floor((cell[1]-1)/2)*2+1:Math.floor(cell[1]/2)*2;return <><rect x={x0*82} y={y0*440/6} width="164" height={2*440/6} fill="var(--ui-accent-alt)" fillOpacity=".12" stroke="var(--ui-accent-alt)" strokeWidth="4"/>{Array.from({length:4},(_,j)=>{const x=(x0+j%2+.5)*82,y=(y0+Math.floor(j/2)+.5)*440/6;return <g key={j}><line x1={p[0]*820} y1={p[1]*440} x2={x} y2={y} stroke="var(--ui-accent-alt)" strokeWidth="3"/><circle cx={x} cy={y} r="10" fill="var(--ui-accent-alt)"/></g>})}</>})()}
 <path d={`M${p[0]*820},${p[1]*440-12}l12,12 -12,12 -12,-12Z`} fill="var(--ui-accent)" stroke="white" strokeWidth="3"/>
 </svg>{onTarget&&(['water','juice'] as const).map(t=>{const a=deformableDemo(t);return <Button key={t} className="attn-dfm-query" active={t===target} aria-label={t==='water'?'选择冰水格点':'选择果汁格点'} onClick={()=>onTarget(t)} style={{left:`${a.reference[0]*100}%`,top:`${a.reference[1]*100}%`,width:'10%',height:`${100/6}%`}}/>})}
 {samples&&!dense&&points.map(([x,y],j)=>onSelect?<Button key={j} className="attn-dfm-dot" active={selected===j} aria-label={`采样点 ${j+1}`} onClick={()=>onSelect(j)} style={{left:`${x*100}%`,top:`${y*100}%`}}><Typography variant="bodySmall" tone="inherit">{j+1}</Typography></Button>:<Typography key={j} as="span" variant="bodySmall" tone="light" className="attn-dfm-dot-label" style={{left:`${x*100}%`,top:`${y*100}%`}}>{j+1}</Typography>)}
 </div>;
}
export function AttentionDeformablePage(props:ActivityProps){
 const [mode,setMode]=useActivityState('C28-global-window-v82','full');const full=mode==='full';
 const [visited,setVisited]=useActivityState<string[]>('C28-required-modes',[]);
 const done=['full','window','shift'].every(value=>visited.includes(value));
 return <AttentionActivity {...props} number={28} title="全局自注意力与窗口自注意力" done={done} footerHeight={110} footer={<><Typography variant="h3" tone="accent">全局自注意力覆盖全部位置；窗口自注意力限制在同一窗口</Typography><Typography variant="bodySmall" tone="muted">{done?'全局有 N² 个分数；固定窗口大小时，窗口内分数数量随位置数线性增长。':'依次选择全局、固定窗口和移位窗口，比较同一查询的读取范围。'}</Typography></>}>
 <div className="attn-dfm-main"><Shelf samples={false} dense={full} windowMode={full?undefined:mode}/><div className="attn-dfm-detail">
 <Typography variant="h3">小明拍货架：分割果汁盒</Typography><Typography variant="bodySmall" tone="muted">识别每个位置要读取哪些邻近信息？先比较计算范围。</Typography>
 <ChoiceButtons label="对比全位置与窗口" options={[{value:'full',label:'全局'},{value:'window',label:'固定窗口'},{value:'shift',label:'移位窗口'}]} value={mode} onChange={value=>{setMode(value);setVisited(previous=>[...new Set([...previous,value])]);}}/>
 <Typography variant="h3" tone="accent">{full?'查询与全部位置的键计算相似度':mode==='shift'?'移位窗口自注意力':'窗口自注意力'}</Typography>
 <Typography variant="body">{full?'建立全局联系；位置越多，注意力计算代价越大。':mode==='shift'?'相邻块交替采用常规与移位窗口划分，建立跨窗口联系。':'将特征图划分为不重叠窗口，在各窗口内计算自注意力。'}</Typography>
 <Typography variant="bodySmall" tone="muted">图示为空间特征图；窗口减少评分，移位建立跨窗口联系。</Typography>
 </div></div></AttentionActivity>;
}

const queryOptions=[{value:'water',label:'冰水格点 Q'},{value:'juice',label:'果汁格点 Q'}];
function QueryPicker({target,onChange}:{target:DeformableTarget;onChange:(t:DeformableTarget)=>void}){
 return <ChoiceButtons label="切换空间查询" options={queryOptions} value={target} onChange={value=>onChange(value as DeformableTarget)}/>;
}
export function AttentionDeformableSamplingPage(props:ActivityProps){
 const [mode,setMode]=useActivityState('C30-window-deform-v82','window');const deform=mode==='deform';
 const [target,setTarget]=useActivityState<DeformableTarget>('C30-query-review','juice',(v):v is DeformableTarget=>v==='water'||v==='juice');
 const [visited,setVisited]=useActivityState<string[]>('C30-required-modes',[]);
 const [queries,setQueries]=useActivityState<string[]>('C30-required-queries-review',[]);
 const data=deformableValueReadout(target);
 const changeTarget=(t:DeformableTarget)=>{setTarget(t);setQueries(v=>[...new Set([...v,t])]);};
 const done=['window','deform'].every(value=>visited.includes(value))&&queries.length>=2;
 return <AttentionActivity {...props} number={30} title="窗口注意力与可变形注意力" done={done} footerHeight={160} className="attn-dfm-sampling-page"
  learningFlow={<Typography variant="bodySmall" tone="muted">单头、单尺度 · 参数手设示意 · 两个查询读取同一张特征图</Typography>}
  footer={<><Typography variant="bodySmall" tone="accent">参考点 p 是所选格点中心；偏移以格为单位，除以宽、高后得到归一化坐标。</Typography><MathLine latex={deform?String.raw`\boldsymbol s_j=\boldsymbol p+\Delta\boldsymbol p_j\oslash(W,H)`:String.raw`j\in\mathcal W(p)`}/></>}>
  <div className="attn-dfm-main"><div className="attn-dfm-query-scene"><QueryPicker target={target} onChange={changeTarget}/><Shelf target={target} onTarget={changeTarget} samples={deform} windowMode={deform?undefined:'window'}/></div><div className="attn-dfm-detail">
   <ChoiceButtons label="比较位置选择" options={[{value:'window',label:'固定窗口'},{value:'deform',label:'可变形注意力'}]} value={mode} onChange={value=>{setMode(value);setVisited(previous=>[...new Set([...previous,value])]);}}/>
   <Typography variant="h3" tone="accent">{deform?'Q 预测偏移与读取比例':'位置决定窗口划分'}</Typography>
   <Typography variant="bodySmall">Q：所选格点的特征与位置编码。</Typography>
   {deform?<><MathLine compact latex={String.raw`p=(${data.reference[0].toFixed(2)},${data.reference[1].toFixed(2)}),\quad\Delta p_1=(${data.offsets[0][0].toFixed(2)},${data.offsets[0][1].toFixed(2)})`}/><MathLine latex={String.raw`s_1=(${data.samples[0][0].toFixed(3)},${data.samples[0][1].toFixed(3)})`}/><MathLine compact latex={String.raw`\alpha=\operatorname{softmax}(W_\alpha q+b_\alpha)`}/><Typography variant="bodySmall" tone="muted">切换 Q：参考点、偏移、采样位置和权重随之改变。</Typography></>:<><MathLine latex={String.raw`p=(${data.reference[0].toFixed(2)},${data.reference[1].toFixed(2)})`}/><Typography variant="bodySmall" tone="muted">同一窗口内计算 Q·K；相邻块交替使用常规与移位划分来建立跨窗口联系。</Typography></>}
  </div></div>
 </AttentionActivity>;
}
export function AttentionDeformableLearningPage(props:ActivityProps){
 const [selected,setSelected]=useActivityState('C32-point-v80',0,(v):v is number=>typeof v==='number'&&Number.isInteger(v)&&v>=0&&v<4);
 const [target,setTarget]=useActivityState<DeformableTarget>('C32-query-review','juice',(v):v is DeformableTarget=>v==='water'||v==='juice');
 const [visited,setVisited]=useActivityState<number[]>('C32-required-points',[]);
 const data=deformableValueReadout(target),read=data.reads[selected],weight=data.weights[selected],contribution=data.contributions[selected];
 const select=(value:number)=>{setSelected(value);setVisited(previous=>[...new Set([...previous,value])]);};
 const a=read.corners;
 return <AttentionActivity {...props} number={32} title="可变形注意力：采样与汇聚" done={visited.length>=2} footerHeight={200}
  learningFlow={<Typography variant="bodySmall" tone="muted">单头、单尺度、单通道 V · 参数手设示意 · 权重由 Q 直接预测，不逐点计算 Q·K</Typography>}
  footer={<><div className="attn-dfm-contributions">{data.contributions.map((value,j)=><Typography key={j} variant="bodySmall" tone={j===selected?'accent':'muted'}>点 {j+1}：{data.weights[j].toFixed(2)} × {data.reads[j].value.toFixed(3)} ≈ {value.toFixed(3)}</Typography>)}</div><MathLine latex={String.raw`c=\sum_j\alpha_jV(s_j)\approx${data.context.toFixed(3)}`}/></>}>
  <div className="attn-dfm-main attn-dfm-value-main"><div className="attn-dfm-query-scene"><QueryPicker target={target} onChange={setTarget}/><Shelf target={target} selected={selected} onSelect={select}/><Typography variant="bodySmall" tone="muted">点选采样点，看周围四格如何插值得到 V。</Typography></div>
   <div className="attn-dfm-numeric" data-sample-value={read.value} data-sample-weight={weight} data-sample-contribution={contribution} data-context={data.context}>
    <Typography variant="h3" tone="accent">点 {selected+1} · 双线性读取</Typography>
    <div className="attn-dfm-interpolation" role="img" aria-label={`局部2乘2的V网格，横向比例${read.u.toFixed(2)}，纵向比例${read.v.toFixed(2)}`}>
     <svg viewBox="0 0 480 208" preserveAspectRatio="none" aria-hidden="true"><path d="M80 34H400V174H80Z" fill="var(--ui-accent-soft)" stroke="var(--ui-border-strong)" strokeWidth="2"/><path d={`M${80+read.u*320} 34V174M80 ${34+read.v*140}H400`} stroke="var(--ui-accent-alt)" strokeDasharray="5 5"/><circle cx={80+read.u*320} cy={34+read.v*140} r="8" fill="var(--ui-accent-alt)"/></svg>
     {a.map((corner,j)=><div key={j} className={'attn-dfm-corner is-'+j}><Typography variant="bodySmall" align="center">{corner.value.toFixed(2)}</Typography></div>)}
    </div>
    <MathLine latex={String.raw`u=${read.u.toFixed(2)},\quad v=${read.v.toFixed(2)}`}/>
    <MathLine latex={String.raw`V_{\mathrm{top}}=${a[0].coefficient.toFixed(3)}\cdot${a[0].value.toFixed(2)}+${a[1].coefficient.toFixed(3)}\cdot${a[1].value.toFixed(2)}`}/>
    <MathLine latex={String.raw`V_{\mathrm{bottom}}=${a[2].coefficient.toFixed(3)}\cdot${a[2].value.toFixed(2)}+${a[3].coefficient.toFixed(3)}\cdot${a[3].value.toFixed(2)}`}/>
    <MathLine latex={String.raw`V(s_{${selected+1}})=V_{\mathrm{top}}+V_{\mathrm{bottom}}\approx${read.value.toFixed(3)}`}/>

   </div>
  </div>
 </AttentionActivity>;
}
