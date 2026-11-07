import {Typography} from '../../shared/react';
import {PilotStage,PT,PH} from '../components/PilotStage';
import {imageUrl} from '../components/Stage';
import './PilotDatasetPage.css';
export function Page(){return <PilotStage title="NAIDv2：面向质量估计的去偏数据集" subtitle="联合处理语义分组、评分尺度与评审置信度" className="naipv2-dataset-refined"><div className="naipv2-dataset-layout"><div className="naipv2-dataset-stats">{[['OpenReview','ICLR 2021—2025'],['24,276 篇','投稿论文及结构化内容'],['按时间划分','2025 年作为测试集']].map(([value,note])=><section key={value}><PH>{value}</PH><PT small muted>{note}</PT></section>)}</div><div className="naipv2-imgbox"><img src={imageUrl('pilot/7-1.svg')} alt="原报告NAIDv2构建流程：题目摘要、Qwen向量、层次聚类、评分置信度概率建模、带RTS标签的数据集"/></div><Typography variant="bodySmall" tone="muted" align="center">语义分组与概率建模，共同形成 RTS 标签。</Typography></div></PilotStage>}
