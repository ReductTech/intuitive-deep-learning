import {useEffect,useRef,useState} from 'react';
import {Button,ContentBlock,ExplainPanelButton,MathFormulaBlock,MathFormulaStatic,RangeControl,Select,Typography} from '../../../shared/react';
import {loadTsneRecord,tsneLearningRates,tsneBatchSizes,type TsneRecord} from '../../services/digitTsneRecord';
import {digitColors,FeatureScatter} from './FeatureScatter';
import {MetricChart} from './MetricChart';
import {TrainingIcon} from './TrainingIcon';
import './TrainingFeatureTsnePage.css';

const emptyPoints:number[][]=[],emptyFrames:TsneRecord['frames']=[];
export function TrainingFeatureTsnePage(){
 const [learningRate,setLearningRate]=useState('0.002'),[batchSize,setBatchSize]=useState('128'),[data,setData]=useState<TsneRecord|null>(null),[index,setIndex]=useState(0),[selected,setSelected]=useState<number|null>(null),[playing,setPlaying]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const [started,setStarted]=useState(false);
 const selection=useRef(0);
 const [retry,setRetry]=useState(0);
 useEffect(()=>{
  const abort=new AbortController(),revision=++selection.current;
  setStarted(false);setLoading(true);setError('');setPlaying(false);setData(null);setIndex(0);setSelected(null);
  loadTsneRecord(Number(learningRate),Number(batchSize),abort.signal).then(record=>{if(!abort.signal.aborted&&revision===selection.current)setData(record);}).catch(e=>{if(!abort.signal.aborted)setError(e instanceof Error?e.message:String(e));}).finally(()=>{if(!abort.signal.aborted)setLoading(false);});
  return()=>abort.abort();
 },[learningRate,batchSize,retry]);
 useEffect(()=>{if(!playing||!data)return;const timer=setTimeout(()=>{if(index<data.frames.length-1)setIndex(i=>i+1);else setPlaying(false);},1750);return()=>clearTimeout(timer);},[playing,index,data]);
 const extent=Math.max(46,...(data?.frames.flatMap(frame=>frame.points.flatMap(point=>point.map(Math.abs)))??[]));
 const current=data?.frames[index],sample=data?.samples.find(sample=>sample.id===selected);
 return <ContentBlock className="vfl-tsne-page" headingLevel={1} title="训练怎样改变特征分布？" subtitle="改变学习率与批大小，对照真实训练指标和同一批数字的特征分布。">
 <div className="vfl-tsne-body">
  <div className="vfl-tsne-controls">
   <div className="vfl-tsne-control-title"><span className="vfl-tsne-icon-tile"><TrainingIcon kind="settings"/></span><Typography variant="bodySmall" tone="accent">训练参数</Typography></div>
   <Select label="学习率" value={learningRate} options={tsneLearningRates.map(value=>({value:String(value),label:<Typography as="span" variant="bodySmall">{value}</Typography>}))} onChange={setLearningRate}/>
   <Select label="批大小" value={batchSize} options={tsneBatchSizes.map(value=>({value:String(value),label:<Typography as="span" variant="bodySmall">{value} 张 / 批</Typography>}))} onChange={setBatchSize}/>
   <Button variant="primary" disabled={loading||(!data&&!error)} onClick={()=>{if(error){setRetry(value=>value+1);return;}setStarted(true);if(index===(data?.frames.length??0)-1)setIndex(0);setPlaying(value=>!value);}}><TrainingIcon kind={playing?'pause':'play'}/><Typography as="span" variant="bodySmall" tone="inherit">{error?'重试读取':playing?'暂停训练':index===15?'重新训练':started?'继续训练':'开始训练'}</Typography></Button>
  </div>
  <div className="vfl-tsne-main">
   <div className="vfl-tsne-metrics"><MetricChart frames={data?.frames??emptyFrames} index={index}/></div>
   <section className="vfl-tsne-plot"><div className="vfl-tsne-plot-head"><div className="vfl-tsne-panel-title"><span className="vfl-tsne-icon-tile"><TrainingIcon kind="features"/></span><Typography variant="h3" tone="accent">{index===0?'训练前的特征':'训练中的特征'}</Typography></div><RangeControl controlClassName="vfl-tsne-progress" label={null} aria-label="训练进度" min={0} max={15} step={1} value={index} formatValue={value=>'第 '+value+' / 15 轮'} onChange={e=>{setPlaying(false);setIndex(Number(e.currentTarget.value));}} disabled={loading||!data||!started}/><ExplainPanelButton label="查看 t-SNE 的计算方法"><div className="vfl-tsne-calculation">
     <Typography as="div" variant="h3" tone="accent">t-SNE 保留邻近关系</Typography>
     <Typography as="div" variant="bodySmall">① 在高维特征中，找出彼此相近的样本。</Typography>
     <Typography as="div" variant="bodySmall">② 调整二维点的位置，尽量保留这些邻近关系。</Typography>
     <MathFormulaBlock><MathFormulaStatic latex={String.raw`\min_{\{y_i\}}\mathrm{KL}(P\|Q)=\sum_{i\ne j}p_{ij}\log\frac{p_{ij}}{q_{ij}}`}/></MathFormulaBlock>
     <Typography as="div" variant="bodySmall" tone="muted">P 表示高维中的邻近概率，Q 表示二维中的邻近概率。移动二维点，让两者尽量一致。</Typography>
     <Typography as="div" variant="bodySmall" tone="muted">数字标签只用于着色，不参与投影。簇间距离和大小不能直接比较。</Typography>
    </div></ExplainPanelButton></div><FeatureScatter title="逐轮变化的固定验证样本特征" extent={extent} points={current?.points??emptyPoints} samples={data?.samples??[]} selected={selected} onSelect={setSelected} animate/>
    <div className="vfl-tsne-legend" aria-label="数字类别颜色">{digitColors.map((color,digit)=><div key={digit}><span style={{background:color}}/><Typography as="span" variant="bodySmall" tone="accent">{digit}</Typography></div>)}</div>
    <div className="vfl-tsne-sample">{sample?<><img src={sample.image} alt={'数字 '+sample.label}/><Typography variant="bodySmall" tone="accent">数字 {sample.label} · 固定验证样本 {sample.id+1}</Typography></>:<><TrainingIcon kind="pointer"/><Typography variant="bodySmall" tone="muted">点击散点，查看对应的数字原图</Typography></>}</div>
   </section>

  </div>
  {error&&<Typography variant="bodySmall" tone="danger">{error}</Typography>}
 </div></ContentBlock>;
}
