import { useEffect, useRef, useState } from 'react';
import { Button, ContentBlock, Select, Typography } from "@shuku/course-style/react";
import { DesignComparisonHeader } from '../../DesignComparisonHeader';
import { correlate, formatResponse, initialSettings, inputPattern, kernels, type Settings } from '../components/disclosure/convolutionExperiment';
import './ProgressiveDisclosurePage.css';

const controlText = (text: string) => <Typography shuku-edit-id="e-82822e7e-95f2-4303-9206-4197d0e30e82" as="span" variant="bodySmall" tone="inherit">{text}</Typography>;
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
  return <div shuku-edit-id="e-7db7483f-431e-4f63-ad51-3688b724940a" className="aipe-replay-cg-disclosure-choice"><Typography shuku-edit-id="e-34f83257-ae4b-4674-befa-593cc7360816" variant="bodySmall" tone="muted">{label}</Typography><div shuku-edit-id="e-fdea6181-a291-4b29-8ab9-cb692f662b7a" role="group" aria-label={label}>{options.map(item => <Button key={item.value} active={value === item.value} aria-pressed={value === item.value} onClick={() => onChange(item.value)}><Typography shuku-edit-id="e-6a17d9a9-f815-49a5-89fb-a7519256c017" as="span" variant="bodySmall" tone="inherit">{item.label}</Typography></Button>)}</div></div>;
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
  return <div shuku-edit-id="e-1ca6ff96-933d-4a85-836e-722f70043d73" className="aipe-replay-cg-disclosure-visual">
    <div shuku-edit-id="e-78e6ea74-7717-4066-ac22-ddd5106dd54a" className="aipe-replay-cg-disclosure-flow">
      <div shuku-edit-id="e-a8ef4dae-f08b-4cdc-8a22-abd543357582" className="aipe-replay-cg-disclosure-image"><Typography shuku-edit-id="e-194d2386-1807-485f-a79c-2a8b3ae64cb2" variant="bodySmall" tone="inherit">{settings.padding ? '补零后 9×9' : '输入 7×7'}</Typography><svg shuku-edit-id="e-4e2efa36-dcfd-401f-930c-4b3834303851" viewBox="0 0 210 210" role="img" aria-label={`输入图案，窗口位于第${row*settings.stride+1}行第${col*settings.stride+1}列`}>
        {Array.from({length:gridSize*gridSize},(_,i)=>{const r=Math.floor(i/gridSize),c=i%gridSize,padded=r<settings.padding||c<settings.padding||r>=7+settings.padding||c>=7+settings.padding;const value=padded?0:input[r-settings.padding][c-settings.padding];return <g shuku-edit-id="e-d89dfc1d-b19b-4a7c-bd4f-63e3dcd1ec68" key={i}><rect shuku-edit-id="e-08e1efe9-5f66-4692-b927-2a83b0158e9f" x={c*210/gridSize+.6} y={r*210/gridSize+.6} width={210/gridSize-1.2} height={210/gridSize-1.2} rx="1" fill={padded?'#f1f3f6':value?'#3280d9':'#d8eaff'} stroke={padded?'#d2d9e3':'none'} strokeDasharray={padded?'2 2':undefined}/><Typography shuku-edit-id="e-617618d2-7861-4269-9b7a-cd239a6ad20e" as="text" variant="bodySmall" tone="inherit" x={(c+.5)*210/gridSize} y={(r+.5)*210/gridSize} textAnchor="middle" dominantBaseline="central" className={value?'aipe-replay-cg-disclosure-digit is-one':'aipe-replay-cg-disclosure-digit'}>{value}</Typography></g>;})}
        <rect shuku-edit-id="e-dd63677a-b054-4178-af20-5e68d4269f38" x={col*settings.stride*210/gridSize+1.5} y={row*settings.stride*210/gridSize+1.5} width={3*210/gridSize-3} height={3*210/gridSize-3} fill="none" stroke="#175fed" strokeWidth="3" rx="3"/>
      </svg></div>
      <Typography shuku-edit-id="e-2d73f263-8ed6-4c25-879c-7041fb6fdfef" as="span" className="aipe-replay-cg-disclosure-flow-arrow" variant="h3" tone="light" aria-hidden="true">→</Typography>
      <div shuku-edit-id="e-526f4768-e5a8-49ae-8044-36de22516421" className="aipe-replay-cg-disclosure-kernel"><Typography shuku-edit-id="e-8cf5055f-9b19-493b-8452-ae8b7107897e" variant="bodySmall" tone="inherit">3×3 核</Typography><div shuku-edit-id="e-99308f8a-e449-4571-9ae4-21b0994af17e" className="aipe-replay-cg-disclosure-kernel-grid" role="img" aria-label={`卷积核权重：${kernels[settings.kernel].flat().map(v=>settings.kernel==='average'?'1/9':v).join('，')}`}>{kernels[settings.kernel].flat().map((v,i)=><div shuku-edit-id="e-bc574724-6fd3-4a5a-b0d6-e3041488fb1e" key={i}><Typography shuku-edit-id="e-fed77bf2-a18e-4962-b43c-3489ba9ff2ce" as="span" variant="bodySmall" tone="inherit">{settings.kernel==='average'?'¹⁄₉':v}</Typography></div>)}</div></div>
      <Typography shuku-edit-id="e-ca974a88-716b-48da-baad-64a2093cca66" as="span" className="aipe-replay-cg-disclosure-flow-arrow" variant="h3" tone="light" aria-hidden="true">→</Typography>
      <div shuku-edit-id="e-48db440c-0ca1-4003-bfce-b20bb9b8f534" className="aipe-replay-cg-disclosure-image"><Typography shuku-edit-id="e-46aa2c03-b862-4b07-b96d-162bb25dff1d" variant="bodySmall" tone="inherit">输出 {size}×{size}</Typography><div shuku-edit-id="e-16ffe56b-0716-4a8f-bcdf-afbe4e2fc1a8" className="aipe-replay-cg-disclosure-output" style={{gridTemplateColumns:`repeat(${size},minmax(0,1fr))`,gridTemplateRows:`repeat(${size},minmax(0,1fr))`}} role="group" aria-label="输出响应，点击格子查看对应窗口">{output.flat().map((v,i)=><button shuku-edit-id="e-13691487-89a8-4813-a22a-c4615215024c" key={i} type="button" aria-label={`第${Math.floor(i/size)+1}行第${i%size+1}列，${i<=current?`响应${formatResponse(v)}`:'待计算'}`} aria-pressed={i===current} className={[i<=current?'is-computed':'',i===current?'is-selected':''].filter(Boolean).join(' ')} style={{background:i<=current?responseColor(v,settings):'#f5f7fb'}} onClick={()=>exp.select(i)}>{i<=current&&<svg shuku-edit-id="e-4cb1ccc9-2466-42cc-ac00-86743b75a219" viewBox={Number.isInteger(v)?'0 0 44 44':'0 0 62 44'} aria-hidden="true"><Typography shuku-edit-id="e-8ac7dc39-aa56-42ca-a144-a36d2ece5d74" as="text" variant="bodySmall" tone="inherit" x={Number.isInteger(v)?22:31} y="22" textAnchor="middle" dominantBaseline="central">{formatResponse(settings.response==='absolute'?Math.abs(v):v)}</Typography></svg>}</button>)}</div></div>
    </div>
    <div shuku-edit-id="e-595d8c41-ba0a-4128-9c92-5037feae1059" className="aipe-replay-cg-disclosure-readout"><Typography shuku-edit-id="e-ff46c806-4d89-4e2a-a96b-13e644465257" variant="bodySmall" tone="muted">{settings.response === 'absolute' ? '响应强度 =' : '相乘求和 ='} <Typography shuku-edit-id="e-2df0a2e2-8d80-4d47-835b-9ac87da3efd6" as="strong" variant="bodySmall" tone="accent">{formatResponse(settings.response === 'absolute'?Math.abs(value):value)}</Typography></Typography><div shuku-edit-id="e-3e0b50a5-31c9-4ea5-9244-2171d511c851" className="aipe-replay-cg-disclosure-color-key" aria-hidden="true"><i shuku-edit-id="e-63432cec-bd59-43c1-96d8-d0620755d288" style={settings.response === 'absolute' ? {background:'#edf2f8'} : undefined}/><Typography shuku-edit-id="e-79f3a722-a27a-4866-8512-99987194c1ea" as="span" variant="bodySmall" tone="muted">{settings.response === 'absolute'?'弱 → 强':'负 ← 0 → 正'}</Typography><i shuku-edit-id="e-6168ca94-ed1b-4728-954b-9c8721d50e6b"/></div></div>
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
  return <ContentBlock shuku-edit-id="e-bf98c1cc-6ca7-4111-8da9-fd4a6ab36f47" ref={root} headingLevel={1} title="围绕学习问题，逐步展开操作" subtitle="同一个卷积实验台，让设置随学习过程按需展开。" className="aipe-replay-cg-disclosure-page aipe-replay-cg-creator-typography" onKeyDown={event=>{if(event.target instanceof Element && event.target.closest('button,input,select') && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End',' '].includes(event.key))event.stopPropagation();}}>
    <div shuku-edit-id="e-c022fd39-f0fa-420e-9f49-7db663c7f832" className="aipe-replay-cg-disclosure-panels">
      <section shuku-edit-id="e-4fa09b14-ebb9-4c66-a915-f44252f87992" className="aipe-replay-cg-disclosure-panel aipe-replay-cg-disclosure-left aipe-design-comparison-panel" aria-label="全部设置同时展示"><DesignComparisonHeader description="全部设置同时呈现"/><ConvolutionView exp={left}/><div shuku-edit-id="e-deab2691-b5a7-46fb-92e4-5c9599d7c1c9" className="aipe-replay-cg-disclosure-settings"><KernelControl exp={left}/><SizeControls exp={left}/><ViewControls exp={left}/><Button variant="primary" onClick={left.toggle}><Typography shuku-edit-id="e-d4b607d4-fbb0-4457-8694-83ab2e6500a4" as="span" variant="bodySmall" tone="inherit">{left.finished?'重新扫描':left.playing?'暂停扫描':'继续扫描'}</Typography></Button></div></section>
      <section shuku-edit-id="e-8a97eeb1-212c-4cfa-b1e9-df29b07f7cfd" className="aipe-replay-cg-disclosure-panel aipe-replay-cg-disclosure-right aipe-design-comparison-panel is-ours" aria-label="按问题逐步展开"><DesignComparisonHeader ours description="聚焦当前问题，按需展开"/><Typography shuku-edit-id="e-9c8fed07-8d47-4fd1-8046-6376b89f4792" variant="bodySmall" tone="accent" className="aipe-replay-cg-disclosure-question">卷积核怎样找到边缘？</Typography><ConvolutionView exp={right}/><div shuku-edit-id="e-528398fe-c963-4fbf-ad91-5b33858b121d" className="aipe-replay-cg-disclosure-focused"><KernelControl exp={right}/><Button variant="primary" onClick={right.toggle}><Typography shuku-edit-id="e-a895813e-6760-4d3d-b510-480eda1036de" as="span" variant="bodySmall" tone="inherit">{right.finished?'重新扫描':right.playing?'暂停扫描':'继续扫描'}</Typography></Button></div><div shuku-edit-id="e-2c8cc09d-17c5-48a3-bec2-29f964a1f8c4" className="aipe-replay-cg-disclosure-more">
        <div shuku-edit-id="e-a35dd1d5-28fb-44bf-bfce-7cc5da81e6d2" className="aipe-replay-cg-disclosure-extra"><Button className="aipe-replay-cg-disclosure-expand" aria-expanded={expanded} aria-controls="aipe-replay-cg-disclosure-more-settings" onClick={()=>setExpanded(value=>!value)}><Typography shuku-edit-id="e-e67fe925-5709-4197-b7d4-6aec050c7dd4" as="span" variant="bodySmall" tone="inherit">更多设置</Typography><Typography shuku-edit-id="e-df7ec94e-120a-41f0-b161-015e2bfe18b7" as="span" variant="bodySmall" tone="inherit" aria-hidden="true">{expanded?'⌃':'›'}</Typography></Button>{expanded&&<div shuku-edit-id="e-2b9d0f73-8859-40f1-8668-794834a54570" id="aipe-replay-cg-disclosure-more-settings" className="aipe-replay-cg-disclosure-extra-controls"><SizeControls exp={right}/><ViewControls exp={right}/></div>}</div>
      </div></section>
    </div>
  </ContentBlock>;
}
