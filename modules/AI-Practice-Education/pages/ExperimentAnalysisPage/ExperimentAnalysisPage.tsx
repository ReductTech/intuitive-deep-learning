import { OutlinePlaceholder } from '../../components/OutlinePlaceholder';
import outline from '../../outlines.json';
export function ExperimentAnalysisPage() { return <OutlinePlaceholder title={outline.pages[29].title} lead={"用计算验证解释，用同伴试学发现理解缺口"} points={[["提出预测并验证", "固定比较条件，运行代码或交互实验，检查结果是否支持论文讲解。"], ["请同学实际试学", "记录难懂的概念、无效的交互与仍未回答的问题。"], ["回到原文修订", "核对公式与结论，改进讲解、动画和交互，再次检验。"]]} references={[]} />; }
