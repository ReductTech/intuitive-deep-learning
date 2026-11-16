import { useId, useState } from 'react';
import { ContentBlock, MathFormulaBlock, MathFormulaStatic, Typography } from "@shuku/course-style/react";
import './GeometricTransformsPage.css';
type Mode = 'translate' | 'scale' | 'rotate' | 'shear' | 'flip';
const modes: [Mode, string][] = [['translate','平移'],['scale','缩放'],['rotate','旋转'],['shear','错切'],['flip','翻转']];
type Matrix = [number, number, number, number, number, number];
const number = (n: number) => Math.abs(n) < .00001 ? '0' : Number(n.toFixed(2)).toString();
function Cat() {
  return <g shuku-edit-id="e-ad0e5fad-e9f3-4a70-9cdd-da79acaa97b1" transform="scale(.018,-.018)" fill="currentColor">
    <path shuku-edit-id="e-02c568a2-1e5b-4a45-80ca-5a45881bc5d9" d="M-36 75C-79 78-94 46-84 15C-79-1-82-14-90-23C-100-36-88-45-79-36C-58-14-61 8-65 25C-73 52-53 61-40 54Z" />
    <path shuku-edit-id="e-bb0a8244-eb68-4095-a043-c030a0d24594" d="M-37 79C-46 59-38 15-24-25L25-25C42 20 43 63 35 79Z" />
    <rect shuku-edit-id="e-08e8909b-b505-4c91-8aa7-1ff22beda235" x="-47" y="73" width="93" height="15" rx="7" />
    <path shuku-edit-id="e-3a6a106f-d229-4cd3-8c9a-d2f850864f67" d="M-38-58L-37-106Q-33-113-26-106L-9-89Q6-93 20-88L40-107Q47-111 47-101L44-57C60-5-52 4-38-58Z" />
    <g shuku-edit-id="e-3b5da300-64db-4ef7-853b-ccb5bd7bc079" stroke="currentColor" strokeWidth="4" strokeLinecap="round"><path shuku-edit-id="e-08c910c8-ca2d-42b0-b106-32e84cf4a509" d="M-40-43L-61-48M-40-33L-63-33M-38-23L-57-19M45-44L66-49M45-33L68-33M42-23L61-18" /></g>
    <circle shuku-edit-id="e-c4661d97-d2b5-4863-b884-19489d01965b" cx="-16" cy="-57" r="4" fill="#f6faff"/><circle shuku-edit-id="e-04853c00-6ecf-47ee-b7c0-3061074c261d" cx="23" cy="-57" r="4" fill="#f6faff"/>
  </g>;
}
function CoordinateImage({ matrix, result = false }: { matrix: Matrix; result?: boolean }) {
  const id = useId().replace(/:/g,'');
  const [a,b,tx,c,d,ty] = matrix;
  const x = a * .65 + b * 1.1 + tx, y = c * .65 + d * 1.1 + ty;
  return <div shuku-edit-id="e-6a5adc49-19ee-46d7-97b5-6a45c77a3432" className="di-geometry__visual">
    <svg shuku-edit-id="e-755dce6a-f4f8-42b5-8686-38dac282d2e7" viewBox="0 0 440 440" role="img" aria-label={result ? '矩阵变换后的猫咪与标记点' : '坐标系中的原始猫咪与标记点'} data-matrix={JSON.stringify(matrix)}>
      <defs shuku-edit-id="e-fc7a9c51-c02d-4cd4-a8df-64e24f886cb7"><marker shuku-edit-id="e-3b3727e9-8f9e-4d4e-b0f1-702254d4b91c" id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path shuku-edit-id="e-b9ba9ba0-bd40-4328-9b52-4a3be116bfc8" d="M0 0L10 5L0 10z" fill="#70879f"/></marker></defs>
      {Array.from({length:9},(_,i) => 28+i*48).map(v=><g shuku-edit-id="e-2e196b8b-3d14-4f7e-a84c-6111fb858c87" key={v} stroke="#dce6f0"><path shuku-edit-id="e-39200e8d-9824-4767-92f9-bfd6b33d067b" d={`M${v} 28V412M28 ${v}H412`}/></g>)}
      <g shuku-edit-id="e-9909b1cb-94af-4b22-b9bf-9726f1d35064" stroke="#70879f" strokeWidth="1.5" markerEnd={`url(#${id})`}><path shuku-edit-id="e-378e85df-80a1-4849-95e8-8d11e4b7f710" d="M20 220H418"/><path shuku-edit-id="e-110f8b96-fa18-452a-938a-0b5e79669358" d="M220 420V20"/></g>
      <foreignObject shuku-edit-id="e-06dd9f81-2295-49ec-a237-543a852fcf3e" x="410" y="222" width="28" height="40"><Typography shuku-edit-id="e-0ef5f718-86bb-4ea5-9211-896f6c597be8" variant="bodySmall" tone="muted">x</Typography></foreignObject>
      <foreignObject shuku-edit-id="e-35e93134-76af-4345-b304-33f883e02985" x="232" y="0" width="28" height="40"><Typography shuku-edit-id="e-11681f50-c3e5-4007-952c-41b6295ec60d" variant="bodySmall" tone="muted">y</Typography></foreignObject>
      <g shuku-edit-id="e-4c58f196-d0c0-4cef-a005-6a76c62f7838" transform="translate(220 220) scale(48 -48)">
        {result && <g shuku-edit-id="e-c7f769bd-d142-4297-bfec-2242009fe556" opacity=".1" color="#405e7d"><Cat/></g>}
        <g shuku-edit-id="e-581dd546-af42-4fed-9985-c2da027a4a52" className="di-geometry__cat" transform={`matrix(${a} ${c} ${b} ${d} ${tx} ${ty})`} color={result ? '#287bea' : '#8393a5'}><Cat/></g>
        <circle shuku-edit-id="e-12bd5fbb-2ce8-415c-a43a-a99fd8db7351" data-point="true" cx={x} cy={y} r=".12" fill="#fff" stroke="#126ce7" strokeWidth=".07"/>
      </g>
    </svg>
    <div shuku-edit-id="e-09a91b35-86f6-4abd-95ab-8128547aed59" className="di-geometry__coordinate"><i shuku-edit-id="e-24d4ec65-852f-4de5-9352-be64b9ac672e"/><Typography shuku-edit-id="e-11359191-7ee2-48c6-ab60-e69054cb0823" variant="bodySmall" tone="accent">{result ? '(x′, y′)' : '(x, y)'} = ({number(x)}, {number(y)})</Typography></div>
  </div>;
}
export function GeometricTransformsPage() {
  const [mode,setMode] = useState<Mode>('rotate');
  const [tx,setTx] = useState(1), [ty,setTy] = useState(.5), [scale,setScale] = useState(1.3), [angle,setAngle] = useState(30), [shear,setShear] = useState(.5), [vertical,setVertical] = useState(false);
  const radians = angle*Math.PI/180;
  const matrix: Matrix = mode === 'translate' ? [1,0,tx,0,1,ty] : mode === 'scale' ? [scale,0,0,0,scale,0] : mode === 'rotate' ? [Math.cos(radians),-Math.sin(radians),0,Math.sin(radians),Math.cos(radians),0] : mode === 'shear' ? [1,shear,0,0,1,0] : vertical ? [1,0,0,0,-1,0] : [-1,0,0,0,1,0];
  const [a,b,x,c,d,y] = matrix;
  const latex = `H = \\begin{bmatrix} ${number(a)} & ${number(b)} & ${number(x)} \\\\ ${number(c)} & ${number(d)} & ${number(y)} \\\\ 0 & 0 & 1 \\end{bmatrix}`;
  const slider = (label: string, value: number, update: (value: number)=>void, min: number, max: number, step: number, suffix = '') => <label shuku-edit-id="e-fdeb0d53-34df-4803-b18f-87cd6fd536f1" className="di-geometry__slider"><div shuku-edit-id="e-1e34d381-6126-427f-98e9-c61e9da54aa5"><Typography shuku-edit-id="e-9cba3973-1697-448e-b549-1a45fd005c75" variant="bodySmall" tone="accent">{label}</Typography><Typography shuku-edit-id="e-96bfbbd5-3314-4097-85c4-62b7d0d26db9" variant="bodySmall" tone="accent">{number(value)}{suffix}</Typography></div><input shuku-edit-id="e-1a0499d9-1ce8-464d-836f-7c39e4f02e4b" type="range" aria-label={label} min={min} max={max} step={step} value={value} onChange={e=>update(Number(e.target.value))}/></label>;
  const reset = () => { if(mode==='translate'){setTx(0);setTy(0);} else if(mode==='scale')setScale(1);else if(mode==='rotate')setAngle(0);else if(mode==='shear')setShear(0);else setVertical(false); };
  const explanation = {translate:'最后一列控制平移。',scale:'对角线控制缩放。',rotate:'正角度：绕原点逆时针旋转。',shear:'x′ = x + k y，横向错切。',flip:vertical?'y 变号：上下翻转。':'x 变号：左右翻转。'}[mode];
  return <ContentBlock shuku-edit-id="e-decee6a4-2ce6-42f7-a93f-873dad2eff99" className="di-geometry" title="用矩阵变换图像" subtitle="把像素坐标乘上一个矩阵，看看图像怎样移动和变形。" headingLevel={1}>
    <div shuku-edit-id="e-768311ce-64db-486d-a0d6-e1df36ac6382" className="di-geometry__body">
      <div shuku-edit-id="e-94ea84e5-3fb6-49b4-9754-6aa4642b9fe4" className="di-geometry__tabs" role="group" aria-label="选择几何变换">{modes.map(([id,title])=><button shuku-edit-id="e-48e0e577-7ca9-4149-9161-a163ab42dca6" type="button" key={id} aria-pressed={mode===id} className={mode===id?'is-selected':''} onClick={()=>setMode(id)}><Typography shuku-edit-id="e-a8857b86-6a2e-4a6f-a9ad-cfe92a4ca7e9" variant="bodySmall" tone="inherit">{title}</Typography></button>)}</div>
      <div shuku-edit-id="e-92f94f0e-2d17-45c0-a808-694164de53ea" className="di-geometry__main">
        <section shuku-edit-id="e-42c3c118-ec17-4761-8d7b-40df19d2e2ae" className="di-geometry__panel"><Typography shuku-edit-id="e-082e8abd-0070-480b-92f3-95b79c805b07" as="h2" variant="h3" tone="accent" align="center">原图</Typography><CoordinateImage matrix={[1,0,0,0,1,0]}/></section>
        <section shuku-edit-id="e-c83ee763-a949-4db3-b8e3-b7ee215d0b97" className="di-geometry__transform">
          <Typography shuku-edit-id="e-5aa65c45-6d65-481e-bb09-cc4275d67885" as="h2" variant="h3" tone="accent" align="center">坐标变换</Typography>
          <MathFormulaBlock appearance="plain"><MathFormulaStatic latex={"\\begin{bmatrix}x'\\\\y'\\\\1\\end{bmatrix}=H\\begin{bmatrix}x\\\\y\\\\1\\end{bmatrix}"}/></MathFormulaBlock>
          <div shuku-edit-id="e-e38d4ad3-0cce-4986-a70e-fc8897bdfc84" className="di-geometry__matrix" data-values={JSON.stringify(matrix)} aria-live="polite"><MathFormulaBlock appearance="plain"><MathFormulaStatic latex={latex}/></MathFormulaBlock></div>
          <div shuku-edit-id="e-d0f8fb22-b7d5-4853-b4e6-f74096c0b692" className="di-geometry__controls">{mode==='translate'?<>{slider('横向位移',tx,setTx,-1.2,1.2,.1)}{slider('纵向位移',ty,setTy,-1.2,1.2,.1)}</>:mode==='scale'?slider('缩放倍数',scale,setScale,.5,1.5,.05):mode==='rotate'?slider('旋转角度',angle,setAngle,-180,180,1,'°'):mode==='shear'?slider('错切系数 k',shear,setShear,-.8,.8,.05):<div shuku-edit-id="e-2716af06-734d-4086-94b3-0fb75d6c362f" className="di-geometry__flip">{[false,true].map(v=><button shuku-edit-id="e-be056125-5b17-4302-9a03-a778bfbfdf90" type="button" key={String(v)} aria-pressed={vertical===v} className={vertical===v?'is-selected':''} onClick={()=>setVertical(v)}><Typography shuku-edit-id="e-26094947-1c60-480e-afab-c55aa7114e69" variant="bodySmall" tone="inherit">{v?'上下翻转':'左右翻转'}</Typography></button>)}</div>}</div>
          <div shuku-edit-id="e-9fa8dcda-0288-4d30-899f-bc1740d1f2d6" className="di-geometry__hint"><Typography shuku-edit-id="e-9d0935b3-3c81-4f84-a4ae-d94804d2aa00" variant="bodySmall" tone="muted">{explanation}</Typography><button shuku-edit-id="e-245a0e64-0d7e-4191-95c8-855527bee79a" type="button" onClick={reset}><Typography shuku-edit-id="e-6946ca6b-35ae-4a75-8d08-5351390a4638" variant="bodySmall" tone="accent">重置</Typography></button></div>
        </section>
        <section shuku-edit-id="e-5b1a6352-c65d-489f-84bc-925027454435" className="di-geometry__panel"><Typography shuku-edit-id="e-6c267f1e-2949-43bf-bd93-a09983a4b373" as="h2" variant="h3" tone="accent" align="center">变换结果</Typography><CoordinateImage matrix={matrix} result/></section>
      </div>
      <footer shuku-edit-id="e-f60f4b10-e8f6-4703-a623-8cf3de6b1540" className="di-geometry__takeaway"><Typography shuku-edit-id="e-ff784b5e-f2b8-454d-b631-84fc28eefef5" variant="body" tone="accent" align="center">矩阵把原坐标映射到新坐标，图像的形状与位置随之改变。</Typography></footer>
    </div>
  </ContentBlock>;
}
