import { LessonFooter } from '../../shared/react';
const videos = [
  { title: '李沐：语义分割', embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&bvid=BV1BK4y1M7Rd&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="李沐：语义分割"></iframe>' },
  { title: '李沐：语义分割数据集', embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&bvid=BV1BK4y1M7Rd&p=2" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="李沐：语义分割数据集"></iframe>' },
  { title: '李沐：转置卷积', embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&bvid=BV17o4y1X7Jn&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="李沐：转置卷积"></iframe>' },
  { title: '李沐：全卷积网络 FCN', embed: '<iframe src="//player.bilibili.com/player.html?isOutside=true&bvid=BV1af4y1L7Zu&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" title="李沐：全卷积网络 FCN"></iframe>' },
];
export function PixelVisionLessonFooter() {
  return <LessonFooter className="pvm-footer" title="你已经能把整图特征恢复成逐像素类别" description={<>语义分割使用与输入同尺寸的类别标签图；同步几何变换保护像素对应；转置卷积负责可学习上采样；FCN 用骨干、1×1 卷积和转置卷积完成端到端像素预测。<span className="pvm-source-links">对应阅读：<a href="https://zh-v2.d2l.ai/chapter_computer-vision/semantic-segmentation-and-dataset.html" target="_blank" rel="noreferrer">语义分割</a> · <a href="https://zh-v2.d2l.ai/chapter_computer-vision/transposed-conv.html" target="_blank" rel="noreferrer">转置卷积</a> · <a href="https://zh-v2.d2l.ai/chapter_computer-vision/fcn.html" target="_blank" rel="noreferrer">FCN</a></span></>} back={{ href: '/modules/detection-models', label: '上一课：检测数据与模型' }} next={{ href: '/modules/vision-style-competitions', label: '下一课：风格迁移与竞赛实战' }} videos={videos} videosLabel="延伸观看 · D2L 配套课程" />;
}
