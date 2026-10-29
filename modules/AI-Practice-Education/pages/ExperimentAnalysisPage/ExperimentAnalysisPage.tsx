import { OutlinePlaceholder } from '../../components/OutlinePlaceholder';
import outline from '../../outlines.json';
export function ExperimentAnalysisPage() { return <OutlinePlaceholder title={outline.pages[30].title} lead={"保留基线，改变一个因素，解释结果差异"} points={[["提出预测", "固定输入与权重，预测步长变化的影响。"], ["运行对照", "记录参数、输出和异常情况。"], ["分析证据", "比较实际结果与预测，修正解释。"]]} references={[]} />; }
