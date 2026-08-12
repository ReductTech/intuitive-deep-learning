import { LessonFooter } from '../../shared/react';

const videos = [
  {
    title: '三分钟动画讲解：多层感知机 MLP',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&bvid=BV1yuhezAEUh&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="多层感知机动画讲解"></iframe>',
  },
  {
    title: '多层感知机模型：从感知机到激活函数与反向传播',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&bvid=BV1xP4y1M7xm&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="多层感知机模型课程"></iframe>',
  },
  {
    title: '用 PyTorch 与 NumPy 手写 MLP 完成 MNIST 分类',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&bvid=BV1s5NEzWEXT&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="MLP 实作与 MNIST 分类"></iframe>',
  },
  {
    title: '多层感知器：权重运算与实现思路',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&bvid=BV1bV411f7oG&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="多层感知器讲解"></iframe>',
  },
];

export function ResourcesBlock() {
  return (
    <LessonFooter
      className="mlp-react-block"
      title="继续你的学习旅程"
      description="你可以返回课程目录，或在准备好后继续前往下一步。"
      back={{
        href: 'http://127.0.0.1:59411/CourseMap/',
        label: '返回课程目录',
      }}
      next={{
        href: '/modules/loss-guide-2-react',
        label: '学习下一课',
      }}
      videos={videos}
      videosLabel="延伸观看"
    />
  );
}
