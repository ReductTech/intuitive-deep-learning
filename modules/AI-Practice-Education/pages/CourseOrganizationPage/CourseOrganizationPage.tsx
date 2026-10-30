import { OutlinePlaceholder } from '../../components/OutlinePlaceholder';
import outline from '../../outlines.json';
export function CourseOrganizationPage() { return <OutlinePlaceholder title={outline.pages[34].title} lead={"一个学生 · 一个方向 · 三篇论文 · 三个交互式学习网页"} points={[["选文与深读", "在教师指导下选定方向和三篇重点论文，梳理方法与联系。"], ["生成与导演", "借助Paper Skill生成初稿；学生核对内容、重组讲解并完善交互。"], ["展示、修改与提交", "让同学试学并讲明白；修订可运行项目，按README提交并获取发布链接。"]]} references={[["Paper Skill 项目与提交说明", "https://github.com/ReductTech/PaperSkill"], ["论文网页检索与复盘入口", "https://reducttech.github.io/PaperSkill/#search"]]} />; }
