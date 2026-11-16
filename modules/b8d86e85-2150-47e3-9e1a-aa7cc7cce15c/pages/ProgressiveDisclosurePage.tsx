import { useEffect, useRef, useState } from 'react';
import { Button, Select, Typography } from "@shuku/course-style/react";
import { correlate, formatResponse, initialSettings, inputPattern, kernels, type Settings } from '../components/disclosure/convolutionExperiment';
import './ProgressiveDisclosurePage.css';

const controlText = (text: string) => <Typography shuku-edit-id="e-1b3b73d8-8d92-4e5c-873c-2d3e4fbe05d3" as="span" variant="bodySmall" tone="inherit">{text}</Typography>;
const kernelOptions = [{value:'vertical',label:controlText('竖直边缘')},{value:'horizontal',label:controlText('水平边缘')},{value:'average',label:controlText('均值平滑')}];
function useExperiment(active: boolean) {
  const [settings,setSettings] = useState<Settings>({...initialSettings});
  const [position,setPosition] = useState(0);
  const [playing,setPlaying] = useState(true);
  const output = correlate(settings), size = output.length;
  const current = Math.min(position,size*size-1);
  useEffect(() => {
    if (!active || !playing) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (current === size*size-1) { setPlaying(false); return; }
    const timer = window.setTimeout(() => setPosition(value => Math.min(value+1,size*size-1)), reduced ? 900 : 130);
    return () => window.clearTimeout(timer);
  }, [active,playing,current,size]);
  const change = <K extends keyof Settings>(key: K, value: Settings[K]) => { setSettings(current => ({...current,[key]:value})); setPosition(0); setPlaying(true); };
  const select = (position: number) => { setPosition(position); setPlaying(false); };
  return {settings, output, current, change, select, playing, finished: current === size*size-1, toggle: () => { if (current === size*size-1) { setPosition(0); setPlaying(true); } else setPlaying(value => !value); }};
}
type Experiment = ReturnType<typeof useExperiment>;
function Choice({label,value,options,onChange}:{label:string;value:number;options:{value:number;label:string}[];onChange:(value:number)=>void}) {
  return <div shuku-edit-id="e-2c142d5c-51ee-4894-bc4a-4cac674c4d0f" className="cg-disclosure-choice"><Typography shuku-edit-id="e-11244f70-563f-4aa2-894f-2a2fbe0e6c7b" variant="bodySmall" tone="muted">{label}</Typography><div shuku-edit-id="e-35bf7f76-ed95-45d1-a7af-2e1a9baa41a4" role="group" aria-label={label}>{options.map(item => <Button key={item.value} active={value === item.value} aria-pressed={value === item.value} onClick={() => onChange(item.value)}><Typography shuku-edit-id="e-6d3c0e5a-5bbd-4544-94f0-17bed6f518c9" as="span" variant="bodySmall" tone="inherit">{item.label}</Typography></Button>)}</div></div>;
}
function KernelControl({exp}:{exp:Experiment}) { return <Select label="卷积核" value={exp.settings.kernel} options={kernelOptions} onChange={value=>exp.change('kernel',value as Settings['kernel'])}/>; }
function SizeControls({exp}:{exp:Experiment}) { return <><Choice label="步长" value={exp.settings.stride} options={[{value:1,label:'1'},{value:2,label:'2'}]} onChange={v=>exp.change('stride',v as 1|2)}/><Choice label="补零层数" value={exp.settings.padding} options={[{value:0,label:'0'},{value:1,label:'1'}]} onChange={v=>exp.change('padding',v as 0|1)}/></>; }
function ViewControls({exp}:{exp:Experiment}) { return <><Select label="输入图案" value={exp.settings.pattern} options={[{value:'vertical',label:controlText('竖直分界')},{value:'horizontal',label:controlText('水平分界')},{value:'corner',label:controlText('转角')}]} onChange={v=>exp.change('pattern',v as Settings['pattern'])}/><Select label="响应显示" value={exp.settings.response} options={[{value:'signed',label:controlText('保留正负')},{value:'absolute',label:controlText('只看强度')}]} onChange={v=>exp.change('response',v as Settings['response'])}/></>; }
function responseColor(raw:number,settings:Settings) {
  const value=settings.response === 'absolute' ? Math.abs(raw) : raw;
  const strength=Math.min(1,Math.abs(value)/(settings.kernel === 'average' ? 1 : 3));
  if(strength < .001) return '#edf2f8';
  const end=value>0?[246,146,65]:[53,126,226],start=[239,244,251];
  return `rgb(${start.map((v,i)=>Math.round(v+(end[i]-v)*strength)).join(',')})`;
}
function ConvolutionView({exp}:{exp:Experiment}) {
  const {settings,output,current}=exp, size=output.length, row=Math.floor(current/size),col=current%size;
  const input=inputPattern(settings.pattern), gridSize=7+settings.padding*2;
  const value=output[row][col];
  return <div shuku-edit-id="e-b6ef0cb0-ff32-4ed2-8c7f-a9261bbf94ce" className="cg-disclosure-visual">
    <div shuku-edit-id="e-6e1964c7-0450-48a3-9c90-c9133d1dce38" className="cg-disclosure-flow">
      <div shuku-edit-id="e-bcb144a2-9745-4f2d-9286-598252bb2224" className="cg-disclosure-image"><Typography shuku-edit-id="e-20c05702-81c2-41a9-bc63-88922b35fd0e" variant="bodySmall" tone="inherit">{settings.padding ? '补零后 9×9' : '输入 7×7'}</Typography><svg shuku-edit-id="e-955fca64-2d40-4e74-a46c-d1f11ecfda7b" viewBox="0 0 210 210" role="img" aria-label={`输入图案，窗口位于第${row*settings.stride+1}行第${col*settings.stride+1}列`}>
        {Array.from({length:gridSize*gridSize},(_,i)=>{const r=Math.floor(i/gridSize),c=i%gridSize,padded=r<settings.padding||c<settings.padding||r>=7+settings.padding||c>=7+settings.padding;const value=padded?0:input[r-settings.padding][c-settings.padding];return <g shuku-edit-id="e-44266764-6b6f-4cca-a3bf-2c28c6628994" key={i}><rect shuku-edit-id="e-39851677-bb94-416c-9baf-4bbf76ee0c3d" x={c*210/gridSize+.6} y={r*210/gridSize+.6} width={210/gridSize-1.2} height={210/gridSize-1.2} rx="1" fill={padded?'#f1f3f6':value?'#3280d9':'#d8eaff'} stroke={padded?'#d2d9e3':'none'} strokeDasharray={padded?'2 2':undefined}/><Typography shuku-edit-id="e-08c3fd8c-6e74-411f-9e84-3352549771a0" as="text" variant="bodySmall" tone="inherit" x={(c+.5)*210/gridSize} y={(r+.5)*210/gridSize} textAnchor="middle" dominantBaseline="central" className={value?'cg-disclosure-digit is-one':'cg-disclosure-digit'}>{value}</Typography></g>;})}
        <rect shuku-edit-id="e-3b6e1d4a-fbc5-4dc0-b588-ab1d878cd732" x={col*settings.stride*210/gridSize+1.5} y={row*settings.stride*210/gridSize+1.5} width={3*210/gridSize-3} height={3*210/gridSize-3} fill="none" stroke="#175fed" strokeWidth="3" rx="3"/>
      </svg></div>
      <Typography shuku-edit-id="e-06c335c2-d375-4427-bed4-703bcef993b5" as="span" className="cg-disclosure-flow-arrow" variant="h3" tone="light" aria-hidden="true">→</Typography>
      <div shuku-edit-id="e-744f9c0b-7186-4ef8-813b-caaae8e9b618" className="cg-disclosure-kernel"><Typography shuku-edit-id="e-67b19212-da95-41e4-b06c-f699ad397789" variant="bodySmall" tone="inherit">3×3 核</Typography><div shuku-edit-id="e-6b7269a6-0217-4a2f-81e4-e36d2fce6697" className="cg-disclosure-kernel-grid" role="img" aria-label={`卷积核权重：${kernels[settings.kernel].flat().map(v=>settings.kernel==='average'?'1/9':v).join('，')}`}>{kernels[settings.kernel].flat().map((v,i)=><div shuku-edit-id="e-1ab56ae1-19d8-48d9-8ca0-2ad8084deefa" key={i}><Typography shuku-edit-id="e-4e44241f-e27b-491f-990a-29cef4b328a2" as="span" variant="bodySmall" tone="inherit">{settings.kernel==='average'?'¹⁄₉':v}</Typography></div>)}</div></div>
      <Typography shuku-edit-id="e-847a6dfd-f9b9-4495-b70c-257fb8662a74" as="span" className="cg-disclosure-flow-arrow" variant="h3" tone="light" aria-hidden="true">→</Typography>
      <div shuku-edit-id="e-c2144eec-89f7-4ca9-89ee-978e6ff74621" className="cg-disclosure-image"><Typography shuku-edit-id="e-df2c9398-573a-4f46-bf06-95ed86e30313" variant="bodySmall" tone="inherit">输出 {size}×{size}</Typography><div shuku-edit-id="e-27e82d60-8ffa-4577-9752-44fd9204b0c1" className="cg-disclosure-output" style={{gridTemplateColumns:`repeat(${size},minmax(0,1fr))`,gridTemplateRows:`repeat(${size},minmax(0,1fr))`}} role="group" aria-label="输出响应，点击格子查看对应窗口">{output.flat().map((v,i)=><button shuku-edit-id="e-675607ec-3e41-46b1-9eaf-5a16024f77b6" key={i} type="button" aria-label={`第${Math.floor(i/size)+1}行第${i%size+1}列，${i<=current?`响应${formatResponse(v)}`:'待计算'}`} aria-pressed={i===current} className={[i<=current?'is-computed':'',i===current?'is-selected':''].filter(Boolean).join(' ')} style={{background:i<=current?responseColor(v,settings):'#f5f7fb'}} onClick={()=>exp.select(i)}>{i<=current&&<svg shuku-edit-id="e-9abf4516-464b-4785-b3de-d61e02534964" viewBox={Number.isInteger(v)?'0 0 44 44':'0 0 62 44'} aria-hidden="true"><Typography shuku-edit-id="e-95f854c3-cc56-420f-8150-601e65202b35" as="text" variant="bodySmall" tone="inherit" x={Number.isInteger(v)?22:31} y="22" textAnchor="middle" dominantBaseline="central">{formatResponse(settings.response==='absolute'?Math.abs(v):v)}</Typography></svg>}</button>)}</div></div>
    </div>
    <div shuku-edit-id="e-d7dc4b1c-ebda-4a4c-a001-c10ff5a7b0d1" className="cg-disclosure-readout"><Typography shuku-edit-id="e-17542f24-6dc9-4a30-9cd7-7ff82cde3292" variant="bodySmall" tone="muted">{settings.response === 'absolute' ? '响应强度 =' : '相乘求和 ='} <Typography shuku-edit-id="e-62961d21-568b-4a37-8252-1603797a1fff" as="strong" variant="bodySmall" tone="accent">{formatResponse(settings.response === 'absolute'?Math.abs(value):value)}</Typography></Typography><div shuku-edit-id="e-f20dae4f-91d3-4453-8f6b-4c9caef73744" className="cg-disclosure-color-key" aria-hidden="true"><i shuku-edit-id="e-36b8ab1d-cead-4b40-a4f7-b1bb52397a04" style={settings.response === 'absolute' ? {background:'#edf2f8'} : undefined}/><Typography shuku-edit-id="e-4ef2e44e-0fcd-4880-852f-785fb509740c" as="span" variant="bodySmall" tone="muted">{settings.response === 'absolute'?'弱 → 强':'负 ← 0 → 正'}</Typography><i shuku-edit-id="e-2e55f359-b0ae-45ee-bbc0-f8333e9a9ee4"/></div></div>
  </div>;
}
export function ProgressiveDisclosurePage() {
  const root=useRef<HTMLElement>(null);
  const [visible,setVisible]=useState(false);
  const [pageVisible,setPageVisible]=useState(() => !document.hidden);
  useEffect(() => {
    if (!root.current) return;
    const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting),{threshold:.2});
    observer.observe(root.current);
    const visibility=()=>setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange',visibility);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange',visibility); };
  }, []);
  const left=useExperiment(visible && pageVisible),right=useExperiment(visible && pageVisible);
  const [expanded,setExpanded]=useState(false);
  return <article shuku-edit-id="e-fdabd984-f52a-4c72-9897-c968d8811df0" ref={root} className="cg-disclosure-page cg-creator-typography" aria-labelledby="cg-disclosure-title" onKeyDown={event=>{if(event.target instanceof Element && event.target.closest('button,input,select') && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End',' '].includes(event.key))event.stopPropagation();}}>
    <header shuku-edit-id="e-54cddebe-caff-4263-a88e-ca5aac1042bf"><Typography shuku-edit-id="e-6f88d448-6782-4472-81b1-0dedb8390562" as="h1" variant="display" tone="inherit" id="cg-disclosure-title">渐进式披露，克制才是高级</Typography><Typography shuku-edit-id="e-97f561f8-bfe6-4580-b673-58673b074e0d" variant="body" tone="muted">同一个卷积实验台，让操作随着学习问题逐步展开。</Typography></header>
    <div shuku-edit-id="e-1e4cd8bd-a47a-4dfc-bc9b-59fa7c7c3d33" className="cg-disclosure-panels">
      <section shuku-edit-id="e-d7a788f6-dee1-48e5-8e5a-daf3f651654a" className="cg-disclosure-panel cg-disclosure-left" aria-label="全部设置同时展示"><Typography shuku-edit-id="e-f5925992-ae98-4354-a929-b6fe04afce38" as="h2" variant="h3" tone="inherit">设置全部展开，从哪里开始？</Typography><ConvolutionView exp={left}/><div shuku-edit-id="e-7986aa13-c14f-4380-80da-0a9cb8c1c8e7" className="cg-disclosure-settings"><KernelControl exp={left}/><SizeControls exp={left}/><ViewControls exp={left}/></div><div shuku-edit-id="e-0822b9e5-287f-44a3-9def-d362122ea931" className="cg-disclosure-left-actions"><Typography shuku-edit-id="e-156faf3d-2990-476c-b0f1-8d35fb9f8b2b" variant="bodySmall" tone="inherit" className="cg-disclosure-thought">我该先调哪个？</Typography><Button variant="primary" onClick={left.toggle}><Typography shuku-edit-id="e-b395aa5e-fa9b-473c-9876-83172dcf5802" as="span" variant="bodySmall" tone="inherit">{left.finished?'重新扫描':left.playing?'暂停扫描':'继续扫描'}</Typography></Button></div></section>
      <section shuku-edit-id="e-7d69f70a-a64a-4f13-a22d-a267425b6cec" className="cg-disclosure-panel cg-disclosure-right" aria-label="按问题逐步展开"><Typography shuku-edit-id="e-c9b404fb-3af8-4375-bcd8-6bb663c901d1" as="h2" variant="h3" tone="inherit">先围绕一个问题，组织操作</Typography><Typography shuku-edit-id="e-a6d2bdcf-ae88-41ae-8bbd-7cdcf97ae845" variant="body" tone="accent" className="cg-disclosure-question">卷积核怎样找到边缘？</Typography><ConvolutionView exp={right}/><div shuku-edit-id="e-078bf3e9-d168-450d-bb4e-2dfc39f6bf99" className="cg-disclosure-focused"><KernelControl exp={right}/><Button variant="primary" onClick={right.toggle}><Typography shuku-edit-id="e-1b744d0e-88d2-472f-b4f9-5f9d6bb8de94" as="span" variant="bodySmall" tone="inherit">{right.finished?'重新扫描':right.playing?'暂停扫描':'继续扫描'}</Typography></Button></div><div shuku-edit-id="e-02355074-0086-4bb9-ad03-96500b38941c" className="cg-disclosure-more">
        <div shuku-edit-id="e-598cffb0-d8ac-4406-8d6d-a4a65a36c8ed" className="cg-disclosure-extra"><Button className="cg-disclosure-expand" aria-expanded={expanded} aria-controls="cg-disclosure-more-settings" onClick={()=>setExpanded(value=>!value)}><Typography shuku-edit-id="e-8cd2ca65-a78e-4e68-afaf-b185dca92b90" as="span" variant="bodySmall" tone="inherit">更多设置</Typography><Typography shuku-edit-id="e-3ed4fced-14b4-4c08-8913-9537039937c7" as="span" variant="bodySmall" tone="inherit" aria-hidden="true">{expanded?'⌃':'›'}</Typography></Button>{expanded&&<div shuku-edit-id="e-c9362507-38f7-4565-836f-dae613fe3bff" id="cg-disclosure-more-settings" className="cg-disclosure-extra-controls"><SizeControls exp={right}/><ViewControls exp={right}/></div>}</div>
      </div></section>
    </div>
    <footer shuku-edit-id="e-2aba8bb5-e281-4f9c-8b70-0ff5e347f37d"><Typography shuku-edit-id="e-001619f5-0589-498d-9071-e8ba8cdbc3f8" variant="h3" tone="inherit">先回答眼前的问题，再展开下一层复杂度。</Typography></footer>
  </article>;
}
