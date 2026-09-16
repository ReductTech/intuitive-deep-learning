import { LessonFooter } from '../../shared/react';

const videos = [
  {
    title: '【深度学习 搞笑教程】05 数据集划分：训练集 验证集 测试集 | 草履虫都能听懂 零基础入门 | 持续更新',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=654861453&bvid=BV1Ma4y1N7Eg&cid=1091138046&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="数据集划分：训练集、验证集、测试集"></iframe>',
  },
  {
    title: '【小萌五分钟】机器学习 | 数据集的划分(一): 训练集及测试集',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=285769438&bvid=BV1df4y117TT&cid=196719414&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>',
  }
];

export function DatasetLessonFooter() {
  return (
    <LessonFooter
      className="ds-block"
      title="本节学习完成"
      description="你已经理解训练集、验证集和测试集在模型开发中的分工。"
      back={{ href: '../CourseMap/', label: '返回课程主页' }}
      videos={videos}
    />
  );
}
