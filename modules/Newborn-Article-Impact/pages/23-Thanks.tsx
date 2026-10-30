import {Button,Typography} from '../../shared/react';
import {imageUrl} from '../components/Stage';
import {RefinedStage} from '../components/RefinedStage';
import './ThanksPage.css';
const resources=[['s23-5.png','论文原文','https://arxiv.org/abs/2408.03934'],['s23-4.png','知乎详解','https://zhuanlan.zhihu.com/p/9630622286'],['s23-3.png','小红书讨论区','http://xhslink.com/a/Amd07J4Rv0b3'],['s23-2.png','代码仓库','https://github.com/ssocean/NAIP'],['s23-1.png','免费体验','https://huggingface.co/spaces/ssocean/Newborn_Article_Impact_Predict']];
export function Page(){return <RefinedStage title="感谢聆听" subtitle="NAIPv1 资源与延伸 · 下一部分：NAIPv2" className="naipthanks-page"><div className="naipthanks-layout"><div className="naipthanks-main"><div className="naipthanks-resources">{resources.map(([name,label,url])=><figure key={name}><img src={imageUrl(name)} alt={label+'二维码'}/><Button href={url} target="_blank" rel="noreferrer">{label}</Button></figure>)}</div><div className="naipthanks-art"><img src={imageUrl('background-23.jpg')} alt="原报告中的科研与文献主题插画"/></div></div><Typography variant="bodySmall" tone="muted">报告人：赵鹏海　｜　联系邮箱：zhaopenghai@mail.nankai.edu.cn</Typography></div></RefinedStage>}
