import { OutlinePlaceholder } from '../../components/OutlinePlaceholder';
import outline from '../../outlines.json';
export function MultimodalGenerationPage() { return <OutlinePlaceholder title={outline.pages.find(page => page.id === '7417b501-e77f-4e98-9493-de9f83e475ae')!.title} lead={"根据知识关系组织文字、图像、动画与交互"} points={[["文字与图像", "明确概念与条件，呈现对象及结构。"], ["动画与交互", "展开变化过程，支持预测和检验。"], ["渐进式内容", "从直观现象进入过程，再联系专业表达。"]]} references={[]} />; }
