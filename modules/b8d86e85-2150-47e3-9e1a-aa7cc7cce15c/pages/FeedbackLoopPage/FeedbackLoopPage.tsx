import { OutlinePlaceholder } from '../../components/OutlinePlaceholder';
import outline from '../../outlines.json';
export function FeedbackLoopPage() { return <OutlinePlaceholder title={outline.pages.find(page => page.id === '8cf558d0-cdc3-4c30-92a4-909c2d556b40')!.title} lead={"把原文、作品和修改过程连接为可追溯的学习证据"} points={[["学生作品档案", "围绕所选方向，汇集三篇论文、网页、代码及修改记录。"], ["同伴试学与教师追问", "实际使用网页，追问方法依据、交互含义和条件变化。"], ["反馈进入下一版", "结合回答与前后版本安排指导，持续观察兴趣和能力。"]]} references={[]} />; }
