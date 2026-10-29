import { OutlinePlaceholder } from '../../components/OutlinePlaceholder';
import outline from '../../outlines.json';
export function PlatformScalePage() { return <OutlinePlaceholder title={outline.pages[37].title} lead="使用规模与高校开课情况均待后台核实" points={[["学生规模","补充统计日期、实际使用人数及活跃口径。"],["高校与课程","分别统计开课教师、高校、985高校和实际课程。"],["对外展示","不将示例数字、访问量或 ZeroGPU 运行次数当作学生人数。"]]} references={[]} />; }
