import { useState } from 'react';
import { ContentBlock, MathFormulaStatic, Typography } from '../../../shared/react';
import buildingImage from '../../assets/xiandaijianzhu.png';
import './CommonKernelsPage.css';

const kernels = {
  '均值模糊': { matrix: [[1,1,1],[1,1,1],[1,1,1]], note: '邻域平均，画面更平滑', filter: 'blur(2px)' },
  'Gaussian 模糊': { matrix: [[1,2,1],[2,4,2],[1,2,1]], note: '中心权重更高，平滑更自然', filter: 'blur(1.5px)' },
  '锐化': { matrix: [[0,-1,0],[-1,5,-1],[0,-1,0]], note: '增强局部对比，边缘更清晰', filter: 'contrast(1.55) saturate(.65)' },
  '水平边缘': { matrix: [[-1,-1,-1],[0,0,0],[1,1,1]], note: '突出水平变化', filter: 'grayscale(1) invert(1) contrast(1.55)' },
  '垂直边缘': { matrix: [[-1,0,1],[-1,0,1],[-1,0,1]], note: '突出垂直变化', filter: 'grayscale(1) invert(1) contrast(1.45)' },
  Sobel: { matrix: [[-1,0,1],[-2,0,2],[-1,0,1]], note: '更稳定地检测边缘', filter: 'grayscale(1) invert(1) contrast(1.8)' },
  Laplacian: { matrix: [[0,1,0],[1,-4,1],[0,1,0]], note: '突出快速变化与细节', filter: 'grayscale(1) invert(1) contrast(2.1)' },
} as const;
type KernelName = keyof typeof kernels;
function Matrix({ values }: { values: readonly (readonly number[])[] }) { return <div className="ck-common__matrix">{values.flatMap((row,r)=>row.map((v,c)=><div key={`${r}-${c}`} className={v<0?'is-negative':v>1?'is-strong':''}><MathFormulaStatic latex={String(v)} /></div>))}</div>; }
export function CommonKernelsPage() { const [selected,setSelected]=useState<KernelName>('Sobel'); const current=kernels[selected]; return <ContentBlock headingLevel={1} className="ck-common" title="常见人工卷积核" subtitle="点击不同算子，观察同一图像在不同卷积核下的输出效果。">
  <div className="ck-common__tabs">{(Object.keys(kernels) as KernelName[]).map(name=><button type="button" key={name} className={selected===name?'is-selected':''} onClick={()=>setSelected(name)}><Typography as="span" variant="body" tone="inherit">{name}</Typography></button>)}</div>
  <div className="ck-common__workspace"><article><header><b>1</b><Typography as="h2" variant="h3" tone="accent">输入图像</Typography></header><img src={buildingImage} alt="建筑灰度输入图" /><Typography variant="body" tone="accent">原图</Typography></article><article><header><b>2</b><Typography as="h2" variant="h3" tone="accent">卷积核</Typography></header><Typography variant="h3" tone="accent">{selected}</Typography><Typography variant="bodySmall" tone="muted">{current.note}</Typography><Matrix values={current.matrix} /></article><article><header><b>3</b><Typography as="h2" variant="h3" tone="accent">输出效果</Typography></header><img className="ck-common__output" src={buildingImage} alt={`${selected} 输出效果`} style={{ filter: current.filter }} /><Typography variant="bodySmall" tone="accent">亮 = 响应强，暗 = 响应弱</Typography></article></div>
  <footer><Typography as="span" variant="h3" tone="accent">提示：</Typography><Typography variant="body">切换上方不同卷积核，观察同一图像在不同算子下的输出效果。</Typography></footer>
 </ContentBlock>; }
