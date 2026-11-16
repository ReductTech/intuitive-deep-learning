import { useEffect, useRef, useState } from 'react';
import { Button, ContentBlock, Select, Typography } from "@shuku/course-style/react";
import { DesignComparisonHeader } from '../../DesignComparisonHeader';
import { correlate, formatResponse, initialSettings, inputPattern, kernels, type Settings } from '../components/disclosure/convolutionExperiment';
import './ProgressiveDisclosurePage.css';

const controlText = (text: string) => <Typography shuku-edit-id="e-f847f961-8a11-41a5-b7ec-b562a7f152ed" as="span" variant="bodySmall" tone="inherit">{text}</Typography>;
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
  return <div shuku-edit-id="e-38c95e70-46b3-4bc5-abd8-596f6da3f170" className="aipe-replay-cg-disclosure-choice"><Typography shuku-edit-id="e-d5e81c75-9388-4538-9253-97df7fda95ab" variant="bodySmall" tone="muted">{label}</Typography><div shuku-edit-id="e-fa9b240f-6a75-471d-b5a4-b3c47b4460e7" role="group" aria-label={label}>{options.map(item => <Button key={item.value} active={value === item.value} aria-pressed={value === item.value} onClick={() => onChange(item.value)}><Typography shuku-edit-id="e-7f7e97b1-daa1-44a8-b83d-8e25d29abc08" as="span" variant="bodySmall" tone="inherit">{item.label}</Typography></Button>)}</div></div>;
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
  return <div shuku-edit-id="e-b1958db4-356d-4f50-a6c6-4c8ae02a2cc3" className="aipe-replay-cg-disclosure-visual">
    <div shuku-edit-id="e-9e4bce0a-d593-4eb4-b3ee-105b59d80992" className="aipe-replay-cg-disclosure-flow">
      <div shuku-edit-id="e-852653ce-7b6a-4395-820c-3bae84598c24" className="aipe-replay-cg-disclosure-image"><Typography shuku-edit-id="e-4a08d6ef-96a9-4dc5-bd20-6e14628543ea" variant="bodySmall" tone="inherit">{settings.padding ? '补零后 9×9' : '输入 7×7'}</Typography><svg shuku-edit-id="e-07b3ac3b-af47-40fe-a0ac-77a42d062510" viewBox="0 0 210 210" role="img" aria-label={`输入图案，窗口位于第${row*settings.stride+1}行第${col*settings.stride+1}列`}>
        {Array.from({length:gridSize*gridSize},(_,i)=>{const r=Math.floor(i/gridSize),c=i%gridSize,padded=r<settings.padding||c<settings.padding||r>=7+settings.padding||c>=7+settings.padding;const value=padded?0:input[r-settings.padding][c-settings.padding];return <g shuku-edit-id="e-b30aa622-58e3-4e12-8f9d-12ab855de3c5" key={i}><rect shuku-edit-id="e-cb42843f-5bdc-4e3e-873f-a8c01ebf429d" x={c*210/gridSize+.6} y={r*210/gridSize+.6} width={210/gridSize-1.2} height={210/gridSize-1.2} rx="1" fill={padded?'#f1f3f6':value?'#3280d9':'#d8eaff'} stroke={padded?'#d2d9e3':'none'} strokeDasharray={padded?'2 2':undefined}/><Typography shuku-edit-id="e-9cd943ed-2709-4e51-985c-18ef04d8f8c1" as="text" variant="bodySmall" tone="inherit" x={(c+.5)*210/gridSize} y={(r+.5)*210/gridSize} textAnchor="middle" dominantBaseline="central" className={value?'aipe-replay-cg-disclosure-digit is-one':'aipe-replay-cg-disclosure-digit'}>{value}</Typography></g>;})}
        <rect shuku-edit-id="e-168b33a6-6186-4825-ac57-a2d67defe103" x={col*settings.stride*210/gridSize+1.5} y={row*settings.stride*210/gridSize+1.5} width={3*210/gridSize-3} height={3*210/gridSize-3} fill="none" stroke="#175fed" strokeWidth="3" rx="3"/>
      </svg></div>
      <Typography shuku-edit-id="e-1a84131e-63ee-4441-8353-e67ea675336a" as="span" className="aipe-replay-cg-disclosure-flow-arrow" variant="h3" tone="light" aria-hidden="true">→</Typography>
      <div shuku-edit-id="e-06d0273c-534a-48fa-a866-14a9d44616ac" className="aipe-replay-cg-disclosure-kernel"><Typography shuku-edit-id="e-8b970daa-1c5c-4361-93ea-4b7ae455521a" variant="bodySmall" tone="inherit">3×3 核</Typography><div shuku-edit-id="e-c75a8d6f-4149-4134-9a00-5a3db85a7a19" className="aipe-replay-cg-disclosure-kernel-grid" role="img" aria-label={`卷积核权重：${kernels[settings.kernel].flat().map(v=>settings.kernel==='average'?'1/9':v).join('，')}`}>{kernels[settings.kernel].flat().map((v,i)=><div shuku-edit-id="e-87709d77-76c5-493a-a6ad-3de03d8ccef3" key={i}><Typography shuku-edit-id="e-d01accc0-01c4-4afe-aabc-499630230cbe" as="span" variant="bodySmall" tone="inherit">{settings.kernel==='average'?'¹⁄₉':v}</Typography></div>)}</div></div>
      <Typography shuku-edit-id="e-0d697d77-1e45-40ff-8954-224885e230ca" as="span" className="aipe-replay-cg-disclosure-flow-arrow" variant="h3" tone="light" aria-hidden="true">→</Typography>
      <div shuku-edit-id="e-73af120e-587c-49b3-b3b6-b1df0df589f5" className="aipe-replay-cg-disclosure-image"><Typography shuku-edit-id="e-db1e0011-d589-4ee0-ba5f-29852b2fe8c5" variant="bodySmall" tone="inherit">输出 {size}×{size}</Typography><div shuku-edit-id="e-e5b6e94e-7cdb-42f4-ae74-3fc8419c8b4f" className="aipe-replay-cg-disclosure-output" style={{gridTemplateColumns:`repeat(${size},minmax(0,1fr))`,gridTemplateRows:`repeat(${size},minmax(0,1fr))`}} role="group" aria-label="输出响应，点击格子查看对应窗口">{output.flat().map((v,i)=><button shuku-edit-id="e-2beb7964-3cbe-4340-9352-817a62366b4d" key={i} type="button" aria-label={`第${Math.floor(i/size)+1}行第${i%size+1}列，${i<=current?`响应${formatResponse(v)}`:'待计算'}`} aria-pressed={i===current} className={[i<=current?'is-computed':'',i===current?'is-selected':''].filter(Boolean).join(' ')} style={{background:i<=current?responseColor(v,settings):'#f5f7fb'}} onClick={()=>exp.select(i)}>{i<=current&&<svg shuku-edit-id="e-f3928a5a-c61a-4fbd-8f76-8ef497b6b70e" viewBox={Number.isInteger(v)?'0 0 44 44':'0 0 62 44'} aria-hidden="true"><Typography shuku-edit-id="e-0340aa55-1a32-49a5-9340-f73aa7373f38" as="text" variant="bodySmall" tone="inherit" x={Number.isInteger(v)?22:31} y="22" textAnchor="middle" dominantBaseline="central">{formatResponse(settings.response==='absolute'?Math.abs(v):v)}</Typography></svg>}</button>)}</div></div>
    </div>
    <div shuku-edit-id="e-5ab3cedf-397e-4a7c-b94a-f1e486d19427" className="aipe-replay-cg-disclosure-readout"><Typography shuku-edit-id="e-90bdc05c-2bdb-42c5-9fe1-f263a7eabfca" variant="bodySmall" tone="muted">{settings.response === 'absolute' ? '响应强度 =' : '相乘求和 ='} <Typography shuku-edit-id="e-ee6c2ca2-04c6-4e74-afac-e8321bb71983" as="strong" variant="bodySmall" tone="accent">{formatResponse(settings.response === 'absolute'?Math.abs(value):value)}</Typography></Typography><div shuku-edit-id="e-38bd0486-8fb4-4719-883b-217fe08030c8" className="aipe-replay-cg-disclosure-color-key" aria-hidden="true"><i shuku-edit-id="e-2cb5ffa9-5b72-43f5-a6c2-a713d1e59f91" style={settings.response === 'absolute' ? {background:'#edf2f8'} : undefined}/><Typography shuku-edit-id="e-ff554e80-6f21-478d-a0b1-12a50e3043de" as="span" variant="bodySmall" tone="muted">{settings.response === 'absolute'?'弱 → 强':'负 ← 0 → 正'}</Typography><i shuku-edit-id="e-530d7a8f-8dcb-4665-b011-cfdef1d4aa36"/></div></div>
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
  return <ContentBlock shuku-edit-id="e-06644ce0-d800-4e5b-8358-54714ffe1807" ref={root} headingLevel={1} title="围绕学习问题，逐步展开操作" subtitle="同一个卷积实验台，让设置随学习过程按需展开。" className="aipe-replay-cg-disclosure-page aipe-replay-cg-creator-typography" onKeyDown={event=>{if(event.target instanceof Element && event.target.closest('button,input,select') && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End',' '].includes(event.key))event.stopPropagation();}}>
    <div shuku-edit-id="e-03d0c71b-be1b-40ce-aa7f-09fdc1c8255b" className="aipe-replay-cg-disclosure-panels">
      <section shuku-edit-id="e-363df013-aa00-4d74-8393-c7115ee60654" className="aipe-replay-cg-disclosure-panel aipe-replay-cg-disclosure-left aipe-design-comparison-panel" aria-label="全部设置同时展示"><DesignComparisonHeader description="全部设置同时呈现"/><ConvolutionView exp={left}/><div shuku-edit-id="e-c1949295-1654-4534-aec0-497cf7b8e912" className="aipe-replay-cg-disclosure-settings"><KernelControl exp={left}/><SizeControls exp={left}/><ViewControls exp={left}/><Button variant="primary" onClick={left.toggle}><Typography shuku-edit-id="e-fc11e0a8-1864-47fa-89fc-4330d60e3edf" as="span" variant="bodySmall" tone="inherit">{left.finished?'重新扫描':left.playing?'暂停扫描':'继续扫描'}</Typography></Button></div></section>
      <section shuku-edit-id="e-819fbcac-a395-4305-8ee5-21794041e435" className="aipe-replay-cg-disclosure-panel aipe-replay-cg-disclosure-right aipe-design-comparison-panel is-ours" aria-label="按问题逐步展开"><DesignComparisonHeader ours description="聚焦当前问题，按需展开"/><Typography shuku-edit-id="e-06d6f664-a022-41c2-9e63-a7f2e1df82e9" variant="bodySmall" tone="accent" className="aipe-replay-cg-disclosure-question">卷积核怎样找到边缘？</Typography><ConvolutionView exp={right}/><div shuku-edit-id="e-3799acaa-375f-418c-b415-1f3880ba44af" className="aipe-replay-cg-disclosure-focused"><KernelControl exp={right}/><Button variant="primary" onClick={right.toggle}><Typography shuku-edit-id="e-a32696f5-0112-4d46-b0a9-e65fda9481a3" as="span" variant="bodySmall" tone="inherit">{right.finished?'重新扫描':right.playing?'暂停扫描':'继续扫描'}</Typography></Button></div><div shuku-edit-id="e-79349634-3097-43cd-8f7a-2448a273f067" className="aipe-replay-cg-disclosure-more">
        <div shuku-edit-id="e-77d81647-c46c-42c9-bf05-9bdb9be96ea5" className="aipe-replay-cg-disclosure-extra"><Button className="aipe-replay-cg-disclosure-expand" aria-expanded={expanded} aria-controls="aipe-replay-cg-disclosure-more-settings" onClick={()=>setExpanded(value=>!value)}><Typography shuku-edit-id="e-96a037fb-28e5-44eb-aa43-e52ddfb8905a" as="span" variant="bodySmall" tone="inherit">更多设置</Typography><Typography shuku-edit-id="e-c56b607e-d9d2-41fe-9c2e-30c6f52d0d81" as="span" variant="bodySmall" tone="inherit" aria-hidden="true">{expanded?'⌃':'›'}</Typography></Button>{expanded&&<div shuku-edit-id="e-f9211de6-4060-4e22-a929-ae06044c2011" id="aipe-replay-cg-disclosure-more-settings" className="aipe-replay-cg-disclosure-extra-controls"><SizeControls exp={right}/><ViewControls exp={right}/></div>}</div>
      </div></section>
    </div>
  </ContentBlock>;
}
