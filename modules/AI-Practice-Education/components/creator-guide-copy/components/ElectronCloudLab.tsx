import { useState, type CSSProperties } from 'react';
import { Button, Switch, RangeControl, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../../shared/react';
import { ElectronCloudScene } from './ElectronCloudScene';
import './ElectronCloudLab.css';
import { orbitals, radialDensity, radialProbability, type Orbital } from './hydrogenOrbitals';

function Formula({ latex, label }: { latex: string; label: string }) { return <MathFormulaBlock appearance="plain" ariaLabel={label}><MathFormulaStatic latex={latex}/></MathFormulaBlock>; }
const rangeStyle = (value: number, min: number, max: number) => ({ '--aipe-replay-cg-fill': `${(value-min)/(max-min)*100}%` }) as CSSProperties;
export function ElectronCloudLab() {
  const [mass,setMass]=useState(1);const [charge,setCharge]=useState(1);const [strength,setStrength]=useState(1);const [radius,setRadius]=useState(.08);const [orbital,setOrbital]=useState<Orbital>('1s');const [slice,setSlice]=useState(false);
  const scale=1/(mass*charge*strength);const a=.0529177*scale;
  const probability=radialProbability(orbital,radius/a);
  const plotMax=orbital==='1s'?6:16;const peak=Math.max(...Array.from({length:401},(_,i)=>radialDensity(orbital,i/400*plotMax)));
  const points=Array.from({length:81},(_,i)=>{const x=i/80*plotMax;return [18+i/80*142,88-radialDensity(orbital,x)/peak*66];});
  const path=points.map(([x,y],i)=>`${i?'L':'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
  const marker=18+Math.min(radius/a/plotMax,1)*142;
  return <div className="aipe-replay-cg-cloud-lab" data-model-scale={scale} data-probability={probability} data-mode="density" data-orbital={orbital}>
    <Typography as="h2" variant="h2" tone="inherit" className="aipe-replay-cg-lab-title">电子是怎样分布在原子里的？</Typography>
    <div className="aipe-replay-cg-lab-workflow">{[
      ['势能环境',String.raw`V(r)=-\frac{Ze|q|}{4\pi\varepsilon_0r}`,'描述环境'],
      ['哈密顿量',String.raw`\hat H=-\frac{\hbar^2}{2m}\nabla^2+V(r)`,'总能量算符'],
      ['薛定谔方程',String.raw`\hat H\psi=E\psi`,'求波函数'],
      ['概率密度',String.raw`\rho(\mathbf r)=|\psi(\mathbf r)|^2`,'得到电子云'],
    ].map(([title,latex,detail],i)=><div key={title} className="aipe-replay-cg-lab-workflow-step"><Typography variant="bodySmall" tone="inherit">{title}</Typography><Formula latex={latex} label={title}/><Typography variant="bodySmall" tone="inherit" className="aipe-replay-cg-lab-workflow-detail">{detail}</Typography>{i<3&&<svg viewBox="0 0 20 20" className="aipe-replay-cg-lab-workflow-arrow" aria-hidden="true"><path d="M2 10h15M11 4l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2"/></svg>}</div>)}</div>
    <div className="aipe-replay-cg-lab-visual"><Typography as="h3" variant="h3" tone="inherit" className="aipe-replay-cg-lab-visual-title">{orbitals[orbital].name}（{orbital}）</Typography><ElectronCloudScene scale={scale} radiusNm={radius} orbital={orbital} slice={slice}/><Switch className="aipe-replay-cg-lab-section-switch" id="aipe-replay-cg-lab-section" checked={slice} onChange={e=>setSlice(e.currentTarget.checked)} label={<Typography as="span" variant="bodySmall" tone="inherit">显示中心剖面</Typography>}/><Typography variant="bodySmall" tone="inherit" className="aipe-replay-cg-lab-drag-hint">拖动旋转 · 滚轮缩放</Typography>
      <div className="aipe-replay-cg-lab-legend"><Typography variant="bodySmall" tone="inherit">概率密度</Typography><div className="aipe-replay-cg-lab-legend-scale"><span/><div><Typography variant="bodySmall" tone="inherit">高</Typography><Typography variant="bodySmall" tone="inherit">低</Typography></div></div></div>
      <div className="aipe-replay-cg-lab-radial"><Typography variant="bodySmall" tone="inherit">径向概率分布（{orbital}）</Typography><svg viewBox="0 0 180 105" aria-label="当前轨道的径向概率分布"><path d="M18 7v81h148" fill="none" stroke="#657b99"/><path d={`${path}L160 88H18Z`} fill="#c3e0ff"/><path d={path} fill="none" stroke="#2087ef" strokeWidth="2"/><path d={`M${marker} 12V88`} stroke="#dc904b" strokeWidth="1.5" strokeDasharray="3 3"/></svg><Typography variant="bodySmall" tone="inherit" className="aipe-replay-cg-lab-radial-label">半径 / 有效玻尔半径</Typography></div>
      <Typography variant="bodySmall" tone="inherit" className="aipe-replay-cg-lab-volume-note">切换形态时自动调整视野 · 原子核不按比例 · 亮点非电子轨迹</Typography>
    </div>
    <div className="aipe-replay-cg-lab-controls"><div className="aipe-replay-cg-lab-controls-head"><Typography as="h3" variant="h3" tone="inherit">参数与显示</Typography><Button onClick={()=>{setMass(1);setCharge(1);setStrength(1);setRadius(.08);setOrbital('1s');setSlice(false);}}><Typography as="span" variant="bodySmall" tone="inherit">重置</Typography></Button></div>
      <Typography variant="bodySmall" tone="inherit" className="aipe-replay-cg-lab-model-note">假想模型参数；默认值对应氢原子。</Typography>
      <RangeControl id="aipe-replay-cg-lab-mass" label="质量（相对电子质量）" min={.75} max={1.5} step={.05} value={mass} digits={2} suffix=" 倍" style={rangeStyle(mass,.75,1.5)} onChange={e=>setMass(Number(e.currentTarget.value))}/>
      <RangeControl id="aipe-replay-cg-lab-charge" label="负电荷大小（相对基本电荷）" min={.75} max={1.5} step={.05} value={charge} digits={2} suffix=" 倍" style={rangeStyle(charge,.75,1.5)} onChange={e=>setCharge(Number(e.currentTarget.value))}/>
      <RangeControl id="aipe-replay-cg-lab-strength" label="有效核电荷 / 势强度" min={.75} max={2} step={.05} value={strength} digits={2} suffix=" 倍" style={rangeStyle(strength,.75,2)} onChange={e=>setStrength(Number(e.currentTarget.value))}/>
      <RangeControl id="aipe-replay-cg-lab-radius" label="观测球半径" min={.02} max={.25} step={.005} value={radius} digits={3} suffix=" nm" style={rangeStyle(radius,.02,.25)} onChange={e=>setRadius(Number(e.currentTarget.value))}/>
      <Typography variant="bodySmall" tone="inherit" className="aipe-replay-cg-lab-probability">球内找到电子的概率：<strong>{(probability*100).toFixed(1)}%</strong></Typography>
      <div className="aipe-replay-cg-lab-mode" role="group" aria-label="电子云形态">{(['1s','2s','2p'] as Orbital[]).map(state=><Button key={state} active={orbital===state} variant={orbital===state?'primary':'default'} onClick={()=>{setOrbital(state);setSlice(state==='2s');}} aria-pressed={orbital===state}><Typography as="span" variant="bodySmall" tone="inherit">{orbitals[state].name}<br/>（{state}）</Typography></Button>)}</div>
      <Typography variant="bodySmall" tone="inherit" className="aipe-replay-cg-lab-mode-note">{orbitals[orbital].detail}</Typography>
    </div>
    <Typography variant="bodySmall" tone="inherit" className="aipe-replay-cg-lab-bottom">电子云是由波函数决定的位置概率分布。</Typography>
  </div>;
}
