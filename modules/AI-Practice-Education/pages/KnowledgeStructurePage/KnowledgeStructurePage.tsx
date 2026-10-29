import { OutlinePlaceholder } from '../../components/OutlinePlaceholder';
import outline from '../../outlines.json';
export function KnowledgeStructurePage() { return <OutlinePlaceholder title={outline.pages[23].title} lead={"既看整门课程的结构，也看当前概念的依赖"} points={[["整门课程", "张量、卷积、训练与网络结构。"], ["本次任务", "编码、局部模式、滑动窗口与共享权重。"], ["学习选择", "识别需要补充的基础与可继续的方向。"]]} references={[]} />; }
