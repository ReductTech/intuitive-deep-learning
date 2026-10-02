import {useEffect,useState} from 'react';
import {Button,ContentBlock,ExplainPanelButton,MathFormulaBlock,MathFormulaStatic,RangeControl,Typography,moduleAssetUrl} from '../../../shared/react';
import './GradCamPage.css';

type Mode='classification'|'triplet';
type Result={score:number;channels:{index:number;alpha:number;image:string}[];heat:string;overlay:string};
type Sample={id:string;name:string;input:string;reference:string;classification:Result;triplet:Result};
type RecordData={samples:Sample[];seed:number;classificationEpochs:number;tripletEpochs:number;trainingSamples:number;validationSamples:number;classificationValidationAccuracy:number};
const asset=(path:string)=>moduleAssetUrl('80396753-7fc8-4f55-9188-bddbdb828169',`gradcam/${path}`);
const modeNames={classification:'分类得分',triplet:'相似度得分'};
const names=['鲍威尔','布什'];
function Arrow(){return <svg className="vfl-cam-arrow" viewBox="0 0 30 40" aria-hidden="true"><path d="M2 20H25M17 11L26 20L17 29" stroke="#86a9d5" strokeWidth="3" fill="none"/></svg>;}
export function GradCamPage(){
 const [record,setRecord]=useState<RecordData|null>(null),[error,setError]=useState(false),[sampleIndex,setSampleIndex]=useState(0),[mode,setMode]=useState<Mode>('classification'),[opacity,setOpacity]=useState(.65);
 useEffect(()=>{const controller=new AbortController();fetch(asset('record.json'),{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('asset');return r.json();}).then(setRecord).catch(e=>{if(e.name!=='AbortError')setError(true);});return()=>controller.abort();},[]);
 const sample=record?.samples[sampleIndex],result=sample?.[mode];
 const sampleAsset=(file:string)=>asset(`${sample?.id}/${file}`);
 const maxAlpha=Math.max(...(result?.channels.map(c=>Math.abs(c.alpha))??[1]));
 return <ContentBlock className="vfl-cam-page" headingLevel={1} title="Grad-CAM：不同训练目标关注哪里？" subtitle="同一张脸，解释不同的得分：哪些区域支持了这次判断？">
 <div className="vfl-cam-body">
 <section className="vfl-cam-principle">
 <div className="vfl-cam-heading"><Typography variant="h3" tone="accent">通道加权的直觉</Typography><ExplainPanelButton label="查看 Grad-CAM 的计算与数据来源"><div className="vfl-cam-details">
 <Typography as="div" variant="h3" tone="accent">先确定要解释哪个得分</Typography><Typography as="div" variant="bodySmall">分类：指定身份的 logit；三元组：与固定参照脸的余弦相似度。</Typography>
 <MathFormulaBlock><MathFormulaStatic latex={String.raw`\alpha_k^s=\frac{1}{HW}\sum_{i,j}\frac{\partial s}{\partial A_{ij}^k}`}/></MathFormulaBlock>
 <Typography as="div" variant="bodySmall">梯度在空间上取平均，得到通道权重。</Typography>
 <MathFormulaBlock><MathFormulaStatic latex={String.raw`M_s=\mathrm{ReLU}\!\left(\sum_k\alpha_k^s A^k\right)`}/></MathFormulaBlock>
 <Typography as="div" variant="bodySmall">48 个通道加权求和，ReLU 后放大到原图；这里只示出 3 个通道。</Typography>
 <Typography as="div" variant="bodySmall" tone="muted">LFW：{record?.trainingSamples??480} 张训练／{record?.validationSamples??120} 张验证。分类 {record?.classificationEpochs??60} 轮，复制后用三元组微调 {record?.tripletEpochs??20} 轮。分类验证准确率 {record?`${(record.classificationValidationAccuracy*100).toFixed(1)}%`:'读取中'}。两张热图分别归一化，颜色不代表模型性能。</Typography>
 <Typography as="div" variant="bodySmall" tone="accent"><a href="https://arxiv.org/abs/1610.02391" target="_blank" rel="noreferrer">Grad-CAM 原论文</a> · <a href="https://arxiv.org/abs/1709.01507" target="_blank" rel="noreferrer">SE 原论文</a></Typography>
 </div></ExplainPanelButton></div>
 <Typography variant="bodySmall" tone="muted">不同通道提供不同响应；当前得分决定怎样加权。</Typography>
 <div className="vfl-cam-mode"><Typography variant="bodySmall" tone="muted">左侧解释</Typography>{(['classification','triplet'] as Mode[]).map(m=><Button key={m} active={mode===m} aria-pressed={mode===m} onClick={()=>setMode(m)}>{modeNames[m]}</Button>)}</div>
 <div className="vfl-cam-flow">
 <div className="vfl-cam-step-head"><Typography variant="body" tone="accent">① 多通道特征</Typography><Typography variant="bodySmall" tone="muted">示出其中 3 个通道</Typography></div><div/><div className="vfl-cam-step-head"><Typography variant="body" tone="accent">② 梯度赋权</Typography><Typography variant="bodySmall" tone="muted">当前得分的梯度</Typography></div><div/><div className="vfl-cam-step-head"><Typography variant="body" tone="accent">③ 加权热图</Typography><Typography variant="bodySmall" tone="muted">合并通道的贡献</Typography></div>
 <div className="vfl-cam-stack">{result?.channels.map((channel,i)=><img key={`${mode}-${channel.index}`} src={sampleAsset(channel.image)} alt={`真实通道 ${channel.index} 的特征响应`} style={{left:`${i*18}px`,top:`${(2-i)*18}px`,zIndex:3-i}}/>)}{!result&&<Typography variant="bodySmall" tone="muted">{error?'数据未加载，请刷新':'读取真实特征图…'}</Typography>}</div><Arrow/>
 <div className="vfl-cam-weights">{result?.channels.map(channel=><div key={channel.index}><Typography variant="bodySmall" tone="accent">通道 {channel.index}</Typography><div className="vfl-cam-weight-track"><span style={{width:`${Math.abs(channel.alpha)/maxAlpha*100}%`}}/></div></div>)}</div><Arrow/>
 <div className="vfl-cam-heat">{result&&<img src={sampleAsset(result.heat)} alt={`${modeNames[mode]}对应的真实 Grad-CAM 热图`}/>}</div>
 <div className="vfl-cam-flow-note"><Typography variant="bodySmall" tone="muted">真实特征响应</Typography></div><div/><div className="vfl-cam-flow-note"><Typography variant="bodySmall" tone="muted">条长＝相对权重</Typography></div><div/><div className="vfl-cam-flow-note"><Typography variant="bodySmall" tone="muted">暖色＝较强正向支持</Typography></div>
 </div>
 <MathFormulaBlock className="vfl-cam-simple-formula"><MathFormulaStatic latex={String.raw`M=\mathrm{ReLU}(\sum\nolimits_k\alpha_k A^k)`}/></MathFormulaBlock>
 <div className="vfl-cam-se"><Typography variant="body" tone="accent">共同直觉：通道的作用不必一样。</Typography><Typography variant="bodySmall" tone="muted">Grad-CAM 用梯度解释；SE 在网络中学习通道加权。</Typography></div>
 </section>
 <section className="vfl-cam-results">
 <Typography variant="h3" tone="accent">同一张照片，两种判断依据</Typography>
 <div className="vfl-cam-samples"><Typography variant="bodySmall" tone="muted">验证照片</Typography>{names.map((name,i)=><Button key={name} active={sampleIndex===i} aria-pressed={sampleIndex===i} onClick={()=>setSampleIndex(i)}>{name}</Button>)}</div>
 <div className="vfl-cam-comparison">{(['classification','triplet'] as Mode[]).map(m=><div className={`vfl-cam-result result-${m}`} key={m}><div className="vfl-cam-result-label"><Typography variant="body" tone="accent">{m==='classification'?'分类训练':'三元组训练'}</Typography></div><Typography variant="bodySmall" tone="muted">{m==='classification'?`解释“${names[sampleIndex]}”得分`:'解释与参照脸的相似度'}</Typography><div className="vfl-cam-overlay">{sample&&<><img src={sampleAsset(sample.input)} alt={`${sample.name}的验证原图`}/><img className="vfl-cam-overlay-color" style={{opacity}} src={sampleAsset(sample[m].overlay)} alt={`${m==='classification'?'分类训练模型':'三元组训练模型'}的真实 Grad-CAM 叠加图`}/></>}</div></div>)}</div>
 <div className="vfl-cam-reference">{sample&&<img src={sampleAsset(sample.reference)} alt="计算相似度时固定的同人参照照片"/>}<Typography variant="bodySmall" tone="muted">右图的参照：同一人的另一张照片</Typography></div>
 <RangeControl label="热图叠加" min={0} max={1} step={.05} value={opacity} formatValue={v=>Number(v)===0?'原图':`${Math.round(Number(v)*100)}%`} onChange={e=>setOpacity(Number(e.currentTarget.value))}/>
 <div className="vfl-cam-limit"><Typography variant="bodySmall" tone="accent">看热区的位置，不比较谁“更正确”。</Typography><Typography variant="bodySmall" tone="muted">粗略解释；热图不能证明模型性能。</Typography></div>
 </section></div></ContentBlock>;
}
