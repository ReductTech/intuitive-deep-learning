import { OutlinePlaceholder } from '../../components/OutlinePlaceholder';
import outline from '../../outlines.json';
export function KnowledgeStructurePage() { return <OutlinePlaceholder title={outline.pages[33].title} lead={"从读懂单篇论文，走向理解一个研究方向"} points={[["共同问题与必要基础", "说明三篇论文解决什么问题，以及需要哪些先修知识。"], ["关键贡献与方法联系", "用关系图或对照演示，讲清继承、差异和适用条件。"], ["方向认识与后续问题", "串联三篇工作的研究脉络，提出下一步值得探索的问题。"]]} references={[]} />; }
