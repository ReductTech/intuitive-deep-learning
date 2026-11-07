import {Typography} from '../../shared/react';
import {PilotStage} from '../components/PilotStage';
import {imageUrl} from '../components/Stage';
import './PilotMethodPage.css';
export function Page(){return <PilotStage title="NAIPv2 的核心思路" subtitle="训练时学习相对质量，推理时保持单篇打分" className="naipv2-method-refined"><div className="naipv2-method-layout"><div className="naipv2-imgbox"><img src={imageUrl('pilot/5-1.svg')} alt="原报告方法总图：自回归逐步生成，NAIPv1单篇回归，NAIPv2成对训练与单篇推理"/></div><div className="naipv2-method-captions">{['自回归：逐步生成','NAIPv1：单篇回归','NAIPv2：成对训练','NAIPv2：单篇推理'].map((label,i)=><Typography key={label} variant="bodySmall" tone={i<2?'accent':'success'} align="center">{label}</Typography>)}</div></div></PilotStage>}
