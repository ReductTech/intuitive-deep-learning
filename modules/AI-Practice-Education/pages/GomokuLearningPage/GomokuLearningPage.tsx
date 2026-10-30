import { OutlinePlaceholder } from '../../components/OutlinePlaceholder';
import outline from '../../outlines.json';
export function GomokuLearningPage() { return <OutlinePlaceholder title={outline.pages[30].title} lead={"观察棋形、数字编码与局部匹配，逐步进入卷积"} points={[["先观察与预测", "判断局部棋形可能在哪里出现。"], ["再编码与匹配", "把棋盘变成数字，用窗口寻找模式。"], ["联系卷积概念", "解释局部计算、重复扫描与权重共享。"]]} references={[]} />; }
