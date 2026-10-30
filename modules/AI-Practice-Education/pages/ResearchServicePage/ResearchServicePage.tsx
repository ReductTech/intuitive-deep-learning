import { useEffect, useRef, useState } from 'react';
import { Button, ContentBlock, TextInput, Typography, moduleAssetUrl } from '../../../shared/react';
import outline from '../../outlines.json';
import './ResearchServicePage.css';

const SERVICE_URL='https://huggingface.co/spaces/ssocean/Newborn_Article_Impact_Predict';
// Project-owner supplied Analytics snapshot, independent of simulated scoring below.
const PUBLISHED_RUNS=14857;
// Titles from the public service; abstracts below are Chinese summaries.
// Scores are fixed presentation fixtures, not cached model predictions.
const examples=[
 {label:'MeanFlow',title:'Mean Flows for One-step Generative Modeling',abstract:'研究单步生成建模，以平均速度描述流场，并建立它与瞬时速度的联系来指导训练。提出的 MeanFlow 无需预训练或蒸馏，可从头训练，在单次模型计算下生成图像，探索缩小单步与多步生成方法之间的差距。',score:86.3},
 {label:'SARDet-100K',title:'SARDet-100K: Towards Open-Source Benchmark and ToolKit for Large-Scale SAR Object Detection',abstract:'面向合成孔径雷达目标检测，整合十个已有数据集，构建大规模、多类别开放基准。针对自然图像预训练与雷达图像之间的差异，提出多阶段预训练与滤波增强方法，改善模型迁移与检测表现。',score:81.6},
 {label:'藏文图像超分',title:'Enhanced ZSSR for Super-resolution Reconstruction of the Historical Tibetan Document Images',abstract:'针对历史藏文文献图像保存和成像质量较差的问题，改进零样本超分辨率网络。借助多层次特征重建图像并减轻振铃伪影，无需成对训练数据，在有限计算成本下改善文献图像的清晰度。',score:72.4},
];
const normalized=(text:string)=>text.normalize('NFKC').trim().replace(/\s+/g,' ');
function fixedScore(title:string,abstract:string){
 const key=normalized(title)+'\n'+normalized(abstract);
 const example=examples.find(item=>normalized(item.title)+'\n'+normalized(item.abstract)===key);
 if(example)return example.score;
 let hash=2166136261;
 for(const character of key){hash=Math.imul(hash^character.codePointAt(0)!,16777619);}
 return Number((55+((hash>>>0)%380)/10).toFixed(1));
}

export function ResearchServicePage(){
 const [exampleIndex,setExampleIndex]=useState<number|null>(0);
 const [title,setTitle]=useState(examples[0].title);
 const [abstract,setAbstract]=useState(examples[0].abstract);
 const [score,setScore]=useState<number|null>(examples[0].score);
 const [running,setRunning]=useState(false);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>()=>{if(timer.current!==null)clearTimeout(timer.current);},[]);
 const valid=title.trim().length>=3&&abstract.trim().length>=20;
 function cancel(){if(timer.current!==null)clearTimeout(timer.current);timer.current=null;setRunning(false);}
 function loadExample(index:number){cancel();setExampleIndex(index);setTitle(examples[index].title);setAbstract(examples[index].abstract);setScore(examples[index].score);}
 function clear(){cancel();setTitle('');setAbstract('');setScore(null);setExampleIndex(null);}
 function predict(){
  if(!valid||running)return;
  setRunning(true);
  timer.current=setTimeout(()=>{
   setScore(fixedScore(title,abstract));
   setRunning(false);timer.current=null;
  },400);
 }
 return <ContentBlock className="aipe-service-page" headingLevel={1} title={outline.pages[7].title}
  subtitle="输入题目与摘要，体验论文影响力预测与质量估计" bodyClassName="aipe-service-body">
  <section className="aipe-service-demo" aria-label="论文评价前端模拟演示">
   <header className="aipe-service-demo-head"><Typography as="h2" variant="h3" tone="accent">论文质量评价</Typography></header>
   <div className="aipe-service-form-layout">
    <div className="aipe-service-inputs">
     <div className="aipe-service-examples" aria-label="论文示例">{examples.map((example,index)=><Button key={example.label} active={index===exampleIndex} disabled={running} onClick={()=>loadExample(index)}>{example.label}</Button>)}</div>
     <TextInput multiline label="论文题目" aria-label="论文题目" value={title} disabled={running} rows={2} className="aipe-service-title-input ui-typography ui-typography--bodySmall" data-ppt-viewport="可编辑的完整论文题目" placeholder="输入论文题目" onChange={event=>{setTitle(event.target.value);setScore(null);setExampleIndex(null);}}/>
     <TextInput multiline label="摘要（示例为中文概述）" aria-label="论文摘要" value={abstract} disabled={running} rows={4} className="aipe-service-abstract ui-typography ui-typography--bodySmall" data-ppt-viewport="可编辑与滚动阅读的论文摘要" placeholder="输入论文摘要" onChange={event=>{setAbstract(event.target.value);setScore(null);setExampleIndex(null);}}/>
     <div className="aipe-service-actions"><Button variant="primary" loading={running} disabled={!valid} onClick={predict}>{running?'评价中…':'查看评分'}</Button><Button onClick={clear}>清空</Button></div>
     {!valid&&<Typography as="p" variant="bodySmall" tone="muted" role="status">请填写题目及至少 20 字的摘要</Typography>}
    </div>
    <div className="aipe-service-results" aria-live="polite" aria-busy={running}>
     <Typography as="h3" variant="h3" tone="accent" align="center">质量参考评分</Typography>
     <div className="aipe-service-score-dial"><svg viewBox="0 0 300 300" aria-hidden="true"><circle cx="150" cy="150" r="126" fill="none" stroke="#e9f0f8" strokeWidth="14"/><circle cx="150" cy="150" r="126" fill="none" stroke="var(--ui-accent-alt)" strokeWidth="14" strokeLinecap="round" pathLength="100" strokeDasharray={`${score??0} 100`} transform="rotate(-90 150 150)"/></svg><div><Typography as="p" variant="display" tone="accent" data-score="quality">{score===null?'—':score.toFixed(1)}</Typography><Typography as="p" variant="bodySmall" tone="muted">/ 100</Typography></div></div>
     <Typography as="p" variant="bodySmall" tone="muted" align="center">选择示例，或修改论文内容<br/>查看对应的参考评分</Typography>
     <Typography as="p" variant="bodySmall" tone="muted" align="center" className="aipe-service-score-note">演示数据 · 同一输入评分固定</Typography>
    </div>
   </div>
  </section>
  <aside className="aipe-service-promotion" aria-label="服务使用规模与体验入口">
   <div className="aipe-service-usage"><Typography as="h2" variant="h3" tone="accent">累计运行</Typography><Typography as="p" variant="display" tone="inherit" className="aipe-service-run-count">{PUBLISHED_RUNS.toLocaleString('en-US')}<Typography as="span" variant="body" tone="accent"> 次</Typography></Typography><Typography as="p" variant="bodySmall" tone="muted">ZeroGPU runs · 项目统计</Typography></div>
   <div className="aipe-service-qr-area"><Typography as="h3" variant="h3" tone="accent">扫码体验在线服务</Typography><img src={moduleAssetUrl(outline.moduleIdentity.id,'images/naip-service-qr.svg')} width="256" height="256" alt="论文影响力与质量估计在线服务二维码"/><Button href={SERVICE_URL} target="_blank" rel="noreferrer">打开真实服务 ↗</Button></div>
  </aside>
 </ContentBlock>;
}
