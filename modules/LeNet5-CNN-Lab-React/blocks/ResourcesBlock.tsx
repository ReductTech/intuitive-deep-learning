import { LessonFooter } from '../../shared/react';

const videos = [
  {
    title: '23 经典卷积神经网络 LeNet【动手学深度学习v2】',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=973192378&bvid=BV1t44y1r7ct&cid=342424736&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="23 经典卷积神经网络 LeNet"></iframe>',
  },
  {
    title: '从零实现一个卷积神经网络，Lenet5网络详解',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=113301069499498&bvid=BV1Gc26YtEfU&cid=26278494406&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="从零实现一个卷积神经网络，Lenet5网络详解"></iframe>',
  },
  {
    title: '卷积神经网络的底层是傅里叶变换，傅里叶变换的底层是希尔伯特空间坐标变换',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=646155903&bvid=BV1ce4y1p7jF&cid=857682970&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="卷积神经网络与傅里叶变换"></iframe>',
  },
  {
    title: '1.1 卷积神经网络基础',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=91530734&bvid=BV1b7411T7DA&cid=156293999&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="卷积神经网络基础"></iframe>',
  },
];

export function ResourcesBlock() {
  return (
    <LessonFooter
      className="lenet-react-footer"
      title="继续你的学习旅程"
      description="你可以返回课程目录，或在准备好后继续前往下一步。"
      back={{ href: 'http://127.0.0.1:59411/CourseMap/', label: '返回课程目录' }}
      next={{ href: '/modules/face-recog-lab-react', label: '学习下一课' }}
      videos={videos}
      videosLabel="延伸观看"
    />
  );
}
