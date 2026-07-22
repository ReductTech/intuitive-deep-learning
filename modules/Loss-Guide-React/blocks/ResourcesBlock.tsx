import { ContentBlock } from '../../shared/react/layout/ContentBlock';
import { RelatedVideos } from '../../shared/react/learning/RelatedVideos';

const videos = [
  { title: '8 分钟理解损失函数的本质', embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&bvid=BV1GHS1BzE6J&p=1" scrolling="no" frameborder="no" allowfullscreen title="理解损失函数"></iframe>' },
  { title: '线性回归、代价函数与损失函数动画讲解', embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&bvid=BV1RL411T7mT&p=1" scrolling="no" frameborder="no" allowfullscreen title="损失函数动画讲解"></iframe>' },
];

export function ResourcesBlock() {
  return <ContentBlock className="lg-react-block" title="推荐资源" subtitle="继续观看与当前主题直接相关的视频，巩固刚才完成的学习内容。"><RelatedVideos title="推荐视频" videos={videos} /><nav className="edu-resource-actions" aria-label="学习导航"><a className="edu-btn" href="../CourseMap/">返回课程目录</a><a className="edu-btn edu-btn--primary" href="../Gradient-Descent-Module/">学习下一个</a></nav></ContentBlock>;
}
