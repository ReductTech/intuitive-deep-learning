import {useState} from 'react';
import {Button,Typography} from '../../shared/react';
import './PilotInteractions.css';
import {PilotStage,PT,Table} from '../components/PilotStage';
const rows=[['下界','随机','.514','.410','.527','.525','.002'],['上界','信息泄漏','.819','.757','.894','.995','.984'],['API','ChatGPT · 单篇','.644','.427','.654','.702','.315'],['API','ChatGPT · 成对','.658','.448','.655','.686','.297'],['API','AgentReview · Gemini','.424','.424','—','—','.097'],['API','AI Scientist · Gemini','.614','.481','—','—','.120'],['自回归','SEA-EA（7B）','.582','.563','—','—','—'],['自回归','CycleReviewer（8B）','.678','.559','—','—','.279'],['自回归','CycleReviewer（70B）','.678','.574','—','—','.267'],['自回归','DeepReview（14B）','.689','.623','—','—','.405'],['回归','NAIPv1（8B）','.545','.472','.605','.629','.183'],['回归','NAIPv2（8B）','.706','.609','.782','.771','.432']];
const metrics=['Acc','F1','AUC','NDCG','Spearman ρ'];
export function Page(){
 const [view,setView]=useState<'table'|'compare'>('table');
 const [metric,setMetric]=useState(4);
 const column=metric+2;
 const ranked=rows.slice(2).filter(r=>r[column]!=='—').slice().sort((a,b)=>Number(b[column])-Number(a[column]));
 return <PilotStage title="主结果：NAIPv2 同时兼顾性能与效率" className="naipv2-results naipv2-results-interactive">
  <div className="naipi-toolbar"><div className="naipv2-tabs"><Button active={view==='table'} aria-pressed={view==='table'} onClick={()=>setView('table')}>全部数据</Button><Button active={view==='compare'} aria-pressed={view==='compare'} onClick={()=>setView('compare')}>按指标比较</Button></div>{view==='compare'&&<div className="naipv2-tabs" aria-label="比较指标">{metrics.map((m,i)=><Button key={m} active={metric===i} aria-pressed={metric===i} onClick={()=>setMetric(i)}>{m}</Button>)}</div>}</div>
  {view==='table'?<Table headers={['类别','方法','Acc ↑','F1 ↑','AUC ↑','NDCG ↑','ρ ↑']} rows={rows} widths={['10%','30%','12%','12%','12%','12%','12%']} highlight={11}/>:<div className="naipi-ranking" aria-label={metrics[metric]+'，从高到低排序'} aria-live="polite"><div className="naipi-ranking-heading"><PT small>方法</PT><PT small>{metrics[metric]} ↑ · 长度范围 0–1</PT><PT small>结果</PT></div>{ranked.map(r=><div className={'naipi-ranking-row'+(r[1]==='NAIPv2（8B）'?' is-best':'')} key={r[1]}><Typography variant="bodySmall">{r[1]}</Typography><div className="naipi-track"><span style={{width:Number(r[column])*100+'%'}}/></div><Typography variant="bodySmall" tone={r[1]==='NAIPv2（8B）'?'success':'main'}>{Number(r[column]).toFixed(3)}</Typography></div>)}</div>}
  <div aria-live="polite"><PT small muted>{view==='table'?'源报告实验：ρ 为 Spearman 排序相关系数；“—”表示未报告。信息泄漏行仅作上界对照。':`${metrics[metric]}：随机下界 ${Number(rows[0][column]).toFixed(3)}；信息泄漏上界 ${Number(rows[1][column]).toFixed(3)}。未报告值不参与排序。仅比较预测性能，效率见下一页。`}</PT></div>
 </PilotStage>;
}
