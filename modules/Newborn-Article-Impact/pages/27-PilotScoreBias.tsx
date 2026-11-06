import {PilotStage,PT,PH} from '../components/PilotStage';
import {imageUrl} from '../components/Stage';
import './PilotScoreBiasPage.css';
export function Page(){return <PilotStage title="为什么直接回归审稿分数不够稳？" subtitle="评分尺度和评审置信度，都会影响监督信号" className="naipv2-bias-refined"><div className="naipv2-bias-columns">{[['评分尺度不一致','同一分数，在不同领域和年份未必可比。','4-1.jpg'],['置信度被忽略','低置信与高置信评分等权，容易放大噪声。','4-2.jpg']].map(([title,text,image])=><figure key={image}><PH>{title}</PH><div className="naipv2-imgbox"><img src={imageUrl('pilot/'+image)} alt={title+'：原报告示意图'}/></div><PT>{text}</PT></figure>)}</div></PilotStage>}
