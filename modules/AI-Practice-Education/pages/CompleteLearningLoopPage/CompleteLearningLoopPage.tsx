import { OutlinePlaceholder } from '../../components/OutlinePlaceholder';
import outline from '../../outlines.json';
export function CompleteLearningLoopPage() { return <OutlinePlaceholder title={outline.pages[30].title} lead={"每位学生选一个方向，把三篇论文做成别人能看懂的交互网页"} points={[["选方向、深读三篇论文", "梳理问题、方法与相互联系，建立方向认识。"], ["借助AI生成，自己导演内容", "用Paper Skill制作初稿，重新组织讲解，核对内容并完善交互。"], ["讲给同学听，根据反馈改", "通过展示、追问与修订，让他人看懂，也让自己学明白。"]]} references={[["Paper Skill 项目与提交说明", "https://github.com/ReductTech/PaperSkill"]]} />; }
