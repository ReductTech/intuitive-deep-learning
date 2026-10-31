import { useEffect, useRef, useState } from 'react';
import { Button, ContentBlock, Select, Typography } from '../../../../shared/react';
import { DesignComparisonHeader } from '../../DesignComparisonHeader';
import { correlate, formatResponse, initialSettings, inputPattern, kernels, type Settings } from '../components/disclosure/convolutionExperiment';
import './ProgressiveDisclosurePage.css';

const controlText = (text: string) => <Typography as="span" variant="bodySmall" tone="inherit">{text}</Typography>;
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
  return <div className="aipe-replay-cg-disclosure-choice"><Typography variant="bodySmall" tone="muted">{label}</Typography><div role="group" aria-label={label}>{options.map(item => <Button key={item.value} active={value === item.value} aria-pressed={value === item.value} onClick={() => onChange(item.value)}><Typography as="span" variant="bodySmall" tone="inherit">{item.label}</Typography></Button>)}</div></div>;
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
  return <div className="aipe-replay-cg-disclosure-visual">
    <div className="aipe-replay-cg-disclosure-flow">
      <div className="aipe-replay-cg-disclosure-image"><Typography variant="bodySmall" tone="inherit">{settings.padding ? '补零后 9×9' : '输入 7×7'}</Typography><svg viewBox="0 0 210 210" role="img" aria-label={`输入图案，窗口位于第${row*settings.stride+1}行第${col*settings.stride+1}列`}>
        {Array.from({length:gridSize*gridSize},(_,i)=>{const r=Math.floor(i/gridSize),c=i%gridSize,padded=r<settings.padding||c<settings.padding||r>=7+settings.padding||c>=7+settings.padding;const value=padded?0:input[r-settings.padding][c-settings.padding];return <g key={i}><rect x={c*210/gridSize+.6} y={r*210/gridSize+.6} width={210/gridSize-1.2} height={210/gridSize-1.2} rx="1" fill={padded?'#f1f3f6':value?'#3280d9':'#d8eaff'} stroke={padded?'#d2d9e3':'none'} strokeDasharray={padded?'2 2':undefined}/><Typography as="text" variant="bodySmall" tone="inherit" x={(c+.5)*210/gridSize} y={(r+.5)*210/gridSize} textAnchor="middle" dominantBaseline="central" className={value?'aipe-replay-cg-disclosure-digit is-one':'aipe-replay-cg-disclosure-digit'}>{value}</Typography></g>;})}
        <rect x={col*settings.stride*210/gridSize+1.5} y={row*settings.stride*210/gridSize+1.5} width={3*210/gridSize-3} height={3*210/gridSize-3} fill="none" stroke="#175fed" strokeWidth="3" rx="3"/>
      </svg></div>
      <Typography as="span" className="aipe-replay-cg-disclosure-flow-arrow" variant="h3" tone="light" aria-hidden="true">→</Typography>
      <div className="aipe-replay-cg-disclosure-kernel"><Typography variant="bodySmall" tone="inherit">3×3 核</Typography><div className="aipe-replay-cg-disclosure-kernel-grid" role="img" aria-label={`卷积核权重：${kernels[settings.kernel].flat().map(v=>settings.kernel==='average'?'1/9':v).join('，')}`}>{kernels[settings.kernel].flat().map((v,i)=><div key={i}><Typography as="span" variant="bodySmall" tone="inherit">{settings.kernel==='average'?'¹⁄₉':v}</Typography></div>)}</div></div>
      <Typography as="span" className="aipe-replay-cg-disclosure-flow-arrow" variant="h3" tone="light" aria-hidden="true">→</Typography>
      <div className="aipe-replay-cg-disclosure-image"><Typography variant="bodySmall" tone="inherit">输出 {size}×{size}</Typography><div className="aipe-replay-cg-disclosure-output" style={{gridTemplateColumns:`repeat(${size},minmax(0,1fr))`,gridTemplateRows:`repeat(${size},minmax(0,1fr))`}} role="group" aria-label="输出响应，点击格子查看对应窗口">{output.flat().map((v,i)=><button key={i} type="button" aria-label={`第${Math.floor(i/size)+1}行第${i%size+1}列，${i<=current?`响应${formatResponse(v)}`:'待计算'}`} aria-pressed={i===current} className={[i<=current?'is-computed':'',i===current?'is-selected':''].filter(Boolean).join(' ')} style={{background:i<=current?responseColor(v,settings):'#f5f7fb'}} onClick={()=>exp.select(i)}>{i<=current&&<svg viewBox={Number.isInteger(v)?'0 0 44 44':'0 0 62 44'} aria-hidden="true"><Typography as="text" variant="bodySmall" tone="inherit" x={Number.isInteger(v)?22:31} y="22" textAnchor="middle" dominantBaseline="central">{formatResponse(settings.response==='absolute'?Math.abs(v):v)}</Typography></svg>}</button>)}</div></div>
    </div>
    <div className="aipe-replay-cg-disclosure-readout"><Typography variant="bodySmall" tone="muted">{settings.response === 'absolute' ? '响应强度 =' : '相乘求和 ='} <Typography as="strong" variant="bodySmall" tone="accent">{formatResponse(settings.response === 'absolute'?Math.abs(value):value)}</Typography></Typography><div className="aipe-replay-cg-disclosure-color-key" aria-hidden="true"><i style={settings.response === 'absolute' ? {background:'#edf2f8'} : undefined}/><Typography as="span" variant="bodySmall" tone="muted">{settings.response === 'absolute'?'弱 → 强':'负 ← 0 → 正'}</Typography><i/></div></div>
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
  return <ContentBlock ref={root} headingLevel={1} title="围绕学习问题，逐步展开操作" subtitle="同一个卷积实验台，让设置随学习过程按需展开。" className="aipe-replay-cg-disclosure-page aipe-replay-cg-creator-typography" onKeyDown={event=>{if(event.target instanceof Element && event.target.closest('button,input,select') && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End',' '].includes(event.key))event.stopPropagation();}}>
    <div className="aipe-replay-cg-disclosure-panels">
      <section className="aipe-replay-cg-disclosure-panel aipe-replay-cg-disclosure-left aipe-design-comparison-panel" aria-label="全部设置同时展示"><DesignComparisonHeader description="全部设置同时呈现"/><ConvolutionView exp={left}/><div className="aipe-replay-cg-disclosure-settings"><KernelControl exp={left}/><SizeControls exp={left}/><ViewControls exp={left}/><Button variant="primary" onClick={left.toggle}><Typography as="span" variant="bodySmall" tone="inherit">{left.finished?'重新扫描':left.playing?'暂停扫描':'继续扫描'}</Typography></Button></div></section>
      <section className="aipe-replay-cg-disclosure-panel aipe-replay-cg-disclosure-right aipe-design-comparison-panel is-ours" aria-label="按问题逐步展开"><DesignComparisonHeader ours description="聚焦当前问题，按需展开"/><Typography variant="bodySmall" tone="accent" className="aipe-replay-cg-disclosure-question">卷积核怎样找到边缘？</Typography><ConvolutionView exp={right}/><div className="aipe-replay-cg-disclosure-focused"><KernelControl exp={right}/><Button variant="primary" onClick={right.toggle}><Typography as="span" variant="bodySmall" tone="inherit">{right.finished?'重新扫描':right.playing?'暂停扫描':'继续扫描'}</Typography></Button></div><div className="aipe-replay-cg-disclosure-more">
        <div className="aipe-replay-cg-disclosure-extra"><Button className="aipe-replay-cg-disclosure-expand" aria-expanded={expanded} aria-controls="aipe-replay-cg-disclosure-more-settings" onClick={()=>setExpanded(value=>!value)}><Typography as="span" variant="bodySmall" tone="inherit">更多设置</Typography><Typography as="span" variant="bodySmall" tone="inherit" aria-hidden="true">{expanded?'⌃':'›'}</Typography></Button>{expanded&&<div id="aipe-replay-cg-disclosure-more-settings" className="aipe-replay-cg-disclosure-extra-controls"><SizeControls exp={right}/><ViewControls exp={right}/></div>}</div>
      </div></section>
    </div>
  </ContentBlock>;
}
