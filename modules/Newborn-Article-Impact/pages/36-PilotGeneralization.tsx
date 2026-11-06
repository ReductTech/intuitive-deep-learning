import {PilotStage,PT} from '../components/PilotStage';
import {imageUrl} from '../components/Stage';
export function Page(){return <PilotStage className="naipv2-generalization" title="从 ICLR 到 NeurIPS：跨会议泛化案例" subtitle="比较模型预测分数与论文决策层级的关系"><div className="naipv2-imgbox" style={{height:'100%'}}><img src={imageUrl('pilot/13-1.png')} alt="原报告跨会议泛化研究图：不同录用层级的平均分数，以及录用与拒稿论文的排序分布"/></div><PT small>模型在 ICLR 数据上训练，在 NeurIPS 上观察排序结构。群体趋势不等于单篇论文的质量结论。</PT></PilotStage>}
