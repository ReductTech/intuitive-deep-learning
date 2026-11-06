import { useId, useState } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import './GeometricTransformsPage.css';
type Mode = 'translate' | 'scale' | 'rotate' | 'shear' | 'flip';
const modes: [Mode, string][] = [['translate','平移'],['scale','缩放'],['rotate','旋转'],['shear','错切'],['flip','翻转']];
type Matrix = [number, number, number, number, number, number];
const number = (n: number) => Math.abs(n) < .00001 ? '0' : Number(n.toFixed(2)).toString();
function Cat() {
  return <g transform="scale(.018,-.018)" fill="currentColor">
    <path d="M-36 75C-79 78-94 46-84 15C-79-1-82-14-90-23C-100-36-88-45-79-36C-58-14-61 8-65 25C-73 52-53 61-40 54Z" />
    <path d="M-37 79C-46 59-38 15-24-25L25-25C42 20 43 63 35 79Z" />
    <rect x="-47" y="73" width="93" height="15" rx="7" />
    <path d="M-38-58L-37-106Q-33-113-26-106L-9-89Q6-93 20-88L40-107Q47-111 47-101L44-57C60-5-52 4-38-58Z" />
    <g stroke="currentColor" strokeWidth="4" strokeLinecap="round"><path d="M-40-43L-61-48M-40-33L-63-33M-38-23L-57-19M45-44L66-49M45-33L68-33M42-23L61-18" /></g>
    <circle cx="-16" cy="-57" r="4" fill="#f6faff"/><circle cx="23" cy="-57" r="4" fill="#f6faff"/>
  </g>;
}
function CoordinateImage({ matrix, result = false }: { matrix: Matrix; result?: boolean }) {
  const id = useId().replace(/:/g,'');
  const [a,b,tx,c,d,ty] = matrix;
  const x = a * .65 + b * 1.1 + tx, y = c * .65 + d * 1.1 + ty;
  return <div className="di-geometry__visual">
    <svg viewBox="0 0 440 440" role="img" aria-label={result ? '矩阵变换后的猫咪与标记点' : '坐标系中的原始猫咪与标记点'} data-matrix={JSON.stringify(matrix)}>
      <defs><marker id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#70879f"/></marker></defs>
      {Array.from({length:9},(_,i) => 28+i*48).map(v=><g key={v} stroke="#dce6f0"><path d={`M${v} 28V412M28 ${v}H412`}/></g>)}
      <g stroke="#70879f" strokeWidth="1.5" markerEnd={`url(#${id})`}><path d="M20 220H418"/><path d="M220 420V20"/></g>
      <foreignObject x="410" y="222" width="28" height="40"><Typography variant="bodySmall" tone="muted">x</Typography></foreignObject>
      <foreignObject x="232" y="0" width="28" height="40"><Typography variant="bodySmall" tone="muted">y</Typography></foreignObject>
      <g transform="translate(220 220) scale(48 -48)">
        {result && <g opacity=".1" color="#405e7d"><Cat/></g>}
        <g className="di-geometry__cat" transform={`matrix(${a} ${c} ${b} ${d} ${tx} ${ty})`} color={result ? '#287bea' : '#8393a5'}><Cat/></g>
        <circle data-point="true" cx={x} cy={y} r=".12" fill="#fff" stroke="#126ce7" strokeWidth=".07"/>
      </g>
    </svg>
    <div className="di-geometry__coordinate"><i/><Typography variant="bodySmall" tone="accent">{result ? '(x′, y′)' : '(x, y)'} = ({number(x)}, {number(y)})</Typography></div>
  </div>;
}
export function GeometricTransformsPage() {
  const [mode,setMode] = useState<Mode>('rotate');
  const [tx,setTx] = useState(1), [ty,setTy] = useState(.5), [scale,setScale] = useState(1.3), [angle,setAngle] = useState(30), [shear,setShear] = useState(.5), [vertical,setVertical] = useState(false);
  const radians = angle*Math.PI/180;
  const matrix: Matrix = mode === 'translate' ? [1,0,tx,0,1,ty] : mode === 'scale' ? [scale,0,0,0,scale,0] : mode === 'rotate' ? [Math.cos(radians),-Math.sin(radians),0,Math.sin(radians),Math.cos(radians),0] : mode === 'shear' ? [1,shear,0,0,1,0] : vertical ? [1,0,0,0,-1,0] : [-1,0,0,0,1,0];
  const [a,b,x,c,d,y] = matrix;
  const latex = `H = \\begin{bmatrix} ${number(a)} & ${number(b)} & ${number(x)} \\\\ ${number(c)} & ${number(d)} & ${number(y)} \\\\ 0 & 0 & 1 \\end{bmatrix}`;
  const slider = (label: string, value: number, update: (value: number)=>void, min: number, max: number, step: number, suffix = '') => <label className="di-geometry__slider"><div><Typography variant="bodySmall" tone="accent">{label}</Typography><Typography variant="bodySmall" tone="accent">{number(value)}{suffix}</Typography></div><input type="range" aria-label={label} min={min} max={max} step={step} value={value} onChange={e=>update(Number(e.target.value))}/></label>;
  const reset = () => { if(mode==='translate'){setTx(0);setTy(0);} else if(mode==='scale')setScale(1);else if(mode==='rotate')setAngle(0);else if(mode==='shear')setShear(0);else setVertical(false); };
  const explanation = {translate:'最后一列控制平移。',scale:'对角线控制缩放。',rotate:'正角度：绕原点逆时针旋转。',shear:'x′ = x + k y，横向错切。',flip:vertical?'y 变号：上下翻转。':'x 变号：左右翻转。'}[mode];
  return <ContentBlock className="di-geometry" title="用矩阵变换图像" subtitle="把像素坐标乘上一个矩阵，看看图像怎样移动和变形。" headingLevel={1}>
    <div className="di-geometry__body">
      <div className="di-geometry__tabs" role="group" aria-label="选择几何变换">{modes.map(([id,title])=><button type="button" key={id} aria-pressed={mode===id} className={mode===id?'is-selected':''} onClick={()=>setMode(id)}><Typography variant="bodySmall" tone="inherit">{title}</Typography></button>)}</div>
      <div className="di-geometry__main">
        <section className="di-geometry__panel"><Typography as="h2" variant="h3" tone="accent" align="center">原图</Typography><CoordinateImage matrix={[1,0,0,0,1,0]}/></section>
        <section className="di-geometry__transform">
          <Typography as="h2" variant="h3" tone="accent" align="center">坐标变换</Typography>
          <MathFormulaBlock appearance="plain"><MathFormulaStatic latex={"\\begin{bmatrix}x'\\\\y'\\\\1\\end{bmatrix}=H\\begin{bmatrix}x\\\\y\\\\1\\end{bmatrix}"}/></MathFormulaBlock>
          <div className="di-geometry__matrix" data-values={JSON.stringify(matrix)} aria-live="polite"><MathFormulaBlock appearance="plain"><MathFormulaStatic latex={latex}/></MathFormulaBlock></div>
          <div className="di-geometry__controls">{mode==='translate'?<>{slider('横向位移',tx,setTx,-1.2,1.2,.1)}{slider('纵向位移',ty,setTy,-1.2,1.2,.1)}</>:mode==='scale'?slider('缩放倍数',scale,setScale,.5,1.5,.05):mode==='rotate'?slider('旋转角度',angle,setAngle,-180,180,1,'°'):mode==='shear'?slider('错切系数 k',shear,setShear,-.8,.8,.05):<div className="di-geometry__flip">{[false,true].map(v=><button type="button" key={String(v)} aria-pressed={vertical===v} className={vertical===v?'is-selected':''} onClick={()=>setVertical(v)}><Typography variant="bodySmall" tone="inherit">{v?'上下翻转':'左右翻转'}</Typography></button>)}</div>}</div>
          <div className="di-geometry__hint"><Typography variant="bodySmall" tone="muted">{explanation}</Typography><button type="button" onClick={reset}><Typography variant="bodySmall" tone="accent">重置</Typography></button></div>
        </section>
        <section className="di-geometry__panel"><Typography as="h2" variant="h3" tone="accent" align="center">变换结果</Typography><CoordinateImage matrix={matrix} result/></section>
      </div>
      <footer className="di-geometry__takeaway"><Typography variant="body" tone="accent" align="center">矩阵把原坐标映射到新坐标，图像的形状与位置随之改变。</Typography></footer>
    </div>
  </ContentBlock>;
}
