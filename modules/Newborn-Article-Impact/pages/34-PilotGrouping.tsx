import {useState} from 'react';
import {Button,Typography} from '../../shared/react';
import {PilotStage,PT,PH,Panel,Table} from '../components/PilotStage';
import './PilotInteractions.css';
const vectors=[["BGE-M3",'.774','.769','.417'],['Qwen3-emb','.782','.771','.432']];
const clusters=[["HDBSCAN",'.765','.803','.422'],['层次聚类','.782','.771','.432']];
const groups=[["无",'.739','.630','.400'],['发表时间','.736','.638','.392'],['关键词','.556','.620','.007'],['层次聚类','.753','.639','.401'],['时间＋层次','.782','.649','.432']];
export function Page(){
 const [metric,setMetric]=useState(0);
 const column=[1,2,3][metric];
 const best=(rows:string[][])=>rows.reduce((index,row,i)=>Number(row[column])>Number(rows[index][column])?i:index,0);
 return <PilotStage className="naipv2-grouping naipi-grouping" title="聚类与分组分析" subtitle="切换评价指标，观察最优方案是否改变">
 <div className="naipv2-tabs" aria-label="选择分组比较指标">{['AUC','NDCG','Spearman ρ'].map((m,i)=><Button key={m} active={metric===i} aria-pressed={metric===i} onClick={()=>setMetric(i)}>{m}</Button>)}<Typography variant="bodySmall" tone="muted">绿色标出当前指标的最高值所在行</Typography></div>
 <div className="naipv2-three"><Panel><PH>语义向量</PH><Table headers={['向量','AUC','NDCG','ρ']} widths={['40%','20%','20%','20%']} rows={vectors} highlight={best(vectors)}/></Panel><Panel><PH>聚类方法</PH><Table headers={['聚类','AUC','NDCG','ρ']} widths={['40%','20%','20%','20%']} rows={clusters} highlight={best(clusters)}/></Panel><Panel><PH>分组策略</PH><Table headers={['分组','AUC','P.Acc','ρ']} widths={['40%','20%','20%','20%']} rows={groups} highlight={metric===1?-1:best(groups)}/></Panel></div>
 <div className="naipi-grouping-feedback" aria-live="polite"><Typography variant="body" tone="accent">{metric===1?'HDBSCAN 的 NDCG 更高；层次聚类在 AUC 与 ρ 上更高。分组表未报告 NDCG。':metric===0?'在 AUC 上，Qwen3-emb、层次聚类和时间＋层次分组分别取得表内最高值。':'在排序相关性 ρ 上，Qwen3-emb、层次聚类和时间＋层次分组分别取得表内最高值。'}</Typography><PT small muted>聚类过细会使论文对稀疏，过粗会引入更多噪声；源报告最佳最大距离为 1.0。</PT></div>
 </PilotStage>;
}
