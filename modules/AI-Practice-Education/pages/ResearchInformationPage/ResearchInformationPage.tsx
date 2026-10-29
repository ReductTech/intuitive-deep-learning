import { OutlinePlaceholder } from '../../components/OutlinePlaceholder';
import outline from '../../outlines.json';
export function ResearchInformationPage() { return <OutlinePlaceholder title={outline.pages[4].title} lead={"新论文出现得很快，可靠的判断信号却需要时间积累"} points={[["与目标相关", "围绕兴趣、任务和研究方向确定阅读范围。"], ["新论文信号有限", "引用、复现与长期使用反馈尚未充分形成。"], ["阅读仍需判断", "结合问题、方法与证据选择值得深入的工作。"]]} references={[]} />; }
