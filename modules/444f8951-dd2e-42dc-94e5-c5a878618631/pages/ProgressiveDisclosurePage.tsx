import { useEffect, useRef, useState } from 'react';
import { Button, ContentBlock, Select, Typography } from "@shuku/course-style/react";
import { DesignComparisonHeader } from '../components/DesignComparisonHeader';
import { correlate, formatResponse, initialSettings, inputPattern, kernels, type Settings } from '../components/disclosure/convolutionExperiment';
import './ProgressiveDisclosurePage.css';

const controlText = (text: string) => <Typography shuku-edit-id="e-8b141488-3f36-463a-99f4-715a1e89bb68" as="span" variant="bodySmall" tone="inherit">{text}</Typography>;
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
  return <div shuku-edit-id="e-5bafb161-fda3-409e-9b31-e829c5369d63" className="cg-disclosure-choice"><Typography shuku-edit-id="e-f5075171-d380-4b05-a04a-ca91f42f1e99" variant="bodySmall" tone="muted">{label}</Typography><div shuku-edit-id="e-90415114-9faa-40e8-b5b2-ab441c27fb63" role="group" aria-label={label}>{options.map(item => <Button key={item.value} active={value === item.value} aria-pressed={value === item.value} onClick={() => onChange(item.value)}><Typography shuku-edit-id="e-305af3df-33b0-4f32-bc08-3524f0cc35d2" as="span" variant="bodySmall" tone="inherit">{item.label}</Typography></Button>)}</div></div>;
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
  return <div shuku-edit-id="e-0eee54bb-1f78-4086-85b6-e63a7c27594e" className="cg-disclosure-visual">
    <div shuku-edit-id="e-c8b7cad1-5260-4832-82dd-a9d2c6b74f41" className="cg-disclosure-flow">
      <div shuku-edit-id="e-6398a0d4-74db-4005-bb93-94f751cfa8e8" className="cg-disclosure-image"><Typography shuku-edit-id="e-dace9829-d53b-4384-ac1e-21e999c67389" variant="bodySmall" tone="inherit">{settings.padding ? '补零后 9×9' : '输入 7×7'}</Typography><svg shuku-edit-id="e-6b4b293d-554b-44d9-9dea-9fe0d91336d0" viewBox="0 0 210 210" role="img" aria-label={`输入图案，窗口位于第${row*settings.stride+1}行第${col*settings.stride+1}列`}>
        {Array.from({length:gridSize*gridSize},(_,i)=>{const r=Math.floor(i/gridSize),c=i%gridSize,padded=r<settings.padding||c<settings.padding||r>=7+settings.padding||c>=7+settings.padding;const value=padded?0:input[r-settings.padding][c-settings.padding];return <g shuku-edit-id="e-7bce3cd2-7ad7-4176-ab28-b10f329ccac7" key={i}><rect shuku-edit-id="e-e1a2a10f-3d8e-4e66-ac25-32f9e671781f" x={c*210/gridSize+.6} y={r*210/gridSize+.6} width={210/gridSize-1.2} height={210/gridSize-1.2} rx="1" fill={padded?'#f1f3f6':value?'#3280d9':'#d8eaff'} stroke={padded?'#d2d9e3':'none'} strokeDasharray={padded?'2 2':undefined}/><Typography shuku-edit-id="e-84d8e782-34f9-4386-b5af-de9415ff55da" as="text" variant="bodySmall" tone="inherit" x={(c+.5)*210/gridSize} y={(r+.5)*210/gridSize} textAnchor="middle" dominantBaseline="central" className={value?'cg-disclosure-digit is-one':'cg-disclosure-digit'}>{value}</Typography></g>;})}
        <rect shuku-edit-id="e-c6aeaec4-e2ef-4049-be05-00a5c434023e" x={col*settings.stride*210/gridSize+1.5} y={row*settings.stride*210/gridSize+1.5} width={3*210/gridSize-3} height={3*210/gridSize-3} fill="none" stroke="#175fed" strokeWidth="3" rx="3"/>
      </svg></div>
      <Typography shuku-edit-id="e-c9fb9b73-08bd-4c21-8475-19173b0fec52" as="span" className="cg-disclosure-flow-arrow" variant="h3" tone="light" aria-hidden="true">→</Typography>
      <div shuku-edit-id="e-2fb0a753-be11-47b8-b7d7-0b65e8fa8d26" className="cg-disclosure-kernel"><Typography shuku-edit-id="e-29212e48-7420-46d2-9ae8-85d3352a7c88" variant="bodySmall" tone="inherit">3×3 核</Typography><div shuku-edit-id="e-8a3424f5-3a1b-427a-ade4-730076dfb484" className="cg-disclosure-kernel-grid" role="img" aria-label={`卷积核权重：${kernels[settings.kernel].flat().map(v=>settings.kernel==='average'?'1/9':v).join('，')}`}>{kernels[settings.kernel].flat().map((v,i)=><div shuku-edit-id="e-8ed532ba-72a4-4f29-89d2-6c472e9f43e9" key={i}><Typography shuku-edit-id="e-61f86c79-7662-48f2-945c-c20857dd87e8" as="span" variant="bodySmall" tone="inherit">{settings.kernel==='average'?'¹⁄₉':v}</Typography></div>)}</div></div>
      <Typography shuku-edit-id="e-ebb45dfa-3941-4162-bc37-fa7601786ae9" as="span" className="cg-disclosure-flow-arrow" variant="h3" tone="light" aria-hidden="true">→</Typography>
      <div shuku-edit-id="e-2533bac2-a5eb-4cbe-b67d-f90eb44679b5" className="cg-disclosure-image"><Typography shuku-edit-id="e-8e857be7-7469-44e0-8451-d6f397b0ec55" variant="bodySmall" tone="inherit">输出 {size}×{size}</Typography><div shuku-edit-id="e-714da6b7-10c5-4bc3-b938-8930fafdf811" className="cg-disclosure-output" style={{gridTemplateColumns:`repeat(${size},minmax(0,1fr))`,gridTemplateRows:`repeat(${size},minmax(0,1fr))`}} role="group" aria-label="输出响应，点击格子查看对应窗口">{output.flat().map((v,i)=><button shuku-edit-id="e-9d68ed39-b0da-4c96-9ca1-2dfb1e2e9e2f" key={i} type="button" aria-label={`第${Math.floor(i/size)+1}行第${i%size+1}列，${i<=current?`响应${formatResponse(v)}`:'待计算'}`} aria-pressed={i===current} className={[i<=current?'is-computed':'',i===current?'is-selected':''].filter(Boolean).join(' ')} style={{background:i<=current?responseColor(v,settings):'#f5f7fb'}} onClick={()=>exp.select(i)}>{i<=current&&<svg shuku-edit-id="e-339c049e-ac8a-4000-a3c7-3080f8b60751" viewBox={Number.isInteger(v)?'0 0 44 44':'0 0 62 44'} aria-hidden="true"><Typography shuku-edit-id="e-06fc9ce1-cab6-4ad3-891e-9c52aaaa7ab6" as="text" variant="bodySmall" tone="inherit" x={Number.isInteger(v)?22:31} y="22" textAnchor="middle" dominantBaseline="central">{formatResponse(settings.response==='absolute'?Math.abs(v):v)}</Typography></svg>}</button>)}</div></div>
    </div>
    <div shuku-edit-id="e-6c846877-1a4a-4d33-9a5b-4a5a7df05c40" className="cg-disclosure-readout"><Typography shuku-edit-id="e-57c0bd0b-5ea3-429e-abb8-f77441f218a9" variant="bodySmall" tone="muted">{settings.response === 'absolute' ? '响应强度 =' : '相乘求和 ='} <Typography shuku-edit-id="e-2e5f4f56-de2d-484d-aa39-a825d5e22c6c" as="strong" variant="bodySmall" tone="accent">{formatResponse(settings.response === 'absolute'?Math.abs(value):value)}</Typography></Typography><div shuku-edit-id="e-d2981b5f-d679-48a5-ba33-bebe47d98b95" className="cg-disclosure-color-key" aria-hidden="true"><i shuku-edit-id="e-e834de67-ef15-4222-a48b-b7730cb05b9b" style={settings.response === 'absolute' ? {background:'#edf2f8'} : undefined}/><Typography shuku-edit-id="e-21683352-e1ec-4164-8a64-048095de7d90" as="span" variant="bodySmall" tone="muted">{settings.response === 'absolute'?'弱 → 强':'负 ← 0 → 正'}</Typography><i shuku-edit-id="e-c96763ce-bb20-4d3f-8717-11faa338c175"/></div></div>
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
  return <ContentBlock shuku-edit-id="e-951efd15-0952-4dc2-8b0f-db4c21a15b9f" ref={root} headingLevel={1} title="围绕学习问题，逐步展开操作" subtitle="同一个卷积实验台，让设置随学习过程按需展开。" className="cg-disclosure-page cg-creator-typography" onKeyDown={event=>{if(event.target instanceof Element && event.target.closest('button,input,select') && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End',' '].includes(event.key))event.stopPropagation();}}>
    <div shuku-edit-id="e-004dad58-acb7-4d17-8067-1e98336b6211" className="cg-disclosure-panels">
      <section shuku-edit-id="e-ac8447a3-0cba-4ba3-a09e-3599eeae8098" className="cg-disclosure-panel cg-disclosure-left cg-design-comparison-panel" aria-label="全部设置同时展示"><DesignComparisonHeader description="全部设置同时呈现"/><ConvolutionView exp={left}/><div shuku-edit-id="e-da4357c3-17c6-4a6a-ac15-9ad7d44c463e" className="cg-disclosure-settings"><KernelControl exp={left}/><SizeControls exp={left}/><ViewControls exp={left}/><Button variant="primary" onClick={left.toggle}><Typography shuku-edit-id="e-9bc8f5f8-fb54-41c3-aa93-3ff18cf0a63b" as="span" variant="bodySmall" tone="inherit">{left.finished?'重新扫描':left.playing?'暂停扫描':'继续扫描'}</Typography></Button></div></section>
      <section shuku-edit-id="e-dc7e6a12-1bb8-4a78-b0e0-f03cb773f09e" className="cg-disclosure-panel cg-disclosure-right cg-design-comparison-panel is-ours" aria-label="按问题逐步展开"><DesignComparisonHeader ours description="聚焦当前问题，按需展开"/><Typography shuku-edit-id="e-551ab84b-affe-46b5-b4d8-0ce27430324b" variant="bodySmall" tone="accent" className="cg-disclosure-question">卷积核怎样找到边缘？</Typography><ConvolutionView exp={right}/><div shuku-edit-id="e-f221e83c-1782-428c-bab8-bc40f3e27e4c" className="cg-disclosure-focused"><KernelControl exp={right}/><Button variant="primary" onClick={right.toggle}><Typography shuku-edit-id="e-45401fe9-9c5d-4165-80cf-35720dd622ce" as="span" variant="bodySmall" tone="inherit">{right.finished?'重新扫描':right.playing?'暂停扫描':'继续扫描'}</Typography></Button></div><div shuku-edit-id="e-833f22a9-7bbb-422b-a20f-e2d38577b7fe" className="cg-disclosure-more">
        <div shuku-edit-id="e-6d532a65-7aa2-410e-bae6-6db1c3e76b1b" className="cg-disclosure-extra"><Button className="cg-disclosure-expand" aria-expanded={expanded} aria-controls="cg-disclosure-more-settings" onClick={()=>setExpanded(value=>!value)}><Typography shuku-edit-id="e-e2aa42cb-0a7d-4f79-942a-698d0313d6e2" as="span" variant="bodySmall" tone="inherit">更多设置</Typography><Typography shuku-edit-id="e-7d34562d-ae2f-4513-bd32-f1ea69d95416" as="span" variant="bodySmall" tone="inherit" aria-hidden="true">{expanded?'⌃':'›'}</Typography></Button>{expanded&&<div shuku-edit-id="e-0eb3fb15-c584-49f2-ab0f-bfca302516ee" id="cg-disclosure-more-settings" className="cg-disclosure-extra-controls"><SizeControls exp={right}/><ViewControls exp={right}/></div>}</div>
      </div></section>
    </div>
  </ContentBlock>;
}
