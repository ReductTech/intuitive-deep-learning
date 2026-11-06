import { OutlinePlaceholder } from '../../components/OutlinePlaceholder';
import outline from '../../outlines.json';
export function StudentOutcomesPage() { return <OutlinePlaceholder title={outline.pages[35].title} lead={"线上报名与论文学习 → 线下考核 → 等待结果"} points={[["线上报名与论文学习", "用Paper Skill制作并深度修改论文网页，按要求提交项目与复盘链接。"], ["线下机试、运动测试、面试", "以往多用PPT汇报学习成果；本次多数同学用论文网页讲解与答问。"], ["等待结果与进一步培养", "等待考核结果；作品与答问为后续导师交流和科研指导提供材料。"]]} references={[["Paper Skill 项目与提交说明", "https://github.com/ReductTech/PaperSkill"], ["论文网页检索与复盘入口", "https://reducttech.github.io/PaperSkill/#search"]]} />; }
