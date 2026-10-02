import {useEffect,useRef,useState} from 'react';
import {Button,ContentBlock,ExplainPanelButton,MathFormulaBlock,MathFormulaStatic,RangeControl,Typography,moduleAssetUrl} from '../../../shared/react';
import {digitTrainingArchitecture,readDigitTraining,startDigitTraining,type FeatureProjection} from '../../services/digitNetworkTraining';
import {digitColors,FeatureScatter} from './FeatureScatter';
import './TrainingFeatureTsnePage.css';

const recordUrl=moduleAssetUrl('80396753-7fc8-4f55-9188-bddbdb828169','digit-tsne/training-record.json');
const emptyPoints:number[][]=[];
function wait(signal:AbortSignal){return new Promise<void>((resolve,reject)=>{const stop=()=>{clearTimeout(timer);reject(new DOMException('Aborted','AbortError'));};const timer=setTimeout(()=>{signal.removeEventListener('abort',stop);resolve();},750);signal.addEventListener('abort',stop,{once:true});});}

export function TrainingFeatureTsnePage(){
 const [record,setRecord]=useState<FeatureProjection|null>(null),[data,setData]=useState<FeatureProjection|null>(null),[index,setIndex]=useState(0),[selected,setSelected]=useState<number|null>(null),[playing,setPlaying]=useState(false),[training,setTraining]=useState(false),[source,setSource]=useState<'ready'|'live'|'replay'>('ready'),[message,setMessage]=useState(''),[error,setError]=useState('');
 const controller=useRef<AbortController|null>(null),available=useRef(0);available.current=data?.frames.length??0;
 useEffect(()=>{const load=new AbortController();fetch(recordUrl,{signal:load.signal}).then(r=>{if(!r.ok)throw new Error('训练记录读取失败');return r.json();}).then((value:FeatureProjection)=>{setRecord(value);if(!controller.current)setData(value);}).catch(e=>{if(!load.signal.aborted)setError(String(e));});return()=>{load.abort();controller.current?.abort();};},[]);
 useEffect(()=>{if(!playing)return;const timer=setTimeout(()=>{if(index<available.current-1)setIndex(i=>i+1);else if(!training)setPlaying(false);},1750);return()=>clearTimeout(timer);},[playing,index,training]);
 const extent=Math.max(46,...(data?.frames.flatMap(f=>f.points.flatMap(p=>p.map(Math.abs)))??[]));
 const current=data?.frames[index],baseline=data?.frames[0],sample=data?.samples.find(s=>s.id===selected);
 async function train(){
  controller.current?.abort();const abort=new AbortController();controller.current=abort;
  setSource('live');setTraining(true);setPlaying(false);setError('');setMessage('正在准备网络与固定验证样本…');setIndex(0);setSelected(null);setData(null);
  try{
   let initialized=false;
   let job=await startDigitTraining(digitTrainingArchitecture(),10,abort.signal,true);
   while(true){
    setMessage(job.message);
    const projection=job.projection??job.result?.projection;
    if(projection){setData(projection);if(!initialized){setPlaying(true);initialized=true;}}
    if(job.status==='error')throw new Error(job.error||'训练失败');
    if(job.status==='complete'){if(!projection)throw new Error('训练结束，但未收到特征投影。');setMessage('训练完成');break;}
    await wait(abort.signal);job=await readDigitTraining(job.job_id,abort.signal);
   }
  }catch(e){if(!abort.signal.aborted){setError(e instanceof TypeError?'计算服务未连接。可重试，或点击「播放训练记录」。':e instanceof Error?e.message:String(e));setPlaying(false);}}
  finally{if(!abort.signal.aborted)setTraining(false);}
 }
 function replay(){if(!record)return;setData(record);setIndex(0);setSelected(null);setSource('replay');setPlaying(true);setError('');setMessage('');}
 return <ContentBlock className="vfl-tsne-page" headingLevel={1} title="t-SNE：训练怎样改变特征分布？" subtitle="同一批数字、同一组颜色，观察训练每一轮怎样改变特征的邻近关系。">
 <div className="vfl-tsne-body">
  <div className="vfl-tsne-controls">
   <Button variant="primary" onClick={train} disabled={training||playing}>{training?'正在训练…':'开始训练'}</Button>
   <Button onClick={replay} disabled={training||playing||!record}>播放训练记录</Button>
   {(playing||index>0)&&<Button onClick={()=>{if(index===(data?.frames.length??0)-1){setIndex(0);setPlaying(true);}else setPlaying(v=>!v);}} disabled={!data}>{playing?'暂停播放':index===(data?.frames.length??0)-1?'重播':'继续播放'}</Button>}
   <Typography className="vfl-tsne-status" variant="bodySmall" wrap="truncate" tone="muted" aria-live="polite">{source==='replay'?'默认网络 · 真实训练记录回放':source==='live'?error?'训练中断':training?message:'现场训练':'固定 300 张验证数字 · 0–9'}</Typography>
   <RangeControl label="轮次" min={0} max={Math.max(1,(data?.frames.length??1)-1)} step={1} value={index} formatValue={v=>String(data?.frames[Number(v)]?.epoch??0)} onChange={e=>{setPlaying(false);if(source==='ready')setSource('replay');setIndex(Number(e.currentTarget.value));}} disabled={training||!data}/>
  </div>
  <div className="vfl-tsne-main">
   <div className="vfl-tsne-comparison">
    <section className="vfl-tsne-plot"><div className="vfl-tsne-plot-head"><Typography variant="h3" tone="inherit">训练前</Typography><Typography variant="bodySmall" tone="inherit">第 0 轮</Typography></div><FeatureScatter title="训练前的特征投影" extent={extent} points={baseline?.points??emptyPoints} samples={data?.samples??[]} selected={selected} onSelect={setSelected}/></section>
    <section className="vfl-tsne-plot"><div className="vfl-tsne-plot-head"><Typography variant="h3" tone="inherit">{index===0?'等待训练':index===(data?.frames.length??0)-1&&!training&&!playing?'训练后的特征':'训练中的特征'}</Typography><Typography variant="bodySmall" tone="inherit">第 {current?.epoch??0} 轮{current?.val_accuracy!==undefined?` · 验证 ${(current.val_accuracy*100).toFixed(1)}%`:''}</Typography></div><FeatureScatter title="逐轮更新的特征投影" extent={extent} points={current?.points??emptyPoints} samples={data?.samples??[]} selected={selected} onSelect={setSelected} animate/></section>
   </div>
   <aside className="vfl-tsne-reading">
    <section className="vfl-tsne-intro"><div className="vfl-tsne-explain-head"><Typography variant="h3" tone="accent">t-SNE 是什么？</Typography><ExplainPanelButton label="查看 t-SNE 的计算方法"><div className="vfl-tsne-calculation">
     <Typography as="div" variant="h3" tone="accent">怎样把高维特征放到二维？</Typography>
     <Typography as="div" variant="bodySmall">① 高维中，用特征距离计算邻近概率；再对称化。</Typography>
     <MathFormulaBlock><MathFormulaStatic latex={String.raw`p_{j|i}=\frac{e^{-\|x_i-x_j\|^2/(2\sigma_i^2)}}{\sum_{k\ne i}e^{-\|x_i-x_k\|^2/(2\sigma_i^2)}},\quad p_{ij}=\frac{p_{j|i}+p_{i|j}}{2N}`}/></MathFormulaBlock>
     <Typography as="div" variant="bodySmall">② 二维中，用 Student t 分布计算邻近概率。</Typography>
     <MathFormulaBlock><MathFormulaStatic latex={String.raw`q_{ij}=\frac{(1+\|y_i-y_j\|^2)^{-1}}{\sum_{k\ne l}(1+\|y_k-y_l\|^2)^{-1}}`}/></MathFormulaBlock>
     <Typography as="div" variant="bodySmall">③ 移动二维点，使两组邻近概率尽量一致。</Typography>
     <MathFormulaBlock><MathFormulaStatic latex={String.raw`\min_{\{y_i\}}\mathrm{KL}(P\|Q)=\sum_{i\ne j}p_{ij}\log\frac{p_{ij}}{q_{ij}}`}/></MathFormulaBlock>
     <Typography as="div" variant="bodySmall" tone="muted">x 是网络特征，y 是二维位置。标签不参与计算。σ 由困惑度设定（本例 30），迭代 650 次，固定随机种子。跨轮对齐方向与尺度；过渡动画不是训练轨迹。簇间距离与大小不能直接比较。</Typography>
     <Typography as="div" variant="bodySmall" tone="accent"><a href="https://www.jmlr.org/papers/v9/vandermaaten08a.html" target="_blank" rel="noreferrer">原始论文</a></Typography>
    </div></ExplainPanelButton></div><Typography variant="bodySmall">尽量保留高维特征的局部邻近。</Typography></section>
    <section className="vfl-tsne-how"><Typography variant="h3" tone="accent">这张图怎么看？</Typography><Typography variant="bodySmall">点＝图像；颜色＝数字类别。<br/>观察同色点的聚集与混杂。</Typography></section>
    <section className="vfl-tsne-limit"><Typography variant="h3" tone="warning">注意：二维会失真</Typography><Typography variant="bodySmall">二维距离可能失真。<br/>结果受初始化、参数影响。</Typography></section>
    <div className="vfl-tsne-sample">{sample?<><img src={sample.image} alt={`所选原图：数字 ${sample.label}`}/><div><Typography variant="bodySmall" tone="accent">数字 {sample.label} · 样本 {sample.id+1}</Typography><Typography variant="bodySmall" tone="muted">两张图中已同步标记</Typography></div></>:<Typography variant="bodySmall" tone="muted">点击散点，查看对应原图</Typography>}</div>
   </aside>
  </div>
  <div className="vfl-tsne-legend" aria-label="数字类别颜色">{digitColors.map((color,digit)=><div key={digit}><span style={{background:color}}/><Typography as="span" variant="bodySmall" tone="accent">{digit}</Typography></div>)}<Typography variant="bodySmall" tone="muted">每类 30 张 · 相同样本始终对应</Typography></div>
  <div className="vfl-tsne-footer"><Typography variant="bodySmall" tone={error?'danger':'accent'}>{error||'t-SNE 是观察工具，二维分离不能单独证明可分性；分类性能仍要看验证集。'}</Typography></div>
 </div></ContentBlock>;
}
