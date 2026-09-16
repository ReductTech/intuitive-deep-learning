import { LessonFooter } from '../../shared/react';

const videos = [
  {
    title: '机器学习调参：五分钟了解网格搜索、随机搜索核心逻辑',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=114940018951243&bvid=BV1zphwzPEsM&cid=31359241098&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="机器学习调参：五分钟了解网格搜索、随机搜索核心逻辑"></iframe>',
  },
  {
    title: '9.1 模型调参【斯坦福21秋季：实用机器学习中文版】',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=719715597&bvid=BV1vQ4y1e7LF&cid=456716618&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>',
  },
  {
    title: '10分钟带你学会深度学习模型调参，让你的模型性能达到极致',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=1205789832&bvid=BV1Ef421Q7zU&cid=1593743387&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>',
  },
  {
    title: '17分钟学会贝叶斯超参数调优——HYPEROPT包的使用 机器学习',
    embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=113950599418130&bvid=BV1m2PCeNEP7&cid=28226880043&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>',
  },
];

export function HyperparameterLessonFooter() {
  return (
    <LessonFooter
      className="hp-block"
      title="本节学习完成"
      description="你已经知道哪些训练规则需要提前选择，也能用网格搜索或随机搜索比较不同方案。"
      back={{ href: '../CourseMap/', label: '返回课程主页' }}
      videos={videos}
    />
  );
}
