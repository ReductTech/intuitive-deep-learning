import { useEffect, useRef, useState } from 'react';
import { Button, Select, Typography } from "@shuku/course-style/react";
import { correlate, formatResponse, initialSettings, inputPattern, kernels, type Settings } from '../components/disclosure/convolutionExperiment';
import './ProgressiveDisclosurePage.css';

const controlText = (text: string) => <Typography shuku-edit-id="e-ee0b2b76-c325-4cc1-bdf0-17f448133b5e" as="span" variant="bodySmall" tone="inherit">{text}</Typography>;
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
  return <div shuku-edit-id="e-294d2d22-a13a-4ca8-88a9-db6dbf615878" className="cg-disclosure-choice"><Typography shuku-edit-id="e-c1d4b6f9-a638-4676-8ee8-36b262249206" variant="bodySmall" tone="muted">{label}</Typography><div shuku-edit-id="e-590d6556-5aa6-4029-b6c2-ee8eb6028a4e" role="group" aria-label={label}>{options.map(item => <Button key={item.value} active={value === item.value} aria-pressed={value === item.value} onClick={() => onChange(item.value)}><Typography shuku-edit-id="e-38bf8457-2287-4db0-9e40-876e7c03e1fd" as="span" variant="bodySmall" tone="inherit">{item.label}</Typography></Button>)}</div></div>;
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
  return <div shuku-edit-id="e-120ad126-d381-4851-9b75-bf348dce37b7" className="cg-disclosure-visual">
    <div shuku-edit-id="e-3f9ce999-6b4e-447d-b98e-e5793e537455" className="cg-disclosure-flow">
      <div shuku-edit-id="e-292831cf-27b7-435d-97ca-84d5c7a5a9c0" className="cg-disclosure-image"><Typography shuku-edit-id="e-fbc051d0-f746-4d34-a012-3dc74d533304" variant="bodySmall" tone="inherit">{settings.padding ? '补零后 9×9' : '输入 7×7'}</Typography><svg shuku-edit-id="e-37138fca-7890-4b73-9cc8-8ce51de7335a" viewBox="0 0 210 210" role="img" aria-label={`输入图案，窗口位于第${row*settings.stride+1}行第${col*settings.stride+1}列`}>
        {Array.from({length:gridSize*gridSize},(_,i)=>{const r=Math.floor(i/gridSize),c=i%gridSize,padded=r<settings.padding||c<settings.padding||r>=7+settings.padding||c>=7+settings.padding;const value=padded?0:input[r-settings.padding][c-settings.padding];return <g shuku-edit-id="e-6f4f6716-22a7-474d-ae77-2528776be841" key={i}><rect shuku-edit-id="e-5fd076f2-89ff-4baa-8b1f-75571501c71d" x={c*210/gridSize+.6} y={r*210/gridSize+.6} width={210/gridSize-1.2} height={210/gridSize-1.2} rx="1" fill={padded?'#f1f3f6':value?'#3280d9':'#d8eaff'} stroke={padded?'#d2d9e3':'none'} strokeDasharray={padded?'2 2':undefined}/><Typography shuku-edit-id="e-80d6d39e-dbfa-4c6e-af48-efdacb4b1176" as="text" variant="bodySmall" tone="inherit" x={(c+.5)*210/gridSize} y={(r+.5)*210/gridSize} textAnchor="middle" dominantBaseline="central" className={value?'cg-disclosure-digit is-one':'cg-disclosure-digit'}>{value}</Typography></g>;})}
        <rect shuku-edit-id="e-e9fec64f-022a-4b29-85a1-5e04a42c96e3" x={col*settings.stride*210/gridSize+1.5} y={row*settings.stride*210/gridSize+1.5} width={3*210/gridSize-3} height={3*210/gridSize-3} fill="none" stroke="#175fed" strokeWidth="3" rx="3"/>
      </svg></div>
      <Typography shuku-edit-id="e-5018c7ae-c193-4f18-805d-872c21098343" as="span" className="cg-disclosure-flow-arrow" variant="h3" tone="light" aria-hidden="true">→</Typography>
      <div shuku-edit-id="e-69b2e849-b09b-4e09-b662-5fc2c9872d5d" className="cg-disclosure-kernel"><Typography shuku-edit-id="e-a790c1a0-e869-4c8e-8829-73a780f7510a" variant="bodySmall" tone="inherit">3×3 核</Typography><div shuku-edit-id="e-7c44c7d7-1075-4387-8d86-0a2c7156da58" className="cg-disclosure-kernel-grid" role="img" aria-label={`卷积核权重：${kernels[settings.kernel].flat().map(v=>settings.kernel==='average'?'1/9':v).join('，')}`}>{kernels[settings.kernel].flat().map((v,i)=><div shuku-edit-id="e-45c494aa-5410-4743-bdd7-75d7f62deb85" key={i}><Typography shuku-edit-id="e-e7ca4b19-a473-4d3c-9885-e0745e38872a" as="span" variant="bodySmall" tone="inherit">{settings.kernel==='average'?'¹⁄₉':v}</Typography></div>)}</div></div>
      <Typography shuku-edit-id="e-215e2fb0-c884-459a-8f24-925c51051f1f" as="span" className="cg-disclosure-flow-arrow" variant="h3" tone="light" aria-hidden="true">→</Typography>
      <div shuku-edit-id="e-950bca1f-af61-45ec-b0a5-5918920acbaa" className="cg-disclosure-image"><Typography shuku-edit-id="e-51616578-7dc4-4a9b-ac4f-c5ab8258a073" variant="bodySmall" tone="inherit">输出 {size}×{size}</Typography><div shuku-edit-id="e-91548a96-090f-479e-9e1b-edb873ac7f7e" className="cg-disclosure-output" style={{gridTemplateColumns:`repeat(${size},minmax(0,1fr))`,gridTemplateRows:`repeat(${size},minmax(0,1fr))`}} role="group" aria-label="输出响应，点击格子查看对应窗口">{output.flat().map((v,i)=><button shuku-edit-id="e-a74ab85e-0bca-4e02-ae50-0b4f288b5eb7" key={i} type="button" aria-label={`第${Math.floor(i/size)+1}行第${i%size+1}列，${i<=current?`响应${formatResponse(v)}`:'待计算'}`} aria-pressed={i===current} className={[i<=current?'is-computed':'',i===current?'is-selected':''].filter(Boolean).join(' ')} style={{background:i<=current?responseColor(v,settings):'#f5f7fb'}} onClick={()=>exp.select(i)}>{i<=current&&<svg shuku-edit-id="e-5534f6d0-bcd0-45aa-a3f5-ac21fa8d8cff" viewBox={Number.isInteger(v)?'0 0 44 44':'0 0 62 44'} aria-hidden="true"><Typography shuku-edit-id="e-e71b4a01-c61a-4b91-81d4-4ab9167235c5" as="text" variant="bodySmall" tone="inherit" x={Number.isInteger(v)?22:31} y="22" textAnchor="middle" dominantBaseline="central">{formatResponse(settings.response==='absolute'?Math.abs(v):v)}</Typography></svg>}</button>)}</div></div>
    </div>
    <div shuku-edit-id="e-1224e2b5-9ce5-44ad-86cb-3f47ed1a6428" className="cg-disclosure-readout"><Typography shuku-edit-id="e-653ea312-8751-4120-9360-12c6bfab6f1a" variant="bodySmall" tone="muted">{settings.response === 'absolute' ? '响应强度 =' : '相乘求和 ='} <Typography shuku-edit-id="e-722de30c-291b-4a10-a09b-fe72b51492ce" as="strong" variant="bodySmall" tone="accent">{formatResponse(settings.response === 'absolute'?Math.abs(value):value)}</Typography></Typography><div shuku-edit-id="e-d2e3807a-7366-4dce-a201-e206e3b6ea45" className="cg-disclosure-color-key" aria-hidden="true"><i shuku-edit-id="e-4dc1c0bf-98e6-4777-80c6-186bbf6914cf" style={settings.response === 'absolute' ? {background:'#edf2f8'} : undefined}/><Typography shuku-edit-id="e-f5d649bd-425b-4d91-b980-f6749fc37290" as="span" variant="bodySmall" tone="muted">{settings.response === 'absolute'?'弱 → 强':'负 ← 0 → 正'}</Typography><i shuku-edit-id="e-28d33c7e-c15e-48ca-a136-4c0bf19ee816"/></div></div>
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
  return <article shuku-edit-id="e-aea70399-3231-473a-ab3e-55db69727dd5" ref={root} className="cg-disclosure-page cg-creator-typography" aria-labelledby="cg-disclosure-title" onKeyDown={event=>{if(event.target instanceof Element && event.target.closest('button,input,select') && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End',' '].includes(event.key))event.stopPropagation();}}>
    <header shuku-edit-id="e-c0941078-60e0-4d78-840d-67842cd0ed78"><Typography shuku-edit-id="e-f3e40ad2-17bb-47a0-9b65-4a47d43dc3d1" as="h1" variant="display" tone="inherit" id="cg-disclosure-title">渐进式披露，克制才是高级</Typography><Typography shuku-edit-id="e-b348d455-0ad7-4059-8887-9a3e9cb1591e" variant="body" tone="muted">同一个卷积实验台，让操作随着学习问题逐步展开。</Typography></header>
    <div shuku-edit-id="e-82e048f0-f791-4854-9a65-3d12df31dc8d" className="cg-disclosure-panels">
      <section shuku-edit-id="e-5806e707-3877-424c-8134-39bd597d8be6" className="cg-disclosure-panel cg-disclosure-left" aria-label="全部设置同时展示"><Typography shuku-edit-id="e-cddbd84e-1254-45bf-b14b-98d70ff44bc7" as="h2" variant="h3" tone="inherit">设置全部展开，从哪里开始？</Typography><ConvolutionView exp={left}/><div shuku-edit-id="e-ff96d37f-659d-4367-bdf1-ed8daac35761" className="cg-disclosure-settings"><KernelControl exp={left}/><SizeControls exp={left}/><ViewControls exp={left}/></div><div shuku-edit-id="e-7b7be933-4e97-40b4-97ae-3cd1d4fe6c54" className="cg-disclosure-left-actions"><Typography shuku-edit-id="e-ca21fbe9-3b49-4b2c-a760-fa0a45643502" variant="bodySmall" tone="inherit" className="cg-disclosure-thought">我该先调哪个？</Typography><Button variant="primary" onClick={left.toggle}><Typography shuku-edit-id="e-1e823c5f-9bbf-4089-93eb-cb8ab33c9dcc" as="span" variant="bodySmall" tone="inherit">{left.finished?'重新扫描':left.playing?'暂停扫描':'继续扫描'}</Typography></Button></div></section>
      <section shuku-edit-id="e-3758e79a-d363-466a-9bb1-03f6bfb4a85c" className="cg-disclosure-panel cg-disclosure-right" aria-label="按问题逐步展开"><Typography shuku-edit-id="e-aea71132-4d74-4fe4-b4bb-075b9248e6ee" as="h2" variant="h3" tone="inherit">先围绕一个问题，组织操作</Typography><Typography shuku-edit-id="e-ebfa6826-af19-49b2-96ac-6866dd1ff2b5" variant="body" tone="accent" className="cg-disclosure-question">卷积核怎样找到边缘？</Typography><ConvolutionView exp={right}/><div shuku-edit-id="e-946ae4d4-fcf1-43c7-bfe9-34624457f0fc" className="cg-disclosure-focused"><KernelControl exp={right}/><Button variant="primary" onClick={right.toggle}><Typography shuku-edit-id="e-4c9f4997-bcf7-4e66-b44a-e3328935c714" as="span" variant="bodySmall" tone="inherit">{right.finished?'重新扫描':right.playing?'暂停扫描':'继续扫描'}</Typography></Button></div><div shuku-edit-id="e-e4b39f4e-5121-4010-925e-ce3d854d44b0" className="cg-disclosure-more">
        <div shuku-edit-id="e-29daa2aa-5d4b-41c8-911c-13f9ee0e3cc6" className="cg-disclosure-extra"><Button className="cg-disclosure-expand" aria-expanded={expanded} aria-controls="cg-disclosure-more-settings" onClick={()=>setExpanded(value=>!value)}><Typography shuku-edit-id="e-5130637c-9fc6-44ac-be7a-8cae8c1eeecd" as="span" variant="bodySmall" tone="inherit">更多设置</Typography><Typography shuku-edit-id="e-d3fa18cf-0389-4f06-8b1f-2c3e20bf1672" as="span" variant="bodySmall" tone="inherit" aria-hidden="true">{expanded?'⌃':'›'}</Typography></Button>{expanded&&<div shuku-edit-id="e-f1408f3f-1950-421c-89d7-c3e1471ceedf" id="cg-disclosure-more-settings" className="cg-disclosure-extra-controls"><SizeControls exp={right}/><ViewControls exp={right}/></div>}</div>
      </div></section>
    </div>
    <footer shuku-edit-id="e-84c575cc-1634-4295-b307-d552f13cdf5a"><Typography shuku-edit-id="e-4e512a53-c957-4b8f-ae6d-779058dfb6c9" variant="h3" tone="inherit">先回答眼前的问题，再展开下一层复杂度。</Typography></footer>
  </article>;
}
