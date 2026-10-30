import {Typography} from '../../shared/react';
import {RefinedStage} from '../components/RefinedStage';
import './EthicsPage.css';
export function Page(){return <RefinedStage title="使用边界与伦理提醒" subtitle="让预测辅助阅读，保留研究判断" className="naipeth-page"><div className="naipeth-principles">{[['题目与摘要必须如实反映研究','不要虚构尚未实现的成果，也不要夸大方法的重要性来提高预测分数。'],['分数是预测，不是最终结论','训练数据、历史引用分布与模型误差都会影响结果，需要结合论文内容和领域判断。'],['保留人的判断与责任','用于辅助发现文献，避免仅凭一个分数决定论文取舍、人员评价或资源分配。']].map(([title,body])=><section key={title}><Typography variant="h3" tone="danger">{title}</Typography><Typography variant="body">{body}</Typography></section>)}</div></RefinedStage>}
