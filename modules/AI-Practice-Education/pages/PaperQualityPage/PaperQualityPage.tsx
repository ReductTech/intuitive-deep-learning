import { OutlinePlaceholder } from '../../components/OutlinePlaceholder';
import outline from '../../outlines.json';
export function PaperQualityPage() { return <OutlinePlaceholder title={outline.pages[5].title} lead={"用论文内容与研究方法，补充早期筛选所需的判断依据"} points={[["影响力预测", "NAIPv1：从题目与摘要研究新论文的潜在影响力。"], ["质量估计", "NAIPv2：通过去偏成对学习研究论文质量信号。"], ["个性化选择", "结合个人研究目标筛选候选，再回到原文判断。"]]} references={[["Zhao et al. AAAI 2025", "https://ojs.aaai.org/index.php/AAAI/article/view/32106"], ["Zhao et al. NAIPv2", "https://arxiv.org/abs/2509.25179"]]} />; }
