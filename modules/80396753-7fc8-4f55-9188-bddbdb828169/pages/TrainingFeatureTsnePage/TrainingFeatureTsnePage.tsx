import {useEffect,useRef,useState} from 'react';
import { Button, ContentBlock, ExplainPanelButton, MathFormulaBlock, MathFormulaStatic, RangeControl, Select, Typography } from "@shuku/course-style/react";
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
 return <ContentBlock shuku-edit-id="e-0768b23b-5cb2-4286-bf6a-e729f383f8eb" className="vfl-tsne-page" headingLevel={1} title="训练怎样改变特征分布？" subtitle="改变学习率与批大小，对照真实训练指标和同一批数字的特征分布。">
 <div shuku-edit-id="e-79b4aa26-22b3-4121-bf60-344d04b3453b" className="vfl-tsne-body">
  <div shuku-edit-id="e-124579ce-75b4-40df-b417-4a0329fb4288" className="vfl-tsne-controls">
   <div shuku-edit-id="e-241f9fbe-7142-42fe-84d8-06c4b02a2e56" className="vfl-tsne-control-title"><span shuku-edit-id="e-dd3be740-e9a7-40cc-b5d8-ac48d6248b9d" className="vfl-tsne-icon-tile"><TrainingIcon kind="settings"/></span><Typography shuku-edit-id="e-30fd3485-69ae-4c2a-abf2-62479a3bb6ac" variant="bodySmall" tone="accent">训练参数</Typography></div>
   <Select label="学习率" value={learningRate} options={tsneLearningRates.map(value=>({value:String(value),label:<Typography shuku-edit-id="e-70de11c8-130c-4c68-a5ff-acb103643e6d" as="span" variant="bodySmall">{value}</Typography>}))} onChange={setLearningRate}/>
   <Select label="批大小" value={batchSize} options={tsneBatchSizes.map(value=>({value:String(value),label:<Typography shuku-edit-id="e-53ef66da-2128-482b-8fe6-0572ac621c19" as="span" variant="bodySmall">{value} 张 / 批</Typography>}))} onChange={setBatchSize}/>
   <Button variant="primary" disabled={loading||(!data&&!error)} onClick={()=>{if(error){setRetry(value=>value+1);return;}setStarted(true);if(index===(data?.frames.length??0)-1)setIndex(0);setPlaying(value=>!value);}}><TrainingIcon kind={playing?'pause':'play'}/><Typography shuku-edit-id="e-8a163e2d-e111-448b-9bc5-1d4ba4dac4cc" as="span" variant="bodySmall" tone="inherit">{error?'重试读取':playing?'暂停回放':index===15?'重新回放':started?'继续回放':'播放缓存'}</Typography></Button>
  </div>
  <div shuku-edit-id="e-49bd9fcd-43f0-47e7-9c68-ab044ed40e33" className="vfl-tsne-main">
   <div shuku-edit-id="e-83a050b1-2ca6-4374-9111-f60ec17d9632" className="vfl-tsne-metrics"><MetricChart frames={data?.frames??emptyFrames} index={index}/></div>
   <section shuku-edit-id="e-9731d794-63c0-40b0-9c31-c593f12b7078" className="vfl-tsne-plot"><div shuku-edit-id="e-17c5f0a7-59ec-4e0d-b1e9-fe12ef57d563" className="vfl-tsne-plot-head"><div shuku-edit-id="e-43e0a393-a4c4-4dad-837d-7802c50dc6d9" className="vfl-tsne-panel-title"><span shuku-edit-id="e-410c1388-5949-4aba-918e-b9eb41ff8647" className="vfl-tsne-icon-tile"><TrainingIcon kind="features"/></span><Typography shuku-edit-id="e-71cd08fb-30ee-4c78-8d49-8c37f2fbbc97" variant="h3" tone="accent">{index===0?'训练前的特征':'训练中的特征'}</Typography></div><RangeControl controlClassName="vfl-tsne-progress" label={null} aria-label="训练进度" min={0} max={15} step={1} value={index} formatValue={value=>'第 '+value+' / 15 轮'} onChange={e=>{setPlaying(false);setIndex(Number(e.currentTarget.value));}} disabled={loading||!data||!started}/><ExplainPanelButton label="查看 t-SNE 的计算方法"><div shuku-edit-id="e-0a00fbd6-e097-441d-bcc3-d5a54b9ae1a2" className="vfl-tsne-calculation">
     <Typography shuku-edit-id="e-22eccffc-e60d-4d5f-905e-c43bf3bf899c" as="div" variant="h3" tone="accent">t-SNE 保留邻近关系</Typography>
     <Typography shuku-edit-id="e-b7659e5e-94b3-478f-b3bd-0e75f113c0fb" as="div" variant="bodySmall">① 在高维特征中，找出彼此相近的样本。</Typography>
     <Typography shuku-edit-id="e-bc246684-0428-44c9-be86-1f4b0926dbdb" as="div" variant="bodySmall">② 调整二维点的位置，尽量保留这些邻近关系。</Typography>
     <MathFormulaBlock><MathFormulaStatic latex={String.raw`\min_{\{y_i\}}\mathrm{KL}(P\|Q)=\sum_{i\ne j}p_{ij}\log\frac{p_{ij}}{q_{ij}}`}/></MathFormulaBlock>
     <Typography shuku-edit-id="e-58d17dc4-5ab4-43ec-9108-c67981cb0e1d" as="div" variant="bodySmall" tone="muted">P 表示高维中的邻近概率，Q 表示二维中的邻近概率。移动二维点，让两者尽量一致。</Typography>
     <Typography shuku-edit-id="e-64bf62e9-3750-4492-b2e0-d60d794e1487" as="div" variant="bodySmall" tone="muted">数字标签只用于着色，不参与投影。簇间距离和大小不能直接比较。</Typography>
    </div></ExplainPanelButton></div><FeatureScatter title="逐轮变化的固定验证样本特征" extent={extent} points={current?.points??emptyPoints} samples={data?.samples??[]} selected={selected} onSelect={setSelected} animate/>
    <div shuku-edit-id="e-8b48140a-8c51-4f12-b7ba-d6934ff8b2fe" className="vfl-tsne-legend" aria-label="数字类别颜色">{digitColors.map((color,digit)=><div shuku-edit-id="e-5ac7faca-5db2-435d-9fb7-3ffb42ad221c" key={digit}><span shuku-edit-id="e-8d7fc496-59d3-4afe-bb96-69dc81a23f71" style={{background:color}}/><Typography shuku-edit-id="e-074c8479-99b4-44cf-99d8-ddb9fcb9108a" as="span" variant="bodySmall" tone="accent">{digit}</Typography></div>)}</div>
    <div shuku-edit-id="e-5f2ae096-d993-489d-91f4-c016c4045088" className="vfl-tsne-sample">{sample?<><img shuku-edit-id="e-01a92726-17b0-42cc-b2b3-42c45df7ce05" src={sample.image} alt={'数字 '+sample.label}/><Typography shuku-edit-id="e-e5e55192-4ba8-4297-a49d-2f90b6eb09f9" variant="bodySmall" tone="accent">数字 {sample.label} · 固定验证样本 {sample.id+1}</Typography></>:<><TrainingIcon kind="pointer"/><Typography shuku-edit-id="e-7bf0513b-d73c-48dc-b301-ee949865bdea" variant="bodySmall" tone="muted">点击散点，查看对应的数字原图</Typography></>}</div>
   </section>

  </div>
  {error&&<Typography shuku-edit-id="e-d7e52131-6d01-4a20-8d76-7c937dc3a826" variant="bodySmall" tone="danger">{error}</Typography>}
 </div></ContentBlock>;
}
