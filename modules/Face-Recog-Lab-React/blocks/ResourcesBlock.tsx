import { LessonFooter } from '../../shared/react';

const videos = [
  {
    title: '人脸识别：你的脸是如何被识别出来的？',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=877347877&bvid=BV1UN4y1h71g&cid=1367812704&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>',
  },
  {
    title: '人脸识别技术怎么认识你的脸？骗过它到底有多难？',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=1851090836&bvid=BV1mW421A7Wx&cid=1452558883&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>',
  },
  {
    title: '【无痛线代】特征值究竟体现了矩阵的什么特征？',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=1051678242&bvid=BV1TH4y1L7PV&cid=1463935475&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>',
  },
  {
    title: '五分钟，让你对点积的理解超越 90% 的人？',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=115396141192561&bvid=BV1TWWhzrEKv&cid=33192938223&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>',
  },
];

export function ResourcesBlock() {
  return (
    <LessonFooter
      className="face-recog-react-footer"
      title="继续你的学习旅程"
      description="你可以返回课程目录，或继续观看与本节人脸识别主题相关的视频。"
      back={{ href: 'http://127.0.0.1:59411/CourseMap/', label: '返回课程目录' }}
      videos={videos}
      videosLabel="延伸观看"
    />
  );
}
