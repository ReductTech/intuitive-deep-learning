import { OutlinePlaceholder } from '../../components/OutlinePlaceholder';
import outline from '../../outlines.json';
export function CodePracticePage() { return <OutlinePlaceholder title={outline.pages[16].title} lead={"阅读、修改、运行代码，再解释实际结果"} points={[["理解关键代码", "把卷积操作与已学计算过程对应。"], ["修改并重新执行", "改变参数或补全代码，观察输出与错误。"], ["检查实现", "解释关键选择，核对程序和预期是否一致。"]]} references={[]} />; }
