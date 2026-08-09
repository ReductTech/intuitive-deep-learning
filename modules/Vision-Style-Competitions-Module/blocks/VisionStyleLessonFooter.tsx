import { LessonFooter } from '../../shared/react';

const videos = [
  { title: '李沐：样式迁移', embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&bvid=BV1Eh41167GN&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="李沐：样式迁移"></iframe>' },
  { title: '李沐：样式迁移代码', embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&bvid=BV1Eh41167GN&p=2" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="李沐：样式迁移代码"></iframe>' },
  { title: '李沐：Kaggle CIFAR-10', embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&bvid=BV1Gy4y1M7Cu" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="李沐：Kaggle CIFAR-10"></iframe>' },
  { title: '李沐：Kaggle Dogs', embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&bvid=BV1j5411T7wx" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="李沐：Kaggle Dogs"></iframe>' },
];

export function VisionStyleLessonFooter() {
  return <LessonFooter className="vsc-footer" title="计算机视觉章节完成" description={<>你已经理解风格迁移的三类损失与 Gram 表示，也能在竞赛中正确划分数据职责、选择训练策略并生成最终提交。<span className="vsc-source-links">对应阅读：<a href="https://zh-v2.d2l.ai/chapter_computer-vision/neural-style.html" target="_blank" rel="noreferrer">神经风格迁移</a> · <a href="https://zh-v2.d2l.ai/chapter_computer-vision/kaggle-cifar10.html" target="_blank" rel="noreferrer">CIFAR-10</a> · <a href="https://zh-v2.d2l.ai/chapter_computer-vision/kaggle-dog.html" target="_blank" rel="noreferrer">Dogs</a></span></>} back={{ href: '/modules/pixel-vision', label: '上一课：像素级视觉' }} next={{ href: 'https://zh-v2.d2l.ai/chapter_computer-vision/index.html', label: '回到 D2L 计算机视觉目录' }} videos={videos} videosLabel="延伸观看 · D2L 配套课程" />;
}
