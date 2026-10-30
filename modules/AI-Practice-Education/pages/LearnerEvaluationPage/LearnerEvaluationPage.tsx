import { OutlinePlaceholder } from '../../components/OutlinePlaceholder';
import outline from '../../outlines.json';
export function LearnerEvaluationPage() { return <OutlinePlaceholder title={outline.pages[30].title} lead={"用解释、代码与实验分析观察学习表现"} points={[["概念理解", "能否说明方法、条件与关键关系。"], ["代码实现", "能否完成运行、检查与修正。"], ["实验分析", "能否根据结果解释差异并提出下一步。"]]} references={[]} />; }
