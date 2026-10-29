import { OutlinePlaceholder } from '../../components/OutlinePlaceholder';
import outline from '../../outlines.json';
export function ResearchExtensionPage() { return <OutlinePlaceholder title={outline.pages[18].title} lead={"由当前方法的局限，引出进一步阅读与实验"} points={[["提出新问题", "怎样扩大观察范围，并控制参数数量？"], ["比较相关方法", "从标准卷积进入空洞卷积。"], ["选择拓展路径", "连接论文、代码与视频，继续验证想法。"]]} references={[["Yu & Koltun. Dilated Convolutions", "https://arxiv.org/abs/1511.07122"]]} />; }
