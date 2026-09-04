import { LessonFooter } from '../../shared/react';

const videos = [
  {
    title: '【漫士】为什么刷题想得越多，考得反而越差？',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=113763801896048&bvid=BV1D362YpEGL&cid=27679981764&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="【漫士】为什么刷题想得越多，考得反而越差？"></iframe>',
  },
  {
    title: '直观解释：为什么噪声不是过拟合的原因?又什么只要没有过拟合就一定有噪声?',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=979544838&bvid=BV1a44y1M7qx&cid=541735811&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>',
  },
  {
    title: '欠拟合与过拟合，模型成长中的 “学不透” 与 “学太死”',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=114896482074656&bvid=BV1x7gHz2Ev3&cid=31207001586&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>',
  },
  {
    title: 'L1正则化为什么会让参数稀疏',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=116408629402237&bvid=BV1udQ7B8Eyb&cid=37529780330&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>',
  },
  {
    title: '过拟合克星——正则化',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=116740130346699&bvid=BV1DHJ76SEmj&cid=39076890809&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>',
  },
  {
    title: '如何解决过拟合问题？L1、L2正则化及Dropout正则化讲解',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=770444004&bvid=BV18r4y1M71J&cid=760424160&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>',
  },
];

export function FittingLessonFooter() {
  return (
    <LessonFooter
      className="fit-block"
      title="本节学习完成"
      description="你已经理解如何识别过拟合，以及权重正则和 Dropout 如何帮助模型提升泛化能力。"
      back={{ href: '../CourseMap/', label: '返回课程主页' }}
      videos={videos}
    />
  );
}
