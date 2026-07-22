import { LessonFooter } from '../../shared/react/learning/LessonFooter';

const videos = [
  { title: '“损失函数”是如何设计出来的？直观理解最小二乘法和极大似然估计法', embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=758940884&bvid=BV1Y64y1Q7hi&cid=361568602&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="损失函数与最小二乘法"></iframe>' },
  { title: '8 分钟理解损失函数的本质', embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=115644930463746&bvid=BV1GHS1BzE6J&cid=34424164218&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="理解损失函数"></iframe>' },
  { title: '6 分钟理解机器学习中的损失函数', embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=513994584&bvid=BV1vg411172u&cid=789260398&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="机器学习损失函数"></iframe>' },
  { title: '线性回归、代价函数与损失函数动画讲解', embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=464296500&bvid=BV1RL411T7mT&cid=444320268&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="线性回归损失函数"></iframe>' },
];

export function ResourcesBlock() {
  return <LessonFooter className="lg-react-block" title="继续你的学习旅程" description="你可以返回课程目录，或在准备好后继续前往下一步。" back={{ href: '../CourseMap/', label: '返回课程目录' }} next={{ href: '../Gradient-Descent-Module/', label: '学习下一课' }} videos={videos} />;
}
