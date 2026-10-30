import { OutlinePlaceholder } from '../../components/OutlinePlaceholder';
import outline from '../../outlines.json';
export function LearnerEvaluationPage() { return <OutlinePlaceholder title={outline.pages[31].title} lead={"以三篇论文作品与现场表现，观察五方面能力"} points={[["选文与理解", "看选文依据、三篇关系及问题、方法和实验解释的准确性。"], ["表达与实践", "看同学是否看懂、交互是否有效、项目能否运行及修正。"], ["判断与创新", "比较方法和适用边界，通过现场追问观察独立判断与新问题。"]]} references={[]} />; }
